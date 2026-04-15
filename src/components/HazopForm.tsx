import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, ClipboardList, Plus, Trash2, RefreshCw, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";
import type { HazopDeviation, ProcessNode, OperatingParameters } from "@/pages/HazopStudy";
import { useLanguage } from "@/contexts/LanguageContext";

export interface HazopFormData {
  title: string;
  study_description: string;
  purpose: string;
  scope_in: string;
  scope_out: string;
  facility_type: string;
  lifecycle_phase: string;
  fluid_material_type: string;
  equipment_category: string;
  operational_mode: string;
  max_pressure: string;
  max_temperature: string;
  operating_parameters: OperatingParameters;
  pnid_information: string;
  pnid_equipment: string;
  pnid_control_loops: string;
  nodes: ProcessNode[];
}

interface HazopFormProps {
  onDeviationsGenerated: (deviations: HazopDeviation[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onFormDataChange: (data: HazopFormData) => void;
  initialData: HazopFormData;
  onNewStudy: () => void;
}

const facilityTypes = [
  "Offshore Platform", "Onshore Oil Field", "Gas Processing Plant", "Refinery",
  "Petrochemical Plant", "LNG Facility", "Pipeline System", "Tank Farm",
  "Power Generation", "Chemical Plant", "Pharmaceutical", "Other",
];

const fluidMaterialTypes = [
  "Flammable Gas", "Toxic Gas", "Hydrocarbon Liquid", "Corrosive",
  "Water/Steam", "Inert Gas", "LPG", "Crude Oil", "Condensate",
  "H2S Bearing", "Produced Water", "Chemical Injection", "Other",
];

const equipmentCategories = [
  "Pump", "Compressor", "Pressure Vessel", "Heat Exchanger", "Pipeline",
  "Storage Tank", "Reactor", "Column/Tower", "Fired Heater", "Valve/Actuator",
  "Flare System", "Separator", "Other",
];

const lifecyclePhases = [
  "Concept Design", "FEED", "Detailed Design", "Construction",
  "Commissioning", "Operation", "Modification", "Decommissioning",
];

const operatingModes = ["Normal", "Startup", "Shutdown", "Emergency", "Maintenance"];

const HazopForm = ({ onDeviationsGenerated, isLoading, setIsLoading, onFormDataChange, initialData, onNewStudy }: HazopFormProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<HazopFormData>(initialData);
  const [uploadedImages, setUploadedImages] = useState<{ base64: string; type: string; name: string; size: number }[]>([]);
  const [activeTab, setActiveTab] = useState("study-details");

  useEffect(() => { setFormData(initialData); }, [initialData]);

  const updateFormData = (updates: Partial<HazopFormData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onFormDataChange(newData);
  };

  const updateOperatingParams = (updates: Partial<OperatingParameters>) => {
    const newParams = { ...formData.operating_parameters, ...updates };
    updateFormData({ operating_parameters: newParams });
  };

  const addNode = () => {
    const newNodeId = `N-${String(formData.nodes.length + 1).padStart(3, '0')}`;
    const newNode: ProcessNode = { node_id: newNodeId, description: "", boundary_from: "", boundary_to: "", operating_mode: "Normal" };
    updateFormData({ nodes: [...formData.nodes, newNode] });
  };

  const updateNode = (index: number, updates: Partial<ProcessNode>) => {
    const newNodes = [...formData.nodes];
    newNodes[index] = { ...newNodes[index], ...updates };
    updateFormData({ nodes: newNodes });
  };

  const removeNode = (index: number) => {
    const newNodes = formData.nodes.filter((_, i) => i !== index);
    const renumbered = newNodes.map((node, i) => ({ ...node, node_id: `N-${String(i + 1).padStart(3, '0')}` }));
    updateFormData({ nodes: renumbered });
  };

  const handleFilesChange = (files: { base64: string; type: string; name: string; size: number }[]) => {
    setUploadedImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: t.forms.hazop.validationError, description: t.forms.hazop.validationErrorDesc, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in.');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hazop-study`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ ...formData, images: uploadedImages }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data?.deviations) {
        onDeviationsGenerated(data.deviations);
        toast({ title: t.common.success, description: `${data.deviations.length} ${t.results.hazop.deviations}` });
      } else {
        throw new Error('No deviations returned.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t.common.error, description: error instanceof Error ? error.message : "Failed.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {t.forms.hazop.title}
            </CardTitle>
            <CardDescription>{t.forms.hazop.subtitle}</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onNewStudy} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {t.forms.hazop.newStudy}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="study-details" className="text-xs sm:text-sm">{t.forms.hazop.studyDetails}</TabsTrigger>
              <TabsTrigger value="parameters" className="text-xs sm:text-sm">{t.forms.hazop.parameters}</TabsTrigger>
              <TabsTrigger value="pnid" className="text-xs sm:text-sm">{t.forms.hazop.pnidInfo}</TabsTrigger>
              <TabsTrigger value="nodes" className="text-xs sm:text-sm">{t.forms.hazop.nodes}</TabsTrigger>
            </TabsList>

            <TabsContent value="study-details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.forms.hazop.studyTitle}</Label>
                  <Input value={formData.title} onChange={(e) => updateFormData({ title: e.target.value })} placeholder={t.forms.hazop.studyTitlePlaceholder} required />
                </div>
                <div className="space-y-2">
                  <Label>{t.forms.hazop.facilityType}</Label>
                  <Input value={formData.facility_type} onChange={(e) => updateFormData({ facility_type: e.target.value })} placeholder={t.forms.hazop.facilityTypePlaceholder} list="facility-types" />
                  <datalist id="facility-types">{facilityTypes.map((type) => <option key={type} value={type} />)}</datalist>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.forms.hazop.lifecyclePhase}</Label>
                  <Input value={formData.lifecycle_phase} onChange={(e) => updateFormData({ lifecycle_phase: e.target.value })} placeholder={t.forms.hazop.lifecyclePhasePlaceholder} list="lifecycle-phases" />
                  <datalist id="lifecycle-phases">{lifecyclePhases.map((phase) => <option key={phase} value={phase} />)}</datalist>
                </div>
              </div>

              {/* Structured Context Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30 border border-primary/10">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">{t.forms.hazid.fluidMaterialType} *</Label>
                  <select value={formData.fluid_material_type} onChange={(e) => updateFormData({ fluid_material_type: e.target.value })} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">{t.forms.hazid.fluidMaterialPlaceholder}</option>
                    {fluidMaterialTypes.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">{t.forms.hazid.equipmentCategory} *</Label>
                  <select value={formData.equipment_category} onChange={(e) => updateFormData({ equipment_category: e.target.value })} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">{t.forms.hazid.equipmentCategoryPlaceholder}</option>
                    {equipmentCategories.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">{t.forms.hazid.operationalMode} *</Label>
                  <select value={formData.operational_mode} onChange={(e) => updateFormData({ operational_mode: e.target.value })} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">{t.forms.hazid.operationalModePlaceholder}</option>
                    {operatingModes.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">{t.forms.hazid.maxPressure}</Label>
                  <Input type="number" value={formData.max_pressure} onChange={(e) => updateFormData({ max_pressure: e.target.value })} placeholder={t.forms.hazid.maxPressurePlaceholder} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">{t.forms.hazid.maxTemperature}</Label>
                  <Input type="number" value={formData.max_temperature} onChange={(e) => updateFormData({ max_temperature: e.target.value })} placeholder={t.forms.hazid.maxTemperaturePlaceholder} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.forms.hazop.studyDescription}</Label>
                <Textarea value={formData.study_description} onChange={(e) => updateFormData({ study_description: e.target.value })} placeholder={t.forms.hazop.studyDescriptionPlaceholder} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{t.forms.hazop.purposeLabel}</Label>
                <Textarea value={formData.purpose} onChange={(e) => updateFormData({ purpose: e.target.value })} placeholder={t.forms.hazop.purposePlaceholder} rows={2} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.forms.hazop.inScope}</Label>
                  <Textarea value={formData.scope_in} onChange={(e) => updateFormData({ scope_in: e.target.value })} placeholder={t.forms.hazop.inScopePlaceholder} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>{t.forms.hazop.outOfScope}</Label>
                  <Textarea value={formData.scope_out} onChange={(e) => updateFormData({ scope_out: e.target.value })} placeholder={t.forms.hazop.outOfScopePlaceholder} rows={3} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">{t.forms.hazop.flowParameters}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.normal}</Label><Input value={formData.operating_parameters.flow_normal} onChange={(e) => updateOperatingParams({ flow_normal: e.target.value })} placeholder="100" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.min}</Label><Input value={formData.operating_parameters.flow_min} onChange={(e) => updateOperatingParams({ flow_min: e.target.value })} placeholder="50" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.max}</Label><Input value={formData.operating_parameters.flow_max} onChange={(e) => updateOperatingParams({ flow_max: e.target.value })} placeholder="150" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.units}</Label><Input value={formData.operating_parameters.flow_units} onChange={(e) => updateOperatingParams({ flow_units: e.target.value })} placeholder="m³/hr" /></div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground pt-2">{t.forms.hazop.pressureParameters}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.normal}</Label><Input value={formData.operating_parameters.pressure_normal} onChange={(e) => updateOperatingParams({ pressure_normal: e.target.value })} placeholder="50" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.design}</Label><Input value={formData.operating_parameters.pressure_design} onChange={(e) => updateOperatingParams({ pressure_design: e.target.value })} placeholder="75" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.mawp}</Label><Input value={formData.operating_parameters.pressure_mawp} onChange={(e) => updateOperatingParams({ pressure_mawp: e.target.value })} placeholder="80" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.units}</Label><Input value={formData.operating_parameters.pressure_units} onChange={(e) => updateOperatingParams({ pressure_units: e.target.value })} placeholder="barg" /></div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground pt-2">{t.forms.hazop.temperatureParameters}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.normal}</Label><Input value={formData.operating_parameters.temp_normal} onChange={(e) => updateOperatingParams({ temp_normal: e.target.value })} placeholder="60" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.min}</Label><Input value={formData.operating_parameters.temp_min} onChange={(e) => updateOperatingParams({ temp_min: e.target.value })} placeholder="20" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.max}</Label><Input value={formData.operating_parameters.temp_max} onChange={(e) => updateOperatingParams({ temp_max: e.target.value })} placeholder="100" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.units}</Label><Input value={formData.operating_parameters.temp_units} onChange={(e) => updateOperatingParams({ temp_units: e.target.value })} placeholder="°C" /></div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground pt-2">{t.forms.hazop.levelComposition}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.levelNormal}</Label><Input value={formData.operating_parameters.level_normal} onChange={(e) => updateOperatingParams({ level_normal: e.target.value })} placeholder="50%" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.levelHigh}</Label><Input value={formData.operating_parameters.level_high} onChange={(e) => updateOperatingParams({ level_high: e.target.value })} placeholder="80%" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t.forms.hazop.levelLow}</Label><Input value={formData.operating_parameters.level_low} onChange={(e) => updateOperatingParams({ level_low: e.target.value })} placeholder="20%" /></div>
                  <div className="space-y-1 md:col-span-1"><Label className="text-xs">{t.forms.hazop.compositionPhase}</Label><Input value={formData.operating_parameters.composition} onChange={(e) => updateOperatingParams({ composition: e.target.value })} placeholder="Natural gas, vapor phase" /></div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pnid" className="space-y-4">
              <div className="space-y-2">
                <Label>{t.forms.hazop.pnidNumbers}</Label>
                <Textarea value={formData.pnid_information} onChange={(e) => updateFormData({ pnid_information: e.target.value })} placeholder={t.forms.hazop.pnidNumbersPlaceholder} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{t.forms.hazop.equipmentLines}</Label>
                <Textarea value={formData.pnid_equipment} onChange={(e) => updateFormData({ pnid_equipment: e.target.value })} placeholder={t.forms.hazop.equipmentLinesPlaceholder} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{t.forms.hazop.controlLoops}</Label>
                <Textarea value={formData.pnid_control_loops} onChange={(e) => updateFormData({ pnid_control_loops: e.target.value })} placeholder={t.forms.hazop.controlLoopsPlaceholder} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{t.forms.hazop.uploadPnid}</Label>
                <FileUpload files={uploadedImages} onFilesChange={handleFilesChange} />
              </div>
            </TabsContent>

            <TabsContent value="nodes" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t.forms.hazop.defineNodes}</p>
                <Button type="button" variant="outline" size="sm" onClick={addNode} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t.forms.hazop.addNode}
                </Button>
              </div>

              {formData.nodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <p>{t.forms.hazop.noNodes}</p>
                  <p className="text-sm">{t.forms.hazop.noNodesHint}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.nodes.map((node, index) => (
                    <Card key={index} className="bg-background/50 border-border/50">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">{node.node_id}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeNode(index)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">{t.forms.hazop.nodeDescription}</Label>
                            <Input value={node.description} onChange={(e) => updateNode(index, { description: e.target.value })} placeholder={t.forms.hazop.nodeDescriptionPlaceholder} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t.forms.hazop.boundaryFrom}</Label>
                            <Input value={node.boundary_from} onChange={(e) => updateNode(index, { boundary_from: e.target.value })} placeholder={t.forms.hazop.boundaryFromPlaceholder} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t.forms.hazop.boundaryTo}</Label>
                            <Input value={node.boundary_to} onChange={(e) => updateNode(index, { boundary_to: e.target.value })} placeholder={t.forms.hazop.boundaryToPlaceholder} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t.forms.hazop.operatingMode}</Label>
                            <Input value={node.operating_mode} onChange={(e) => updateNode(index, { operating_mode: e.target.value })} placeholder={t.forms.hazop.operatingModePlaceholder} list={`operating-modes-${index}`} />
                            <datalist id={`operating-modes-${index}`}>{operatingModes.map((mode) => <option key={mode} value={mode} />)}</datalist>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <StartStudyButton
            onClick={() => {
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleSubmit(fakeEvent);
            }}
            loading={isLoading}
            disabled={isLoading}
            label={isLoading ? "PROCESSING" : "DRAFT HAZOP STUDY"}
          />
          <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Info className="h-3 w-3" /> {t.enterprise.aiDraftHint}
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default HazopForm;