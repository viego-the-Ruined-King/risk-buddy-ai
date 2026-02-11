import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/animated-table";
import { Shield, Download, Plus, Loader2, Save, GitBranch } from "lucide-react";
import { exportToExcel } from "@/utils/exportToExcel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import RiskBowTieDiagram from "./RiskBowTieDiagram";
import ExportableBowTieDiagram from "./ExportableBowTieDiagram";
import { useLanguage } from "@/contexts/LanguageContext";

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

interface RiskResultsProps {
  data: {
    hazards: Hazard[];
  };
  activityTitle?: string;
  activityDescription?: string;
  activityType?: string;
  location?: string;
  onNewHazards?: (newHazards: Hazard[]) => void;
  assessmentId?: string;
  onAssessmentSaved?: (id: string) => void;
}

const getRiskLevel = (riskLevelText: string): string => {
  const lowerLevel = riskLevelText?.toLowerCase() || '';
  if (lowerLevel.includes('level 1') || lowerLevel.includes('high')) {
    return 'high';
  } else if (lowerLevel.includes('level 2') || lowerLevel.includes('medium')) {
    return 'medium';
  }
  return 'low';
};

const isHighRisk = (riskLevel: string): boolean => {
  return getRiskLevel(riskLevel) === 'high';
};

const getRiskBadgeVariant = (level: string) => {
  switch (level) {
    case 'high':
      return 'destructive'; // Red
    case 'medium':
      return 'default'; // Yellow
    default:
      return 'secondary'; // Green
  }
};

