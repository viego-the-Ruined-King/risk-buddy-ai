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

// Simple CSV export that avoids complex Excel library dependencies
export const exportToExcel = (hazards: any[], activityTitle: string = 'Risk Assessment') => {
  // Build CSV content
  const headers = [
    '#',
    'Hazard Description',
    'Who Might Be Harmed',
    'Consequences',
    'Likelihood',
    'L Score',
    'Severity',
    'S Score',
    'Risk Level',
    'L×S',
    'Existing Controls',
    'Proposed Controls',
    'Residual Likelihood',
    'R-L Score',
    'Residual Severity',
    'R-S Score',
    'Residual Risk Level',
    'R-L×S',
  ];

  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = hazards.map((hazard, index) => [
    index + 1,
    hazard.description,
    hazard.who_might_be_harmed,
    hazard.consequences,
    hazard.likelihood,
    hazard.likelihood_score,
    hazard.severity,
    hazard.severity_score,
    hazard.risk_level,
    hazard.numerical_risk_level,
    hazard.existing_controls,
    hazard.proposed_controls,
    hazard.residual_likelihood,
    hazard.residual_likelihood_score,
    hazard.residual_severity,
    hazard.residual_severity_score,
    hazard.residual_risk_level,
    hazard.residual_numerical_risk_level,
  ].map(escapeCSV).join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${activityTitle.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.csv`;

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
