import ExcelJS from 'exceljs';
import type { HazopDeviation } from '@/pages/HazopStudy';

export const exportHazopToExcel = async (deviations: HazopDeviation[], studyTitle: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('HAZOP Worksheet');

  // Define columns
  worksheet.columns = [
    { header: 'Node ID', key: 'node_id', width: 10 },
    { header: 'Node Description', key: 'node_description', width: 20 },
    { header: 'Deviation ID', key: 'deviation_id', width: 10 },
    { header: 'Parameter', key: 'parameter', width: 12 },
    { header: 'Guideword', key: 'guideword', width: 10 },
    { header: 'Deviation', key: 'deviation', width: 18 },
    { header: 'Design Intent', key: 'design_intent', width: 25 },
    { header: 'Possible Causes', key: 'causes', width: 40 },
    { header: 'Assess For', key: 'assess_for', width: 18 },
    { header: 'Initial L', key: 'initial_l', width: 8 },
    { header: 'Initial S', key: 'initial_s', width: 8 },
    { header: 'Initial L×S', key: 'initial_risk', width: 10 },
    { header: 'Initial Level', key: 'initial_level', width: 12 },
    { header: 'Existing Safeguards', key: 'existing_safeguards', width: 40 },
    { header: 'Current L', key: 'current_l', width: 8 },
    { header: 'Current S', key: 'current_s', width: 8 },
    { header: 'Current L×S', key: 'current_risk', width: 10 },
    { header: 'Current Level', key: 'current_level', width: 12 },
    { header: 'Recommendations', key: 'recommendations', width: 45 },
    { header: 'Residual L', key: 'residual_l', width: 8 },
    { header: 'Residual S', key: 'residual_s', width: 8 },
    { header: 'Residual L×S', key: 'residual_risk', width: 10 },
    { header: 'Residual Level', key: 'residual_level', width: 12 },
    { header: 'Action Party', key: 'action_party', width: 20 },
    { header: 'Remarks', key: 'remarks', width: 25 },
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
  deviations.forEach((dev) => {
    worksheet.addRow({
      node_id: dev.node_id,
      node_description: dev.node_description,
      deviation_id: dev.deviation_id,
      parameter: dev.parameter,
      guideword: dev.guideword,
      deviation: dev.deviation,
      design_intent: dev.design_intent,
      causes: Array.isArray(dev.causes) ? dev.causes.join('\n') : dev.causes,
      assess_for: dev.assess_for || '',
      initial_l: dev.initial_risk?.likelihood || '',
      initial_s: dev.initial_risk?.severity || '',
      initial_risk: dev.initial_risk?.risk || '',
      initial_level: dev.initial_risk?.level || '',
      existing_safeguards: Array.isArray(dev.existing_safeguards) ? dev.existing_safeguards.join('\n') : dev.existing_safeguards,
      current_l: dev.current_risk?.likelihood || '',
      current_s: dev.current_risk?.severity || '',
      current_risk: dev.current_risk?.risk || '',
      current_level: dev.current_risk?.level || '',
      recommendations: Array.isArray(dev.recommendations) ? dev.recommendations.join('\n') : dev.recommendations,
      residual_l: dev.residual_risk?.likelihood || '',
      residual_s: dev.residual_risk?.severity || '',
      residual_risk: dev.residual_risk?.risk || '',
      residual_level: dev.residual_risk?.level || '',
      action_party: dev.action_party,
      remarks: dev.remarks || dev.comments || '',
      target_date: dev.target_date,
    });
  });

  // Create summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  
  const highCount = deviations.filter(d => d.initial_risk?.level === 'High' || d.priority === 'High').length;
  const mediumCount = deviations.filter(d => d.initial_risk?.level === 'Medium' || d.priority === 'Medium').length;
  const lowCount = deviations.filter(d => d.initial_risk?.level === 'Low' || d.priority === 'Low').length;

  // Deviations by node
  const nodeStats = deviations.reduce((acc, dev) => {
    acc[dev.node_id] = (acc[dev.node_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Assessment categories
  const categoryStats = deviations.reduce((acc, dev) => {
    const categories = (dev.assess_for || '').split(',').map(c => c.trim());
    categories.forEach(cat => {
      if (cat) acc[cat] = (acc[cat] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  summarySheet.columns = [
    { header: '', key: 'label', width: 25 },
    { header: '', key: 'value', width: 30 },
  ];

  summarySheet.addRow({ label: 'HAZOP Study Summary', value: '' });
  summarySheet.addRow({ label: '', value: '' });
  summarySheet.addRow({ label: 'Study Title', value: studyTitle });
  summarySheet.addRow({ label: 'Total Deviations', value: deviations.length });
  summarySheet.addRow({ label: '', value: '' });
  summarySheet.addRow({ label: 'Initial Risk Summary', value: '' });
  summarySheet.addRow({ label: 'High Risk', value: highCount });
  summarySheet.addRow({ label: 'Medium Risk', value: mediumCount });
  summarySheet.addRow({ label: 'Low Risk', value: lowCount });
  summarySheet.addRow({ label: '', value: '' });
  summarySheet.addRow({ label: 'Deviations by Node', value: '' });
  
  Object.entries(nodeStats).forEach(([nodeId, count]) => {
    summarySheet.addRow({ label: nodeId, value: count });
  });

  summarySheet.addRow({ label: '', value: '' });
  summarySheet.addRow({ label: 'Assessment Categories', value: '' });
  
  Object.entries(categoryStats).forEach(([category, count]) => {
    summarySheet.addRow({ label: category, value: count });
  });

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `${studyTitle.replace(/[^a-z0-9]/gi, '_')}_HAZOP_${date}.xlsx`;

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
