import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import LopaForm from "@/components/LopaForm";
import LopaResults from "@/components/LopaResults";
import LopaStudyHistory from "@/components/LopaStudyHistory";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export interface LopaScenario {
  id?: string;
  scenario_number: string;
  equipment_number: string;
  scenario_title: string;
  consequence_description: string;
  consequence_category: string;
  severity_level: string;
  tmel: number;
  tmel_basis: string;
  hazop_study_id?: string;
  hazop_deviation_id?: string;
  hazop_node_id?: string;
  hazop_deviation?: string;
  hazop_causes?: string[];
  hazop_consequences?: string;
  hazop_existing_safeguards?: string[];
  hazop_initial_risk?: {
    likelihood?: number;
    severity?: string;
    risk?: string;
    level?: string;
  };
  initiating_events: Array<{ name: string; frequency: number; source: string }>;
  ipls: Array<{ type: string; name: string; pfd: number; source: string; is_valid?: boolean; validation_notes?: string }>;
  enabling_conditions: { description?: string; probability: number };
  conditional_modifiers: {
    time_at_risk: number; time_at_risk_basis?: string;
    ignition_probability: number; ignition_probability_basis?: string;
    vulnerability: number; vulnerability_basis?: string;
  };
  iel_per_initiating_event: Array<{
    initiating_event: string; ief: number; ipls_product: number;
    pec: number; pcm: number; iel: number;
  }>;
  total_iel: number;
  iel_vs_tmel: string;
  frequency_mitigated_consequences?: number;
  total_mitigated_event_frequency?: number;
  pfd_target?: number;
  pfd_target_safety?: number;
  pfd_target_environment?: number;
  pfd_target_financial?: number;
  sil_required?: string;
  sil_safety?: string;
  sil_environment?: string;
  sil_financial?: string;
  recommendations?: string;
  notes_assumptions?: string;
  egpc_reference?: string;
}

export interface LopaFormData {
  hazop_study_id?: string;
  hazop_deviation_id?: string;
  scenario_title: string;
  equipment_number: string;
  consequence_category: string;
  severity_level: string;
  hazop_node_id?: string;
  hazop_deviation?: string;
  hazop_causes?: string[];
  hazop_consequences?: string;
  hazop_existing_safeguards?: string[];
  hazop_initial_risk?: {
    likelihood?: number;
    severity?: string;
    risk?: string;
    level?: string;
  };
}

