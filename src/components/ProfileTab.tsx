import React, { useState, useEffect } from 'react';
import {
  User,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Award,
  ShieldCheck,
  Briefcase,
  Wrench,
  Share2,
  Copy,
  Check,
  FileText,
  Sparkles,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Save,
  Globe,
  Instagram,
  QrCode,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectSettings } from '../types';

export interface ElectricianProfile {
  fullName: string;
  professionalTitle: string; // e.g. Eletricista Instalador Industrial e Residencial
  creaCft: string; // Registro CFT / CREA
  phoneWhatsApp: string;
  email: string;
  cityState: string;
  bio: string;
  hourlyRate: string;
  visitFee: string;
  instagram: string;
  website: string;
  specialties: string[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    validUntil: string;
    active: boolean;
  }[];
  equipment: {
    id: string;
    name: string;
    category: 'Medição' | 'EPI' | 'Ferramental' | 'Segurança';
    owned: boolean;
  }[];
}

const DEFAULT_PROFILE: ElectricianProfile = {
  fullName: 'Carlos Eduardo Oliveira',
  professionalTitle: 'Eletricista Profissional & Técnico Credenciado CFT',
  creaCft: 'CFT-BR 123456789',
  phoneWhatsApp: '(11) 98765-4321',
  email: 'carlos.eletrica@exemplo.com.br',
  cityState: 'São Paulo - SP',
  bio: 'Especialista em instalações elétricas residenciais e comerciais de acordo com a norma ABNT NBR 5410. Montagem de QDC, laudos técnicos, infraestrutura e adequação de padrão de entrada.',
  hourlyRate: '120.00',
  visitFee: '150.00',
  instagram: '@carloseletricista.prof',
  website: 'www.carloseletrica.com.br',
  specialties: [
    'Instalações Residenciais NBR 5410',
    'Montagem e Organização de QDC DIN',
    'Padrão de Entrada de Energia (Concessionária)',
    'Quadros Industriais e Comandos Elétricos',
    'Proteção DR, DPS e Aterramento TN-S / TT',
    'Infraestrutura e Passagem de Cabos',
    'Energia Solar Fotovoltaica'
  ],
  certifications: [
    { id: '1', name: 'NR-10 - Segurança em Instalações e Serviços em Eletricidade', issuer: 'SENAI / Cursos NR', validUntil: '2027-08', active: true },
    { id: '2', name: 'NR-35 - Trabalho em Altura', issuer: 'SENAI', validUntil: '2026-12', active: true },
    { id: '3', name: 'SEP - Sistema Elétrico de Potência (NR-10 Complementar)', issuer: 'SENAI', validUntil: '2027-02', active: true },
    { id: '4', name: 'Técnico em Eletrotécnica - Registro CFT/CRT', issuer: 'MEC / CFT', validUntil: 'Ativo Vitalício', active: true },
  ],
  equipment: [
    { id: 'eq1', name: 'Alicate Amperímetro True RMS CAT III 600V', category: 'Medição', owned: true },
    { id: 'eq2', name: 'Multímetro Digital Digital True RMS CAT IV', category: 'Medição', owned: true },
    { id: 'eq3', name: 'Megômetro de Isolamento Elétrico (500V/1000V)', category: 'Medição', owned: true },
    { id: 'eq4', name: 'Testador de RCD / DR e DR Trip Test', category: 'Medição', owned: true },
    { id: 'eq5', name: 'Alicate Prensa Terminal Ilhós e Anelar', category: 'Ferramental', owned: true },
    { id: 'eq6', name: 'Jogo de Chaves Isoladas 1000V (VDE)', category: 'Ferramental', owned: true },
    { id: 'eq7', name: 'Câmera Termográfica Flir / Infravermelho', category: 'Medição', owned: true },
    { id: 'eq8', name: 'Kit EPI Completo (Capacete, Luva 1000V, Óculos, Bota)', category: 'EPI', owned: true },
    { id: 'eq9', name: 'Passador de Fios Profissional em Aço/Nylon', category: 'Ferramental', owned: true },
    { id: 'eq10', name: 'Sequencímetro / Medidor de Fase Trifásico', category: 'Medição', owned: true }
  ]
};

