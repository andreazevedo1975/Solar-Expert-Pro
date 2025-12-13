
import { SolarInputs, SolarResults, FinancialYearlyData } from '../types';
import { 
  PANEL_OPTIONS, 
  INSTALLATION_COST_PER_KWP,
  DEFAULT_PANEL_ID,
  ENERGY_INFLATION_RATE,
  PANEL_DEGRADATION_RATE
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
  const energyTariffInput = parseInput(inputs.energyTariff);
  const { selectedPanelId, customInstallationCost, calculationBasis } = inputs;

  // Seleção do Painel (Variável técnica do módulo)
  const selectedPanel = PANEL_OPTIONS.find(p => p.id === selectedPanelId) || 
                        PANEL_OPTIONS.find(p => p.id === DEFAULT_PANEL_ID) || 
                        PANEL_OPTIONS[1];

  const P_painel_kwp = selectedPanel.powerW / 1000; // Potência do painel em kWp
  const Area_painel_m2 = selectedPanel.area;

  // Variável Imd: Irradiação Média Diária (HSP - Horas de Sol Pleno)
  const Imd = hspInput > 0 ? hspInput : 4.5;
  // Variável n_sistema: Eficiência do Sistema (Performance Ratio)
  const safeLosses = Math.min(Math.max(lossesInput, 0), 90);
  const n_sistema = (100 - safeLosses) / 100;
  
  // Variável C: Consumo diário médio anual (kWh/dia)
  // Usado para referência de cobertura, mesmo no modo área
  const C = monthlyConsumptionInput / 30;

  // --- 2. LÓGICA DE DIMENSIONAMENTO (BIFURCAÇÃO) ---
  let finalPanelCount = 0;
  let finalSystemSizeKWp = 0;
  let isPartialSystem = false;

  if (calculationBasis === 'area') {
      // MODO: MAXIMIZAR ÁREA
      // O limite é o espaço físico disponível
      if (availableArea > 0) {
          finalPanelCount = Math.floor(availableArea / Area_painel_m2);
      } else {
          finalPanelCount = 0;
      }
      
      finalSystemSizeKWp = finalPanelCount * P_painel_kwp;
      // Neste modo, não existe "sistema parcial" no sentido de não atingir a meta,
      // pois a meta é encher o telhado.
      isPartialSystem = false; 

  } else {
      // MODO: COBRIR CONSUMO (Padrão)
      // Fórmula: PFV (kWp) = C / (Imd * n_sistema)
      const Pfv_calculada = C / (Imd * n_sistema);

      // Quantidade de painéis ideal (Arredondamento para CIMA)
      const idealPanelCount = Math.ceil(Pfv_calculada / P_painel_kwp);

      // Validação de Área
      const idealArea = idealPanelCount * Area_painel_m2;
      
      finalPanelCount = idealPanelCount;

      if (availableArea > 0 && idealArea > availableArea) {
        const maxPanelsFit = Math.floor(availableArea / Area_painel_m2);
        finalPanelCount = Math.max(0, maxPanelsFit);
        isPartialSystem = true;
      } else if (availableArea === 0 && idealArea > 0) {
        finalPanelCount = idealPanelCount;
      }
      
      finalSystemSizeKWp = finalPanelCount * P_painel_kwp;
  }

  // --- 3. RESULTADOS TÉCNICOS COMUNS ---
  const areaOccupied = finalPanelCount * Area_painel_m2;

  // Geração Base (Ano 0 - Sem degradação)
  const dailyGenerationBase = finalSystemSizeKWp * Imd * n_sistema;
  const monthlyGenerationBase = dailyGenerationBase * 30;
  
  // Porcentagem de Cobertura da Conta (Baseada no Ano 1)
  const coveragePercentage = monthlyConsumptionInput > 0 
    ? (monthlyGenerationBase / monthlyConsumptionInput) * 100 
    : 0;

  // --- 4. ANÁLISE FINANCEIRA AVANÇADA (FLUXO DE CAIXA) ---
  
  // Definição do CAPEX (Investimento Inicial)
  let finalCostPerKwp = INSTALLATION_COST_PER_KWP;
  let costSource: 'DEFAULT' | 'MARKET' = 'DEFAULT';

  if (customInstallationCost && customInstallationCost > 0) {
    finalCostPerKwp = customInstallationCost;
    costSource = 'MARKET';
  }

  const totalInvestment = finalSystemSizeKWp * finalCostPerKwp;

  // Projeção de 30 anos (Vida útil estendida)
  const financialProjection: FinancialYearlyData[] = [];
  let accumulatedSavings = 0;
  let paybackMonths = 0;
  let paybackFound = false;

  let currentTariff = energyTariffInput;
  // A geração anual base considera 365 dias para fins anuais
  let currentAnnualGeneration = dailyGenerationBase * 365; 

  for (let year = 1; year <= 30; year++) {
    // 1. Calcula economia deste ano
    // Para fins financeiros, limitamos a economia ao valor da conta (net metering)
    // OU assumimos que o excedente vira crédito e será usado (cenário otimista/comum em simulações)
    // Aqui usaremos Geração Total * Tarifa, pois créditos têm validade de 5 anos.
    const yearSavings = currentAnnualGeneration * currentTariff;
    
    // 2. Acumula
    accumulatedSavings += yearSavings;

    // 3. Salva no array
    financialProjection.push({
      year,
      accumulatedSavings,
      yearlySavings: yearSavings,
      generation: currentAnnualGeneration,
      tariff: currentTariff
    });

    // 4. Verifica Payback
    if (!paybackFound && accumulatedSavings >= totalInvestment) {
      // Interpolação linear para achar o mês exato dentro deste ano
      const previousAccumulated = accumulatedSavings - yearSavings;
      const remainingToPay = totalInvestment - previousAccumulated;
      const fractionOfYear = remainingToPay / yearSavings;
      
      paybackMonths = ((year - 1) + fractionOfYear) * 12;
      paybackFound = true;
    }

    // 5. Aplica taxas para o PRÓXIMO ano
    // Aumenta tarifa (Inflação Energética)
    currentTariff = currentTariff * (1 + ENERGY_INFLATION_RATE);
    // Reduz geração (Degradação do Silício)
    currentAnnualGeneration = currentAnnualGeneration * (1 - PANEL_DEGRADATION_RATE);
  }

  // Se não pagou em 30 anos
  if (!paybackFound) {
    paybackMonths = 360; // 30 anos
  }

  // Economia Inicial (para display simples)
  const monthlySavingsInitial = monthlyGenerationBase * energyTariffInput;
  const annualSavingsInitial = monthlySavingsInitial * 12;

  return {
    systemSizeKWp: finalSystemSizeKWp,
    panelCount: finalPanelCount,
    panelPowerUsed: selectedPanel.powerW,
    areaOccupied,
    monthlyGeneration: monthlyGenerationBase,
    dailyGeneration: dailyGenerationBase,
    dailyConsumption: C,
    coveragePercentage,
    isPartialSystem,
    monthlySavings: monthlySavingsInitial,
    annualSavings: annualSavingsInitial,
    totalInvestment,
    paybackMonths,
    costSource,
    systemLossesPercentage: safeLosses,
    performanceRatio: n_sistema,
    financialProjection // Novo dado complexo
  };
};
