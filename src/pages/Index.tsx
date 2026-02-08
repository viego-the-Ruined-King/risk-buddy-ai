import { useState } from "react";
import { RiskAssessmentForm } from "@/components/RiskAssessmentForm";
import { RiskResults } from "@/components/RiskResults";
import { StudyHistory } from "@/components/StudyHistory";
import { AppLayout } from "@/components/AppLayout";
import { ShieldCheck } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { History, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const [results, setResults] = useState<any>(null);
  const [assessmentId, setAssessmentId] = useState<string | undefined>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activityDetails, setActivityDetails] = useState<{
    title: string;
    description: string;
    activityType: string;
    location: string;
  } | null>(null);
  const { t } = useLanguage();

  const handleResults = (data: any, details?: any) => {
    setResults(data);
    if (details) setActivityDetails(details);
    setAssessmentId(undefined);
  };

  const handleNewHazards = (newHazards: any[]) => {
    setResults((prev: any) => ({ hazards: [...prev.hazards, ...newHazards] }));
  };

  const handleLoadStudy = (study: any) => {
    setActivityDetails({
      title: study.title,
      description: study.description || "",
      activityType: study.activity_type || "",
      location: study.location || "",
    });
    setResults({ hazards: study.hazards || [] });
    setAssessmentId(study.id);
    setHistoryOpen(false);
  };

  return (
    <AppLayout
      title={t.pages.riskAssessment.title}
      subtitle={t.pages.riskAssessment.subtitle}
      icon={<ShieldCheck className="h-5 w-5 text-primary" />}
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
            <StudyHistory type="risk" onLoadStudy={handleLoadStudy} />
          </CollapsibleContent>
        </Collapsible>

        <RiskAssessmentForm onResults={handleResults} initialData={activityDetails || undefined} />

        {results && activityDetails && (
          <RiskResults
            data={results}
            activityTitle={activityDetails.title}
            activityDescription={activityDetails.description}
            activityType={activityDetails.activityType}
            location={activityDetails.location}
            onNewHazards={handleNewHazards}
            assessmentId={assessmentId}
            onAssessmentSaved={setAssessmentId}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
