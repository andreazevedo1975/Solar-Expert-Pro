import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { SolarInputs, SolarResults, SimulationStatus } from './types';
import { calculateSolarSystem } from './services/calculator';
import { DEFAULT_HSP, DEFAULT_PANEL_ID } from './constants';
import { Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  // State for Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage or system preference
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
    energyTariff: 0,
    availableArea: 0,
    hsp: DEFAULT_HSP,
    systemLosses: 25, // Default 25% losses
    selectedPanelId: DEFAULT_PANEL_ID,
  });

  const [results, setResults] = useState<SolarResults | null>(null);
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);

  // Apply Dark Mode Class
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
    // Basic Validation
    if (Number(inputs.monthlyConsumption) <= 0 || Number(inputs.energyTariff) <= 0 || Number(inputs.availableArea) <= 0) {
      alert("Por favor, preencha todos os campos com valores maiores que zero.");
      return;
    }

    setStatus(SimulationStatus.CALCULATING);
    
    // Simulate a small delay for UX feel
    setTimeout(() => {
      const calcResults = calculateSolarSystem(inputs);
      setResults(calcResults);
      setStatus(SimulationStatus.COMPLETE);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-slate-900 dark:bg-slate-950 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-full">
               <Sun className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SolarExpert <span className="text-yellow-400 font-light">Pro</span></h1>
              <p className="text-xs text-slate-400">Dimensionamento Fotovoltaico Profissional</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              aria-label="Alternar tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="hidden md:block text-sm text-slate-400 border-l border-slate-700 pl-4">
              v1.0.0
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Simule sua Economia</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Utilize nossa ferramenta de precisão técnica para dimensionar seu sistema solar. 
              Calculamos perdas, irradiação e retorno financeiro com base em dados reais de mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Input Section - Sticks on Desktop */}
            <div className="xl:col-span-4">
              <div className="xl:sticky xl:top-28">
                <InputForm 
                  inputs={inputs} 
                  onChange={setInputs} 
                  onCalculate={handleCalculate} 
                />
              </div>
            </div>

            {/* Results Section */}
            <div className="xl:col-span-8">
              {status === SimulationStatus.IDLE && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px] transition-colors duration-300">
                  <Sun className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                  <h3 className="text-xl font-medium text-slate-400 dark:text-slate-500">Aguardando dados...</h3>
                  <p className="text-slate-400 dark:text-slate-500 max-w-md mt-2">
                    Preencha os parâmetros ao lado para gerar o relatório técnico completo do seu sistema.
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

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-12 transition-colors duration-300">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © {new Date().getFullYear()} SolarExpert Pro. Todos os direitos reservados.
          </p>
          <p className="text-slate-400 dark:text-slate-600 text-xs mt-2">
            *Estimativas baseadas em médias de mercado. Consulte um integrador local para proposta final.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;