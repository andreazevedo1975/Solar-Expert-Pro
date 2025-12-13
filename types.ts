
export interface SolarInputs {
  monthlyConsumption: number | string; // kWh (Este é o valor final usado no cálculo)
  
  // Novos campos para os modos de entrada de consumo
  consumptionMode: 'average' | 'history' | 'daily';
  consumptionHistory: (number | string)[]; // Array de 12 meses
  dailyConsumption: number | string; // kWh por dia
  
  // Novo campo para definir a base de cálculo
  calculationBasis: 'consumption' | 'area'; // 'consumption' = alvo é zerar a conta | 'area' = alvo é encher o telhado

  energyTariff: number | string; // R$/kWh
  availableArea: number | string; // m²
  hsp: number | string; // Horas de Sol Pleno
  systemLosses: number | string; // Percentual de perdas (padrão 25%)
  selectedPanelId: string; // ID do painel escolhido
  addressSearch?: string; // Campo de busca de endereço
  foundLocation?: {
    address: string;
    lat: number;
    lng: number;
    shadeAnalysis: string;
    mapUri?: string;
  };
  // Novos campos para dados de mercado
  customInstallationCost?: number; // Custo por kWp customizado (sobrescreve o default)
  marketData?: {
    foundPrice: boolean;
    averagePanelPrice: number;
    averageKitPricePerKwp: number;
    sources: Array<{ title: string; uri: string }>;
    analysis: string;
  };
}

export interface PanelRecommendation {
  brand: string;
  model: string;
  power: number; // Watts
  width: number;
  height: number;
  technology: string; // ex: Monocristalino Perc
  image?: string;
}

export interface FinancialYearlyData {
  year: number;
  accumulatedSavings: number; // Economia acumulada até este ano
  yearlySavings: number; // Economia gerada apenas neste ano
  generation: number; // Geração anual neste ano (considerando degradação)
  tariff: number; // Tarifa neste ano (considerando inflação)
}

export interface SolarResults {
  systemSizeKWp: number; // Potência total do sistema
  panelCount: number; // Quantidade de placas
  panelPowerUsed: number; // Potência do painel usado em W (para exibição)
  areaOccupied: number; // Área necessária
  monthlyGeneration: number; // Geração estimada kWh/mês
  dailyGeneration: number; // Geração média estimada kWh/dia
  dailyConsumption: number; // Consumo médio kWh/dia
  coveragePercentage: number; // % da conta coberta
  isPartialSystem: boolean; // Se a área limita o sistema
  monthlySavings: number; // R$ (Valor do primeiro mês/ano base)
  annualSavings: number; // R$ (Valor do primeiro ano base)
  totalInvestment: number; // R$ Estimado
  paybackMonths: number; // Tempo de retorno em meses (Calculado com fluxo de caixa)
  costSource: 'DEFAULT' | 'MARKET'; // Indica a origem do preço usado
  systemLossesPercentage: number; // Percentual de perda considerado (ex: 25%)
  performanceRatio: number; // PR usado (ex: 0.75)
  financialProjection: FinancialYearlyData[]; // Array com os dados de 25 anos
}

export enum SimulationStatus {
  IDLE = 'IDLE',
  CALCULATING = 'CALCULATING',
  COMPLETE = 'COMPLETE'
}
