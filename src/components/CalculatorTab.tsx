import React, { useState } from 'react';
import {
  CircuitCalculationInput,
  LoadType,
  SystemType,
  InstallationMethod,
  SavedCircuit,
  PowerUnit
} from '../types';
import { calculateCircuit } from '../utils/electricalCalculator';
import {
  Zap,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { motion } from 'motion/react';

interface CalculatorTabProps {
  onSaveCircuit: (circuit: SavedCircuit) => void;
  onNavigateToQDC?: () => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({ onSaveCircuit, onNavigateToQDC }) => {
  const [input, setInput] = useState<CircuitCalculationInput>({
    name: 'C1 - Chuveiro Banheiro Social',
    loadType: 'tue',
    powerW: 5500,
    powerUnit: 'W',
    powerFactor: 1.0,
    voltageV: 220,
    systemType: 'bifasico_220',
    lengthMeters: 15,
    maxVoltageDropPercent: 2.0,
    installationMethod: 'B1',
    insulation: 'PVC',
    material: 'cobre',
    groupedCircuits: 2,
    ambientTempC: 30,
  });

  const [savedToast, setSavedToast] = useState(false);

  // Quick preset templates
  const applyPreset = (presetName: string) => {
    if (presetName === 'chuveiro') {
      setInput({
        ...input,
        name: 'Chuveiro Elétrico',
        loadType: 'tue',
        powerW: 7500,
        powerUnit: 'W',
        powerFactor: 1.0,
        voltageV: 220,
        systemType: 'bifasico_220',
        lengthMeters: 12,
        groupedCircuits: 2,
      });
    } else if (presetName === 'ar_condicionado') {
      setInput({
        ...input,
        name: 'Ar Condicionado 12.000 BTU',
        loadType: 'tue',
        powerW: 1400,
        powerUnit: 'W',
        powerFactor: 0.9,
        voltageV: 220,
        systemType: 'monofasico_220',
        lengthMeters: 18,
        groupedCircuits: 3,
      });
    } else if (presetName === 'iluminacao') {
      setInput({
        ...input,
        name: 'Circuito de Iluminação LED',
        loadType: 'iluminacao',
        powerW: 800,
        powerUnit: 'W',
        powerFactor: 0.95,
        voltageV: 127,
        systemType: 'monofasico_127',
        lengthMeters: 25,
        groupedCircuits: 4,
      });
    } else if (presetName === 'tug') {
      setInput({
        ...input,
        name: 'Tomadas TUG Quarto / Sala',
        loadType: 'tug',
        powerW: 2200,
        powerUnit: 'W',
        powerFactor: 0.95,
        voltageV: 127,
        systemType: 'monofasico_127',
        lengthMeters: 20,
        groupedCircuits: 3,
      });
    } else if (presetName === 'motor') {
      setInput({
        ...input,
        name: 'Bomba d\'Água / Motor 2 CV',
        loadType: 'motor',
        powerW: 1500,
        powerUnit: 'W',
        powerFactor: 0.8,
        voltageV: 220,
        systemType: 'trifasico_220',
        lengthMeters: 30,
        groupedCircuits: 1,
      });
    }
  };

  const result = calculateCircuit(input);

  const handleSave = () => {
    const newCircuit: SavedCircuit = {
      ...input,
      id: 'circ_' + Date.now(),
      result,
      createdAt: new Date().toLocaleString('pt-BR'),
    };
    onSaveCircuit(newCircuit);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Quick Templates Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Modelos Rápidos NBR 5410:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto touch-pan-x w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => applyPreset('chuveiro')}
            className="shrink-0 px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
          >
            Chuveiro 7500W
          </button>
          <button
            onClick={() => applyPreset('ar_condicionado')}
            className="shrink-0 px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
          >
            Ar Condicionado
          </button>
          <button
            onClick={() => applyPreset('iluminacao')}
            className="shrink-0 px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
          >
            Iluminação LED
          </button>
          <button
            onClick={() => applyPreset('tug')}
            className="shrink-0 px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
          >
            Tomadas TUG
          </button>
          <button
            onClick={() => applyPreset('motor')}
            className="shrink-0 px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
          >
            Motor 2 CV
          </button>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Live Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Parâmetros do Circuito
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              NBR 5410
            </span>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identificação do Circuito
              </label>
              <input
                type="text"
                value={input.name}
                onChange={(e) => setInput({ ...input, name: e.target.value })}
                placeholder="Ex: C1 - Chuveiro Suíte"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Load Type & Voltage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Carga
                </label>
                <select
                  value={input.loadType}
                  onChange={(e) =>
                    setInput({ ...input, loadType: e.target.value as LoadType })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value="tug">TUG (Tomada de Uso Geral)</option>
                  <option value="tue">TUE (Tomada de Uso Específico)</option>
                  <option value="iluminacao">Iluminação</option>
                  <option value="motor">Motor / Carga Indutiva</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sistema Elétrico & Tensão
                </label>
                <select
                  value={input.systemType}
                  onChange={(e) => {
                    const st = e.target.value as SystemType;
                    let v = 220;
                    if (st === 'monofasico_127') v = 127;
                    if (st === 'monofasico_220' || st === 'bifasico_220' || st === 'trifasico_220') v = 220;
                    if (st === 'bifasico_380' || st === 'trifasico_380') v = 380;
                    setInput({ ...input, systemType: st, voltageV: v });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value="monofasico_127">Monofásico (127 V - F+N)</option>
                  <option value="monofasico_220">Monofásico (220 V - F+N)</option>
                  <option value="bifasico_220">Bifásico (220 V - F+F)</option>
                  <option value="trifasico_220">Trifásico (220 V - 3F)</option>
                  <option value="trifasico_380">Trifásico (380 V - 3F)</option>
                </select>
              </div>
            </div>

            {/* Power & Power Factor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Potência da Carga
                  </label>
                  <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/80 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800">
                    {input.powerUnit === 'VA' || input.powerUnit === 'kVA' ? 'Aparente (VA)' : 'Ativa (W)'}
                  </span>
                </div>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={input.powerW === 0 || Number.isNaN(input.powerW) ? '' : input.powerW}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInput({
                        ...input,
                        powerW: val === '' ? ('' as unknown as number) : parseFloat(val),
                      });
                    }}
                    placeholder="Ex: 2200"
                    className="w-full pl-3 pr-2 py-2 text-sm bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  />
                  <select
                    value={input.powerUnit || 'W'}
                    onChange={(e) =>
                      setInput({
                        ...input,
                        powerUnit: e.target.value as PowerUnit,
                      })
                    }
                    className="px-2.5 py-2 text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="W">W (Watts)</option>
                    <option value="VA">VA (Volt-Amperes)</option>
                    <option value="kW">kW (Quilowatts)</option>
                    <option value="kVA">kVA (kVolt-Amperes)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fator de Potência (cos φ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  value={input.powerFactor === undefined || Number.isNaN(input.powerFactor) ? '' : input.powerFactor}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInput({
                      ...input,
                      powerFactor: val === '' ? ('' as unknown as number) : parseFloat(val),
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Live conversion breakdown badge */}
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-xs text-orange-900 dark:text-orange-200 flex flex-wrap items-center justify-between gap-2 font-medium">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>
                  <strong className="font-bold">Potência Ativa (P):</strong> {result.powerW.toFixed(0)} W
                </span>
              </div>
              <div>
                <strong className="font-bold">Potência Aparente (S):</strong> {result.powerVA.toFixed(0)} VA
              </div>
            </div>

            {/* Distance Length & Max Voltage Drop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comprimento do Circuito (metros)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={input.lengthMeters === 0 || Number.isNaN(input.lengthMeters) ? '' : input.lengthMeters}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInput({
                        ...input,
                        lengthMeters: val === '' ? ('' as unknown as number) : parseFloat(val),
                      });
                    }}
                    className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-900 dark:text-slate-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    m
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Queda de Tensão Tolerada (%)
                </label>
                <select
                  value={input.maxVoltageDropPercent}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      maxVoltageDropPercent: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value={2.0}>2.0% (Recomendado Terminal)</option>
                  <option value={3.0}>3.0% (Típico Tomadas)</option>
                  <option value={4.0}>4.0% (Limite Máximo NBR 5410)</option>
                  <option value={5.0}>5.0% (Instalações Especiais)</option>
                </select>
              </div>
            </div>

            {/* Installation Method & Grouping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Circuitos Agrupados no mesmo Eletroduto
                </label>
                <select
                  value={input.groupedCircuits}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      groupedCircuits: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value={1}>1 circuito (Sem agrupamento - Fator 1,00)</option>
                  <option value={2}>2 circuitos (Fator 0,80)</option>
                  <option value={3}>3 circuitos (Fator 0,70)</option>
                  <option value={4}>4 circuitos (Fator 0,65)</option>
                  <option value={5}>5 circuitos (Fator 0,60)</option>
                  <option value={6}>6 circuitos (Fator 0,57)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temperatura Ambiente (°C)
                </label>
                <select
                  value={input.ambientTempC}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      ambientTempC: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value={25}>25°C (Fator 1,06)</option>
                  <option value={30}>30°C (Padrão NBR - Fator 1,00)</option>
                  <option value={35}>35°C (Fator 0,94)</option>
                  <option value={40}>40°C (Fator 0,87)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Result Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Dimensionamento Resultante
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {result.powerW.toFixed(0)}W / {result.powerVA.toFixed(0)}VA @ {input.voltageV}V
              </span>
            </div>

            {/* Core Calculated Badges */}
            <div className="grid grid-cols-2 gap-3">
              {/* Ib */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Corrente de Projeto (Ib)
                </span>
                <span className="text-xl font-extrabold text-white">
                  {result.currentA.toFixed(2)} A
                </span>
              </div>

              {/* Chosen Cable Section */}
              <div className="bg-orange-950/80 p-3.5 rounded-xl border border-orange-500/40">
                <span className="text-[10px] uppercase font-bold text-orange-300 block mb-0.5">
                  Bitola do Cabo (Fase/N/PE)
                </span>
                <span className="text-2xl font-black text-orange-300">
                  {result.chosenCableMM2} mm²
                </span>
              </div>

              {/* Recommended Breaker */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Disjuntor DTM
                </span>
                <span className="text-xl font-bold text-amber-400">
                  {result.recommendedBreakerA}A (Curva {result.breakerCurve})
                </span>
              </div>

              {/* Voltage Drop */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Queda de Tensão
                </span>
                <span
                  className={`text-xl font-bold ${
                    result.voltageDropPercent <= input.maxVoltageDropPercent
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {result.voltageDropPercent.toFixed(2)}%
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({result.voltageDropV.toFixed(2)}V)
                  </span>
                </span>
              </div>
            </div>

            {/* Status de Conformidade NBR 5410 */}
            <div className={`p-4 rounded-xl border ${
              result.isCompliant
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {result.isCompliant ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-extrabold text-sm text-emerald-300">Conforme com NBR 5410</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                    <span className="font-extrabold text-sm text-rose-300">FORA DA NORMA NBR 5410</span>
                  </>
                )}
              </div>

              {!result.isCompliant ? (
                <div className="space-y-1.5 mt-2">
                  <p className="text-xs font-semibold text-rose-200/90">
                    Motivos da não conformidade:
                  </p>
                  <ul className="list-disc list-inside text-xs space-y-1.5 text-rose-100 bg-rose-900/40 p-2.5 rounded-lg border border-rose-800/60 font-medium">
                    {(result.nonComplianceReasons || []).map((reason, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-emerald-300/80 mt-1">
                  Todos os critérios de capacidade de condução, queda de tensão e proteção atenderam perfeitamente aos requisitos normativos.
                </p>
              )}
            </div>

            {/* Additional Info Box */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Capacidade do Cabo ({result.chosenCableMM2}mm²):</span>
                <span className="font-semibold text-white">{result.cableAmpacityA} A</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Fatores Agrup./Temp. Aplicados:</span>
                <span className="font-semibold text-slate-300">
                  {result.groupingFactor} × {result.tempFactor} = {(result.groupingFactor * result.tempFactor).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Eletroduto Mínimo Recomendado:</span>
                <span className="font-semibold text-amber-300">{result.conduitMinInches}</span>
              </div>
            </div>

            {/* Notes & Alerts */}
            {result.notes.length > 0 && (
              <div className="space-y-1.5">
                {result.notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2"
                  >
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar no Quadro de Distribuição</span>
            </button>

            {savedToast && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 font-semibold"
              >
                <span>✓ Circuito salvo e montado no QDC DIN!</span>
                {onNavigateToQDC && (
                  <button
                    onClick={onNavigateToQDC}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                  >
                    <span>Ver no QDC DIN</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
