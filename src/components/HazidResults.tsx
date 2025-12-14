import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, Loader2, Save, GitBranch } from "lucide-react";
import { exportHazidToExcel } from "@/utils/exportHazidToExcel";
import type { HazidHazard } from "@/pages/HazidStudy";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BowTieDiagram from "./BowTieDiagram";

// Get risk severity color based on EGPC code (A-F)
const getRiskBadgeClass = (riskRanking: string | undefined): string => {
  if (!riskRanking) return "bg-muted text-muted-foreground";
  
  // Extract severity letter from formats like "3C (Possible/Major)" or just "C"
  const match = riskRanking.match(/[1-6]?([A-F])/i);
  const severity = match ? match[1].toUpperCase() : null;
  
  switch (severity) {
    case 'A': // Disastrous
    case 'B': // Catastrophic
      return "bg-[hsl(var(--risk-critical))] text-white";
    case 'C': // Major
    case 'D': // Serious
      return "bg-[hsl(var(--risk-warning))] text-white";
    case 'E': // Minor
    case 'F': // Notable
      return "bg-[hsl(var(--risk-low))] text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

interface HazidResultsProps {
  hazards: HazidHazard[];
  onHazardsUpdated: (hazards: HazidHazard[]) => void;
  formData: {
    title: string;
    executiveSummary: string;
    purpose: string;
    scope: string;
  };
  studyId?: string;
  onStudySaved?: (id: string) => void;
}

const HazidResults = ({ hazards, onHazardsUpdated, formData, studyId, onStudySaved }: HazidResultsProps) => {
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStudyId, setCurrentStudyId] = useState<string | undefined>(studyId);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setCurrentStudyId(studyId);
  }, [studyId]);

  const formatRecommendations = (recommendations: string | string[]): string => {
    if (Array.isArray(recommendations)) {
      return recommendations.join('\n• ');
    }
    return recommendations;
  };

  const handleExport = () => {
    exportHazidToExcel(hazards, formData.title || 'HAZID_Study');
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
        executive_summary: formData.executiveSummary,
        purpose: formData.purpose,
        scope: formData.scope,
        hazards: hazards as any,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (currentStudyId) {
        // Update existing study
        const { error } = await supabase
          .from('hazid_studies')
          .update(studyData)
          .eq('id', currentStudyId);

        if (error) throw error;
        toast({
          title: "Saved",
          description: "HAZID study updated successfully.",
        });
      } else {
        // Create new study
        const { data, error } = await supabase
          .from('hazid_studies')
          .insert(studyData)
          .select('id')
          .single();

        if (error) throw error;
        setCurrentStudyId(data.id);
        onStudySaved?.(data.id);
        toast({
          title: "Saved",
          description: "HAZID study saved successfully.",
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
    setIsGeneratingMore(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to generate more hazards.');
      }

      // Create summaries of existing hazards to avoid duplicates
      const existingHazardSummaries = hazards.map(h => ({
        h_no: h.h_no,
        hazard_description: h.hazard_description,
        guideword: h.guideword,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hazid-study`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            title: formData.title, 
            executive_summary: formData.executiveSummary,
            purpose: formData.purpose,
            scope: formData.scope,
            existing_hazards: existingHazardSummaries,
            start_number: hazards.length + 1,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data?.hazards) {
        const updatedHazards = [...hazards, ...data.hazards];
        onHazardsUpdated(updatedHazards);
        toast({
          title: "Success",
          description: `Generated ${data.hazards.length} additional hazards.`,
        });
      }
    } catch (error) {
      console.error('Error generating more hazards:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate more hazards.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMore(false);
    }
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
            HAZID Study Results ({hazards.length} hazards)
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
              onClick={handleGenerateMore}
              disabled={isGeneratingMore}
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
                  <span className="hidden xs:inline">Generate 15 More</span>
                  <span className="xs:hidden">+15 More</span>
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
          <div className="block sm:hidden space-y-3">
            {hazards.map((hazard, index) => (
              <motion.div
                key={hazard.h_no}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary text-sm">{hazard.h_no}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{hazard.guideword}</span>
                </div>
                <p className="text-sm font-medium">{hazard.hazard_description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Source:</span>
                    <p className="truncate">{hazard.source_location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Top Event:</span>
                    <p className="truncate">{hazard.top_event}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground block">Initial:</span>
                    <Badge className={`${getRiskBadgeClass(hazard.risk_ranking_initial)} text-[10px] px-1.5 py-0`}>
                      {hazard.risk_ranking_initial}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Current:</span>
                    <Badge className={`${getRiskBadgeClass(hazard.risk_ranking_current)} text-[10px] px-1.5 py-0`}>
                      {hazard.risk_ranking_current || '-'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Residual:</span>
                    <Badge className={`${getRiskBadgeClass(hazard.risk_ranking_residual)} text-[10px] px-1.5 py-0`}>
                      {hazard.risk_ranking_residual || '-'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-4 text-xs pt-1 border-t border-border/50">
                  <div className="flex-1">
                    <span className="text-muted-foreground">MAH:</span>
                    <span className={`ml-1 font-medium ${hazard.mah === 'Yes' ? 'text-destructive' : ''}`}>
                      {hazard.mah}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-muted-foreground">Action Party:</span>
                    <span className="ml-1">{hazard.action_party || '-'}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="ml-1">{hazard.target_date || '-'}</span>
                  </div>
                </div>
                {hazard.mah === 'Yes' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                        <GitBranch className="h-3 w-3 mr-1" />
                        View Bow Tie Diagram
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>Bow Tie Diagram - {hazard.h_no}</DialogTitle>
                      </DialogHeader>
                      <BowTieDiagram hazard={hazard} />
                    </DialogContent>
                  </Dialog>
                )}
              </motion.div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto max-w-full">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/10 border-b border-primary/20">
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">H-No</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Guideword</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Hazard Description</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Source Location</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Possible Causes</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Top Event</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Consequences</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Initial Risk</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">MAH</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Existing Controls</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Current Risk</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Recommendations</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Residual Risk</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Action Party</TableHead>
                  <TableHead className="font-bold text-foreground whitespace-nowrap text-xs lg:text-sm">Target Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hazards.map((hazard, index) => (
                  <motion.tr
                    key={hazard.h_no}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-border/50 hover:bg-primary/5 transition-colors duration-200"
                  >
                    <TableCell className="font-semibold text-xs lg:text-sm">{hazard.h_no}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs lg:text-sm">{hazard.guideword}</TableCell>
                    <TableCell className="max-w-xs text-xs lg:text-sm">{hazard.hazard_description}</TableCell>
                    <TableCell className="max-w-xs text-xs lg:text-sm">{hazard.source_location}</TableCell>
                    <TableCell className="max-w-xs text-xs lg:text-sm">{hazard.possible_causes}</TableCell>
                    <TableCell className="max-w-xs text-xs lg:text-sm">{hazard.top_event}</TableCell>
                    <TableCell className="max-w-xs text-xs lg:text-sm">{hazard.consequences}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                      <Badge className={`${getRiskBadgeClass(hazard.risk_ranking_initial)} text-xs`}>
                        {hazard.risk_ranking_initial}
                      </Badge>
                    </TableCell>
                    <TableCell className={`whitespace-nowrap text-xs lg:text-sm font-medium ${hazard.mah === 'Yes' ? 'text-destructive' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span>{hazard.mah}</span>
                        {hazard.mah === 'Yes' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                <GitBranch className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Bow Tie Diagram - {hazard.h_no}</DialogTitle>
                              </DialogHeader>
                              <BowTieDiagram hazard={hazard} />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs text-xs lg:text-sm">{hazard.existing_controls}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                      <Badge className={`${getRiskBadgeClass(hazard.risk_ranking_current)} text-xs`}>
                        {hazard.risk_ranking_current || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-xs lg:text-sm">
                      {Array.isArray(hazard.recommendations) 
                        ? hazard.recommendations.map((rec, i) => (
                            <div key={i} className="mb-1">• {rec}</div>
                          ))
                        : hazard.recommendations
                      }
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                      <Badge className={`${getRiskBadgeClass(hazard.risk_ranking_residual)} text-xs`}>
                        {hazard.risk_ranking_residual || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                      {hazard.action_party || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                      {hazard.target_date || '-'}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Risk Matrix Legend */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-3">EGPC Risk Ranking Legend</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-[hsl(var(--risk-critical))] text-white text-xs">A/B</Badge>
                <span className="text-xs text-muted-foreground">Disastrous / Catastrophic</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[hsl(var(--risk-warning))] text-white text-xs">C/D</Badge>
                <span className="text-xs text-muted-foreground">Major / Serious</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[hsl(var(--risk-low))] text-white text-xs">E/F</Badge>
                <span className="text-xs text-muted-foreground">Minor / Notable</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Risk format: <span className="font-mono bg-muted px-1 rounded">Likelihood + Severity (e.g., 3C = Possible/Major)</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HazidResults;