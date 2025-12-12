import React, { useEffect, useState } from 'react';
import { SolarResults, SolarInputs, PanelRecommendation } from '../types';
import { fetchRecommendedPanels } from '../services/solarAi';
import { Tooltip } from './Tooltip';
import { PANEL_OPTIONS } from '../constants';
import { 
  CheckCircle, 
  AlertTriangle, 
  BatteryCharging, 
  LayoutGrid, 
  TrendingUp, 
  PiggyBank,
  Calendar,
  Zap,
  Map,
  Maximize,
  Sun,
  Activity,
  ArrowDown,
  FileSpreadsheet,
  Search,
  Box,
  BadgeCheck,
  Loader2,
  Ruler
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';

interface ResultsDashboardProps {
  results: SolarResults | null;
  inputs: SolarInputs;
  loading?: boolean;
  isDarkMode?: boolean;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, inputs, loading = false, isDarkMode = false }) => {
  const [recommendedPanels, setRecommendedPanels] = useState<PanelRecommendation[]>([]);
  const [loadingPanels, setLoadingPanels] = useState(false);

  // Effect to fetch recommended panels when results are ready
  useEffect(() => {
    if (results && !loading) {
      const loadPanels = async () => {
        setLoadingPanels(true);
        try {
          const panels = await fetchRecommendedPanels();
          setRecommendedPanels(panels);
        } catch (e) {
          console.error("Failed to load panel recommendations", e);
        } finally {
          setLoadingPanels(false);
        }
      };
      loadPanels();
    }
  }, [results, loading]);
  
  // Loading State
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300 animate-pulse">Calculando...</h3>
        <p className="text-slate-500 dark:text-slate-500 mt-2">Otimizando o sistema para sua área e consumo.</p>
      </div>
    );
  }

  // Safety check: if not loading but no results, don't render anything
  if (!results) return null;

  // Data for chart
  const savingsData = [
    { name: 'Ano 1', economia: results.annualSavings },
    { name: 'Ano 5', economia: results.annualSavings * 5 },
    { name: 'Ano 10', economia: results.annualSavings * 10 },
    { name: 'Ano 25', economia: results.annualSavings * 25 },
  ];

  // Helper for formatting currency
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Get selected panel details (Generic Fallback)
  const selectedPanel = PANEL_OPTIONS.find(p => p.id === inputs.selectedPanelId) || PANEL_OPTIONS[1];

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* Alert Logic for Partial Systems */}
      {results.isPartialSystem && (
        <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-orange-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-orange-800 dark:text-orange-300 font-bold">Atenção: Área Limitada</h3>
              <p className="text-orange-700 dark:text-orange-200 text-sm mt-1">
                A área disponível ({inputs.availableArea} m²) é menor que a necessária para cobrir 100% do seu consumo. 
                O sistema foi redimensionado para caber no seu telhado, cobrindo <strong>{results.coveragePercentage.toFixed(0)}%</strong> da sua conta.
              </p>
            </div>
          </div>
        </div>
      )}

      {!results.isPartialSystem && (
        <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm">
           <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            <h3 className="text-green-800 dark:text-green-300 font-bold">Área Suficiente! Cobertura de 100% Garantida.</h3>
          </div>
        </div>
      )}

      {/* CARD DE FÓRMULA / MEMÓRIA DE CÁLCULO */}
      <div className="bg-blue-900 dark:bg-blue-950 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <FileSpreadsheet className="w-32 h-32 text-white" />
        </div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 relative z-10">
            <Activity className="w-5 h-5 text-yellow-400" />
            Memória de Cálculo (Padrão Técnico)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 items-center">
          <div>
             <p className="text-sm text-blue-200 mb-2 font-mono">Fórmula Aplicada:</p>
             <div className="bg-blue-800/50 dark:bg-blue-900/50 p-4 rounded-lg border border-blue-700 font-mono text-center md:text-left">
                <div className="text-xl md:text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                   <span>P<span className="text-xs align-sub">FV</span> =</span>
                   <div className="flex flex-col items-center">
                      <span className="border-b border-white/30 px-2 pb-1">C</span>
                      <span className="pt-1">η<span className="text-xs align-sub">sistema</span> × I<span className="text-xs align-sub">md</span></span>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between border-b border-blue-800/50 pb-1">
               <span className="text-blue-300">C (Consumo Médio Diário):</span>
               <span className="font-bold">{results.dailyConsumption.toFixed(2)} kWh</span>
            </div>
            <div className="flex justify-between border-b border-blue-800/50 pb-1">
               <span className="text-blue-300">Imd (Irradiação/HSP):</span>
               <span className="font-bold">{Number(inputs.hsp).toFixed(2)} kWh/m²</span>
            </div>
            <div className="flex justify-between border-b border-blue-800/50 pb-1">
               <span className="text-blue-300">η (Eficiência Global):</span>
               <span className="font-bold">{results.performanceRatio} ({results.performanceRatio * 100}%)</span>
            </div>
            <div className="flex justify-between pt-1 text-yellow-400 font-bold text-base">
               <span>P<span className="text-xs align-sub">FV</span> Calculado:</span>
               <span>{results.systemSizeKWp.toFixed(2)} kWp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Power */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Potência Total
              <Tooltip content="Potência de pico total dos painéis somados (kWp). É a 'força' máxima do seu gerador." />
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white">
              {results.systemSizeKWp.toFixed(2)} <span className="text-lg text-slate-400 font-normal">kWp</span>
            </div>
          </div>
        </div>

        {/* Panel Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2 text-sm font-medium">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Qtd. Painéis ({results.panelPowerUsed}W)
              <Tooltip content={`Quantidade exata de módulos de ${results.panelPowerUsed}W necessários para compor a potência calculada.`} />
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white">
              {results.panelCount} <span className="text-lg text-slate-400 font-normal">unid.</span>
            </div>
          </div>
        </div>

        {/* Monthly Generation */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="relative z-10">
            <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2 text-sm font-medium">
              <BatteryCharging className="w-4 h-4 mr-2" />
              Geração Mês
              <Tooltip content="Estimativa de energia produzida mensalmente considerando as perdas do sistema." />
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white">
              {Math.floor(results.monthlyGeneration)} <span className="text-lg text-slate-400 font-normal">kWh</span>
            </div>
           </div>
        </div>

        {/* Investment */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="relative z-10">
            <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2 text-sm font-medium">
              <PiggyBank className="w-4 h-4 mr-2" />
              Investimento
              <Tooltip content="Valor aproximado de mercado para um sistema 'chave na mão' deste porte." />
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white">
              {formatCurrency(results.totalInvestment)}
            </div>
           </div>
        </div>
      </div>

      {/* AI RECOMMENDED PANELS SECTION */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recomendações de Mercado (Intelbras & Tier 1)</h3>
          {loadingPanels && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
        
        {loadingPanels ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Buscando modelos recentes da Intelbras e fabricantes Tier-1 na web...</p>
          </div>
        ) : recommendedPanels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedPanels.map((panel, idx) => {
              // CALCULATION LOGIC: Recalculate quantity based on specific panel power
              // Formula: Quantity = Ceil(SystemKWp * 1000 / PanelWattage)
              const specificQty = Math.ceil((results.systemSizeKWp * 1000) / panel.power);
              const panelArea = panel.width * panel.height;
              const specificArea = specificQty * panelArea;
              const efficiency = (panel.power / (panelArea * 1000)) * 100;
              
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full">
                   {panel.brand.toLowerCase().includes('intelbras') && (
                      <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] px-2 py-0.5 font-bold uppercase rounded-bl z-10">Recomendado</div>
                   )}
                   
                   {/* Header */}
                   <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{panel.brand}</span>
                        <BadgeCheck className={`w-5 h-5 ${panel.brand.toLowerCase().includes('intelbras') ? 'text-green-500 dark:text-green-400' : 'text-blue-400'}`} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-snug">{panel.model}</h4>
                      <div className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded mt-1 font-medium border border-blue-100 dark:border-blue-900">
                        {panel.technology}
                      </div>
                   </div>
                   
                   {/* Technical Specs Grid */}
                   <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                         <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                            <Zap className="w-3 h-3" />
                            <span className="text-[10px] uppercase font-bold">Potência</span>
                         </div>
                         <p className="font-bold text-slate-700 dark:text-slate-300">{panel.power} W</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                         <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                            <Activity className="w-3 h-3" />
                            <span className="text-[10px] uppercase font-bold">Eficiência</span>
                         </div>
                         <p className="font-bold text-slate-700 dark:text-slate-300">{efficiency.toFixed(1)}%</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 col-span-2">
                         <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                            <Ruler className="w-3 h-3" />
                            <span className="text-[10px] uppercase font-bold">Dimensões (L x A)</span>
                         </div>
                         <p className="font-bold text-slate-700 dark:text-slate-300 text-sm font-mono">{panel.width.toFixed(2)}m x {panel.height.toFixed(2)}m <span className="text-slate-400 font-normal">({panelArea.toFixed(2)}m²)</span></p>
                      </div>
                   </div>
                   
                   {/* Results Footer */}
                   <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-sm text-slate-600 dark:text-slate-400">Qtd. Necessária:</span>
                         <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{specificQty} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">unid.</span></span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                         <span>Área Total Estimada:</span>
                         <span>~{specificArea.toFixed(1)} m²</span>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
             <p className="text-sm text-slate-500 dark:text-slate-400">Não foi possível carregar sugestões online no momento. O cálculo acima permanece válido.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Area Visualization */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
            <Map className="w-5 h-5 mr-2 text-blue-500" />
            Ocupação do Telhado (Painel Genérico)
          </h3>
          
          {/* Progress Bar */}
          <div className="mb-6">
             <div className="flex justify-between text-sm mb-2 text-slate-600 dark:text-slate-400">
                <span>Área Utilizada: <span className="font-bold text-slate-800 dark:text-white">{results.areaOccupied.toFixed(1)} m²</span></span>
                <span>Disponível: <span className="font-bold text-slate-800 dark:text-white">{inputs.availableArea} m²</span></span>
             </div>
             
             <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-6 relative overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${results.isPartialSystem ? 'bg-orange-400' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((results.areaOccupied / inputs.availableArea) * 100, 100)}%` }}
                ></div>
             </div>
             <p className="text-xs text-slate-400 mt-2 text-right">
               Considerando módulos de {results.panelPowerUsed}W
             </p>
          </div>

          {/* SECTION: PANEL SPECS */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mb-6">
             <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Especificações do Painel Selecionado
             </h4>
             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                   <div className="bg-white dark:bg-slate-900 p-2 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">
                      <Maximize className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{selectedPanel.label}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Potência Nominal: {selectedPanel.powerW}W</p>
                   </div>
                </div>
                <div className="text-left sm:text-right pl-11 sm:pl-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Dimensões (L x A)</span>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 inline-block">
                      {selectedPanel.width.toFixed(2)}m x {selectedPanel.height.toFixed(2)}m
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Área Unitária: {selectedPanel.area.toFixed(2)}m²</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
             <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Economia Mensal</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(results.monthlySavings)}</p>
             </div>
             <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Economia Anual</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(results.annualSavings)}</p>
             </div>
          </div>
        </div>

        {/* CARD DE EFICIÊNCIA E PERDAS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
           <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <Sun className="w-5 h-5 mr-2 text-orange-500" />
                Balanço Energético Diário
              </h3>

               {/* New Daily Stats Grid */}
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Consumo (C)</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">{results.dailyConsumption.toFixed(2)} kWh</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-600 dark:text-green-400 uppercase font-bold">Geração Est.</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">{results.dailyGeneration.toFixed(2)} kWh</p>
                  </div>
               </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-4">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Eficiência Global (PR)</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{(results.performanceRatio * 100).toFixed(0)}%</span>
                 </div>
                 <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full mb-1">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${results.performanceRatio * 100}%` }}></div>
                 </div>
              </div>

              <div className="space-y-3">
                 <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Fatores de Perda ({results.systemLossesPercentage.toFixed(0)}%):</p>
                 
                 <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded text-red-600 dark:text-red-400"><ArrowDown className="w-3 h-3" /></div>
                    <div className="flex-1">
                       <p className="font-medium text-slate-700 dark:text-slate-300">Térmica e Elétrica</p>
                       <p className="text-xs text-slate-500 dark:text-slate-500">Inversor, Cabos e Calor</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Payback Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Retorno do Investimento (ROI)
          </h3>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savingsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{fontSize: 12, fill: isDarkMode ? '#cbd5e1' : '#475569'}} />
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(Number(value))} 
                  contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                />
                <Legend wrapperStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                <Bar name="Economia Acumulada" dataKey="economia" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
                <ReferenceLine 
                  x={results.totalInvestment} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  strokeWidth={2}
                  label={{ 
                    value: `Investimento: ${formatCurrency(results.totalInvestment)}`, 
                    position: 'insideTopRight', 
                    fill: '#ef4444', 
                    fontSize: 12,
                    fontWeight: 'bold',
                    dy: -5 
                  }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
             <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Payback Estimado:</span>
             </div>
             <span className="text-xl font-bold text-slate-800 dark:text-white">
               {(results.paybackMonths / 12).toFixed(1).replace('.', ',')} Anos
             </span>
          </div>
        </div>

      </div>
    </div>
  );
};