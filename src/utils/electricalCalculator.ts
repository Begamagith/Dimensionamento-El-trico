import {
  CircuitCalculationInput,
  CalculationResult,
  BreakerCurve,
  SystemType
} from '../types';

// Tabela de capacidade de condução de corrente (Amperes) NBR 5410 - Método B1 - Cobre - Isolação PVC 70°C
export const AMPACITY_TABLE_PVC_COPPER = {
  2: [
    { section: 1.5, ampacity: 17.5 },
    { section: 2.5, ampacity: 24.0 },
    { section: 4.0, ampacity: 32.0 },
    { section: 6.0, ampacity: 41.0 },
    { section: 10.0, ampacity: 57.0 },
    { section: 16.0, ampacity: 76.0 },
    { section: 25.0, ampacity: 101.0 },
    { section: 35.0, ampacity: 125.0 },
    { section: 50.0, ampacity: 151.0 },
    { section: 70.0, ampacity: 192.0 },
    { section: 95.0, ampacity: 232.0 },
    { section: 120.0, ampacity: 269.0 },
  ],
  3: [
    { section: 1.5, ampacity: 15.5 },
    { section: 2.5, ampacity: 21.0 },
    { section: 4.0, ampacity: 28.0 },
    { section: 6.0, ampacity: 36.0 },
    { section: 10.0, ampacity: 50.0 },
    { section: 16.0, ampacity: 68.0 },
    { section: 25.0, ampacity: 89.0 },
    { section: 35.0, ampacity: 110.0 },
    { section: 50.0, ampacity: 134.0 },
    { section: 70.0, ampacity: 171.0 },
    { section: 95.0, ampacity: 207.0 },
    { section: 120.0, ampacity: 239.0 },
  ],
};

// Disjuntores DIN padrões no mercado
export const STANDARD_BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125, 160, 200];

// Fator de Agrupamento NBR 5410 Tabela 42
export function getGroupingFactor(circuitsCount: number): number {
  if (circuitsCount <= 1) return 1.0;
  if (circuitsCount === 2) return 0.8;
  if (circuitsCount === 3) return 0.7;
  if (circuitsCount === 4) return 0.65;
  if (circuitsCount === 5) return 0.6;
  if (circuitsCount === 6) return 0.57;
  if (circuitsCount <= 8) return 0.52;
  if (circuitsCount <= 11) return 0.48;
  return 0.45;
}

// Fator de Temperatura NBR 5410 Tabela 40 (PVC)
export function getTemperatureFactor(tempC: number): number {
  if (tempC <= 10) return 1.22;
  if (tempC <= 15) return 1.17;
  if (tempC <= 20) return 1.12;
  if (tempC <= 25) return 1.06;
  if (tempC <= 30) return 1.0;
  if (tempC <= 35) return 0.94;
  if (tempC <= 40) return 0.87;
  if (tempC <= 45) return 0.79;
  if (tempC <= 50) return 0.71;
  return 0.61;
}

// Resistividade do Cobre: ~0.0178 ohm*mm^2/m
const RESISTIVITY_COPPER = 0.0178;

