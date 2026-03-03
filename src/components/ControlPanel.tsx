import React, { useState } from 'react';
import { PREMIUM_BACKGROUNDS, COLORS } from '../hooks/useKarCard';
import type { VehicleData, CanvasConfig, ItemConfig, BackgroundConfig, ImageAdjustments } from '../types';

interface ControlPanelProps {
    state: {
        image: string | null;
        data: VehicleData;
        config: CanvasConfig;
        format: 'story' | 'poster';
        background: BackgroundConfig;
        adjustments: ImageAdjustments;
    };
    onUpdateData: (field: any, value: any) => void;
    onUpdateConfig: (field: any, value: any) => void;
    onUpdateFormat: (format: 'story' | 'poster') => void;
    onUpdateBackground: (bg: BackgroundConfig) => void;
    onRestoreDefaults: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownload: () => void;
    isProcessing?: boolean;
    onRemoveBackground?: () => void;
    onRemoveImage?: () => void;
    onUpdateAdjustments: (adj: Partial<ImageAdjustments>) => void;
    onResetAdjustments: () => void;
}

interface ItemControlProps {
    label: string;
    config: ItemConfig;
    onChange: (key: keyof ItemConfig, value: any) => void;
    showColor?: boolean;
    showDimensions?: boolean;
}

