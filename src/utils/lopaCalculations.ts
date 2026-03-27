// EGPC-PSM-GL-015 LOPA Calculation Utilities
// All math is performed here — the LLM NEVER does calculations.

// ========== EGPC Reference Data ==========

export const TMEL_BY_SEVERITY: Record<string, number> = {
  'Disastrous': 1e-6,
  'Catastrophic': 1e-5,
  'Major': 1e-4,
  'Serious': 1e-3,
  'Minor': 1e-2,
  'Notable': 1e-1,
};

export const INITIATING_EVENT_FREQUENCIES: Record<string, number> = {
  'Control valve failure (dangerous)': 0.1,
  'Control valve failure (spurious)': 0.1,
  'Pressure regulator failure (dangerous)': 0.1,
  'Pressure regulator failure (spurious)': 0.1,
  'Basic process control loop failure': 0.1,
  'Cooling water failure (single pump)': 0.1,
  'Cooling water failure (dual pump)': 0.01,
  'Loss of instrument air': 0.1,
  'Loss of electric power': 0.1,
  'Loss of steam': 0.1,
  'Pump failure (single pump)': 0.1,
  'Pump failure (dual pump)': 0.01,
  'Compressor failure': 0.1,
  'Heat exchanger leak (internal)': 0.01,
  'Heat exchanger tube rupture': 0.001,
  'Gasket/packing blowout': 0.01,
  'Turbine/engine overspeed': 0.01,
  'Spontaneous combustion in vessels': 0.01,
  'Operator error during routine operation': 0.1,
  'Operator error during non-routine operation': 1.0,
  'Maintenance error': 0.1,
  'Loading/unloading error': 0.01,
  'Third party intervention (vehicle impact)': 0.01,
  'Lightning strike (direct)': 0.001,
  'Earthquake (major)': 0.0001,
  'Flooding': 0.01,
  'High wind/hurricane': 0.01,
  'Piping leak (10% of pipe diameter)': 0.001,
  'Piping rupture (full bore)': 0.0001,
  'Hose failure': 0.01,
  'Flange leak': 0.01,
  'Atmospheric tank failure': 0.0001,
  'Pressure vessel failure': 0.00001,
  'Tank overfill': 0.01,
  'Tank roof collapse': 0.001,
  'PRV fails to open': 0.01,
  'PRV opens spuriously': 0.01,
  'Rupture disk fails to open': 0.001,
  'Rupture disk spurious failure': 0.01,
  'Level control loop failure': 0.1,
  'Flow control loop failure': 0.1,
  'Temperature control loop failure': 0.1,
  'Pressure control loop failure': 0.1,
  'External fire': 0.01,
  'Corrosion-induced failure': 0.01,
  'Erosion-induced failure': 0.01,
  'Fatigue failure': 0.001,
  'Thermal expansion damage': 0.01,
  'Waterhammer': 0.01,
};

export const IPL_PFD_VALUES: Record<string, number> = {
  // Passive IPLs
  'Dike/containment': 0.01,
  'Underground drainage system': 0.01,
  'Open vent (no valve)': 0.01,
  'Flame arrestor': 0.01,
  'Blast wall/barrier': 0.01,
  'Fireproofing': 0.01,
  'Overflow line (no impediment)': 0.001,
  'Overflow line (possible impediment)': 0.1,
  'Dikes, berms, bunds': 0.01,
  'Drainage to remote impoundment': 0.01,
  'Permanent mechanical stop': 0.01,
  'Fire-resistant insulation': 0.01,
  // Active IPLs - BPCS
  'BPCS control loop': 0.1,
  'Safety control loop': 0.1,
  'Safety interlock': 0.1,
  // Active IPLs - SIS
  'SIS SIL-1': 0.1,
  'SIS SIL-2': 0.01,
  'SIS SIL-3': 0.001,
  'SIS SIL-4': 0.0001,
  // Active IPLs - Relief Devices
  'PRV spring-operated (no block valve)': 0.01,
  'PRV spring-operated (with block valve)': 0.1,
  'Dual PRVs (single isolation)': 0.01,
  'Dual PRVs (common isolation)': 0.1,
  'Pilot-operated PRV': 0.01,
  'Rupture disk': 0.01,
  'Rupture disk + PRV series': 0.01,
  // Active IPLs - Human Response
  'Operator response to alarm (well-designed)': 0.1,
  'Operator response to alarm (excellent conditions)': 0.01,
  'Operator routine inspection (continuous)': 0.1,
  'Operator routine inspection (hourly)': 0.1,
  // Active IPLs - Detection/Suppression
  'Fire detection system': 0.1,
  'Gas detection system': 0.1,
  'Automatic fire suppression': 0.1,
  'Deluge system': 0.1,
  // Active IPLs - Mechanical
  'Check valve': 0.1,
  'Pressure reducing regulator': 0.1,
  'Excess flow valve': 0.1,
  'Emergency isolation valve (EIV)': 0.1,
  'Mechanical overspeed trip': 0.1,
};

export const TIME_AT_RISK_OPTIONS: Record<string, number> = {
  'Continuous operation': 1.0,
  'Intermittent (50% of time)': 0.5,
  'Intermittent (10% of time)': 0.1,
  'Batch operation (1 day/month)': 0.033,
  'Infrequent (<1% of time)': 0.01,
};

