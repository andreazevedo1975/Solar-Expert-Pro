import { SolarInputs, SolarResults } from '../types';
import { 
  PANEL_OPTIONS, 
  INSTALLATION_COST_PER_KWP,
  DEFAULT_PANEL_ID
} from '../constants';

// Helper seguro para converter input em número
const parseInput = (val: number | string | undefined): number => {
  if (val === undefined || val === '') return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  return isNaN(num) ? 0 : num;
};

export const calculateSolarSystem = (inputs: SolarInputs): SolarResults => {
  // --- 1. PREPARAÇÃO E SANITIZAÇÃO DAS VARIÁVEIS DE ENTRADA ---
  const monthlyConsumptionInput = parseInput(inputs.monthlyConsumption);
  const hspInput = parseInput(inputs.hsp);
  const lossesInput = parseInput(inputs.systemLosses);
  const availableArea = parseInput(inputs.availableArea);
  const energyTariff = parseInput(inputs.energyTariff);
  const { selectedPanelId, customInstallationCost } = inputs;

  // Seleção do Painel (Variável técnica do módulo)
  const selectedPanel = PANEL_OPTIONS.find(p => p.id === selectedPanelId) || 
                        PANEL_OPTIONS.find(p => p.id === DEFAULT_PANEL_ID) || 
                        PANEL_OPTIONS[1];

  const P_painel_kwp = selectedPanel.powerW / 1000; // Potência do painel em kWp
  const Area_painel_m2 = selectedPanel.area;

  // --- 2. IMPLEMENTAÇÃO DA FÓRMULA DE DIMENSIONAMENTO (CORE) ---
  // Fórmula Solicitada: PFV (kWp) = C / (Imd * n_sistema)

  // Variável C: Consumo diário médio anual (kWh/dia)
  // Consideramos o mês comercial de 30 dias para média diária
  const C = monthlyConsumptionInput / 30;

  // Variável Imd: Irradiação Média Diária (HSP - Horas de Sol Pleno)
  // Se o usuário não fornecer, usamos 4.5 como fallback conservador
  const Imd = hspInput > 0 ? hspInput : 4.5;

  // Variável n_sistema: Eficiência do Sistema (Performance Ratio)
  // Input vem como porcentagem de perda (ex: 25%), convertemos para eficiência (ex: 0.75)
  // Proteção para evitar valores absurdos (min 10% de eficiência, max 100%)
  const safeLosses = Math.min(Math.max(lossesInput, 0), 90);
  const n_sistema = (100 - safeLosses) / 100;

  // CÁLCULO FINAL DA POTÊNCIA FOTOVOLTAICA (PFV)
  const Pfv_calculada = C / (Imd * n_sistema);

  // --- 3. DIMENSIONAMENTO FÍSICO (NÚMERO DE PAINÉIS) ---
  
  // Quantidade de painéis ideal (Arredondamento para CIMA para garantir a geração necessária)
  // N = PFV / Potencia_modulo
  const idealPanelCount = Math.ceil(Pfv_calculada / P_painel_kwp);

  // --- 4. VALIDAÇÃO DE ÁREA DISPONÍVEL ---
  
  const idealArea = idealPanelCount * Area_painel_m2;
  
  let finalPanelCount = idealPanelCount;
  let isPartialSystem = false;

  // Se a área necessária for maior que a disponível, limitamos o sistema
  if (availableArea > 0 && idealArea > availableArea) {
    // Calcula quantos painéis cabem na área disponível (Arredondamento para BAIXO)
    const maxPanelsFit = Math.floor(availableArea / Area_painel_m2);
    finalPanelCount = Math.max(0, maxPanelsFit);
    isPartialSystem = true;
  } else if (availableArea === 0 && idealArea > 0) {
    // Se area for 0 (campo vazio), assumimos que não há restrição ou usuário não preencheu
    // Mantemos o idealPanelCount.
    finalPanelCount = idealPanelCount;
  }

  // --- 5. RESULTADOS FINAIS (OUTPUTS) ---

  // Potência Final Real do Sistema (Baseada no número inteiro de painéis)
  const finalSystemSizeKWp = finalPanelCount * P_painel_kwp;
  const areaOccupied = finalPanelCount * Area_painel_m2;

  // Recálculo da Geração Estimada com o sistema final
  // E_gerada = Potencia_Instalada * HSP * Eficiencia * 30 dias
  const dailyGeneration = finalSystemSizeKWp * Imd * n_sistema;
  const monthlyGeneration = dailyGeneration * 30;

  // Porcentagem de Cobertura da Conta
  const coveragePercentage = monthlyConsumptionInput > 0 
    ? (monthlyGeneration / monthlyConsumptionInput) * 100 
    : 0;

  // --- 6. ANÁLISE FINANCEIRA ---
  
  const monthlySavings = monthlyGeneration * energyTariff;
  const annualSavings = monthlySavings * 12;

  // Definição do Custo (Capex)
  let finalCostPerKwp = INSTALLATION_COST_PER_KWP;
  let costSource: 'DEFAULT' | 'MARKET' = 'DEFAULT';

  if (customInstallationCost && customInstallationCost > 0) {
    finalCostPerKwp = customInstallationCost;
    costSource = 'MARKET';
  }

  const totalInvestment = finalSystemSizeKWp * finalCostPerKwp;

  // Payback Simples (Meses)
  const paybackMonths = monthlySavings > 0 ? totalInvestment / monthlySavings : 0;

  return {
    systemSizeKWp: finalSystemSizeKWp,
    panelCount: finalPanelCount,
    panelPowerUsed: selectedPanel.powerW,
    areaOccupied,
    monthlyGeneration,
    dailyGeneration,
    dailyConsumption: C,
    coveragePercentage,
    isPartialSystem,
    monthlySavings,
    annualSavings,
    totalInvestment,
    paybackMonths,
    costSource,
    systemLossesPercentage: safeLosses,
    performanceRatio: n_sistema
  };
};