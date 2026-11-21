// W.O.L.F AI — Deterministic LOPA calculation engine.
// Pure TypeScript, no runtime dependencies: imported by the authoritative
// Edge Function (lopa-calculate) and by the frontend for preview only.
// AI output is NEVER an input to this engine without engineer confirmation.

export const LOPA_ENGINE_VERSION = "lopa-engine/2.0.0";

export const LOPA_METHODOLOGY =
  "Per initiating event i: MEF_i = IEF_i × Π(PFD of IPLs assigned to i) × Π(modifiers assigned to i). " +
  "IEL (intermediate event likelihood, existing IPLs credited) = Σ MEF_i [/yr]. " +
  "If IEL > TMEL: Required RRF = IEL / TMEL; Required PFDavg of additional protection = TMEL / IEL. " +
  "Required SIL is looked up from the configured SIL band table using the required PFDavg.";

export const LOPA_REFERENCES = [
  "CCPS (2001), Layer of Protection Analysis: Simplified Process Risk Assessment, AIChE — scenario-based LOPA method.",
  "IEC 61511-1:2016, Table 4 (low demand mode) — default SIL bands by PFDavg.",
  "EGPC-PSM-GL-015 — LOPA guideline; tabulated IEF/PFD/TMEL values used by the app must be confirmed by the engineer against the controlled edition held by the company.",
];

export type Provenance = "ENGINEER_CONFIRMED" | "AI_SUGGESTED" | "LEGACY_UNREVIEWED" | "LIBRARY_VALUE";

export interface ComponentMetadata {
  sensor?: string;
  logicSolver?: string;
  finalElement?: string;
  powerSupply?: string;
  instrumentAir?: string;
  processConnection?: string;
  ccfGroup?: string;
}

export const COMPONENT_FIELDS: (keyof ComponentMetadata)[] = [
  "sensor", "logicSolver", "finalElement", "powerSupply", "instrumentAir", "processConnection", "ccfGroup",
];

export interface LopaIPL {
  id: string;
  name: string;
  pfd: number;
  source?: string;
  provenance?: Provenance;
  metadata?: ComponentMetadata;
  /** Engineer's documented independence review. Software never sets this. */
  independenceReview?: { confirmed: boolean; reviewer?: string; justification?: string };
}

export type ModifierType = "enabling_condition" | "time_at_risk" | "ignition" | "occupancy" | "vulnerability" | "other";

export interface LopaModifier {
  id: string;
  type: ModifierType;
  value: number;
  basis?: string;
  source?: string;
  provenance?: Provenance;
}

export interface LopaInitiatingEvent {
  id: string;
  name: string;
  frequency: number | null | undefined;
  frequencyUnit?: string; // must be "per_year"
  source?: string;
  provenance?: Provenance;
  iplIds: string[];
  modifierIds: string[];
  /** Components involved in causing the IE (e.g. the BPCS loop that fails). */
  causeMetadata?: ComponentMetadata;
}

/** A SIL band: required PFDavg in [pfdMin, pfdMax). */
export interface SilBand { label: string; pfdMin: number; pfdMax: number }

export interface SilBandConfig { bands: SilBand[]; reference: string }

export const DEFAULT_SIL_BANDS: SilBandConfig = {
  reference: "IEC 61511-1:2016 Table 4 (low demand mode of operation)",
  bands: [
    { label: "SIL 1", pfdMin: 1e-2, pfdMax: 1e-1 },
    { label: "SIL 2", pfdMin: 1e-3, pfdMax: 1e-2 },
    { label: "SIL 3", pfdMin: 1e-4, pfdMax: 1e-3 },
    { label: "SIL 4", pfdMin: 1e-5, pfdMax: 1e-4 },
  ],
};

export interface LopaInput {
  tmel: number | null | undefined;
  tmelUnit?: string; // "per_year"
  tmelSource?: string;
  initiatingEvents: LopaInitiatingEvent[];
  ipls: LopaIPL[];
  modifiers: LopaModifier[];
  silBands?: SilBandConfig;
}

export type IssueSeverity = "error" | "warning";
export interface LopaIssue { severity: IssueSeverity; code: string; message: string; ref?: string }

export type IndependenceStatus = "DEPENDENCY_DETECTED" | "INDEPENDENCE_NOT_VERIFIED" | "ENGINEER_CONFIRMED" | "NO_IPLS";

