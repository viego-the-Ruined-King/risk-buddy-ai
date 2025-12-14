import * as XLSX from 'xlsx';
import type { HazidHazard } from '@/pages/HazidStudy';

export const exportHazidToExcel = (hazards: HazidHazard[], studyTitle: string = 'HAZID_Study') => {
  // Prepare data for Excel with EGPC format and accountability columns
  const excelData = hazards.map((hazard) => ({
    'H-No': hazard.h_no,
    'Guideword': hazard.guideword,
    'Hazard Description': hazard.hazard_description,
    'Source Location / Activity': hazard.source_location,
    'Company Specific Source': hazard.company_specific_source,
    'Possible Causes': hazard.possible_causes,
    'Top Event': hazard.top_event,
    'Consequences': hazard.consequences,
    'Assess For': hazard.assess_for,
    'Initial Risk Ranking (EGPC)': hazard.risk_ranking_initial,
    'Initial Likelihood': hazard.initial_risk?.likelihood || '',
    'Initial Severity': hazard.initial_risk?.severity || '',
    'MAH': hazard.mah,
    'Existing Controls': hazard.existing_controls,
    'Current Risk Ranking (EGPC)': hazard.risk_ranking_current || '',
    'Current Likelihood': hazard.current_risk?.likelihood || '',
    'Current Severity': hazard.current_risk?.severity || '',
    'Recommendations': Array.isArray(hazard.recommendations) 
      ? hazard.recommendations.join('\n• ') 
      : hazard.recommendations,
    'Residual Risk Ranking (EGPC)': hazard.risk_ranking_residual || '',
    'Residual Likelihood': hazard.residual_risk?.likelihood || '',
    'Residual Severity': hazard.residual_risk?.severity || '',
    'Action Party': hazard.action_party || '',
    'Target Date': hazard.target_date || '',
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },   // H-No
    { wch: 18 },  // Guideword
    { wch: 40 },  // Hazard Description
    { wch: 25 },  // Source Location
    { wch: 25 },  // Company Specific Source
    { wch: 35 },  // Possible Causes
    { wch: 25 },  // Top Event
    { wch: 35 },  // Consequences
    { wch: 15 },  // Assess For
    { wch: 25 },  // Initial Risk Ranking (EGPC)
    { wch: 15 },  // Initial Likelihood
    { wch: 15 },  // Initial Severity
    { wch: 8 },   // MAH
    { wch: 40 },  // Existing Controls
    { wch: 25 },  // Current Risk Ranking (EGPC)
    { wch: 15 },  // Current Likelihood
    { wch: 15 },  // Current Severity
    { wch: 50 },  // Recommendations
    { wch: 25 },  // Residual Risk Ranking (EGPC)
    { wch: 15 },  // Residual Likelihood
    { wch: 15 },  // Residual Severity
    { wch: 20 },  // Action Party
    { wch: 15 },  // Target Date
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'HAZID Study');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${studyTitle.replace(/[^a-z0-9]/gi, '_')}_EGPC_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);
};