import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Shield, Info, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { LopaFormData, LopaScenario } from "@/pages/LopaStudy";
import { useLanguage } from "@/contexts/LanguageContext";
import StartStudyButton from "@/components/StartStudyButton";
import {
  TMEL_BY_SEVERITY,
  INITIATING_EVENT_FREQUENCIES,
  IPL_PFD_VALUES,
  TIME_AT_RISK_OPTIONS,
  IGNITION_PROBABILITY_OPTIONS,
  VULNERABILITY_OPTIONS,
  calculateIELsForAllEvents,
  calculateSILRequirements,
  checkIPLIndependence,
} from "@/utils/lopaCalculations";

interface LopaFormProps {
  formData: LopaFormData;
  setFormData: (data: LopaFormData) => void;
  onLopaGenerated: (result: LopaScenario) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SEVERITY_LEVELS = [
  { value: 'Disastrous', label: 'A - Disastrous', description: 'Multiple fatalities', tmel: '1E-06' },
  { value: 'Catastrophic', label: 'B - Catastrophic', description: 'Single fatality / Multiple serious injuries', tmel: '1E-05' },
  { value: 'Major', label: 'C - Major', description: 'Permanent disability / Serious injury', tmel: '1E-04' },
  { value: 'Serious', label: 'D - Serious', description: 'Lost workday case / Medical treatment', tmel: '1E-03' },
  { value: 'Minor', label: 'E - Minor', description: 'First aid case / Minor injury', tmel: '1E-02' },
  { value: 'Notable', label: 'F - Notable', description: 'Near miss / No injury', tmel: '1E-01' },
];

const CONSEQUENCE_CATEGORIES = [
  { value: 'People', label: 'People (Safety)' },
  { value: 'Environment', label: 'Environment' },
  { value: 'Assets', label: 'Assets (Financial)' },
];

interface InitiatingEventInput {
  name: string;
  frequency: number;
  source: string;
}

interface IPLInput {
  type: string;
  name: string;
  pfd: number;
  source: string;
}

const LopaForm = ({ formData, setFormData, onLopaGenerated, isLoading, setIsLoading }: LopaFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [availableHazopStudies, setAvailableHazopStudies] = useState<any[]>([]);
  const [selectedHazopDeviations, setSelectedHazopDeviations] = useState<any[]>([]);

  // Interactive LOPA inputs
  const [initiatingEvents, setInitiatingEvents] = useState<InitiatingEventInput[]>([
    { name: '', frequency: 0.1, source: 'EGPC Annex A' },
  ]);
  const [ipls, setIpls] = useState<IPLInput[]>([]);
  const [enablingCondition, setEnablingCondition] = useState({ description: '', probability: 1 });
  const [timeAtRisk, setTimeAtRisk] = useState(1);
  const [timeAtRiskBasis, setTimeAtRiskBasis] = useState('Continuous operation');
  const [ignitionProbability, setIgnitionProbability] = useState(1);
  const [ignitionProbabilityBasis, setIgnitionProbabilityBasis] = useState('Continuous ignition source present');
  const [vulnerability, setVulnerability] = useState(1);
  const [vulnerabilityBasis, setVulnerabilityBasis] = useState('Direct exposure, no escape');
  const [independenceWarnings, setIndependenceWarnings] = useState<string[]>([]);
  const [useAiSuggestion, setUseAiSuggestion] = useState(false);

  useEffect(() => { loadHazopStudies(); }, []);
  useEffect(() => { if (formData.hazop_study_id) loadHazopDeviations(formData.hazop_study_id); }, [formData.hazop_study_id]);

  // Check IPL independence whenever events or IPLs change
  useEffect(() => {
    const warnings: string[] = [];
    for (const ie of initiatingEvents) {
      for (const ipl of ipls) {
        const warning = checkIPLIndependence(ie.name, ipl.name);
        if (warning) warnings.push(warning);
      }
    }
    setIndependenceWarnings([...new Set(warnings)]);
  }, [initiatingEvents, ipls]);

  const loadHazopStudies = async () => {
    try {
      const { data, error } = await supabase.from('hazop_studies').select('id, title, created_at, deviations').order('created_at', { ascending: false });
      if (error) throw error;
      setAvailableHazopStudies(data || []);
    } catch (error) { console.error('Error:', error); }
  };

  const loadHazopDeviations = async (hazopStudyId: string) => {
    try {
      const study = availableHazopStudies.find(s => s.id === hazopStudyId);
      if (study?.deviations) {
        const highRiskDeviations = (study.deviations as any[]).filter((d: any) => {
          const severity = d.initial_risk?.severity?.toUpperCase();
          return severity === 'A' || severity === 'B' || d.initial_risk?.level === 'High';
        });
        setSelectedHazopDeviations(highRiskDeviations);
      }
    } catch (error) { console.error('Error:', error); }
  };

  const handleHazopDeviationSelect = (deviationId: string) => {
    const deviation = selectedHazopDeviations.find(d => d.deviation_id === deviationId);
    if (deviation) {
      setFormData({
        ...formData,
        hazop_deviation_id: deviationId,
        scenario_title: deviation.deviation || '',
        equipment_number: deviation.node_id || '',
        severity_level: mapSeverity(deviation.initial_risk?.severity),
        hazop_node_id: deviation.node_id,
        hazop_deviation: deviation.deviation,
        hazop_causes: deviation.causes || [],
        hazop_consequences: deviation.consequences_unmitigated || '',
        hazop_existing_safeguards: deviation.existing_safeguards || [],
        hazop_initial_risk: deviation.initial_risk,
      });
    }
  };

  const mapSeverity = (severity?: string): string => {
    if (!severity) return '';
    switch (severity.toUpperCase()) {
      case 'A': return 'Disastrous'; case 'B': return 'Catastrophic'; case 'C': return 'Major';
      case 'D': return 'Serious'; case 'E': return 'Minor'; case 'F': return 'Notable'; default: return '';
    }
  };

  // Add/Remove initiating events
  const addInitiatingEvent = () => setInitiatingEvents([...initiatingEvents, { name: '', frequency: 0.1, source: 'EGPC Annex A' }]);
  const removeInitiatingEvent = (index: number) => setInitiatingEvents(initiatingEvents.filter((_, i) => i !== index));
  const updateInitiatingEvent = (index: number, field: keyof InitiatingEventInput, value: any) => {
    const updated = [...initiatingEvents];
    updated[index] = { ...updated[index], [field]: value };
    // If selecting a known event, auto-populate frequency
    if (field === 'name' && INITIATING_EVENT_FREQUENCIES[value] !== undefined) {
      updated[index].frequency = INITIATING_EVENT_FREQUENCIES[value];
      updated[index].source = `EGPC Annex A - ${value}`;
    }
    setInitiatingEvents(updated);
  };

  // Add/Remove IPLs
  const addIPL = () => setIpls([...ipls, { type: 'Active', name: '', pfd: 0.1, source: 'EGPC Annex B' }]);
  const removeIPL = (index: number) => setIpls(ipls.filter((_, i) => i !== index));
  const updateIPL = (index: number, field: keyof IPLInput, value: any) => {
    const updated = [...ipls];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'name' && IPL_PFD_VALUES[value] !== undefined) {
      updated[index].pfd = IPL_PFD_VALUES[value];
      updated[index].source = `EGPC Annex B - ${value}`;
      // Auto-detect type
      if (value.startsWith('SIS')) updated[index].type = 'Active';
      else if (['Dike', 'Flame', 'Blast', 'Fire-resistant', 'Overflow', 'Drainage', 'Permanent', 'Open vent'].some(p => value.startsWith(p))) updated[index].type = 'Passive';
      else if (value.startsWith('Operator')) updated[index].type = 'Human';
      else updated[index].type = 'Active';
    }
    setIpls(updated);
  };

