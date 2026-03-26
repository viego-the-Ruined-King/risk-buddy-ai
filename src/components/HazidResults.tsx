import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, Loader2, Save, GitBranch, Lock, Unlock, Trash2 } from "lucide-react";
import { exportHazidToExcel } from "@/utils/exportHazidToExcel";
import type { HazidHazard } from "@/pages/HazidStudy";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BowTieDiagram from "./BowTieDiagram";
import ExportableBowTieDiagram from "./ExportableBowTieDiagram";
import { useLanguage } from "@/contexts/LanguageContext";

// EGPC Risk Matrix color coding
const getRiskRankingColor = (rr: string | undefined): string => {
  if (!rr) return "";
  const cleaned = rr.replace(/\s/g, '').toUpperCase();
  
  // HIGH (Red)
  const high = ['3A','4A','5A','6A','4B','5B','6B','5C','6C','6D'];
  // M/H ALARP (Orange)
  const mhAlarp = ['2A','3B','4C','5D','6E','3C','4D','5E','6F'];
  // M ALARP (Yellow)
  const mAlarp = ['1A','2B','2C','3D','4E','5F','1B','2D','3E','4F'];
  // LOW (Green)
  const low = ['1C','1D','1E','1F','2E','2F','3F'];
  
  // Extract the L+S code (e.g. "3C" from "3C (Possible/Major)")
  const match = cleaned.match(/^(\d[A-F])/);
  const code = match ? match[1] : '';
  
  if (high.includes(code)) return "bg-red-600 text-white";
  if (mhAlarp.includes(code)) return "bg-orange-500 text-white";
  if (mAlarp.includes(code)) return "bg-yellow-400 text-black";
  if (low.includes(code)) return "bg-green-600 text-white";
  return "bg-muted text-muted-foreground";
};

const getRiskLabel = (rr: string | undefined): string => {
  if (!rr) return "";
  const cleaned = rr.replace(/\s/g, '').toUpperCase();
  const match = cleaned.match(/^(\d[A-F])/);
  const code = match ? match[1] : '';
  
  const high = ['3A','4A','5A','6A','4B','5B','6B','5C','6C','6D'];
  const mhAlarp = ['2A','3B','4C','5D','6E','3C','4D','5E','6F'];
  const mAlarp = ['1A','2B','2C','3D','4E','5F','1B','2D','3E','4F'];
  const low = ['1C','1D','1E','1F','2E','2F','3F'];
  
  if (high.includes(code)) return "HIGH";
  if (mhAlarp.includes(code)) return "M/H ALARP";
  if (mAlarp.includes(code)) return "M ALARP";
  if (low.includes(code)) return "LOW";
  return "";
};

// Extract L number from risk ranking like "3C (Possible/Major)"
const extractL = (rr: string | undefined): string => {
  if (!rr) return "-";
  const match = rr.match(/^(\d)/);
  return match ? match[1] : "-";
};

// Extract S letter from risk ranking
const extractS = (rr: string | undefined): string => {
  if (!rr) return "-";
  const match = rr.match(/^\d([A-F])/i);
  return match ? match[1].toUpperCase() : "-";
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

// Inline editable cell component
const EditableCell = ({ value, isLocked, onSave, className = "" }: { value: any; isLocked: boolean; onSave: (val: string) => void; className?: string }) => {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={editVal}
        onChange={(e) => setEditVal(e.target.value)}
        onBlur={() => { onSave(editVal); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(editVal); setEditing(false); } }}
        className="w-full min-h-[40px] p-1 text-xs bg-background border border-primary rounded resize-y focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  const display = Array.isArray(value) ? value.join(", ") : String(value ?? "-");
  return (
    <div
      className={`${className} ${!isLocked ? "cursor-pointer hover:bg-primary/10 rounded px-0.5" : ""}`}
      onDoubleClick={() => {
        if (isLocked) return;
        setEditVal(Array.isArray(value) ? value.join("\n") : String(value ?? ""));
        setEditing(true);
      }}
    >
      {display}
    </div>
  );
};

