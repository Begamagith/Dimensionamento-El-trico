import React, { useState } from 'react';
import { Calculator, Sliders, Gauge, Info } from 'lucide-react';

export const HelpersTab: React.FC = () => {
  // Calculator 1: Voltage Drop Comparison
  const [vdVoltage, setVdVoltage] = useState<number | string>(220);
  const [vdCurrent, setVdCurrent] = useState<number | string>(25);
  const [vdLength, setVdLength] = useState<number | string>(40);
  const [vdIs3Phase, setVdIs3Phase] = useState(false);

  // Calculator 2: Unit Converter
  const [convWatts, setConvWatts] = useState<number | string>(2200);
  const [convVoltage, setConvVoltage] = useState<number | string>(220);
  const [convPF, setConvPF] = useState<number | string>(0.92);

  // Calculator 3: Conduit sizing
  const [cableSize, setCableSize] = useState<number>(2.5);
  const [cableCount, setCableCount] = useState<number | string>(4);

  // Helper calculation for voltage drop comparison table
  const RESISTIVITY = 0.0178; // Cobre
  const cableSections = [1.5, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0];

  const numVdVoltage = typeof vdVoltage === 'number' ? vdVoltage : (parseFloat(vdVoltage) || 0);
  const numVdCurrent = typeof vdCurrent === 'number' ? vdCurrent : (parseFloat(vdCurrent) || 0);
  const numVdLength = typeof vdLength === 'number' ? vdLength : (parseFloat(vdLength) || 0);

  const calculateVd = (section: number) => {
    const K = vdIs3Phase ? Math.sqrt(3) : 2.0;
    const deltaV = (K * RESISTIVITY * numVdLength * numVdCurrent) / section;
    const percent = numVdVoltage > 0 ? (deltaV / numVdVoltage) * 100 : 0;
    return { deltaV, percent };
  };

  // Helper unit conversions
  const numWatts = typeof convWatts === 'number' ? convWatts : (parseFloat(convWatts) || 0);
  const numVoltage = typeof convVoltage === 'number' ? convVoltage : (parseFloat(convVoltage) || 0);
  const numPF = typeof convPF === 'number' ? convPF : (parseFloat(convPF) || 0);

  const convVA = numPF > 0 ? numWatts / numPF : 0;
  const convAmperes = (numVoltage > 0 && numPF > 0) ? numWatts / (numVoltage * numPF) : 0;
  const convCV = numWatts / 735.5; // 1 CV ~ 735.5W
  const convHP = numWatts / 745.7; // 1 HP ~ 745.7W

  // Conduit size helper
  const getConduitRecommendation = (size: number, countVal: number | string) => {
    const count = typeof countVal === 'number' ? countVal : (parseInt(countVal, 10) || 0);
    const totalAreaEstimate = count * (size * 2.5); // área aproximada com isolamento
    if (totalAreaEstimate <= 35) return { inch: '1/2"', mm: 16 };
    if (totalAreaEstimate <= 75) return { inch: '3/4"', mm: 20 };
    if (totalAreaEstimate <= 140) return { inch: '1"', mm: 25 };
    if (totalAreaEstimate <= 240) return { inch: '1.1/4"', mm: 32 };
    if (totalAreaEstimate <= 350) return { inch: '1.1/2"', mm: 40 };
    return { inch: '2"', mm: 50 };
  };

  const conduitResult = getConduitRecommendation(cableSize, cableCount);

  return (
    <div className="space-y-8">
      {/* TOOL 1: Voltage Drop Table Comparison */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-blue-100 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Comparador de Queda de Tensão para Longas Distâncias
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              Analise a perda em volts e % para várias bitolas em alimentadores e redes externas
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tensão Nominal (V)
            </label>
            <input
              type="number"
              value={vdVoltage}
              onChange={(e) => setVdVoltage(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Corrente de Carga (A)
            </label>
            <input
              type="number"
              value={vdCurrent}
              onChange={(e) => setVdCurrent(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Distância (m)
            </label>
            <input
              type="number"
              value={vdLength}
              onChange={(e) => setVdLength(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sistema Elétrico
            </label>
            <select
              value={vdIs3Phase ? 'tri' : 'mono'}
              onChange={(e) => setVdIs3Phase(e.target.value === 'tri')}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            >
              <option value="mono">Monofásico / Bifásico</option>
              <option value="tri">Trifásico</option>
            </select>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {cableSections.map((sec) => {
            const { deltaV, percent } = calculateVd(sec);
            const isGood = percent <= 4.0;
            return (
              <div
                key={sec}
                className={`p-3.5 rounded-xl border transition-all ${
                  isGood
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50/50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  {sec} mm²
                </span>
                <span
                  className={`text-lg font-extrabold mt-1 block ${
                    isGood ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {percent.toFixed(2)}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  -{deltaV.toFixed(2)} Volts
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOOL 2: Power and Current Conversions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Converter Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Conversor Rápido: Watts, VA e Amperes
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Potência Ativa (Watts)
              </label>
              <input
                type="number"
                value={convWatts}
                onChange={(e) => setConvWatts(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tensão (V)
                </label>
                <input
                  type="number"
                  value={convVoltage}
                  onChange={(e) => setConvVoltage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fator de Potência
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={convPF}
                  onChange={(e) => setConvPF(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                  Corrente Calculada
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {convAmperes.toFixed(2)} A
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                  Potência Aparente
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {convVA.toFixed(0)} VA
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                  Potência em CV
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {convCV.toFixed(2)} CV
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                  Potência em HP
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {convHP.toFixed(2)} HP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conduit Occupancy Calculator */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Dimensionamento de Eletrodutos (NBR 5410)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Respeita a taxa máxima de ocupação de 40% da área útil do eletroduto
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bitola do Condutor (mm²)
              </label>
              <select
                value={cableSize}
                onChange={(e) => setCableSize(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
              >
                <option value={1.5}>1.5 mm²</option>
                <option value={2.5}>2.5 mm²</option>
                <option value={4.0}>4.0 mm²</option>
                <option value={6.0}>6.0 mm²</option>
                <option value={10.0}>10.0 mm²</option>
                <option value={16.0}>16.0 mm²</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantidade de Condutores no mesmo Eletroduto
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={cableCount}
                onChange={(e) => setCableCount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/60 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                  Eletroduto Mínimo Recomendado:
                </span>
                <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
                  {conduitResult.inch} ({conduitResult.mm} mm)
                </span>
              </div>
              <Info className="w-6 h-6 text-indigo-400 dark:text-indigo-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

