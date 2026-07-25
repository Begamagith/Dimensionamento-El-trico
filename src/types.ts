export type TabId = 'calculator' | 'panel' | 'qdc_builder' | 'diagrams' | 'quick_calc' | 'helpers' | 'guide' | 'profile';

export type DINDeviceType = 'main_breaker' | 'circuit_breaker' | 'idr' | 'dps';

export interface QDCDevice {
  id: string;
  type: DINDeviceType;
  name: string;
  amperageA: number; // e.g. 10, 16, 20, 25, 32, 40, 50, 63, 80, 100
  poles: 1 | 2 | 3 | 4; // 1P, 2P, 3P, 4P
  curve?: 'B' | 'C' | 'D';
  sensitivityMA?: number; // for IDR (e.g. 30mA)
  dpsKA?: number; // for DPS (e.g. 20kA, 45kA)
  powerW?: number; // associated load power if linked to circuit
  isPoweredOn: boolean;
  isTripped: boolean;
  linkedCircuitId?: string;
}

export type SystemType = 'monofasico_127' | 'monofasico_220' | 'bifasico_220' | 'bifasico_380' | 'trifasico_220' | 'trifasico_380';

export type LoadType = 'iluminacao' | 'tug' | 'tue' | 'motor';

export type InstallationMethod = 'B1' | 'B2' | 'C' | 'D' | 'A1';

export type InsulationType = 'PVC' | 'EPR_XLPE';

export type ConductorMaterial = 'cobre' | 'aluminio';

export type BreakerCurve = 'B' | 'C' | 'D';

export type PowerUnit = 'W' | 'VA' | 'kW' | 'kVA';

export interface CircuitCalculationInput {
  name: string;
  loadType: LoadType;
  powerW: number; // Valor numérico informado ou potência ativa calculada em W
  powerVA?: number; // Potência aparente em VA
  powerUnit?: PowerUnit; // Unidade selecionada ('W', 'VA', 'kW', 'kVA')
  powerFactor: number; // Fator de potência (ex: 0.95 ou 0.8 para motor)
  voltageV: number; // Tensão em Volts (127, 220, 380)
  systemType: SystemType;
  lengthMeters: number; // Distância do quadro até a carga em metros
  maxVoltageDropPercent: number; // Queda de tensão máxima permitida (ex: 2% ou 4%)
  installationMethod: InstallationMethod;
  insulation: InsulationType;
  material: ConductorMaterial;
  groupedCircuits: number; // Número de circuitos agrupados no mesmo eletroduto (fator de agrupamento)
  ambientTempC: number; // Temperatura ambiente em °C (padrão 30°C)
}

export interface CalculationResult {
  currentA: number; // Corrente de projeto (Ib)
  correctedCurrentA: number; // Corrente corrigida pelos fatores (Ib / (fTemp * fAgrup))
  powerW: number; // Potência ativa em W
  powerVA: number; // Potência aparente em VA
  groupingFactor: number;
  tempFactor: number;
  minCableCapacityMM2: number; // Bitola por capacidade de corrente
  minCableVoltageDropMM2: number; // Bitola por queda de tensão
  chosenCableMM2: number; // Bitola final escolhida (maior das duas e atendendo mínima da NBR 5410)
  cableAmpacityA: number; // Capacidade de condução do cabo escolhido
  voltageDropV: number; // Queda de tensão em Volts na bitola escolhida
  voltageDropPercent: number; // Queda de tensão em %
  recommendedBreakerA: number; // Disjuntor recomendado (In)
  breakerCurve: BreakerCurve;
  conduitMinInches: string; // Eletroduto mínimo em polegadas (ex: 3/4")
  conduitMinMM: number; // Eletroduto em mm
  isCompliant: boolean;
  nonComplianceReasons: string[]; // Lista de motivos detalhados de não conformidade com a NBR 5410
  notes: string[];
}

export interface SavedCircuit extends CircuitCalculationInput {
  id: string;
  result: CalculationResult;
  createdAt: string;
}

export interface ProjectSettings {
  projectName: string;
  clientName: string;
  electricianName: string;
  defaultVoltage: number;
  maxVoltageDropTotalPercent: number;
}

