import * as XLSX from 'xlsx';
import type { HazopDeviation } from '@/pages/HazopStudy';

export const exportHazopToExcel = (deviations: HazopDeviation[], studyTitle: string) => {
  // Create worksheet data with EGPC Annex C format
  const worksheetData = [
    [
      'Node ID',
      'Node Description',
      'Deviation ID',
      'Parameter',
      'Guideword',
      'Deviation',
      'Design Intent',
      'Causes',
      'Consequences (Unmitigated)',
      'Existing Safeguards',
      'Initial Risk - Likelihood',
      'Initial Risk - Severity',
      'Initial Risk - Ranking',
      'Recommendations',
      'Residual Risk - Likelihood',
      'Residual Risk - Severity',
      'Residual Risk - Ranking',
      'Action Party',
      'Priority',
      'Target Date',
      'Comments',
    ],
    ...deviations.map((dev) => [
      dev.node_id,
      dev.node_description,
      dev.deviation_id,
      dev.parameter,
      dev.guideword,
      dev.deviation,
      dev.design_intent,
      Array.isArray(dev.causes) ? dev.causes.join('\n') : dev.causes,
      dev.consequences_unmitigated,
      Array.isArray(dev.existing_safeguards) ? dev.existing_safeguards.join('\n') : dev.existing_safeguards,
      dev.initial_risk?.likelihood || '',
      dev.initial_risk?.severity || '',
      dev.initial_risk?.ranking || '',
      Array.isArray(dev.recommendations) ? dev.recommendations.join('\n') : dev.recommendations,
      dev.residual_risk?.likelihood || '',
      dev.residual_risk?.severity || '',
      dev.residual_risk?.ranking || '',
      dev.action_party,
      dev.priority,
      dev.target_date,
      dev.comments || '',
    ]),
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 10 },  // Node ID
    { wch: 25 },  // Node Description
    { wch: 12 },  // Deviation ID
    { wch: 15 },  // Parameter
    { wch: 12 },  // Guideword
    { wch: 20 },  // Deviation
    { wch: 30 },  // Design Intent
    { wch: 35 },  // Causes
    { wch: 35 },  // Consequences
    { wch: 35 },  // Existing Safeguards
    { wch: 12 },  // Initial Likelihood
    { wch: 12 },  // Initial Severity
    { wch: 20 },  // Initial Ranking
    { wch: 40 },  // Recommendations
    { wch: 12 },  // Residual Likelihood
    { wch: 12 },  // Residual Severity
    { wch: 20 },  // Residual Ranking
    { wch: 15 },  // Action Party
    { wch: 10 },  // Priority
    { wch: 15 },  // Target Date
    { wch: 25 },  // Comments
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'HAZOP Worksheet');

  // Create summary sheet
  const summaryData = [
    ['HAZOP Study Summary'],
    [''],
    ['Study Title', studyTitle],
    ['Total Deviations', deviations.length],
    [''],
    ['Risk Summary'],
    ['High Priority', deviations.filter(d => d.priority === 'High').length],
    ['Medium Priority', deviations.filter(d => d.priority === 'Medium').length],
    ['Low Priority', deviations.filter(d => d.priority === 'Low').length],
    [''],
    ['Deviations by Node'],
    ...Object.entries(
      deviations.reduce((acc, dev) => {
        acc[dev.node_id] = (acc[dev.node_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([nodeId, count]) => [nodeId, count]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `${studyTitle.replace(/[^a-z0-9]/gi, '_')}_HAZOP_${date}.xlsx`;

  // Download the file
  XLSX.writeFile(workbook, filename);
};
