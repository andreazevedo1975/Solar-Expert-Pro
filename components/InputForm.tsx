import React, { useState, useEffect } from 'react';
import { SolarInputs } from '../types';
import { Tooltip } from './Tooltip';
import { PANEL_OPTIONS } from '../constants';
import { fetchSolarDataByLocation, fetchMarketPrices } from '../services/solarAi';
import { 
  Calculator, 
  Sun, 
  Zap, 
  Map, 
  DollarSign, 
  LayoutGrid, 
  Search, 
  Loader2, 
  MapPin, 
  ExternalLink,
  ShoppingBag,
  TrendingDown,
  Calendar,
  Clock,
  BarChart3,
  Tag,
  Gauge,
  Thermometer,
  CloudFog,
  ZapOff,
  Percent,
  PackageCheck,
  Wrench
} from 'lucide-react';

interface InputFormProps {
  inputs: SolarInputs;
  onChange: (inputs: SolarInputs) => void;
  onCalculate: () => void;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const InputForm: React.FC<InputFormProps> = ({ inputs, onChange, onCalculate }) => {
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSearchingMarket, setIsSearchingMarket] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);

  const handleChange = (field: keyof SolarInputs, value: string | number) => {
    onChange({
      ...inputs,
      [field]: value,
    });
  };

  // Helper para atualizar o histórico de consumo
  const handleHistoryChange = (index: number, value: string) => {
    const newHistory = [...inputs.consumptionHistory];
    newHistory[index] = value;
    
    // Calcula nova média
    // Filtra apenas valores numéricos válidos
    const validValues = newHistory
      .map(v => typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v)
      .filter(v => !isNaN(v as number) && (v as number) > 0) as number[];

    const sum = validValues.reduce((a, b) => a + b, 0);
    const average = validValues.length > 0 ? sum / validValues.length : 0;

    onChange({
      ...inputs,
      consumptionHistory: newHistory,
      monthlyConsumption: parseFloat(average.toFixed(2)) // Atualiza o valor principal
    });
  };

  // Helper para atualizar média diária
  const handleDailyChange = (value: string) => {
    const numValue = parseFloat(value.replace(',', '.'));
    const safeDaily = isNaN(numValue) ? 0 : numValue;
    
    // Multiplica por 30.42 (média de dias no mês)
    const projectedMonthly = safeDaily * 30.42;

    onChange({
      ...inputs,
      dailyConsumption: value,
      monthlyConsumption: parseFloat(projectedMonthly.toFixed(2))
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const handleAddressSearch = async () => {
    if (!inputs.addressSearch || inputs.addressSearch.length < 3) {
      setSearchError("Digite um endereço válido.");
      return;
    }

    setIsSearchingAddress(true);
    setSearchError(null);

    try {
      const solarData = await fetchSolarDataByLocation(inputs.addressSearch);
      
      onChange({
        ...inputs,
        hsp: solarData.hsp,
        foundLocation: {
          address: solarData.address,
          lat: solarData.lat,
          lng: solarData.lng,
          shadeAnalysis: solarData.shadeAnalysis,
          mapUri: solarData.mapUri
        }
      });
    } catch (err) {
      setSearchError("Não foi possível encontrar dados para este local.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleMarketSearch = async () => {
    setIsSearchingMarket(true);
    setMarketError(null);

    try {
      const selectedPanel = PANEL_OPTIONS.find(p => p.id === inputs.selectedPanelId);
      const powerW = selectedPanel ? selectedPanel.powerW : 550;

      const marketData = await fetchMarketPrices(powerW);

      // Lógica de estimativa: Preço do Kit * 1.4 (Margem de instalação/mão de obra)
      // O prompt agora busca especificamente o preço do kit
      let estimatedCostPerKwp = 0;
      if (marketData.averageKitPricePerKwp > 0) {
        // Assume que o kit é 65-70% do custo total e a instalação/projeto é 30-35%
        // Então multiplicamos o kit por ~1.45 para ter o turnkey
        estimatedCostPerKwp = marketData.averageKitPricePerKwp * 1.45; 
      }

      onChange({
        ...inputs,
        customInstallationCost: estimatedCostPerKwp > 0 ? estimatedCostPerKwp : undefined,
        marketData: {
            foundPrice: estimatedCostPerKwp > 0,
            averagePanelPrice: marketData.averagePanelPrice,
            averageKitPricePerKwp: marketData.averageKitPricePerKwp,
            sources: marketData.sources,
            analysis: marketData.analysis
        }
      });

    } catch (err) {
        setMarketError("Erro ao buscar preços online.");
    } finally {
        setIsSearchingMarket(false);
    }
  };

  // Calcula PR para display
  const currentLosses = Number(inputs.systemLosses) || 0;
  const calculatedPR = (100 - currentLosses) / 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 md:p-8 border border-slate-100 dark:border-slate-800 space-y-8 transition-colors duration-300">
      
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-yellow-500" />
            Parâmetros do Projeto
        </h2>

        {/* BUSCA DE ENDEREÇO */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
            <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Busca Inteligente de Irradiação (IA)
            <Tooltip content="Digite a cidade ou endereço. Nossa IA buscará a média de Horas de Sol Pleno (HSP) exata da região usando Google Maps." />
            </label>
            <div className="flex gap-2">
            <div className="relative flex-grow">
                <input 
                type="text" 
                placeholder="Ex: Av. Paulista, 1000, São Paulo"
                className="w-full pl-4 pr-4 py-2 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400"
                value={inputs.addressSearch || ''}
                onChange={(e) => handleChange('addressSearch', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                />
            </div>
            <button 
                onClick={handleAddressSearch}
                disabled={isSearchingAddress}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSearchingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
            </div>
            
            {searchError && <p className="text-red-500 text-xs mt-2">{searchError}</p>}

            {inputs.foundLocation && (
            <div className="mt-3 text-xs bg-white dark:bg-slate-800 p-3 rounded border border-blue-100 dark:border-slate-700 animate-fade-in">
                <div className="flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{inputs.foundLocation.address}</p>
                    <p className="text-slate-500 dark:text-slate-400">HSP encontrado: <span className="font-bold text-green-600 dark:text-green-400">{Number(inputs.hsp).toFixed(2)}</span></p>
                </div>
                </div>
                
                <div className="pl-6 border-l-2 border-slate-100 dark:border-slate-600 ml-2 space-y-1">
                <p className="text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Análise de Sombra:</span> {inputs.foundLocation.shadeAnalysis}
                </p>
                {inputs.foundLocation.mapUri && (
                    <a 
                    href={inputs.foundLocation.mapUri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1 font-medium"
                    >
                    Ver local no Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                )}
                </div>
            </div>
            )}
        </div>
      </div>

      {/* ÁREA DE CONSUMO COM ABAS */}
      <div className="col-span-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex text-xs font-medium text-slate-600 dark:text-slate-400">
          <button 
            onClick={() => handleChange('consumptionMode', 'average')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 transition-colors ${inputs.consumptionMode === 'average' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <Zap className="w-3 h-3" />
            Média Simples
          </button>
          <button 
            onClick={() => handleChange('consumptionMode', 'history')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 transition-colors ${inputs.consumptionMode === 'history' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <Calendar className="w-3 h-3" />
            Mensal Detalhado
          </button>
          <button 
            onClick={() => handleChange('consumptionMode', 'daily')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 transition-colors ${inputs.consumptionMode === 'daily' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <Clock className="w-3 h-3" />
            Média Diária
          </button>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800/50">
          {/* MODO 1: MÉDIA SIMPLES */}
          {inputs.consumptionMode === 'average' && (
            <div className="animate-fade-in">
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Consumo Mensal Médio (kWh)
                <Tooltip content="A média de energia gasta em sua conta de luz nos últimos 12 meses." />
              </label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  onWheel={handleWheel}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all outline-none"
                  placeholder="Ex: 450"
                  value={inputs.monthlyConsumption || ''}
                  onChange={(e) => handleChange('monthlyConsumption', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* MODO 2: HISTÓRICO 12 MESES (MENSAL DETALHADO) */}
          {inputs.consumptionMode === 'history' && (
             <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                     Consumo Mensal Detalhado (kWh)
                     <Tooltip content="Preencha os meses disponíveis da sua conta. O sistema calculará a média automaticamente." />
                   </label>
                   <span className="text-xs bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-bold">
                     Média: {Number(inputs.monthlyConsumption).toFixed(0)} kWh
                   </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((month, idx) => (
                    <div key={idx} className="relative">
                       <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">{month}</span>
                       <input
                          type="number"
                          min="0"
                          onWheel={handleWheel}
                          className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                          placeholder="0"
                          value={inputs.consumptionHistory[idx] || ''}
                          onChange={(e) => handleHistoryChange(idx, e.target.value)}
                       />
                    </div>
                  ))}
                </div>
             </div>
          )}

          {/* MODO 3: MÉDIA DIÁRIA */}
          {inputs.consumptionMode === 'daily' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Consumo Diário (kWh/dia)
                <Tooltip content="Faça a leitura do seu medidor em dias consecutivos para saber quanto consome por dia." />
              </label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    onWheel={handleWheel}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all outline-none"
                    placeholder="Ex: 15.5"
                    value={inputs.dailyConsumption || ''}
                    onChange={(e) => handleDailyChange(e.target.value)}
                  />
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-500 dark:text-slate-400">Estimativa Mensal</p>
                   <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{Number(inputs.monthlyConsumption).toFixed(0)} kWh</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                *Calculado com base em um mês médio de 30.42 dias.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* OUTROS INPUTS - GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Tarifa */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tarifa de Energia (R$/kWh)
            <Tooltip content="O valor que você paga por cada kWh. Consulte sua conta de luz (ex: 0.95)." />
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              onWheel={handleWheel}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all outline-none"
              placeholder="Ex: 0.92"
              value={inputs.energyTariff || ''}
              onChange={(e) => handleChange('energyTariff', e.target.value)}
            />
          </div>
        </div>

        {/* Área Disponível */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Área Disponível (m²)
            <Tooltip content="Espaço livre no telhado ou solo para instalação dos módulos. Importante para verificar se o sistema cabe." />
          </label>
          <div className="relative">
            <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="number"
              min="0"
              onWheel={handleWheel}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all outline-none"
              placeholder="Ex: 40"
              value={inputs.availableArea || ''}
              onChange={(e) => handleChange('availableArea', e.target.value)}
            />
          </div>
        </div>

        {/* HSP */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            HSP (Horas de Sol Pleno)
            <Tooltip content="HSP (Horas de Sol Pleno) mede a radiação solar disponível (1000W/m²). É vital para o cálculo: quanto maior o HSP da sua região, mais energia seu sistema gera e menos painéis você precisa." />
          </label>
          <div className="relative">
            <Sun className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="number"
              step="0.1"
              min="0"
              onWheel={handleWheel}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none ${inputs.foundLocation ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 font-semibold' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white'}`}
              placeholder="Ex: 4.5"
              value={inputs.hsp || ''}
              onChange={(e) => handleChange('hsp', e.target.value)}
            />
          </div>
        </div>

        {/* Seleção de Painel */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Modelo de Painel Solar
            <Tooltip content="Escolha a potência e tecnologia do módulo para recalcular área e quantidade." />
          </label>
          <div className="relative">
            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all outline-none appearance-none"
              value={inputs.selectedPanelId}
              onChange={(e) => handleChange('selectedPanelId', e.target.value)}
            >
              {PANEL_OPTIONS.map((panel) => (
                <option key={panel.id} value={panel.id}>
                  {panel.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Perdas do Sistema (Novo) */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Perdas do Sistema (%)
            <Tooltip content="Fator de redução de eficiência (Performance Ratio). Inclui perdas térmicas, sujeira nos painéis e conversão do inversor. Padrão de mercado: 20% a 25%." />
          </label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="number"
              min="0"
              max="90"
              step="1"
              onWheel={handleWheel}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all outline-none"
              placeholder="Ex: 25"
              value={inputs.systemLosses}
              onChange={(e) => handleChange('systemLosses', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* EFICIÊNCIA DO SISTEMA (INFO) */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
         <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-orange-500" />
            Eficiência Global Resultante
         </h3>
         <div className="flex items-center justify-between text-sm">
            <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400" title="Perda de eficiência com o calor">
                   <Thermometer className="w-3 h-3 text-red-400" /> 
                   <span>Temperatura</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400" title="Perdas no Inversor e Cabos">
                   <ZapOff className="w-3 h-3 text-yellow-500" /> 
                   <span>Elétrica</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400" title="Poeira e Sujeira nos painéis">
                   <CloudFog className="w-3 h-3 text-slate-400" /> 
                   <span>Sujeira</span>
                </div>
            </div>
            <div className="text-right">
                <span className="block text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Performance Ratio (PR)</span>
                <span className="font-bold text-slate-800 dark:text-white text-lg">
                  {calculatedPR.toFixed(2)} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">({(calculatedPR * 100).toFixed(0)}%)</span>
                </span>
            </div>
         </div>
      </div>

      {/* ANÁLISE DE MERCADO (Preços) */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Custos de Fabricante (Intelbras / WEG)
            </h3>
            <button
                onClick={handleMarketSearch}
                disabled={isSearchingMarket}
                className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors font-medium flex items-center gap-1 disabled:opacity-70"
            >
                {isSearchingMarket ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buscar Preços'}
            </button>
        </div>

        {marketError && <p className="text-red-500 text-xs mb-3">{marketError}</p>}

        {inputs.marketData && inputs.marketData.foundPrice ? (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800/50 animate-fade-in">
                <div className="flex items-start gap-3">
                    <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1" />
                    <div>
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Preços de Referência:</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{inputs.marketData.analysis}"</p>
                        
                        <div className="mt-3 grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-2 rounded border border-purple-200 dark:border-purple-900">
                                <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                    <PackageCheck className="w-3 h-3" /> Kit (Hardware)
                                </span>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inputs.marketData.averageKitPricePerKwp)} <span className="text-[10px] font-normal">/kWp</span>
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-900">
                                <span className="text-[10px] text-green-700 dark:text-green-400 uppercase font-bold flex items-center gap-1">
                                   <Wrench className="w-3 h-3" /> Turnkey (Instalado)
                                </span>
                                <p className="text-sm font-bold text-green-800 dark:text-green-300">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inputs.customInstallationCost || 0)} <span className="text-[10px] font-normal">/kWp</span>
                                </p>
                                <p className="text-[9px] text-green-600 dark:text-green-500 leading-tight mt-0.5 opacity-80">+45% (Instalação e Projeto)</p>
                            </div>
                        </div>

                        {inputs.marketData.sources.length > 0 && (
                            <div className="mt-3">
                                <p className="text-[10px] text-slate-400 mb-1">Fontes:</p>
                                <div className="flex flex-wrap gap-2">
                                    {inputs.marketData.sources.map((source, idx) => (
                                        <a 
                                            key={idx}
                                            href={source.uri}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[150px]"
                                            title={source.title}
                                        >
                                            {source.title || 'Link Externo'}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-2 font-medium">
                            *Valores baseados em pesquisa online de Kits Geradores Intelbras e similares.
                        </p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clique em "Buscar Preços" para pesquisar valores de Kits Solares Intelbras, WEG e Canadian Solar em tempo real.
                </p>
            </div>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={onCalculate}
          className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
        >
          <Calculator className="w-5 h-5 text-yellow-400" />
          Calcular Sistema Ideal
        </button>
      </div>
    </div>
  );
};