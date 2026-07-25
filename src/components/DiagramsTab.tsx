import React, { useState, useEffect } from 'react';
import { SavedCircuit, QDCDevice } from '../types';
import {
  FileCode2,
  Printer,
  Power,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Download,
  Image as ImageIcon,
  Layers
} from 'lucide-react';

interface DiagramsTabProps {
  savedCircuits: SavedCircuit[];
  projectName?: string;
  clientName?: string;
  electricianName?: string;
  initialDiagramType?: 'unifilar' | 'multifilar';
}

export const DiagramsTab: React.FC<DiagramsTabProps> = ({
  savedCircuits,
  projectName = 'Residência Unifamiliar',
  clientName = 'Cliente',
  electricianName = 'Responsável Técnico',
  initialDiagramType = 'unifilar',
}) => {
  const [diagramType, setDiagramType] = useState<'unifilar' | 'multifilar'>(initialDiagramType);

  useEffect(() => {
    if (initialDiagramType) {
      setDiagramType(initialDiagramType);
    }
  }, [initialDiagramType]);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string | 'all'>('all');

  // Master Power State (Ligar / Desligar)
  const [isMasterPowerOn, setIsMasterPowerOn] = useState<boolean>(true);

  // Individual Circuit Power Toggles (id -> boolean)
  const [individualPower, setIndividualPower] = useState<Record<string, boolean>>({});

  // QDC Devices state loaded from QDC DIN Builder localStorage
  const [qdcDevices, setQdcDevices] = useState<QDCDevice[]>([]);

  useEffect(() => {
    const loadQdcDevices = () => {
      try {
        const saved = localStorage.getItem('app_nbr5410_qdc_devices');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setQdcDevices(parsed);
          }
        }
      } catch (e) {
        console.error('Error loading QDC devices in DiagramsTab:', e);
      }
    };

    loadQdcDevices();
    window.addEventListener('storage', loadQdcDevices);
    return () => window.removeEventListener('storage', loadQdcDevices);
  }, []);

  const toggleCircuitPower = (circuitId: string) => {
    setIndividualPower((prev) => ({
      ...prev,
      [circuitId]: prev[circuitId] !== undefined ? !prev[circuitId] : false,
    }));
  };

  const isCircuitOn = (circuitId: string) => {
    if (!isMasterPowerOn) return false;
    return individualPower[circuitId] !== false;
  };

  // Main Breaker Rating calculation
  const totalPowerW = savedCircuits.reduce((sum, c) => sum + c.powerW, 0);
  let demandFactor = 0.8;
  if (totalPowerW > 10000) demandFactor = 0.45;
  else if (totalPowerW > 5000) demandFactor = 0.6;
  const totalDemandPowerW = totalPowerW * demandFactor;
  const estimatedMainCurrentA = totalDemandPowerW / 220;

  let computedMainBreakerA = 32;
  if (estimatedMainCurrentA > 100) computedMainBreakerA = 125;
  else if (estimatedMainCurrentA > 80) computedMainBreakerA = 100;
  else if (estimatedMainCurrentA > 63) computedMainBreakerA = 80;
  else if (estimatedMainCurrentA > 50) computedMainBreakerA = 63;
  else if (estimatedMainCurrentA > 40) computedMainBreakerA = 50;
  else if (estimatedMainCurrentA > 32) computedMainBreakerA = 40;

  // Retrieve QDC DIN main devices if configured
  const qdcMainBreaker = qdcDevices.find((d) => d.type === 'main_breaker');
  const qdcIDR = qdcDevices.find((d) => d.type === 'idr');
  const qdcDPS = qdcDevices.find((d) => d.type === 'dps');

  const mainBreakerA = qdcMainBreaker ? qdcMainBreaker.amperageA : computedMainBreakerA;
  const mainBreakerPoles = qdcMainBreaker ? `${qdcMainBreaker.poles}P` : '2P';
  const mainBreakerCurve = qdcMainBreaker?.curve || 'C';

  const idrAmperageA = qdcIDR ? qdcIDR.amperageA : 40;
  const idrSensitivity = qdcIDR ? `${qdcIDR.sensitivityMA || 30}mA` : '30mA';
  const dpsCapacity = qdcDPS ? `${qdcDPS.dpsKA || 20}kA` : '20kA';

  const handlePrint = () => {
    window.print();
  };

  // Download SVG Diagram as High Resolution PNG
  const downloadDiagramAsPNG = () => {
    const svgElement = (document.getElementById('diagram-svg-element') as unknown) as SVGSVGElement | null;
    if (!svgElement) return;

    const viewBoxAttr = svgElement.getAttribute('viewBox');
    const viewBox = viewBoxAttr ? viewBoxAttr.split(' ').map(Number) : [0, 0, 1200, 500];
    const width = viewBox[2] || 1200;
    const height = viewBox[3] || 500;

    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('width', width.toString());
    clonedSvg.setAttribute('height', height.toString());

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clonedSvg);

    if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const canvas = document.createElement('canvas');
    const scale = 2; // HD resolution scale factor
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.fillStyle = '#020617'; // Slate 950 CAD theme background
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `Diagrama_Eletrico_${diagramType.toUpperCase()}_${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  // Download Standalone Vector SVG file
  const downloadDiagramAsSVG = () => {
    const svgElement = (document.getElementById('diagram-svg-element') as unknown) as SVGSVGElement | null;
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);

    if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Diagrama_Eletrico_${diagramType.toUpperCase()}_${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  const activeCircuits =
    selectedCircuitId === 'all'
      ? savedCircuits
      : savedCircuits.filter((c) => c.id === selectedCircuitId);

  // Check overall compliance summary
  const nonCompliantCircuits = savedCircuits.filter(
    (c) => !c.result.isCompliant || c.result.voltageDropPercent > c.maxVoltageDropPercent
  );
  const isOverallCompliant = nonCompliantCircuits.length === 0;

  // Helper to resolve QDC DIN matching info for each circuit
  const getCircuitSpecs = (circuit: SavedCircuit, idx: number) => {
    const matchedDevice = qdcDevices.find(
      (d) =>
        (d.linkedCircuitId && d.linkedCircuitId === circuit.id) ||
        d.name.toLowerCase().includes(circuit.name.toLowerCase()) ||
        d.name.includes(`C${idx + 1}`)
    );

    const customName = matchedDevice?.name || circuit.name;
    const breakerA = matchedDevice?.amperageA || circuit.result.recommendedBreakerA;
    const breakerCurve = matchedDevice?.curve || circuit.result.breakerCurve;
    const poles = matchedDevice?.poles || (circuit.voltageV >= 220 && circuit.systemType.includes('bifasico') ? 2 : circuit.systemType.includes('trifasico') ? 3 : 1);

    const loadTypeLabel =
      circuit.loadType === 'iluminacao'
        ? 'Iluminação'
        : circuit.loadType === 'tug'
        ? 'TUG (Tomadas Gerais)'
        : circuit.loadType === 'tue'
        ? 'TUE (Uso Específico)'
        : 'Motor / Especial';

    return {
      customName,
      breakerA,
      breakerCurve,
      poles,
      polesLabel: `${poles}P (${poles === 1 ? 'Mono' : poles === 2 ? 'Bifásico' : 'Trifásico'})`,
      loadTypeLabel,
      cableMM2: circuit.result.chosenCableMM2,
      powerW: circuit.powerW,
      voltageV: circuit.voltageV,
      currentA: circuit.result.currentA,
      voltageDropPercent: circuit.result.voltageDropPercent,
      isCompliant: circuit.result.isCompliant && circuit.result.voltageDropPercent <= circuit.maxVoltageDropPercent,
    };
  };

  return (
    <div className="space-y-6">
      {/* Dynamic CSS animations for SVG current flow & glow */}
      <style>{`
        @keyframes svgCurrentFlow {
          from { stroke-dashoffset: 32; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulseGlowGreen {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.8)); }
          50% { filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.3)); }
        }
        @keyframes pulseGlowRed {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)); }
          50% { filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.4)); }
        }
        .anim-flow-green {
          stroke-dasharray: 10 6;
          animation: svgCurrentFlow 0.75s linear infinite;
        }
        .anim-flow-red {
          stroke-dasharray: 8 5;
          animation: svgCurrentFlow 0.35s linear infinite;
        }
        .anim-glow-green {
          animation: pulseGlowGreen 1.5s ease-in-out infinite;
        }
        .anim-glow-red {
          animation: pulseGlowRed 0.8s ease-in-out infinite;
        }
      `}</style>

      {/* Header Banner with Master Power Switch & Downloads */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden transition-colors duration-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 text-xs font-bold mb-2">
            <FileCode2 className="w-3.5 h-3.5 text-orange-600" />
            <span>Esquema Elétrico NBR 5410 & NBR 5444</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-blue-100 tracking-tight">
            Diagramas Unifilar e Multifilar
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
            Sincronizado com o Montador de QDC DIN • Simulação de fluxo elétrico e exportação de desenhos
          </p>
        </div>

        {/* Master Power Button + Diagram Switcher + Print/Downloads */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* BOTÃO LIGAR / DESLIGAR GERAL */}
          <button
            onClick={() => setIsMasterPowerOn(!isMasterPowerOn)}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md transform active:scale-95 ${
              isMasterPowerOn
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-200 ring-2 ring-emerald-400'
                : 'bg-slate-900 text-slate-200 hover:bg-slate-800 ring-2 ring-slate-700'
            }`}
          >
            <Power className={`w-4 h-4 ${isMasterPowerOn ? 'animate-pulse text-white' : 'text-slate-400'}`} />
            <span>{isMasterPowerOn ? 'ENERGIZADO (ON)' : 'DESLIGADO (OFF)'}</span>
          </button>

          {/* Switch Unifilar / Multifilar */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center">
            <button
              onClick={() => setDiagramType('unifilar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                diagramType === 'unifilar'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Unifilar
            </button>
            <button
              onClick={() => setDiagramType('multifilar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                diagramType === 'multifilar'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Multifilar
            </button>
          </div>

          {/* DOWNLOAD BUTTONS */}
          <button
            onClick={downloadDiagramAsPNG}
            disabled={savedCircuits.length === 0}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download do Diagrama em Imagem PNG de Alta Resolução"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Baixar PNG</span>
          </button>

          <button
            onClick={downloadDiagramAsSVG}
            disabled={savedCircuits.length === 0}
            className="px-3 py-2 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 disabled:opacity-50 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download do Diagrama em Vetor SVG (CAD)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar SVG</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Imprimir Prancha Técnica"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Status Bar & Circuit Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden transition-colors duration-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Estado Geral:</span>
            {!isMasterPowerOn ? (
              <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-100 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
                DESLIGADO (PRETO)
              </span>
            ) : isOverallCompliant ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                LIGADO - 100% CONFORME NBR 5410 (VERDE)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce inline-block"></span>
                LIGADO - EXISTEM CIRCUITOS FORA DA NORMA (VERMELHO)
              </span>
            )}
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Filtrar:</label>
            <select
              value={selectedCircuitId}
              onChange={(e) => setSelectedCircuitId(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
            >
              <option value="all">Todos os Circuitos ({savedCircuits.length})</option>
              {savedCircuits.map((c, idx) => {
                const specs = getCircuitSpecs(c, idx);
                return (
                  <option key={c.id} value={c.id}>
                    C{idx + 1}: {specs.customName} ({c.result.chosenCableMM2}mm²)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Color Key Guide */}
        <div className="flex items-center gap-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-2xs"></span>
            <span>Verde = Ligado / Correto</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block shadow-2xs"></span>
            <span>Vermelho = Fora da Norma</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-full bg-slate-900 dark:bg-slate-100 inline-block shadow-2xs"></span>
            <span>Preto = Desligado</span>
          </span>
        </div>
      </div>

      {/* DIAGRAM DRAWING CONTAINER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 overflow-x-auto print:p-0 print:border-none print:shadow-none transition-colors duration-200">
        {/* Title Block Header */}
        <div className="border-2 border-slate-800 dark:border-slate-700 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
              PRANCHA TÉCNICA DE DIAGRAMA ELÉTRICO - QDC DIN MODULAR
            </span>
            <span className="text-slate-600 dark:text-slate-400 block">
              PROJETO: {projectName} | CLIENTE: {clientName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Export Actions inside CAD Title block */}
            <button
              onClick={downloadDiagramAsPNG}
              disabled={savedCircuits.length === 0}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold font-sans flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Exportar PNG</span>
            </button>
            <button
              onClick={downloadDiagramAsSVG}
              disabled={savedCircuits.length === 0}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold font-sans flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar SVG</span>
            </button>

            <div className="text-right pl-3 border-l border-slate-300 dark:border-slate-700">
              <span className="font-bold text-indigo-700 dark:text-indigo-400 block uppercase">
                {diagramType === 'unifilar' ? 'ESQUEMA UNIFILAR (NBR 5444)' : 'ESQUEMA MULTIFILAR DE LIGAÇÃO'}
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                RESPONSÁVEL: {electricianName} • DATA: {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {savedCircuits.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Zap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
              Nenhum circuito cadastrado para gerar o diagrama.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Cadastre seus circuitos na aba "Dimensionamento NBR 5410" para visualizar o diagrama elétrico completo.
            </p>
          </div>
        ) : diagramType === 'unifilar' ? (
          /* ========================================== */
          /* UNIFILAR DIAGRAM VIEW WITH ANIMATIONS      */
          /* ========================================== */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>Arraste lateralmente para visualizar todos os ramais de saída</span>
              </span>
              <span className="hidden sm:inline-block">NBR 5410 / NBR 5444</span>
            </div>

            <div className="p-3 sm:p-4 bg-slate-950 text-white rounded-2xl shadow-inner font-mono overflow-x-auto touch-pan-x border border-slate-800 scrollbar-thin">
              <svg
                id="diagram-svg-element"
                viewBox={`0 0 ${Math.max(850, activeCircuits.length * 190 + 280)} 460`}
                className="w-full h-auto min-w-[760px] text-slate-100"
                style={{ fontFamily: 'monospace' }}
              >
                {/* --- RAMAL DE ENTRADA / FEEDER --- */}
                {(() => {
                  const feederOn = isMasterPowerOn;
                  const feederColor = !feederOn ? '#0f172a' : '#10b981';
                  const feederStroke = !feederOn ? '#334155' : '#10b981';
                  const feederClass = feederOn ? 'anim-flow-green' : '';

                  return (
                    <g>
                      {/* Feeder Wire */}
                      <line
                        x1="30"
                        y1="80"
                        x2="160"
                        y2="80"
                        stroke={feederStroke}
                        strokeWidth="4"
                        className={feederClass}
                      />
                      <text x="30" y="55" fill={feederColor} fontSize="11" fontWeight="bold">
                        RAMAL DE ENTRADA (220V)
                      </text>

                      {/* Symbols for Phase, Neutral, Earth on Feeder */}
                      <g transform="translate(80, 80)">
                        <line x1="-10" y1="-12" x2="10" y2="12" stroke={feederOn ? '#ef4444' : '#475569'} strokeWidth="2.5" />
                        <circle cx="-10" cy="-12" r="3" fill="none" stroke={feederOn ? '#38bdf8' : '#475569'} strokeWidth="2" />
                        <line x1="5" y1="-8" x2="15" y2="8" stroke={feederOn ? '#10b981' : '#475569'} strokeWidth="2.5" />
                        <line x1="12" y1="-12" x2="18" y2="-4" stroke={feederOn ? '#10b981' : '#475569'} strokeWidth="2.5" />
                      </g>
                      <text x="50" y="108" fill="#94a3b8" fontSize="9">
                        F + N + PE (10mm²)
                      </text>
                    </g>
                  );
                })()}

                {/* DISJUNTOR GERAL (MAIN BREAKER) */}
                <rect
                  x="160"
                  y="60"
                  width="70"
                  height="40"
                  rx="6"
                  fill="#1e293b"
                  stroke={isMasterPowerOn ? '#10b981' : '#334155'}
                  strokeWidth="2.5"
                />
                <text x="195" y="78" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                  {mainBreakerA}A
                </text>
                <text x="195" y="91" fill="#cbd5e1" fontSize="8" textAnchor="middle">
                  GERAL {mainBreakerPoles} ({mainBreakerCurve})
                </text>

                {/* IDR GERAL */}
                <line
                  x1="230"
                  y1="80"
                  x2="260"
                  y2="80"
                  stroke={isMasterPowerOn ? '#10b981' : '#334155'}
                  strokeWidth="3"
                  className={isMasterPowerOn ? 'anim-flow-green' : ''}
                />
                <rect
                  x="260"
                  y="60"
                  width="60"
                  height="40"
                  rx="6"
                  fill="#1e293b"
                  stroke={isMasterPowerOn ? '#38bdf8' : '#334155'}
                  strokeWidth="2"
                />
                <text x="290" y="78" fill={isMasterPowerOn ? '#38bdf8' : '#64748b'} fontSize="10" fontWeight="bold" textAnchor="middle">
                  IDR
                </text>
                <text x="290" y="92" fill="#cbd5e1" fontSize="8" textAnchor="middle">
                  {idrAmperageA}A / {idrSensitivity}
                </text>

                {/* BARRAMENTO PRINCIPAL (BUSBAR) */}
                <line
                  x1="320"
                  y1="80"
                  x2="350"
                  y2="80"
                  stroke={isMasterPowerOn ? '#10b981' : '#334155'}
                  strokeWidth="3"
                  className={isMasterPowerOn ? 'anim-flow-green' : ''}
                />
                <line
                  x1="350"
                  y1="80"
                  x2={350 + activeCircuits.length * 190}
                  y2="80"
                  stroke={isMasterPowerOn ? '#6366f1' : '#1e293b'}
                  strokeWidth="6"
                />
                <text x="350" y="55" fill={isMasterPowerOn ? '#818cf8' : '#64748b'} fontSize="11" fontWeight="bold">
                  BARRAMENTO DE DISTRIBUIÇÃO QDC DIN
                </text>

                {/* DPS PROTECTION CONNECTED TO BUSBAR */}
                <g transform="translate(350, 80)">
                  <line x1="0" y1="0" x2="0" y2="-30" stroke={isMasterPowerOn ? '#ef4444' : '#334155'} strokeWidth="2" />
                  <rect x="-20" y="-60" width="40" height="30" fill="#334155" stroke={isMasterPowerOn ? '#ef4444' : '#475569'} strokeWidth="2" rx="4" />
                  <text x="0" y="-42" fill={isMasterPowerOn ? '#ef4444' : '#94a3b8'} fontSize="9" fontWeight="bold" textAnchor="middle">
                    DPS
                  </text>
                  <text x="0" y="-32" fill="#94a3b8" fontSize="7" textAnchor="middle">
                    {dpsCapacity}
                  </text>
                </g>

                {/* BRANCH CIRCUITS (CIRCUITOS DERIVADOS) */}
                {activeCircuits.map((circuit, idx) => {
                  const startX = 440 + idx * 190;
                  const active = isCircuitOn(circuit.id);
                  const specs = getCircuitSpecs(circuit, idx);

                  let wireStroke = '#000000';
                  let wireClass = '';
                  let glowClass = '';
                  let statusBg = '#1e293b';
                  let statusText = 'DESLIGADO';

                  if (!active) {
                    wireStroke = '#000000';
                    statusBg = '#0f172a';
                    statusText = 'OFF';
                  } else if (specs.isCompliant) {
                    wireStroke = '#10b981';
                    wireClass = 'anim-flow-green';
                    glowClass = 'anim-glow-green';
                    statusBg = '#065f46';
                    statusText = 'OK (CONFORME)';
                  } else {
                    wireStroke = '#ef4444';
                    wireClass = 'anim-flow-red';
                    glowClass = 'anim-glow-red';
                    statusBg = '#991b1b';
                    statusText = 'FORA DA NORMA';
                  }

                  return (
                    <g key={circuit.id} transform={`translate(${startX}, 80)`}>
                      {/* Drop line from busbar to circuit breaker */}
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="50"
                        stroke={active ? (specs.isCompliant ? '#10b981' : '#ef4444') : '#000000'}
                        strokeWidth="3.5"
                        className={wireClass}
                      />

                      {/* Disjuntor do Circuito (Breaker Box) */}
                      <rect
                        x="-40"
                        y="50"
                        width="80"
                        height="48"
                        rx="6"
                        fill="#0f172a"
                        stroke={active ? (specs.isCompliant ? '#10b981' : '#ef4444') : '#334155'}
                        strokeWidth="2.5"
                      />
                      <text x="0" y="68" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                        {specs.breakerA}A
                      </text>
                      <text x="0" y="82" fill={active ? (specs.isCompliant ? '#a7f3d0' : '#fca5a5') : '#64748b'} fontSize="8" textAnchor="middle">
                        {specs.poles}P • Curva {specs.breakerCurve}
                      </text>

                      {/* Interactive Breaker Toggle Switch Handle inside SVG */}
                      <g
                        onClick={() => toggleCircuitPower(circuit.id)}
                        className="cursor-pointer"
                        transform="translate(0, 106)"
                      >
                        <rect x="-22" y="-5" width="44" height="14" rx="7" fill={active ? (specs.isCompliant ? '#059669' : '#dc2626') : '#1e293b'} />
                        <circle cx={active ? 12 : -12} cy="2" r="5" fill="#ffffff" />
                        <text x="0" y="5" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                          {active ? 'ON' : 'OFF'}
                        </text>
                      </g>

                      {/* Line to Load */}
                      <line
                        x1="0"
                        y1="115"
                        x2="0"
                        y2="210"
                        stroke={wireStroke}
                        strokeWidth="3.5"
                        className={wireClass}
                      />

                      {/* Conductor symbols across line (Fase / Neutro / Terra) */}
                      <g transform="translate(0, 155)">
                        <line x1="-12" y1="-8" x2="12" y2="8" stroke={active ? '#ef4444' : '#475569'} strokeWidth="2" />
                        <circle cx="-12" cy="-8" r="2.5" fill="none" stroke={active ? '#38bdf8' : '#475569'} strokeWidth="1.5" />
                        <line x1="6" y1="-4" x2="14" y2="4" stroke={active ? '#10b981' : '#475569'} strokeWidth="2" />
                      </g>

                      {/* Specs text label beside conductors */}
                      <text x="18" y="152" fill="#f8fafc" fontSize="10" fontWeight="bold">
                        {specs.cableMM2} mm²
                      </text>
                      <text x="18" y="165" fill="#94a3b8" fontSize="8">
                        {specs.voltageV}V | {circuit.lengthMeters}m
                      </text>

                      {/* Load Symbol Box / Circle with Glow */}
                      <circle
                        cx="0"
                        cy="235"
                        r="22"
                        fill={active ? (specs.isCompliant ? '#065f46' : '#881337') : '#0f172a'}
                        stroke={wireStroke}
                        strokeWidth="3"
                        className={glowClass}
                      />
                      <text x="0" y="239" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                        C{idx + 1}
                      </text>

                      {/* Load Label with Custom Name from QDC */}
                      <text x="0" y="275" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">
                        {specs.customName.length > 20 ? specs.customName.slice(0, 20) + '...' : specs.customName}
                      </text>
                      <text x="0" y="290" fill={active ? (specs.isCompliant ? '#34d399' : '#f87171') : '#64748b'} fontSize="9" fontWeight="bold" textAnchor="middle">
                        {specs.powerW}W ({specs.currentA.toFixed(1)}A)
                      </text>

                      {/* Status Tag Pill under Load */}
                      <rect
                        x="-55"
                        y="300"
                        width="110"
                        height="20"
                        rx="10"
                        fill={statusBg}
                        stroke={wireStroke}
                        strokeWidth="1.5"
                      />
                      <text x="0" y="313" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {statusText}
                      </text>

                      {/* Voltage drop warning subtext if non-compliant */}
                      {active && !specs.isCompliant && (
                        <text x="0" y="332" fill="#f87171" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                          Queda: {specs.voltageDropPercent.toFixed(1)}% (máx {circuit.maxVoltageDropPercent}%)
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Individual Circuit Switches Grid Control Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-3">
                CONTROLE INDIVIDUAL DOS DISJUNTORES DO QUADRO:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {savedCircuits.map((c, idx) => {
                  const active = isCircuitOn(c.id);
                  const specs = getCircuitSpecs(c, idx);

                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCircuitPower(c.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        !active
                          ? 'bg-slate-900 border-slate-800 text-slate-300'
                          : specs.isCompliant
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-black block truncate">
                          C{idx + 1}: {specs.customName}
                        </span>
                        <span className="text-[10px] block opacity-80">
                          {specs.breakerA}A ({specs.poles}P) • {specs.cableMM2}mm²
                        </span>
                      </div>

                      <div
                        className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors ${
                          !active
                            ? 'bg-slate-700 justify-start'
                            : specs.isCompliant
                            ? 'bg-emerald-600 justify-end'
                            : 'bg-rose-600 justify-end'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-xs inline-block"></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* MULTIFILAR DIAGRAM VIEW WITH ANIMATIONS    */
          /* ========================================== */
          <div className="space-y-6">
            <div className="p-4 bg-slate-950 text-white rounded-xl shadow-inner font-mono overflow-x-auto border border-slate-800">
              <svg
                id="diagram-svg-element"
                viewBox={`0 0 ${Math.max(880, activeCircuits.length * 200 + 320)} 540`}
                className="w-full h-auto min-w-[780px]"
                style={{ fontFamily: 'monospace' }}
              >
                {/* --- MAINS / TRILHOS DE FASE, NEUTRO E TERRA --- */}
                {(() => {
                  const mainsOn = isMasterPowerOn;
                  const phaseColor = mainsOn ? '#ef4444' : '#000000';
                  const neutralColor = mainsOn ? '#38bdf8' : '#000000';
                  const earthColor = mainsOn ? '#10b981' : '#000000';
                  const flowClass = mainsOn ? 'anim-flow-green' : '';

                  return (
                    <g>
                      {/* FASE L1 */}
                      <line
                        x1="30"
                        y1="50"
                        x2="850"
                        y2="50"
                        stroke={phaseColor}
                        strokeWidth="4"
                        className={flowClass}
                      />
                      <text x="30" y="42" fill={mainsOn ? '#ef4444' : '#64748b'} fontSize="11" fontWeight="bold">
                        FASE L1 (Vermelho)
                      </text>

                      {/* NEUTRO N */}
                      <line
                        x1="30"
                        y1="90"
                        x2="850"
                        y2="90"
                        stroke={neutralColor}
                        strokeWidth="4"
                        className={flowClass}
                      />
                      <text x="30" y="82" fill={mainsOn ? '#38bdf8' : '#64748b'} fontSize="11" fontWeight="bold">
                        NEUTRO N (Azul Claro)
                      </text>

                      {/* TERRA PE */}
                      <line
                        x1="30"
                        y1="130"
                        x2="850"
                        y2="130"
                        stroke={earthColor}
                        strokeWidth="4"
                        strokeDasharray="8 4"
                      />
                      <text x="30" y="122" fill={mainsOn ? '#10b981' : '#64748b'} fontSize="11" fontWeight="bold">
                        TERRA PE (Verde / Amarelo)
                      </text>
                    </g>
                  );
                })()}

                {/* DISJUNTOR GERAL DIN MODULE */}
                <g transform="translate(180, 160)">
                  <rect
                    x="0"
                    y="0"
                    width="85"
                    height="95"
                    rx="8"
                    fill="#1e293b"
                    stroke={isMasterPowerOn ? '#10b981' : '#334155'}
                    strokeWidth="3"
                  />
                  <text x="42" y="24" fill={isMasterPowerOn ? '#10b981' : '#64748b'} fontSize="10" fontWeight="bold" textAnchor="middle">
                    DISJ. GERAL
                  </text>
                  <text x="42" y="46" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">
                    {mainBreakerA}A
                  </text>
                  <text x="42" y="66" fill="#cbd5e1" fontSize="8" textAnchor="middle">
                    {mainBreakerPoles} • Curva {mainBreakerCurve}
                  </text>

                  {/* Wire from L1 to Main Breaker */}
                  <line x1="20" y1="-110" x2="20" y2="0" stroke={isMasterPowerOn ? '#ef4444' : '#000000'} strokeWidth="3" />
                  {/* Wire from N to Main Breaker */}
                  <line x1="60" y1="-70" x2="60" y2="0" stroke={isMasterPowerOn ? '#38bdf8' : '#000000'} strokeWidth="3" />
                </g>

                {/* IDR DR GERAL PROTECTION MODULE */}
                <g transform="translate(305, 160)">
                  <rect
                    x="0"
                    y="0"
                    width="95"
                    height="95"
                    rx="8"
                    fill="#1e293b"
                    stroke={isMasterPowerOn ? '#38bdf8' : '#334155'}
                    strokeWidth="3"
                  />
                  <text x="47" y="24" fill={isMasterPowerOn ? '#38bdf8' : '#64748b'} fontSize="10" fontWeight="bold" textAnchor="middle">
                    IDR / DR GERAL
                  </text>
                  <text x="47" y="46" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">
                    {idrAmperageA}A / {idrSensitivity}
                  </text>
                  <text x="47" y="66" fill="#cbd5e1" fontSize="8" textAnchor="middle">
                    Proteção Choques
                  </text>

                  {/* Connection from Main Breaker to IDR */}
                  <line x1="-40" y1="45" x2="0" y2="45" stroke={isMasterPowerOn ? '#ef4444' : '#000000'} strokeWidth="3" />
                </g>

                {/* CIRCUIT BRANCHES MULTIFILAR WIRING */}
                {activeCircuits.map((circuit, idx) => {
                  const startX = 450 + idx * 190;
                  const active = isCircuitOn(circuit.id);
                  const specs = getCircuitSpecs(circuit, idx);

                  let wirePhase = '#000000';
                  let wireNeutral = '#000000';
                  let wireEarth = '#000000';
                  let wireClass = '';
                  let statusBg = '#0f172a';
                  let statusText = 'DESLIGADO';

                  if (!active) {
                    wirePhase = '#000000';
                    wireNeutral = '#000000';
                    wireEarth = '#000000';
                    statusBg = '#0f172a';
                    statusText = 'OFF';
                  } else if (specs.isCompliant) {
                    wirePhase = '#10b981';
                    wireNeutral = '#38bdf8';
                    wireEarth = '#10b981';
                    wireClass = 'anim-flow-green';
                    statusBg = '#065f46';
                    statusText = 'CONFORME (OK)';
                  } else {
                    wirePhase = '#ef4444';
                    wireNeutral = '#ef4444';
                    wireEarth = '#ef4444';
                    wireClass = 'anim-flow-red';
                    statusBg = '#991b1b';
                    statusText = 'FORA DA NORMA';
                  }

                  return (
                    <g key={circuit.id} transform={`translate(${startX}, 160)`}>
                      {/* Individual Circuit Breaker DIN Module */}
                      <rect
                        x="0"
                        y="0"
                        width="75"
                        height="95"
                        rx="8"
                        fill="#0f172a"
                        stroke={active ? (specs.isCompliant ? '#10b981' : '#ef4444') : '#334155'}
                        strokeWidth="2.5"
                      />
                      <text x="37" y="24" fill={active ? (specs.isCompliant ? '#10b981' : '#f87171') : '#64748b'} fontSize="11" fontWeight="bold" textAnchor="middle">
                        C{idx + 1}
                      </text>
                      <text x="37" y="48" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">
                        {specs.breakerA}A
                      </text>
                      <text x="37" y="68" fill={active ? (specs.isCompliant ? '#a7f3d0' : '#fca5a5') : '#64748b'} fontSize="8" textAnchor="middle">
                        {specs.poles}P • Curva {specs.breakerCurve}
                      </text>

                      {/* Phase wire from IDR to Circuit Breaker */}
                      <path
                        d={`M -50 45 L ${startX - 350} 45 L 37 45 L 37 0`}
                        fill="none"
                        stroke={active ? (specs.isCompliant ? '#10b981' : '#ef4444') : '#000000'}
                        strokeWidth="2.5"
                        className={wireClass}
                      />

                      {/* Outgoing Phase Wires to Load */}
                      <line
                        x1="20"
                        y1="95"
                        x2="20"
                        y2="240"
                        stroke={wirePhase}
                        strokeWidth="2.5"
                        className={wireClass}
                      />
                      {/* Outgoing Neutral Wire from N Busbar */}
                      <path
                        d={`M 37 -70 L 37 240`}
                        fill="none"
                        stroke={wireNeutral}
                        strokeWidth="2.5"
                        className={wireClass}
                      />
                      {/* Outgoing Earth Wire from PE Busbar */}
                      <path
                        d={`M 55 -30 L 55 240`}
                        fill="none"
                        stroke={wireEarth}
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                      />

                      {/* Conduit / Cable Label */}
                      <rect x="-5" y="150" width="110" height="24" rx="4" fill="#1e293b" stroke={active ? (specs.isCompliant ? '#10b981' : '#ef4444') : '#334155'} />
                      <text x="50" y="166" fill="#f8fafc" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                        {specs.cableMM2} mm² (F+N+PE)
                      </text>

                      {/* Electrical Load Outlet/Equipment Box */}
                      <rect
                        x="-10"
                        y="240"
                        width="135"
                        height="68"
                        rx="8"
                        fill={active ? (specs.isCompliant ? '#065f46' : '#881337') : '#0f172a'}
                        stroke={wirePhase}
                        strokeWidth="2.5"
                      />
                      <text x="57" y="262" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                        {specs.customName.length > 20 ? specs.customName.slice(0, 20) + '...' : specs.customName}
                      </text>

                      <text x="57" y="280" fill={active ? (specs.isCompliant ? '#34d399' : '#f87171') : '#64748b'} fontSize="9" fontWeight="bold" textAnchor="middle">
                        {specs.powerW}W ({specs.voltageV}V)
                      </text>

                      {/* Status Tag Pill */}
                      <rect
                        x="7"
                        y="318"
                        width="100"
                        height="20"
                        rx="10"
                        fill={statusBg}
                        stroke={wirePhase}
                        strokeWidth="1.5"
                      />
                      <text x="57" y="331" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {statusText}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Individual Circuit Switches Grid Control Bar for Multifilar */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-3">
                CONTROLE INDIVIDUAL DOS DISJUNTORES DO QUADRO:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {savedCircuits.map((c, idx) => {
                  const active = isCircuitOn(c.id);
                  const specs = getCircuitSpecs(c, idx);

                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCircuitPower(c.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        !active
                          ? 'bg-slate-900 border-slate-800 text-slate-300'
                          : specs.isCompliant
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-black block truncate">
                          C{idx + 1}: {specs.customName}
                        </span>
                        <span className="text-[10px] block opacity-80">
                          {specs.breakerA}A ({specs.poles}P) • {specs.cableMM2}mm²
                        </span>
                      </div>

                      <div
                        className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors ${
                          !active
                            ? 'bg-slate-700 justify-start'
                            : specs.isCompliant
                            ? 'bg-emerald-600 justify-end'
                            : 'bg-rose-600 justify-end'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-xs inline-block"></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED CIRCUIT SPECIFICATIONS TABLE (MATCHING QDC DIN DESCRIPTIONS) */}
      {savedCircuits.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 print:mt-6 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Especificações Detalhadas dos Circuitos do Diagrama (QDC DIN)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resumo dos componentes, descrições personalizadas e conformidade com a NBR 5410
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadDiagramAsPNG}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={downloadDiagramAsSVG}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download SVG</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Circuito</th>
                  <th className="p-3">Descrição / Ponto do QDC</th>
                  <th className="p-3">Tipo de Carga</th>
                  <th className="p-3 text-center">Polos</th>
                  <th className="p-3 text-center">Disjuntor DTM</th>
                  <th className="p-3 text-center">Condutor (mm²)</th>
                  <th className="p-3 text-right">Potência (W)</th>
                  <th className="p-3 text-right">Corrente (A)</th>
                  <th className="p-3 text-center">Queda (%)</th>
                  <th className="p-3 text-center">Status NBR 5410</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {savedCircuits.map((c, idx) => {
                  const specs = getCircuitSpecs(c, idx);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        C{idx + 1}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-slate-100">
                        {specs.customName}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">
                        {specs.loadTypeLabel}
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        {specs.poles}P
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                        {specs.breakerA}A (Curva {specs.breakerCurve})
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                        {specs.cableMM2} mm²
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {specs.powerW} W
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {specs.currentA.toFixed(1)} A
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        <span className={specs.voltageDropPercent <= c.maxVoltageDropPercent ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {specs.voltageDropPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {specs.isCompliant ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>CONFORME</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>ATENÇÃO</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
