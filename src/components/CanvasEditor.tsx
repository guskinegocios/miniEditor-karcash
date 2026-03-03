import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { VehicleData, CanvasConfig, BackgroundConfig, ItemConfig, ImageAdjustments } from '../types';
import logoKarcashUrl from '../assets/logo_karcash-removebg_1.webp';
import { COLORS } from '../hooks/useKarCard';

interface CanvasEditorProps {
    state: {
        image: string | null;
        data: VehicleData;
        config: CanvasConfig;
        format: 'story' | 'poster';
        background: BackgroundConfig;
        adjustments: ImageAdjustments;
    };
    discountPercentage: number;
}

export interface CanvasEditorRef {
    downloadImage: () => void;
}

export const CanvasEditor = forwardRef<CanvasEditorRef, CanvasEditorProps>(({ state, discountPercentage }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageCache = useRef<Record<string, HTMLImageElement>>({});
    const renderInProgress = useRef(false);

    // Configuração de Layouts
    const LAYOUTS = {
        story: {
            width: 1080,
            height: 1920,
            topContent: 470,
            rightColumnTop: 470,
        },
        poster: {
            width: 1080,
            height: 1350,
            topContent: 400,
            rightColumnTop: 320,
        }
    };

    const layout = LAYOUTS[state.format] || LAYOUTS.story;

    const CANVAS_WIDTH = layout.width;
    const CANVAS_HEIGHT = layout.height;

    // Escala de visualização no navegador (ex: exibir menor na tela)
    const DISPLAY_SCALE = 0.35;

    useImperativeHandle(ref, () => ({
        downloadImage: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Criar link temporário
            const link = document.createElement('a');
            link.download = `karcash-${state.data.brand}-${state.data.model}.png`.toLowerCase().replace(/\s+/g, '-');
            link.href = canvas.toDataURL('image/png', 1.0); // Qualidade máxima
            link.click();
        }
    }));

    const getCachedImage = (src: string): HTMLImageElement | null => {
        if (imageCache.current[src]) return imageCache.current[src];

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => {
            imageCache.current[src] = img;
            triggerRender();
        };
        return null;
    };

    const triggerRender = () => {
        if (renderInProgress.current) return;
        renderInProgress.current = true;

        requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            if (!canvas) {
                renderInProgress.current = false;
                return;
            }

            const ctx = canvas.getContext('2d', { alpha: false }); // alpha false para performance se não precisar de transparência no canvas principal
            if (!ctx) {
                renderInProgress.current = false;
                return;
            }

            // 1. Limpar canvas (ou preencher com preto para evitar transparência)
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // 2. Background Template
            const bgImg = state.background.type === 'image' ? getCachedImage(state.background.value) : null;

            // Background
            if (state.background.type === 'image' && bgImg) {
                // Background Rotation support
                if (state.background.rotation === 180) {
                    ctx.save();
                    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                    ctx.rotate(Math.PI);
                    ctx.drawImage(bgImg, -CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT);
                    ctx.restore();
                } else {
                    ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                }
            } else if (state.background.type === 'solid') {
                ctx.fillStyle = state.background.value;
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            } else if (state.background.type === 'gradient' && state.background.gradient) {
                const { colors, direction } = state.background.gradient;
                const angleRad = (direction - 90) * (Math.PI / 180);
                const cx = CANVAS_WIDTH / 2;
                const cy = CANVAS_HEIGHT / 2;
                const diag = Math.sqrt(CANVAS_WIDTH ** 2 + CANVAS_HEIGHT ** 2) / 2;

                const x0 = cx + Math.cos(angleRad + Math.PI) * diag;
                const y0 = cy + Math.sin(angleRad + Math.PI) * diag;
                const x1 = cx + Math.cos(angleRad) * diag;
                const y1 = cy + Math.sin(angleRad) * diag;

                const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
                gradient.addColorStop(0, colors[0]);
                gradient.addColorStop(1, colors[1]);

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            // MÁSCARA OVERLAY (O toque premium entre o fundo e o conteúdo)
            if (state.background.overlayOpacity && state.background.overlayOpacity > 0) {
                ctx.globalAlpha = state.background.overlayOpacity;
                ctx.fillStyle = state.background.overlayColor || '#000000';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.globalAlpha = 1.0;
            }

            // 3. Imagem do Veículo
            if (state.image) {
                const userImg = getCachedImage(state.image);
                if (userImg) {
                    const scale = Math.max(CANVAS_WIDTH / userImg.width, CANVAS_HEIGHT / userImg.height) * state.config.zoom;
                    const w = userImg.width * scale;
                    const h = userImg.height * scale;

                    ctx.save();
                    // Aplicar Filtros de Ajuste
                    const adj = state.adjustments;
                    ctx.filter = `brightness(${adj.brightness + adj.exposure}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;

                    // Mover para o centro do enquadramento (Centro do Canvas + Pan)
                    ctx.translate(CANVAS_WIDTH / 2 + state.config.pan.x, CANVAS_HEIGHT / 2 + state.config.pan.y);
                    // Rotacionar
                    ctx.rotate((state.config.rotation || 0) * Math.PI / 180);
                    // Desenhar a imagem centralizada no novo ponto (0,0)
                    ctx.drawImage(userImg, -w / 2, -h / 2, w, h);
                    ctx.restore();
                }
            }

            // 4. Overlays
            drawOverlay(ctx);

            renderInProgress.current = false;
        });
    };

    // Efeito para reagir a mudanças de estado e disparar renderização síncrona/otimizada
    useEffect(() => {
        triggerRender();
    }, [state, discountPercentage]);

    const drawOverlay = (ctx: CanvasRenderingContext2D) => {
        // Cores (Brand Typology Defaults)
        const COLOR_NEON = COLORS.VERDE_LIMAO;
        const COLOR_WHITE = COLORS.BRANCO_SUAVE;
        const COLOR_BLACK = COLORS.PRETO_PROFUNDO;

        // Fontes

        // Posições (Ajustadas para o layout superior)
        const LEFT_ALIGN = 80;
        // Alinhamento à direita (base)
        const RIGHT_COLUMN_X = 1000;
        const TOP_CONTENT = layout.topContent; // Dinâmico

        // --- Esquerda: Dados do Veículo ---

        // 1. Marca (Badge Neon com texto preto)
        const marcaText = (state.data.brand || 'MARCA').toUpperCase();

        // Configuração Granular
        const { fontSize: brandSize, offsetX: brandX, offsetY: brandY } = state.config.brand;
        const brandFinalY = TOP_CONTENT + brandY;
        const brandFinalX = LEFT_ALIGN + brandX;

        const brandFont = `${state.config.brand.fontWeight || '800'} ${brandSize}px ${state.config.brand.fontFamily || 'Archivo'}, sans-serif`;
        ctx.font = brandFont;
        const marcaWidth = ctx.measureText(marcaText).width + 60; // Padding

        ctx.fillStyle = state.config.brand.color || COLOR_NEON;
        // Desenhar retângulo ajustado ao novo Y e altura da fonte
        const brandRectHeight = brandSize + 30; // Altura proporcional
        ctx.fillRect(brandFinalX, brandFinalY, marcaWidth, brandRectHeight);

        ctx.fillStyle = state.config.brand.textColor || COLOR_BLACK;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        // Centralizar texto no retângulo
        ctx.fillText(marcaText, brandFinalX + 30, brandFinalY + (brandRectHeight / 2));

        // 2. Modelo (Texto Gigante Neon)
        const modeloText = (state.data.model || 'MODELO').toUpperCase();

        // Tamanho da fonte dinâmico
        const { fontSize: modelSize, offsetX: modelX, offsetY: modelY } = state.config.model;
        const modelFont = `${state.config.model.fontWeight || '900'} ${modelSize}px ${state.config.model.fontFamily || 'Archivo'}, sans-serif`;
        ctx.font = modelFont;

        ctx.fillStyle = state.config.model.textColor || COLOR_NEON;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        // Quebrar linha se for muito longo (simples)
        const maxWidth = 550; // Metade da tela aprox
        const words = modeloText.split(' ');
        let line = '';

        let y = TOP_CONTENT + 100 + modelY;
        const finalModelX = LEFT_ALIGN + modelX;

        // Lógica básica de multiline
        const lineHeight = modelSize * 1.0; // Altura da linha proporcional

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, finalModelX, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        ctx.fillText(line, finalModelX, y);

        // Ajustar Y para os proximos elementos
        // "state.config.model.offsetY" já foi usando no 'y' inicial do loop
        // "state.config.model.offsetX" precisa ser aplicado no fillText

        // 3. Versão/Configurações (Texto Branco)
        const detailsText = state.data.detailsText || "Configurações";
        const { fontSize: detSize, offsetX: detX, offsetY: detY } = state.config.details;

        const detailsFinalY = y + 120 + detY;
        const detailsFinalX = LEFT_ALIGN + detX;

        ctx.font = `${state.config.details.fontWeight || '400'} ${detSize}px ${state.config.details.fontFamily || 'Montserrat'}, sans-serif`;
        ctx.fillStyle = state.config.details.textColor || COLOR_WHITE;

        // Suporte a Multi-linhas (quebra manual \n ou automática se implementar depois)
        const detailLines = detailsText.split('\n');
        const detailLineHeight = detSize * 1.2;

        detailLines.forEach((line, index) => {
            ctx.fillText(line, detailsFinalX, detailsFinalY + (index * detailLineHeight));
        });

        // 4. Ano (Texto Neon Pequeno)
        const anoText = (state.data.year || 'ANO');
        const { fontSize: yearSize, offsetX: yearX, offsetY: yearY } = state.config.year;

        // Ajustar posição do Ano baseado na altura real dos detalhes
        const detailsBlockHeight = detailLines.length * detailLineHeight;
        const yearFinalY = detailsFinalY + detailsBlockHeight + 40 + yearY; // 40px de gap
        const yearFinalX = LEFT_ALIGN + yearX;

        ctx.font = `${state.config.year.fontWeight || '700'} ${yearSize}px ${state.config.year.fontFamily || 'Montserrat'}, sans-serif`;
        ctx.fillStyle = state.config.year.textColor || COLOR_NEON;
        ctx.fillText(anoText, yearFinalX, yearFinalY);


        // --- Direita: Preços ---
        // Ajuste fino de posicionamento baseado no Template Story Padrão
        // Ajuste fino de posicionamento baseado no Template Story Padrão
        const RIGHT_COLUMN_TOP = layout.rightColumnTop; // Dinâmico

        const drawPriceBox = (label: string, value: number, config: ItemConfig, type: 'fipe' | 'economy') => {
            // Dimensões e Cores das Configurações
            const { width = 320, height = 100, color = (type === 'fipe' ? COLOR_WHITE : COLOR_NEON), offsetX, offsetY, fontSize, gap } = config;

            // Posição baseada no RIGHT_COLUMN_TOP + offsetY
            const boxX = (RIGHT_COLUMN_X - width) + offsetX;
            const boxY = (type === 'fipe' ? RIGHT_COLUMN_TOP : (RIGHT_COLUMN_TOP + 300)) + offsetY;

            // Desenhar Box
            ctx.fillStyle = color;
            ctx.fillRect(boxX, boxY, width, height);

            ctx.textBaseline = 'top';
            ctx.textAlign = 'right';

            // Label (ex: "TABELA FIPE:")
            const padding = 20;
            ctx.fillStyle = COLOR_BLACK;
            ctx.font = `${state.config.fipe.fontWeight || '700'} ${Math.round(fontSize)}px ${state.config.fipe.fontFamily || 'Montserrat'}, sans-serif`;
            ctx.fillText(label, boxX + width - padding, boxY + padding);

            // Valor "R$ XX.XXX,XX"
            const priceValue = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const currencySym = 'R$';

            // 1. Valor Numérico
            const valueFontSize = Math.round(fontSize * 2.8);
            ctx.font = `${state.config.fipe.fontWeight || '900'} ${valueFontSize}px ${state.config.fipe.fontFamily || 'Montserrat'}, sans-serif`;
            ctx.fillStyle = config.textColor || COLOR_BLACK;
            const valX = boxX + width - padding;
            // Centralizar verticalmente se o gap for muito pequeno, ou usar o gap
            const valY = boxY + padding + (gap || Math.round(height * 0.4));
            ctx.fillText(priceValue, valX, valY);

            // 2. Símbolo R$
            const valMetrics = ctx.measureText(priceValue);
            ctx.font = `${state.config.economy.fontWeight || '700'} ${Math.round(fontSize * 1.2)}px ${state.config.economy.fontFamily || 'Montserrat'}, sans-serif`;
            ctx.fillStyle = config.textColor || COLOR_BLACK;
            ctx.fillText(currencySym, valX - valMetrics.width - 10, valY + (valueFontSize * 0.1));
        };

        // 1. Tabela Fipe (Box Configurável)
        drawPriceBox("TABELA FIPE:", state.data.fipePrice, state.config.fipe, 'fipe');

        // 2. Preço KarCash (Sem box, gigante, Neon)
        // No modelo, o valor KarCash fica bem no meio, entre Fipe e Margem de Lucro
        // Espaçamento generoso
        // Espaçamento generoso (Reduzido proporcionalmente)
        const karcashY = RIGHT_COLUMN_TOP + 150;

        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';

        // Label "KARCASH:" (Branca, pequena)
        const { fontSize: logoSize, offsetX: logoX, offsetY: logoY } = state.config.karcashLogo;
        const logoFinalX = RIGHT_COLUMN_X + logoX;
        const logoFinalY = karcashY + logoY;

        ctx.fillStyle = state.config.karcashLogo.textColor || COLOR_WHITE;
        ctx.font = `${state.config.karcashLogo.fontWeight || '800'} ${logoSize}px ${state.config.karcashLogo.fontFamily || 'Archivo'}, sans-serif`;
        ctx.fillText("KARCASH:", logoFinalX, logoFinalY);

        // Valor Gigante Neon
        // Valor Gigante Neon
        ctx.fillStyle = state.config.price.textColor || COLOR_NEON;

        const kValue = state.data.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const kSym = 'R$';

        // Tamanho Dinâmico Configurado
        const { fontSize: priceSize, offsetX: priceX, offsetY: priceY } = state.config.price; // usando 'price' em vez de salePriceFontSize
        const finalPriceX = RIGHT_COLUMN_X + priceX;
        const finalPriceY = karcashY + 43 + priceY;

        // 1. Valor Numérico
        ctx.font = `${state.config.price.fontWeight || '900'} ${priceSize}px ${state.config.price.fontFamily || 'Montserrat'}, sans-serif`;
        ctx.fillText(kValue, finalPriceX, finalPriceY);

        // 2. Símbolo R$ (Menor e Proporcional)
        // Antes: 120px valor -> 50px R$ (aprox 0.42)
        const symFontSize = Math.round(priceSize * 0.42);

        const kMetrics = ctx.measureText(kValue);
        ctx.font = `${state.config.price.fontWeight || '700'} ${symFontSize}px ${state.config.price.fontFamily || 'Montserrat'}, sans-serif`;
        // Ajuste Y do símbolo
        const symYOffset = priceSize * 0.42;

        ctx.fillText(kSym, finalPriceX - kMetrics.width - 15, finalPriceY + symYOffset - priceSize + symFontSize); // Ajuste fino

        // 3. Margem de Lucro (Box Configurável)
        const economy = state.data.economyPrice;
        drawPriceBox("MARGEM DE LUCRO:", economy, state.config.economy, 'economy');

        // 4. Logo KarCash (Imagem)
        if (state.config.logoImage && state.config.logoImage.width) {
            const logoConfig = state.config.logoImage;
            const logoWidth = logoConfig.width || 200;
            const logoRefX = (CANVAS_WIDTH - logoWidth) / 2 + logoConfig.offsetX; // Centralizado por padrão + offset
            const logoRefY = 50 + logoConfig.offsetY; // Topo + margem + offset

            // Precisamos carregar a imagem sincrono? Não, drawOverlay é chamado dentro do loop, mas loadImage é async
            // O ideal é ter a imagem carregada. 
            // Como estamos dentro de um useEffect que chama render()... e render chama drawOverlay...
            // O `loadImage` deveria ser feito fora ou cacheado.
            // Mas para simplificar, vamos usar um objeto Image criado fora ou cacheado?
            // O `useEffect` principal já carrega a imagem do carro.
            // Vamos tentar carregar a logo direto.
            const logoImg = new Image();
            logoImg.src = logoKarcashUrl;
            // Se já tiver carregada (cache browser), desenha. Se não, na próxima renderização vai.
            if (logoImg.complete) {
                const scale = logoWidth / logoImg.naturalWidth;
                const logoHeight = logoImg.naturalHeight * scale;
                ctx.drawImage(logoImg, logoRefX, logoRefY, logoWidth, logoHeight);
            } else {
                logoImg.onload = () => {
                    // Força re-render se carregar depois
                    // Mas como estamos dentro do loop do canvas... talvez precise de um forceUpdate?
                    // O requestAnimationFrame cuidaria disso se fosse animado.
                    // Aqui é estático.
                    // Vamos deixar assim por enquanto, geralmente carrega rápido.
                    // Se falhar na primeira, o usuário interage e redesenha.
                    const scale = logoWidth / logoImg.naturalWidth;
                    const logoHeight = logoImg.naturalHeight * scale;
                    ctx.drawImage(logoImg, logoRefX, logoRefY, logoWidth, logoHeight);
                }
            }
        }
    };

    return (
        <div className="flex justify-center items-center p-4 bg-gray-900 rounded-lg shadow-2xl border border-gray-800 overflow-hidden">
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                    width: `${CANVAS_WIDTH * DISPLAY_SCALE}px`,
                    height: `${CANVAS_HEIGHT * DISPLAY_SCALE}px`,
                    maxWidth: '100%',
                    objectFit: 'contain'
                }}
                className="shadow-black drop-shadow-2xl"
            />
        </div>
    );
});
