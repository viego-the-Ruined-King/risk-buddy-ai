import type { HazidHazard } from '@/pages/HazidStudy';

// Simple CSV export that avoids complex Excel library dependencies
export const exportHazidToExcel = (hazards: HazidHazard[], studyTitle: string = 'HAZID_Study') => {
  const headers = [
    'H-No',
    'Guideword',
    'Hazard Description',
    'Source Location / Activity',
    'Company Specific Source',
    'Possible Causes',
    'Top Event',
    'Consequences',
    'Assess For',
    'Initial Risk Ranking (EGPC)',
    'Initial Likelihood',
    'Initial Severity',
    'MAH',
    'Existing Controls',
    'Current Risk Ranking (EGPC)',
    'Current Likelihood',
    'Current Severity',
    'Recommendations',
    'Residual Risk Ranking (EGPC)',
    'Residual Likelihood',
    'Residual Severity',
    'Action Party',
    'Target Date',
  ];

  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = hazards.map((hazard) => [
    hazard.h_no,
    hazard.guideword,
    hazard.hazard_description,
    hazard.source_location,
    hazard.company_specific_source,
    hazard.possible_causes,
    hazard.top_event,
    hazard.consequences,
    hazard.assess_for,
    hazard.risk_ranking_initial,
    hazard.initial_risk?.likelihood || '',
    hazard.initial_risk?.severity || '',
    hazard.mah,
    hazard.existing_controls,
    hazard.risk_ranking_current || '',
    hazard.current_risk?.likelihood || '',
    hazard.current_risk?.severity || '',
    Array.isArray(hazard.recommendations) 
      ? hazard.recommendations.join('; ') 
      : hazard.recommendations,
    hazard.risk_ranking_residual || '',
    hazard.residual_risk?.likelihood || '',
    hazard.residual_risk?.severity || '',
    hazard.action_party || '',
    hazard.target_date || '',
  ].map(escapeCSV).join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${studyTitle.replace(/[^a-z0-9]/gi, '_')}_EGPC_${timestamp}.csv`;

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
