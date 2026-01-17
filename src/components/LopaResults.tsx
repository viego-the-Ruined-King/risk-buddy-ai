import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Save, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import LopaWorksheet from "./LopaWorksheet";
import type { LopaScenario, LopaFormData } from "@/pages/LopaStudy";

interface LopaResultsProps {
  lopaData: LopaScenario;
  formData: LopaFormData;
  studyId?: string;
  onStudySaved?: (id: string) => void;
  isLoading?: boolean;
}

const LopaResults = ({ lopaData, formData, studyId, onStudySaved, isLoading }: LopaResultsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [currentStudyId, setCurrentStudyId] = useState<string | undefined>(studyId);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to save your study.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const studyData = {
        scenario_number: lopaData.scenario_number,
        equipment_number: lopaData.equipment_number,
        scenario_title: lopaData.scenario_title,
        consequence_description: lopaData.consequence_description,
        consequence_category: lopaData.consequence_category,
        severity_level: lopaData.severity_level,
        tmel: lopaData.tmel,
        tmel_basis: lopaData.tmel_basis,
        hazop_study_id: formData.hazop_study_id,
        hazop_deviation_id: formData.hazop_deviation_id,
        hazop_node_id: formData.hazop_node_id,
        hazop_deviation: formData.hazop_deviation,
        hazop_causes: formData.hazop_causes as any,
        hazop_consequences: formData.hazop_consequences,
        hazop_existing_safeguards: formData.hazop_existing_safeguards as any,
        hazop_initial_risk: formData.hazop_initial_risk as any,
        initiating_events: lopaData.initiating_events as any,
        ipls: lopaData.ipls as any,
        enabling_conditions: lopaData.enabling_conditions as any,
        conditional_modifiers: lopaData.conditional_modifiers as any,
        iel_per_initiating_event: lopaData.iel_per_initiating_event as any,
        total_iel: lopaData.total_iel,
        frequency_mitigated_consequences: lopaData.frequency_mitigated_consequences,
        total_mitigated_event_frequency: lopaData.total_mitigated_event_frequency,
        pfd_target: lopaData.pfd_target,
        pfd_target_safety: lopaData.pfd_target_safety,
        pfd_target_environment: lopaData.pfd_target_environment,
        pfd_target_financial: lopaData.pfd_target_financial,
        sil_required: lopaData.sil_required,
        sil_safety: lopaData.sil_safety,
        sil_environment: lopaData.sil_environment,
        sil_financial: lopaData.sil_financial,
        recommendations: lopaData.recommendations,
        notes_assumptions: lopaData.notes_assumptions,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (currentStudyId) {
        const { error } = await supabase
          .from('lopa_studies')
          .update(studyData)
          .eq('id', currentStudyId);

        if (error) throw error;
        toast({
          title: "Saved",
          description: "LOPA study updated successfully.",
        });
      } else {
        const { data, error } = await supabase
          .from('lopa_studies')
          .insert(studyData)
          .select('id')
          .single();

        if (error) throw error;
        setCurrentStudyId(data.id);
        onStudySaved?.(data.id);
        toast({
          title: "Saved",
          description: "LOPA study saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving LOPA study:', error);
      toast({
        title: "Error",
        description: "Failed to save LOPA study.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV content
    const lines = [
      'LOPA WORKSHEET - EGPC-PSM-GL-015',
      '',
      `Scenario Number,${escapeCSV(lopaData.scenario_number)}`,
      `Equipment Number,${escapeCSV(lopaData.equipment_number)}`,
      `Scenario Title,${escapeCSV(lopaData.scenario_title)}`,
      `Consequence Description,${escapeCSV(lopaData.consequence_description)}`,
      `Consequence Category,${escapeCSV(lopaData.consequence_category)}`,
      `Severity Level,${escapeCSV(lopaData.severity_level)}`,
      '',
      `Target Mitigated Event Likelihood (TMEL),${escapeCSV(lopaData.tmel?.toExponential(2))}`,
      `TMEL Basis,${escapeCSV(lopaData.tmel_basis)}`,
      '',
      'INITIATING EVENTS',
      'Event,Frequency (per year),Source',
      ...lopaData.initiating_events.map(ie => 
        [escapeCSV(ie.name), escapeCSV(ie.frequency), escapeCSV(ie.source)].join(',')
      ),
      '',
      'INDEPENDENT PROTECTION LAYERS (IPLs)',
      'Type,Name,PFD,Source',
      ...lopaData.ipls.map(ipl => 
        [escapeCSV(ipl.type), escapeCSV(ipl.name), escapeCSV(ipl.pfd), escapeCSV(ipl.source)].join(',')
      ),
      '',
      'CONDITIONAL MODIFIERS',
      `Time at Risk,${escapeCSV(lopaData.conditional_modifiers?.time_at_risk)}`,
      `Ignition Probability,${escapeCSV(lopaData.conditional_modifiers?.ignition_probability)}`,
      `Vulnerability,${escapeCSV(lopaData.conditional_modifiers?.vulnerability)}`,
      '',
      'IEL CALCULATION',
      'Initiating Event,IEF,IPLs Product,PEC,PCM,IEL',
      ...lopaData.iel_per_initiating_event.map(calc =>
        [
          escapeCSV(calc.initiating_event),
          escapeCSV(calc.ief),
          escapeCSV(calc.ipls_product),
          escapeCSV(calc.pec),
          escapeCSV(calc.pcm),
          escapeCSV(calc.iel.toExponential(2)),
        ].join(',')
      ),
      '',
      `Total IEL,${escapeCSV(lopaData.total_iel?.toExponential(2))}`,
      `IEL vs TMEL,${escapeCSV(lopaData.iel_vs_tmel)}`,
      '',
      'SIF REQUIREMENTS',
      `PFD Target (Safety),${escapeCSV(lopaData.pfd_target_safety?.toExponential(2) || 'N/A')}`,
      `PFD Target (Environment),${escapeCSV(lopaData.pfd_target_environment?.toExponential(2) || 'N/A')}`,
      `PFD Target (Financial),${escapeCSV(lopaData.pfd_target_financial?.toExponential(2) || 'N/A')}`,
      `SIL Required,${escapeCSV(lopaData.sil_required || 'None')}`,
      '',
      'RECOMMENDATIONS',
      escapeCSV(lopaData.recommendations),
      '',
      'NOTES AND ASSUMPTIONS',
      escapeCSV(lopaData.notes_assumptions),
    ];

    const csvContent = lines.join('\n');
    const filename = `LOPA_${lopaData.scenario_number || 'Study'}.csv`;

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

    toast({
      title: "Exported",
      description: "LOPA worksheet exported to CSV.",
    });
  };

  const isAcceptable = lopaData.iel_vs_tmel === 'ACCEPTABLE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary Card */}
      <Card className={`border-2 ${isAcceptable ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAcceptable ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-500" />
              )}
              LOPA Result: {lopaData.scenario_title}
            </div>
            <Badge variant={isAcceptable ? 'default' : 'destructive'} className="text-sm px-3 py-1">
              {isAcceptable ? 'ACCEPTABLE' : 'REQUIRES ADDITIONAL PROTECTION'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Total IEL</p>
              <p className="text-lg font-bold">{lopaData.total_iel?.toExponential(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">TMEL</p>
              <p className="text-lg font-bold">{lopaData.tmel?.toExponential(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Required SIL</p>
              <p className="text-lg font-bold">{lopaData.sil_required || 'None'}</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">PFD Target</p>
              <p className="text-lg font-bold">{lopaData.pfd_target?.toExponential(2) || 'N/A'}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="outline"
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {currentStudyId ? 'Update' : 'Save'}
                </>
              )}
            </Button>
            <Button onClick={handleExport} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed LOPA Worksheet */}
      <LopaWorksheet lopaData={lopaData} />
    </motion.div>
  );
};

export default LopaResults;