const HazidResults = ({ hazards, onHazardsUpdated, formData, studyId, onStudySaved }: HazidResultsProps) => {
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStudyId, setCurrentStudyId] = useState<string | undefined>(studyId);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    setCurrentStudyId(studyId);
  }, [studyId]);

  const updateHazardField = (index: number, field: string, value: any) => {
    const updated = [...hazards];
    updated[index] = { ...updated[index], [field]: value };
    onHazardsUpdated(updated);
  };

  const deleteHazard = (index: number) => {
    onHazardsUpdated(hazards.filter((_, i) => i !== index));
  };

  const handleExport = () => {
    exportHazidToExcel(hazards, formData.title || 'HAZID_Study');
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Error", description: "Please log in to save your study.", variant: "destructive" });
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
        const { error } = await supabase.from('hazid_studies').update(studyData).eq('id', currentStudyId);
        if (error) throw error;
        toast({ title: "Saved", description: "HAZID study updated successfully." });
      } else {
        const { data, error } = await supabase.from('hazid_studies').insert(studyData).select('id').single();
        if (error) throw error;
        setCurrentStudyId(data.id);
        onStudySaved?.(data.id);
        toast({ title: "Saved", description: "HAZID study saved successfully." });
      }
    } catch (error) {
      console.error('Error saving study:', error);
      toast({ title: "Error", description: "Failed to save study.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateMore = async () => {
    setIsGeneratingMore(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in to generate more hazards.');

      const existingHazardSummaries = hazards.map(h => ({
        h_no: h.h_no, hazard_description: h.hazard_description, guideword: h.guideword,
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
            title: formData.title, executive_summary: formData.executiveSummary,
            purpose: formData.purpose, scope: formData.scope,
            existing_hazards: existingHazardSummaries, start_number: hazards.length + 1,
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
        toast({ title: "Success", description: `Generated ${data.hazards.length} additional hazards.` });
      }
    } catch (error) {
      console.error('Error generating more hazards:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to generate more hazards.", variant: "destructive" });
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const [isLocked, setIsLocked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 sm:space-y-6"
    >
      <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 p-4 sm:p-6 pb-4 sm:pb-6">
          <div>
            <CardTitle className="text-lg sm:text-2xl font-bold">
              {t.results.hazid.title} ({hazards.length} {t.results.hazid.hazards})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t.results.hazid.annexCRef}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={isSaving} variant="outline" size="sm" className="shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9">
              {isSaving ? (
                <><Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /><span className="hidden xs:inline">{t.results.hazid.saving}</span></>
              ) : (
                <><Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />{currentStudyId ? t.results.hazid.update : t.results.hazid.save}</>
              )}
            </Button>
            <Button onClick={handleGenerateMore} disabled={isGeneratingMore} variant="outline" size="sm" className="shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9">
              {isGeneratingMore ? (
                <><Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /><span className="hidden xs:inline">{t.results.hazid.generating}</span></>
              ) : (
                <><Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /><span className="hidden xs:inline">{t.results.hazid.generateMore}</span><span className="xs:hidden">+15</span></>
              )}
            </Button>
            {isLocked && (
              <Button onClick={handleExport} size="sm" className="shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9">
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">{t.results.hazid.exportExcel}</span>
                <span className="xs:hidden">{t.results.hazid.exportShort}</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="w-full p-2 sm:p-6 pt-0">
          {/* Editable Grid Toolbar */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {!isLocked && (
              <Button type="button" variant="outline" size="sm" onClick={() => {
                const newHazard: HazidHazard = {
                  h_no: `H-${String(hazards.length + 1).padStart(2, '0')}`,
                  guideword: "", hazard_description: "", source_location: "",
                  company_specific_source: "", possible_causes: "", top_event: "",
                  consequences: "", assess_for: "", category: "",
                  risk_ranking_initial: "", initial_risk: { likelihood: "", severity: "" },
                  mah: "No", existing_controls: "", safeguard_barrier_type: "",
                  current_risk: { likelihood: "", severity: "" }, risk_ranking_current: "",
                  recommendations: [], isd_opportunities: "",
                  residual_risk: { likelihood: "", severity: "" }, risk_ranking_residual: "",
                  action_party: "", target_date: "", remarks: "",
                };
                onHazardsUpdated([...hazards, newHazard]);
              }} className="text-xs h-8">
                <Plus className="h-3 w-3 mr-1" />
                Add Row
              </Button>
            )}
            <Button
              type="button"
              variant={isLocked ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLocked(!isLocked)}
              className="text-xs h-8"
            >
              {isLocked ? (
                <><Lock className="h-3 w-3 mr-1" />Study Locked — Click to Unlock</>
              ) : (
                <><Unlock className="h-3 w-3 mr-1" />Approve & Lock Study</>
              )}
            </Button>
            {!isLocked && (
              <span className="text-[10px] text-muted-foreground italic">Double-click any cell to edit inline</span>
            )}
          </div>
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
                {hazard.category && (
                  <Badge variant="outline" className="text-xs">{hazard.category}</Badge>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t.results.hazid.sourceLocation}:</span>
                    <p className="truncate">{hazard.source_location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.results.hazid.topEvent}:</span>
                    <p className="truncate">{hazard.top_event}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground block">{t.results.hazid.initialRisk}:</span>
                    <Badge className={`${getRiskRankingColor(hazard.risk_ranking_initial)} text-[10px] px-1.5 py-0`}>
                      {getRiskLabel(hazard.risk_ranking_initial) || hazard.risk_ranking_initial}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{t.results.hazid.currentRisk}:</span>
                    <Badge className={`${getRiskRankingColor(hazard.risk_ranking_current)} text-[10px] px-1.5 py-0`}>
                      {getRiskLabel(hazard.risk_ranking_current) || hazard.risk_ranking_current || '-'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{t.results.hazid.residualRisk}:</span>
                    <Badge className={`${getRiskRankingColor(hazard.risk_ranking_residual)} text-[10px] px-1.5 py-0`}>
                      {getRiskLabel(hazard.risk_ranking_residual) || hazard.risk_ranking_residual || '-'}
                    </Badge>
                  </div>
                </div>
                {hazard.safeguard_barrier_type && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t.results.hazid.safeguardBarrierType}:</span>
                    <span className="ml-1">{hazard.safeguard_barrier_type}</span>
                  </div>
                )}
                {hazard.isd_opportunities && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t.results.hazid.isdOpportunities}:</span>
                    <span className="ml-1">{hazard.isd_opportunities}</span>
                  </div>
                )}
                <div className="flex gap-4 text-xs pt-1 border-t border-border/50">
                  <div className="flex-1">
                    <span className="text-muted-foreground">{t.results.hazid.mah}:</span>
                    <span className={`ml-1 font-medium ${hazard.mah === 'Yes' ? 'text-destructive' : ''}`}>{hazard.mah}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-muted-foreground">{t.results.hazid.actionParty}:</span>
                    <span className="ml-1">{hazard.action_party || '-'}</span>
                  </div>
                </div>
                {hazard.remarks && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t.results.hazid.remarks}:</span>
                    <span className="ml-1">{hazard.remarks}</span>
                  </div>
                )}
                {hazard.mah === 'Yes' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {t.results.hazid.viewBowTie}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>Bow Tie Diagram - {hazard.h_no}</DialogTitle>
                      </DialogHeader>
                      <ExportableBowTieDiagram title={hazard.hazard_description} hazardId={hazard.h_no}>
                        <BowTieDiagram hazard={hazard} />
                      </ExportableBowTieDiagram>
                    </DialogContent>
                  </Dialog>
                )}
              </motion.div>
            ))}
          </div>

          {/* Desktop Table View - Annex C HAZID Worksheet */}
          <div className="hidden sm:block overflow-x-auto max-w-full rounded-lg border border-border/50">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-card z-10">
                  {/* Top header row with merged Risk Evaluation cells */}
                  <tr className="bg-primary/10 border-b border-primary/20">
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.hNo}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.guideword}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.sourceLocation}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.possibleCauses}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.topEvent}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.consequencesCol}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.category}</th>
                    <th colSpan={3} className="border border-border/50 px-2 py-1 text-xs font-bold text-center text-foreground bg-red-100 dark:bg-red-900/30">{t.results.hazid.riskEvaluation} - {t.results.hazid.initialRisk}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.worstCredible}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.existingControls}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.safeguardBarrierType}</th>
                    <th colSpan={3} className="border border-border/50 px-2 py-1 text-xs font-bold text-center text-foreground bg-orange-100 dark:bg-orange-900/30">{t.results.hazid.riskEvaluation} - {t.results.hazid.currentRisk}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.currentRisk}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.recommendations}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.isdOpportunities}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.actionParty}</th>
                    <th colSpan={3} className="border border-border/50 px-2 py-1 text-xs font-bold text-center text-foreground bg-green-100 dark:bg-green-900/30">{t.results.hazid.riskEvaluation} - {t.results.hazid.residualRisk}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.residualRisk}</th>
                    <th rowSpan={2} className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap">{t.results.hazid.remarks}</th>
                  </tr>
                  {/* Sub-header row for L, S, RR */}
                  <tr className="bg-primary/5 border-b border-primary/20">
                    <th className="border border-border/50 px-1 py-1 text-[10px] font-bold text-center bg-red-50 dark:bg-red-900/20 w-8">{t.results.hazid.l}</th>
                    <th className="border border-border/50 px-1 py-1 text-[10px] font-bold text-center bg-red-50 dark:bg-red-900/20 w-8">{t.results.hazid.s}</th>
                    <th className="border border-border/50 px-1 py-1 text-[10px] font-bold text-center bg-red-50 dark:bg-red-900/20 w-10">{t.results.hazid.rr}</th>
                    <th className="border border-border/50 px-1 py-1 text-[10px] font-bold text-center bg-orange-50 dark:bg-orange-900/20 w-8">{t.results.hazid.l}</th>
                    <th className="border border-border/50 px-1 py-1 text-[10px] font-bold text-center bg-orange-50 dark:bg-orange-900/20 w-8">{t.results.hazid.s}</th>
                    <th className="border border-border/50 px-1 py-1 text-[10px] font-bold text-center bg-orange-50 dark:bg-orange-900/20 w-10">{t.results.hazid.rr}</th>
                    <th className="border border-border/50 px-1 py-1 text-[10px] font-bold text-center bg-green-50 dark:bg-green-900/20 w-8">{t.results.hazid.l}</th>
                    <th className="border border-border/50 px-1 py-1 text-[10px] font-bold text-center bg-green-50 dark:bg-green-900/20 w-8">{t.results.hazid.s}</th>
                    <th className="border border-border/50 px-1 py-1 text-[10px] font-bold text-center bg-green-50 dark:bg-green-900/20 w-10">{t.results.hazid.rr}</th>
                  </tr>
                </thead>
                <tbody>
                  {hazards.map((hazard, index) => (
                    <motion.tr
                      key={hazard.h_no}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors duration-200"
                    >
                      <td className="border border-border/50 px-2 py-2 font-semibold text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {hazard.h_no}
                          {hazard.mah === 'Yes' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                  <GitBranch className="h-3 w-3 text-destructive" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                <DialogHeader>
                                  <DialogTitle>Bow Tie Diagram - {hazard.h_no}</DialogTitle>
                                </DialogHeader>
                                <ExportableBowTieDiagram title={hazard.hazard_description} hazardId={hazard.h_no}>
                                  <BowTieDiagram hazard={hazard} />
                                </ExportableBowTieDiagram>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </td>
                      <td className="border border-border/50 px-2 py-2 text-xs whitespace-nowrap">{hazard.guideword}</td>
                      <td className="border border-border/50 px-2 py-2 text-xs max-w-[180px]">{hazard.source_location}</td>
                      <td className="border border-border/50 px-2 py-2 text-xs max-w-[200px]">{hazard.possible_causes}</td>
                      <td className="border border-border/50 px-2 py-2 text-xs max-w-[180px]">{hazard.top_event}</td>
                      <td className="border border-border/50 px-2 py-2 text-xs max-w-[200px]">{hazard.consequences}</td>
                      <td className="border border-border/50 px-2 py-2 text-xs whitespace-nowrap">{hazard.category || '-'}</td>
                      {/* Initial Risk Evaluation: L, S, RR */}
                      <td className="border border-border/50 px-1 py-2 text-xs text-center font-mono">{extractL(hazard.risk_ranking_initial)}</td>
                      <td className="border border-border/50 px-1 py-2 text-xs text-center font-mono">{extractS(hazard.risk_ranking_initial)}</td>
                      <td className="border border-border/50 px-1 py-2 text-xs text-center font-mono">{extractL(hazard.risk_ranking_initial)}{extractS(hazard.risk_ranking_initial)}</td>
                      {/* Worst Credible (Initial Risk color-coded) */}
                      <td className="border border-border/50 px-1 py-2 text-center">
                        <Badge className={`${getRiskRankingColor(hazard.risk_ranking_initial)} text-[10px] px-1.5 py-0.5`}>
                          {getRiskLabel(hazard.risk_ranking_initial) || hazard.risk_ranking_initial}
                        </Badge>
                      </td>
                      <td className="border border-border/50 px-2 py-2 text-xs max-w-[200px]">{hazard.existing_controls}</td>
                      <td className="border border-border/50 px-2 py-2 text-xs whitespace-nowrap">{hazard.safeguard_barrier_type || '-'}</td>
                      {/* Current Risk Evaluation: L, S, RR */}
                      <td className="border border-border/50 px-1 py-2 text-xs text-center font-mono">{extractL(hazard.risk_ranking_current)}</td>
                      <td className="border border-border/50 px-1 py-2 text-xs text-center font-mono">{extractS(hazard.risk_ranking_current)}</td>
                      <td className="border border-border/50 px-1 py-2 text-xs text-center font-mono">{hazard.risk_ranking_current ? `${extractL(hazard.risk_ranking_current)}${extractS(hazard.risk_ranking_current)}` : '-'}</td>
                      {/* Current Risk color-coded */}
                      <td className="border border-border/50 px-1 py-2 text-center">
                        <Badge className={`${getRiskRankingColor(hazard.risk_ranking_current)} text-[10px] px-1.5 py-0.5`}>
                          {getRiskLabel(hazard.risk_ranking_current) || hazard.risk_ranking_current || '-'}
                        </Badge>
                      </td>
                      <td className="border border-border/50 px-2 py-2 text-xs max-w-[250px]">
                        {Array.isArray(hazard.recommendations) 
                          ? hazard.recommendations.map((rec, i) => (
                              <div key={i} className="mb-1">• {rec}</div>
                            ))
                          : hazard.recommendations
                        }
                      </td>
                      <td className="border border-border/50 px-2 py-2 text-xs max-w-[180px]">{hazard.isd_opportunities || '-'}</td>
                      <td className="border border-border/50 px-2 py-2 text-xs whitespace-nowrap">{hazard.action_party || '-'}</td>
                      {/* Residual Risk Evaluation: L, S, RR */}
                      <td className="border border-border/50 px-1 py-2 text-xs text-center font-mono">{extractL(hazard.risk_ranking_residual)}</td>
                      <td className="border border-border/50 px-1 py-2 text-xs text-center font-mono">{extractS(hazard.risk_ranking_residual)}</td>
                      <td className="border border-border/50 px-1 py-2 text-xs text-center font-mono">{hazard.risk_ranking_residual ? `${extractL(hazard.risk_ranking_residual)}${extractS(hazard.risk_ranking_residual)}` : '-'}</td>
                      {/* Residual Risk color-coded */}
                      <td className="border border-border/50 px-1 py-2 text-center">
                        <Badge className={`${getRiskRankingColor(hazard.risk_ranking_residual)} text-[10px] px-1.5 py-0.5`}>
                          {getRiskLabel(hazard.risk_ranking_residual) || hazard.risk_ranking_residual || '-'}
                        </Badge>
                      </td>
                      <td className="border border-border/50 px-2 py-2 text-xs max-w-[150px]">{hazard.remarks || '-'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Matrix Legend */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-3">{t.results.hazid.riskLegendTitle}</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white text-xs">{t.results.hazid.high}</Badge>
                <span className="text-xs text-muted-foreground">3A, 4A, 5A, 6A, 4B, 5B, 6B, 5C, 6C, 6D</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500 text-white text-xs">{t.results.hazid.mhAlarp}</Badge>
                <span className="text-xs text-muted-foreground">2A, 3B, 3C, 4C, 4D, 5D, 5E, 6E, 6F</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-400 text-black text-xs">{t.results.hazid.mAlarp}</Badge>
                <span className="text-xs text-muted-foreground">1A, 1B, 2B, 2C, 2D, 3D, 3E, 4E, 4F, 5F</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white text-xs">{t.results.hazid.low}</Badge>
                <span className="text-xs text-muted-foreground">1C, 1D, 1E, 1F, 2E, 2F, 3F</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t.results.hazid.riskFormat}: <span className="font-mono bg-muted px-1 rounded">L(1-6) × S(A-F) → RR (e.g., 3C = Possible/Major)</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HazidResults;
