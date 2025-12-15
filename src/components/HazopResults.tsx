import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Save, GitBranch } from "lucide-react";
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

// Get risk severity color based on EGPC code
const getRiskBadgeClass = (riskRanking: string | undefined): string => {
  if (!riskRanking) return "bg-muted text-muted-foreground";
  
  const match = riskRanking.match(/[1-6]?([A-F])/i);
  const severity = match ? match[1].toUpperCase() : null;
  
  switch (severity) {
    case 'A':
    case 'B':
      return "bg-[hsl(var(--risk-critical))] text-white";
    case 'C':
    case 'D':
      return "bg-[hsl(var(--risk-warning))] text-white";
    case 'E':
    case 'F':
      return "bg-[hsl(var(--risk-low))] text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getPriorityBadgeClass = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return "bg-destructive text-destructive-foreground";
    case 'medium':
      return "bg-[hsl(var(--risk-warning))] text-white";
    case 'low':
      return "bg-[hsl(var(--risk-low))] text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

interface HazopResultsProps {
  deviations: HazopDeviation[];
  onDeviationsUpdated: (deviations: HazopDeviation[]) => void;
  formData: HazopFormData;
  studyId?: string;
  onStudySaved?: (id: string) => void;
}

const HazopResults = ({ deviations, onDeviationsUpdated, formData, studyId, onStudySaved }: HazopResultsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [currentStudyId, setCurrentStudyId] = useState<string | undefined>(studyId);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setCurrentStudyId(studyId);
  }, [studyId]);

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

  // Group deviations by node
  const groupedDeviations = deviations.reduce((acc, dev) => {
    const nodeId = dev.node_id || 'Unknown';
    if (!acc[nodeId]) {
      acc[nodeId] = {
        description: dev.node_description || nodeId,
        deviations: [],
      };
    }
    acc[nodeId].deviations.push(dev);
    return acc;
  }, {} as Record<string, { description: string; deviations: HazopDeviation[] }>);

  // Check if any deviation is high severity (A or B)
  const isMajorAccidentHazard = (dev: HazopDeviation) => {
    const ranking = dev.initial_risk?.ranking || '';
    const match = ranking.match(/[1-6]?([A-F])/i);
    const severity = match ? match[1].toUpperCase() : null;
    return severity === 'A' || severity === 'B';
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
            HAZOP Worksheet ({deviations.length} deviations)
          </CardTitle>
          <div className="flex flex-wrap gap-2">
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
                  {currentStudyId ? 'Update' : 'Save'}
                </>
              )}
            </Button>
            <Button 
              onClick={handleExport}
              size="sm"
              className="shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
            >
              <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Export to Excel</span>
              <span className="xs:hidden">Export</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="w-full p-2 sm:p-6 pt-0">
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {Object.entries(groupedDeviations).map(([nodeId, nodeData]) => (
              <div key={nodeId} className="space-y-2">
                <h3 className="font-semibold text-primary text-sm px-2">
                  {nodeId}: {nodeData.description}
                </h3>
                {nodeData.deviations.map((dev, index) => (
                  <motion.div
                    key={dev.deviation_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary text-sm">{dev.deviation_id}</span>
                      <Badge className={getPriorityBadgeClass(dev.priority)}>
                        {dev.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">{dev.guideword}</span>
                      <span className="text-muted-foreground">{dev.parameter}</span>
                    </div>
                    <p className="text-sm font-medium">{dev.deviation}</p>
                    <p className="text-xs text-muted-foreground">{dev.design_intent}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                      <div>
                        <span className="text-muted-foreground block">Initial Risk:</span>
                        <Badge className={`${getRiskBadgeClass(dev.initial_risk?.ranking)} text-[10px] px-1.5 py-0`}>
                          {dev.initial_risk?.ranking}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Residual Risk:</span>
                        <Badge className={`${getRiskBadgeClass(dev.residual_risk?.ranking)} text-[10px] px-1.5 py-0`}>
                          {dev.residual_risk?.ranking}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs pt-1 border-t border-border/50">
                      <div className="flex-1">
                        <span className="text-muted-foreground">Action:</span>
                        <span className="ml-1">{dev.action_party}</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-muted-foreground">Target:</span>
                        <span className="ml-1">{dev.target_date}</span>
                      </div>
                    </div>
                    {isMajorAccidentHazard(dev) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                            <GitBranch className="h-3 w-3 mr-1" />
                            View Bow Tie Diagram
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
                    )}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto max-w-full rounded-lg border border-border/50">
            <div className="max-h-[70vh] overflow-y-auto">
              <Table className="w-full">
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="bg-primary/5 hover:bg-primary/10 border-b border-primary/20">
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Node</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Dev ID</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Parameter</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Guideword</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Deviation</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Causes</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Consequences</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Safeguards</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Initial Risk</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Recommendations</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Residual Risk</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Action Party</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Priority</TableHead>
                    <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Target Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deviations.map((dev, index) => (
                    <motion.tr
                      key={dev.deviation_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors duration-200"
                    >
                      <TableCell className="text-xs lg:text-sm">
                        <div className="font-semibold text-primary">{dev.node_id}</div>
                        <div className="text-muted-foreground text-[10px]">{dev.node_description}</div>
                      </TableCell>
                      <TableCell className="font-semibold text-xs lg:text-sm">{dev.deviation_id}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs lg:text-sm">{dev.parameter}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                        <Badge variant="outline" className="bg-primary/10">{dev.guideword}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] text-xs lg:text-sm">{dev.deviation}</TableCell>
                      <TableCell className="max-w-[200px] text-xs lg:text-sm">
                        <ul className="list-disc list-inside">
                          {dev.causes.slice(0, 3).map((cause, i) => (
                            <li key={i} className="truncate">{cause}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="max-w-[200px] text-xs lg:text-sm">{dev.consequences_unmitigated}</TableCell>
                      <TableCell className="max-w-[200px] text-xs lg:text-sm">
                        <ul className="list-disc list-inside">
                          {dev.existing_safeguards.slice(0, 2).map((sg, i) => (
                            <li key={i} className="truncate">{sg}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getRiskBadgeClass(dev.initial_risk?.ranking)} text-xs`}>
                            {dev.initial_risk?.ranking}
                          </Badge>
                          {isMajorAccidentHazard(dev) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
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
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] text-xs lg:text-sm">
                        <ul className="list-disc list-inside">
                          {dev.recommendations.slice(0, 2).map((rec, i) => (
                            <li key={i} className="truncate">{rec}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                        <Badge className={`${getRiskBadgeClass(dev.residual_risk?.ranking)} text-xs`}>
                          {dev.residual_risk?.ranking}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs lg:text-sm">{dev.action_party}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                        <Badge className={getPriorityBadgeClass(dev.priority)}>
                          {dev.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs lg:text-sm">{dev.target_date}</TableCell>
                    </motion.tr>
                  ))}
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
