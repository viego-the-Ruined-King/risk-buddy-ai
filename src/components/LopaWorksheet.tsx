import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import type { LopaScenario } from "@/pages/LopaStudy";

interface LopaWorksheetProps {
  lopaData: LopaScenario;
}

const LopaWorksheet = ({ lopaData }: LopaWorksheetProps) => {
  const formatNumber = (num: number | undefined, decimals = 2): string => {
    if (num === undefined || num === null) return '-';
    if (num < 0.001 || num >= 1000) {
      return num.toExponential(decimals);
    }
    return num.toFixed(decimals);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-xl">
            LOPA Worksheet - Annex D Format
          </CardTitle>
          <p className="text-xs text-muted-foreground">Per EGPC-PSM-GL-015</p>
        </CardHeader>
        <CardContent className="p-0">
          {/* Scenario Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            <div className="bg-card p-3">
              <p className="text-xs text-muted-foreground">Scenario Number</p>
              <p className="font-semibold">{lopaData.scenario_number}</p>
            </div>
            <div className="bg-card p-3">
              <p className="text-xs text-muted-foreground">Equipment Number</p>
              <p className="font-semibold">{lopaData.equipment_number || '-'}</p>
            </div>
            <div className="bg-card p-3 col-span-2">
              <p className="text-xs text-muted-foreground">Scenario Title</p>
              <p className="font-semibold">{lopaData.scenario_title}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
            <div className="bg-card p-3 col-span-2">
              <p className="text-xs text-muted-foreground">Consequence Description / Category</p>
              <p className="font-semibold">{lopaData.consequence_description}</p>
              <Badge variant="outline" className="mt-1">{lopaData.consequence_category}</Badge>
            </div>
            <div className="bg-card p-3">
              <p className="text-xs text-muted-foreground">Target Mitigated Event Likelihood (TMEL)</p>
              <p className="font-bold text-lg text-primary">{formatNumber(lopaData.tmel)}</p>
              <p className="text-xs text-muted-foreground">{lopaData.tmel_basis}</p>
            </div>
          </div>

          <Separator />

          {/* Initiating Events */}
          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">Initiating Events</h3>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Initiating Event</TableHead>
                  <TableHead className="text-right">Frequency (per year)</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lopaData.initiating_events.map((ie, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{ie.name}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(ie.frequency)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ie.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Independent Protection Layers */}
          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">Layers of Protection (IPLs)</h3>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">PFD</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lopaData.ipls.map((ipl, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {ipl.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{ipl.name}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(ipl.pfd)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ipl.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Conditional Modifiers */}
          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">Conditional Modifiers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Time at Risk</p>
                <p className="font-mono font-bold">{formatNumber(lopaData.conditional_modifiers?.time_at_risk)}</p>
                <p className="text-xs text-muted-foreground mt-1">{lopaData.conditional_modifiers?.time_at_risk_basis}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Ignition Probability</p>
                <p className="font-mono font-bold">{formatNumber(lopaData.conditional_modifiers?.ignition_probability)}</p>
                <p className="text-xs text-muted-foreground mt-1">{lopaData.conditional_modifiers?.ignition_probability_basis}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Vulnerability</p>
                <p className="font-mono font-bold">{formatNumber(lopaData.conditional_modifiers?.vulnerability)}</p>
                <p className="text-xs text-muted-foreground mt-1">{lopaData.conditional_modifiers?.vulnerability_basis}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* IEL Calculation */}
          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">IEL Calculation</h3>
            <p className="text-xs text-muted-foreground mb-2">IEL = IEF × Π(PFD of IPLs) × PEC × PCM</p>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Initiating Event</TableHead>
                  <TableHead className="text-right">IEF</TableHead>
                  <TableHead className="text-right">IPLs Product</TableHead>
                  <TableHead className="text-right">PEC</TableHead>
                  <TableHead className="text-right">PCM</TableHead>
                  <TableHead className="text-right">IEL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lopaData.iel_per_initiating_event.map((calc, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{calc.initiating_event}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(calc.ief)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(calc.ipls_product)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(calc.pec)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(calc.pcm)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatNumber(calc.iel)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={5} className="text-right">Total Mitigated Event Frequency:</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(lopaData.total_iel)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* SIF Requirements */}
          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">SIF Requirements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">PFD Target (Safety)</p>
                <p className="font-mono font-bold">{lopaData.pfd_target_safety ? formatNumber(lopaData.pfd_target_safety) : 'N/A'}</p>
                <Badge variant="outline" className="mt-1">{lopaData.sil_safety || 'None'}</Badge>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">PFD Target (Environment)</p>
                <p className="font-mono font-bold">{lopaData.pfd_target_environment ? formatNumber(lopaData.pfd_target_environment) : 'N/A'}</p>
                <Badge variant="outline" className="mt-1">{lopaData.sil_environment || 'None'}</Badge>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">PFD Target (Financial)</p>
                <p className="font-mono font-bold">{lopaData.pfd_target_financial ? formatNumber(lopaData.pfd_target_financial) : 'N/A'}</p>
                <Badge variant="outline" className="mt-1">{lopaData.sil_financial || 'None'}</Badge>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
                <p className="text-xs text-muted-foreground">SIL Required</p>
                <p className="font-mono font-bold text-xl text-primary">{lopaData.sil_required || 'None'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recommendations */}
          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">Recommendations</h3>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="whitespace-pre-wrap">{lopaData.recommendations || 'No additional recommendations.'}</p>
            </div>
          </div>

          <Separator />

          {/* Notes and Assumptions */}
          <div className="p-4">
            <h3 className="font-semibold mb-2 text-primary">Notes and Assumptions</h3>
            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <p className="whitespace-pre-wrap">{lopaData.notes_assumptions || 'No additional notes.'}</p>
            </div>
            {lopaData.hazop_study_id && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Linked to HAZOP: {lopaData.hazop_study_id}</p>
                <p>Deviation ID: {lopaData.hazop_deviation_id}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-muted/20 text-xs text-muted-foreground">
            <p>Reference: EGPC-PSM-GL-015 - Layer of Protection Analysis (LOPA) Guideline, Rev 0, Nov 2022</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LopaWorksheet;
