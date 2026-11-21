// Expected values below were computed by hand (multiplication of the stated
// inputs), not by calling the engine. SIL band expectations follow
// IEC 61511-1:2016 Table 4 (low demand). Input values are illustrative test
// data, NOT benchmark data from any guideline.
import { describe, it, expect } from "vitest";
import { calculateLopa, lookupRequiredSil, DEFAULT_SIL_BANDS, legacyStudyToInput, type LopaInput, type LopaIPL } from "./lopaEngine";

const ipl = (id: string, pfd: number, extra: Partial<LopaIPL> = {}): LopaIPL => ({
  id, name: `Independent layer ${id}`, pfd, source: "test data", provenance: "ENGINEER_CONFIRMED",
  independenceReview: { confirmed: true, reviewer: "Test Eng", justification: "Separate sensor, logic solver, final element" }, ...extra,
});
const base = (over: Partial<LopaInput>): LopaInput => ({
  tmel: 1e-5, tmelUnit: "per_year", tmelSource: "test", initiatingEvents: [], ipls: [], modifiers: [], ...over,
});
const ie = (id: string, frequency: number | null, iplIds: string[], modifierIds: string[] = []) => ({
  id, name: `Pump trip ${id}`, frequency, frequencyUnit: "per_year", source: "test data", provenance: "ENGINEER_CONFIRMED" as const, iplIds, modifierIds,
});
const codes = (r: ReturnType<typeof calculateLopa>) => r.issues.map((i) => i.code);