  // AI-assisted suggestion mode
  const handleAiSuggest = async () => {
    if (!user) { toast({ title: t.common.error, description: "Please log in.", variant: "destructive" }); return; }
    if (!formData.scenario_title || !formData.severity_level) {
      toast({ title: t.forms.lopa.validationError, description: t.forms.lopa.validationErrorDesc, variant: "destructive" }); return;
    }
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in.');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lopa-study`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({
            hazop_study_id: formData.hazop_study_id, hazop_deviation_id: formData.hazop_deviation_id,
            hazop_node_id: formData.hazop_node_id, hazop_deviation: formData.hazop_deviation,
            hazop_causes: formData.hazop_causes, hazop_consequences: formData.hazop_consequences,
            hazop_existing_safeguards: formData.hazop_existing_safeguards, hazop_initial_risk: formData.hazop_initial_risk,
            scenario_title: formData.scenario_title, equipment_number: formData.equipment_number,
            consequence_category: formData.consequence_category, severity_level: formData.severity_level,
          }),
        }
      );
      if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw new Error(errorData.error || `Failed ${response.status}`); }
      const data = await response.json();

      // Populate AI suggestions into the interactive grid — user must review
      if (data.initiating_events?.length) {
        setInitiatingEvents(data.initiating_events.map((ie: any) => ({
          name: ie.name || '',
          frequency: typeof ie.frequency === 'number' ? ie.frequency : 0.1,
          source: ie.source || 'EGPC Annex A',
        })));
      }
      if (data.ipls?.length) {
        setIpls(data.ipls.map((ipl: any) => ({
          type: ipl.type || 'Active',
          name: ipl.name || '',
          pfd: typeof ipl.pfd === 'number' ? ipl.pfd : 0.1,
          source: ipl.source || 'EGPC Annex B',
        })));
      }
      if (data.conditional_modifiers) {
        const cm = data.conditional_modifiers;
        if (cm.time_at_risk) { setTimeAtRisk(cm.time_at_risk); setTimeAtRiskBasis(cm.time_at_risk_basis || 'Continuous operation'); }
        if (cm.ignition_probability) { setIgnitionProbability(cm.ignition_probability); setIgnitionProbabilityBasis(cm.ignition_probability_basis || 'Continuous ignition source present'); }
        if (cm.vulnerability) { setVulnerability(cm.vulnerability); setVulnerabilityBasis(cm.vulnerability_basis || 'Direct exposure, no escape'); }
      }
      if (data.enabling_conditions) {
        setEnablingCondition({ description: data.enabling_conditions.description || '', probability: data.enabling_conditions.probability || 1 });
      }

      setUseAiSuggestion(true);
      toast({ title: t.common.success, description: "AI suggestions loaded. Please review and edit all values before calculating." });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t.common.error, description: error instanceof Error ? error.message : "Failed.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  // Calculate locally (NO AI involved)
  const handleCalculate = () => {
    if (!formData.severity_level) {
      toast({ title: t.forms.lopa.validationError, description: "Please select a severity level.", variant: "destructive" }); return;
    }
    if (initiatingEvents.length === 0 || !initiatingEvents[0].name) {
      toast({ title: t.forms.lopa.validationError, description: "Please add at least one initiating event.", variant: "destructive" }); return;
    }

    const tmel = TMEL_BY_SEVERITY[formData.severity_level] || 1e-4;
    const { calculations, totalIEL } = calculateIELsForAllEvents(
      initiatingEvents,
      ipls,
      enablingCondition.probability,
      timeAtRisk,
      ignitionProbability,
      vulnerability
    );
    const silResult = calculateSILRequirements(totalIEL, tmel);

    const result: LopaScenario = {
      scenario_number: `LOPA-${Date.now().toString().slice(-6)}`,
      equipment_number: formData.equipment_number,
      scenario_title: formData.scenario_title,
      consequence_description: formData.hazop_consequences || formData.scenario_title,
      consequence_category: formData.consequence_category,
      severity_level: formData.severity_level,
      tmel,
      tmel_basis: `EGPC Table 1 - ${formData.severity_level}`,
      hazop_study_id: formData.hazop_study_id,
      hazop_deviation_id: formData.hazop_deviation_id,
      hazop_node_id: formData.hazop_node_id,
      hazop_deviation: formData.hazop_deviation,
      hazop_causes: formData.hazop_causes,
      hazop_consequences: formData.hazop_consequences,
      hazop_existing_safeguards: formData.hazop_existing_safeguards,
      hazop_initial_risk: formData.hazop_initial_risk,
      initiating_events: initiatingEvents.map(ie => ({ ...ie, source: ie.source || 'User Defined' })),
      ipls: ipls.map(ipl => ({ ...ipl, source: ipl.source || 'User Defined', is_valid: true, validation_notes: '' })),
      enabling_conditions: enablingCondition,
      conditional_modifiers: {
        time_at_risk: timeAtRisk,
        time_at_risk_basis: timeAtRiskBasis,
        ignition_probability: ignitionProbability,
        ignition_probability_basis: ignitionProbabilityBasis,
        vulnerability,
        vulnerability_basis: vulnerabilityBasis,
      },
      iel_per_initiating_event: calculations,
      total_iel: totalIEL,
      iel_vs_tmel: silResult.iel_vs_tmel,
      pfd_target: silResult.pfd_target,
      pfd_target_safety: formData.consequence_category === 'People' ? silResult.pfd_target : null,
      pfd_target_environment: formData.consequence_category === 'Environment' ? silResult.pfd_target : null,
      pfd_target_financial: formData.consequence_category === 'Assets' ? silResult.pfd_target : null,
      sil_required: silResult.sil_required,
      sil_safety: formData.consequence_category === 'People' ? silResult.sil_required : 'None',
      sil_environment: formData.consequence_category === 'Environment' ? silResult.sil_required : 'None',
      sil_financial: formData.consequence_category === 'Assets' ? silResult.sil_required : 'None',
      recommendations: silResult.iel_vs_tmel === 'ACCEPTABLE'
        ? 'Risk is tolerable. Maintain existing protection layers.'
        : `Additional ${silResult.sil_required} protection required. Consider adding an independent SIF or additional IPLs to achieve the required risk reduction.`,
      notes_assumptions: 'All IEF and PFD values sourced from EGPC-PSM-GL-015 Annex A & B unless otherwise noted. User has reviewed and approved all inputs.',
      egpc_reference: 'EGPC-PSM-GL-015 Rev 0, Nov 2022',
    };

    onLopaGenerated(result);
    toast({ title: t.common.success, description: "LOPA calculation complete. Review results below." });
  };

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t.forms.lopa.title}
        </CardTitle>
        <CardDescription>{t.forms.lopa.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* HAZOP Link Section */}
        <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t.forms.lopa.linkHazop}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.forms.lopa.selectHazopStudy}</Label>
              <Select value={formData.hazop_study_id || ''} onValueChange={(value) => setFormData({ ...formData, hazop_study_id: value })}>
                <SelectTrigger><SelectValue placeholder={t.forms.lopa.selectHazopStudyPlaceholder} /></SelectTrigger>
                <SelectContent>{availableHazopStudies.map((study) => <SelectItem key={study.id} value={study.id}>{study.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.forms.lopa.selectDeviation}</Label>
              <Select value={formData.hazop_deviation_id || ''} onValueChange={handleHazopDeviationSelect} disabled={!formData.hazop_study_id}>
                <SelectTrigger><SelectValue placeholder={t.forms.lopa.selectDeviationPlaceholder} /></SelectTrigger>
                <SelectContent>
                  {selectedHazopDeviations.length === 0 && <SelectItem value="none" disabled>{t.forms.lopa.noHighRiskDeviations}</SelectItem>}
                  {selectedHazopDeviations.map((dev) => (
                    <SelectItem key={dev.deviation_id} value={dev.deviation_id}>
                      <div className="flex items-center gap-2">
                        <span>{dev.deviation_id}: {dev.deviation}</span>
                        <Badge variant="destructive" className="text-[10px]">{dev.initial_risk?.risk}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {formData.hazop_initial_risk && (
            <div className="mt-4 p-3 rounded-md bg-background/50 space-y-2 text-sm">
              <p><strong>{t.forms.lopa.hazopNode}:</strong> {formData.hazop_node_id}</p>
              <p><strong>{t.forms.lopa.deviation}:</strong> {formData.hazop_deviation}</p>
              <p><strong>{t.forms.lopa.consequences}:</strong> {formData.hazop_consequences}</p>
              <p><strong>{t.forms.lopa.initialRisk}:</strong> {formData.hazop_initial_risk.risk} ({formData.hazop_initial_risk.level})</p>
            </div>
          )}
        </div>

        {/* Scenario Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t.forms.lopa.scenarioTitle}</Label>
            <Input value={formData.scenario_title} onChange={(e) => setFormData({ ...formData, scenario_title: e.target.value })} placeholder={t.forms.lopa.scenarioTitlePlaceholder} />
          </div>
          <div className="space-y-2">
            <Label>{t.forms.lopa.equipmentNumber}</Label>
            <Input value={formData.equipment_number} onChange={(e) => setFormData({ ...formData, equipment_number: e.target.value })} placeholder={t.forms.lopa.equipmentNumberPlaceholder} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t.forms.lopa.consequenceCategory}</Label>
            <Select value={formData.consequence_category} onValueChange={(value) => setFormData({ ...formData, consequence_category: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONSEQUENCE_CATEGORIES.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.forms.lopa.severityLevel}</Label>
            <Select value={formData.severity_level} onValueChange={(value) => setFormData({ ...formData, severity_level: value })}>
              <SelectTrigger><SelectValue placeholder={t.forms.lopa.severityPlaceholder} /></SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex flex-col">
                      <span>{level.label}</span>
                      <span className="text-xs text-muted-foreground">{level.description} (TMEL: {level.tmel})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Initiating Events (EGPC Annex A) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-primary">Initiating Events (EGPC Annex A)</h3>
            <Button type="button" variant="outline" size="sm" onClick={addInitiatingEvent}><Plus className="h-4 w-4 mr-1" /> Add Event</Button>
          </div>
          {initiatingEvents.map((ie, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="md:col-span-5 space-y-1">
                <Label className="text-xs">Event</Label>
                <Select value={ie.name} onValueChange={(v) => updateInitiatingEvent(index, 'name', v)}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select event..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INITIATING_EVENT_FREQUENCIES).map(([name, freq]) => (
                      <SelectItem key={name} value={name}>
                        <span className="text-xs">{name} ({freq})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label className="text-xs">Frequency (/yr)</Label>
                <Input type="number" step="any" value={ie.frequency} onChange={(e) => updateInitiatingEvent(index, 'frequency', parseFloat(e.target.value) || 0)} className="text-xs font-mono" />
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label className="text-xs">Source</Label>
                <Input value={ie.source} onChange={(e) => updateInitiatingEvent(index, 'source', e.target.value)} className="text-xs" />
              </div>
              <div className="md:col-span-1 flex justify-end">
                {initiatingEvents.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeInitiatingEvent(index)} className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* IPLs (EGPC Annex B) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-primary">Independent Protection Layers (EGPC Annex B)</h3>
            <Button type="button" variant="outline" size="sm" onClick={addIPL}><Plus className="h-4 w-4 mr-1" /> Add IPL</Button>
          </div>
          {ipls.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">No IPLs added. Click "Add IPL" to define protection layers.</p>
          )}
          {ipls.map((ipl, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={ipl.type} onValueChange={(v) => updateIPL(index, 'type', v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Passive">Passive</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Human">Human</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4 space-y-1">
                <Label className="text-xs">IPL</Label>
                <Select value={ipl.name} onValueChange={(v) => updateIPL(index, 'name', v)}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select IPL..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(IPL_PFD_VALUES).map(([name, pfd]) => (
                      <SelectItem key={name} value={name}>
                        <span className="text-xs">{name} (PFD: {pfd})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">PFD</Label>
                <Input type="number" step="any" value={ipl.pfd} onChange={(e) => updateIPL(index, 'pfd', parseFloat(e.target.value) || 0)} className="text-xs font-mono" />
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label className="text-xs">Source</Label>
                <Input value={ipl.source} onChange={(e) => updateIPL(index, 'source', e.target.value)} className="text-xs" />
              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeIPL(index)} className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* IPL Independence Warning */}
          {independenceWarnings.length > 0 && (
            <Alert className="bg-amber-500/10 border-amber-500/50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200/90 text-sm">
                {independenceWarnings.map((w, i) => <p key={i}>{w}</p>)}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Enabling Condition */}
        <div className="space-y-4">
          <h3 className="font-semibold text-primary">Enabling Condition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Input value={enablingCondition.description} onChange={(e) => setEnablingCondition({ ...enablingCondition, description: e.target.value })} placeholder="e.g., Operator present in area" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Probability (0-1)</Label>
              <Input type="number" step="0.01" min="0" max="1" value={enablingCondition.probability} onChange={(e) => setEnablingCondition({ ...enablingCondition, probability: parseFloat(e.target.value) || 1 })} className="font-mono" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Conditional Modifiers (EGPC Annex C) */}
        <div className="space-y-4">
          <h3 className="font-semibold text-primary">Conditional Modifiers (EGPC Annex C)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Time at Risk</Label>
              <Select value={timeAtRiskBasis} onValueChange={(v) => { setTimeAtRiskBasis(v); setTimeAtRisk(TIME_AT_RISK_OPTIONS[v] || 1); }}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIME_AT_RISK_OPTIONS).map(([name, val]) => (
                    <SelectItem key={name} value={name}><span className="text-xs">{name} ({val})</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground font-mono">Value: {timeAtRisk}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Ignition Probability</Label>
              <Select value={ignitionProbabilityBasis} onValueChange={(v) => { setIgnitionProbabilityBasis(v); setIgnitionProbability(IGNITION_PROBABILITY_OPTIONS[v] || 1); }}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(IGNITION_PROBABILITY_OPTIONS).map(([name, val]) => (
                    <SelectItem key={name} value={name}><span className="text-xs">{name} ({val})</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground font-mono">Value: {ignitionProbability}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Vulnerability</Label>
              <Select value={vulnerabilityBasis} onValueChange={(v) => { setVulnerabilityBasis(v); setVulnerability(VULNERABILITY_OPTIONS[v] || 1); }}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(VULNERABILITY_OPTIONS).map(([name, val]) => (
                    <SelectItem key={name} value={name}><span className="text-xs">{name} ({val})</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground font-mono">Value: {vulnerability}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleAiSuggest} disabled={isLoading || !formData.scenario_title || !formData.severity_level} variant="outline" className="flex-1">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Getting AI Suggestions...</>
                ) : (
                  <><Info className="mr-2 h-4 w-4" />Get AI Draft Suggestions</>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>AI suggests initiating events & IPLs. You review & edit before calculating.</p></TooltipContent>
          </Tooltip>

          <StartStudyButton
            onClick={handleCalculate}
            disabled={!formData.scenario_title || !formData.severity_level || !initiatingEvents[0]?.name}
            label="CALCULATE LOPA"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Info className="h-3 w-3" /> All calculations use hardcoded EGPC Annex values. No AI math involved.
        </p>
      </CardContent>
    </Card>
  );
};

export default LopaForm;
