import ExcelJS from 'exceljs';
import type { HazidHazard } from '@/pages/HazidStudy';

export const exportHazidToExcel = async (hazards: HazidHazard[], studyTitle: string = 'HAZID_Study') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('HAZID Study');

  // Define columns
  worksheet.columns = [
    { header: 'H-No', key: 'h_no', width: 8 },
    { header: 'Guideword', key: 'guideword', width: 18 },
    { header: 'Hazard Description', key: 'hazard_description', width: 40 },
    { header: 'Source Location / Activity', key: 'source_location', width: 25 },
    { header: 'Company Specific Source', key: 'company_specific_source', width: 25 },
    { header: 'Possible Causes', key: 'possible_causes', width: 35 },
    { header: 'Top Event', key: 'top_event', width: 25 },
    { header: 'Consequences', key: 'consequences', width: 35 },
    { header: 'Assess For', key: 'assess_for', width: 15 },
    { header: 'Initial Risk Ranking (EGPC)', key: 'risk_ranking_initial', width: 25 },
    { header: 'Initial Likelihood', key: 'initial_likelihood', width: 15 },
    { header: 'Initial Severity', key: 'initial_severity', width: 15 },
    { header: 'MAH', key: 'mah', width: 8 },
    { header: 'Existing Controls', key: 'existing_controls', width: 40 },
    { header: 'Current Risk Ranking (EGPC)', key: 'risk_ranking_current', width: 25 },
    { header: 'Current Likelihood', key: 'current_likelihood', width: 15 },
    { header: 'Current Severity', key: 'current_severity', width: 15 },
    { header: 'Recommendations', key: 'recommendations', width: 50 },
    { header: 'Residual Risk Ranking (EGPC)', key: 'risk_ranking_residual', width: 25 },
    { header: 'Residual Likelihood', key: 'residual_likelihood', width: 15 },
    { header: 'Residual Severity', key: 'residual_severity', width: 15 },
    { header: 'Action Party', key: 'action_party', width: 20 },
    { header: 'Target Date', key: 'target_date', width: 15 },
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
  hazards.forEach((hazard) => {
    worksheet.addRow({
      h_no: hazard.h_no,
      guideword: hazard.guideword,
      hazard_description: hazard.hazard_description,
      source_location: hazard.source_location,
      company_specific_source: hazard.company_specific_source,
      possible_causes: hazard.possible_causes,
      top_event: hazard.top_event,
      consequences: hazard.consequences,
      assess_for: hazard.assess_for,
      risk_ranking_initial: hazard.risk_ranking_initial,
      initial_likelihood: hazard.initial_risk?.likelihood || '',
      initial_severity: hazard.initial_risk?.severity || '',
      mah: hazard.mah,
      existing_controls: hazard.existing_controls,
      risk_ranking_current: hazard.risk_ranking_current || '',
      current_likelihood: hazard.current_risk?.likelihood || '',
      current_severity: hazard.current_risk?.severity || '',
      recommendations: Array.isArray(hazard.recommendations) 
        ? hazard.recommendations.join('\n• ') 
        : hazard.recommendations,
      risk_ranking_residual: hazard.risk_ranking_residual || '',
      residual_likelihood: hazard.residual_risk?.likelihood || '',
      residual_severity: hazard.residual_risk?.severity || '',
      action_party: hazard.action_party || '',
      target_date: hazard.target_date || '',
    });
  });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${studyTitle.replace(/[^a-z0-9]/gi, '_')}_EGPC_${timestamp}.xlsx`;

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