export const IGNITION_PROBABILITY_OPTIONS: Record<string, number> = {
  'Continuous ignition source present': 1.0,
  'Process area with hot work': 0.3,
  'Process area without hot work': 0.1,
  'Well-ventilated open area': 0.03,
  'Remote area, no ignition sources': 0.01,
  'LNG/LPG release (immediate ignition)': 0.08,
  'LNG/LPG release (delayed ignition)': 0.04,
  'Gasoline/naphtha release': 0.03,
  'Diesel/kerosene release': 0.01,
  'Heavy oil release': 0.003,
};

export const VULNERABILITY_OPTIONS: Record<string, number> = {
  'Direct exposure, no escape': 1.0,
  'Partially enclosed area': 0.5,
  'Open area, limited escape': 0.3,
  'Open area, good escape routes': 0.1,
  'Control room with HVAC protection': 0.01,
  'Remote personnel': 0.001,
};

// BPCS-related initiating events for independence check
const BPCS_RELATED_EVENTS = [
  'Basic process control loop failure',
  'Control valve failure (dangerous)',
  'Control valve failure (spurious)',
  'Pressure regulator failure (dangerous)',
  'Pressure regulator failure (spurious)',
  'Level control loop failure',
  'Flow control loop failure',
  'Temperature control loop failure',
  'Pressure control loop failure',
];

const BPCS_IPL_NAMES = [
  'BPCS control loop',
  'Safety control loop',
  'Safety interlock',
];

// ========== Calculation Functions ==========

export interface IELCalculation {
  initiating_event: string;
  ief: number;
  ipls_product: number;
  pec: number;
  pcm: number;
  iel: number;
}

/**
 * Calculate Total IEL per EGPC-PSM-GL-015 Section 7.8
 * IEL = IEF × Π(PFD of IPLs) × PEC × PCM
 */
export function calculateIEL(
  frequency: number,
  pfdsArray: number[],
  enablingConditionProbability: number,
  timeAtRisk: number,
  ignitionProbability: number,
  vulnerability: number
): number {
  const iplsProduct = pfdsArray.length > 0
    ? pfdsArray.reduce((product, pfd) => product * pfd, 1)
    : 1;
  const pcm = timeAtRisk * ignitionProbability * vulnerability;
  return frequency * iplsProduct * enablingConditionProbability * pcm;
}

export function calculateIELsForAllEvents(
  initiatingEvents: Array<{ name: string; frequency: number }>,
  ipls: Array<{ pfd: number }>,
  enablingConditionProbability: number,
  timeAtRisk: number,
  ignitionProbability: number,
  vulnerability: number
): { calculations: IELCalculation[]; totalIEL: number } {
  const iplsProduct = ipls.length > 0
    ? ipls.reduce((product, ipl) => product * ipl.pfd, 1)
    : 1;
  const pcm = timeAtRisk * ignitionProbability * vulnerability;

  const calculations = initiatingEvents.map(ie => {
    const iel = ie.frequency * iplsProduct * enablingConditionProbability * pcm;
    return {
      initiating_event: ie.name,
      ief: ie.frequency,
      ipls_product: iplsProduct,
      pec: enablingConditionProbability,
      pcm,
      iel,
    };
  });

  const totalIEL = calculations.reduce((sum, calc) => sum + calc.iel, 0);
  return { calculations, totalIEL };
}

export function determineSIL(pfd: number): string {
  if (pfd >= 0.1) return 'None';
  if (pfd >= 0.01) return 'SIL-1';
  if (pfd >= 0.001) return 'SIL-2';
  if (pfd >= 0.0001) return 'SIL-3';
  return 'SIL-4';
}

export function calculateSILRequirements(
  totalIEL: number,
  tmel: number
): {
  pfd_target: number | null;
  sil_required: string;
  iel_vs_tmel: string;
} {
  if (totalIEL <= tmel) {
    return { pfd_target: null, sil_required: 'None', iel_vs_tmel: 'ACCEPTABLE' };
  }
  const pfd_target = tmel / totalIEL;
  return {
    pfd_target,
    sil_required: determineSIL(pfd_target),
    iel_vs_tmel: 'REQUIRES_ADDITIONAL_PROTECTION',
  };
}

/**
 * Check if an IPL lacks independence from the initiating event.
 * Returns a warning message if BPCS is used as IPL when IE is BPCS-related.
 */
export function checkIPLIndependence(
  initiatingEventName: string,
  iplName: string
): string | null {
  const isBPCSEvent = BPCS_RELATED_EVENTS.some(e =>
    initiatingEventName.toLowerCase().includes(e.toLowerCase().slice(0, 20))
  );
  const isBPCSIPL = BPCS_IPL_NAMES.some(b =>
    iplName.toLowerCase().includes(b.toLowerCase().slice(0, 15))
  );
  if (isBPCSEvent && isBPCSIPL) {
    return 'Warning: IPL may lack independence from Initiating Event. BPCS cannot be both initiating event and IPL for the same scenario (EGPC Section 7.5).';
  }
  return null;
}

export function formatNumber(num: number | undefined | null, decimals = 2): string {
  if (num === undefined || num === null) return '-';
  if (num === 0) return '0';
  if (Math.abs(num) < 0.001 || Math.abs(num) >= 1000) return num.toExponential(decimals);
  return num.toFixed(decimals);
}
