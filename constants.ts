
// Definição dos tipos de painéis disponíveis
export interface PanelOption {
  id: string;
  powerW: number; // Potência em Watts
  width: number; // Metros
  height: number; // Metros
  area: number; // Metros quadrados
  label: string;
}

export const PANEL_OPTIONS: PanelOption[] = [
  { 
    id: 'p450', 
    powerW: 450, 
    width: 2.10, 
    height: 1.05, 
    area: 2.2, 
    label: '450W - Standard (2.2m²)' 
  },
  { 
    id: 'p550', 
    powerW: 550, 
    width: 2.27, 
    height: 1.13, 
    area: 2.6, 
    label: '550W - High Power (2.6m²)' 
  },
  { 
    id: 'p575', 
    powerW: 575, 
    width: 2.28, 
    height: 1.13, 
    area: 2.65, 
    label: '575W - Bifacial TopCon (2.65m²)' 
  },
  { 
    id: 'p660', 
    powerW: 660, 
    width: 2.38, 
    height: 1.30, 
    area: 3.1, 
    label: '660W - Ultra Large (3.1m²)' 
  }
];

export const DEFAULT_PANEL_ID = 'p550';

// Parâmetros do Sistema
export const PERFORMANCE_RATIO = 0.75; // Perdas térmicas, sujeira, inversor (75%)
export const INSTALLATION_COST_PER_KWP = 3500.00; // R$ custo médio de mercado

// Defaults
export const DEFAULT_HSP = 4.5; // Média Brasil conservadora

// Parâmetros Financeiros e de Degradação (Novos)
export const ENERGY_INFLATION_RATE = 0.06; // 6% ao ano (Média conservadora de aumento da tarifa de energia)
export const PANEL_DEGRADATION_RATE = 0.007; // 0.7% ao ano (Degradação linear padrão de mercado)