describe("LOPA engine", () => {
  it("1. single IPL: 0.1/yr × 0.01 = 1e-3/yr; TMEL 1e-5 → RRF 100, PFD 0.01 → SIL 1", () => {
    const r = calculateLopa(base({ ipls: [ipl("A", 0.01)], initiatingEvents: [ie("E1", 0.1, ["A"])] }));
    expect(r.status).toBe("CALCULATED");
    expect(r.iel).toBeCloseTo(1e-3, 15);
    expect(r.requiredRrf).toBeCloseTo(100, 9);
    expect(r.requiredPfd).toBeCloseTo(0.01, 12);
    expect(r.requiredSil).toBe("SIL 1");
    expect(r.achievedSil).toBe("NOT_VERIFIED");
  });

  it("2. multiple IPLs + modifier: 1 × 0.1 × 0.01 × 0.5 = 5e-4; RRF 50 → PFD 0.02 → SIL 1", () => {
    const r = calculateLopa(base({
      ipls: [ipl("A", 0.1), ipl("B", 0.01)],
      modifiers: [{ id: "T", type: "time_at_risk", value: 0.5, source: "test" }],
      initiatingEvents: [ie("E1", 1, ["A", "B"], ["T"])],
    }));
    expect(r.iel).toBeCloseTo(5e-4, 15);
    expect(r.requiredRrf).toBeCloseTo(50, 9);
    expect(r.requiredSil).toBe("SIL 1");
  });

  it("3. different IPLs per IE: 0.1×0.1 + 0.01×0.01 = 0.0101 (global product would give 1.1e-4)", () => {
    const r = calculateLopa(base({
      tmel: 1e-4, ipls: [ipl("A", 0.1), ipl("B", 0.01)],
      initiatingEvents: [ie("E1", 0.1, ["A"]), ie("E2", 0.01, ["B"])],
    }));
    expect(r.perEvent[0].mitigatedFrequency).toBeCloseTo(0.01, 15);
    expect(r.perEvent[1].mitigatedFrequency).toBeCloseTo(1e-4, 15);
    expect(r.iel).toBeCloseTo(0.0101, 15);
  });

  it("4. invalid PFDs are rejected, no numeric result", () => {
    for (const pfd of [0, -0.1, 1.5, NaN]) {
      const r = calculateLopa(base({ ipls: [ipl("A", pfd)], initiatingEvents: [ie("E1", 0.1, ["A"])] }));
      expect(r.status).toBe("INVALID");
      expect(r.iel).toBeNull();
      expect(r.requiredSil).toBeNull();
    }
  });

  it("5. missing / negative IEF and missing unit are rejected", () => {
    expect(codes(calculateLopa(base({ initiatingEvents: [ie("E1", null, [])] })))).toContain("IEF_MISSING");
    expect(codes(calculateLopa(base({ initiatingEvents: [ie("E1", -1, [])] })))).toContain("IEF_NEGATIVE");
    const r = calculateLopa(base({ initiatingEvents: [{ ...ie("E1", 0.1, []), frequencyUnit: undefined }] }));
    expect(r.status).toBe("INVALID");
    expect(codes(r)).toContain("IEF_UNIT");
  });

  it("6. invalid, unknown and double-counted modifiers are rejected", () => {
    const bad = calculateLopa(base({ modifiers: [{ id: "M", type: "ignition", value: 2, source: "x" }], initiatingEvents: [ie("E1", 0.1, [], ["M"])] }));
    expect(codes(bad)).toContain("MOD_RANGE");
    const unknown = calculateLopa(base({ initiatingEvents: [ie("E1", 0.1, [], ["NOPE"])] }));
    expect(codes(unknown)).toContain("MOD_UNKNOWN");
    const dbl = calculateLopa(base({
      modifiers: [{ id: "M1", type: "ignition", value: 0.1, source: "x" }, { id: "M2", type: "ignition", value: 0.3, source: "x" }],
      initiatingEvents: [ie("E1", 0.1, [], ["M1", "M2"])],
    }));
    expect(codes(dbl)).toContain("MOD_TYPE_DUPLICATE");
    expect(calculateLopa(base({ tmel: null, initiatingEvents: [ie("E1", 0.1, [])] })).status).toBe("INVALID");
  });

  it("7. shared logic solver / IE-cause sharing → DEPENDENCY_DETECTED", () => {
    const r = calculateLopa(base({
      ipls: [ipl("A", 0.1, { metadata: { logicSolver: "DCS-01" } }), ipl("B", 0.01, { metadata: { logicSolver: "dcs-01 " } })],
      initiatingEvents: [{ ...ie("E1", 0.1, ["A", "B"]), causeMetadata: { finalElement: "FV-101" } }],
    }));
    expect(r.perEvent[0].independence.status).toBe("DEPENDENCY_DETECTED");
    expect(r.status).toBe("CALCULATED_REVIEW_REQUIRED");
    const r2 = calculateLopa(base({
      ipls: [ipl("A", 0.1, { metadata: { finalElement: "FV-101" } })],
      initiatingEvents: [{ ...ie("E1", 0.1, ["A"]), causeMetadata: { finalElement: "FV-101" } }],
    }));
    expect(r2.perEvent[0].independence.findings.some((f) => f.field === "finalElement")).toBe(true);
  });

  it("8. different names but no engineer review → INDEPENDENCE NOT VERIFIED", () => {
    const r = calculateLopa(base({
      ipls: [ipl("A", 0.1, { independenceReview: undefined }), ipl("B", 0.01, { name: "Relief valve", independenceReview: undefined })],
      initiatingEvents: [ie("E1", 0.1, ["A", "B"])],
    }));
    expect(r.perEvent[0].independence.status).toBe("INDEPENDENCE_NOT_VERIFIED");
    expect(r.status).toBe("CALCULATED_REVIEW_REQUIRED");
    expect(codes(r)).toContain("INDEPENDENCE_NOT_VERIFIED");
  });

  it("9. SIL band boundaries (IEC 61511-1 Table 4, PFD in [min, max))", () => {
    const L = (p: number) => lookupRequiredSil(p, DEFAULT_SIL_BANDS);
    expect(L(0.1)).toMatch(/^NO SIL REQUIRED/);
    expect(L(0.0999)).toBe("SIL 1");
    expect(L(0.01)).toBe("SIL 1");
    expect(L(0.00999)).toBe("SIL 2");
    expect(L(1e-3)).toBe("SIL 2");
    expect(L(1e-4)).toBe("SIL 3");
    expect(L(1e-5)).toBe("SIL 4");
    expect(L(9.99e-6)).toMatch(/^BEYOND/);
    // Floating point: 1e-3/1e-6 = 1000 exactly in engineering terms → PFD 1e-3 → SIL 2
    const r = calculateLopa(base({ tmel: 1e-6, ipls: [ipl("A", 0.01)], initiatingEvents: [ie("E1", 0.1, ["A"])] }));
    expect(r.requiredSil).toBe("SIL 2");
    // RRF exactly 10 → PFD 0.1 → no SIL band
    const r10 = calculateLopa(base({ tmel: 1e-4, ipls: [ipl("A", 0.01)], initiatingEvents: [ie("E1", 0.1, ["A"])] }));
    expect(r10.requiredRrf).toBeCloseTo(10, 9);
    expect(r10.requiredSil).toMatch(/^NO SIL REQUIRED/);
    // IEL == TMEL → meets target
    const eq = calculateLopa(base({ tmel: 1e-3, ipls: [ipl("A", 0.01)], initiatingEvents: [ie("E1", 0.1, ["A"])] }));
    expect(eq.meetsTmel).toBe(true);
    expect(eq.requiredRrf).toBeNull();
  });

  it("10. zero and extremely small frequencies", () => {
    const z = calculateLopa(base({ initiatingEvents: [ie("E1", 0, [])] }));
    expect(z.iel).toBe(0);
    expect(z.meetsTmel).toBe(true);
    expect(z.requiredPfd).toBeNull();
    expect(codes(z)).toContain("IEF_ZERO");
    const tiny = calculateLopa(base({ ipls: [ipl("A", 1e-5)], initiatingEvents: [ie("E1", 1e-300, ["A"])] }));
    expect(tiny.iel).toBeGreaterThan(0);
    expect(tiny.iel! / 1e-305).toBeCloseTo(1, 9);
  });

  it("AI-suggested unconfirmed values block calculation", () => {
    const r = calculateLopa(base({ initiatingEvents: [{ ...ie("E1", 0.1, []), provenance: "AI_SUGGESTED" }] }));
    expect(r.status).toBe("INVALID");
  });

  it("legacy studies map with every IPL on every IE, flagged for review", () => {
    const input = legacyStudyToInput({ tmel: 1e-5, initiating_events: [{ name: "x", frequency: 0.1 }], ipls: [{ name: "PRV", pfd: 0.01 }], enabling_conditions: { probability: 1 } });
    const r = calculateLopa(input);
    expect(r.status).toBe("CALCULATED_REVIEW_REQUIRED");
    expect(codes(r)).toContain("IE_LEGACY");
    expect(r.iel).toBeCloseTo(1e-3, 15);
  });
});
