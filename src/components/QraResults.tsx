import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Save, Download, ChevronDown, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import QraRiskContourChart from "@/components/QraRiskContourChart";
import QraFnCurveChart from "@/components/QraFnCurveChart";
import { exportQraToExcel } from "@/utils/exportQraToExcel";
import type { QraStudyData, QraFormInputs } from "@/pages/QraStudy";

interface QraResultsProps {
  results: QraStudyData;
  formData: QraFormInputs;
  studyId?: string;
  onStudySaved: (id: string) => void;
}

const QraResults = ({ results, formData, studyId, onStudySaved }: QraResultsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const studyData = {
        user_id: user.id,
        title: formData.title,
        facility_description: formData.facility_description,
        objective: formData.objective,
        lifecycle_phase: formData.lifecycle_phase,
        scope_boundaries: formData.scope_boundaries,
        risk_types: formData.risk_types,
        assumption_register: results.assumption_register as any,
        failure_cases: results.failure_cases as any,
        consequence_assessment: results.consequence_assessment as any,
        risk_analysis: results.risk_analysis as any,
        risk_evaluation: results.risk_evaluation as any,
        alarp_demonstration: results.alarp_demonstration as any,
        recommendations: results.recommendations as any,
      };

      if (studyId) {
        const { error } = await (supabase as any).from('qra_studies').update(studyData).eq('id', studyId);
        if (error) throw error;
        toast({ title: t.common.success, description: "QRA study updated." });
      } else {
        const { data, error } = await (supabase as any).from('qra_studies').insert(studyData).select('id').single();
        if (error) throw error;
        onStudySaved(data.id);
        toast({ title: t.common.success, description: "QRA study saved." });
      }
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const overallStatus = results.risk_evaluation?.overall_status || "Unknown";
  const statusColor = overallStatus.toLowerCase().includes("acceptable") && !overallStatus.toLowerCase().includes("intolerable")
    ? overallStatus.toLowerCase().includes("alarp") ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30" : "bg-green-500/20 text-green-700 border-green-500/30"
    : "bg-red-500/20 text-red-700 border-red-500/30";
  const StatusIcon = overallStatus.toLowerCase().includes("intolerable") ? XCircle : overallStatus.toLowerCase().includes("alarp") ? AlertTriangle : CheckCircle;

  const qra = (t as any).results?.qra;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{qra?.title || "QRA Study Results"}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{qra?.perEgpc || "Per EGPC-PSM-GL-008"}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => exportQraToExcel(results, formData)}>
                <Download className="h-4 w-4 mr-1" />{qra?.export || "Export CSV"}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                {studyId ? (qra?.update || "Update") : (qra?.save || "Save")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Risk Evaluation Status */}
      <Card>
        <CardContent className="pt-6">
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${statusColor}`}>
            <StatusIcon className="h-8 w-8 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">{qra?.overallStatus || "Overall Risk Status"}: {overallStatus}</h3>
              <p className="text-sm mt-1">{results.risk_evaluation?.comparison_to_criteria}</p>
            </div>
          </div>
          {results.risk_evaluation?.major_risk_contributors?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">{qra?.majorContributors || "Major Risk Contributors"}</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {results.risk_evaluation.major_risk_contributors.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Summary */}
      <CollapsibleSection title={qra?.studySummary || "Study Summary"} defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">{qra?.objectiveLabel || "Objective"}:</span> <span className="text-muted-foreground">{results.study_summary?.objective}</span></div>
          <div><span className="font-medium">{qra?.scopeLabel || "Scope"}:</span> <span className="text-muted-foreground">{results.study_summary?.scope}</span></div>
          <div className="md:col-span-2"><span className="font-medium">{qra?.facilityLabel || "Facility"}:</span> <span className="text-muted-foreground">{results.study_summary?.facility_description}</span></div>
        </div>
      </CollapsibleSection>

      {/* Assumption Register */}
      <CollapsibleSection title={qra?.assumptionRegister || "Assumption Register"} count={results.assumption_register?.length}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">{qra?.categoryCol || "Category"}</TableHead>
                <TableHead>{qra?.assumptionCol || "Assumption"}</TableHead>
                <TableHead className="w-[200px]">{qra?.referenceCol || "Reference"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.assumption_register?.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{a.category}</TableCell>
                  <TableCell>{a.assumption}</TableCell>
                  <TableCell className="text-muted-foreground">{a.reference}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleSection>

      {/* Failure Cases */}
      <CollapsibleSection title={qra?.failureCases || "Failure Cases"} count={results.failure_cases?.length}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{qra?.fcId || "ID"}</TableHead>
                <TableHead>{qra?.isolatableSection || "Isolatable Section"}</TableHead>
                <TableHead>{qra?.equipment || "Equipment"}</TableHead>
                <TableHead>{qra?.material || "Material"}</TableHead>
                <TableHead>{qra?.phase || "Phase"}</TableHead>
                <TableHead>{qra?.holeSizesCol || "Hole Sizes"}</TableHead>
                <TableHead>{qra?.frequencyCol || "Freq. (/yr)"}</TableHead>
                <TableHead>{qra?.sourceCol || "Source"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.failure_cases?.map((fc) => (
                <TableRow key={fc.id}>
                  <TableCell className="font-mono font-medium">{fc.id}</TableCell>
                  <TableCell>{fc.isolatable_section}</TableCell>
                  <TableCell>{fc.equipment}</TableCell>
                  <TableCell>{fc.material}</TableCell>
                  <TableCell><Badge variant="outline">{fc.phase}</Badge></TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {fc.hole_sizes?.map((h, i) => (
                        <div key={i} className="text-xs"><span className="font-medium">{h.category}:</span> {h.diameter_mm}mm ({h.rate_kg_s} kg/s)</div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{fc.frequency_per_year?.toExponential(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fc.frequency_source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleSection>

      {/* Consequence Assessment */}
      <CollapsibleSection title={qra?.consequenceAssessment || "Consequence Assessment"} count={results.consequence_assessment?.length}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{qra?.fcId || "FC ID"}</TableHead>
                <TableHead>{qra?.holeSize || "Hole Size"}</TableHead>
                <TableHead>{qra?.outcomeType || "Outcome"}</TableHead>
                <TableHead>{qra?.probability || "Prob."}</TableHead>
                <TableHead>{qra?.physicalEffects || "Physical Effects (m)"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.consequence_assessment?.map((ca, ci) =>
                ca.outcomes?.map((outcome, oi) => (
                  <TableRow key={`${ci}-${oi}`}>
                    {oi === 0 && <TableCell rowSpan={ca.outcomes.length} className="font-mono font-medium">{ca.failure_case_id}</TableCell>}
                    {oi === 0 && <TableCell rowSpan={ca.outcomes.length}><Badge variant="outline">{ca.hole_size}</Badge></TableCell>}
                    <TableCell><Badge variant={outcome.type.includes("Fire") ? "destructive" : "secondary"}>{outcome.type}</Badge></TableCell>
                    <TableCell className="font-mono">{outcome.probability}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        {Object.entries(outcome.effects || {}).map(([key, val]) => (
                          <div key={key}><span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span> {val}m</div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CollapsibleSection>

      {/* Risk Analysis Charts */}
      <CollapsibleSection title={qra?.riskAnalysis || "Risk Analysis"} defaultOpen>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QraRiskContourChart
            irpaWorkers={results.risk_analysis?.individual_risk?.irpa_workers || []}
            irpaPublic={results.risk_analysis?.individual_risk?.irpa_public || []}
          />
          <QraFnCurveChart
            fnCurveData={results.risk_analysis?.societal_risk?.fn_curve_data || []}
            pll={results.risk_analysis?.societal_risk?.pll || 0}
          />
        </div>

        {/* LSIR Contours */}
        {results.risk_analysis?.individual_risk?.lsir_contours?.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-2">{qra?.lsirContours || "LSIR Contours"}</h4>
            <div className="space-y-2">
              {results.risk_analysis.individual_risk.lsir_contours.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono">{c.risk_level.toExponential(0)}/yr</Badge>
                  <span className="text-muted-foreground">{c.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* ALARP Demonstration */}
      <CollapsibleSection title={qra?.alarpDemo || "ALARP Demonstration"}>
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
          <span className="font-semibold text-sm">{qra?.residualStatus || "Residual Risk Status"}: </span>
          <span className="text-sm">{results.alarp_demonstration?.residual_risk_status}</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{qra?.measureCol || "Measure"}</TableHead>
                <TableHead>{qra?.typeCol || "Type"}</TableHead>
                <TableHead>{qra?.hierarchyCol || "Hierarchy"}</TableHead>
                <TableHead>{qra?.rrfCol || "RRF"}</TableHead>
                <TableHead>{qra?.costCol || "Cost"}</TableHead>
                <TableHead>{qra?.standardCol || "Standard"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.alarp_demonstration?.risk_reduction_measures?.map((m, i) => (
                <TableRow key={i}>
                  <TableCell>{m.measure}</TableCell>
                  <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{m.hierarchy}</Badge></TableCell>
                  <TableCell className="font-mono">{m.risk_reduction_factor}×</TableCell>
                  <TableCell className="text-muted-foreground">{m.cost_estimate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.standard_reference}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleSection>

      {/* Recommendations */}
      <CollapsibleSection title={qra?.recommendationsTitle || "Recommendations"} count={results.recommendations?.length}>
        <div className="space-y-3">
          {results.recommendations?.map((rec) => (
            <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
              <Badge variant={rec.priority === "High" ? "destructive" : rec.priority === "Medium" ? "default" : "secondary"} className="shrink-0 mt-0.5">{rec.priority}</Badge>
              <div>
                <p className="text-sm font-medium">{rec.id}: {rec.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{rec.reference}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
};

function CollapsibleSection({ title, count, defaultOpen, children }: { title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {title}
                {count !== undefined && <Badge variant="secondary" className="text-xs">{count}</Badge>}
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default QraResults;
