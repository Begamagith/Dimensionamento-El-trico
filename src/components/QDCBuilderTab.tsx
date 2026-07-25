import React, { useState, useEffect } from 'react';
import { SavedCircuit, QDCDevice, DINDeviceType } from '../types';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Power,
  Zap,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Sparkles,
  Check,
  X,
  Info,
  Download,
  Printer,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface QDCBuilderTabProps {
  savedCircuits: SavedCircuit[];
  projectName?: string;
  clientName?: string;
  electricianName?: string;
}

export const QDCBuilderTab: React.FC<QDCBuilderTabProps> = ({
  savedCircuits,
  projectName = 'Residência Unifamiliar',
  clientName = 'Cliente',
  electricianName = 'Responsável Técnico',
}) => {
  // Mode: 'build' or 'simulate'
  const [activeMode, setActiveMode] = useState<'build' | 'simulate'>('simulate');

  // QDC Devices state persisted in localStorage
  const [devices, setDevices] = useState<QDCDevice[]>(() => {
    try {
      const saved = localStorage.getItem('app_nbr5410_qdc_devices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading QDC devices from localStorage:', e);
    }
    return [];
  });

  // Save devices to localStorage whenever updated
  useEffect(() => {
    if (devices.length > 0) {
      localStorage.setItem('app_nbr5410_qdc_devices', JSON.stringify(devices));
    }
  }, [devices]);

  // Master Power Switch for QDC simulation
  const [isMasterOn, setIsMasterOn] = useState<boolean>(true);

  // Edit Device Modal State
  const [editingDevice, setEditingDevice] = useState<QDCDevice | null>(null);

  // Add Custom Device Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newDeviceType, setNewDeviceType] = useState<DINDeviceType>('circuit_breaker');
  const [newDeviceName, setNewDeviceName] = useState<string>('Circuito Adicional');
  const [newDeviceAmperage, setNewDeviceAmperage] = useState<number>(20);
  const [newDevicePoles, setNewDevicePoles] = useState<1 | 2 | 3 | 4>(1);
  const [newDeviceCurve, setNewDeviceCurve] = useState<'B' | 'C' | 'D'>('C');
  const [newDevicePowerW, setNewDevicePowerW] = useState<number>(2200);

  // Smart Sync function connecting Dimensioning (savedCircuits) with QDC DIN devices
  const syncWithCircuits = (forceRegenerate: boolean = false) => {
    if (forceRegenerate || devices.length === 0) {
      autoGenerateFromCircuits();
      return;
    }

    // Calculate required main breaker amperage from total active power
    const totalW = savedCircuits.reduce((sum, c) => sum + c.powerW, 0);
    const estCurrentA = totalW > 0 ? (totalW * 0.7) / 220 : 32;

    let mainA = 32;
    if (estCurrentA > 80) mainA = 100;
    else if (estCurrentA > 63) mainA = 80;
    else if (estCurrentA > 50) mainA = 63;
    else if (estCurrentA > 40) mainA = 50;
    else if (estCurrentA > 32) mainA = 40;

    setDevices((prevDevices) => {
      // 1. Update Main Breaker & IDR ratings if needed
      let updated = prevDevices.map((d) => {
        if (d.type === 'main_breaker') {
          return { ...d, amperageA: Math.max(d.amperageA, mainA) };
        }
        if (d.type === 'idr') {
          return { ...d, amperageA: Math.max(d.amperageA, Math.max(40, mainA)) };
        }
        return d;
      });

      const savedIds = new Set(savedCircuits.map((c) => c.id));

      // 2. Filter out linked devices whose circuit was deleted in dimensioning
      updated = updated.filter((d) => !d.linkedCircuitId || savedIds.has(d.linkedCircuitId));

      // 3. Update or append branch breakers for all saved circuits
      savedCircuits.forEach((c, idx) => {
        const targetPoles = (c.voltageV === 127 ? 1 : c.systemType?.includes('trifasico') ? 3 : 2) as 1 | 2 | 3 | 4;
        const existingIdx = updated.findIndex(
          (d) => d.linkedCircuitId === c.id || (d.type === 'circuit_breaker' && d.id === `cb_${c.id}`)
        );

        if (existingIdx !== -1) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            name: `C${idx + 1}: ${c.name}`,
            amperageA: c.result.recommendedBreakerA,
            poles: targetPoles,
            curve: c.result.breakerCurve,
            powerW: c.powerW,
            linkedCircuitId: c.id,
          };
        } else {
          updated.push({
            id: `cb_${c.id}`,
            type: 'circuit_breaker',
            name: `C${idx + 1}: ${c.name}`,
            amperageA: c.result.recommendedBreakerA,
            poles: targetPoles,
            curve: c.result.breakerCurve,
            powerW: c.powerW,
            isPoweredOn: true,
            isTripped: false,
            linkedCircuitId: c.id,
          });
        }
      });

      return updated;
    });
  };

  // Auto-sync devices whenever savedCircuits array changes or on mount
  useEffect(() => {
    if (devices.length === 0) {
      autoGenerateFromCircuits();
    } else {
      syncWithCircuits(false);
    }
  }, [savedCircuits]);

  const autoGenerateFromCircuits = () => {
    // Calculate required main breaker amperage
    const totalW = savedCircuits.reduce((sum, c) => sum + c.powerW, 0);
    const estCurrentA = totalW > 0 ? (totalW * 0.7) / 220 : 32;

    let mainA = 32;
    if (estCurrentA > 80) mainA = 100;
    else if (estCurrentA > 63) mainA = 80;
    else if (estCurrentA > 50) mainA = 63;
    else if (estCurrentA > 40) mainA = 50;
    else if (estCurrentA > 32) mainA = 40;

    const newDevices: QDCDevice[] = [
      // 1. Disjuntor Geral
      {
        id: 'main_geral',
        type: 'main_breaker',
        name: 'Disjuntor Geral QDC',
        amperageA: mainA,
        poles: 2,
        curve: 'C',
        isPoweredOn: true,
        isTripped: false,
      },
      // 2. DPS Protection
      {
        id: 'dps_main',
        type: 'dps',
        name: 'DPS Classe II',
        amperageA: 275, // voltage rating or kA
        poles: 2,
        dpsKA: 20,
        isPoweredOn: true,
        isTripped: false,
      },
      // 3. IDR DR Protection
      {
        id: 'idr_main',
        type: 'idr',
        name: 'IDR Proteção DR Geral',
        amperageA: Math.max(40, mainA),
        poles: 2,
        sensitivityMA: 30,
        isPoweredOn: true,
        isTripped: false,
      },
    ];

    // 4. Branch breakers from saved circuits
    if (savedCircuits.length > 0) {
      savedCircuits.forEach((c, idx) => {
        newDevices.push({
          id: `cb_${c.id}`,
          type: 'circuit_breaker',
          name: `C${idx + 1}: ${c.name}`,
          amperageA: c.result.recommendedBreakerA,
          poles: c.voltageV === 127 ? 1 : 2,
          curve: c.result.breakerCurve,
          powerW: c.powerW,
          isPoweredOn: true,
          isTripped: false,
          linkedCircuitId: c.id,
        });
      });
    } else {
      // Default placeholder circuits if none saved
      newDevices.push(
        {
          id: 'cb_demo_1',
          type: 'circuit_breaker',
          name: 'C1: Iluminação Geral',
          amperageA: 10,
          poles: 1,
          curve: 'B',
          powerW: 800,
          isPoweredOn: true,
          isTripped: false,
        },
        {
          id: 'cb_demo_2',
          type: 'circuit_breaker',
          name: 'C2: TUGs Tomadas Quarto',
          amperageA: 16,
          poles: 1,
          curve: 'C',
          powerW: 1800,
          isPoweredOn: true,
          isTripped: false,
        },
        {
          id: 'cb_demo_3',
          type: 'circuit_breaker',
          name: 'C3: Chuveiro Elétrico',
          amperageA: 32,
          poles: 2,
          curve: 'C',
          powerW: 5500,
          isPoweredOn: true,
          isTripped: false,
        }
      );
    }

    setDevices(newDevices);
  };

  // Device Action Handlers
  const toggleDevicePower = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            isPoweredOn: !d.isPoweredOn,
            isTripped: false, // reset trip if manually turned back on
          };
        }
        return d;
      })
    );
  };

  const simulateDRTrip = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return { ...d, isTripped: true, isPoweredOn: false };
        }
        return d;
      })
    );
  };

  const simulateOverload = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return { ...d, isTripped: true, isPoweredOn: false };
        }
        return d;
      })
    );
  };

  const deleteDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const resetAllTrips = () => {
    setIsMasterOn(true);
    setDevices((prev) =>
      prev.map((d) => ({
        ...d,
        isPoweredOn: true,
        isTripped: false,
      }))
    );
  };

  const handleAddDevice = () => {
    const newId = `custom_${Date.now()}`;
    const device: QDCDevice = {
      id: newId,
      type: newDeviceType,
      name: newDeviceName,
      amperageA: newDeviceAmperage,
      poles: newDevicePoles,
      curve: newDeviceCurve,
      powerW: newDeviceType === 'circuit_breaker' ? newDevicePowerW : undefined,
      sensitivityMA: newDeviceType === 'idr' ? 30 : undefined,
      dpsKA: newDeviceType === 'dps' ? 20 : undefined,
      isPoweredOn: true,
      isTripped: false,
    };

    setDevices((prev) => [...prev, device]);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingDevice) return;
    setDevices((prev) =>
      prev.map((d) => (d.id === editingDevice.id ? editingDevice : d))
    );
    setEditingDevice(null);
  };

  // Calculation & Verification Checks
  const mainBreaker = devices.find((d) => d.type === 'main_breaker');
  const idrDevice = devices.find((d) => d.type === 'idr');

  // Check if main breaker is energized
  const isGeralPowered = isMasterOn && mainBreaker && mainBreaker.isPoweredOn && !mainBreaker.isTripped;
  const isIDRPowered = isGeralPowered && idrDevice && idrDevice.isPoweredOn && !idrDevice.isTripped;

  // Compute Active Load Sum
  const activeBranchDevices = devices.filter((d) => d.type === 'circuit_breaker');
  const activeEnergizedBranches = activeBranchDevices.filter(
    (d) => isIDRPowered && d.isPoweredOn && !d.isTripped
  );

  const totalActivePowerW = activeEnergizedBranches.reduce((sum, d) => sum + (d.powerW || 0), 0);
  const totalActiveCurrentA = totalActivePowerW / 220;

  // Overload verification
  const isMainOverloaded = mainBreaker ? totalActiveCurrentA > mainBreaker.amperageA : false;

  return (
    <div className="space-y-6">
      {/* Styles for dynamic SVG/DOM pulse animations */}
      <style>{`
        @keyframes dinPulseGreen {
          0%, 100% { box-shadow: 0 0 12px rgba(16, 185, 129, 0.6); }
          50% { box-shadow: 0 0 4px rgba(16, 185, 129, 0.2); }
        }
        @keyframes dinPulseRed {
          0%, 100% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.9); }
          50% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
        }
        .din-glow-green {
          animation: dinPulseGreen 1.5s ease-in-out infinite;
        }
        .din-glow-red {
          animation: dinPulseRed 0.7s ease-in-out infinite;
        }
      `}</style>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden transition-colors duration-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Montador de QDC DIN Modular</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Quadro de Distribuição de Cargas (QDC)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monte o trilho DIN com disjuntores, DR e DPS, renomeie amperagens e simule a energização em tempo real
          </p>
        </div>

        {/* Master Power Switch & Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Master Power Button */}
          <button
            onClick={() => setIsMasterOn(!isMasterOn)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md transform active:scale-95 ${
              isMasterOn
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-200 ring-2 ring-emerald-400'
                : 'bg-slate-900 text-slate-200 hover:bg-slate-800 ring-2 ring-slate-700'
            }`}
          >
            <Power className={`w-4 h-4 ${isMasterOn ? 'animate-pulse text-white' : 'text-slate-400'}`} />
            <span>{isMasterOn ? 'QDC ENERGIZADO (ON)' : 'QDC DESLIGADO (OFF)'}</span>
          </button>

          {/* Mode Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center">
            <button
              onClick={() => setActiveMode('simulate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'simulate'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Simulação & Testes
            </button>
            <button
              onClick={() => setActiveMode('build')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'build'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Montar / Editar DIN
            </button>
          </div>

          <button
            onClick={resetAllTrips}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Rearmar todos os disjuntores e DRs"
          >
            <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Rearmar Todos</span>
          </button>
        </div>
      </div>

      {/* Real-time Status Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        {/* Status Card 1: Energização */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors duration-200">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Estado do QDC
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {!isMasterOn ? (
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-400 inline-block"></span>
                  DESLIGADO (PRETO)
                </span>
              ) : isMainOverloaded ? (
                <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block"></span>
                  SOBRECARGA (VERMELHO)
                </span>
              ) : (
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                  ENERGIZADO (VERDE)
                </span>
              )}
            </div>
          </div>
          <Zap className={`w-7 h-7 ${isMasterOn ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
        </div>

        {/* Status Card 2: Potência em Uso */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Potência Ativa Total
          </span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {totalActivePowerW.toLocaleString('pt-BR')} W
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            Corrente simulada: {totalActiveCurrentA.toFixed(1)} A
          </span>
        </div>

        {/* Status Card 3: Disjuntor Geral */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Disjuntor Geral
          </span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {mainBreaker ? `${mainBreaker.amperageA} A` : 'Não definido'}
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            {isMainOverloaded ? (
              <span className="text-rose-600 font-extrabold">⚠️ Corrente excede o disjuntor!</span>
            ) : (
              <span className="text-emerald-600 font-extrabold">✓ Dentro do limite térmico</span>
            )}
          </span>
        </div>

        {/* Status Card 4: Proteção DR (IDR) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Proteção DR (30mA)
          </span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {idrDevice ? (idrDevice.isTripped ? 'DESARMADO (FUGA)' : idrDevice.isPoweredOn ? 'ARMADO / PROTEGENDO' : 'DESLIGADO') : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {idrDevice?.isTripped ? '⚠️ Fuga de corrente simulada!' : '✓ Proteção contra choques ativa'}
          </span>
        </div>
      </div>

      {/* ASSEMBLY / SIMULATION TOOLBAR WITH DIMENSIONING SYNC */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden transition-colors duration-200">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>⚡ {savedCircuits.length} circuito(s) do Dimensionamento</span>
          </div>

          <button
            onClick={() => syncWithCircuits(false)}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Sincronizar disjuntores e amperagens com os circuitos dimensionados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar com Dimensionamento</span>
          </button>

          <button
            onClick={() => syncWithCircuits(true)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Redimensiona Geral, DPS, DR e regera todos os disjuntores segundo a NBR 5410"
          >
            <Layers className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Regerar QDC Completo</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Dispositivo Manual</span>
          </button>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-2xs"></span>
            <span>Verde = Ligado / Conforme NBR 5410</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block shadow-2xs"></span>
            <span>Vermelho = Fora da Norma / Desarmado</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-slate-900 inline-block shadow-2xs"></span>
            <span>Preto = Desligado</span>
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* REALISTIC VISUAL QDC DIN RAIL ENCLOSURE (QUADRO FISICO)   */}
      {/* ========================================================= */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border-4 border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Metallic Enclosure Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 text-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-black">
              <Zap className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-wide flex items-center gap-2">
                QUADRO DE DISTRIBUIÇÃO DIN - QDC-01
                <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-400 text-[10px] font-mono border border-slate-700">
                  NBR 5410
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                TRILHO METÁLICO DIN 35mm • PROJETO: {projectName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400">STATUS BARRAMENTO:</span>
            {!isMasterOn ? (
              <span className="text-slate-400 font-bold">DESENERGIZADO (0V)</span>
            ) : isMainOverloaded ? (
              <span className="text-rose-500 font-bold animate-pulse">⚠️ SOBRECARGA DETECTADA</span>
            ) : (
              <span className="text-emerald-400 font-bold">ENERGIZADO (220V)</span>
            )}
          </div>
        </div>

        {/* METALLIC DIN RAIL CONTAINER */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <Info className="w-3.5 h-3.5" />
              <span>Dica Touch: Arraste para os lados no smartphone para percorrer o trilho DIN</span>
            </span>
            <span className="hidden sm:inline-block text-slate-500">Módulos DIN Standard 18mm</span>
          </div>

          <div className="relative bg-slate-950/80 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto touch-pan-x min-h-[360px] scrollbar-thin">
            {/* Metallic Rail Lines Background */}
            <div className="absolute left-0 right-0 top-[110px] h-8 bg-gradient-to-b from-slate-700 via-slate-500 to-slate-800 border-y border-slate-400/30 opacity-70 pointer-events-none"></div>

            {/* DEVICES MOUNTED ON DIN RAIL */}
            <div className="relative z-10 flex items-end gap-3 min-w-max pb-4">
            {devices.map((device, idx) => {
              // Determine device state colors
              // Rule: device can only be energized if Master is ON and preceding upstream main/IDR are ON.
              let isPowered = isMasterOn;
              if (device.type === 'circuit_breaker') {
                isPowered = isIDRPowered;
              } else if (device.type === 'idr') {
                isPowered = isGeralPowered;
              } else if (device.type === 'dps') {
                isPowered = isGeralPowered;
              }

              const isDeviceActive = isPowered && device.isPoweredOn && !device.isTripped;

              // Check individual circuit compliance (amperage vs power load)
              const loadCurrentA = device.powerW ? device.powerW / 220 : 0;
              const isDeviceOverloaded = device.powerW ? loadCurrentA > device.amperageA : false;

              const isCompliant = !isDeviceOverloaded && !device.isTripped;

              // Determine Visual Colors:
              // - Verde: Ligado e dentro da norma
              // - Vermelho: Desarmado, sobrecarregado ou fora da norma
              // - Preto / Slate: Desligado
              let borderClass = 'border-slate-800';
              let bgDevice = 'bg-slate-900';
              let glowClass = '';
              let badgeBg = 'bg-slate-800 text-slate-400';
              let statusText = 'DESLIGADO';

              if (!isDeviceActive) {
                borderClass = 'border-slate-800';
                bgDevice = 'bg-slate-950 text-slate-500';
                badgeBg = 'bg-slate-900 text-slate-400';
                statusText = device.isTripped ? 'DESARMADO' : 'OFF (PRETO)';
              } else if (isCompliant) {
                borderClass = 'border-emerald-500';
                bgDevice = 'bg-slate-900 text-white';
                glowClass = 'din-glow-green';
                badgeBg = 'bg-emerald-600 text-white';
                statusText = 'ON (VERDE)';
              } else {
                borderClass = 'border-rose-600';
                bgDevice = 'bg-slate-900 text-white';
                glowClass = 'din-glow-red';
                badgeBg = 'bg-rose-600 text-white';
                statusText = 'ALERTA (VERMELHO)';
              }

              // Module width by poles
              let widthClass = 'w-28'; // 1P
              if (device.poles === 2) widthClass = 'w-40';
              else if (device.poles === 3) widthClass = 'w-52';
              else if (device.poles === 4) widthClass = 'w-64';

              return (
                <div
                  key={device.id}
                  className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all transform hover:-translate-y-1 ${widthClass} ${bgDevice} ${borderClass} ${glowClass} shadow-xl`}
                >
                  {/* DIN Module Top Terminal Block */}
                  <div className="w-full flex justify-between items-center bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 mb-2">
                    <span className="truncate">T1: L</span>
                    <span className="truncate">T2: N</span>
                  </div>

                  {/* Device Header Tag */}
                  <div className="text-center space-y-0.5 mb-2 w-full">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider block">
                        {device.type === 'main_breaker'
                          ? 'DISJUNTOR GERAL'
                          : device.type === 'idr'
                          ? 'INTERRUPTOR DR'
                          : device.type === 'dps'
                          ? 'PROTEÇÃO DPS'
                          : `CIRCUITO C${idx - 2}`}
                      </span>
                      {device.linkedCircuitId && (
                        <span className="px-1 py-0.2 text-[8px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded">
                          ⚡ Calc
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-xs text-white truncate px-1" title={device.name}>
                      {device.name}
                    </h4>
                  </div>

                  {/* Rating / Amperage Display */}
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center w-full my-1">
                    <span className="text-lg font-black text-amber-400 font-mono block">
                      {device.type === 'dps' ? `${device.dpsKA || 20} kA` : `${device.amperageA} A`}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono block">
                      {device.poles}P • Curva {device.curve || 'C'}
                      {device.sensitivityMA ? ` • ${device.sensitivityMA}mA` : ''}
                    </span>
                  </div>

                  {/* INTERACTIVE TOGGLE SWITCH LEVER (CHAVE LIGAR/DESLIGAR) */}
                  <div className="my-3 flex flex-col items-center gap-1.5 w-full">
                    <button
                      onClick={() => toggleDevicePower(device.id)}
                      className={`w-12 h-16 rounded-xl p-1 flex flex-col justify-between items-center transition-all cursor-pointer shadow-inner border border-slate-700 ${
                        isDeviceActive ? 'bg-emerald-600' : 'bg-slate-950'
                      }`}
                      title="Clique para alternar Ligar / Desligar"
                    >
                      <span className={`text-[8px] font-black ${isDeviceActive ? 'text-white' : 'text-slate-500'}`}>
                        I (ON)
                      </span>

                      {/* Mechanical Switch Handle Knob */}
                      <div
                        className={`w-10 h-7 rounded-lg shadow-md border border-slate-600 transition-transform ${
                          isDeviceActive
                            ? 'bg-white translate-y-0 shadow-emerald-900'
                            : 'bg-slate-700 translate-y-3'
                        }`}
                      ></div>

                      <span className={`text-[8px] font-black ${!isDeviceActive ? 'text-slate-300' : 'text-emerald-200'}`}>
                        0 (OFF)
                      </span>
                    </button>

                    {/* Test Button [T] for IDR / Overload Simulator for Breakers */}
                    {device.type === 'idr' && (
                      <button
                        onClick={() => simulateDRTrip(device.id)}
                        className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/40 text-amber-300 text-[9px] font-extrabold cursor-pointer transition-all"
                        title="Simular teste de fuga de corrente 30mA (Desarma o DR)"
                      >
                        [ T ] TESTE DR
                      </button>
                    )}

                    {device.type === 'circuit_breaker' && device.powerW && (
                      <button
                        onClick={() => simulateOverload(device.id)}
                        className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/30 text-rose-300 text-[8px] font-bold cursor-pointer transition-all"
                        title="Simular disparo por sobrecarga"
                      >
                        ⚡ SOBRECARGA
                      </button>
                    )}
                  </div>

                  {/* Device Status Badge */}
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${badgeBg} mb-2`}>
                    {statusText}
                  </div>

                  {/* Action Buttons: Edit Amperage / Rename / Delete */}
                  <div className="flex items-center gap-1 mt-auto pt-2 border-t border-slate-800/80 w-full justify-center">
                    <button
                      onClick={() => setEditingDevice({ ...device })}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Renomear / Alterar Amperagem"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {device.type !== 'main_breaker' && (
                      <button
                        onClick={() => deleteDevice(device.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                        title="Excluir dispositivo do trilho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

        {/* QDC Safety Audit & Compliance Report Footer */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-300 text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> DIAGNÓSTICO DO QUADRO (NBR 5410 ITEM 6.5):
            </span>
            <span className="text-[11px] text-slate-500">
              {devices.length} Dispositivos instalados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-slate-200 block mb-1">✓ Proteção contra Curto-Circuito e Sobrecarga:</span>
              <p className="text-slate-400">
                {mainBreaker ? `Disjuntor Geral de ${mainBreaker.amperageA}A instalado.` : 'Sem disjuntor geral.'}{' '}
                {isMainOverloaded && <span className="text-rose-400 font-bold block mt-1">Atenção: Sobrecarga no geral! Aumente o disjuntor geral para compatibilizar.</span>}
              </p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-slate-200 block mb-1">✓ Proteção de Pessoas e Equipamentos (DR / DPS):</span>
              <p className="text-slate-400">
                {idrDevice ? `IDR de ${idrDevice.amperageA}A / ${idrDevice.sensitivityMA || 30}mA ativo.` : 'IDR não instalado.'}{' '}
                Proteção contra surtos atmosféricos garantida pelos dispositivos DPS.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: EDIT DEVICE (RENOMEAR / ALTERAR AMPERAGEM)         */}
      {/* ========================================================= */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Editar Dispositivo DIN
              </h3>
              <button
                onClick={() => setEditingDevice(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Device Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome / Identificador do Dispositivo:
                </label>
                <input
                  type="text"
                  value={editingDevice.name}
                  onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Amperage Rating */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Corrente Nominal (Amperagem A):
                </label>
                <select
                  value={editingDevice.amperageA}
                  onChange={(e) => setEditingDevice({ ...editingDevice, amperageA: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
                >
                  {Array.from(new Set([6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, editingDevice.amperageA]))
                    .sort((a, b) => a - b)
                    .map((amp) => (
                      <option key={amp} value={amp}>
                        {amp} Amperes ({amp}A)
                      </option>
                    ))}
                </select>
              </div>

              {/* Poles */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Número de Polos (Módulos DIN):
                </label>
                <select
                  value={editingDevice.poles}
                  onChange={(e) => setEditingDevice({ ...editingDevice, poles: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
                >
                  <option value={1}>1 Polo (Monofásico - 18mm)</option>
                  <option value={2}>2 Polos (Bifásico - 36mm)</option>
                  <option value={3}>3 Polos (Trifásico - 54mm)</option>
                  <option value={4}>4 Polos (Tetrapolar / N - 72mm)</option>
                </select>
              </div>

              {/* Breaker Curve if Disjuntor */}
              {(editingDevice.type === 'main_breaker' || editingDevice.type === 'circuit_breaker') && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Curva de Disparo do Disjuntor:
                  </label>
                  <select
                    value={editingDevice.curve || 'C'}
                    onChange={(e) => setEditingDevice({ ...editingDevice, curve: e.target.value as 'B' | 'C' | 'D' })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
                  >
                    <option value="B">Curva B (Cargas Resistivas - Chuveiros, Aquecedores)</option>
                    <option value="C">Curva C (Cargas Indutivas Gerais - Tomadas, Motores Leves)</option>
                    <option value="D">Curva D (Cargas Pesadas - Motores Grandes, Transformadores)</option>
                  </select>
                </div>
              )}

              {/* Power W if Circuit Breaker */}
              {editingDevice.type === 'circuit_breaker' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Potência da Carga Conectada (Watts):
                  </label>
                  <input
                    type="number"
                    value={editingDevice.powerW || 0}
                    onChange={(e) => setEditingDevice({ ...editingDevice, powerW: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingDevice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-xs"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD CUSTOM DEVICE                                  */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Adicionar Novo Dispositivo DIN
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Type Select */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tipo de Dispositivo:
                </label>
                <select
                  value={newDeviceType}
                  onChange={(e) => setNewDeviceType(e.target.value as DINDeviceType)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="circuit_breaker">Disjuntor Termomagnético (DTM)</option>
                  <option value="idr">Interruptor Diferencial Residual (IDR / DR)</option>
                  <option value="dps">Proteção contra Surtos (DPS)</option>
                  <option value="main_breaker">Disjuntor Geral Adicional</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome do Dispositivo:
                </label>
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              {/* Amperage */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Amperage Nominal (A):
                </label>
                <select
                  value={newDeviceAmperage}
                  onChange={(e) => setNewDeviceAmperage(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
                >
                  {[6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100].map((amp) => (
                    <option key={amp} value={amp}>
                      {amp} Amperes ({amp}A)
                    </option>
                  ))}
                </select>
              </div>

              {/* Poles */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Número de Polos:
                </label>
                <select
                  value={newDevicePoles}
                  onChange={(e) => setNewDevicePoles(Number(e.target.value) as 1 | 2 | 3 | 4)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
                >
                  <option value={1}>1 Polo (1P)</option>
                  <option value={2}>2 Polos (2P)</option>
                  <option value={3}>3 Polos (3P)</option>
                  <option value={4}>4 Polos (4P)</option>
                </select>
              </div>

              {/* Power W if Circuit Breaker */}
              {newDeviceType === 'circuit_breaker' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Potência da Carga (Watts):
                  </label>
                  <input
                    type="number"
                    value={newDevicePowerW}
                    onChange={(e) => setNewDevicePowerW(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddDevice}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-xs"
              >
                Adicionar ao Trilho DIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
