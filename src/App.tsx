import React, { useState, useEffect } from 'react';
import { TabId, SavedCircuit, ProjectSettings } from './types';
import { CalculatorTab } from './components/CalculatorTab';
import { PanelTab } from './components/PanelTab';
import { QDCBuilderTab } from './components/QDCBuilderTab';
import { DiagramsTab } from './components/DiagramsTab';
import { HelpersTab } from './components/HelpersTab';
import { QuickCalcTab } from './components/QuickCalcTab';
import { GuideTab } from './components/GuideTab';
import { ProfileTab } from './components/ProfileTab';
import { calculateCircuit } from './utils/electricalCalculator';
import { usePWAInstall } from './pwaRegister';
import { useTheme } from './useTheme';
import { ThemeToggle } from './components/ThemeToggle';
import {
  Zap,
  Layers,
  Calculator,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Calculator as CalcIcon,
  FileCode2,
  Sliders,
  Download,
  Wifi,
  WifiOff,
  Smartphone,
  Menu,
  X,
  ChevronRight,
  RefreshCw,
  UserCheck,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default initial circuits for demo/first load
const INITIAL_CIRCUITS: SavedCircuit[] = [
  {
    id: 'circ_1',
    name: 'C1 - Chuveiro Banheiro Social',
    loadType: 'tue',
    powerW: 7500,
    powerFactor: 1.0,
    voltageV: 220,
    systemType: 'bifasico_220',
    lengthMeters: 14,
    maxVoltageDropPercent: 2.0,
    installationMethod: 'B1',
    insulation: 'PVC',
    material: 'cobre',
    groupedCircuits: 2,
    ambientTempC: 30,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    result: calculateCircuit({
      name: 'C1 - Chuveiro Banheiro Social',
      loadType: 'tue',
      powerW: 7500,
      powerFactor: 1.0,
      voltageV: 220,
      systemType: 'bifasico_220',
      lengthMeters: 14,
      maxVoltageDropPercent: 2.0,
      installationMethod: 'B1',
      insulation: 'PVC',
      material: 'cobre',
      groupedCircuits: 2,
      ambientTempC: 30,
    }),
  },
  {
    id: 'circ_2',
    name: 'C2 - Iluminação Geral Residencial',
    loadType: 'iluminacao',
    powerW: 900,
    powerFactor: 0.95,
    voltageV: 127,
    systemType: 'monofasico_127',
    lengthMeters: 22,
    maxVoltageDropPercent: 2.0,
    installationMethod: 'B1',
    insulation: 'PVC',
    material: 'cobre',
    groupedCircuits: 3,
    ambientTempC: 30,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    result: calculateCircuit({
      name: 'C2 - Iluminação Geral Residencial',
      loadType: 'iluminacao',
      powerW: 900,
      powerFactor: 0.95,
      voltageV: 127,
      systemType: 'monofasico_127',
      lengthMeters: 22,
      maxVoltageDropPercent: 2.0,
      installationMethod: 'B1',
      insulation: 'PVC',
      material: 'cobre',
      groupedCircuits: 3,
      ambientTempC: 30,
    }),
  },
  {
    id: 'circ_3',
    name: 'C3 - TUGs Cozinha / Área de Serviço',
    loadType: 'tug',
    powerW: 2200,
    powerFactor: 0.95,
    voltageV: 127,
    systemType: 'monofasico_127',
    lengthMeters: 16,
    maxVoltageDropPercent: 3.0,
    installationMethod: 'B1',
    insulation: 'PVC',
    material: 'cobre',
    groupedCircuits: 2,
    ambientTempC: 30,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    result: calculateCircuit({
      name: 'C3 - TUGs Cozinha / Área de Serviço',
      loadType: 'tug',
      powerW: 2200,
      powerFactor: 0.95,
      voltageV: 127,
      systemType: 'monofasico_127',
      lengthMeters: 16,
      maxVoltageDropPercent: 3.0,
      installationMethod: 'B1',
      insulation: 'PVC',
      material: 'cobre',
      groupedCircuits: 2,
      ambientTempC: 30,
    }),
  },
];

const INITIAL_PROJECT_SETTINGS: ProjectSettings = {
  projectName: 'Residência Unifamiliar - Sobrado',
  clientName: 'João da Silva',
  electricianName: 'Eng. Carlos Eduardo (CREA 123456)',
  defaultVoltage: 220,
  maxVoltageDropTotalPercent: 4.0,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('calculator');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    isCheckingUpdate,
    lastCheckMessage,
    triggerInstall,
    applyUpdate,
    checkForUpdate,
  } = usePWAInstall();
  const { theme, setTheme } = useTheme();

  // Persistent Saved Circuits
  const [savedCircuits, setSavedCircuits] = useState<SavedCircuit[]>(() => {
    const local = localStorage.getItem('app_nbr5410_circuits');
    return local ? JSON.parse(local) : INITIAL_CIRCUITS;
  });

  // Persistent Project Settings
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(() => {
    const local = localStorage.getItem('app_nbr5410_settings');
    return local ? JSON.parse(local) : INITIAL_PROJECT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('app_nbr5410_circuits', JSON.stringify(savedCircuits));
  }, [savedCircuits]);

  useEffect(() => {
    localStorage.setItem('app_nbr5410_settings', JSON.stringify(projectSettings));
  }, [projectSettings]);

  // Handlers
  const handleSaveCircuit = (circuit: SavedCircuit) => {
    setSavedCircuits((prev) => [circuit, ...prev]);
  };

  const handleDeleteCircuit = (id: string) => {
    setSavedCircuits((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDuplicateCircuit = (circuit: SavedCircuit) => {
    const duplicated: SavedCircuit = {
      ...circuit,
      id: 'circ_' + Date.now(),
      name: circuit.name + ' (Cópia)',
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };
    setSavedCircuits((prev) => [duplicated, ...prev]);
  };

  const tabsConfig = [
    {
      id: 'quick_calc' as TabId,
      label: 'Calculadora Rápida',
      sublabel: 'Geral, Lei de Ohm & R$',
      icon: CalcIcon,
      badge: null,
    },
    {
      id: 'calculator' as TabId,
      label: 'Dimensionamento',
      sublabel: 'Calculadora de Cabos & Disjuntores',
      icon: Zap,
      badge: null,
    },
    {
      id: 'panel' as TabId,
      label: 'Quadro de Cargas',
      sublabel: 'QDC & Balanço Total',
      icon: Layers,
      badge: savedCircuits.length > 0 ? savedCircuits.length : null,
    },
    {
      id: 'qdc_builder' as TabId,
      label: 'Montador QDC DIN',
      sublabel: 'Montagem, DR & DPS',
      icon: Sliders,
      badge: null,
    },
    {
      id: 'diagrams' as TabId,
      label: 'Diagramas Unifilar / Multifilar',
      sublabel: 'Esquemas Elétricos CAD',
      icon: FileCode2,
      badge: null,
    },
    {
      id: 'helpers' as TabId,
      label: 'Auxiliares',
      sublabel: 'Queda de Tensão & Conversor',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'guide' as TabId,
      label: 'Norma NBR 5410',
      sublabel: 'Tabelas & Dados do Projeto',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'profile' as TabId,
      label: 'Perfil do Eletricista',
      sublabel: 'Cartão Digital & NBR',
      icon: UserCheck,
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* PWA In-App Auto Update Banner */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white px-4 py-2 text-xs font-bold shadow-md z-40 sticky top-0"
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-200 animate-spin shrink-0" />
                <span>
                  <strong>⚡ Nova versão disponível!</strong> Você não precisa desinstalar nada. Clique para aplicar a atualização em tempo real.
                </span>
              </div>
              <button
                onClick={applyUpdate}
                className="px-3.5 py-1 bg-white text-orange-700 hover:bg-orange-50 active:scale-95 font-black rounded-xl transition-all shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-orange-700" />
                <span>Atualizar Agora</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 dark:text-blue-100 text-base leading-tight">
                  Dimensionamento Elétrico
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 font-bold text-[10px] tracking-wide border border-orange-200 dark:border-orange-800/60">
                  NBR 5410
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Central Profissional NBR 5410
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                    isActive
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-2xs"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== null && (
                      <span className="ml-0.5 px-1.5 py-0.2 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Header Controls: Theme Switcher, PWA Install, Online Status & Hamburger Menu */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle (Compact) */}
            <div className="flex items-center">
              <ThemeToggle theme={theme} setTheme={setTheme} variant="compact" />
            </div>

            {/* Online/Offline Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800 animate-pulse'
              }`}
              title={isOnline ? 'Conectado à internet' : 'Modo Offline Ativo (PWA)'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Modo Offline (PWA)</span>
                </>
              )}
            </div>

            {/* Check for App Updates Button */}
            <button
              onClick={checkForUpdate}
              disabled={isCheckingUpdate}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer min-h-[38px]"
              title="Buscar novas atualizações sem precisar desinstalar o app"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-600 dark:text-orange-400 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span>{isCheckingUpdate ? 'Buscando...' : 'Atualizações'}</span>
            </button>

            {/* PWA Install Button */}
            {isInstallable && (
              <button
                onClick={triggerInstall}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[38px]"
                title="Instalar Aplicativo NBR 5410 no Celular / Computador"
              >
                <Download className="w-3.5 h-3.5 animate-bounce text-white" />
                <span className="hidden sm:inline">Baixar App</span>
                <span className="sm:hidden">Instalar</span>
              </button>
            )}

            {/* Project Header Info */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/80">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate max-w-[150px] font-medium text-slate-800 dark:text-slate-200">
                {projectSettings.projectName}
              </span>
            </div>

            {/* Hamburger Menu Button (Tablet & Mobile < lg) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/60 hover:text-orange-600 dark:hover:text-orange-400 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label="Abrir Menu Principal"
              title="Abrir Menu Principal"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Feedback Toast for Manual Update Check */}
      <AnimatePresence>
        {lastCheckMessage && !updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900 text-white text-xs font-bold py-2 px-4 border-b border-slate-800 text-center flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>{lastCheckMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hamburger Menu Slide-Over Drawer for Tablets & Smartphones */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Slide-over Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto"
            >
              {/* Drawer Header */}
              <div>
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 dark:bg-slate-950 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                      <Zap className="w-4 h-4 fill-white text-white" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white leading-tight">
                        Menu de Navegação
                      </h3>
                      <p className="text-[11px] text-slate-300">NBR 5410 & QDC Modular</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Fechar Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status & Project Banner */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate max-w-[180px]">{projectSettings.projectName}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isOnline ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Theme Switcher Section in Drawer */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <ThemeToggle theme={theme} setTheme={setTheme} variant="full" />
                </div>

                {/* Menu Nav Links */}
                <div className="p-3 space-y-1.5">
                  <p className="px-3 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider py-1">
                    Módulos e Ferramentas
                  </p>
                  {tabsConfig.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer min-h-[48px] ${
                          isActive
                            ? 'bg-orange-600 text-white font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${
                              isActive ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                              <span>{tab.label}</span>
                              {tab.badge !== null && (
                                <span
                                  className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                                    isActive
                                      ? 'bg-white text-orange-600'
                                      : 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300'
                                  }`}
                                >
                                  {tab.badge}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[10px] font-normal ${
                                isActive ? 'text-orange-100' : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {tab.sublabel}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-3">
                <button
                  onClick={() => {
                    setIsApkModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm min-h-[44px]"
                >
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>Baixar APK / Instalar no Android</span>
                </button>

                {isInstallable && (
                  <button
                    onClick={() => {
                      triggerInstall();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm min-h-[44px]"
                  >
                    <Download className="w-4 h-4 text-white animate-bounce" />
                    <span>Instalar PWA Direto</span>
                  </button>
                )}

                <button
                  onClick={checkForUpdate}
                  disabled={isCheckingUpdate}
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700 min-h-[44px]"
                >
                  <RefreshCw className={`w-4 h-4 text-orange-600 dark:text-orange-400 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Verificando...' : 'Verificar Atualizações'}</span>
                </button>

                {lastCheckMessage && (
                  <p className="text-[11px] font-bold text-center text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 p-2 rounded-lg border border-orange-200 dark:border-orange-800">
                    {lastCheckMessage}
                  </p>
                )}

                <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  NBR 5410 & QDC • PWA Auto-Atualizável
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'calculator' && (
              <CalculatorTab
                onSaveCircuit={handleSaveCircuit}
                onNavigateToQDC={() => setActiveTab('qdc_builder')}
              />
            )}

            {activeTab === 'panel' && (
              <PanelTab
                savedCircuits={savedCircuits}
                onDeleteCircuit={handleDeleteCircuit}
                onDuplicateCircuit={handleDuplicateCircuit}
                onNavigateToCalculator={() => setActiveTab('calculator')}
                onNavigateToQDC={() => setActiveTab('qdc_builder')}
              />
            )}

            {activeTab === 'qdc_builder' && (
              <QDCBuilderTab
                savedCircuits={savedCircuits}
                projectName={projectSettings.projectName}
                clientName={projectSettings.clientName}
                electricianName={projectSettings.electricianName}
              />
            )}

            {activeTab === 'diagrams' && (
              <DiagramsTab
                savedCircuits={savedCircuits}
                projectName={projectSettings.projectName}
                clientName={projectSettings.clientName}
                electricianName={projectSettings.electricianName}
              />
            )}

            {activeTab === 'quick_calc' && <QuickCalcTab />}

            {activeTab === 'helpers' && <HelpersTab />}

            {activeTab === 'guide' && (
              <GuideTab
                projectSettings={projectSettings}
                onSaveSettings={setProjectSettings}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab
                projectSettings={projectSettings}
                setProjectSettings={setProjectSettings}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modal para Gerar / Instalar APK Android */}
      <AnimatePresence>
        {isApkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsApkModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-800 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Instalar / Gerar APK Android
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Transforme a Calculadora NBR 5410 em um aplicativo nativo no celular
                  </p>
                </div>
              </div>

              {/* OPÇÃO 1: INSTALAÇÃO NATIVA PWA (SEM BAIXAR APK) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>Opção 1: Instalação Direta (PWA Nativo)</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Este app é um <strong>PWA (Progressive Web App)</strong> nativo. Ao instalar pelo Chrome no Android, ele cria o ícone oficial na tela inicial, roda sem barra do navegador e funciona <strong>100% Offline</strong>!
                </p>

                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal pl-4">
                  <li>No Chrome do celular, toque nos <strong>3 pontinhos (⋮)</strong> no canto superior.</li>
                  <li>Selecione <strong>"Adicionar à Tela Inicial"</strong> ou <strong>"Instalar Aplicativo"</strong>.</li>
                  <li>Confirme e o ícone oficial do raio ⚡ aparecerá na tela inicial como qualquer app da Play Store!</li>
                </ol>

                {isInstallable && (
                  <button
                    onClick={() => {
                      triggerInstall();
                      setIsApkModalOpen(false);
                    }}
                    className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>Instalar Agora no Meu Android</span>
                  </button>
                )}
              </div>

              {/* OPÇÃO 2: GERAR ARQUIVO .APK FÍSICO VIA PWABUILDER */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Opção 2: Gerar Arquivo .APK / .AAB</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Se precisa do arquivo <strong>.apk</strong> compilado para enviar via WhatsApp ou publicar na Google Play Store, use o serviço oficial da Microsoft:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? window.location.href : ''}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(window.location.href);
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2500);
                        }
                      }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedUrl ? 'Copiado!' : 'Copiar URL'}</span>
                    </button>
                  </div>

                  <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal pl-4">
                    <li>Copie o link acima.</li>
                    <li>Acesse o site gratuito <strong>www.pwabuilder.com</strong></li>
                    <li>Cole a URL e clique em <strong>"Package for Android"</strong> para baixar o APK pronto!</li>
                  </ol>

                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Abrir PWABuilder.com</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsApkModalOpen(false)}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Dimensionamento Elétrico NBR 5410 • Sistema de Cálculo e Proteção de Circuitos
          </span>
          <span className="font-semibold text-slate-400">
            {savedCircuits.length} circuito(s) no Quadro de Distribuição
          </span>
        </div>
      </footer>
    </div>
  );
}
