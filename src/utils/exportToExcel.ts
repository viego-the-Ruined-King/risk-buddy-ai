import ExcelJS from 'exceljs';

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

export const exportToExcel = async (hazards: any[], activityTitle: string = 'Risk Assessment') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Risk Assessment');

  // Define columns
  worksheet.columns = [
    { header: '#', key: 'num', width: 5 },
    { header: 'Hazard Description', key: 'description', width: 30 },
    { header: 'Who Might Be Harmed', key: 'who_might_be_harmed', width: 25 },
    { header: 'Consequences', key: 'consequences', width: 30 },
    { header: 'Likelihood', key: 'likelihood', width: 15 },
    { header: 'L Score', key: 'likelihood_score', width: 8 },
    { header: 'Severity', key: 'severity', width: 15 },
    { header: 'S Score', key: 'severity_score', width: 8 },
    { header: 'Risk Level', key: 'risk_level', width: 18 },
    { header: 'L×S', key: 'numerical_risk_level', width: 8 },
    { header: 'Existing Controls', key: 'existing_controls', width: 40 },
    { header: 'Proposed Controls', key: 'proposed_controls', width: 50 },
    { header: 'Residual Likelihood', key: 'residual_likelihood', width: 18 },
    { header: 'R-L Score', key: 'residual_likelihood_score', width: 10 },
    { header: 'Residual Severity', key: 'residual_severity', width: 18 },
    { header: 'R-S Score', key: 'residual_severity_score', width: 10 },
    { header: 'Residual Risk Level', key: 'residual_risk_level', width: 22 },
    { header: 'R-L×S', key: 'residual_numerical_risk_level', width: 10 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  hazards.forEach((hazard, index) => {
    worksheet.addRow({
      num: index + 1,
      description: hazard.description,
      who_might_be_harmed: hazard.who_might_be_harmed,
      consequences: hazard.consequences,
      likelihood: hazard.likelihood,
      likelihood_score: hazard.likelihood_score,
      severity: hazard.severity,
      severity_score: hazard.severity_score,
      risk_level: hazard.risk_level,
      numerical_risk_level: hazard.numerical_risk_level,
      existing_controls: hazard.existing_controls,
      proposed_controls: hazard.proposed_controls,
      residual_likelihood: hazard.residual_likelihood,
      residual_likelihood_score: hazard.residual_likelihood_score,
      residual_severity: hazard.residual_severity,
      residual_severity_score: hazard.residual_severity_score,
      residual_risk_level: hazard.residual_risk_level,
      residual_numerical_risk_level: hazard.residual_numerical_risk_level,
    });
  });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${activityTitle.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.xlsx`;

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
