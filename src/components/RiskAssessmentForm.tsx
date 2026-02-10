import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import FileUpload, { UploadedFile } from "./FileUpload";
import { useLanguage } from "@/contexts/LanguageContext";

interface RiskAssessmentFormProps {
  onResults: (results: any, details?: any) => void;
  initialData?: {
    title: string;
    description: string;
    activityType: string;
    location: string;
  };
}

export const RiskAssessmentForm = ({ onResults, initialData }: RiskAssessmentFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [activityType, setActivityType] = useState(initialData?.activityType || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setActivityType(initialData.activityType);
      setLocation(initialData.location);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !activityType.trim() || !location.trim()) {
      toast({
        title: t.forms.risk.missingInfo,
        description: t.forms.risk.missingInfoDesc,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('assess-risk', {
        body: { 
          title: title.trim(),
          description: description.trim(),
          activity_type: activityType.trim(),
          location: location.trim(),
          images: uploadedFiles.map(f => ({
            base64: f.base64,
            type: f.type,
            name: f.name
          }))
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      onResults(data, {
        title: title.trim(),
        description: description.trim(),
        activityType: activityType.trim(),
        location: location.trim()
      });
      toast({
        title: t.forms.risk.assessmentComplete,
        description: `${data.hazards?.length || 0} ${t.results.risk.hazardsIdentified}`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t.forms.risk.assessmentFailed,
        description: error instanceof Error ? error.message : t.common.error,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-b from-card to-card/95 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">{t.forms.risk.title}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t.forms.risk.subtitle}</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="title" className="text-sm">{t.forms.risk.assessmentTitle}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.forms.risk.assessmentTitlePlaceholder}
              disabled={isLoading}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-sm">{t.forms.risk.description}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.forms.risk.descriptionPlaceholder}
              rows={3}
              disabled={isLoading}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="activityType" className="text-sm">{t.forms.risk.activityType}</Label>
              <Input
                id="activityType"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                placeholder={t.forms.risk.activityTypePlaceholder}
                disabled={isLoading}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="location" className="text-sm">{t.forms.risk.location}</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.forms.risk.locationPlaceholder}
                disabled={isLoading}
                className="text-sm sm:text-base"
              />
            </div>
          </div>
        </div>

        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          disabled={isLoading}
        />

        <Button
          type="submit" 
          className="w-full text-sm sm:text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.forms.risk.analyzing}
            </>
          ) : (
            t.forms.risk.assessRisks
          )}
        </Button>
      </form>
    </Card>
  );
};