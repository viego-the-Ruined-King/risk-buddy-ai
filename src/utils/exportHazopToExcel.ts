import * as XLSX from 'xlsx';
import type { HazopDeviation } from '@/pages/HazopStudy';

export const exportHazopToExcel = (deviations: HazopDeviation[], studyTitle: string) => {
  // Create worksheet data with EGPC Annex C format
  const worksheetData = [
    // Header Row 1 - Main headers
    [
      'Node ID',
      'Node Description',
      'Deviation ID',
      'Parameter',
      'Guideword',
      'Deviation',
      'Design Intent',
      'Possible Causes',
      'Assess For',
      'Initial Risk', '', '', '',
      'Existing Safeguards',
      'Current Risk', '', '', '',
      'Recommendations',
      'Residual Risk', '', '', '',
      'Action Party',
      'Remarks',
      'Target Date',
    ],
    // Header Row 2 - Sub-headers for risk columns
    [
      '', '', '', '', '', '', '', '', '',
      'L', 'S', 'L×S', 'Level',
      '',
      'L', 'S', 'L×S', 'Level',
      '',
      'L', 'S', 'L×S', 'Level',
      '', '', '',
    ],
    // Data rows
    ...deviations.map((dev) => [
      dev.node_id,
      dev.node_description,
      dev.deviation_id,
      dev.parameter,
      dev.guideword,
      dev.deviation,
      dev.design_intent,
      Array.isArray(dev.causes) ? dev.causes.join('\n') : dev.causes,
      dev.assess_for || '',
      // Initial Risk
      dev.initial_risk?.likelihood || '',
      dev.initial_risk?.severity || '',
      dev.initial_risk?.risk || '',
      dev.initial_risk?.level || '',
      // Existing Safeguards
      Array.isArray(dev.existing_safeguards) ? dev.existing_safeguards.join('\n') : dev.existing_safeguards,
      // Current Risk
      dev.current_risk?.likelihood || '',
      dev.current_risk?.severity || '',
      dev.current_risk?.risk || '',
      dev.current_risk?.level || '',
      // Recommendations
      Array.isArray(dev.recommendations) ? dev.recommendations.join('\n') : dev.recommendations,
      // Residual Risk
      dev.residual_risk?.likelihood || '',
      dev.residual_risk?.severity || '',
      dev.residual_risk?.risk || '',
      dev.residual_risk?.level || '',
      // Other fields
      dev.action_party,
      dev.remarks || dev.comments || '',
      dev.target_date,
    ]),
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Merge cells for main headers that span multiple columns
  worksheet['!merges'] = [
    // Initial Risk header spans 4 columns (L, S, L×S, Level)
    { s: { r: 0, c: 9 }, e: { r: 0, c: 12 } },
    // Current Risk header spans 4 columns
    { s: { r: 0, c: 14 }, e: { r: 0, c: 17 } },
    // Residual Risk header spans 4 columns
    { s: { r: 0, c: 19 }, e: { r: 0, c: 22 } },
    // Merge non-risk column headers vertically (row 1-2)
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },   // Node ID
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },   // Node Description
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },   // Deviation ID
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },   // Parameter
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },   // Guideword
    { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },   // Deviation
    { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } },   // Design Intent
    { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } },   // Possible Causes
    { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } },   // Assess For
    { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } }, // Existing Safeguards
    { s: { r: 0, c: 18 }, e: { r: 1, c: 18 } }, // Recommendations
    { s: { r: 0, c: 23 }, e: { r: 1, c: 23 } }, // Action Party
    { s: { r: 0, c: 24 }, e: { r: 1, c: 24 } }, // Remarks
    { s: { r: 0, c: 25 }, e: { r: 1, c: 25 } }, // Target Date
  ];

  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 10 },  // Node ID
    { wch: 20 },  // Node Description
    { wch: 10 },  // Deviation ID
    { wch: 12 },  // Parameter
    { wch: 10 },  // Guideword
    { wch: 18 },  // Deviation
    { wch: 25 },  // Design Intent
    { wch: 40 },  // Possible Causes
    { wch: 18 },  // Assess For
    { wch: 5 },   // Initial L
    { wch: 5 },   // Initial S
    { wch: 8 },   // Initial L×S
    { wch: 10 },  // Initial Level
    { wch: 40 },  // Existing Safeguards
    { wch: 5 },   // Current L
    { wch: 5 },   // Current S
    { wch: 8 },   // Current L×S
    { wch: 10 },  // Current Level
    { wch: 45 },  // Recommendations
    { wch: 5 },   // Residual L
    { wch: 5 },   // Residual S
    { wch: 8 },   // Residual L×S
    { wch: 10 },  // Residual Level
    { wch: 20 },  // Action Party
    { wch: 25 },  // Remarks
    { wch: 15 },  // Target Date
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'HAZOP Worksheet');

  // Create summary sheet
  const highCount = deviations.filter(d => d.initial_risk?.level === 'High' || d.priority === 'High').length;
  const mediumCount = deviations.filter(d => d.initial_risk?.level === 'Medium' || d.priority === 'Medium').length;
  const lowCount = deviations.filter(d => d.initial_risk?.level === 'Low' || d.priority === 'Low').length;

  const summaryData = [
    ['HAZOP Study Summary'],
    [''],
    ['Study Title', studyTitle],
    ['Total Deviations', deviations.length],
    [''],
    ['Initial Risk Summary'],
    ['High Risk', highCount],
    ['Medium Risk', mediumCount],
    ['Low Risk', lowCount],
    [''],
    ['Deviations by Node'],
    ...Object.entries(
      deviations.reduce((acc, dev) => {
        acc[dev.node_id] = (acc[dev.node_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([nodeId, count]) => [nodeId, count]),
    [''],
    ['Assessment Categories'],
    ...Object.entries(
      deviations.reduce((acc, dev) => {
        const categories = (dev.assess_for || '').split(',').map(c => c.trim());
        categories.forEach(cat => {
          if (cat) acc[cat] = (acc[cat] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, count]) => [category, count]),
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