const ItemControl = ({ label, config, onChange, showColor = false, showDimensions = false }: ItemControlProps) => {
    const handleDimensionChange = (key: 'width' | 'height', value: number) => {
        const updates: Partial<ItemConfig> = { [key]: value };

        // Lógica de "Sugestão Inteligente" de Tamanho de Fonte para Boxes de Preço
        // Se estivermos mexendo na largura/altura de um box de preço, sugerimos um novo fontSize
        if (showDimensions) {
            const currentWidth = key === 'width' ? value : (config.width || 320);
            const currentHeight = key === 'height' ? value : (config.height || 110);

            // Baselines (conforme configurado no useKarCard.ts)
            const BASE_WIDTH = 320;
            const BASE_HEIGHT = 110;
            const BASE_FONT = 22;
            const BASE_GAP = 28;

            // Calculamos o fator de escala baseado na menor proporção (pra não vazar)
            const scaleFactor = Math.min(currentWidth / BASE_WIDTH, currentHeight / BASE_HEIGHT);

            updates.fontSize = Math.round(BASE_FONT * scaleFactor);

            // Também sugerimos o gap proporcional se o campo existir
            if (config.gap !== undefined) {
                updates.gap = Math.round(BASE_GAP * scaleFactor);
            }
        }

        // Aplicar todas as mudanças (dimensão + fonte sugerida)
        Object.entries(updates).forEach(([k, v]) => onChange(k as keyof ItemConfig, v));
    };

    const fontFamilies = ['Montserrat', 'Archivo'];
    const fontWeights = [
        { label: 'Thin', value: '100' },
        { label: 'Extra Light', value: '200' },
        { label: 'Light', value: '300' },
        { label: 'Regular', value: '400' },
        { label: 'Medium', value: '500' },
        { label: 'Semi Bold', value: '600' },
        { label: 'Bold', value: '700' },
        { label: 'Extra Bold', value: '800' },
        { label: 'Black', value: '900' },
    ];

    return (
        <div className="bg-gray-800 p-3 rounded mb-3 border border-gray-700">
            <h4 className="text-neon-green font-bold text-sm mb-2 uppercase">{label}</h4>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-gray-400 text-[10px] block mb-1">Fonte: {config.fontSize}px</label>
                    <input
                        type="number"
                        value={config.fontSize}
                        onChange={(e) => onChange('fontSize', Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                    />
                </div>
                <div>
                    <label className="text-gray-400 text-[10px] block mb-1">Cor Texto</label>
                    <input
                        type="color"
                        value={config.textColor || '#ffffff'}
                        onChange={(e) => onChange('textColor', e.target.value)}
                        className="w-full h-[26px] bg-gray-900 border border-gray-600 rounded cursor-pointer"
                    />
                </div>
                {showColor && (
                    <div>
                        <label className="text-gray-400 text-[10px] block mb-1">Cor Box</label>
                        <input
                            type="color"
                            value={config.color || '#ffffff'}
                            onChange={(e) => onChange('color', e.target.value)}
                            className="w-full h-[26px] bg-gray-900 border border-gray-600 rounded cursor-pointer"
                        />
                    </div>
                )}

                {/* Brand Palette Row */}
                <div className="col-span-2">
                    <label className="text-gray-400 text-[10px] block mb-1 uppercase tracking-wider font-bold opacity-70">Atalhos (Paleta KarCash)</label>
                    <div className="flex gap-2 mt-1">
                        {[
                            { name: 'Limão', hex: '#DBFC1D' },
                            { name: 'Escuro', hex: '#071601' },
                            { name: 'Preto', hex: '#080A09' },
                            { name: 'Branco', hex: '#F7F7F7' },
                            { name: 'Musgo', hex: '#394236' }
                        ].map((c) => (
                            <button
                                key={c.hex}
                                title={c.name}
                                onClick={() => {
                                    onChange('textColor', c.hex);
                                    if (showColor) onChange('color', c.hex);
                                }}
                                className="w-6 h-6 rounded-full border border-gray-600 hover:scale-110 transition-transform shadow-sm flex items-center justify-center overflow-hidden"
                                style={{ backgroundColor: c.hex }}
                            >
                                <span className="sr-only">{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {/* Seletores de Tipografia */}
                <div className="flex flex-col">
                    <label className="text-gray-400 text-[10px] block mb-1">Família</label>
                    <select
                        value={config.fontFamily || 'Montserrat'}
                        onChange={(e) => onChange('fontFamily', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-white text-[10px] focus:outline-none focus:border-neon-green"
                    >
                        {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-gray-400 text-[10px] block mb-1">Estilo</label>
                    <select
                        value={config.fontWeight || '400'}
                        onChange={(e) => onChange('fontWeight', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-white text-[10px] focus:outline-none focus:border-neon-green"
                    >
                        {fontWeights.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                    </select>
                </div>

                {showDimensions && (
                    <>
                        <div>
                            <label className="text-gray-400 text-[10px] block mb-1">Largura: {config.width || 320}px</label>
                            <input
                                type="number"
                                value={config.width || 320}
                                onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-[10px] block mb-1">Altura: {config.height || 110}px</label>
                            <input
                                type="number"
                                value={config.height || 110}
                                onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                            />
                        </div>
                    </>
                )}
                <div>
                    <label className="text-gray-400 text-[10px] block mb-1">Eixo X: {config.offsetX}px</label>
                    <input
                        type="range" min="-500" max="500"
                        value={config.offsetX}
                        onChange={(e) => onChange('offsetX', Number(e.target.value))}
                        className="w-full accent-neon-green"
                    />
                </div>
                <div>
                    <label className="text-gray-400 text-[10px] block mb-1">Eixo Y: {config.offsetY}px</label>
                    <input
                        type="range" min="-500" max="500"
                        value={config.offsetY}
                        onChange={(e) => onChange('offsetY', Number(e.target.value))}
                        className="w-full accent-neon-green"
                    />
                </div>
                {config.gap !== undefined && (
                    <div className="col-span-2">
                        <label className="text-gray-400 text-[10px] block mb-1">Espaçamento (Gap: {config.gap}px)</label>
                        <input
                            type="range" min="0" max="200" step="1"
                            value={config.gap}
                            onChange={(e) => onChange('gap', Number(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export function ControlPanel({
    state,
    onUpdateData,
    onUpdateConfig,
    onUpdateFormat,
    onUpdateBackground,
    onRestoreDefaults,
    onImageUpload,
    onDownload,
    isProcessing = false,
    onRemoveBackground,
    onRemoveImage,
    onUpdateAdjustments,
    onResetAdjustments
}: ControlPanelProps) {
    const [activeTab, setActiveTab] = useState<'data' | 'texts' | 'prices' | 'bg'>('data');

    const tabs = [
        { id: 'data', label: 'Dados' },
        { id: 'texts', label: 'Textos' },
        { id: 'prices', label: 'Preços' },
        { id: 'bg', label: 'Fundo' },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white w-full overflow-hidden">
            <div className="p-4 bg-gray-900 border-b border-gray-800 shrink-0 z-20">
                <div className="flex justify-between items-center mb-4">
                    <img src="/logo_sec-removebg.webp" alt="Logo Secundária" className="h-10 object-contain" />
                    <button
                        onClick={onRestoreDefaults}
                        className="text-[10px] bg-red-900/30 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-900/50 transition-colors uppercase font-bold"
                    >
                        Restaurar Padrão
                    </button>
                </div>

                {/* Format Switcher */}
                <div className="bg-gray-800 p-1 rounded-lg border border-gray-700 flex mb-4">
                    <button
                        onClick={() => onUpdateFormat('story')}
                        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${state.format === 'story'
                            ? 'bg-neon-green text-white shadow-lg shadow-neon-green/20'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Story (9:16)
                    </button>
                    <button
                        onClick={() => onUpdateFormat('poster')}
                        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${state.format === 'poster'
                            ? 'bg-neon-green text-white shadow-lg shadow-neon-green/20'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Poster (4:5)
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 pb-2 text-sm font-medium ${activeTab === tab.id ? 'text-neon-green border-b-2 border-neon-green' : 'text-gray-400'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {activeTab === 'data' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Imagem</label>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 hover:border-neon-green transition-colors">
                                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                    <p className="text-xs text-gray-400">Clique para carregar foto</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                            </label>

                            {/* Botões de Ação de Imagem */}
                            <div className="flex gap-2">
                                {isProcessing ? (
                                    <div className="flex-1 bg-gray-800 border border-gray-700 text-neon-green text-[10px] font-bold uppercase py-3 rounded-lg flex items-center justify-center gap-2 animate-pulse">
                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processando IA...
                                    </div>
                                ) : state.image && (
                                    <>
                                        <button
                                            onClick={onRemoveBackground}
                                            className="flex-1 bg-neon-green/10 border border-neon-green/30 text-neon-green text-[10px] font-black uppercase py-3 rounded-lg hover:bg-neon-green hover:text-black transition-all flex items-center justify-center gap-2"
                                        >
                                            Remover Fundo ✨
                                        </button>
                                        <button
                                            onClick={onRemoveImage}
                                            className="px-4 bg-gray-800 border border-gray-700 text-gray-400 text-[10px] font-bold uppercase py-3 rounded-lg hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 transition-all flex items-center justify-center"
                                            title="Deletar Imagem"
                                        >
                                            🗑️
                                        </button>
                                    </>
                                )}
                            </div>
                            {state.image && !isProcessing && (
                                <p className="text-[9px] text-zinc-500 text-center italic">
                                    *Processamento local. A primeira vez pode demorar alguns segundos.
                                </p>
                            )}

                            {/* Zoom, Rotation & Pan Globais (Imagem) */}
                            <div className="grid grid-cols-2 gap-x-3 gap-y-4 pt-2">
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">Zoom ({state.config.zoom.toFixed(1)}x)</label>
                                    <input
                                        type="range" min="0.1" max="3" step="0.05"
                                        value={state.config.zoom}
                                        onChange={(e) => onUpdateConfig('zoom', parseFloat(e.target.value))}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">Rotação ({state.config.rotation || 0}°)</label>
                                    <input
                                        type="range" min="-180" max="180" step="1"
                                        value={state.config.rotation || 0}
                                        onChange={(e) => onUpdateConfig('rotation', parseFloat(e.target.value))}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">Posição X</label>
                                    <input
                                        type="range" min="-1000" max="1000" step="10"
                                        value={state.config.pan.x}
                                        onChange={(e) => onUpdateConfig('pan', { ...state.config.pan, x: parseFloat(e.target.value) })}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">Posição Y</label>
                                    <input
                                        type="range" min="-1000" max="1000" step="10"
                                        value={state.config.pan.y}
                                        onChange={(e) => onUpdateConfig('pan', { ...state.config.pan, y: parseFloat(e.target.value) })}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                    />
                                </div>
                            </div>

                            {/* Filtros de Ajuste da Imagem (Somente se houver imagem) */}
                            {state.image && (
                                <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50 space-y-4 shadow-inner mt-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            ✨ Ajustes da Foto
                                        </label>
                                        <button
                                            onClick={onResetAdjustments}
                                            className="text-[9px] text-neon-green hover:underline uppercase font-bold"
                                        >
                                            Resetar
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <label className="text-[9px] text-gray-500 uppercase font-bold">Brilho</label>
                                                <span className="text-[9px] text-neon-green font-mono">{state.adjustments.brightness}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="250" step="1"
                                                value={state.adjustments.brightness}
                                                onChange={(e) => onUpdateAdjustments({ brightness: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <label className="text-[9px] text-gray-500 uppercase font-bold">Contraste</label>
                                                <span className="text-[9px] text-neon-green font-mono">{state.adjustments.contrast}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="250" step="1"
                                                value={state.adjustments.contrast}
                                                onChange={(e) => onUpdateAdjustments({ contrast: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <label className="text-[9px] text-gray-500 uppercase font-bold">Cor/Satur.</label>
                                                <span className="text-[9px] text-neon-green font-mono">{state.adjustments.saturation}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="250" step="1"
                                                value={state.adjustments.saturation}
                                                onChange={(e) => onUpdateAdjustments({ saturation: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <label className="text-[9px] text-gray-500 uppercase font-bold">Exposição</label>
                                                <span className="text-[9px] text-neon-green font-mono">{state.adjustments.exposure > 0 ? '+' : ''}{state.adjustments.exposure}%</span>
                                            </div>
                                            <input
                                                type="range" min="-100" max="100" step="1"
                                                value={state.adjustments.exposure}
                                                onChange={(e) => onUpdateAdjustments({ exposure: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Car Data */}
                        <div className="space-y-4 pt-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-800 pb-1">Dados Veículo</h3>

                            <div className="space-y-2">
                                <input
                                    type="text" placeholder="Marca (ex: Honda)"
                                    value={state.data.brand} onChange={(e) => onUpdateData('brand', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-neon-green focus:outline-none"
                                />
                                <input
                                    type="text" placeholder="Modelo (ex: Civic Touring)"
                                    value={state.data.model} onChange={(e) => onUpdateData('model', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-neon-green focus:outline-none"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text" placeholder="Ano (ex: 2021)"
                                        value={state.data.year} onChange={(e) => onUpdateData('year', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-neon-green focus:outline-none"
                                    />
                                    <textarea
                                        placeholder="Detalhes (ex: Configurações)"
                                        value={state.data.detailsText || ''} onChange={(e) => onUpdateData('detailsText', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-neon-green focus:outline-none resize-y min-h-[40px]"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Prices Inputs (Data Only) */}
                        <div className="space-y-4 pt-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-800 pb-1">Valores</h3>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Valor Fipe</label>
                                    <input
                                        type="number" placeholder="0,00" step="0.01"
                                        value={state.data.fipePrice || ''} onChange={(e) => onUpdateData('fipePrice', parseFloat(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-neon-green focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-neon-green font-bold">Valor Venda (KarCash)</label>
                                    <input
                                        type="number" placeholder="0,00" step="0.01"
                                        value={state.data.salePrice || ''} onChange={(e) => onUpdateData('salePrice', parseFloat(e.target.value))}
                                        className="w-full bg-gray-800 border border-neon-green rounded px-3 py-2 text-sm focus:outline-none font-bold text-white shadow-sm shadow-neon-green/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">Margem de Lucro (Automática)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green text-xs font-bold font-ubuntu">R$</span>
                                        <input
                                            type="text"
                                            value={state.data.economyPrice.toLocaleString('pt-BR')}
                                            readOnly
                                            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg py-2 pl-9 pr-3 text-xs text-neon-green font-bold font-ubuntu cursor-not-allowed focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'texts' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ItemControl label="Marca" config={state.config.brand} onChange={(k, v) => onUpdateConfig('brand', { [k]: v })} />
                        <ItemControl label="Modelo" config={state.config.model} onChange={(k, v) => onUpdateConfig('model', { [k]: v })} />
                        <ItemControl label="Detalhes" config={state.config.details} onChange={(k, v) => onUpdateConfig('details', { [k]: v })} />
                        <ItemControl label="Ano" config={state.config.year} onChange={(k, v) => onUpdateConfig('year', { [k]: v })} />

                        <div className="bg-gray-800 p-3 rounded mb-3 border border-gray-700">
                            <h4 className="text-neon-green font-bold text-sm mb-2 uppercase">Logo (Imagem)</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-gray-400 text-xs">Largura</label>
                                        <input
                                            type="number"
                                            value={state.config.logoImage?.width || 200}
                                            onChange={(e) => onUpdateConfig('logoImage', { width: Number(e.target.value) })}
                                            className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-0.5 text-white text-xs text-right"
                                        />
                                    </div>
                                    <input
                                        type="range" min="50" max="600"
                                        value={state.config.logoImage?.width || 200}
                                        onChange={(e) => onUpdateConfig('logoImage', { width: Number(e.target.value) })}
                                        className="w-full accent-neon-green"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-gray-400 text-xs">Pos X</label>
                                        <input
                                            type="number"
                                            value={state.config.logoImage?.offsetX || 0}
                                            onChange={(e) => onUpdateConfig('logoImage', { offsetX: Number(e.target.value) })}
                                            className="w-16 bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-white text-xs text-right"
                                        />
                                    </div>
                                    <input
                                        type="range" min="-500" max="500"
                                        value={state.config.logoImage?.offsetX || 0}
                                        onChange={(e) => onUpdateConfig('logoImage', { offsetX: Number(e.target.value) })}
                                        className="w-full accent-neon-green"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-gray-400 text-xs">Pos Y</label>
                                        <input
                                            type="number"
                                            value={state.config.logoImage?.offsetY || 0}
                                            onChange={(e) => onUpdateConfig('logoImage', { offsetY: Number(e.target.value) })}
                                            className="w-16 bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-white text-xs text-right"
                                        />
                                    </div>
                                    <input
                                        type="range" min="-500" max="500"
                                        value={state.config.logoImage?.offsetY || 0}
                                        onChange={(e) => onUpdateConfig('logoImage', { offsetY: Number(e.target.value) })}
                                        className="w-full accent-neon-green"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'prices' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ItemControl
                            label="Tabela Fipe (Box)"
                            config={state.config.fipe}
                            onChange={(k, v) => onUpdateConfig('fipe', { [k]: v })}
                            showColor showDimensions
                        />
                        <ItemControl
                            label="Logo KarCash"
                            config={state.config.karcashLogo}
                            onChange={(k, v) => onUpdateConfig('karcashLogo', { [k]: v })}
                        />
                        <ItemControl
                            label="Valor KarCash"
                            config={state.config.price}
                            onChange={(k, v) => onUpdateConfig('price', { [k]: v })}
                        />
                        <ItemControl
                            label="Margem de Lucro (Box)"
                            config={state.config.economy}
                            onChange={(k, v) => onUpdateConfig('economy', { [k]: v })}
                            showColor showDimensions
                        />
                    </div>
                )}

                {activeTab === 'bg' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                        {/* Background Gallery Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Galeria Premium</label>
                                <button
                                    onClick={() => onUpdateBackground({
                                        ...state.background,
                                        rotation: state.background.rotation === 180 ? 0 : 180
                                    })}
                                    className={`text-[10px] px-2 py-1 rounded border transition-all flex items-center gap-1 ${state.background.rotation === 180
                                        ? 'bg-neon-green text-white border-neon-green font-bold'
                                        : 'bg-gray-800 text-gray-400 border-gray-700'
                                        }`}
                                >
                                    🔄 Girar 180°
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-1">
                                {PREMIUM_BACKGROUNDS.map((bg) => (
                                    <button
                                        key={bg.id}
                                        onClick={() => onUpdateBackground({
                                            ...state.background,
                                            type: 'image',
                                            value: bg.url
                                        })}
                                        className={`relative aspect-[9/16] rounded-md overflow-hidden border-2 transition-all group ${state.background.type === 'image' && state.background.value === bg.url
                                            ? 'border-neon-green scale-[0.98]'
                                            : 'border-gray-800 hover:border-gray-600'
                                            }`}
                                    >
                                        <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[7px] text-white text-center uppercase truncate px-1">{bg.name}</p>
                                        </div>
                                        {state.background.type === 'image' && state.background.value === bg.url && (
                                            <div className="absolute top-1 right-1 bg-neon-green text-black rounded-full p-0.5">
                                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Overlay Mask Section */}
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4 shadow-inner">
                            <label className="text-xs font-bold text-neon-green uppercase tracking-widest flex items-center gap-2">
                                🎭 Máscara Overlay
                            </label>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-[10px] text-gray-400">Opacidade (Escurecer)</label>
                                        <span className="text-[10px] text-neon-green font-mono">{Math.round((state.background.overlayOpacity || 0) * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={state.background.overlayOpacity || 0}
                                        onChange={(e) => onUpdateBackground({
                                            ...state.background,
                                            overlayOpacity: parseFloat(e.target.value)
                                        })}
                                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-400 block">Cor da Máscara</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={state.background.overlayColor || '#000000'}
                                            onChange={(e) => onUpdateBackground({
                                                ...state.background,
                                                overlayColor: e.target.value
                                            })}
                                            className="w-8 h-8 bg-gray-900 border border-gray-600 rounded cursor-pointer shrink-0"
                                        />
                                        <div className="flex gap-1 overflow-x-auto pb-1">
                                            {[COLORS.PRETO_PROFUNDO, COLORS.VERDE_ESCURO, COLORS.VERDE_MUSGO, '#1a1a1a', '#2c3e50'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => onUpdateBackground({ ...state.background, overlayColor: c })}
                                                    className={`w-5 h-5 rounded-full border border-gray-600 transition-transform hover:scale-110 ${state.background.overlayColor === c ? 'ring-2 ring-neon-green border-white' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Controls */}
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <label className="flex flex-col items-center justify-center w-full h-10 border border-gray-700 rounded bg-gray-800 hover:bg-gray-750 cursor-pointer transition-colors">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">📂 Personalizar</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                const url = URL.createObjectURL(e.target.files[0]);
                                                onUpdateBackground({
                                                    ...state.background,
                                                    type: 'image',
                                                    value: url
                                                });
                                            }
                                        }}
                                    />
                                </label>
                                <button
                                    onClick={() => onUpdateBackground({
                                        ...state.background,
                                        type: 'solid',
                                        value: COLORS.PRETO_PROFUNDO
                                    })}
                                    className="h-10 border border-gray-700 rounded bg-gray-800 hover:bg-gray-750 text-[10px] text-gray-400 font-bold uppercase transition-colors"
                                >
                                    🎨 Cor Sólida
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gradientes KarCash</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => onUpdateBackground({
                                            ...state.background,
                                            type: 'gradient',
                                            gradient: { colors: [COLORS.VERDE_LIMAO, COLORS.PRETO_PROFUNDO], direction: 180 }
                                        })}
                                        className="h-10 rounded border border-gray-600 hover:border-neon-green transition-all"
                                        style={{ background: `linear-gradient(180deg, ${COLORS.VERDE_LIMAO}, ${COLORS.PRETO_PROFUNDO})` }}
                                    />
                                    <button
                                        onClick={() => onUpdateBackground({
                                            ...state.background,
                                            type: 'gradient',
                                            gradient: { colors: ['#333333', COLORS.PRETO_PROFUNDO], direction: 180 }
                                        })}
                                        className="h-10 rounded border border-gray-600 hover:border-neon-green transition-all"
                                        style={{ background: `linear-gradient(180deg, #333333, ${COLORS.PRETO_PROFUNDO})` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0 z-20">
                <button
                    onClick={onDownload}
                    className="w-full bg-neon-green text-white font-black uppercase tracking-wider py-4 rounded-lg hover:bg-[#b3e600] hover:text-black transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-neon-green/30"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar Arte
                </button>
            </div>
        </div>
    );
}
