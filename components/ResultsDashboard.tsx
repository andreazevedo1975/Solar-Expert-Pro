
import React, { useEffect, useState } from 'react';
import { jsPDF } from "jspdf";
import { SolarResults, SolarInputs, PanelRecommendation } from '../types';
import { fetchRecommendedPanels } from '../services/solarAi';
import { Tooltip } from './Tooltip';
import { PANEL_OPTIONS, ENERGY_INFLATION_RATE, PANEL_DEGRADATION_RATE } from '../constants';
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
  BadgeCheck,
  Loader2,
  Ruler,
  LineChart as LineChartIcon,
  Download,
  FileText,
  Landmark,
  Percent,
  CalendarClock,
  Wallet,
  Scale,
  CreditCard,
  Calculator,
  Leaf,
  Layers,
  Box,
  Scan,
  Sparkles,
  SlidersHorizontal,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
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
  const [showFinancing, setShowFinancing] = useState(false);
  const [interestRate, setInterestRate] = useState(1.49);
  const [loanTerm, setLoanTerm] = useState(60);
  
  // State for Generation Scenarios
  const [simulatedLoss, setSimulatedLoss] = useState(25);

  useEffect(() => {
    if (results && !loading) {
      setSimulatedLoss(results.systemLossesPercentage);
      
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

  const handleDownloadPDF = () => {
    if (!results) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SolarExpert Pro", 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório Técnico de Dimensionamento Fotovoltaico", 20, 28);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 20, { align: 'right' });
    y = 50;
    doc.setTextColor(0, 0, 0);
    const addSectionTitle = (title: string) => {
        doc.setFillColor(241, 245, 249); 
        doc.rect(15, y - 6, pageWidth - 30, 10, 'F');
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(title, 20, y);
        y += 12;
    };
    const addRow = (label: string, value: string, label2?: string, value2?: string) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139); 
        doc.text(label, 20, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(value, 80, y);
        if (label2 && value2) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 116, 139);
            doc.text(label2, 110, y);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(value2, 160, y);
        }
        y += 8;
    };
    addSectionTitle("1. Parâmetros do Projeto");
    addRow("Consumo Considerado:", `${results.dailyConsumption.toFixed(2)} kWh/dia`, "Tarifa de Energia:", `R$ ${Number(inputs.energyTariff).toFixed(2)}`);
    addRow("Localização (HSP):", `${Number(inputs.hsp).toFixed(2)} kWh/m².dia`, "Área Disponível:", `${inputs.availableArea} m²`);
    if (inputs.foundLocation) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Endereço: ${inputs.foundLocation.address}`, 20, y);
        y += 8;
    }
    addRow("Modo de Cálculo:", inputs.calculationBasis === 'area' ? "Maximizar Área" : "Cobrir Consumo");
    y += 5;
    addSectionTitle("2. Dimensionamento Técnico");
    addRow("Potência do Sistema:", `${results.systemSizeKWp.toFixed(2)} kWp`, "Geração Média:", `${Math.floor(results.monthlyGeneration)} kWh/mês`);
    addRow("Qtd. Painéis:", `${results.panelCount} x ${results.panelPowerUsed}W`, "Área Ocupada:", `${results.areaOccupied.toFixed(2)} m²`);
    addRow("Eficiência Global (PR):", `${(results.performanceRatio * 100).toFixed(0)}%`, "Cobertura:", `${results.coveragePercentage.toFixed(0)}%`);
    y += 5;
    addSectionTitle("3. Viabilidade Financeira (Estimada)");
    const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    addRow("Investimento Total:", fmtBRL(results.totalInvestment));
    addRow("Economia 1º Ano:", fmtBRL(results.annualSavings));
    addRow("Payback Estimado:", `${(results.paybackMonths / 12).toFixed(1)} Anos`);
    addRow("Total Economizado (30 anos):", fmtBRL(results.financialProjection[results.financialProjection.length - 1].accumulatedSavings));
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(150);
    const disclaimer = `Premissas: Inflação Energética ${(ENERGY_INFLATION_RATE * 100).toFixed(1)}% a.a. | Degradação dos Módulos ${(PANEL_DEGRADATION_RATE * 100).toFixed(1)}% a.a.`;
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 40);
    doc.text(splitDisclaimer, 20, y + 10);
    doc.save(`SolarExpert_Relatorio_${new Date().toISOString().slice(0,10)}.pdf`);
  };
  
  if (loading) {
    return (
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="relative">
             <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
             <Sun className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-orange-500 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-700 dark:text-white mt-6">Otimizando Sistema...</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Nossa IA está calculando irradiação, perdas e retorno financeiro.</p>
      </div>
    );
  }

  if (!results) return null;

  const chartData = results.financialProjection.map(yearData => ({
    name: `Ano ${yearData.year}`,
    accumulated: yearData.accumulatedSavings,
    investment: results.totalInvestment
  }));

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const calculateFinancing = () => {
    const pv = results.totalInvestment;
    const i = interestRate / 100;
    const n = loanTerm;
    let pmt = 0;
    if (i === 0) {
        pmt = pv / n;
    } else {
        pmt = pv * ( (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) );
    }
    const totalFinanced = pmt * n;
    const totalInterest = totalFinanced - pv;
    const monthlyCashFlow = results.monthlySavings - pmt;
    return { pmt, totalFinanced, totalInterest, monthlyCashFlow };
  };

  const financingData = calculateFinancing();

  // Scenario Logic
  const rawMonthlyGen = results.monthlyGeneration / results.performanceRatio;
  const simulatedPR = (100 - simulatedLoss) / 100;
  const simulatedMonthlyGen = rawMonthlyGen * simulatedPR;
  const simulatedDiff = simulatedMonthlyGen - results.monthlyGeneration;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/40 dark:border-slate-800 shadow-sm">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BadgeCheck className="w-6 h-6 text-emerald-500" />
            Resultado da Simulação
         </h2>
         <div className="flex gap-3 w-full md:w-auto">
            <button 
                onClick={() => setShowFinancing(!showFinancing)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm transform active:scale-95 ${
                    showFinancing 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
                <Landmark className="w-4 h-4" />
                {showFinancing ? 'Ocultar Financiamento' : 'Simular Financiamento'}
            </button>
            <button 
                onClick={handleDownloadPDF}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
            >
                <Download className="w-4 h-4" />
                PDF
            </button>
         </div>
      </div>

      {/* Main KPI Cards - VIBRANT GRADIENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Potência */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-amber-500/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 transition-transform duration-300 group-hover:scale-105"></div>
          <div className="absolute top-0 right-0 p-4 opacity-20">
             <Zap className="w-24 h-24 transform rotate-12 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
             <p className="text-amber-100 font-medium text-sm mb-1">Potência do Sistema</p>
             <h3 className="text-4xl font-bold mb-2">{results.systemSizeKWp.toFixed(2)} <span className="text-xl font-normal opacity-80">kWp</span></h3>
             <div className="flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                <LayoutGrid className="w-3 h-3" /> {results.panelCount} Painéis
             </div>
          </div>
        </div>

        {/* Geração */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 transition-transform duration-300 group-hover:scale-105"></div>
          <div className="absolute top-0 right-0 p-4 opacity-20">
             <BatteryCharging className="w-24 h-24 transform rotate-12 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
             <p className="text-blue-100 font-medium text-sm mb-1">Geração Mensal Est.</p>
             <h3 className="text-4xl font-bold mb-2">{Math.floor(results.monthlyGeneration)} <span className="text-xl font-normal opacity-80">kWh</span></h3>
             <div className="flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                <Leaf className="w-3 h-3" /> Sustentável
             </div>
          </div>
        </div>

        {/* Investimento */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-slate-500/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-800 transition-transform duration-300 group-hover:scale-105"></div>
          <div className="absolute top-0 right-0 p-4 opacity-20">
             <PiggyBank className="w-24 h-24 transform rotate-12 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
             <p className="text-slate-300 font-medium text-sm mb-1">Investimento Estimado</p>
             <h3 className="text-3xl font-bold mb-2">{formatCurrency(results.totalInvestment)}</h3>
             <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm text-slate-200">
                Retorno em {(results.paybackMonths / 12).toFixed(1)} Anos
             </div>
          </div>
        </div>

        {/* Economia Anual */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 transition-transform duration-300 group-hover:scale-105"></div>
          <div className="absolute top-0 right-0 p-4 opacity-20">
             <TrendingUp className="w-24 h-24 transform rotate-12 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
             <p className="text-emerald-100 font-medium text-sm mb-1">Economia 1º Ano</p>
             <h3 className="text-3xl font-bold mb-2">{formatCurrency(results.annualSavings)}</h3>
             <div className="flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                Livre de Inflação
             </div>
          </div>
        </div>
      </div>

      {/* FINANCING SIMULATOR PANEL */}
      {showFinancing && (
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 animate-fade-in shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
                   <Landmark className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Simulador de Crédito Solar</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Substitua sua conta de luz pela parcela do financiamento.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                {/* Inputs do Financiamento */}
                <div className="lg:col-span-4 space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Percent className="w-4 h-4 text-emerald-500" /> Taxa de Juros (a.m.)
                            </label>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg">{interestRate.toFixed(2)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="4.0" 
                            step="0.01" 
                            value={interestRate}
                            onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                            className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <CalendarClock className="w-4 h-4 text-emerald-500" /> Prazo (Meses)
                            </label>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg">{loanTerm}x</span>
                        </div>
                        <input 
                            type="range" 
                            min="12" 
                            max="120" 
                            step="12" 
                            value={loanTerm}
                            onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                        />
                    </div>
                </div>

                {/* Cards de Resultado do Financiamento */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Balança Financeira */}
                     <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Scale className="w-4 h-4" /> Fluxo de Caixa
                            </h4>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Economia Mensal</p>
                                    <p className="text-2xl font-bold text-emerald-500">{formatCurrency(results.monthlySavings)}</p>
                                </div>
                                <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-4"></div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 mb-1">Parcela Estimada</p>
                                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{formatCurrency(financingData.pmt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-2xl flex items-center gap-4 ${financingData.monthlyCashFlow >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                            <div className={`p-2 rounded-full ${financingData.monthlyCashFlow >= 0 ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-red-200 dark:bg-red-800'}`}>
                                {financingData.monthlyCashFlow >= 0 ? <TrendingUp className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold">
                                    {financingData.monthlyCashFlow >= 0 ? "Fluxo Positivo!" : "Fluxo Negativo"}
                                </p>
                                <p className="text-xs opacity-80 leading-tight">
                                    {financingData.monthlyCashFlow >= 0 
                                        ? `Sobra ${formatCurrency(financingData.monthlyCashFlow)} no bolso todo mês.` 
                                        : `Diferença de ${formatCurrency(Math.abs(financingData.monthlyCashFlow))} a pagar.`}
                                </p>
                            </div>
                        </div>
                     </div>

                     {/* Tabela Resumo */}
                     <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg flex flex-col justify-center">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-sm text-slate-500 flex items-center gap-2"><CreditCard className="w-4 h-4"/> Valor à Vista</span>
                                <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(results.totalInvestment)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-sm text-slate-500 flex items-center gap-2"><Calculator className="w-4 h-4"/> Total Financiado</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(financingData.totalFinanced)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 flex items-center gap-2"><Percent className="w-4 h-4"/> Juros Totais</span>
                                <span className="font-bold text-red-500">{formatCurrency(financingData.totalInterest)}</span>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      )}

      {/* AI RECOMMENDED PANELS - BENTO GRID REFACTOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 blur-lg opacity-20 rounded-full"></div>
            <div className="relative p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
               <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
             <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-none">Inteligência de Mercado</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Comparativo de tecnologias disponíveis via IA</p>
          </div>
          {loadingPanels && <Loader2 className="w-5 h-5 animate-spin text-slate-400 ml-auto" />}
        </div>
        
        {loadingPanels ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-pulse flex flex-col p-6">
                 <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
                 <div className="w-3/4 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6"></div>
                 <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                 </div>
              </div>
            ))}
          </div>
        ) : recommendedPanels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedPanels.map((panel, idx) => {
              const specificQty = Math.ceil((results.systemSizeKWp * 1000) / panel.power);
              const panelArea = panel.width * panel.height;
              const specificArea = specificQty * panelArea;
              const efficiency = (panel.power / (panelArea * 1000)) * 100;
              const isRecommended = panel.brand.toLowerCase().includes('intelbras');
              
              return (
                <div 
                  key={idx} 
                  className={`relative group rounded-[25px] p-[1px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 ${
                    isRecommended 
                      ? 'bg-gradient-to-b from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/5' 
                      : 'bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 hover:from-blue-400 hover:to-indigo-500'
                  }`}
                >
                   {/* Card Content Container */}
                   <div className="bg-white dark:bg-slate-900 h-full rounded-[24px] p-5 flex flex-col relative z-10 overflow-hidden">
                      
                      {/* Brand & Badge */}
                      <div className="flex justify-between items-start mb-4">
                          <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                              isRecommended 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                              {panel.brand}
                          </span>
                          {isRecommended && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  Recomendado
                              </div>
                          )}
                      </div>

                      {/* Title & Tech */}
                      <div className="mb-6">
                          <h4 className="font-bold text-slate-800 dark:text-white text-lg leading-tight mb-1 line-clamp-2" title={panel.model}>
                              {panel.model}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{panel.technology}</p>
                      </div>

                      {/* Hero Metric: Power */}
                      <div className="mb-6 flex items-baseline gap-1">
                          <span className={`text-4xl font-extrabold tracking-tight ${isRecommended ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                              {panel.power}
                          </span>
                          <span className="text-sm font-bold text-slate-400">Watts</span>
                      </div>

                      {/* BENTO GRID SPECS */}
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                          {/* Efficiency Cell */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl group/cell hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <div className="flex items-center gap-1.5 mb-1 text-slate-400 group-hover/cell:text-blue-500 transition-colors">
                                  <Zap className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold uppercase">Eficiência</span>
                              </div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{efficiency.toFixed(1)}%</span>
                          </div>

                          {/* Dimensions Cell */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl group/cell hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                              <div className="flex items-center gap-1.5 mb-1 text-slate-400 group-hover/cell:text-purple-500 transition-colors">
                                  <Maximize className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold uppercase">Dimensões</span>
                              </div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{panel.height}m x {panel.width}m</span>
                          </div>

                          {/* Quantity Cell */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl group/cell hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                              <div className="flex items-center gap-1.5 mb-1 text-slate-400 group-hover/cell:text-amber-500 transition-colors">
                                  <Layers className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold uppercase">Qtd.</span>
                              </div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{specificQty} Unid.</span>
                          </div>

                          {/* Area Cell */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl group/cell hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                              <div className="flex items-center gap-1.5 mb-1 text-slate-400 group-hover/cell:text-emerald-500 transition-colors">
                                  <Scan className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold uppercase">Ocupação</span>
                              </div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">~{specificArea.toFixed(0)}m²</span>
                          </div>
                      </div>

                   </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
             <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma recomendação disponível no momento.</p>
          </div>
        )}
      </div>

      {/* GENERATION SCENARIOS (INTERACTIVE SLIDER) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <SlidersHorizontal className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Cenários de Geração</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                      Ajuste o Performance Ratio (PR) para simular perdas por sujeira, temperatura e cabeamento.
                      <span className="hidden sm:inline"> Um PR de 75% (25% de perda) é o padrão de mercado.</span>
                  </p>
              </div>
           </div>
           
           <button 
             onClick={() => setSimulatedLoss(25)}
             className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
           >
               <RefreshCcw className="w-3.5 h-3.5" /> Resetar Padrão
           </button>
        </div>

        <div className="space-y-8">
            {/* Slider Control */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between mb-4">
                    <span className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                        <ArrowDown className="w-4 h-4 text-emerald-500" /> Eficiente (10% Perda)
                    </span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-700 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                        {simulatedLoss}% <span className="text-xs text-slate-400 font-normal">Perda Simulada</span>
                    </span>
                    <span className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                        Crítico (30% Perda) <ArrowDown className="w-4 h-4 text-red-500 rotate-180" /> 
                    </span>
                </div>
                <input 
                    type="range" 
                    min="10" 
                    max="30" 
                    step="1" 
                    value={simulatedLoss} 
                    onChange={(e) => setSimulatedLoss(parseInt(e.target.value))}
                    className="w-full h-4 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 rounded-full appearance-none cursor-pointer accent-white shadow-inner hover:opacity-90 transition-opacity"
                />
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Current */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 opacity-60">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Cenário Base ({results.systemLossesPercentage}%)</p>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{Math.floor(results.monthlyGeneration)} <span className="text-sm font-normal">kWh/mês</span></p>
                    <p className="text-sm text-slate-400 mt-1">{formatCurrency(results.annualSavings)} / ano</p>
                </div>

                <div className="flex justify-center text-slate-300 dark:text-slate-600">
                    <ArrowRight className="w-8 h-8 hidden md:block" />
                    <ArrowDown className="w-8 h-8 md:hidden" />
                </div>

                {/* Simulated */}
                <div className={`relative bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 transition-colors overflow-hidden ${simulatedDiff >= 0 ? 'border-emerald-400' : 'border-red-400'}`}>
                    <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-xs font-bold text-white ${simulatedDiff >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        {simulatedDiff >= 0 ? 'GANHO' : 'PERDA'}
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Simulação ({simulatedLoss}%)</p>
                    <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{Math.floor(simulatedMonthlyGen)} <span className="text-sm font-normal text-slate-500">kWh/mês</span></p>
                    
                    <div className="flex items-center gap-2 mt-2">
                         <span className={`text-sm font-bold ${simulatedDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                             {simulatedDiff > 0 ? '+' : ''}{Math.floor(simulatedDiff)} kWh
                         </span>
                         <span className="text-xs text-slate-400">vs base</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section - Wider */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
            <LineChartIcon className="w-5 h-5 mr-2 text-emerald-500" />
            Projeção Financeira (30 Anos)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                   dataKey="name" 
                   tick={{fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                   tickMargin={10}
                   interval={4} 
                   axisLine={false}
                   tickLine={false}
                />
                <YAxis 
                   hide={false}
                   tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                   tick={{fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                   axisLine={false}
                   tickLine={false}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                  contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                
                <ReferenceLine 
                  y={results.totalInvestment} 
                  label={{ 
                     value: 'Investimento Inicial', 
                     position: 'insideTopLeft', 
                     fill: '#ef4444', 
                     fontSize: 10,
                     fontWeight: 'bold'
                  }} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                />
                
                <Area 
                   type="monotone" 
                   name="Economia Acumulada" 
                   dataKey="accumulated" 
                   stroke="#10b981" 
                   strokeWidth={3}
                   fillOpacity={1} 
                   fill="url(#colorAccumulated)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info Column - Telhado e Eficiência */}
        <div className="space-y-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center relative z-10">
                    <Map className="w-5 h-5 mr-2 text-blue-500" /> Ocupação
                </h3>
                <div className="relative z-10">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Área Utilizada</span>
                        <span className="font-bold text-slate-800 dark:text-white">{results.areaOccupied.toFixed(1)} m²</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden mb-4">
                        <div 
                        className={`h-full rounded-full transition-all duration-1000 ${results.isPartialSystem ? 'bg-orange-400' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((results.areaOccupied / inputs.availableArea) * 100, 100)}%` }}
                        ></div>
                    </div>
                    {results.isPartialSystem ? (
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-orange-700 dark:text-orange-300">Área limitada. Cobertura parcial de {results.coveragePercentage.toFixed(0)}%.</p>
                        </div>
                    ) : (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">Área suficiente para 100%.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                    <Sun className="w-5 h-5 mr-2 text-amber-500" /> Eficiência
                </h3>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-500">Performance Ratio</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{(results.performanceRatio * 100).toFixed(0)}%</span>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs text-slate-400">
                      <span>Perdas Térmicas</span>
                      <span>~15%</span>
                   </div>
                   <div className="flex justify-between text-xs text-slate-400">
                      <span>Perdas Elétricas</span>
                      <span>~5%</span>
                   </div>
                   <div className="flex justify-between text-xs text-slate-400">
                      <span>Sujeira/Outros</span>
                      <span>~5%</span>
                   </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};
