import { useState } from "react";
import QraForm from "@/components/QraForm";
import QraResults from "@/components/QraResults";
import { AppLayout } from "@/components/AppLayout";
import { BarChart3, History, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { StudyHistory } from "@/components/StudyHistory";

export interface QraStudyData {
  study_summary: {
    objective: string;
    scope: string;
    facility_description: string;
    lifecycle_phase?: string;
    risk_types?: string;
  };
  assumption_register: Array<{
    category: string;
    assumption: string;
    reference: string;
  }>;
  failure_cases: Array<{
    id: string;
    isolatable_section: string;
    equipment: string;
    material: string;
    phase: string;
    hole_sizes: Array<{
      category: string;
      diameter_mm: number;
      rate_kg_s: number;
    }>;
    frequency_per_year: number;
    frequency_source: string;
  }>;
  consequence_assessment: Array<{
    failure_case_id: string;
    hole_size: string;
    outcomes: Array<{
      type: string;
      probability: number;
      effects: Record<string, number>;
    }>;
  }>;
  risk_analysis: {
    individual_risk: {
      irpa_workers: Array<{ group: string; irpa_value: number; status: string }>;
      irpa_public: Array<{ location: string; irpa_value: number; status: string }>;
      lsir_contours: Array<{ risk_level: number; description: string }>;
    };
    societal_risk: {
      pll: number;
      fn_curve_data: Array<{ n: number; f: number }>;
    };
  };
  risk_evaluation: {
    overall_status: string;
    major_risk_contributors: string[];
    comparison_to_criteria: string;
  };
  alarp_demonstration: {
    risk_reduction_measures: Array<{
      measure: string;
      type: string;
      hierarchy: string;
      risk_reduction_factor: number;
      cost_estimate: string;
      standard_reference: string;
    }>;
    residual_risk_status: string;
  };
  recommendations: Array<{
    id: string;
    description: string;
    priority: string;
    reference: string;
  }>;
}

export interface QraFormInputs {
  title: string;
  facility_description: string;
  objective: string;
  risk_types: string;
  scope_boundaries: string;
  lifecycle_phase: string;
  materials_inventory: string;
  isolatable_sections: string;
  equipment_list: string;
  operating_parameters: string;
  manning_data: string;
  hole_sizes: string;
  weather_data: string;
  ignition_probability: string;
  vulnerability_assumptions: string;
  software_model: string;
  irpa_workers: string;
  irpa_public: string;
  broadly_acceptable: string;
}

const QraStudy = () => {
  const [results, setResults] = useState<QraStudyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studyId, setStudyId] = useState<string | undefined>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [formData, setFormData] = useState<QraFormInputs>({
    title: "", facility_description: "", objective: "", risk_types: "Both",
    scope_boundaries: "", lifecycle_phase: "", materials_inventory: "",
    isolatable_sections: "", equipment_list: "", operating_parameters: "",
    manning_data: "", hole_sizes: "", weather_data: "", ignition_probability: "",
    vulnerability_assumptions: "", software_model: "", irpa_workers: "1e-3",
    irpa_public: "1e-4", broadly_acceptable: "1e-6",
  });
  const { t } = useLanguage();

  const handleLoadStudy = (study: any) => {
    setFormData({
      title: study.title || "",
      facility_description: study.facility_description || "",
      objective: study.objective || "",
      risk_types: study.risk_types || "Both",
      scope_boundaries: study.scope_boundaries || "",
      lifecycle_phase: study.lifecycle_phase || "",
      materials_inventory: "", isolatable_sections: "", equipment_list: "",
      operating_parameters: "", manning_data: "", hole_sizes: "",
      weather_data: "", ignition_probability: "", vulnerability_assumptions: "",
      software_model: "", irpa_workers: "1e-3", irpa_public: "1e-4", broadly_acceptable: "1e-6",
    });
    setResults({
      study_summary: study.study_summary || { objective: study.objective, scope: study.scope_boundaries, facility_description: study.facility_description },
      assumption_register: study.assumption_register || [],
      failure_cases: study.failure_cases || [],
      consequence_assessment: study.consequence_assessment || [],
      risk_analysis: study.risk_analysis || { individual_risk: { irpa_workers: [], irpa_public: [], lsir_contours: [] }, societal_risk: { pll: 0, fn_curve_data: [] } },
      risk_evaluation: study.risk_evaluation || { overall_status: '', major_risk_contributors: [], comparison_to_criteria: '' },
      alarp_demonstration: study.alarp_demonstration || { risk_reduction_measures: [], residual_risk_status: '' },
      recommendations: study.recommendations || [],
    });
    setStudyId(study.id);
    setHistoryOpen(false);
  };

  const handleNewStudy = () => {
    setFormData({
      title: "", facility_description: "", objective: "", risk_types: "Both",
      scope_boundaries: "", lifecycle_phase: "", materials_inventory: "",
      isolatable_sections: "", equipment_list: "", operating_parameters: "",
      manning_data: "", hole_sizes: "", weather_data: "", ignition_probability: "",
      vulnerability_assumptions: "", software_model: "", irpa_workers: "1e-3",
      irpa_public: "1e-4", broadly_acceptable: "1e-6",
    });
    setResults(null);
    setStudyId(undefined);
  };

  return (
    <AppLayout
      title={(t.pages as any).qra?.title || "QRA Study"}
      subtitle={(t.pages as any).qra?.subtitle || "Quantitative Risk Assessment per EGPC-PSM-GL-008"}
      icon={<BarChart3 className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-6">
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
            <StudyHistory type={"qra" as any} onLoadStudy={handleLoadStudy} />
          </CollapsibleContent>
        </Collapsible>

        <QraForm
          onResultsGenerated={(data) => { setResults(data); setStudyId(undefined); }}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onFormDataChange={setFormData}
          initialData={formData}
          onNewStudy={handleNewStudy}
        />

        {results && (
          <QraResults
            results={results}
            formData={formData}
            studyId={studyId}
            onStudySaved={setStudyId}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default QraStudy;
