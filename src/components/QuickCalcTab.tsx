import React, { useState, useEffect } from 'react';
import {
  Calculator as CalcIcon,
  Zap,
  RotateCcw,
  Copy,
  Check,
  History,
  DollarSign,
  Cpu,
  Trash2,
  Delete,
  ArrowLeftRight
} from 'lucide-react';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

export const QuickCalcTab: React.FC = () => {
  // Calculator Display State
  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [memory, setMemory] = useState<number>(0);
  const [hasMemory, setHasMemory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const local = localStorage.getItem('app_nbr5410_math_history');
    return local ? JSON.parse(local) : [];
  });

  // Ohm's Law Calculator State
  const [ohmV, setOhmV] = useState<string>('220');
  const [ohmI, setOhmI] = useState<string>('10');
  const [ohmR, setOhmR] = useState<string>('22');
  const [ohmP, setOhmP] = useState<string>('2200');
  const [ohmMode, setOhmMode] = useState<'V_I' | 'P_V' | 'V_R'>('V_I');

  // Energy & Monthly Cost Calculator State
  const [appPowerW, setAppPowerW] = useState<number | string>(1500);
  const [appHoursPerDay, setAppHoursPerDay] = useState<number | string>(4);
  const [appDaysPerMonth, setAppDaysPerMonth] = useState<number | string>(30);
  const [tariffKWh, setTariffKWh] = useState<number | string>(0.85); // R$/kWh médio no Brasil

  useEffect(() => {
    localStorage.setItem('app_nbr5410_math_history', JSON.stringify(history));
  }, [history]);

  // Keypress handling for physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input fields
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === '.') handleDigit('.');
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('×');
      else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEqual();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, expression]);

  const handleDigit = (digit: string) => {
    if (display === '0' && digit !== '.') {
      setDisplay(digit);
    } else if (digit === '.' && display.includes('.')) {
      return;
    } else {
      if (display.length < 16) {
        setDisplay(display + digit);
      }
    }
  };

  const handleOperator = (op: string) => {
    setExpression(`${display} ${op} `);
    setDisplay('0');
  };

  const handleClearAll = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleEqual = () => {
    if (!expression) return;

    try {
      // Sanitize expression for safe calculation
      const fullExpr = expression + display;
      const cleanExpr = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');

      // Evaluate safely
      // eslint-disable-next-line no-eval
      const resultValue = eval(cleanExpr);

      if (isNaN(resultValue) || !isFinite(resultValue)) {
        setDisplay('Erro');
        return;
      }

      const formattedResult =
        Number.isInteger(resultValue)
          ? resultValue.toString()
          : parseFloat(resultValue.toFixed(6)).toString();

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        expression: fullExpr,
        result: formattedResult,
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 19)]);
      setDisplay(formattedResult);
      setExpression('');
    } catch (err) {
      setDisplay('Erro');
    }
  };

  const handleScientificFunc = (func: string) => {
    const num = parseFloat(display);
    if (isNaN(num)) return;

    let res = 0;
    if (func === 'sqrt') {
      if (num < 0) {
        setDisplay('Erro');
        return;
      }
      res = Math.sqrt(num);
    } else if (func === 'square') {
      res = Math.pow(num, 2);
    } else if (func === 'inv') {
      if (num === 0) {
        setDisplay('Erro');
        return;
      }
      res = 1 / num;
    } else if (func === 'percent') {
      res = num / 100;
    } else if (func === 'cos') {
      res = Math.cos((num * Math.PI) / 180);
    } else if (func === 'sqrt3') {
      // Multiplicador trifásico √3 ~ 1.73205
      res = num * Math.sqrt(3);
    }

    const formatted = parseFloat(res.toFixed(6)).toString();
    setDisplay(formatted);
  };

  // Memory Actions
  const handleMemoryAdd = () => {
    const val = parseFloat(display) || 0;
    setMemory((prev) => prev + val);
    setHasMemory(true);
  };

  const handleMemorySub = () => {
    const val = parseFloat(display) || 0;
    setMemory((prev) => prev - val);
    setHasMemory(true);
  };

  const handleMemoryRead = () => {
    setDisplay(memory.toString());
  };

  const handleMemoryClear = () => {
    setMemory(0);
    setHasMemory(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ohm's Law quick calculate
  const calculateOhm = () => {
    const v = parseFloat(ohmV) || 0;
    const i = parseFloat(ohmI) || 0;
    const r = parseFloat(ohmR) || 0;
    const p = parseFloat(ohmP) || 0;

    if (ohmMode === 'V_I') {
      // Conhece V e I
      setOhmP((v * i).toFixed(2));
      setOhmR(i > 0 ? (v / i).toFixed(2) : '0');
    } else if (ohmMode === 'P_V') {
      // Conhece P e V
      const calcI = v > 0 ? p / v : 0;
      setOhmI(calcI.toFixed(2));
      setOhmR(calcI > 0 ? (v / calcI).toFixed(2) : '0');
    } else if (ohmMode === 'V_R') {
      // Conhece V e R
      const calcI = r > 0 ? v / r : 0;
      setOhmI(calcI.toFixed(2));
      setOhmP((v * calcI).toFixed(2));
    }
  };

  // Energy consumption calculations
  const numAppPowerW = typeof appPowerW === 'number' ? appPowerW : (parseFloat(appPowerW) || 0);
  const numAppHoursPerDay = typeof appHoursPerDay === 'number' ? appHoursPerDay : (parseFloat(appHoursPerDay) || 0);
  const numAppDaysPerMonth = typeof appDaysPerMonth === 'number' ? appDaysPerMonth : (parseFloat(appDaysPerMonth) || 0);
  const numTariffKWh = typeof tariffKWh === 'number' ? tariffKWh : (parseFloat(tariffKWh) || 0);

  const monthlyKWh = (numAppPowerW * numAppHoursPerDay * numAppDaysPerMonth) / 1000;
  const monthlyCostR$ = monthlyKWh * numTariffKWh;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold mb-2">
            <CalcIcon className="w-3.5 h-3.5 text-orange-600" />
            <span>Calculadora Geral & Elétrica</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Calculadora Geral e Fórmulas de Apoio
          </h2>
          <p className="text-xs text-slate-700 font-medium mt-0.5">
            Ferramenta para cálculos matemáticos rápidos, Lei de Ohm e estimativa de consumo mensal (kWh)
          </p>
        </div>

        {copied && (
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Copiado com sucesso!</span>
          </div>
        )}
      </div>

      {/* Main Grid: Calculator & Ohm's Law */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Interactive Scientific & Standard Calculator (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <CalcIcon className="w-5 h-5 text-indigo-600" />
              Calculadora Multiuso
            </h3>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Aceita digitação via teclado
            </span>
          </div>

          {/* Calculator Screen / Display */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-inner text-right font-mono space-y-1 relative group">
            <button
              onClick={() => copyToClipboard(display)}
              className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
              title="Copiar resultado"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </button>

            <div className="text-xs text-indigo-300/80 h-5 overflow-hidden truncate">
              {expression || '\u00A0'}
            </div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-400 overflow-x-auto whitespace-nowrap scrollbar-none">
              {display}
            </div>
          </div>

          {/* Memory Controls Bar */}
          <div className="grid grid-cols-4 gap-2 text-xs font-bold">
            <button
              onClick={handleMemoryClear}
              disabled={!hasMemory}
              className={`py-1.5 rounded-xl border transition-all cursor-pointer ${
                hasMemory
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              MC
            </button>
            <button
              onClick={handleMemoryRead}
              disabled={!hasMemory}
              className={`py-1.5 rounded-xl border transition-all cursor-pointer ${
                hasMemory
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              MR ({memory})
            </button>
            <button
              onClick={handleMemoryAdd}
              className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              M+
            </button>
            <button
              onClick={handleMemorySub}
              className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              M-
            </button>
          </div>

          {/* Scientific Quick Functions Row */}
          <div className="grid grid-cols-5 gap-2 text-xs font-bold">
            <button
              onClick={() => handleScientificFunc('sqrt')}
              className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl transition-all cursor-pointer"
              title="Raiz Quadrada"
            >
              √x
            </button>
            <button
              onClick={() => handleScientificFunc('square')}
              className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl transition-all cursor-pointer"
              title="Elevar ao Quadrado"
            >
              x²
            </button>
            <button
              onClick={() => handleScientificFunc('sqrt3')}
              className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition-all cursor-pointer"
              title="Multiplicar por √3 (Trifásico)"
            >
              × √3
            </button>

            <button
              onClick={() => handleScientificFunc('percent')}
              className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl transition-all cursor-pointer"
              title="Porcentagem"
            >
              %
            </button>

            <button
              onClick={() => handleScientificFunc('cos')}
              className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl transition-all cursor-pointer"
              title="Cosseno (cos φ)"
            >
              cos φ
            </button>
          </div>

          {/* Main Keypad Grid (4x5) */}
          <div className="grid grid-cols-4 gap-2.5 text-base font-extrabold">
            {/* Row 1 */}
            <button
              onClick={handleClearAll}
              className="py-3.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 transition-all cursor-pointer"
            >
              C
            </button>
            <button
              onClick={handleBackspace}
              className="py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScientificFunc('inv')}
              className="py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer text-sm"
            >
              1/x
            </button>
            <button
              onClick={() => handleOperator('÷')}
              className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              onClick={() => handleDigit('7')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              7
            </button>
            <button
              onClick={() => handleDigit('8')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              8
            </button>
            <button
              onClick={() => handleDigit('9')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              9
            </button>
            <button
              onClick={() => handleOperator('×')}
              className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              onClick={() => handleDigit('4')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              4
            </button>
            <button
              onClick={() => handleDigit('5')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              5
            </button>
            <button
              onClick={() => handleDigit('6')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              6
            </button>
            <button
              onClick={() => handleOperator('-')}
              className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
            >
              -
            </button>

            {/* Row 4 */}
            <button
              onClick={() => handleDigit('1')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              1
            </button>
            <button
              onClick={() => handleDigit('2')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              2
            </button>
            <button
              onClick={() => handleDigit('3')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              3
            </button>
            <button
              onClick={() => handleOperator('+')}
              className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
            >
              +
            </button>

            {/* Row 5 */}
            <button
              onClick={() => handleDigit('0')}
              className="col-span-2 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              0
            </button>
            <button
              onClick={() => handleDigit('.')}
              className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              ,
            </button>
            <button
              onClick={handleEqual}
              className="py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer shadow-sm"
            >
              =
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Ohm's Law Calculator & Calculation History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ohm's Law Quick Calculator */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
                Lei de Ohm & Potência
              </h3>
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-100">
                V = R × I
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modo de Cálculo
                </label>
                <select
                  value={ohmMode}
                  onChange={(e) => setOhmMode(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-800 bg-white"
                >
                  <option value="V_I">Tensão (V) e Corrente (I) → Potência e Resistência</option>
                  <option value="P_V">Potência (W) e Tensão (V) → Corrente e Resistência</option>
                  <option value="V_R">Tensão (V) e Resistência (Ω) → Corrente e Potência</option>
                </select>
              </div>

              {/* Dynamic Inputs based on mode */}
              <div className="grid grid-cols-2 gap-3">
                {ohmMode === 'V_I' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Tensão (V)
                      </label>
                      <input
                        type="number"
                        value={ohmV}
                        onChange={(e) => setOhmV(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Corrente (A)
                      </label>
                      <input
                        type="number"
                        value={ohmI}
                        onChange={(e) => setOhmI(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                  </>
                )}

                {ohmMode === 'P_V' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Potência (W)
                      </label>
                      <input
                        type="number"
                        value={ohmP}
                        onChange={(e) => setOhmP(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold text-indigo-600 font-extrabold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Tensão (V)
                      </label>
                      <input
                        type="number"
                        value={ohmV}
                        onChange={(e) => setOhmV(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                  </>
                )}

                {ohmMode === 'V_R' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Tensão (V)
                      </label>
                      <input
                        type="number"
                        value={ohmV}
                        onChange={(e) => setOhmV(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Resistência (Ω)
                      </label>
                      <input
                        type="number"
                        value={ohmR}
                        onChange={(e) => setOhmR(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={calculateOhm}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Zap className="w-4 h-4" />
                <span>Calcular Ohm & Potência</span>
              </button>

              {/* Calculated Outputs */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Potência (P)
                  </span>
                  <span className="text-sm font-extrabold text-indigo-600">
                    {ohmP} W
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Corrente (I)
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {ohmI} A
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Resistência (R)
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {ohmR} Ω
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Tensão (V)
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {ohmV} V
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* History Tape */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Histórico de Cálculos
              </h3>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                  title="Limpar Histórico"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Nenhum cálculo registrado ainda.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between hover:bg-slate-100/80 transition-colors"
                  >
                    <div>
                      <span className="text-slate-500 block font-mono text-[11px]">
                        {item.expression} =
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm font-mono">
                        {item.result}
                      </span>
                    </div>
                    <button
                      onClick={() => setDisplay(item.result)}
                      className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Usar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM BANNER: Monthly Consumption & Electricity Cost Calculator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Calculadora de Consumo de Energia Elétrica (kWh e R$)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Estime o gasto mensal de qualquer equipamento elétrico na conta de luz
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Potência do Aparelho (W)
            </label>
            <input
              type="number"
              value={appPowerW}
              onChange={(e) => setAppPowerW(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-bold text-indigo-600 dark:text-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Uso Diário (Horas / dia)
            </label>
            <input
              type="number"
              max="24"
              value={appHoursPerDay}
              onChange={(e) => setAppHoursPerDay(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dias de Uso no Mês
            </label>
            <input
              type="number"
              max="31"
              value={appDaysPerMonth}
              onChange={(e) => setAppDaysPerMonth(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tarifa da Concessionária (R$ / kWh)
            </label>
            <input
              type="number"
              step="0.01"
              value={tariffKWh}
              onChange={(e) => setTariffKWh(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Results Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-900 block">
                Consumo Mensal Estimado:
              </span>
              <span className="text-2xl font-black text-emerald-700">
                {monthlyKWh.toFixed(2)} kWh
              </span>
            </div>
            <Cpu className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-900 block">
                Custo Estimado na Conta de Luz:
              </span>
              <span className="text-2xl font-black text-indigo-700">
                R$ {monthlyCostR$.toFixed(2)} / mês
              </span>
            </div>
            <DollarSign className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
