import { useState } from "react";
import HazopForm, { HazopFormData } from "@/components/HazopForm";
import HazopResults from "@/components/HazopResults";
import { StudyHistory } from "@/components/StudyHistory";
import { AppLayout } from "@/components/AppLayout";
import { ClipboardList, History, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

// EGPC Risk Assessment Structure
export interface RiskAssessment {
  likelihood: number; // 1-6
  severity: string; // A-F
  risk: string; // e.g., "3C"
  level: string; // High, Medium, Low
}
export interface HazopDeviation {
  node_id: string;
  node_description: string;
  deviation_id: string;
  parameter: string;
  guideword: string;
  deviation: string;
  design_intent: string;
  causes: string[];
  assess_for: string; // People, Environment, Assets, Reputation
  consequences_unmitigated: string;
  initial_risk: RiskAssessment;
  existing_safeguards: string[];
  current_risk: RiskAssessment; // After safeguards
  recommendations: string[];
  residual_risk: RiskAssessment; // After recommendations
  action_party: string;
  remarks: string;
  target_date: string;
  // Legacy fields for backward compatibility
  priority?: string;
  comments?: string;
}
export interface ProcessNode {
  node_id: string;
  description: string;
  boundary_from: string;
  boundary_to: string;
  operating_mode: string;
}
export interface OperatingParameters {
  flow_normal: string;
  flow_min: string;
  flow_max: string;
  flow_units: string;
  pressure_normal: string;
  pressure_design: string;
  pressure_mawp: string;
  pressure_units: string;
  temp_normal: string;
  temp_min: string;
  temp_max: string;
  temp_units: string;
  level_normal: string;
  level_high: string;
  level_low: string;
  composition: string;
}
const defaultFormData: HazopFormData = {
  title: "",
  study_description: "",
  purpose: "",
  scope_in: "",
  scope_out: "",
  facility_type: "",
  lifecycle_phase: "",
  fluid_material_type: "",
  equipment_category: "",
  operational_mode: "",
  max_pressure: "",
  max_temperature: "",
  operating_parameters: {
    flow_normal: "",
    flow_min: "",
    flow_max: "",
    flow_units: "",
    pressure_normal: "",
    pressure_design: "",
    pressure_mawp: "",
    pressure_units: "",
    temp_normal: "",
    temp_min: "",
    temp_max: "",
    temp_units: "",
    level_normal: "",
    level_high: "",
    level_low: "",
    composition: ""
  },
  pnid_information: "",
  pnid_equipment: "",
  pnid_control_loops: "",
  nodes: []
};
const HazopStudy = () => {
  const [deviations, setDeviations] = useState<HazopDeviation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studyId, setStudyId] = useState<string | undefined>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [formData, setFormData] = useState<HazopFormData>(defaultFormData);
  const { t } = useLanguage();
  const handleLoadStudy = (study: any) => {
    setFormData({
      title: study.title,
      study_description: study.study_description || "",
      purpose: study.purpose || "",
      scope_in: study.scope_in || "",
      scope_out: study.scope_out || "",
      facility_type: study.facility_type || "",
      lifecycle_phase: study.lifecycle_phase || "",
      fluid_material_type: study.fluid_material_type || "",
      equipment_category: study.equipment_category || "",
      operational_mode: study.operational_mode || "",
      max_pressure: study.max_pressure || "",
      max_temperature: study.max_temperature || "",
      operating_parameters: study.operating_parameters || defaultFormData.operating_parameters,
      pnid_information: study.pnid_information || "",
      pnid_equipment: study.pnid_equipment || "",
      pnid_control_loops: study.pnid_control_loops || "",
      nodes: study.nodes || []
    });
    setDeviations(study.deviations || []);
    setStudyId(study.id);
    setHistoryOpen(false);
  };
  const handleNewStudy = () => {
    setFormData(defaultFormData);
    setDeviations([]);
    setStudyId(undefined);
  };
  return <AppLayout title={t.pages.hazop.title} subtitle={t.pages.hazop.subtitle} icon={<ClipboardList className="h-5 w-5 text-primary" />}>
      <div className="space-y-6">
        {/* Study History - Collapsible section */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between border-primary/20 hover:bg-primary/5">
              <span className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                {t.studyHistory}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <StudyHistory type="hazop" onLoadStudy={handleLoadStudy} />
          </CollapsibleContent>
        </Collapsible>

        {/* Form Section */}
        <HazopForm onDeviationsGenerated={newDeviations => {
        setDeviations(newDeviations);
        setStudyId(undefined);
      }} isLoading={isLoading} setIsLoading={setIsLoading} onFormDataChange={setFormData} initialData={formData} onNewStudy={handleNewStudy} />
        
        {/* Results Section - Full Width */}
        {deviations.length > 0 && <HazopResults deviations={deviations} onDeviationsUpdated={setDeviations} formData={formData} studyId={studyId} onStudySaved={setStudyId} isLoading={isLoading} setIsLoading={setIsLoading} />}
      </div>
    </AppLayout>;
};
export default HazopStudy;
