import type { HazopDeviation } from '@/pages/HazopStudy';

// Simple CSV export that avoids complex Excel library dependencies
export const exportHazopToExcel = (deviations: HazopDeviation[], studyTitle: string) => {
  const headers = [
    'Node ID',
    'Node Description',
    'Deviation ID',
    'Parameter',
    'Guideword',
    'Deviation',
    'Design Intent',
    'Possible Causes',
    'Assess For',
    'Initial L',
    'Initial S',
    'Initial L×S',
    'Initial Level',
    'Existing Safeguards',
    'Current L',
    'Current S',
    'Current L×S',
    'Current Level',
    'Recommendations',
    'Residual L',
    'Residual S',
    'Residual L×S',
    'Residual Level',
    'Action Party',
    'Remarks',
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

  const rows = deviations.map((dev) => [
    dev.node_id,
    dev.node_description,
    dev.deviation_id,
    dev.parameter,
    dev.guideword,
    dev.deviation,
    dev.design_intent,
    Array.isArray(dev.causes) ? dev.causes.join('; ') : dev.causes,
    dev.assess_for || '',
    dev.initial_risk?.likelihood || '',
    dev.initial_risk?.severity || '',
    dev.initial_risk?.risk || '',
    dev.initial_risk?.level || '',
    Array.isArray(dev.existing_safeguards) ? dev.existing_safeguards.join('; ') : dev.existing_safeguards,
    dev.current_risk?.likelihood || '',
    dev.current_risk?.severity || '',
    dev.current_risk?.risk || '',
    dev.current_risk?.level || '',
    Array.isArray(dev.recommendations) ? dev.recommendations.join('; ') : dev.recommendations,
    dev.residual_risk?.likelihood || '',
    dev.residual_risk?.severity || '',
    dev.residual_risk?.risk || '',
    dev.residual_risk?.level || '',
    dev.action_party,
    dev.remarks || dev.comments || '',
    dev.target_date,
  ].map(escapeCSV).join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `${studyTitle.replace(/[^a-z0-9]/gi, '_')}_HAZOP_${date}.csv`;

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
