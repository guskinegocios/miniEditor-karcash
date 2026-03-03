export interface VehicleData {
    brand: string;
    model: string;
    year: string;
    fipePrice: number;
    salePrice: number;
    economyPrice: number; // Novo campo manual
    detailsText?: string; // Novo: Texto customizável para configurações
}

export interface ItemConfig {
    fontSize: number;
    offsetX: number;
    offsetY: number;
    fontFamily?: 'Montserrat' | 'Archivo';
    fontWeight?: string | number;
    textColor?: string;
    align?: 'left' | 'center' | 'right';
    width?: number; // Novo: Largura (para boxes)
    height?: number; // Novo: Altura (para boxes)
    color?: string; // Novo: Cor de fundo (para boxes)
    gap?: number; // Novo: Espaçamento entre label e valor
}

export interface CanvasConfig {
    zoom: number;
    pan: { x: number; y: number };
    rotation: number; // Nova: Rotação da imagem
    overlayOpacity: number;

    // Elementos Individuais
    brand: ItemConfig;
    model: ItemConfig;
    details: ItemConfig;
    year: ItemConfig;
    price: ItemConfig; // Valor KarCash
    fipe: ItemConfig; // Novo: Tabela Fipe Box
    economy: ItemConfig; // Novo: Margem de Lucro Box
    karcashLogo: ItemConfig; // Novo: Logo/Texto KarCash
    logoImage: ItemConfig; // Novo: Logo Imagem KarCash

    // Legado ou Específico (ainda úteis?)
    salePriceFontSize?: number; // Depreciar em favor de price.fontSize se possível, mas manter compatibilidade por enquanto
}

export interface BackgroundConfig {
    type: 'image' | 'solid' | 'gradient';
    value: string; // URL da imagem ou Cor Sólida
    gradient?: {
        colors: [string, string];
        direction: number; // graus (0-360)
    };
    overlayColor?: string; // Novo: Cor da máscara
    overlayOpacity?: number; // Novo: Opacidade da máscara (0 a 1)
    rotation?: number; // Novo: Rotação (0 ou 180)
}

export interface LayoutConfig {
    config: CanvasConfig;
    background: BackgroundConfig;
}

export interface ImageAdjustments {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
}

export interface KarCardState {
    image: string | null;
    data: VehicleData;
    format: 'story' | 'poster';
    layouts: {
        story: LayoutConfig;
        poster: LayoutConfig;
    };
    adjustments: ImageAdjustments;
}
