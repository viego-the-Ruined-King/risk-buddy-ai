import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ClipboardList, Plus, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";
import type { HazopDeviation, ProcessNode, OperatingParameters } from "@/pages/HazopStudy";

export interface HazopFormData {
  title: string;
  study_description: string;
  purpose: string;
  scope_in: string;
  scope_out: string;
  facility_type: string;
  lifecycle_phase: string;
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
  "Offshore Platform",
  "Onshore Oil Field",
  "Gas Processing Plant",
  "Refinery",
  "Petrochemical Plant",
  "LNG Facility",
  "Pipeline System",
  "Tank Farm",
  "Power Generation",
  "Chemical Plant",
  "Pharmaceutical",
  "Other",
];

const lifecyclePhases = [
  "Concept Design",
  "FEED",
  "Detailed Design",
  "Construction",
  "Commissioning",
  "Operation",
  "Modification",
  "Decommissioning",
];

const operatingModes = ["Normal", "Startup", "Shutdown", "Emergency", "Maintenance"];

const HazopForm = ({
  onDeviationsGenerated,
  isLoading,
  setIsLoading,
  onFormDataChange,
  initialData,
  onNewStudy,
}: HazopFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<HazopFormData>(initialData);
  const [uploadedImages, setUploadedImages] = useState<{ base64: string; type: string; name: string; size: number }[]>([]);
  const [activeTab, setActiveTab] = useState("study-details");

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

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
    const newNode: ProcessNode = {
      node_id: newNodeId,
      description: "",
      boundary_from: "",
      boundary_to: "",
      operating_mode: "Normal",
    };
    updateFormData({ nodes: [...formData.nodes, newNode] });
  };

  const updateNode = (index: number, updates: Partial<ProcessNode>) => {
    const newNodes = [...formData.nodes];
    newNodes[index] = { ...newNodes[index], ...updates };
    updateFormData({ nodes: newNodes });
  };

  const removeNode = (index: number) => {
    const newNodes = formData.nodes.filter((_, i) => i !== index);
    // Renumber nodes
    const renumbered = newNodes.map((node, i) => ({
      ...node,
      node_id: `N-${String(i + 1).padStart(3, '0')}`,
    }));
    updateFormData({ nodes: renumbered });
  };

  const handleFilesChange = (files: { base64: string; type: string; name: string; size: number }[]) => {
    setUploadedImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a study title.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to generate HAZOP study.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hazop-study`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            title: formData.title,
            study_description: formData.study_description,
            purpose: formData.purpose,
            scope_in: formData.scope_in,
            scope_out: formData.scope_out,
            facility_type: formData.facility_type,
            lifecycle_phase: formData.lifecycle_phase,
            operating_parameters: formData.operating_parameters,
            pnid_information: formData.pnid_information,
            pnid_equipment: formData.pnid_equipment,
            pnid_control_loops: formData.pnid_control_loops,
            nodes: formData.nodes,
            images: uploadedImages,
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

      if (data?.deviations) {
        onDeviationsGenerated(data.deviations);
        toast({
          title: "HAZOP Study Generated",
          description: `Successfully generated ${data.deviations.length} deviations per EGPC/IEC 61882 methodology.`,
        });
      } else {
        throw new Error('No deviations returned from API');
      }
    } catch (error) {
      console.error('Error generating HAZOP study:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate HAZOP study.",
        variant: "destructive",
      });
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
              HAZOP Study Input
            </CardTitle>
            <CardDescription>
              IEC 61882 / EGPC-PSM-GL-005 Compliant Analysis
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNewStudy}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            New Study
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="study-details" className="text-xs sm:text-sm">Study Details</TabsTrigger>
              <TabsTrigger value="parameters" className="text-xs sm:text-sm">Parameters</TabsTrigger>
              <TabsTrigger value="pnid" className="text-xs sm:text-sm">P&ID Info</TabsTrigger>
              <TabsTrigger value="nodes" className="text-xs sm:text-sm">Nodes</TabsTrigger>
            </TabsList>

            {/* Step 1: Study Details */}
            <TabsContent value="study-details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Study Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="e.g., Gas Compression System HAZOP"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facility_type">Facility Type</Label>
                  <Input
                    id="facility_type"
                    value={formData.facility_type}
                    onChange={(e) => updateFormData({ facility_type: e.target.value })}
                    placeholder="e.g., Offshore Platform, Refinery, Gas Plant..."
                    list="facility-types"
                  />
                  <datalist id="facility-types">
                    {facilityTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lifecycle_phase">Lifecycle Phase</Label>
                  <Input
                    id="lifecycle_phase"
                    value={formData.lifecycle_phase}
                    onChange={(e) => updateFormData({ lifecycle_phase: e.target.value })}
                    placeholder="e.g., Detailed Design, Operation, Commissioning..."
                    list="lifecycle-phases"
                  />
                  <datalist id="lifecycle-phases">
                    {lifecyclePhases.map((phase) => (
                      <option key={phase} value={phase} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="study_description">Study Description</Label>
                <Textarea
                  id="study_description"
                  value={formData.study_description}
                  onChange={(e) => updateFormData({ study_description: e.target.value })}
                  placeholder="Describe the system or process being studied..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => updateFormData({ purpose: e.target.value })}
                  placeholder="State the purpose of this HAZOP study..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scope_in">In Scope</Label>
                  <Textarea
                    id="scope_in"
                    value={formData.scope_in}
                    onChange={(e) => updateFormData({ scope_in: e.target.value })}
                    placeholder="What is included in this study..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope_out">Out of Scope</Label>
                  <Textarea
                    id="scope_out"
                    value={formData.scope_out}
                    onChange={(e) => updateFormData({ scope_out: e.target.value })}
                    placeholder="What is excluded from this study..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Step 2: Operating Parameters */}
            <TabsContent value="parameters" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Flow Parameters</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Normal</Label>
                    <Input
                      value={formData.operating_parameters.flow_normal}
                      onChange={(e) => updateOperatingParams({ flow_normal: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Min</Label>
                    <Input
                      value={formData.operating_parameters.flow_min}
                      onChange={(e) => updateOperatingParams({ flow_min: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max</Label>
                    <Input
                      value={formData.operating_parameters.flow_max}
                      onChange={(e) => updateOperatingParams({ flow_max: e.target.value })}
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Units</Label>
                    <Input
                      value={formData.operating_parameters.flow_units}
                      onChange={(e) => updateOperatingParams({ flow_units: e.target.value })}
                      placeholder="m³/hr"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-medium text-muted-foreground pt-2">Pressure Parameters</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Normal</Label>
                    <Input
                      value={formData.operating_parameters.pressure_normal}
                      onChange={(e) => updateOperatingParams({ pressure_normal: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Design</Label>
                    <Input
                      value={formData.operating_parameters.pressure_design}
                      onChange={(e) => updateOperatingParams({ pressure_design: e.target.value })}
                      placeholder="75"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">MAWP</Label>
                    <Input
                      value={formData.operating_parameters.pressure_mawp}
                      onChange={(e) => updateOperatingParams({ pressure_mawp: e.target.value })}
                      placeholder="80"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Units</Label>
                    <Input
                      value={formData.operating_parameters.pressure_units}
                      onChange={(e) => updateOperatingParams({ pressure_units: e.target.value })}
                      placeholder="barg"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-medium text-muted-foreground pt-2">Temperature Parameters</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Normal</Label>
                    <Input
                      value={formData.operating_parameters.temp_normal}
                      onChange={(e) => updateOperatingParams({ temp_normal: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Min</Label>
                    <Input
                      value={formData.operating_parameters.temp_min}
                      onChange={(e) => updateOperatingParams({ temp_min: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max</Label>
                    <Input
                      value={formData.operating_parameters.temp_max}
                      onChange={(e) => updateOperatingParams({ temp_max: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Units</Label>
                    <Input
                      value={formData.operating_parameters.temp_units}
                      onChange={(e) => updateOperatingParams({ temp_units: e.target.value })}
                      placeholder="°C"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-medium text-muted-foreground pt-2">Level & Composition</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Level Normal</Label>
                    <Input
                      value={formData.operating_parameters.level_normal}
                      onChange={(e) => updateOperatingParams({ level_normal: e.target.value })}
                      placeholder="50%"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Level High</Label>
                    <Input
                      value={formData.operating_parameters.level_high}
                      onChange={(e) => updateOperatingParams({ level_high: e.target.value })}
                      placeholder="80%"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Level Low</Label>
                    <Input
                      value={formData.operating_parameters.level_low}
                      onChange={(e) => updateOperatingParams({ level_low: e.target.value })}
                      placeholder="20%"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <Label className="text-xs">Composition/Phase</Label>
                    <Input
                      value={formData.operating_parameters.composition}
                      onChange={(e) => updateOperatingParams({ composition: e.target.value })}
                      placeholder="Natural gas, vapor phase"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Step 3: P&ID Information */}
            <TabsContent value="pnid" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pnid_information">P&ID Numbers</Label>
                <Textarea
                  id="pnid_information"
                  value={formData.pnid_information}
                  onChange={(e) => updateFormData({ pnid_information: e.target.value })}
                  placeholder="e.g., P-101, P-102, P-103..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pnid_equipment">Equipment and Line Descriptions</Label>
                <Textarea
                  id="pnid_equipment"
                  value={formData.pnid_equipment}
                  onChange={(e) => updateFormData({ pnid_equipment: e.target.value })}
                  placeholder="Describe main equipment, vessels, pumps, compressors, heat exchangers..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pnid_control_loops">Control Loops</Label>
                <Textarea
                  id="pnid_control_loops"
                  value={formData.pnid_control_loops}
                  onChange={(e) => updateFormData({ pnid_control_loops: e.target.value })}
                  placeholder="Describe relevant control loops, instruments, and interlocks..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload P&ID Images (Optional)</Label>
                <FileUpload files={uploadedImages} onFilesChange={handleFilesChange} />
              </div>
            </TabsContent>

            {/* Step 4: Process Nodes */}
            <TabsContent value="nodes" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Define process nodes for analysis. Each node will be evaluated against HAZOP guidewords.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNode}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Node
                </Button>
              </div>

              {formData.nodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <p>No nodes defined yet.</p>
                  <p className="text-sm">Click "Add Node" to define process nodes, or leave empty for AI to suggest nodes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.nodes.map((node, index) => (
                    <Card key={index} className="bg-background/50 border-border/50">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">{node.node_id}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNode(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Node Description</Label>
                            <Input
                              value={node.description}
                              onChange={(e) => updateNode(index, { description: e.target.value })}
                              placeholder="e.g., Feed Gas Inlet Header"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Boundary From</Label>
                            <Input
                              value={node.boundary_from}
                              onChange={(e) => updateNode(index, { boundary_from: e.target.value })}
                              placeholder="e.g., Battery Limit"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Boundary To</Label>
                            <Input
                              value={node.boundary_to}
                              onChange={(e) => updateNode(index, { boundary_to: e.target.value })}
                              placeholder="e.g., Inlet Separator V-101"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Operating Mode</Label>
                            <Input
                              value={node.operating_mode}
                              onChange={(e) => updateNode(index, { operating_mode: e.target.value })}
                              placeholder="e.g., Normal, Startup, Shutdown..."
                              list={`operating-modes-${index}`}
                            />
                            <datalist id={`operating-modes-${index}`}>
                              {operatingModes.map((mode) => (
                                <option key={mode} value={mode} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating HAZOP Worksheet...
              </>
            ) : (
              <>
                <ClipboardList className="mr-2 h-5 w-5" />
                Generate HAZOP Study
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default HazopForm;
