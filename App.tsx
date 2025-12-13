
import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { SolarInputs, SolarResults, SimulationStatus } from './types';
import { calculateSolarSystem } from './services/calculator';
import { DEFAULT_HSP, DEFAULT_PANEL_ID } from './constants';
import { Sun, Moon, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  // State for Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solarExpertTheme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [inputs, setInputs] = useState<SolarInputs>({
    monthlyConsumption: 0,
    consumptionMode: 'average',
    consumptionHistory: Array(12).fill(''),
    dailyConsumption: 0,
    calculationBasis: 'consumption',
    energyTariff: 0,
    availableArea: 0,
    hsp: DEFAULT_HSP,
    systemLosses: 25,
    selectedPanelId: DEFAULT_PANEL_ID,
  });

  const [results, setResults] = useState<SolarResults | null>(null);
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('solarExpertTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('solarExpertTheme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleCalculate = () => {
    if (inputs.calculationBasis === 'consumption' && Number(inputs.monthlyConsumption) <= 0) {
       alert("Para calcular baseado em consumo, o valor mensal deve ser maior que zero.");
       return;
    }
    if (Number(inputs.availableArea) <= 0) {
      alert("A área disponível deve ser maior que zero.");
      return;
    }
    if (Number(inputs.energyTariff) <= 0) {
       alert("Informe a tarifa de energia para calcular a economia.");
       return;
    }

    setStatus(SimulationStatus.CALCULATING);
    
    setTimeout(() => {
      const calcResults = calculateSolarSystem(inputs);
      setResults(calcResults);
      setStatus(SimulationStatus.COMPLETE);
    }, 800);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 bg-slate-50 dark:bg-slate-950">
      
      {/* Ambient Background Blobs (Modern Touch) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-400/20 dark:bg-orange-500/10 blur-[100px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-400/20 dark:bg-emerald-500/10 blur-[120px]"></div>
      </div>
      
      {/* Glass Header */}
      <header className="fixed w-full top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-white/20 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-40 group-hover:opacity-75 transition duration-200"></div>
              <div className="relative bg-gradient-to-br from-orange-400 to-amber-500 p-2.5 rounded-xl shadow-lg flex items-center justify-center">
                 <Sun className="w-6 h-6 text-white animate-spin-slow" style={{ animationDuration: '10s' }} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">
                SolarExpert <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Pro</span>
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Inteligência Solar
              </p>
            </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 hover:bg-orange-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm active:scale-90"
            aria-label="Alternar tema"
          >
            <div key={isDarkMode ? 'dark' : 'light'} className="animate-[spin_0.5s_ease-out]">
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 pt-28">
        
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-6 tracking-tight">
              O futuro da sua energia <br className="hidden md:block"/>
              começa com <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500">precisão</span>.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Descubra o potencial do seu telhado com nossa IA. 
              Dimensionamento técnico, análise financeira e viabilidade em segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* Input Section */}
            <div className="xl:col-span-4 w-full">
              <div className="xl:sticky xl:top-28 transition-all duration-300">
                <InputForm 
                  inputs={inputs} 
                  onChange={setInputs} 
                  onCalculate={handleCalculate} 
                />
              </div>
            </div>

            {/* Results Section */}
            <div className="xl:col-span-8 w-full min-h-[600px]">
              {status === SimulationStatus.IDLE && (
                <div className="h-full flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm transition-all hover:border-orange-300 dark:hover:border-orange-700/50 group">
                  <div className="relative mb-8">
                     <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-2xl group-hover:bg-orange-400/30 transition-all duration-500"></div>
                     <div className="relative bg-white dark:bg-slate-800 p-8 rounded-full shadow-xl shadow-orange-500/10 group-hover:scale-110 transition-transform duration-500">
                        <Sun className="w-16 h-16 text-orange-500" />
                     </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Pronto para começar?</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mt-3 text-center text-lg">
                    Preencha os dados ao lado. Nossa IA vai calcular a melhor configuração para sua economia.
                  </p>
                </div>
              )}

              {(status === SimulationStatus.CALCULATING || status === SimulationStatus.COMPLETE) && (
                <ResultsDashboard 
                  results={results} 
                  inputs={inputs} 
                  loading={status === SimulationStatus.CALCULATING}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Modern Footer */}
      <footer className="relative mt-20 py-10 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-70">
            <Sun className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300">SolarExpert Pro</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © {new Date().getFullYear()} Desenvolvido com tecnologia Gemini AI e React.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
