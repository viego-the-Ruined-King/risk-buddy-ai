import { useState } from "react";
import HazopForm, { HazopFormData } from "@/components/HazopForm";
import HazopResults from "@/components/HazopResults";
import { StudyHistory } from "@/components/StudyHistory";
import { AppLayout } from "@/components/AppLayout";
import { ClipboardList, History, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export interface HazopDeviation {
  node_id: string;
  node_description: string;
  deviation_id: string;
  parameter: string;
  guideword: string;
  deviation: string;
  design_intent: string;
  causes: string[];
  consequences_unmitigated: string;
  existing_safeguards: string[];
  initial_risk: {
    likelihood: string;
    severity: string;
    ranking: string;
  };
  residual_risk: {
    likelihood: string;
    severity: string;
    ranking: string;
  };
  recommendations: string[];
  action_party: string;
  priority: string;
  target_date: string;
  comments: string;
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
    composition: "",
  },
  pnid_information: "",
  pnid_equipment: "",
  pnid_control_loops: "",
  nodes: [],
};

const HazopStudy = () => {
  const [deviations, setDeviations] = useState<HazopDeviation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studyId, setStudyId] = useState<string | undefined>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [formData, setFormData] = useState<HazopFormData>(defaultFormData);

  const handleLoadStudy = (study: any) => {
    setFormData({
      title: study.title,
      study_description: study.study_description || "",
      purpose: study.purpose || "",
      scope_in: study.scope_in || "",
      scope_out: study.scope_out || "",
      facility_type: study.facility_type || "",
      lifecycle_phase: study.lifecycle_phase || "",
      operating_parameters: study.operating_parameters || defaultFormData.operating_parameters,
      pnid_information: study.pnid_information || "",
      pnid_equipment: study.pnid_equipment || "",
      pnid_control_loops: study.pnid_control_loops || "",
      nodes: study.nodes || [],
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

  return (
    <AppLayout
      title="HAZOP Study"
      subtitle="IEC 61882 / EGPC-PSM-GL-005 Compliant HAZOP Analysis"
      icon={<ClipboardList className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-6">
        {/* Study History - Collapsible section */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between border-primary/20 hover:bg-primary/5"
            >
              <span className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Study History
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <StudyHistory type="hazop" onLoadStudy={handleLoadStudy} />
          </CollapsibleContent>
        </Collapsible>

        {/* Form Section */}
        <HazopForm 
          onDeviationsGenerated={(newDeviations) => {
            setDeviations(newDeviations);
            setStudyId(undefined);
          }}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onFormDataChange={setFormData}
          initialData={formData}
          onNewStudy={handleNewStudy}
        />
        
        {/* Results Section - Full Width */}
        {deviations.length > 0 && (
          <HazopResults 
            deviations={deviations} 
            onDeviationsUpdated={setDeviations}
            formData={formData}
            studyId={studyId}
            onStudySaved={setStudyId}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default HazopStudy;
