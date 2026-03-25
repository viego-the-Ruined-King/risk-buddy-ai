import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, Settings2, Info } from "lucide-react";
import type { HazidHazard } from "@/pages/HazidStudy";
import FileUpload, { UploadedFile } from "./FileUpload";
import { useLanguage } from "@/contexts/LanguageContext";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, Settings2 } from "lucide-react";
import type { HazidHazard } from "@/pages/HazidStudy";
import FileUpload, { UploadedFile } from "./FileUpload";
import { useLanguage } from "@/contexts/LanguageContext";

export interface HazidFormData {
  title: string;
  executiveSummary: string;
  purpose: string;
  scope: string;
  processDesignParameters?: string;
  materialHazardData?: string;
  keyInstrumentList?: string;
  organizationalContext?: string;
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
  const [processDesignParameters, setProcessDesignParameters] = useState(initialData?.processDesignParameters || "");
  const [materialHazardData, setMaterialHazardData] = useState(initialData?.materialHazardData || "");
  const [keyInstrumentList, setKeyInstrumentList] = useState(initialData?.keyInstrumentList || "");
  const [organizationalContext, setOrganizationalContext] = useState(initialData?.organizationalContext || "");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setExecutiveSummary(initialData.executiveSummary);
      setPurpose(initialData.purpose);
      setScope(initialData.scope);
      setProcessDesignParameters(initialData.processDesignParameters || "");
      setMaterialHazardData(initialData.materialHazardData || "");
      setKeyInstrumentList(initialData.keyInstrumentList || "");
      setOrganizationalContext(initialData.organizationalContext || "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in to generate HAZID studies.');

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
            title, executive_summary: executiveSummary, purpose, scope,
            process_design_parameters: processDesignParameters,
            material_hazard_data: materialHazardData,
            key_instrument_list: keyInstrumentList,
            organizational_context: organizationalContext,
            images: uploadedFiles.map(f => ({ base64: f.base64, type: f.type, name: f.name }))
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) throw new Error('Please log in.');
        if (response.status === 429) throw new Error('Rate limit exceeded.');
        if (response.status === 402) throw new Error('Usage limit reached.');
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data?.error) throw new Error(data.error);

      if (data && data.hazards) {
        onHazardsGenerated(data.hazards);
        onFormDataChange({ title, executiveSummary, purpose, scope, processDesignParameters, materialHazardData, keyInstrumentList, organizationalContext });
        toast({ title: t.common.success, description: `${data.hazards.length} ${t.results.hazid.hazards}` });
      } else {
        throw new Error('No hazards returned from AI.');
      }
    } catch (error) {
      console.error('Error generating HAZID study:', error);
      let errorMessage = "Failed to generate HAZID study.";
      if (error instanceof Error) {
        errorMessage = error.name === 'AbortError' ? 'Request timed out.' : error.message;
      }
      toast({ title: t.common.error, description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_0_rgba(0,217,163,0.15)] transition-all duration-300">
      <CardHeader className="space-y-2 sm:space-y-3 p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl font-bold">{t.forms.hazid.title}</CardTitle>
        <CardDescription className="text-sm sm:text-base">{t.forms.hazid.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="title" className="text-sm sm:text-base font-semibold">{t.forms.hazid.studyTitle}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.forms.hazid.studyTitlePlaceholder} required className="bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base" />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="executive_summary" className="text-sm sm:text-base font-semibold">{t.forms.hazid.executiveSummary}</Label>
            <Textarea id="executive_summary" value={executiveSummary} onChange={(e) => setExecutiveSummary(e.target.value)} placeholder={t.forms.hazid.executiveSummaryPlaceholder} required className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="purpose" className="text-sm sm:text-base font-semibold">{t.forms.hazid.purpose}</Label>
              <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={t.forms.hazid.purposePlaceholder} required className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="scope" className="text-sm sm:text-base font-semibold">{t.forms.hazid.scope}</Label>
              <Textarea id="scope" value={scope} onChange={(e) => setScope(e.target.value)} placeholder={t.forms.hazid.scopePlaceholder} required className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base" />
            </div>
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full flex items-center justify-between p-3 sm:p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-primary/10 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-sm sm:text-base font-medium">{t.forms.hazid.advancedInputs}</span>
                </div>
                <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm sm:text-base font-semibold">{t.forms.hazid.processDesignParameters}</Label>
                  <Textarea value={processDesignParameters} onChange={(e) => setProcessDesignParameters(e.target.value)} placeholder={t.forms.hazid.processDesignPlaceholder} className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm sm:text-base font-semibold">{t.forms.hazid.materialHazardData}</Label>
                  <Textarea value={materialHazardData} onChange={(e) => setMaterialHazardData(e.target.value)} placeholder={t.forms.hazid.materialHazardPlaceholder} className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm sm:text-base font-semibold">{t.forms.hazid.keyInstrumentList}</Label>
                  <Textarea value={keyInstrumentList} onChange={(e) => setKeyInstrumentList(e.target.value)} placeholder={t.forms.hazid.keyInstrumentPlaceholder} className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm sm:text-base font-semibold">{t.forms.hazid.organizationalContext}</Label>
                  <Textarea value={organizationalContext} onChange={(e) => setOrganizationalContext(e.target.value)} placeholder={t.forms.hazid.organizationalContextPlaceholder} className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40 transition-all duration-200 text-sm sm:text-base" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <FileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} disabled={isLoading} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" disabled={isLoading} className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">{t.forms.hazid.generating}</span>
                    <span className="sm:hidden">{t.forms.hazid.generatingShort}</span>
                  </>
                ) : (
                  t.forms.hazid.generateStudy
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{t.enterprise.aiDraftHint}</p></TooltipContent>
          </Tooltip>
          <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Info className="h-3 w-3" /> {t.enterprise.aiDraftHint}
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default HazidForm;