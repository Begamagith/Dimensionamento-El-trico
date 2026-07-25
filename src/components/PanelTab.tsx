import React from 'react';
import { SavedCircuit, TabId } from '../types';
import {
  Layers,
  Trash2,
  Copy,
  Plus,
  Zap,
  Printer,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface PanelTabProps {
  savedCircuits: SavedCircuit[];
  onDeleteCircuit: (id: string) => void;
  onDuplicateCircuit: (circuit: SavedCircuit) => void;
  onNavigateToCalculator: () => void;
  onNavigateToQDC?: () => void;
}

export const PanelTab: React.FC<PanelTabProps> = ({
  savedCircuits,
  onDeleteCircuit,
  onDuplicateCircuit,
  onNavigateToCalculator,
  onNavigateToQDC,
}) => {
  // Calculations for total load
  const totalPowerW = savedCircuits.reduce((sum, c) => sum + (c.result?.powerW ?? c.powerW), 0);
  const totalPowerVA = savedCircuits.reduce(
    (sum, c) => sum + (c.result?.powerVA ?? (c.powerFactor ? c.powerW / c.powerFactor : c.powerW)),
    0
  );

  // Fator de demanda simplificado NBR 5410 para iluminação/tomadas residenciais
  let demandFactor = 0.8;
  if (totalPowerW > 10000) demandFactor = 0.45;
  else if (totalPowerW > 5000) demandFactor = 0.6;

  const totalDemandPowerW = totalPowerW * demandFactor;

  // Corrente total estimada (assumindo bifásico 220V ou trifásico)
  const estimatedMainCurrentA = totalDemandPowerW / 220; // Aproximado para cálculo do disjuntor geral

  // Disjuntor Geral Recomendado
  let mainBreakerA = 32;
  if (estimatedMainCurrentA > 100) mainBreakerA = 125;
  else if (estimatedMainCurrentA > 80) mainBreakerA = 100;
  else if (estimatedMainCurrentA > 63) mainBreakerA = 80;
  else if (estimatedMainCurrentA > 50) mainBreakerA = 63;
  else if (estimatedMainCurrentA > 40) mainBreakerA = 50;
  else if (estimatedMainCurrentA > 32) mainBreakerA = 40;

  const handlePrint = () => {
    window.print();
  };

  const copyPanelSummary = () => {
    const summary = savedCircuits
      .map(
        (c, idx) =>
          `C${idx + 1}: ${c.name} | Potência: ${c.powerW}W | Cabo: ${c.result.chosenCableMM2}mm² | Disjuntor: ${c.result.recommendedBreakerA}A (Curva ${c.result.breakerCurve}) | Queda: ${c.result.voltageDropPercent.toFixed(2)}%`
      )
      .join('\n');

    navigator.clipboard.writeText(
      `--- QUADRO DE DISTRIBUIÇÃO NBR 5410 ---\n` +
        `Potência Total Instalada: ${totalPowerW} W\n` +
        `Disjuntor Geral Recomendado: ${mainBreakerA} A\n\n` +
        summary
    );
    alert('Resumo do Quadro de Cargas copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6">
      {/* Panel Top Metrics Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 transition-colors duration-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>Quadro de Distribuição de Cargas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-blue-100 tracking-tight">
            Resumo Geral do QDC
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
            Total de {savedCircuits.length} circuito(s) dimensionado(s) e cadastrado(s)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={copyPanelSummary}
            className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Copiar Resumo</span>
          </button>

          {onNavigateToQDC && (
            <button
              onClick={onNavigateToQDC}
              className="px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              title="Visualizar e simular o Quadro de Distribuição DIN montado em tempo real"
            >
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Ver QDC DIN ({savedCircuits.length})</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Imprimir Relatório</span>
          </button>

          <button
            onClick={onNavigateToCalculator}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Circuito</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Installed Power */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            Potência Total Instalada
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {(totalPowerW / 1000).toFixed(2)} kW
            </span>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              {(totalPowerVA / 1000).toFixed(2)} kVA
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            {totalPowerW.toFixed(0)} W (Ativa) / {totalPowerVA.toFixed(0)} VA (Aparente)
          </p>
        </div>

        {/* Estimated Demand Power */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            Demanda Prevista (F.D. {(demandFactor * 100).toFixed(0)}%)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">
              {(totalDemandPowerW / 1000).toFixed(2)} kW
            </span>
            <span className="text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/80 px-2 py-0.5 rounded-md">
              NBR 5410
            </span>
          </div>
        </div>

        {/* Recommended Main Breaker */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Disjuntor Geral Sugerido
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {mainBreakerA} A
            </span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md">
              Curva C
            </span>
          </div>
        </div>
      </div>

      {/* Circuit List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Tabela de Circuitos Cadastrados
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {savedCircuits.length} circuito(s)
          </span>
        </div>

        {savedCircuits.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <Zap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">
              Nenhum circuito cadastrado no Quadro de Distribuição.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              Utilize a calculadora na primeira aba para dimensionar e adicionar seus circuitos aqui.
            </p>
            <button
              onClick={onNavigateToCalculator}
              className="mt-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-all cursor-pointer min-h-[44px]"
            >
              Ir para Calculadora
            </button>
          </div>
        ) : (
          <div>
            {/* Mobile Cards List (Visible on phones < md) */}
            <div className="block md:hidden p-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
              {savedCircuits.map((c, idx) => (
                <div key={c.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        C{idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">
                        {c.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDuplicateCircuit(c)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Duplicar Circuito"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCircuit(c.id)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Excluir Circuito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium block uppercase">Potência / Corrente</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {c.result?.powerW ? c.result.powerW.toFixed(0) : c.powerW} W / {c.result?.powerVA ? c.result.powerVA.toFixed(0) : Math.round(c.powerFactor ? c.powerW / c.powerFactor : c.powerW)} VA ({c.result.currentA.toFixed(1)} A)
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium block uppercase">Tensão / Tipo</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.voltageV}V ({c.loadType})</span>
                    </div>
                    <div className="bg-indigo-50/70 dark:bg-indigo-950/60 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                      <span className="text-[10px] text-indigo-500 dark:text-indigo-300 font-medium block uppercase">Bitola do Cabo</span>
                      <span className="font-black text-indigo-700 dark:text-indigo-400">{c.result.chosenCableMM2} mm²</span>
                    </div>
                    <div className="bg-amber-50/70 dark:bg-amber-950/60 p-2 rounded-xl border border-amber-100 dark:border-amber-900/60">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block uppercase">Disjuntor DTM</span>
                      <span className="font-bold text-amber-800 dark:text-amber-300">{c.result.recommendedBreakerA}A (Curva {c.result.breakerCurve})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Distância: {c.lengthMeters}m</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        c.result.voltageDropPercent <= c.maxVoltageDropPercent
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      Queda de Tensão: {c.result.voltageDropPercent.toFixed(2)}%
                    </span>
                  </div>

                  {/* Status NBR 5410 & Motivos de Não Conformidade */}
                  {(!c.result.isCompliant || c.result.voltageDropPercent > c.maxVoltageDropPercent) && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-rose-800 dark:text-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>Por que está fora da norma:</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-700 dark:text-rose-300">
                        {(c.result.nonComplianceReasons && c.result.nonComplianceReasons.length > 0
                          ? c.result.nonComplianceReasons
                          : [
                              c.result.voltageDropPercent > c.maxVoltageDropPercent
                                ? `Queda de tensão de ${c.result.voltageDropPercent.toFixed(2)}% excede o limite estipulado de ${c.maxVoltageDropPercent}%.`
                                : 'Incompatibilidade entre a capacidade do cabo e o disjuntor de proteção.'
                            ]
                        ).map((reason, rIdx) => (
                          <li key={rIdx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View (Visible on tablet & desktop >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300 font-semibold">
                    <th className="p-3.5">Circuito</th>
                    <th className="p-3.5">Carga / Tipo</th>
                    <th className="p-3.5">Potência</th>
                    <th className="p-3.5">Corrente (Ib)</th>
                    <th className="p-3.5">Bitola do Cabo</th>
                    <th className="p-3.5">Disjuntor</th>
                    <th className="p-3.5">Queda %</th>
                    <th className="p-3.5">Status NBR 5410</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {savedCircuits.map((c, idx) => (
                    <React.Fragment key={c.id}>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          C{idx + 1}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">
                            {c.loadType} • {c.voltageV}V ({c.lengthMeters}m)
                          </p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {c.result?.powerW ? c.result.powerW.toFixed(0) : c.powerW} W
                          </p>
                          <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                            {c.result?.powerVA ? c.result.powerVA.toFixed(0) : Math.round(c.powerFactor ? c.powerW / c.powerFactor : c.powerW)} VA
                          </p>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {c.result.currentA.toFixed(2)} A
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-md border border-indigo-100 dark:border-indigo-800">
                            {c.result.chosenCableMM2} mm²
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold rounded-md border border-amber-100 dark:border-amber-800">
                            {c.result.recommendedBreakerA}A (Curva {c.result.breakerCurve})
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`font-semibold ${
                              c.result.voltageDropPercent <= c.maxVoltageDropPercent
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400 font-bold'
                            }`}
                          >
                            {c.result.voltageDropPercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-3.5">
                          {c.result.isCompliant && c.result.voltageDropPercent <= c.maxVoltageDropPercent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Conforme
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                              <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              Fora da Norma
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onDuplicateCircuit(c)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Duplicar Circuito"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteCircuit(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Circuito"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {(!c.result.isCompliant || c.result.voltageDropPercent > c.maxVoltageDropPercent) && (
                        <tr className="bg-rose-50/50 dark:bg-rose-950/20">
                          <td colSpan={9} className="px-3.5 py-2">
                            <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300 text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Por que está fora da norma: </span>
                                {(c.result.nonComplianceReasons && c.result.nonComplianceReasons.length > 0
                                  ? c.result.nonComplianceReasons
                                  : [
                                      c.result.voltageDropPercent > c.maxVoltageDropPercent
                                        ? `Queda de tensão de ${c.result.voltageDropPercent.toFixed(2)}% excede o limite estipulado de ${c.maxVoltageDropPercent}%.`
                                        : 'Incompatibilidade entre a capacidade do cabo e o disjuntor de proteção.'
                                    ]
                                ).join(' • ')}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
