import type { QraStudyData, QraFormInputs } from "@/pages/QraStudy";

export function exportQraToExcel(results: QraStudyData, formData: QraFormInputs) {
  const rows: string[][] = [];
  const addRow = (...cells: string[]) => rows.push(cells);
  const addBlank = () => rows.push([]);

  // Study Details
  addRow("QRA STUDY REPORT - Per EGPC-PSM-GL-008");
  addBlank();
  addRow("Study Title", formData.title);
  addRow("Facility Description", formData.facility_description);
  addRow("Objective", formData.objective || results.study_summary?.objective || "");
  addRow("Lifecycle Phase", formData.lifecycle_phase);
  addRow("Risk Types", formData.risk_types);
  addRow("Scope/Boundaries", formData.scope_boundaries);
  addBlank();

  // Assumption Register
  addRow("ASSUMPTION REGISTER");
  addRow("Category", "Assumption", "Reference");
  for (const a of results.assumption_register || []) {
    addRow(a.category, a.assumption, a.reference);
  }
  addBlank();

  // Failure Cases
  addRow("FAILURE CASES");
  addRow("ID", "Isolatable Section", "Equipment", "Material", "Phase", "Small (mm)", "Small (kg/s)", "Medium (mm)", "Medium (kg/s)", "Large (mm)", "Large (kg/s)", "Rupture (mm)", "Rupture (kg/s)", "Frequency (/yr)", "Source");
  for (const fc of results.failure_cases || []) {
    const hs = fc.hole_sizes || [];
    const getHS = (cat: string) => hs.find(h => h.category === cat);
    const small = getHS("Small");
    const medium = getHS("Medium");
    const large = getHS("Large");
    const rupture = getHS("Rupture");
    addRow(
      fc.id, fc.isolatable_section, fc.equipment, fc.material, fc.phase,
      String(small?.diameter_mm || ""), String(small?.rate_kg_s || ""),
      String(medium?.diameter_mm || ""), String(medium?.rate_kg_s || ""),
      String(large?.diameter_mm || ""), String(large?.rate_kg_s || ""),
      String(rupture?.diameter_mm || ""), String(rupture?.rate_kg_s || ""),
      String(fc.frequency_per_year), fc.frequency_source
    );
  }
  addBlank();

  // Consequence Assessment
  addRow("CONSEQUENCE ASSESSMENT");
  addRow("FC ID", "Hole Size", "Outcome Type", "Probability", "Effects");
  for (const ca of results.consequence_assessment || []) {
    for (const outcome of ca.outcomes || []) {
      const effects = Object.entries(outcome.effects || {}).map(([k, v]) => `${k}: ${v}m`).join("; ");
      addRow(ca.failure_case_id, ca.hole_size, outcome.type, String(outcome.probability), effects);
    }
  }
  addBlank();

  // Risk Analysis - Individual Risk
  addRow("INDIVIDUAL RISK ANALYSIS");
  addRow("Group/Location", "IRPA Value", "Status");
  for (const w of results.risk_analysis?.individual_risk?.irpa_workers || []) {
    addRow(w.group, w.irpa_value.toExponential(2), w.status);
  }
  for (const p of results.risk_analysis?.individual_risk?.irpa_public || []) {
    addRow(p.location, p.irpa_value.toExponential(2), p.status);
  }
  addBlank();

  // FN Curve Data
  addRow("SOCIETAL RISK - FN CURVE DATA");
  addRow("N (Fatalities)", "F (Cumulative Frequency /yr)");
  for (const d of results.risk_analysis?.societal_risk?.fn_curve_data || []) {
    addRow(String(d.n), d.f.toExponential(2));
  }
  addRow("PLL", String(results.risk_analysis?.societal_risk?.pll || 0));
  addBlank();

  // Risk Evaluation
  addRow("RISK EVALUATION");
  addRow("Overall Status", results.risk_evaluation?.overall_status || "");
  addRow("Comparison to Criteria", results.risk_evaluation?.comparison_to_criteria || "");
  addRow("Major Contributors", (results.risk_evaluation?.major_risk_contributors || []).join("; "));
  addBlank();

  // ALARP
  addRow("ALARP DEMONSTRATION");
  addRow("Measure", "Type", "Hierarchy", "RRF", "Cost", "Standard");
  for (const m of results.alarp_demonstration?.risk_reduction_measures || []) {
    addRow(m.measure, m.type, m.hierarchy, String(m.risk_reduction_factor), m.cost_estimate, m.standard_reference);
  }
  addRow("Residual Status", results.alarp_demonstration?.residual_risk_status || "");
  addBlank();

  // Recommendations
  addRow("RECOMMENDATIONS");
  addRow("ID", "Description", "Priority", "Reference");
  for (const r of results.recommendations || []) {
    addRow(r.id, r.description, r.priority, r.reference);
  }

  // Build CSV
  const csvContent = rows.map(row =>
    row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `QRA_Study_${formData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
