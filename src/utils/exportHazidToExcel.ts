import type { HazidHazard } from '@/pages/HazidStudy';

// CSV export matching EGPC-PSM-GL-001 Annex C HAZID Worksheet
export const exportHazidToExcel = (hazards: HazidHazard[], studyTitle: string = 'HAZID_Study') => {
  const headers = [
    'Hazard Ref. No.',
    'Hazard/Issue (Guidewords)',
    'Hazard Source / Activity',
    'Threat (Causes)',
    'Top Event',
    'Credible Consequence(s)',
    'Category',
    'Initial L',
    'Initial S',
    'Initial RR',
    'MAH',
    'Existing Controls',
    'Safeguard (Barrier) Type',
    'Current L',
    'Current S',
    'Current RR',
    'Recommendations',
    'ISD Opportunities',
    'Action Party',
    'Residual L',
    'Residual S',
    'Residual RR',
    'Target Date',
    'Remarks',
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
    hazard.source_location,
    hazard.possible_causes,
    hazard.top_event,
    hazard.consequences,
    hazard.category || '',
    hazard.initial_risk?.likelihood || '',
    hazard.initial_risk?.severity || '',
    hazard.risk_ranking_initial,
    hazard.mah,
    hazard.existing_controls,
    hazard.safeguard_barrier_type || '',
    hazard.current_risk?.likelihood || '',
    hazard.current_risk?.severity || '',
    hazard.risk_ranking_current || '',
    Array.isArray(hazard.recommendations) 
      ? hazard.recommendations.join('; ') 
      : hazard.recommendations,
    hazard.isd_opportunities || '',
    hazard.action_party || '',
    hazard.residual_risk?.likelihood || '',
    hazard.residual_risk?.severity || '',
    hazard.risk_ranking_residual || '',
    hazard.target_date || '',
    hazard.remarks || '',
  ].map(escapeCSV).join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${studyTitle.replace(/[^a-z0-9]/gi, '_')}_EGPC_AnnexC_${timestamp}.csv`;

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
