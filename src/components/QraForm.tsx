import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import FileUpload from "@/components/FileUpload";
import { Loader2, BarChart3, Plus, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { QraFormInputs, QraStudyData } from "@/pages/QraStudy";

interface QraFormProps {
  onResultsGenerated: (data: QraStudyData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onFormDataChange: (data: QraFormInputs) => void;
  initialData: QraFormInputs;
  onNewStudy: () => void;
}

const QraForm = ({ onResultsGenerated, isLoading, setIsLoading, onFormDataChange, initialData, onNewStudy }: QraFormProps) => {
  const [formData, setFormData] = useState<QraFormInputs>(initialData);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; type: string; base64: string; size: number }>>([]);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => { setFormData(initialData); }, [initialData]);

  const updateField = (field: keyof QraFormInputs, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onFormDataChange(updated);
  };

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      toast({ title: t.forms.hazop?.validationError || "Validation Error", description: "Please enter a study title.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke('qra-study', {
        body: { ...formData, images: uploadedFiles.map(f => ({ base64: f.base64, type: f.type, name: f.name })) },
      });

      if (response.error) throw new Error(response.error.message || "Failed to generate QRA study");

      const data = response.data;
      if (!data || !data.failure_cases) throw new Error("Invalid response format");

      onResultsGenerated(data);
      toast({ title: t.common.success, description: "QRA study generated successfully." });
    } catch (error: any) {
      console.error("QRA generation error:", error);
      toast({ title: t.common.error, description: error.message || "Failed to generate QRA study", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const qra = (t.forms as any)?.qra;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>{qra?.title || "QRA Study Input"}</CardTitle>
              <CardDescription>{qra?.subtitle || "Quantitative Risk Assessment per EGPC-PSM-GL-008"}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onNewStudy}>
            <Plus className="h-4 w-4 mr-1" />
            {t.forms.hazop?.newStudy || "New Study"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scope" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scope">{qra?.scopeTab || "Scope"}</TabsTrigger>
            <TabsTrigger value="facility">{qra?.facilityTab || "Facility Data"}</TabsTrigger>
            <TabsTrigger value="assumptions">{qra?.assumptionsTab || "Assumptions"}</TabsTrigger>
            <TabsTrigger value="criteria">{qra?.criteriaTab || "Risk Criteria"}</TabsTrigger>
          </TabsList>

          <TabsContent value="scope" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{qra?.studyTitle || "Study Title"} *</Label>
              <Input value={formData.title} onChange={(e) => updateField('title', e.target.value)} placeholder={qra?.studyTitlePlaceholder || "e.g., Gas Processing Facility QRA"} />
            </div>
            <div className="space-y-2">
              <Label>{qra?.facilityDescription || "Facility Description"}</Label>
              <Textarea value={formData.facility_description} onChange={(e) => updateField('facility_description', e.target.value)} placeholder={qra?.facilityDescPlaceholder || "Type, location, materials handled..."} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{qra?.objective || "QRA Objective"}</Label>
                <Select value={formData.objective} onValueChange={(v) => updateField('objective', v)}>
                  <SelectTrigger><SelectValue placeholder={qra?.objectivePlaceholder || "Select objective..."} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Legal/Regulatory Requirement">Legal/Regulatory Requirement</SelectItem>
                    <SelectItem value="Engineering Decision Support">Engineering Decision Support</SelectItem>
                    <SelectItem value="Safety Case Development">Safety Case Development</SelectItem>
                    <SelectItem value="Land Use Planning">Land Use Planning</SelectItem>
                    <SelectItem value="ALARP Demonstration">ALARP Demonstration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{qra?.riskTypes || "Risk Types to Evaluate"}</Label>
                <Select value={formData.risk_types} onValueChange={(v) => updateField('risk_types', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual Risk Only</SelectItem>
                    <SelectItem value="Societal">Societal Risk Only</SelectItem>
                    <SelectItem value="Both">Both Individual & Societal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{qra?.lifecyclePhase || "Lifecycle Phase"}</Label>
                <Select value={formData.lifecycle_phase} onValueChange={(v) => updateField('lifecycle_phase', v)}>
                  <SelectTrigger><SelectValue placeholder={qra?.lifecyclePlaceholder || "Select phase..."} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Greenfield Concept">Greenfield Concept</SelectItem>
                    <SelectItem value="FEED">FEED</SelectItem>
                    <SelectItem value="Detailed Engineering">Detailed Engineering</SelectItem>
                    <SelectItem value="Brownfield Modification">Brownfield Modification</SelectItem>
                    <SelectItem value="Operation">Operation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{qra?.scopeBoundaries || "Scope Boundaries"}</Label>
                <Textarea value={formData.scope_boundaries} onChange={(e) => updateField('scope_boundaries', e.target.value)} placeholder={qra?.scopeBoundariesPlaceholder || "Facilities/personnel included and excluded..."} rows={2} />
              </div>
            </div>
            <FileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
          </TabsContent>

          <TabsContent value="facility" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{qra?.materialsInventory || "Hazardous Materials Inventory"}</Label>
              <Textarea value={formData.materials_inventory} onChange={(e) => updateField('materials_inventory', e.target.value)} placeholder={qra?.materialsPlaceholder || "Material, phase, quantity, operating conditions..."} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{qra?.isolatableSections || "Isolatable Sections"}</Label>
              <Textarea value={formData.isolatable_sections} onChange={(e) => updateField('isolatable_sections', e.target.value)} placeholder={qra?.isolatablePlaceholder || "Describe isolatable sections with ESD valves..."} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{qra?.equipmentList || "Equipment List"}</Label>
              <Textarea value={formData.equipment_list} onChange={(e) => updateField('equipment_list', e.target.value)} placeholder={qra?.equipmentPlaceholder || "Vessels, piping, tanks, pipelines with sizes..."} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{qra?.operatingParams || "Operating Parameters"}</Label>
              <Textarea value={formData.operating_parameters} onChange={(e) => updateField('operating_parameters', e.target.value)} placeholder={qra?.operatingPlaceholder || "Pressure, temperature, flow rates..."} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{qra?.manningData || "Manning / Population Data"}</Label>
              <Textarea value={formData.manning_data} onChange={(e) => updateField('manning_data', e.target.value)} placeholder={qra?.manningPlaceholder || "Onsite workers, shifts, nearby public locations..."} rows={3} />
            </div>
          </TabsContent>

          <TabsContent value="assumptions" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{qra?.holeSizes || "Hole Sizes for Failure Cases"}</Label>
              <Textarea value={formData.hole_sizes} onChange={(e) => updateField('hole_sizes', e.target.value)} placeholder={qra?.holeSizesPlaceholder || "Default: Small 5mm, Medium 25mm, Large 100mm, Rupture = full bore"} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{qra?.weatherData || "Weather / Meteorological Data"}</Label>
              <Textarea value={formData.weather_data} onChange={(e) => updateField('weather_data', e.target.value)} placeholder={qra?.weatherPlaceholder || "Wind speed, direction, stability class, temperature, humidity..."} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{qra?.ignitionProb || "Ignition Probability Assumptions"}</Label>
              <Textarea value={formData.ignition_probability} onChange={(e) => updateField('ignition_probability', e.target.value)} placeholder={qra?.ignitionPlaceholder || "Immediate, delayed ignition probabilities per IOGP..."} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{qra?.vulnerabilityAssumptions || "Vulnerability Assumptions"}</Label>
              <Textarea value={formData.vulnerability_assumptions} onChange={(e) => updateField('vulnerability_assumptions', e.target.value)} placeholder={qra?.vulnerabilityPlaceholder || "Indoor/outdoor, shelter factors, escape routes..."} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{qra?.softwareModel || "Software / Model"}</Label>
              <Input value={formData.software_model} onChange={(e) => updateField('software_model', e.target.value)} placeholder={qra?.softwarePlaceholder || "e.g., PHAST, SAFETI, ALOHA..."} />
            </div>
          </TabsContent>

          <TabsContent value="criteria" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
              <h4 className="font-semibold text-sm">{qra?.egpcCriteria || "EGPC Annex E - Risk Tolerance Criteria"}</h4>
              <p className="text-xs text-muted-foreground">{qra?.egpcCriteriaDesc || "Default values per EGPC-PSM-GL-008 Annex E. Adjust if needed."}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{qra?.irpaWorkers || "IRPA Workers (per year)"}</Label>
                <Input value={formData.irpa_workers} onChange={(e) => updateField('irpa_workers', e.target.value)} placeholder="1e-3" />
                <p className="text-xs text-muted-foreground">Max tolerable: 10⁻³/yr</p>
              </div>
              <div className="space-y-2">
                <Label>{qra?.irpaPublic || "IRPA Public (per year)"}</Label>
                <Input value={formData.irpa_public} onChange={(e) => updateField('irpa_public', e.target.value)} placeholder="1e-4" />
                <p className="text-xs text-muted-foreground">Max tolerable: 10⁻⁴/yr</p>
              </div>
              <div className="space-y-2">
                <Label>{qra?.broadlyAcceptable || "Broadly Acceptable (per year)"}</Label>
                <Input value={formData.broadly_acceptable} onChange={(e) => updateField('broadly_acceptable', e.target.value)} placeholder="1e-6" />
                <p className="text-xs text-muted-foreground">Below: 10⁻⁶/yr</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleGenerate} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{qra?.generating || "Initializing QRA Study..."}</>
                ) : (
                  <><BarChart3 className="h-4 w-4 mr-2" />{qra?.generateStudy || "Initialize QRA Study"}</>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{t.enterprise.aiDraftHint}</p></TooltipContent>
          </Tooltip>
          <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Info className="h-3 w-3" /> {t.enterprise.aiDraftHint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QraForm;
