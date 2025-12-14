import { useState } from "react";
import { RiskAssessmentForm } from "@/components/RiskAssessmentForm";
import { RiskResults } from "@/components/RiskResults";
import { StudyHistory } from "@/components/StudyHistory";
import { UserMenu } from "@/components/UserMenu";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ShieldCheck } from "lucide-react";

const Index = () => {
  const [results, setResults] = useState<any>(null);
  const [assessmentId, setAssessmentId] = useState<string | undefined>();
  const [activityDetails, setActivityDetails] = useState<{
    title: string;
    description: string;
    activityType: string;
    location: string;
  } | null>(null);

  const handleResults = (data: any, details?: any) => {
    setResults(data);
    if (details) {
      setActivityDetails(details);
    }
    setAssessmentId(undefined); // New assessment
  };

  const handleNewHazards = (newHazards: any[]) => {
    setResults((prev: any) => ({
      hazards: [...prev.hazards, ...newHazards]
    }));
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
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <div className="flex justify-end mb-2 sm:mb-4">
          <UserMenu />
        </div>
        <header className="text-center mb-6 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3">
            Risk Assessment
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            AI-powered hazard identification using EGPC Corporate Risk Matrix
          </p>
        </header>

        {/* Mobile: History as horizontal scroll at top */}
        <div className="md:hidden mb-4">
          <StudyHistory type="risk" onLoadStudy={handleLoadStudy} />
        </div>

        <div className="grid gap-4 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            <RiskAssessmentForm 
              onResults={handleResults} 
              initialData={activityDetails || undefined}
            />
            
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
          
          {/* Desktop: History in sidebar */}
          <div className="hidden md:block lg:col-span-1">
            <StudyHistory type="risk" onLoadStudy={handleLoadStudy} />
          </div>
        </div>
      </div>
      
      <MobileBottomNav />
    </div>
  );
};

export default Index;