export interface IndependenceFinding { iplIds: string[]; field: string; value: string; message: string }

export interface InitiatingEventResult {
  id: string;
  name: string;
  ief: number;
  iplIds: string[];
  pfds: number[];
  iplProduct: number;
  modifierIds: string[];
  modifierValues: number[];
  modifierProduct: number;
  mitigatedFrequency: number;
  independence: { status: IndependenceStatus; findings: IndependenceFinding[] };
}

export type CalculationStatus = "INVALID" | "CALCULATED_REVIEW_REQUIRED" | "CALCULATED";

export interface LopaResult {
  engineVersion: string;
  methodology: string;
  references: string[];
  silBandReference: string;
  status: CalculationStatus;
  issues: LopaIssue[];
  perEvent: InitiatingEventResult[];
  tmel: number | null;
  iel: number | null;
  meetsTmel: boolean | null;
  requiredRrf: number | null;
  requiredPfd: number | null;
  requiredSil: string | null;
  /** Software never verifies achieved SIL; it requires SIF design verification (IEC 61511-1 §11.9). */
  achievedSil: "NOT_VERIFIED";
  calculatedAt: string;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const norm = (s?: string) => (s ?? "").trim().toLowerCase();
// Relative tolerance to absorb binary floating-point error at exact band boundaries
// (e.g. 1e-3/1e-5 = 100.00000000000001). Does not change any engineering value.
const REL_EPS = 1e-9;

export function lookupRequiredSil(requiredPfd: number, cfg: SilBandConfig): string {
  for (const b of cfg.bands) {
    const geMin = requiredPfd >= b.pfdMin * (1 - REL_EPS);
    const ltMax = requiredPfd < b.pfdMax * (1 - REL_EPS);
    if (geMin && ltMax) return b.label;
  }
  const maxTop = Math.max(...cfg.bands.map((b) => b.pfdMax));
  const minBottom = Math.min(...cfg.bands.map((b) => b.pfdMin));
  if (requiredPfd >= maxTop * (1 - REL_EPS)) return "NO SIL REQUIRED (RRF ≤ 10; non-SIS IPL may suffice — engineer to confirm)";
  if (requiredPfd < minBottom * (1 - REL_EPS)) return "BEYOND HIGHEST SIL BAND — process redesign required";
  return "UNDETERMINED (gap in configured SIL bands)";
}

function validateSilBands(cfg: SilBandConfig, issues: LopaIssue[]) {
  if (!cfg.bands.length) issues.push({ severity: "error", code: "SIL_BANDS_EMPTY", message: "No SIL band configuration supplied." });
  for (const b of cfg.bands) {
    if (!isNum(b.pfdMin) || !isNum(b.pfdMax) || b.pfdMin <= 0 || b.pfdMax > 1 || b.pfdMin >= b.pfdMax)
      issues.push({ severity: "error", code: "SIL_BAND_INVALID", message: `Invalid SIL band "${b.label}".` });
  }
  if (!cfg.reference?.trim()) issues.push({ severity: "error", code: "SIL_BANDS_NO_REFERENCE", message: "SIL band table has no documented reference." });
}

export function checkIndependence(ie: LopaInitiatingEvent, ipls: LopaIPL[]): { status: IndependenceStatus; findings: IndependenceFinding[] } {
  if (!ipls.length) return { status: "NO_IPLS", findings: [] };
  const findings: IndependenceFinding[] = [];
  for (const f of COMPONENT_FIELDS) {
    const groups = new Map<string, string[]>();
    for (const ipl of ipls) {
      const v = norm(ipl.metadata?.[f]);
      if (v) groups.set(v, [...(groups.get(v) ?? []), ipl.id]);
    }
    for (const [v, ids] of groups) {
      if (ids.length > 1) findings.push({ iplIds: ids, field: f, value: v, message: `IPLs ${ids.join(", ")} share ${f} "${v}".` });
    }
    const cause = norm(ie.causeMetadata?.[f]);
    if (cause) {
      for (const ipl of ipls) {
        if (norm(ipl.metadata?.[f]) === cause)
          findings.push({ iplIds: [ipl.id], field: f, value: cause, message: `IPL ${ipl.id} shares ${f} "${cause}" with the initiating event cause.` });
      }
    }
  }
  // Heuristic: BPCS-caused IE with BPCS-based IPL (CCPS 2001; IEC 61511-1 §9.3).
  const bpcsIE = /bpcs|control loop|control valve|regulator/i.test(ie.name);
  for (const ipl of ipls) {
    if (bpcsIE && /bpcs|control loop/i.test(ipl.name))
      findings.push({ iplIds: [ipl.id], field: "name_heuristic", value: ipl.name, message: `IE "${ie.name}" appears BPCS-related and IPL "${ipl.name}" appears BPCS-based — potential dependency.` });
  }
  if (findings.length) return { status: "DEPENDENCY_DETECTED", findings };
  const allReviewed = ipls.every((i) => i.independenceReview?.confirmed === true && !!i.independenceReview.justification?.trim());
  return { status: allReviewed ? "ENGINEER_CONFIRMED" : "INDEPENDENCE_NOT_VERIFIED", findings };
}

export function calculateLopa(input: LopaInput, now: Date = new Date()): LopaResult {
  const issues: LopaIssue[] = [];
  const silCfg = input.silBands ?? DEFAULT_SIL_BANDS;
  validateSilBands(silCfg, issues);

  const tmel = input.tmel;
  if (!isNum(tmel)) issues.push({ severity: "error", code: "TMEL_MISSING", message: "Target mitigated event likelihood (TMEL) is missing." });
  else if (tmel <= 0) issues.push({ severity: "error", code: "TMEL_INVALID", message: "TMEL must be > 0 per year." });
  if (input.tmelUnit !== "per_year") issues.push({ severity: "error", code: "TMEL_UNIT", message: "TMEL unit must be 'per_year'." });
  if (!input.tmelSource?.trim()) issues.push({ severity: "warning", code: "TMEL_NO_SOURCE", message: "TMEL has no documented basis." });

  const iplMap = new Map<string, LopaIPL>();
  for (const ipl of input.ipls) {
    if (iplMap.has(ipl.id)) issues.push({ severity: "error", code: "IPL_DUPLICATE_ID", message: `Duplicate IPL id ${ipl.id}.`, ref: ipl.id });
    iplMap.set(ipl.id, ipl);
    if (!ipl.name?.trim()) issues.push({ severity: "error", code: "IPL_NAME_MISSING", message: `IPL ${ipl.id} has no name.`, ref: ipl.id });
    if (!isNum(ipl.pfd)) issues.push({ severity: "error", code: "PFD_MISSING", message: `IPL ${ipl.id} PFD is missing or not a number.`, ref: ipl.id });
    else if (ipl.pfd <= 0 || ipl.pfd > 1) issues.push({ severity: "error", code: "PFD_RANGE", message: `IPL ${ipl.id} PFD ${ipl.pfd} outside (0, 1].`, ref: ipl.id });
    else if (ipl.pfd === 1) issues.push({ severity: "warning", code: "PFD_NO_CREDIT", message: `IPL ${ipl.id} PFD = 1 gives no risk reduction.`, ref: ipl.id });
    else if (ipl.pfd < 1e-5) issues.push({ severity: "warning", code: "PFD_BELOW_SIL4", message: `IPL ${ipl.id} PFD below the lowest IEC 61511 band (1e-5); requires exceptional justification.`, ref: ipl.id });
    if (!ipl.source?.trim()) issues.push({ severity: "warning", code: "IPL_NO_SOURCE", message: `IPL ${ipl.id} PFD has no reference source.`, ref: ipl.id });
    if (ipl.provenance === "AI_SUGGESTED") issues.push({ severity: "error", code: "IPL_AI_UNCONFIRMED", message: `IPL ${ipl.id} is an unconfirmed AI suggestion.`, ref: ipl.id });
  }

  const modMap = new Map<string, LopaModifier>();
  for (const m of input.modifiers) {
    if (modMap.has(m.id)) issues.push({ severity: "error", code: "MOD_DUPLICATE_ID", message: `Duplicate modifier id ${m.id}.`, ref: m.id });
    modMap.set(m.id, m);
    if (!isNum(m.value)) issues.push({ severity: "error", code: "MOD_MISSING", message: `Modifier ${m.id} value missing.`, ref: m.id });
    else if (m.value <= 0 || m.value > 1) issues.push({ severity: "error", code: "MOD_RANGE", message: `Modifier ${m.id} value ${m.value} outside (0, 1].`, ref: m.id });
    if (!m.source?.trim() && !m.basis?.trim()) issues.push({ severity: "warning", code: "MOD_NO_SOURCE", message: `Modifier ${m.id} has no documented basis.`, ref: m.id });
    if (m.provenance === "AI_SUGGESTED") issues.push({ severity: "error", code: "MOD_AI_UNCONFIRMED", message: `Modifier ${m.id} is an unconfirmed AI suggestion.`, ref: m.id });
  }

  if (!input.initiatingEvents.length) issues.push({ severity: "error", code: "IE_NONE", message: "At least one initiating event is required." });

  const perEvent: InitiatingEventResult[] = [];
  for (const ie of input.initiatingEvents) {
    const before = issues.filter((i) => i.severity === "error").length;
    if (!isNum(ie.frequency)) issues.push({ severity: "error", code: "IEF_MISSING", message: `IE ${ie.id} frequency missing.`, ref: ie.id });
    else if (ie.frequency < 0) issues.push({ severity: "error", code: "IEF_NEGATIVE", message: `IE ${ie.id} frequency is negative.`, ref: ie.id });
    else if (ie.frequency === 0) issues.push({ severity: "warning", code: "IEF_ZERO", message: `IE ${ie.id} frequency is zero; it contributes nothing — confirm this is intended.`, ref: ie.id });
    if (ie.frequencyUnit !== "per_year") issues.push({ severity: "error", code: "IEF_UNIT", message: `IE ${ie.id} frequency unit must be 'per_year'.`, ref: ie.id });
    if (!ie.source?.trim()) issues.push({ severity: "warning", code: "IEF_NO_SOURCE", message: `IE ${ie.id} frequency has no reference source.`, ref: ie.id });
    if (ie.provenance === "AI_SUGGESTED") issues.push({ severity: "error", code: "IE_AI_UNCONFIRMED", message: `IE ${ie.id} is an unconfirmed AI suggestion.`, ref: ie.id });
    if (ie.provenance === "LEGACY_UNREVIEWED") issues.push({ severity: "warning", code: "IE_LEGACY", message: `IE ${ie.id} comes from a legacy study where IPLs/modifiers were applied globally; review assignments.`, ref: ie.id });

    const seenIpl = new Set<string>();
    for (const id of ie.iplIds) {
      if (seenIpl.has(id)) issues.push({ severity: "error", code: "IPL_DUPLICATE_ASSIGNMENT", message: `IPL ${id} assigned twice to IE ${ie.id}.`, ref: ie.id });
      seenIpl.add(id);
      if (!iplMap.has(id)) issues.push({ severity: "error", code: "IPL_UNKNOWN", message: `IE ${ie.id} references unknown IPL ${id}.`, ref: ie.id });
    }
    const seenMod = new Set<string>();
    const seenType = new Set<string>();
    for (const id of ie.modifierIds) {
      if (seenMod.has(id)) issues.push({ severity: "error", code: "MOD_DUPLICATE_ASSIGNMENT", message: `Modifier ${id} assigned twice to IE ${ie.id}.`, ref: ie.id });
      seenMod.add(id);
      const m = modMap.get(id);
      if (!m) { issues.push({ severity: "error", code: "MOD_UNKNOWN", message: `IE ${ie.id} references unknown modifier ${id}.`, ref: ie.id }); continue; }
      if (m.type !== "other" && seenType.has(m.type)) issues.push({ severity: "error", code: "MOD_TYPE_DUPLICATE", message: `IE ${ie.id} has two '${m.type}' modifiers (double counting).`, ref: ie.id });
      seenType.add(m.type);
    }
    if (issues.filter((i) => i.severity === "error").length > before) continue;

    const ipls = ie.iplIds.map((id) => iplMap.get(id)!);
    const mods = ie.modifierIds.map((id) => modMap.get(id)!);
    const pfds = ipls.map((i) => i.pfd);
    const modifierValues = mods.map((m) => m.value);
    const iplProduct = pfds.reduce((a, b) => a * b, 1);
    const modifierProduct = modifierValues.reduce((a, b) => a * b, 1);
    const ief = ie.frequency as number;
    perEvent.push({
      id: ie.id, name: ie.name, ief, iplIds: [...ie.iplIds], pfds, iplProduct,
      modifierIds: [...ie.modifierIds], modifierValues, modifierProduct,
      mitigatedFrequency: ief * iplProduct * modifierProduct,
      independence: checkIndependence(ie, ipls),
    });
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  const base = {
    engineVersion: LOPA_ENGINE_VERSION, methodology: LOPA_METHODOLOGY, references: LOPA_REFERENCES,
    silBandReference: silCfg.reference, issues, achievedSil: "NOT_VERIFIED" as const, calculatedAt: now.toISOString(),
  };
  if (hasErrors) {
    return { ...base, status: "INVALID", perEvent, tmel: isNum(tmel) ? tmel : null, iel: null, meetsTmel: null, requiredRrf: null, requiredPfd: null, requiredSil: null };
  }

  const iel = perEvent.reduce((s, e) => s + e.mitigatedFrequency, 0);
  const t = tmel as number;
  let requiredRrf: number | null = null, requiredPfd: number | null = null, requiredSil: string | null;
  const meetsTmel = iel <= t;
  if (meetsTmel) {
    requiredSil = "NONE — IEL ≤ TMEL with credited IPLs";
  } else {
    requiredRrf = iel / t;
    requiredPfd = t / iel;
    requiredSil = lookupRequiredSil(requiredPfd, silCfg);
  }

  const independenceOk = perEvent.every((e) => e.independence.status === "ENGINEER_CONFIRMED" || e.independence.status === "NO_IPLS");
  if (!independenceOk) issues.push({ severity: "warning", code: "INDEPENDENCE_NOT_VERIFIED", message: "INDEPENDENCE NOT VERIFIED for one or more initiating events. Engineer review required before approval." });
  const reviewRequired = !independenceOk || issues.some((i) => i.severity === "warning");

  return { ...base, status: reviewRequired ? "CALCULATED_REVIEW_REQUIRED" : "CALCULATED", perEvent, tmel: t, iel, meetsTmel, requiredRrf, requiredPfd, requiredSil };
}

/** Map a legacy (global IPLs/modifiers) study into engine input. Flags everything as LEGACY_UNREVIEWED. */
export function legacyStudyToInput(s: {
  tmel?: number | null; tmel_basis?: string | null;
  initiating_events?: Array<{ name: string; frequency: number; source?: string }> | null;
  ipls?: Array<{ name: string; pfd: number; source?: string }> | null;
  enabling_conditions?: { probability?: number; description?: string } | null;
  conditional_modifiers?: Record<string, unknown> | null;
}): LopaInput {
  const ipls: LopaIPL[] = (s.ipls ?? []).map((p, i) => ({ id: `IPL-${i + 1}`, name: p.name, pfd: p.pfd, source: p.source, provenance: "LEGACY_UNREVIEWED" }));
  const cm = (s.conditional_modifiers ?? {}) as Record<string, any>;
  const modifiers: LopaModifier[] = [];
  const add = (id: string, type: ModifierType, v: unknown, basis?: string) => {
    if (v !== undefined && v !== null) modifiers.push({ id, type, value: Number(v), basis, provenance: "LEGACY_UNREVIEWED" });
  };
  add("MOD-EC", "enabling_condition", s.enabling_conditions?.probability, s.enabling_conditions?.description);
  add("MOD-TAR", "time_at_risk", cm.time_at_risk, cm.time_at_risk_basis);
  add("MOD-IGN", "ignition", cm.ignition_probability, cm.ignition_probability_basis);
  add("MOD-VUL", "vulnerability", cm.vulnerability, cm.vulnerability_basis);
  return {
    tmel: s.tmel ?? null, tmelUnit: "per_year", tmelSource: s.tmel_basis ?? undefined,
    ipls, modifiers,
    initiatingEvents: (s.initiating_events ?? []).map((e, i) => ({
      id: `IE-${i + 1}`, name: e.name, frequency: e.frequency, frequencyUnit: "per_year", source: e.source,
      provenance: "LEGACY_UNREVIEWED", iplIds: ipls.map((p) => p.id), modifierIds: modifiers.map((m) => m.id),
    })),
  };
}