const ALL_AVAILABLE_SPECIALTIES = [
  'Instalações Residenciais NBR 5410',
  'Montagem e Organização de QDC DIN',
  'Padrão de Entrada de Energia (Concessionária)',
  'Quadros Industriais e Comandos Elétricos',
  'Proteção DR, DPS e Aterramento TN-S / TT',
  'Infraestrutura e Passagem de Cabos',
  'Energia Solar Fotovoltaica',
  'Automação Residencial e Smart Home',
  'Laudos e Vistorias Técnicas (ART/TRT)',
  'Cabeamento Estruturado e Redes',
  'Geradores e Nobreaks',
  'Projetos Elétricos CAD'
];

interface ProfileTabProps {
  projectSettings: ProjectSettings;
  setProjectSettings: React.Dispatch<React.SetStateAction<ProjectSettings>>;
}

export function ProfileTab({ projectSettings, setProjectSettings }: ProfileTabProps) {
  const [profile, setProfile] = useState<ElectricianProfile>(() => {
    try {
      const saved = localStorage.getItem('nbr5410_electrician_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading profile from localStorage', e);
    }
    return DEFAULT_PROFILE;
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeSubView, setActiveSubView] = useState<'card' | 'edit' | 'certifications' | 'equipment' | 'proposal'>('card');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<boolean>(false);

  // Auto-sync project settings electrician name if changed
  useEffect(() => {
    try {
      localStorage.setItem('nbr5410_electrician_profile', JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile to localStorage', e);
    }
  }, [profile]);

  const handleProfileChange = (field: keyof ElectricianProfile, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSyncToProjectSettings = () => {
    setProjectSettings((prev) => ({
      ...prev,
      electricianName: `${profile.fullName} (${profile.creaCft || 'Eletricista'})`
    }));
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const toggleSpecialty = (spec: string) => {
    setProfile((prev) => {
      const exists = prev.specialties.includes(spec);
      return {
        ...prev,
        specialties: exists
          ? prev.specialties.filter((s) => s !== spec)
          : [...prev.specialties, spec]
      };
    });
  };

  const toggleEquipmentOwned = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      equipment: prev.equipment.map((eq) =>
        eq.id === id ? { ...eq, owned: !eq.owned } : eq
      )
    }));
  };

  const toggleCertificationActive = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert) =>
        cert.id === id ? { ...cert, active: !cert.active } : cert
      )
    }));
  };

  // WhatsApp share link generator
  const cleanPhone = profile.phoneWhatsApp.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá ${profile.fullName}, vi seu Cartão do Eletricista e gostaria de solicitar um orçamento para um serviço elétrico!`
  )}`;

  // Formatted business card text for copy
  const digitalCardText = `⚡ *${profile.fullName.toUpperCase()}* - ${profile.professionalTitle}
📋 *Registro:* ${profile.creaCft}
📍 *Atendimento:* ${profile.cityState}
📱 *WhatsApp:* ${profile.phoneWhatsApp}
✉️ *E-mail:* ${profile.email}
${profile.instagram ? `📷 *Instagram:* ${profile.instagram}\n` : ''}
💡 *Principais Serviços:*
${profile.specialties.map((s) => `• ${s}`).join('\n')}

🔒 *Normas & Segurança:* NBR 5410 | NR-10 | NR-35 Ativas
Visita Técnica a partir de R$ ${profile.visitFee}`;

  // Proposal / Technical Terms template
  const proposalTemplate = `DECLARAÇÃO DE CONFORMIDADE TÉCNICA E GARANTIA DA INSTALAÇÃO ELÉTRICA

Cliente: ${projectSettings.clientName || '________________________'}
Projeto: ${projectSettings.projectName || 'Instalação Residencial/Comercial'}
Local: ${profile.cityState}
Data: ${new Date().toLocaleDateString('pt-BR')}

Eu, ${profile.fullName}, credenciado sob registro ${profile.creaCft}, declaro que os serviços de dimensionamento e instalação executados atendem rigorosamente aos parâmetros da norma ABNT NBR 5410 (Instalações Elétricas de Baixa Tensão) e NR-10 (Segurança em Serviços com Eletricidade).

RESUMO DA INSTALAÇÃO REALIZADA:
- Proteção contra Choques Elétricos: Dispositivo DR de Alta Sensibilidade (30mA) instalado.
- Proteção contra Surtos Atmosféricos: Dispositivo de Proteção contra Surtos (DPS) Classe II integrado.
- Aterramento Elétrico: Verificado e interligado ao Quadro de Distribuição Principal.
- Dimensionamento de Condutores: Condutores dimensionados conforme capacidade de condução de corrente e limite máximo de queda de tensão (NBR 5410).

GARANTIA TÉCNICA DOS SERVIÇOS:
Garantia de 90 dias para a mão de obra aplicada a contar da data de entrega da obra.

_____________________________________________________
Assinatura do Profissional Responsável
${profile.fullName} - ${profile.creaCft}
WhatsApp: ${profile.phoneWhatsApp}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <User className="w-64 h-64 text-orange-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shrink-0 border-2 border-white/20">
              {profile.fullName.charAt(0) || 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-white">{profile.fullName || 'Seu Nome'}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  NBR 5410 Verificado
                </span>
              </div>
              <p className="text-sm font-medium text-slate-300 mt-1">{profile.professionalTitle}</p>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-orange-400" />
                  {profile.creaCft}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  {profile.cityState}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {profile.phoneWhatsApp}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleSyncToProjectSettings}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Usar nos Relatórios do Projeto</span>
            </button>
            <button
              onClick={() => setActiveSubView(activeSubView === 'edit' ? 'card' : 'edit')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-orange-400" />
              <span>{activeSubView === 'edit' ? 'Ver Cartão Virtual' : 'Editar Meu Perfil'}</span>
            </button>
          </div>
        </div>

        {saveSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dados sincronizados com sucesso para as memórias de cálculo e propostas!</span>
          </motion.div>
        )}
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubView('card')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] whitespace-nowrap ${
            activeSubView === 'card'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Cartão Digital WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveSubView('edit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] whitespace-nowrap ${
            activeSubView === 'edit'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dados do Perfil</span>
        </button>

        <button
          onClick={() => setActiveSubView('certifications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] whitespace-nowrap ${
            activeSubView === 'certifications'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Normas & Certificações ({profile.certifications.filter((c) => c.active).length})</span>
        </button>

        <button
          onClick={() => setActiveSubView('equipment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] whitespace-nowrap ${
            activeSubView === 'equipment'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Kit de Ferramentas ({profile.equipment.filter((e) => e.owned).length}/{profile.equipment.length})</span>
        </button>

        <button
          onClick={() => setActiveSubView('proposal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] whitespace-nowrap ${
            activeSubView === 'proposal'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Termo de Garantia & NBR</span>
        </button>
      </div>

      {/* VIEW 1: DIGITAL BUSINESS CARD */}
      {activeSubView === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Preview Container */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-700/80 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-400">Cartão Profissional Digital</h3>
                    <p className="text-[11px] text-slate-400 font-mono">NBR 5410 • INSTALAÇÕES SEGURAS</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded-md border border-emerald-500/30">
                  DISPONÍVEL
                </span>
              </div>

              {/* Card Body */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-white">{profile.fullName}</h2>
                  <p className="text-xs font-bold text-orange-400 mt-0.5">{profile.professionalTitle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Registro / Habilitação</p>
                      <p className="font-bold text-white">{profile.creaCft}</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Região de Atendimento</p>
                      <p className="font-bold text-white">{profile.cityState}</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">WhatsApp Profissional</p>
                      <p className="font-bold text-emerald-300">{profile.phoneWhatsApp}</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Visita Técnica a partir de</p>
                      <p className="font-bold text-amber-300">R$ {profile.visitFee}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 italic">
                    "{profile.bio}"
                  </p>
                </div>

                {/* Specialties Badges */}
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Especialidades Atendidas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.specialties.map((spec, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-800/90 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700">
                        ⚡ {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certs summary */}
                <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>NR-10 • NR-35 • NBR 5410 • Sistema de Proteção DR & DPS</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-700/80 flex flex-wrap gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Testar Conversa no WhatsApp</span>
                </a>
                <button
                  onClick={() => copyToClipboard(digitalCardText, 'card')}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
                >
                  {copiedText === 'card' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-orange-400" />
                      <span>Copiar Texto Formatado</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Sharing & Text Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold text-base">
                <Share2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3>Apresentação Rápida para Clientes</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Copie o texto de apresentação formatado para enviar diretamente pelo WhatsApp quando um cliente solicitar seu contato ou orçamento:
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {digitalCardText}
              </div>

              <button
                onClick={() => copyToClipboard(digitalCardText, 'share')}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                {copiedText === 'share' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Texto Copiado para a Área de Transferência!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto para Enviar no WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EDIT PROFILE FORM */}
      {activeSubView === 'edit' && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Editar Dados Profissionais
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Estes dados serão automaticamente salvos e usados na exportação de memoriais e orçamentos do app.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo / Empresa *</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => handleProfileChange('fullName', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: Carlos Eduardo Silva"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Título Profissional *</label>
              <input
                type="text"
                value={profile.professionalTitle}
                onChange={(e) => handleProfileChange('professionalTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: Eletricista Instalador NBR 5410"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registro CFT / CREA / Certificação</label>
              <input
                type="text"
                value={profile.creaCft}
                onChange={(e) => handleProfileChange('creaCft', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: CFT-BR 12345678"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp *</label>
              <input
                type="text"
                value={profile.phoneWhatsApp}
                onChange={(e) => handleProfileChange('phoneWhatsApp', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: (11) 98765-4321"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail de Contato</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="eletricista@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cidade / Estado de Atendimento *</label>
              <input
                type="text"
                value={profile.cityState}
                onChange={(e) => handleProfileChange('cityState', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: São Paulo - SP e Grande ABC"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Mínimo da Visita Técnica (R$)</label>
              <input
                type="text"
                value={profile.visitFee}
                onChange={(e) => handleProfileChange('visitFee', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="150.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor da Hora Técnica (R$)</label>
              <input
                type="text"
                value={profile.hourlyRate}
                onChange={(e) => handleProfileChange('hourlyRate', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="120.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Instagram Profissional</label>
              <input
                type="text"
                value={profile.instagram}
                onChange={(e) => handleProfileChange('instagram', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="@seu.instagram"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Website / Link de Portfólio</label>
              <input
                type="text"
                value={profile.website}
                onChange={(e) => handleProfileChange('website', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="www.seusite.com.br"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Apresentação / Resumo Profissional</label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Descreva brevemente sua experiência e diferenciais técnicos..."
            />
          </div>

          {/* Specialty Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Selecione suas Especialidades:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_AVAILABLE_SPECIALTIES.map((spec) => {
                const isSelected = profile.specialties.includes(spec);
                return (
                  <button
                    type="button"
                    key={spec}
                    onClick={() => toggleSpecialty(spec)}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{spec}</span>
                    {isSelected && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                handleSyncToProjectSettings();
                setActiveSubView('card');
              }}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Perfil e Ver Cartão</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: CERTIFICATIONS & NORM COMPLIANCE */}
      {activeSubView === 'certifications' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Normas & Certificações Ativas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gerencie suas habilitações regulamentares necessárias para execução técnica segura.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.certifications.map((cert) => (
              <div
                key={cert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  cert.active
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${cert.active ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{cert.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Emissor: {cert.issuer}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Validade: {cert.validUntil}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCertificationActive(cert.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all ${
                      cert.active
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cert.active ? 'Ativa' : 'Inativa'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick NR-10 & NBR 5410 Compliance Tip */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Dica Regulamentar NBR 5410 / NR-10:</strong>
              <p className="mt-1 leading-relaxed text-[11px]">
                Manter o treinamento da NR-10 atualizado (reciclagem a cada 2 anos) é um requisito obrigatório para emissão de laudos de conformidade e responsabilidade técnica em instalações de baixa tensão.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: TOOLING & EQUIPMENT CHECKLIST */}
      {activeSubView === 'equipment' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Checklist de Equipamentos & Ferramental Profissional
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Marque as ferramentas de medição e EPIs que você possui para demonstrar capacidade técnica nos orçamentos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.equipment.map((eq) => (
              <div
                key={eq.id}
                onClick={() => toggleEquipmentOwned(eq.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  eq.owned
                    ? 'bg-slate-50 dark:bg-slate-800/80 border-orange-200 dark:border-orange-800/60 shadow-2xs'
                    : 'bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      eq.owned
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {eq.owned && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{eq.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{eq.category}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    eq.owned
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {eq.owned ? 'Disponível' : 'Faltando'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: TECHNICAL GUARANTEE & PROPOSAL TEMPLATE */}
      {activeSubView === 'proposal' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Termo de Garantia e Entrega da Instalação
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Modelo pré-preenchido com seus dados para entregar ao cliente junto ao memorial do quadro.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(proposalTemplate, 'proposal')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              {copiedText === 'proposal' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Termo</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {proposalTemplate}
          </div>
        </div>
      )}
    </div>
  );
}
