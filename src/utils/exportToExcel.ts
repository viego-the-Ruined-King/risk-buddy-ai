import * as XLSX from 'xlsx';

interface Hazard {
  description: string;
  who_might_be_harmed: string;
  consequences: string;
  likelihood: string;
  likelihood_score: number;
  severity: string;
  severity_score: number;
  risk_level: string;
  numerical_risk_level: number;
  existing_controls: string;
  proposed_controls: string;
  residual_likelihood: string;
  residual_likelihood_score: number;
  residual_severity: string;
  residual_severity_score: number;
  residual_risk_level: string;
  residual_numerical_risk_level: number;
}

export const exportToExcel = (hazards: any[], activityTitle: string = 'Risk Assessment') => {
  // Prepare data for Excel
  const excelData = hazards.map((hazard, index) => ({
    '#': index + 1,
    'Hazard Description': hazard.description,
    'Who Might Be Harmed': hazard.who_might_be_harmed,
    'Consequences': hazard.consequences,
    'Likelihood': hazard.likelihood,
    'L Score': hazard.likelihood_score,
    'Severity': hazard.severity,
    'S Score': hazard.severity_score,
    'Risk Level': hazard.risk_level,
    'L×S': hazard.numerical_risk_level,
    'Existing Controls': hazard.existing_controls,
    'Proposed Controls': hazard.proposed_controls,
    'Residual Likelihood': hazard.residual_likelihood,
    'R-L Score': hazard.residual_likelihood_score,
    'Residual Severity': hazard.residual_severity,
    'R-S Score': hazard.residual_severity_score,
    'Residual Risk Level': hazard.residual_risk_level,
    'R-L×S': hazard.residual_numerical_risk_level,
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 30 },  // Hazard Description
    { wch: 25 },  // Who Might Be Harmed
    { wch: 30 },  // Consequences
    { wch: 15 },  // Likelihood
    { wch: 8 },   // L Score
    { wch: 15 },  // Severity
    { wch: 8 },   // S Score
    { wch: 18 },  // Risk Level
    { wch: 8 },   // L×S
    { wch: 40 },  // Existing Controls
    { wch: 50 },  // Proposed Controls
    { wch: 18 },  // Residual Likelihood
    { wch: 10 },  // R-L Score
    { wch: 18 },  // Residual Severity
    { wch: 10 },  // R-S Score
    { wch: 22 },  // Residual Risk Level
    { wch: 10 },  // R-L×S
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Risk Assessment');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${activityTitle.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);
};
