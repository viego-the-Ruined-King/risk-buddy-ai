import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Save, GitBranch, Plus, Shield, Lock, Unlock, Trash2 } from "lucide-react";
import { exportHazopToExcel } from "@/utils/exportHazopToExcel";
import type { HazopDeviation } from "@/pages/HazopStudy";
import type { HazopFormData } from "@/components/HazopForm";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BowTieDiagram from "./BowTieDiagram";
import ExportableBowTieDiagram from "./ExportableBowTieDiagram";
import { useLanguage } from "@/contexts/LanguageContext";

// Get risk level color based on EGPC level
const getRiskLevelClass = (level: string | undefined): string => {
  if (!level) return "bg-muted text-muted-foreground";
  
  switch (level?.toLowerCase()) {
    case 'high':
      return "bg-[hsl(var(--risk-critical))] text-white";
    case 'medium':
      return "bg-[hsl(var(--risk-warning))] text-white";
    case 'low':
      return "bg-[hsl(var(--risk-low))] text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

// Get risk badge color based on L×S combination
const getRiskBadgeClass = (risk: string | undefined): string => {
  if (!risk) return "bg-muted text-muted-foreground";
  
  const match = risk.match(/([1-6])([A-F])/i);
  if (!match) return "bg-muted text-muted-foreground";
  
  const likelihood = parseInt(match[1]);
  const severity = match[2].toUpperCase();
  
  // EGPC Risk Matrix - High risk combinations
  if (severity === 'A' || severity === 'B') {
    return "bg-[hsl(var(--risk-critical))] text-white";
  }
  if ((severity === 'C' || severity === 'D') && likelihood >= 3) {
    return "bg-[hsl(var(--risk-warning))] text-white";
  }
  return "bg-[hsl(var(--risk-low))] text-white";
};

interface HazopResultsProps {
  deviations: HazopDeviation[];
  onDeviationsUpdated: (deviations: HazopDeviation[]) => void;
  formData: HazopFormData;
  studyId?: string;
  onStudySaved?: (id: string) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

const HazopResults = ({ 
  deviations, 
  onDeviationsUpdated, 
  formData, 
  studyId, 
  onStudySaved,
  isLoading,
  setIsLoading 
}: HazopResultsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [currentStudyId, setCurrentStudyId] = useState<string | undefined>(studyId);
  const [isLocked, setIsLocked] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    setCurrentStudyId(studyId);
  }, [studyId]);

  const handleStartLopa = (dev: HazopDeviation) => {
    navigate('/lopa', {
      state: {
        hazop_study_id: currentStudyId,
        hazop_deviation_id: dev.deviation_id,
        hazop_node_id: dev.node_id,
        hazop_deviation: dev.deviation,
        hazop_causes: dev.causes,
        hazop_consequences: dev.consequences_unmitigated,
        hazop_existing_safeguards: dev.existing_safeguards,
        hazop_initial_risk: dev.initial_risk,
      }
    });
  };

  const handleExport = () => {
    exportHazopToExcel(deviations, formData.title || 'HAZOP_Study');
  };

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
        title: formData.title,
        study_description: formData.study_description,
        purpose: formData.purpose,
        scope_in: formData.scope_in,
        scope_out: formData.scope_out,
        facility_type: formData.facility_type,
        lifecycle_phase: formData.lifecycle_phase,
        operating_parameters: formData.operating_parameters as any,
        pnid_information: formData.pnid_information,
        pnid_equipment: formData.pnid_equipment,
        pnid_control_loops: formData.pnid_control_loops,
        nodes: formData.nodes as any,
        deviations: deviations as any,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (currentStudyId) {
        const { error } = await supabase
          .from('hazop_studies')
          .update(studyData)
          .eq('id', currentStudyId);

        if (error) throw error;
        toast({
          title: "Saved",
          description: "HAZOP study updated successfully.",
        });
      } else {
        const { data, error } = await supabase
          .from('hazop_studies')
          .insert(studyData)
          .select('id')
          .single();

        if (error) throw error;
        setCurrentStudyId(data.id);
        onStudySaved?.(data.id);
        toast({
          title: "Saved",
          description: "HAZOP study saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving study:', error);
      toast({
        title: "Error",
        description: "Failed to save study.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to generate more deviations.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingMore(true);
    if (setIsLoading) setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to generate more deviations.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hazop-study`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            title: formData.title,
            study_description: formData.study_description,
            purpose: formData.purpose,
            scope_in: formData.scope_in,
            scope_out: formData.scope_out,
            facility_type: formData.facility_type,
            lifecycle_phase: formData.lifecycle_phase,
            operating_parameters: formData.operating_parameters,
            pnid_information: formData.pnid_information,
            pnid_equipment: formData.pnid_equipment,
            pnid_control_loops: formData.pnid_control_loops,
            nodes: formData.nodes,
            existing_deviations: deviations,
            generate_additional: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data?.deviations) {
        // Append new deviations to existing ones
        const updatedDeviations = [...deviations, ...data.deviations];
        onDeviationsUpdated(updatedDeviations);
        toast({
          title: "Additional Deviations Generated",
          description: `Added ${data.deviations.length} new deviations.`,
        });
      }
    } catch (error) {
      console.error('Error generating more deviations:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate more deviations.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMore(false);
      if (setIsLoading) setIsLoading(false);
    }
  };

  // Check if any deviation is high severity (A or B)
  const isMajorAccidentHazard = (dev: HazopDeviation) => {
    const risk = dev.initial_risk?.risk || '';
    const match = risk.match(/[1-6]([A-F])/i);
    const severity = match ? match[1].toUpperCase() : null;
    return severity === 'A' || severity === 'B';
  };

  // Helper to format risk display
  const formatRisk = (risk: { likelihood?: number; severity?: string; risk?: string; level?: string } | undefined) => {
    if (!risk) return { l: '-', s: '-', r: '-' };
    return {
      l: risk.likelihood?.toString() || '-',
      s: risk.severity || '-',
      r: risk.risk || '-',
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 sm:space-y-6"
    >
      <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 p-4 sm:p-6 pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-2xl font-bold">
            {t.results.hazop.title} ({deviations.length} {t.results.hazop.deviations})
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleGenerateMore}
              disabled={isGeneratingMore || isLoading}
              variant="outline"
              size="sm"
              className="shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
            >
              {isGeneratingMore ? (
                <>
                  <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden xs:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {t.results.hazop.generateMore}
                </>
              )}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden xs:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {currentStudyId ? t.results.hazop.update : t.results.hazop.save}
                </>
              )}
            </Button>
            <Button 
              onClick={handleExport}
              size="sm"
              className="shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
            >
              <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t.results.hazop.exportExcel}</span>
              <span className="xs:hidden">{t.results.hazop.exportShort}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="w-full p-2 sm:p-6 pt-0">
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-4">
            {deviations.map((dev, index) => (
              <motion.div
                key={dev.deviation_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-primary text-sm">{dev.node_id}</span>
                    <span className="text-muted-foreground text-xs ml-2">{dev.node_description}</span>
                  </div>
                  <Badge className={getRiskLevelClass(dev.initial_risk?.level)}>
                    {dev.initial_risk?.level || 'N/A'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">{dev.deviation_id}</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">{dev.guideword}</span>
                  <span className="text-muted-foreground">{dev.parameter}</span>
                </div>
                
                <p className="text-sm font-medium">{dev.deviation}</p>
                
                <div className="text-xs space-y-1">
                  <div><span className="text-muted-foreground">Assess For:</span> {dev.assess_for}</div>
                  <div><span className="text-muted-foreground">Design Intent:</span> {dev.design_intent}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground block">{t.results.hazop.initialRisk}:</span>
                    <Badge className={`${getRiskBadgeClass(dev.initial_risk?.risk)} text-[10px] px-1.5 py-0`}>
                      {dev.initial_risk?.risk || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{t.results.hazop.currentRisk}:</span>
                    <Badge className={`${getRiskBadgeClass(dev.current_risk?.risk)} text-[10px] px-1.5 py-0`}>
                      {dev.current_risk?.risk || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{t.results.hazop.residualRisk}:</span>
                    <Badge className={`${getRiskBadgeClass(dev.residual_risk?.risk)} text-[10px] px-1.5 py-0`}>
                      {dev.residual_risk?.risk || 'N/A'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-4 text-xs pt-1 border-t border-border/50">
                  <div className="flex-1">
                    <span className="text-muted-foreground">{t.results.hazop.actionParty}:</span>
                    <span className="ml-1">{dev.action_party}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-muted-foreground">{t.results.hazop.targetDate}:</span>
                    <span className="ml-1">{dev.target_date}</span>
                  </div>
                </div>
                
                {isMajorAccidentHazard(dev) && (
                  <div className="space-y-2 mt-2">
                    <Badge variant="destructive" className="text-[10px] w-full justify-center">
                      {t.results.hazop.lopaRequired}
                    </Badge>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 text-xs">
                            <GitBranch className="h-3 w-3 mr-1" />
                             {t.results.hazop.viewBowTie}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Bow Tie Diagram - {dev.deviation_id}</DialogTitle>
                          </DialogHeader>
                          <ExportableBowTieDiagram title={dev.deviation} hazardId={dev.deviation_id}>
                            <BowTieDiagram hazard={{
                              h_no: dev.deviation_id,
                              hazard_description: dev.deviation,
                              possible_causes: dev.causes.join(', '),
                              existing_controls: dev.existing_safeguards.join(', '),
                              consequences: dev.consequences_unmitigated,
                              recommendations: dev.recommendations,
                              top_event: dev.deviation,
                            } as any} />
                          </ExportableBowTieDiagram>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => handleStartLopa(dev)}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                         {t.results.hazop.startLopa}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Desktop Table View - EGPC Annex C Format */}
          <div className="hidden lg:block overflow-x-auto max-w-full rounded-lg border border-border/50">
            <div className="max-h-[70vh] overflow-y-auto">
              <Table className="w-full text-xs">
                <TableHeader className="sticky top-0 bg-card z-10">
                  {/* Main Header Row */}
                  <TableRow className="bg-primary/5 hover:bg-primary/10 border-b border-primary/20">
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.nodeId}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.nodeDescription}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.deviationId}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.parameter}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.guideword}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.deviationCol}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.designIntent}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.possibleCauses}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.assessFor}</TableHead>
                    <TableHead colSpan={3} className="font-bold text-foreground text-center border-r border-primary/10 bg-red-500/10">{t.results.hazop.initialRisk}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10 bg-red-500/10">{t.results.hazop.initialRisk}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.existingSafeguards}</TableHead>
                    <TableHead colSpan={3} className="font-bold text-foreground text-center border-r border-primary/10 bg-orange-500/10">{t.results.hazop.currentRisk}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10 bg-orange-500/10">{t.results.hazop.currentRisk}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.recommendations}</TableHead>
                    <TableHead colSpan={3} className="font-bold text-foreground text-center border-r border-primary/10 bg-green-500/10">{t.results.hazop.residualRisk}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10 bg-green-500/10">{t.results.hazop.residualRisk}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.actionParty}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap border-r border-primary/10">{t.results.hazop.remarks}</TableHead>
                    <TableHead rowSpan={2} className="font-bold text-foreground whitespace-nowrap">{t.results.hazop.targetDate}</TableHead>
                  </TableRow>
                  {/* Sub-header Row for Risk columns */}
                  <TableRow className="bg-primary/5 hover:bg-primary/10 border-b border-primary/20">
                    <TableHead className="font-bold text-foreground text-center border-r border-primary/10 bg-red-500/10 w-8">{t.results.hazop.l}</TableHead>
                    <TableHead className="font-bold text-foreground text-center border-r border-primary/10 bg-red-500/10 w-8">{t.results.hazop.s}</TableHead>
                    <TableHead className="font-bold text-foreground text-center border-r border-primary/10 bg-red-500/10 w-12">{t.results.hazop.l}×{t.results.hazop.s}</TableHead>
                    <TableHead className="font-bold text-foreground text-center border-r border-primary/10 bg-orange-500/10 w-8">{t.results.hazop.l}</TableHead>
                    <TableHead className="font-bold text-foreground text-center border-r border-primary/10 bg-orange-500/10 w-8">{t.results.hazop.s}</TableHead>
                    <TableHead className="font-bold text-foreground text-center border-r border-primary/10 bg-orange-500/10 w-12">{t.results.hazop.l}×{t.results.hazop.s}</TableHead>
                    <TableHead className="font-bold text-foreground text-center border-r border-primary/10 bg-green-500/10 w-8">{t.results.hazop.l}</TableHead>
                    <TableHead className="font-bold text-foreground text-center border-r border-primary/10 bg-green-500/10 w-8">{t.results.hazop.s}</TableHead>
                    <TableHead className="font-bold text-foreground text-center border-r border-primary/10 bg-green-500/10 w-12">{t.results.hazop.l}×{t.results.hazop.s}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deviations.map((dev, index) => {
                    const initialRisk = formatRisk(dev.initial_risk);
                    const currentRisk = formatRisk(dev.current_risk);
                    const residualRisk = formatRisk(dev.residual_risk);
                    
                    return (
                      <motion.tr
                        key={dev.deviation_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className="border-b border-border/50 hover:bg-primary/5 transition-colors duration-200"
                      >
                        <TableCell className="font-semibold text-primary border-r border-border/30">{dev.node_id}</TableCell>
                        <TableCell className="max-w-[120px] border-r border-border/30">{dev.node_description}</TableCell>
                        <TableCell className="font-semibold border-r border-border/30">{dev.deviation_id}</TableCell>
                        <TableCell className="border-r border-border/30">{dev.parameter}</TableCell>
                        <TableCell className="border-r border-border/30">
                          <Badge variant="outline" className="bg-primary/10 text-[10px]">{dev.guideword}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[120px] border-r border-border/30">{dev.deviation}</TableCell>
                        <TableCell className="max-w-[150px] border-r border-border/30">{dev.design_intent}</TableCell>
                        <TableCell className="min-w-[200px] border-r border-border/30 align-top">
                          <ul className="list-disc list-inside space-y-1">
                            {dev.causes.map((cause, i) => (
                              <li key={i} className="text-[10px] whitespace-normal break-words">{cause}</li>
                            ))}
                          </ul>
                        </TableCell>
                        <TableCell className="border-r border-border/30 text-[10px]">{dev.assess_for}</TableCell>
                        
                        {/* Initial Risk */}
                        <TableCell className="text-center border-r border-border/30 bg-red-500/5">{initialRisk.l}</TableCell>
                        <TableCell className="text-center border-r border-border/30 bg-red-500/5">{initialRisk.s}</TableCell>
                        <TableCell className="text-center border-r border-border/30 bg-red-500/5">
                          <Badge className={`${getRiskBadgeClass(dev.initial_risk?.risk)} text-[10px] px-1`}>
                            {initialRisk.r}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r border-border/30 bg-red-500/5">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge className={`${getRiskLevelClass(dev.initial_risk?.level)} text-[10px] px-1`}>
                              {dev.initial_risk?.level || '-'}
                            </Badge>
                            {isMajorAccidentHazard(dev) && (
                              <>
                                <Badge variant="destructive" className="text-[10px] px-1">LOPA</Badge>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-5 px-1" title="View Bow Tie Diagram">
                                      <GitBranch className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                    <DialogHeader>
                                      <DialogTitle>Bow Tie Diagram - {dev.deviation_id}</DialogTitle>
                                    </DialogHeader>
                                    <ExportableBowTieDiagram title={dev.deviation} hazardId={dev.deviation_id}>
                                      <BowTieDiagram hazard={{
                                        h_no: dev.deviation_id,
                                        hazard_description: dev.deviation,
                                        possible_causes: dev.causes.join(', '),
                                        existing_controls: dev.existing_safeguards.join(', '),
                                        consequences: dev.consequences_unmitigated,
                                        recommendations: dev.recommendations,
                                        top_event: dev.deviation,
                                      } as any} />
                                    </ExportableBowTieDiagram>
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 px-1" 
                                  title="Start LOPA Analysis"
                                  onClick={() => handleStartLopa(dev)}
                                >
                                  <Shield className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="min-w-[220px] border-r border-border/30 align-top">
                          <ul className="list-disc list-inside space-y-1">
                            {dev.existing_safeguards.map((sg, i) => (
                              <li key={i} className="text-[10px] whitespace-normal break-words">{sg}</li>
                            ))}
                          </ul>
                        </TableCell>
                        
                        {/* Current Risk */}
                        <TableCell className="text-center border-r border-border/30 bg-orange-500/5">{currentRisk.l}</TableCell>
                        <TableCell className="text-center border-r border-border/30 bg-orange-500/5">{currentRisk.s}</TableCell>
                        <TableCell className="text-center border-r border-border/30 bg-orange-500/5">
                          <Badge className={`${getRiskBadgeClass(dev.current_risk?.risk)} text-[10px] px-1`}>
                            {currentRisk.r}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r border-border/30 bg-orange-500/5">
                          <Badge className={`${getRiskLevelClass(dev.current_risk?.level)} text-[10px] px-1`}>
                            {dev.current_risk?.level || '-'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="min-w-[220px] border-r border-border/30 align-top">
                          <ul className="list-disc list-inside space-y-1">
                            {dev.recommendations.map((rec, i) => (
                              <li key={i} className="text-[10px] whitespace-normal break-words">{rec}</li>
                            ))}
                          </ul>
                        </TableCell>
                        
                        {/* Residual Risk */}
                        <TableCell className="text-center border-r border-border/30 bg-green-500/5">{residualRisk.l}</TableCell>
                        <TableCell className="text-center border-r border-border/30 bg-green-500/5">{residualRisk.s}</TableCell>
                        <TableCell className="text-center border-r border-border/30 bg-green-500/5">
                          <Badge className={`${getRiskBadgeClass(dev.residual_risk?.risk)} text-[10px] px-1`}>
                            {residualRisk.r}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r border-border/30 bg-green-500/5">
                          <Badge className={`${getRiskLevelClass(dev.residual_risk?.level)} text-[10px] px-1`}>
                            {dev.residual_risk?.level || '-'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="border-r border-border/30">{dev.action_party}</TableCell>
                        <TableCell className="max-w-[100px] border-r border-border/30 text-[10px]">{dev.remarks || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{dev.target_date}</TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HazopResults;
