import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import type { HazidHazard } from "@/pages/HazidStudy";
import FileUpload, { UploadedFile } from "./FileUpload";

export interface HazidFormData {
  title: string;
  executiveSummary: string;
  purpose: string;
  scope: string;
}

interface HazidFormProps {
  onHazardsGenerated: (hazards: HazidHazard[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onFormDataChange: (data: HazidFormData) => void;
  initialData?: HazidFormData;
  onNewStudy?: () => void;
}

const HazidForm = ({ onHazardsGenerated, isLoading, setIsLoading, onFormDataChange, initialData, onNewStudy }: HazidFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [executiveSummary, setExecutiveSummary] = useState(initialData?.executiveSummary || "");
  const [purpose, setPurpose] = useState(initialData?.purpose || "");
  const [scope, setScope] = useState(initialData?.scope || "");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  // Update form when initialData changes (loading a saved study)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setExecutiveSummary(initialData.executiveSummary);
      setPurpose(initialData.purpose);
      setScope(initialData.scope);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Invoking hazid-study function...');
      
      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to generate HAZID studies.');
      }

      // Use direct fetch with longer timeout (3 minutes) to handle AI processing time
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hazid-study`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            title, 
            executive_summary: executiveSummary,
            purpose,
            scope,
            images: uploadedFiles.map(f => ({
              base64: f.base64,
              type: f.type,
              name: f.name
            }))
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to generate HAZID studies.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (response.status === 402) {
          throw new Error('Usage limit reached. Please add credits to continue.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data && data.hazards) {
        onHazardsGenerated(data.hazards);
        onFormDataChange({ title, executiveSummary, purpose, scope });
        toast({
          title: "Success",
          description: `Generated ${data.hazards.length} hazards for your HAZID study.`,
        });
      } else {
        throw new Error('No hazards returned from AI. Please try again.');
      }
    } catch (error) {
      console.error('Error generating HAZID study:', error);
      let errorMessage = "Failed to generate HAZID study. Please try again.";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The AI is taking too long. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_0_rgba(0,217,163,0.15)] transition-all duration-300">
      <CardHeader className="space-y-2 sm:space-y-3 p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl font-bold">HAZID Study Details</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Enter the study information to generate a comprehensive hazard identification analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="title" className="text-sm sm:text-base font-semibold">
              HAZID Study Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the study title"
              required
              className="bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="executive_summary" className="text-sm sm:text-base font-semibold">
              Executive Summary
            </Label>
            <Textarea
              id="executive_summary"
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              placeholder="Provide a brief executive summary"
              required
              className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="purpose" className="text-sm sm:text-base font-semibold">
              Purpose
            </Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe the purpose of this HAZID study"
              required
              className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="scope" className="text-sm sm:text-base font-semibold">
              Scope
            </Label>
            <Textarea
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Define the scope of this HAZID study"
              required
            className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          <FileUpload
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
            disabled={isLoading}
          />

          <Button
            type="submit" 
            disabled={isLoading}
            className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="hidden sm:inline">Generating HAZID Study...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              "Generate HAZID Study"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default HazidForm;