export function calculateCircuit(input: CircuitCalculationInput): CalculationResult {
  const notes: string[] = [];

  const rawPower = Number(input.powerW) || 0;
  const powerFactor = Number(input.powerFactor) || 0.95;
  const voltageV = Number(input.voltageV) || 220;
  const lengthMeters = Number(input.lengthMeters) || 1;
  const unit = input.powerUnit || 'W';

  let powerW = rawPower;
  let powerVA = rawPower;

  if (unit === 'kW') {
    powerW = rawPower * 1000;
    powerVA = powerFactor > 0 ? powerW / powerFactor : powerW;
  } else if (unit === 'VA') {
    powerVA = rawPower;
    powerW = rawPower * powerFactor;
  } else if (unit === 'kVA') {
    powerVA = rawPower * 1000;
    powerW = powerVA * powerFactor;
  } else {
    // 'W'
    powerW = rawPower;
    powerVA = powerFactor > 0 ? powerW / powerFactor : powerW;
  }

  // 1. Determinar número de condutores carregados
  const is3Phase = input.systemType.startsWith('trifasico');
  const loadedConductors = is3Phase ? 3 : 2;

  // 2. Corrente de Projeto (Ib)
  let currentA = 0;
  if (is3Phase) {
    currentA = powerW / (Math.sqrt(3) * voltageV * (powerFactor || 1));
  } else {
    currentA = powerW / (voltageV * (powerFactor || 1));
  }

  // 3. Fatores de Correção
  const fAgrup = getGroupingFactor(input.groupedCircuits);
  const fTemp = getTemperatureFactor(input.ambientTempC);
  const totalCorrectionFactor = fAgrup * fTemp;

  // Corrente corrigida que o condutor precisará suportar na tabela
  const correctedCurrentA = currentA / totalCorrectionFactor;

  // 4. Bitola Mínima por Capacidade de Corrente (Ampacidade)
  const ampacityTable = AMPACITY_TABLE_PVC_COPPER[loadedConductors as 2 | 3];
  let minCableCapacityMM2 = 1.5;
  let cableAmpacityA = 0;

  const foundCable = ampacityTable.find((c) => c.ampacity >= correctedCurrentA);
  if (foundCable) {
    minCableCapacityMM2 = foundCable.section;
    cableAmpacityA = foundCable.ampacity;
  } else {
    // Se for maior que 120mm²
    minCableCapacityMM2 = 150;
    cableAmpacityA = 299;
    notes.push('Carga muito elevada; recomendado utilizar mais de um condutor por fase.');
  }

  // 5. Bitola Mínima por Critério da NBR 5410 (Secção Mínima)
  // Iluminação = 1.5 mm², Tomadas e Outros = 2.5 mm²
  const minNbrSection = input.loadType === 'iluminacao' ? 1.5 : 2.5;

  if (minCableCapacityMM2 < minNbrSection) {
    notes.push(`Sessão ajustada para ${minNbrSection} mm² devido ao limite mínimo da NBR 5410 para ${input.loadType === 'iluminacao' ? 'iluminação' : 'força/tomadas'}.`);
  }

  // 6. Bitola por Queda de Tensão MÁXIMA
  // Delta V (V) = (K * rho * L * Ib) / S
  // K = 2 para mono/bi, sqrt(3) para tri
  const K = is3Phase ? Math.sqrt(3) : 2.0;
  const maxDeltaV = ((input.maxVoltageDropPercent || 4) / 100) * voltageV;

  // S_min_vd = (K * rho * L * Ib) / maxDeltaV
  const calculatedVdSection = maxDeltaV > 0 ? (K * RESISTIVITY_COPPER * lengthMeters * currentA) / maxDeltaV : 0;

  // Encontrar na tabela a menor seção comercial que seja >= calculatedVdSection
  const allSections = [1.5, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0, 70.0, 95.0, 120.0];
  let minCableVoltageDropMM2 = allSections.find((s) => s >= calculatedVdSection) || 120.0;

  // 7. Escolha Final da Bitola (Maior das três exigências)
  const chosenCableMM2 = Math.max(minCableCapacityMM2, minNbrSection, minCableVoltageDropMM2);

  // Recalcular a capacidade real e a queda de tensão real da bitola escolhida
  const chosenCableObj = ampacityTable.find((c) => c.section === chosenCableMM2);
  if (chosenCableObj) {
    cableAmpacityA = chosenCableObj.ampacity;
  }

  // Iz real corrigido do cabo no eletroduto
  const correctedIzRealA = cableAmpacityA * totalCorrectionFactor;

  // Queda de tensão real
  const realDeltaV = (K * RESISTIVITY_COPPER * input.lengthMeters * currentA) / chosenCableMM2;
  const voltageDropPercent = (realDeltaV / input.voltageV) * 100;

  const nonComplianceReasons: string[] = [];

  // Queda de Tensão
  if (voltageDropPercent > input.maxVoltageDropPercent) {
    const msg = `Queda de tensão de ${voltageDropPercent.toFixed(2)}% excede o limite máximo permitido de ${input.maxVoltageDropPercent}% (NBR 5410 Item 6.2.7).`;
    notes.push(msg);
    nonComplianceReasons.push(msg);
  }

  // 8. Escolha do Disjuntor (In)
  // Regra da NBR 5410: Ib <= In <= Iz (onde Iz é a capacidade corrigida do cabo instalado)
  let recommendedBreakerA = STANDARD_BREAKERS.find(
    (inVal) => inVal >= currentA && inVal <= correctedIzRealA
  );

  if (!recommendedBreakerA) {
    // Tenta o menor disjuntor >= Ib caso o cabo suporte
    const fallbackBreaker = STANDARD_BREAKERS.find((inVal) => inVal >= currentA);
    recommendedBreakerA = fallbackBreaker || Math.ceil(currentA);
    if (recommendedBreakerA > correctedIzRealA) {
      const msg = `Disjuntor (${recommendedBreakerA}A) excede a capacidade corrigida do cabo Iz (${correctedIzRealA.toFixed(1)}A). Viola NBR 5410 Item 5.3.4 (Ib ≤ In ≤ Iz).`;
      notes.push(msg);
      nonComplianceReasons.push(msg);
    }
  }

  // Checagem extra: Se a bitola escolhida for menor que o mínimo da norma para a aplicação
  if (chosenCableMM2 < minNbrSection) {
    const msg = `Bitola escolhida (${chosenCableMM2} mm²) é menor que o mínimo estipulado pela NBR 5410 Item 6.2.6.1 (${minNbrSection} mm² para ${input.loadType === 'iluminacao' ? 'iluminação' : 'tomadas'}).`;
    nonComplianceReasons.push(msg);
  }

  // Checagem extra: Se Ib > Iz corrigido
  if (currentA > correctedIzRealA) {
    const msg = `Corrente de projeto Ib (${currentA.toFixed(1)}A) excede a capacidade corrigida do condutor Iz (${correctedIzRealA.toFixed(1)}A). Risco de sobreaquecimento.`;
    if (!nonComplianceReasons.includes(msg)) {
      nonComplianceReasons.push(msg);
    }
  }

  // 9. Curva do Disjuntor
  let breakerCurve: BreakerCurve = 'C';
  if (input.loadType === 'iluminacao' && input.powerFactor >= 0.95) {
    breakerCurve = 'B'; // Cargas puramente resistivas
  } else if (input.loadType === 'motor') {
    breakerCurve = 'D'; // Cargas com alto surto de partida
  } else {
    breakerCurve = 'C'; // Padrão geral (TUGs, TUEs, ar condicionado)
  }

  // 10. Dimensionamento de Eletroduto (estimativa rápida)
  let conduitMinInches = '1/2"';
  let conduitMinMM = 16;

  if (chosenCableMM2 <= 2.5 && input.groupedCircuits <= 2) {
    conduitMinInches = '1/2" (16mm)';
    conduitMinMM = 16;
  } else if (chosenCableMM2 <= 6.0 && input.groupedCircuits <= 4) {
    conduitMinInches = '3/4" (20mm)';
    conduitMinMM = 20;
  } else if (chosenCableMM2 <= 16.0) {
    conduitMinInches = '1" (25mm)';
    conduitMinMM = 25;
  } else if (chosenCableMM2 <= 35.0) {
    conduitMinInches = '1.1/4" (32mm)';
    conduitMinMM = 32;
  } else {
    conduitMinInches = '1.1/2" (40mm)';
    conduitMinMM = 40;
  }

  const isCompliant = nonComplianceReasons.length === 0;

  return {
    currentA,
    correctedCurrentA,
    powerW,
    powerVA,
    groupingFactor: fAgrup,
    tempFactor: fTemp,
    minCableCapacityMM2,
    minCableVoltageDropMM2,
    chosenCableMM2,
    cableAmpacityA,
    voltageDropV: realDeltaV,
    voltageDropPercent,
    recommendedBreakerA,
    breakerCurve,
    conduitMinInches,
    conduitMinMM,
    isCompliant,
    nonComplianceReasons,
    notes,
  };
}
