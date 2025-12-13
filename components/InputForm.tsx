
import React, { useState } from 'react';
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
  Percent,
  PackageCheck,
  Wrench,
  Maximize2,
  Target,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  ZapOff,
  CloudFog,
  Gauge,
  X,
  Lightbulb,
  Trees,
  Building2,
  ArrowRight,
  MousePointerClick
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
  const [showShadeModal, setShowShadeModal] = useState(false);

  const handleChange = (field: keyof SolarInputs, value: string | number) => {
    onChange({
      ...inputs,
      [field]: value,
    });
  };

  const handleHistoryChange = (index: number, value: string) => {
    const newHistory = [...inputs.consumptionHistory];
    newHistory[index] = value;
    
    const validValues = newHistory
      .map(v => typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v)
      .filter(v => !isNaN(v as number) && (v as number) > 0) as number[];

    const sum = validValues.reduce((a, b) => a + b, 0);
    const average = validValues.length > 0 ? sum / validValues.length : 0;

    onChange({
      ...inputs,
      consumptionHistory: newHistory,
      monthlyConsumption: parseFloat(average.toFixed(2))
    });
  };

  const handleDailyChange = (value: string) => {
    const numValue = parseFloat(value.replace(',', '.'));
    const safeDaily = isNaN(numValue) ? 0 : numValue;
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

      let estimatedCostPerKwp = 0;
      if (marketData.averageKitPricePerKwp > 0) {
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

  const getShadeRiskConfig = (analysis: string) => {
    const lower = analysis.toLowerCase();
    
    if (lower.includes('alto') || lower.includes('crítico') || lower.includes('muit') || lower.includes('edifícios')) {
        return {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-800 dark:text-red-300',
            iconColor: 'text-red-500',
            Icon: AlertTriangle,
            label: 'Risco Alto Detectado',
            level: 'HIGH'
        };
    }
    
    if (lower.includes('médio') || lower.includes('moderado') || lower.includes('parcial') || lower.includes('algum')) {
        return {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-200 dark:border-orange-800',
            text: 'text-orange-800 dark:text-orange-300',
            iconColor: 'text-orange-500',
            Icon: AlertCircle,
            label: 'Risco Moderado',
            level: 'MEDIUM'
        };
    }
    
    return {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-800 dark:text-emerald-300',
        iconColor: 'text-emerald-500',
        Icon: CheckCircle2,
        label: 'Local Adequado',
        level: 'LOW'
    };
  };

  const getShadeAdvice = (analysis: string) => {
      const lower = analysis.toLowerCase();
      const advice = {
          tech: "Inversor String Padrão",
          action: "Instalação Convencional",
          detail: "O local parece livre de obstruções significativas."
      };

      if (lower.includes('árvore') || lower.includes('vegetação')) {
          advice.action = "Poda ou Reposicionamento";
          advice.detail = "Vegetação próxima pode crescer e reduzir a geração em até 40% nos horários de pico.";
      } else if (lower.includes('edifícios') || lower.includes('prédio') || lower.includes('construç')) {
          advice.action = "Estudo de Layout 3D";
          advice.detail = "Edificações vizinhas criam sombras 'duras'. Evite instalar módulos próximos a muros altos.";
      }

      if (lower.includes('parcial') || lower.includes('médio') || lower.includes('alto')) {
          advice.tech = "Microinversores ou Otimizadores";
          advice.detail += " O uso de eletrônica de potência a nível de módulo (MLPE) é altamente recomendado para evitar que uma sombra afete todo o sistema.";
      }

      return advice;
  };

  const currentLosses = Number(inputs.systemLosses) || 0;
  const calculatedPR = (100 - currentLosses) / 100;
  const isAreaMode = inputs.calculationBasis === 'area';
  const shadeConfig = inputs.foundLocation ? getShadeRiskConfig(inputs.foundLocation.shadeAnalysis) : null;
  const shadeAdvice = inputs.foundLocation ? getShadeAdvice(inputs.foundLocation.shadeAnalysis) : null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-6 md:p-8 border border-white/40 dark:border-slate-800/60 space-y-8 relative overflow-hidden transition-all duration-300">
      
      {/* Glossy Top Highlight */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-slate-500/50"></div>

      {/* SEÇÃO 1: OBJETIVO (CARDS SELECIONÁVEIS) */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
             <Target className="w-5 h-5 text-orange-500" />
             <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qual seu objetivo?</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleChange('calculationBasis', 'consumption')}
            className={`relative group p-4 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 text-center active:scale-95 ${
              !isAreaMode 
                ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800/50 shadow-lg shadow-orange-500/10' 
                : 'bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
             <div className={`p-3 rounded-2xl transition-colors ${!isAreaMode ? 'bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-200' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}`}>
                <Zap className="w-6 h-6" />
             </div>
             <div>
                <span className={`block font-bold text-sm ${!isAreaMode ? 'text-orange-900 dark:text-orange-100' : 'text-slate-600 dark:text-slate-400'}`}>Zerar a Conta</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-80">Cobrir consumo atual</span>
             </div>
             {!isAreaMode && <div className="absolute top-3 right-3 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>}
          </button>

          <button
            onClick={() => handleChange('calculationBasis', 'area')}
            className={`relative group p-4 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 text-center active:scale-95 ${
              isAreaMode 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50 shadow-lg shadow-blue-500/10' 
                : 'bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
             <div className={`p-3 rounded-2xl transition-colors ${isAreaMode ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}`}>
                <Maximize2 className="w-6 h-6" />
             </div>
             <div>
                <span className={`block font-bold text-sm ${isAreaMode ? 'text-blue-900 dark:text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>Maximizar Teto</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-80">Usar toda área disponível</span>
             </div>
             {isAreaMode && <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
          </button>
        </div>
      </section>

      {/* SEÇÃO 2: LOCALIZAÇÃO (BUSCA INTELIGENTE) */}
      <section className="relative group">
         <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-indigo-300 dark:from-blue-800 dark:to-indigo-800 rounded-3xl opacity-0 group-focus-within:opacity-50 transition duration-500 blur-sm"></div>
         <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-1 flex items-center shadow-sm">
             <div className="pl-4 pr-2 text-slate-400">
                <Search className="w-5 h-5" />
             </div>
             <input 
                type="text" 
                placeholder="Busca por endereço (ex: Av. Paulista, 1000)"
                className="w-full py-4 bg-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400 text-sm font-medium"
                value={inputs.addressSearch || ''}
                onChange={(e) => handleChange('addressSearch', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
             />
             <button 
                onClick={handleAddressSearch}
                disabled={isSearchingAddress}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 mr-1"
             >
                {isSearchingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar HSP'}
             </button>
         </div>
         {searchError && <p className="absolute -bottom-6 left-2 text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">{searchError}</p>}
      </section>

      {/* RESULTADO DA BUSCA (LOCATION CARD) */}
      {inputs.foundLocation && shadeConfig && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-start">
               <div className="flex gap-3">
                   <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-amber-500 shrink-0">
                       <Sun className="w-5 h-5" />
                   </div>
                   <div>
                       <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Irradiação Encontrada</p>
                       <p className="text-lg font-bold text-slate-800 dark:text-white">{Number(inputs.hsp).toFixed(2)} <span className="text-xs font-normal text-slate-500">kWh/m²</span></p>
                       <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] truncate">{inputs.foundLocation.address}</p>
                   </div>
               </div>
               
               <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${shadeConfig.bg} ${shadeConfig.border}`}>
                   <shadeConfig.Icon className={`w-4 h-4 ${shadeConfig.iconColor}`} />
                   <div className="text-right">
                       <span className={`block text-[10px] font-bold ${shadeConfig.text}`}>{shadeConfig.label}</span>
                       {shadeConfig.level !== 'LOW' && (
                         <button onClick={() => setShowShadeModal(true)} className="text-[9px] underline opacity-80 hover:opacity-100">Ver detalhes</button>
                       )}
                   </div>
               </div>
            </div>
        </div>
      )}

      {/* SEÇÃO 3: CONSUMO (INTERACTIVE SLIDER TABS) */}
      <section className={`transition-all duration-500 ${isAreaMode ? 'opacity-50 grayscale' : 'opacity-100'}`}>
         <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex relative mb-6">
             {/* Slider Background */}
             <div 
               className="absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-slate-600 shadow-sm transition-all duration-300 ease-out z-0"
               style={{ 
                 left: inputs.consumptionMode === 'average' ? '0.375rem' : inputs.consumptionMode === 'history' ? '33.33%' : '66.66%',
                 width: 'calc(33.33% - 0.5rem)'
               }}
             ></div>

             {[
               {id: 'average', icon: Zap, label: 'Média'}, 
               {id: 'history', icon: Calendar, label: 'Histórico'}, 
               {id: 'daily', icon: Clock, label: 'Diário'}
             ].map((mode) => (
               <button
                 key={mode.id}
                 onClick={() => handleChange('consumptionMode', mode.id as any)}
                 className={`flex-1 relative z-10 py-2.5 text-xs font-bold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors duration-300 ${
                   inputs.consumptionMode === mode.id 
                   ? 'text-slate-800 dark:text-white' 
                   : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                 }`}
               >
                 <mode.icon className={`w-4 h-4 ${inputs.consumptionMode === mode.id ? 'text-orange-500' : ''}`} /> 
                 {mode.label}
               </button>
             ))}
         </div>

         {/* Conteúdo Dinâmico das Abas */}
         <div className="min-h-[100px]">
            {inputs.consumptionMode === 'average' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">Consumo Mensal (kWh)</label>
                  <div className="relative group focus-within:ring-4 focus-within:ring-orange-100 dark:focus-within:ring-orange-900/20 rounded-2xl transition-all">
                      <input
                        type="number"
                        min="0"
                        onWheel={handleWheel}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-5 text-3xl font-bold text-slate-800 dark:text-white outline-none placeholder-slate-300"
                        placeholder="0"
                        value={inputs.monthlyConsumption || ''}
                        onChange={(e) => handleChange('monthlyConsumption', e.target.value)}
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">kWh</span>
                  </div>
              </div>
            )}

            {inputs.consumptionMode === 'history' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-xs font-bold text-slate-500 uppercase">12 Meses</span>
                     <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">Média: {Number(inputs.monthlyConsumption).toFixed(0)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {MONTHS.map((month, idx) => (
                      <div key={idx} className="relative group">
                          <input
                            type="number"
                            onWheel={handleWheel}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-3 text-sm font-bold text-center outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder-transparent"
                            placeholder="0"
                            value={inputs.consumptionHistory[idx] || ''}
                            onChange={(e) => handleHistoryChange(idx, e.target.value)}
                          />
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-1 text-[9px] font-bold text-slate-400 group-hover:text-orange-500 transition-colors uppercase">{month}</span>
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {inputs.consumptionMode === 'daily' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">Consumo Diário (kWh/dia)</label>
                   <div className="flex items-center gap-4">
                      <div className="flex-1 relative group focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/20 rounded-2xl transition-all">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          onWheel={handleWheel}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-5 text-3xl font-bold text-slate-800 dark:text-white outline-none placeholder-slate-300"
                          placeholder="0"
                          value={inputs.dailyConsumption || ''}
                          onChange={(e) => handleDailyChange(e.target.value)}
                        />
                      </div>
                      <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                      <div className="text-right min-w-[100px]">
                         <span className="block text-xs text-slate-400 font-bold uppercase">Mensal Est.</span>
                         <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Number(inputs.monthlyConsumption).toFixed(0)}</span>
                      </div>
                   </div>
              </div>
            )}
         </div>
      </section>

      {/* SEÇÃO 4: DETALHES TÉCNICOS (GRID) */}
      <section className="grid grid-cols-2 gap-4">
          <div className="col-span-1 bg-white/50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-50 transition-all">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">
                  <DollarSign className="w-3 h-3" /> Tarifa (R$/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-transparent text-lg font-bold text-slate-800 dark:text-white outline-none p-0"
                placeholder="0.92"
                onWheel={handleWheel}
                value={inputs.energyTariff || ''}
                onChange={(e) => handleChange('energyTariff', e.target.value)}
              />
          </div>

          <div className={`col-span-1 bg-white/50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all ${isAreaMode ? 'ring-2 ring-blue-100 border-blue-300' : ''}`}>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1 justify-between w-full">
                  <span className="flex items-center gap-1"><Map className="w-3 h-3" /> Área (m²)</span>
                  {isAreaMode && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
              </label>
              <input
                type="number"
                className="w-full bg-transparent text-lg font-bold text-slate-800 dark:text-white outline-none p-0"
                placeholder="40"
                onWheel={handleWheel}
                value={inputs.availableArea || ''}
                onChange={(e) => handleChange('availableArea', e.target.value)}
              />
          </div>

          <div className="col-span-1 bg-white/50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">
                  <LayoutGrid className="w-3 h-3" /> Módulo
              </label>
              <select
                className="w-full bg-transparent text-sm font-bold text-slate-800 dark:text-white outline-none p-0 cursor-pointer appearance-none truncate pr-4"
                value={inputs.selectedPanelId}
                onChange={(e) => handleChange('selectedPanelId', e.target.value)}
              >
                 {PANEL_OPTIONS.map((panel) => (
                    <option key={panel.id} value={panel.id}>{panel.powerW}W</option>
                 ))}
              </select>
          </div>

          <div className="col-span-1 bg-white/50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
               <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">
                  <Percent className="w-3 h-3" /> Perdas
              </label>
              <input
                type="number"
                className="w-full bg-transparent text-lg font-bold text-slate-800 dark:text-white outline-none p-0"
                placeholder="25"
                onWheel={handleWheel}
                value={inputs.systemLosses}
                onChange={(e) => handleChange('systemLosses', e.target.value)}
              />
          </div>
      </section>

      {/* EFICIÊNCIA BAR */}
      <div className="flex items-center gap-3 px-1">
         <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-orange-400 to-emerald-400 transition-all duration-1000" style={{ width: `${calculatedPR * 100}%` }}></div>
         </div>
         <span className="text-[10px] font-bold text-slate-400 uppercase">PR {(calculatedPR * 100).toFixed(0)}%</span>
      </div>

      {/* MERCADO E PREÇOS */}
      <div className="pt-2">
         <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Referência de Mercado</span>
            <button 
                onClick={handleMarketSearch} 
                disabled={isSearchingMarket}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-bold disabled:opacity-50"
            >
                {isSearchingMarket ? 'Atualizando...' : 'Atualizar Preços'}
            </button>
         </div>
         {marketError && <p className="text-[10px] text-red-500 mb-1">{marketError}</p>}
         <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30 flex justify-between items-center">
             <div>
                 <span className="block text-[10px] text-purple-600 dark:text-purple-300 font-bold uppercase">Preço Kit</span>
                 <span className="text-sm font-bold text-slate-800 dark:text-white">{inputs.marketData?.foundPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inputs.marketData.averageKitPricePerKwp) : '-'} <span className="text-[10px] font-normal text-slate-400">/kWp</span></span>
             </div>
             <div className="h-6 w-px bg-purple-200 dark:bg-purple-800/50"></div>
             <div className="text-right">
                 <span className="block text-[10px] text-emerald-600 dark:text-emerald-300 font-bold uppercase">Turnkey</span>
                 <span className="text-sm font-bold text-slate-800 dark:text-white">{inputs.customInstallationCost ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inputs.customInstallationCost) : '-'} <span className="text-[10px] font-normal text-slate-400">/kWp</span></span>
             </div>
         </div>
      </div>

      {/* CTA PRINCIPAL (CALCULATE) */}
      <div className="pt-2">
         <button
            onClick={onCalculate}
            className="w-full relative group overflow-hidden rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 active:shadow-none"
         >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:from-orange-400 group-hover:to-amber-400 transition-colors"></div>
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-shine"></div>
            
            <div className="relative py-4 px-6 flex items-center justify-center gap-3">
                <Calculator className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg tracking-wide uppercase">
                {isAreaMode ? "Calcular Potência" : "Simular Economia"}
                </span>
            </div>
         </button>
      </div>

      {/* MODAL DETALHES DE SOMBREAMENTO (Mantido para consistência) */}
      {showShadeModal && shadeConfig && shadeAdvice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowShadeModal(false)}></div>
              
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className={`p-6 ${shadeConfig.bg} border-b ${shadeConfig.border} flex justify-between items-start`}>
                      <div className="flex items-center gap-3">
                          <div className={`p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm ${shadeConfig.text}`}>
                             <shadeConfig.Icon className="w-6 h-6" />
                          </div>
                          <div>
                              <h3 className={`text-lg font-bold ${shadeConfig.text}`}>Análise Detalhada</h3>
                              <p className="text-xs text-slate-600 dark:text-slate-300 opacity-90">Impacto do Sombreamento</p>
                          </div>
                      </div>
                      <button onClick={() => setShowShadeModal(false)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  <div className="p-6 space-y-6">
                      <div className="space-y-3">
                          <div className="flex items-start gap-3">
                             <Search className="w-5 h-5 text-slate-400 mt-1" />
                             <div>
                                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">O que detectamos</p>
                                 <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                                     {inputs.foundLocation?.shadeAnalysis}
                                 </p>
                             </div>
                          </div>
                          <div className="h-px bg-slate-100 dark:bg-slate-800 w-full my-2"></div>
                          <div className="flex items-start gap-3">
                             <Trees className="w-5 h-5 text-emerald-500 mt-1" />
                             <div>
                                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnóstico Técnico</p>
                                 <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                     {shadeAdvice.detail}
                                 </p>
                             </div>
                          </div>
                          <div className="flex items-start gap-3">
                             <Wrench className="w-5 h-5 text-blue-500 mt-1" />
                             <div>
                                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ação Recomendada</p>
                                 <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                                     {shadeAdvice.action}
                                 </p>
                             </div>
                          </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-2 text-amber-500">
                              <Lightbulb className="w-5 h-5" />
                              <span className="font-bold text-sm">Tecnologia Sugerida</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-sm">
                              Para este cenário, recomenda-se fortemente o uso de <strong>{shadeAdvice.tech}</strong> para mitigar perdas de geração.
                          </p>
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                      <button 
                        onClick={() => setShowShadeModal(false)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
                      >
                          Entendi
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