export const RiskResults = ({ 
  data, 
  activityTitle = 'Risk Assessment',
  activityDescription,
  activityType,
  location,
  onNewHazards,
  assessmentId,
  onAssessmentSaved
}: RiskResultsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | undefined>(assessmentId);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    setCurrentAssessmentId(assessmentId);
  }, [assessmentId]);

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to save your assessment.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const assessmentData = {
        title: activityTitle,
        description: activityDescription,
        activity_type: activityType,
        location: location,
        hazards: data.hazards as any,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (currentAssessmentId) {
        // Update existing assessment
        const { error } = await supabase
          .from('risk_assessments')
          .update(assessmentData)
          .eq('id', currentAssessmentId);

        if (error) throw error;
        toast({
          title: "Saved",
          description: "Risk assessment updated successfully.",
        });
      } else {
        // Create new assessment
        const { data: savedData, error } = await supabase
          .from('risk_assessments')
          .insert(assessmentData)
          .select('id')
          .single();

        if (error) throw error;
        setCurrentAssessmentId(savedData.id);
        onAssessmentSaved?.(savedData.id);
        toast({
          title: "Saved",
          description: "Risk assessment saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: "Error",
        description: "Failed to save assessment.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    try {
      exportToExcel(data.hazards, activityTitle);
      toast({
        title: "Export Successful",
        description: "Risk assessment exported to CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateNewHazards = async () => {
    if (!activityDescription || !activityType || !location) {
      toast({
        title: "Missing Information",
        description: "Cannot generate new hazards without activity details.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const existingDescriptions = data.hazards.map(h => h.description).join('; ');
      
      const { data: newData, error } = await supabase.functions.invoke('assess-risk', {
        body: { 
          title: activityTitle,
          description: activityDescription,
          activity_type: activityType,
          location: location,
          existing_hazards: existingDescriptions,
          generate_new: true
        }
      });

      if (error) throw error;
      if (newData.error) throw new Error(newData.error);

      if (onNewHazards && newData.hazards) {
        onNewHazards(newData.hazards);
        toast({
          title: "New Hazards Generated",
          description: `Identified ${newData.hazards.length} additional hazards.`,
        });
      }
    } catch (error) {
      console.error('Error generating new hazards:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate new hazards.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Mobile card view for results
  const MobileResultCard = ({ hazard, index }: { hazard: Hazard; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-card border border-border/50 rounded-lg p-3 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">#{index + 1}</span>
          <Badge variant={getRiskBadgeVariant(hazard.risk_level?.toLowerCase() || 'medium')} className="text-xs">
            {hazard.risk_level?.toUpperCase()}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">L×S: {hazard.numerical_risk_level}</span>
      </div>
      
      <div>
        <p className="text-sm font-medium text-foreground">{hazard.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Likelihood:</span>
          <p className="font-medium">{hazard.likelihood} ({hazard.likelihood_score})</p>
        </div>
        <div>
          <span className="text-muted-foreground">Severity:</span>
          <p className="font-medium">{hazard.severity} ({hazard.severity_score})</p>
        </div>
      </div>

      <div className="text-xs">
        <span className="text-muted-foreground">Consequences:</span>
        <p className="mt-0.5">{hazard.consequences}</p>
      </div>

      <div className="text-xs">
        <span className="text-muted-foreground">Who Might Be Harmed:</span>
        <p className="mt-0.5">{hazard.who_might_be_harmed}</p>
      </div>

      <div className="text-xs border-t border-border/50 pt-2">
        <span className="text-muted-foreground">Existing Controls:</span>
        <p className="mt-0.5 whitespace-pre-wrap">{hazard.existing_controls}</p>
      </div>

      <div className="text-xs">
        <div className="flex items-start gap-1.5">
          <Shield className="h-3 w-3 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="text-muted-foreground">Proposed Controls:</span>
            <p className="mt-0.5 whitespace-pre-wrap">{hazard.proposed_controls}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2">
        <div>
          <span className="text-muted-foreground">Residual Risk:</span>
          <Badge variant={getRiskBadgeVariant(hazard.residual_risk_level?.toLowerCase() || 'low')} className="ml-1 text-xs">
            {hazard.residual_risk_level?.toUpperCase()}
          </Badge>
        </div>
        <span className="text-muted-foreground">R-L×S: {hazard.residual_numerical_risk_level}</span>
      </div>

      {/* Bow Tie Diagram for high-risk hazards */}
      {isHighRisk(hazard.risk_level) && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full mt-2 text-xs gap-1.5">
              <GitBranch className="h-3 w-3" />
              View Bow Tie Diagram
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Bow Tie Diagram - Hazard #{index + 1}</DialogTitle>
            </DialogHeader>
            <ExportableBowTieDiagram title={hazard.description} hazardId={`Hazard_${index + 1}`}>
              <RiskBowTieDiagram hazard={hazard} index={index} />
            </ExportableBowTieDiagram>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-foreground">{t.results.risk.title}</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            {data.hazards.length} {t.results.risk.hazardsIdentified}
          </p>
        </div>
        <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-3">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            variant="outline"
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">{currentAssessmentId ? t.results.risk.update : t.results.risk.save}</span>
          </Button>
          <Button 
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t.results.risk.export}</span>
          </Button>
          <Button 
            onClick={handleGenerateNewHazards}
            disabled={isGenerating}
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(0,217,163,0.3)] hover:shadow-[0_0_30px_rgba(0,217,163,0.5)] transition-all"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">{t.results.risk.generateMore}</span>
          </Button>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {data.hazards.map((hazard, index) => (
          <MobileResultCard key={index} hazard={hazard} index={index} />
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block border border-border/50 rounded-lg overflow-hidden shadow-elevated bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <div className="max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-b border-primary/10 bg-muted/50">
                  <TableHead className="w-[80px] text-primary font-semibold">#</TableHead>
                  <TableHead className="min-w-[200px] text-primary font-semibold">{t.results.risk.hazardDescription}</TableHead>
                  <TableHead className="min-w-[150px] text-primary font-semibold">{t.results.risk.whoHarmed}</TableHead>
                  <TableHead className="min-w-[200px] text-primary font-semibold">{t.results.risk.consequencesCol}</TableHead>
                  <TableHead className="w-[120px] text-primary font-semibold">{t.results.risk.likelihood}</TableHead>
                  <TableHead className="w-[80px] text-primary font-semibold">{t.results.risk.lScore}</TableHead>
                  <TableHead className="w-[120px] text-primary font-semibold">{t.results.risk.severity}</TableHead>
                  <TableHead className="w-[80px] text-primary font-semibold">{t.results.risk.sScore}</TableHead>
                  <TableHead className="w-[120px] text-primary font-semibold">{t.results.risk.riskLevel}</TableHead>
                  <TableHead className="w-[80px] text-primary font-semibold">{t.results.risk.lxs}</TableHead>
                  <TableHead className="min-w-[300px] text-primary font-semibold">{t.results.risk.existingControls}</TableHead>
                  <TableHead className="min-w-[350px] text-primary font-semibold">{t.results.risk.proposedControls}</TableHead>
                  <TableHead className="w-[140px] text-primary font-semibold">{t.results.risk.residualLikelihood}</TableHead>
                  <TableHead className="w-[80px] text-primary font-semibold">{t.results.risk.rlScore}</TableHead>
                  <TableHead className="w-[140px] text-primary font-semibold">{t.results.risk.residualSeverity}</TableHead>
                  <TableHead className="w-[80px] text-primary font-semibold">{t.results.risk.rsScore}</TableHead>
                  <TableHead className="w-[140px] text-primary font-semibold">{t.results.risk.residualRiskLevel}</TableHead>
                  <TableHead className="w-[80px] text-primary font-semibold">{t.results.risk.rlxs}</TableHead>
                  <TableHead className="w-[100px] text-primary font-semibold">{t.results.risk.actions}</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {data.hazards.map((hazard, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="border-b border-border/50 transition-all hover:bg-primary/5 hover:border-primary/20"
                >
                  <TableCell className="font-medium text-primary">{index + 1}</TableCell>
                  <TableCell className="font-medium">{hazard.description}</TableCell>
                  <TableCell>{hazard.who_might_be_harmed}</TableCell>
                  <TableCell>{hazard.consequences}</TableCell>
                  <TableCell>{hazard.likelihood}</TableCell>
                  <TableCell className="text-center font-semibold text-primary">{hazard.likelihood_score}</TableCell>
                  <TableCell>{hazard.severity}</TableCell>
                  <TableCell className="text-center font-semibold text-primary">{hazard.severity_score}</TableCell>
                  <TableCell>
                    <Badge variant={getRiskBadgeVariant(hazard.risk_level?.toLowerCase() || 'medium')} className="whitespace-nowrap">
                      {hazard.risk_level?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary">{hazard.numerical_risk_level}</TableCell>
                  <TableCell>
                    <span className="text-sm whitespace-pre-wrap">{hazard.existing_controls}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm whitespace-pre-wrap">{hazard.proposed_controls}</span>
                    </div>
                  </TableCell>
                  <TableCell>{hazard.residual_likelihood}</TableCell>
                  <TableCell className="text-center font-semibold text-primary">{hazard.residual_likelihood_score}</TableCell>
                  <TableCell>{hazard.residual_severity}</TableCell>
                  <TableCell className="text-center font-semibold text-primary">{hazard.residual_severity_score}</TableCell>
                  <TableCell>
                    <Badge variant={getRiskBadgeVariant(hazard.residual_risk_level?.toLowerCase() || 'low')} className="whitespace-nowrap">
                      {hazard.residual_risk_level?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary">{hazard.residual_numerical_risk_level}</TableCell>
                  <TableCell>
                    {isHighRisk(hazard.risk_level) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                            <GitBranch className="h-3 w-3" />
                            {t.results.risk.viewBowTie}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Bow Tie Diagram - Hazard #{index + 1}</DialogTitle>
                          </DialogHeader>
                          <ExportableBowTieDiagram title={hazard.description} hazardId={`Hazard_${index + 1}`}>
                            <RiskBowTieDiagram hazard={hazard} index={index} />
                          </ExportableBowTieDiagram>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
    </div>
  );
};