import { useState } from "react";
import HazidForm, { HazidFormData } from "@/components/HazidForm";
import HazidResults from "@/components/HazidResults";
import { StudyHistory } from "@/components/StudyHistory";
import { AppLayout } from "@/components/AppLayout";
import { FileText, History, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export interface HazidHazard {
  h_no: string;
  guideword: string;
  hazard_description: string;
  source_location: string;
  company_specific_source: string;
  possible_causes: string;
  top_event: string;
  consequences: string;
  assess_for: string;
  risk_ranking_initial: string;
  initial_risk: {
    likelihood: string;
    severity: string;
  };
  mah: string;
  existing_controls: string;
  current_risk: {
    likelihood: string;
    severity: string;
  };
  risk_ranking_current: string;
  recommendations: string | string[];
  residual_risk: {
    likelihood: string;
    severity: string;
  };
  risk_ranking_residual: string;
  action_party: string;
  target_date: string;
}

const HazidStudy = () => {
  const [hazards, setHazards] = useState<HazidHazard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studyId, setStudyId] = useState<string | undefined>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [formData, setFormData] = useState<HazidFormData>({
    title: "",
    executiveSummary: "",
    purpose: "",
    scope: "",
    processDesignParameters: "",
    materialHazardData: "",
    keyInstrumentList: "",
    organizationalContext: "",
  });

  const handleLoadStudy = (study: any) => {
    setFormData({
      title: study.title,
      executiveSummary: study.executive_summary || "",
      purpose: study.purpose || "",
      scope: study.scope || "",
      processDesignParameters: study.process_design_parameters || "",
      materialHazardData: study.material_hazard_data || "",
      keyInstrumentList: study.key_instrument_list || "",
      organizationalContext: study.organizational_context || "",
    });
    setHazards(study.hazards || []);
    setStudyId(study.id);
    setHistoryOpen(false);
  };

  const handleNewStudy = () => {
    setFormData({
      title: "",
      executiveSummary: "",
      purpose: "",
      scope: "",
      processDesignParameters: "",
      materialHazardData: "",
      keyInstrumentList: "",
      organizationalContext: "",
    });
    setHazards([]);
    setStudyId(undefined);
  };

  return (
    <AppLayout
      title="HAZID Study"
      subtitle="Professional Hazard Identification aligned with EGPC Standards"
      icon={<FileText className="h-5 w-5 text-primary" />}
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
            <StudyHistory type="hazid" onLoadStudy={handleLoadStudy} />
          </CollapsibleContent>
        </Collapsible>

        {/* Form Section */}
        <HazidForm 
          onHazardsGenerated={(newHazards) => {
            setHazards(newHazards);
            setStudyId(undefined);
          }}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onFormDataChange={setFormData}
          initialData={formData}
          onNewStudy={handleNewStudy}
        />
        
        {/* Results Section - Full Width */}
        {hazards.length > 0 && (
          <HazidResults 
            hazards={hazards} 
            onHazardsUpdated={setHazards}
            formData={formData}
            studyId={studyId}
            onStudySaved={setStudyId}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default HazidStudy;