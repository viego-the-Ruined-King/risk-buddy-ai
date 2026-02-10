import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import type { LopaScenario } from "@/pages/LopaStudy";
import { useLanguage } from "@/contexts/LanguageContext";

interface LopaWorksheetProps {
  lopaData: LopaScenario;
}

const LopaWorksheet = ({ lopaData }: LopaWorksheetProps) => {
  const { t } = useLanguage();
  const formatNumber = (num: number | undefined, decimals = 2): string => {
    if (num === undefined || num === null) return '-';
    if (num < 0.001 || num >= 1000) return num.toExponential(decimals);
    return num.toFixed(decimals);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
      <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-xl">{t.results.lopa.worksheetTitle}</CardTitle>
          <p className="text-xs text-muted-foreground">{t.results.lopa.perEgpc}</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            <div className="bg-card p-3"><p className="text-xs text-muted-foreground">{t.results.lopa.scenarioNumber}</p><p className="font-semibold">{lopaData.scenario_number}</p></div>
            <div className="bg-card p-3"><p className="text-xs text-muted-foreground">{t.results.lopa.equipmentNumber}</p><p className="font-semibold">{lopaData.equipment_number || '-'}</p></div>
            <div className="bg-card p-3 col-span-2"><p className="text-xs text-muted-foreground">{t.results.lopa.scenarioTitle}</p><p className="font-semibold">{lopaData.scenario_title}</p></div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
            <div className="bg-card p-3 col-span-2">
              <p className="text-xs text-muted-foreground">{t.results.lopa.consequenceDesc}</p>
              <p className="font-semibold">{lopaData.consequence_description}</p>
              <Badge variant="outline" className="mt-1">{lopaData.consequence_category}</Badge>
            </div>
            <div className="bg-card p-3">
              <p className="text-xs text-muted-foreground">{t.results.lopa.tmelLabel}</p>
              <p className="font-bold text-lg text-primary">{formatNumber(lopaData.tmel)}</p>
              <p className="text-xs text-muted-foreground">{lopaData.tmel_basis}</p>
            </div>
          </div>
          <Separator />

          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">{t.results.lopa.initiatingEvents}</h3>
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead>{t.results.lopa.initiatingEvent}</TableHead><TableHead className="text-right">{t.results.lopa.frequency}</TableHead><TableHead>{t.results.lopa.source}</TableHead></TableRow></TableHeader>
              <TableBody>{lopaData.initiating_events.map((ie, index) => <TableRow key={index}><TableCell className="font-medium">{ie.name}</TableCell><TableCell className="text-right font-mono">{formatNumber(ie.frequency)}</TableCell><TableCell className="text-sm text-muted-foreground">{ie.source}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
          <Separator />

          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">{t.results.lopa.ipls}</h3>
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead>{t.results.lopa.type}</TableHead><TableHead>{t.results.lopa.iplDescription}</TableHead><TableHead className="text-right">{t.results.lopa.pfd}</TableHead><TableHead>{t.results.lopa.source}</TableHead></TableRow></TableHeader>
              <TableBody>{lopaData.ipls.map((ipl, index) => <TableRow key={index}><TableCell><Badge variant="outline" className="text-xs">{ipl.type}</Badge></TableCell><TableCell className="font-medium">{ipl.name}</TableCell><TableCell className="text-right font-mono">{formatNumber(ipl.pfd)}</TableCell><TableCell className="text-sm text-muted-foreground">{ipl.source}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
          <Separator />

          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">{t.results.lopa.conditionalModifiers}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/30"><p className="text-xs text-muted-foreground">{t.results.lopa.timeAtRisk}</p><p className="font-mono font-bold">{formatNumber(lopaData.conditional_modifiers?.time_at_risk)}</p><p className="text-xs text-muted-foreground mt-1">{lopaData.conditional_modifiers?.time_at_risk_basis}</p></div>
              <div className="p-3 rounded-lg bg-muted/30"><p className="text-xs text-muted-foreground">{t.results.lopa.ignitionProbability}</p><p className="font-mono font-bold">{formatNumber(lopaData.conditional_modifiers?.ignition_probability)}</p><p className="text-xs text-muted-foreground mt-1">{lopaData.conditional_modifiers?.ignition_probability_basis}</p></div>
              <div className="p-3 rounded-lg bg-muted/30"><p className="text-xs text-muted-foreground">{t.results.lopa.vulnerability}</p><p className="font-mono font-bold">{formatNumber(lopaData.conditional_modifiers?.vulnerability)}</p><p className="text-xs text-muted-foreground mt-1">{lopaData.conditional_modifiers?.vulnerability_basis}</p></div>
            </div>
          </div>
          <Separator />

          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">{t.results.lopa.ielCalculation}</h3>
            <p className="text-xs text-muted-foreground mb-2">{t.results.lopa.ielFormula}</p>
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead>{t.results.lopa.initiatingEvent}</TableHead><TableHead className="text-right">{t.results.lopa.ief}</TableHead><TableHead className="text-right">{t.results.lopa.iplsProduct}</TableHead><TableHead className="text-right">{t.results.lopa.pec}</TableHead><TableHead className="text-right">{t.results.lopa.pcm}</TableHead><TableHead className="text-right">{t.results.lopa.iel}</TableHead></TableRow></TableHeader>
              <TableBody>
                {lopaData.iel_per_initiating_event.map((calc, index) => <TableRow key={index}><TableCell className="font-medium">{calc.initiating_event}</TableCell><TableCell className="text-right font-mono">{formatNumber(calc.ief)}</TableCell><TableCell className="text-right font-mono">{formatNumber(calc.ipls_product)}</TableCell><TableCell className="text-right font-mono">{formatNumber(calc.pec)}</TableCell><TableCell className="text-right font-mono">{formatNumber(calc.pcm)}</TableCell><TableCell className="text-right font-mono font-bold">{formatNumber(calc.iel)}</TableCell></TableRow>)}
                <TableRow className="bg-primary/10 font-bold"><TableCell colSpan={5} className="text-right">{t.results.lopa.totalMitigated}</TableCell><TableCell className="text-right font-mono">{formatNumber(lopaData.total_iel)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
          <Separator />

          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">{t.results.lopa.sifRequirements}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/30"><p className="text-xs text-muted-foreground">{t.results.lopa.pfdSafety}</p><p className="font-mono font-bold">{lopaData.pfd_target_safety ? formatNumber(lopaData.pfd_target_safety) : 'N/A'}</p><Badge variant="outline" className="mt-1">{lopaData.sil_safety || t.common.none}</Badge></div>
              <div className="p-3 rounded-lg bg-muted/30"><p className="text-xs text-muted-foreground">{t.results.lopa.pfdEnvironment}</p><p className="font-mono font-bold">{lopaData.pfd_target_environment ? formatNumber(lopaData.pfd_target_environment) : 'N/A'}</p><Badge variant="outline" className="mt-1">{lopaData.sil_environment || t.common.none}</Badge></div>
              <div className="p-3 rounded-lg bg-muted/30"><p className="text-xs text-muted-foreground">{t.results.lopa.pfdFinancial}</p><p className="font-mono font-bold">{lopaData.pfd_target_financial ? formatNumber(lopaData.pfd_target_financial) : 'N/A'}</p><Badge variant="outline" className="mt-1">{lopaData.sil_financial || t.common.none}</Badge></div>
              <div className="p-3 rounded-lg bg-primary/10 border-2 border-primary/30"><p className="text-xs text-muted-foreground">{t.results.lopa.silRequired}</p><p className="font-mono font-bold text-xl text-primary">{lopaData.sil_required || t.common.none}</p></div>
            </div>
          </div>
          <Separator />

          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">{t.results.lopa.recommendationsTitle}</h3>
            <div className="p-3 rounded-lg bg-muted/30"><p className="whitespace-pre-wrap">{lopaData.recommendations || t.results.lopa.noRecommendations}</p></div>
          </div>
          <Separator />

          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">{t.results.lopa.notesAssumptions}</h3>
            <div className="p-3 rounded-lg bg-muted/30 text-sm"><p className="whitespace-pre-wrap">{lopaData.notes_assumptions || t.results.lopa.noNotes}</p></div>
            {lopaData.hazop_study_id && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p>{t.results.lopa.linkedHazop}: {lopaData.hazop_study_id}</p>
                <p>{t.results.lopa.deviationId}: {lopaData.hazop_deviation_id}</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted/20 text-xs text-muted-foreground">
            <p>{t.results.lopa.reference}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LopaWorksheet;