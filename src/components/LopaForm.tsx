import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { LopaFormData, LopaScenario } from "@/pages/LopaStudy";

interface LopaFormProps {
  formData: LopaFormData;
  setFormData: (data: LopaFormData) => void;
  onLopaGenerated: (result: LopaScenario) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// EGPC Severity Levels with descriptions
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

const LopaForm = ({ formData, setFormData, onLopaGenerated, isLoading, setIsLoading }: LopaFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [availableHazopStudies, setAvailableHazopStudies] = useState<any[]>([]);
  const [selectedHazopDeviations, setSelectedHazopDeviations] = useState<any[]>([]);

  useEffect(() => {
    loadHazopStudies();
  }, []);

  useEffect(() => {
    if (formData.hazop_study_id) {
      loadHazopDeviations(formData.hazop_study_id);
    }
  }, [formData.hazop_study_id]);

  const loadHazopStudies = async () => {
    try {
      const { data, error } = await supabase
        .from('hazop_studies')
        .select('id, title, created_at, deviations')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableHazopStudies(data || []);
    } catch (error) {
      console.error('Error loading HAZOP studies:', error);
    }
  };

  const loadHazopDeviations = async (hazopStudyId: string) => {
    try {
      const study = availableHazopStudies.find(s => s.id === hazopStudyId);
      if (study?.deviations) {
        // Filter to high-risk deviations that qualify for LOPA
        const highRiskDeviations = (study.deviations as any[]).filter((d: any) => {
          const severity = d.initial_risk?.severity?.toUpperCase();
          const likelihood = d.initial_risk?.likelihood;
          // LOPA triggers: Severity A or B, or High risk level
          return severity === 'A' || severity === 'B' || d.initial_risk?.level === 'High';
        });
        setSelectedHazopDeviations(highRiskDeviations);
      }
    } catch (error) {
      console.error('Error loading deviations:', error);
    }
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
      case 'A': return 'Disastrous';
      case 'B': return 'Catastrophic';
      case 'C': return 'Major';
      case 'D': return 'Serious';
      case 'E': return 'Minor';
      case 'F': return 'Notable';
      default: return '';
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to generate a LOPA study.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.scenario_title || !formData.severity_level) {
      toast({
        title: "Validation Error",
        description: "Please provide a scenario title and severity level.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to generate LOPA study.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lopa-study`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            hazop_study_id: formData.hazop_study_id,
            hazop_deviation_id: formData.hazop_deviation_id,
            hazop_node_id: formData.hazop_node_id,
            hazop_deviation: formData.hazop_deviation,
            hazop_causes: formData.hazop_causes,
            hazop_consequences: formData.hazop_consequences,
            hazop_existing_safeguards: formData.hazop_existing_safeguards,
            hazop_initial_risk: formData.hazop_initial_risk,
            scenario_title: formData.scenario_title,
            equipment_number: formData.equipment_number,
            consequence_category: formData.consequence_category,
            severity_level: formData.severity_level,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      onLopaGenerated(data);

      toast({
        title: "LOPA Analysis Complete",
        description: `Generated LOPA for: ${formData.scenario_title}`,
      });
    } catch (error) {
      console.error('Error generating LOPA:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate LOPA study.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          LOPA Input Data
        </CardTitle>
        <CardDescription>
          Layer of Protection Analysis per EGPC-PSM-GL-015
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* HAZOP Linkage Section */}
        <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Link to HAZOP Scenario (Optional)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select HAZOP Study</Label>
              <Select
                value={formData.hazop_study_id || ''}
                onValueChange={(value) => setFormData({ ...formData, hazop_study_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a HAZOP study..." />
                </SelectTrigger>
                <SelectContent>
                  {availableHazopStudies.map((study) => (
                    <SelectItem key={study.id} value={study.id}>
                      {study.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select High-Risk Deviation</Label>
              <Select
                value={formData.hazop_deviation_id || ''}
                onValueChange={handleHazopDeviationSelect}
                disabled={!formData.hazop_study_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a deviation..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedHazopDeviations.length === 0 && (
                    <SelectItem value="none" disabled>
                      No high-risk deviations found
                    </SelectItem>
                  )}
                  {selectedHazopDeviations.map((dev) => (
                    <SelectItem key={dev.deviation_id} value={dev.deviation_id}>
                      <div className="flex items-center gap-2">
                        <span>{dev.deviation_id}: {dev.deviation}</span>
                        <Badge variant="destructive" className="text-[10px]">
                          {dev.initial_risk?.risk}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.hazop_initial_risk && (
            <div className="mt-4 p-3 rounded-md bg-background/50 space-y-2 text-sm">
              <p><strong>HAZOP Node:</strong> {formData.hazop_node_id}</p>
              <p><strong>Deviation:</strong> {formData.hazop_deviation}</p>
              <p><strong>Consequences:</strong> {formData.hazop_consequences}</p>
              <p><strong>Initial Risk:</strong> {formData.hazop_initial_risk.risk} ({formData.hazop_initial_risk.level})</p>
            </div>
          )}
        </div>

        {/* Scenario Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scenario_title">Scenario Title *</Label>
            <Input
              id="scenario_title"
              value={formData.scenario_title}
              onChange={(e) => setFormData({ ...formData, scenario_title: e.target.value })}
              placeholder="e.g., High pressure in reactor vessel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_number">Equipment Number</Label>
            <Input
              id="equipment_number"
              value={formData.equipment_number}
              onChange={(e) => setFormData({ ...formData, equipment_number: e.target.value })}
              placeholder="e.g., V-101"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Consequence Category</Label>
            <Select
              value={formData.consequence_category}
              onValueChange={(value) => setFormData({ ...formData, consequence_category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSEQUENCE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Severity Level (EGPC) *</Label>
            <Select
              value={formData.severity_level}
              onValueChange={(value) => setFormData({ ...formData, severity_level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity..." />
              </SelectTrigger>
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

        <Button
          onClick={handleGenerate}
          disabled={isLoading || !formData.scenario_title || !formData.severity_level}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating LOPA Analysis...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Generate LOPA Analysis
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LopaForm;
