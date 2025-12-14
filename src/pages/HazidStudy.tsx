import { useState } from "react";
import HazidForm, { HazidFormData } from "@/components/HazidForm";
import HazidResults from "@/components/HazidResults";
import { StudyHistory } from "@/components/StudyHistory";
import { UserMenu } from "@/components/UserMenu";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { FileText } from "lucide-react";

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
  const [formData, setFormData] = useState<HazidFormData>({
    title: "",
    executiveSummary: "",
    purpose: "",
    scope: "",
    activityType: "",
    equipmentType: "",
    operationPhase: "",
  });

  const handleLoadStudy = (study: any) => {
    setFormData({
      title: study.title,
      executiveSummary: study.executive_summary || "",
      purpose: study.purpose || "",
      scope: study.scope || "",
      activityType: study.activity_type || "",
      equipmentType: study.equipment_type || "",
      operationPhase: study.operation_phase || "",
    });
    setHazards(study.hazards || []);
    setStudyId(study.id);
  };

  const handleNewStudy = () => {
    setFormData({
      title: "",
      executiveSummary: "",
      purpose: "",
      scope: "",
      activityType: "",
      equipmentType: "",
      operationPhase: "",
    });
    setHazards([]);
    setStudyId(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20 md:pb-0">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-end mb-2 sm:mb-4">
          <UserMenu />
        </div>
        
        {/* Title Section */}
        <div className="text-center mb-6 sm:mb-12 space-y-2 sm:space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
            <FileText className="h-10 w-10 sm:h-16 sm:w-16 text-primary relative z-10 mx-auto" />
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            HAZID Study
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto px-4">
            Professional Hazard Identification aligned with EGPC Standards
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Study History - Mobile shows at top, Desktop shows on right */}
          <div className="lg:hidden">
            <StudyHistory type="hazid" onLoadStudy={handleLoadStudy} />
          </div>
          
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
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
          
          {/* Study History - Desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <StudyHistory type="hazid" onLoadStudy={handleLoadStudy} />
          </div>
        </div>
      </div>
      
      <MobileBottomNav />
    </div>
  );
};

export default HazidStudy;