const LopaStudy = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<LopaFormData>({
    scenario_title: '', equipment_number: '',
    consequence_category: 'People', severity_level: '',
  });
  const [lopaResult, setLopaResult] = useState<LopaScenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentStudyId, setCurrentStudyId] = useState<string | undefined>();

  // Load HAZOP deviation data from navigation state or URL params
  useEffect(() => {
    const navState = location.state as {
      hazop_study_id?: string; hazop_deviation_id?: string;
      hazop_node_id?: string; hazop_deviation?: string;
      hazop_causes?: string[]; hazop_consequences?: string;
      hazop_existing_safeguards?: string[]; hazop_initial_risk?: any;
    } | null;

    if (navState?.hazop_deviation_id) {
      setFormData({
        hazop_study_id: navState.hazop_study_id,
        hazop_deviation_id: navState.hazop_deviation_id,
        scenario_title: navState.hazop_deviation || '',
        equipment_number: navState.hazop_node_id || '',
        consequence_category: 'People',
        severity_level: mapHazopSeverityToLopa(navState.hazop_initial_risk?.severity),
        hazop_node_id: navState.hazop_node_id,
        hazop_deviation: navState.hazop_deviation,
        hazop_causes: navState.hazop_causes || [],
        hazop_consequences: navState.hazop_consequences || '',
        hazop_existing_safeguards: navState.hazop_existing_safeguards || [],
        hazop_initial_risk: navState.hazop_initial_risk,
      });
      
      toast({
        title: "HAZOP Data Loaded",
        description: `Loaded deviation ${navState.hazop_deviation_id} for LOPA analysis.`,
      });
      
      window.history.replaceState({}, document.title);
      return;
    }

    const hazopStudyId = searchParams.get('hazop_study_id');
    const deviationId = searchParams.get('deviation_id');
    
    if (hazopStudyId && deviationId) {
      loadHazopDeviation(hazopStudyId, deviationId);
    }
  }, [location.state, searchParams]);

  const loadHazopDeviation = async (hazopStudyId: string, deviationId: string) => {
    try {
      const { data: hazopStudy, error } = await supabase
        .from('hazop_studies').select('*').eq('id', hazopStudyId).single();

      if (error) throw error;

      const deviations = hazopStudy.deviations as any[];
      const deviation = deviations?.find((d: any) => d.deviation_id === deviationId);

      if (deviation) {
        setFormData({
          hazop_study_id: hazopStudyId,
          hazop_deviation_id: deviationId,
          scenario_title: deviation.deviation || '',
          equipment_number: deviation.node_id || '',
          consequence_category: 'People',
          severity_level: mapHazopSeverityToLopa(deviation.initial_risk?.severity),
          hazop_node_id: deviation.node_id,
          hazop_deviation: deviation.deviation,
          hazop_causes: deviation.causes || [],
          hazop_consequences: deviation.consequences_unmitigated || '',
          hazop_existing_safeguards: deviation.existing_safeguards || [],
          hazop_initial_risk: deviation.initial_risk,
        });

        toast({
          title: "HAZOP Data Loaded",
          description: `Loaded deviation ${deviationId} from HAZOP study.`,
        });
      }
    } catch (error) {
      console.error('Error loading HAZOP deviation:', error);
      toast({
        title: "Error",
        description: "Failed to load HAZOP deviation data.",
        variant: "destructive",
      });
    }
  };

  const mapHazopSeverityToLopa = (severity?: string): string => {
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

  const handleLoadStudy = (study: any) => {
    setCurrentStudyId(study.id);
    setFormData({
      hazop_study_id: study.hazop_study_id,
      hazop_deviation_id: study.hazop_deviation_id,
      scenario_title: study.scenario_title,
      equipment_number: study.equipment_number || '',
      consequence_category: study.consequence_category || 'People',
      severity_level: study.severity_level || '',
      hazop_node_id: study.hazop_node_id,
      hazop_deviation: study.hazop_deviation,
      hazop_causes: study.hazop_causes || [],
      hazop_consequences: study.hazop_consequences,
      hazop_existing_safeguards: study.hazop_existing_safeguards || [],
      hazop_initial_risk: study.hazop_initial_risk,
    });
    
    setLopaResult({
      id: study.id,
      scenario_number: study.scenario_number,
      equipment_number: study.equipment_number || '',
      scenario_title: study.scenario_title,
      consequence_description: study.consequence_description || '',
      consequence_category: study.consequence_category || '',
      severity_level: study.severity_level || '',
      tmel: study.tmel,
      tmel_basis: study.tmel_basis || '',
      initiating_events: study.initiating_events || [],
      ipls: study.ipls || [],
      enabling_conditions: study.enabling_conditions || { probability: 1 },
      conditional_modifiers: study.conditional_modifiers || { time_at_risk: 1, ignition_probability: 1, vulnerability: 1 },
      iel_per_initiating_event: study.iel_per_initiating_event || [],
      total_iel: study.total_iel,
      iel_vs_tmel: study.total_iel > study.tmel ? 'REQUIRES_ADDITIONAL_PROTECTION' : 'ACCEPTABLE',
      pfd_target: study.pfd_target,
      pfd_target_safety: study.pfd_target_safety,
      pfd_target_environment: study.pfd_target_environment,
      pfd_target_financial: study.pfd_target_financial,
      sil_required: study.sil_required,
      sil_safety: study.sil_safety,
      sil_environment: study.sil_environment,
      sil_financial: study.sil_financial,
      recommendations: study.recommendations,
      notes_assumptions: study.notes_assumptions,
      hazop_study_id: study.hazop_study_id,
      hazop_deviation_id: study.hazop_deviation_id,
      hazop_node_id: study.hazop_node_id,
      hazop_deviation: study.hazop_deviation,
      hazop_causes: study.hazop_causes,
      hazop_consequences: study.hazop_consequences,
      hazop_existing_safeguards: study.hazop_existing_safeguards,
      hazop_initial_risk: study.hazop_initial_risk,
    });

    setIsHistoryOpen(false);
    toast({
      title: "Study Loaded",
      description: `Loaded LOPA study: ${study.scenario_title}`,
    });
  };

  const handleNewStudy = () => {
    setCurrentStudyId(undefined);
    setFormData({
      scenario_title: '', equipment_number: '',
      consequence_category: 'People', severity_level: '',
    });
    setLopaResult(null);
  };

  const handleStudySaved = (id: string) => {
    setCurrentStudyId(id);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t.pages.lopa.title}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t.pages.lopa.subtitle}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/hazop-study')}>
            {t.pages.lopa.backToHazop}
          </Button>
        </div>

        <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>{t.pages.lopa.previousStudies}</span>
              {isHistoryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <LopaStudyHistory onLoadStudy={handleLoadStudy} onNewStudy={handleNewStudy} />
          </CollapsibleContent>
        </Collapsible>

        <LopaForm
          formData={formData} setFormData={setFormData}
          onLopaGenerated={setLopaResult}
          isLoading={isLoading} setIsLoading={setIsLoading}
        />

        {lopaResult && (
          <LopaResults
            lopaData={lopaResult} formData={formData}
            studyId={currentStudyId} onStudySaved={handleStudySaved}
            isLoading={isLoading}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default LopaStudy;
