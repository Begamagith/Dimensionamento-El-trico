import React, { useState } from 'react';
import { ProjectSettings } from '../types';
import { AMPACITY_TABLE_PVC_COPPER } from '../utils/electricalCalculator';
import { BookOpen, ShieldCheck, FileText, CheckCircle2, User, Save, Check } from 'lucide-react';

interface GuideTabProps {
  projectSettings: ProjectSettings;
  onSaveSettings: (settings: ProjectSettings) => void;
}

export const GuideTab: React.FC<GuideTabProps> = ({
  projectSettings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<ProjectSettings>(projectSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Project & Electrician Info Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-blue-100 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Dados do Projeto & Responsável Técnico
          </h3>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Informações para os Relatórios</span>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Dados do projeto salvos com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Projeto / Obra
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Eletricista / Projetista
            </label>
            <input
              type="text"
              value={formData.electricianName}
              onChange={(e) => setFormData({ ...formData, electricianName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Dados</span>
            </button>
          </div>
        </form>
      </div>

      {/* Guide Content: NBR 5410 Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minimum Cable Sections */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-blue-100 flex items-center gap-2 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            1. Bitolas Mínimas (NBR 5410 - Item 6.2.6)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Independentemente da corrente calculada, a norma estabelece seções transversais mínimas para condutores de cobre em instalações fixas:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Circuitos de Iluminação</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Lâmpadas, plafons e lustres</p>
              </div>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-300 text-sm bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg">
                1,5 mm²
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Circuitos de Tomadas (TUG / TUE)</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Força, eletrodomésticos, chuveiro, ar condicionado</p>
              </div>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-300 text-sm bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg">
                2,5 mm²
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Sinalização e Controle</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Comandos e automação residencial</p>
              </div>
              <span className="font-extrabold text-slate-700 dark:text-slate-300 text-sm bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                0,5 mm²
              </span>
            </div>
          </div>
        </div>

        {/* Breaker Curves */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            2. Curvas dos Disjuntores Termomagnéticos (DTM)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            A curva de disparo magnético define a rapidez de atuação em curto-circuito em relação à corrente nominal (In):
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 dark:text-white">Curva B (3 a 5 × In)</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md">
                  Cargas Resistivas
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Ideal para chuveiros, aquecedores elétricos, aquecedores de água e lâmpadas incandescentes.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 dark:text-white">Curva C (5 a 10 × In)</span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-md">
                  Uso Geral (Padrão)
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Recomendado para tomadas de uso geral (TUGs), refrigeradores, micro-ondas, iluminação fluorescente/LED e pequenas cargas indutivas.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 dark:text-white">Curva D (10 a 20 × In)</span>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md">
                  Cargas Motores / Picos
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Indicado para grandes motores elétricos, transformadores e cargas com alto pico de corrente de partida.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ampacity Reference Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Tabela de Capacidade de Condução de Corrente (Método B1 - Cobre / PVC 70°C)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300 font-bold">
                <th className="p-3">Seção Nominal (mm²)</th>
                <th className="p-3">2 Condutores Carregados (Mono / Bifásico)</th>
                <th className="p-3">3 Condutores Carregados (Trifásico)</th>
                <th className="p-3">Disjuntor Típico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {AMPACITY_TABLE_PVC_COPPER[2].slice(0, 8).map((item, idx) => {
                const item3 = AMPACITY_TABLE_PVC_COPPER[3][idx];
                return (
                  <tr key={item.section} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                      {item.section} mm²
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.ampacity} A
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item3 ? `${item3.ampacity} A` : '-'}
                    </td>
                    <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {item.section === 1.5 ? '10 A' : item.section === 2.5 ? '16 A / 20 A' : item.section === 4.0 ? '25 A' : item.section === 6.0 ? '32 A' : item.section === 10 ? '50 A' : '63 A+'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
