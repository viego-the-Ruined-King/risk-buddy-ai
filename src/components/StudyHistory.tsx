import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, History, FileText, ShieldCheck, ClipboardList, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HazidStudy {
  id: string;
  title: string;
  executive_summary: string | null;
  purpose: string | null;
  scope: string | null;
  hazards: any[];
  created_at: string;
  updated_at: string;
}

interface RiskAssessment {
  id: string;
  title: string;
  description: string | null;
  activity_type: string | null;
  location: string | null;
  hazards: any[];
  created_at: string;
  updated_at: string;
}

interface StudyHistoryProps {
  type: 'hazid' | 'risk' | 'hazop';
  onLoadStudy: (study: HazidStudy | RiskAssessment) => void;
}

export const StudyHistory = ({ type, onLoadStudy }: StudyHistoryProps) => {
  const [studies, setStudies] = useState<(HazidStudy | RiskAssessment)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const fetchStudies = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const table = type === 'hazid' ? 'hazid_studies' : type === 'hazop' ? 'hazop_studies' : 'risk_assessments';
      const { data, error } = await supabase.from(table).select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      const typedData = (data || []).map((item: any) => ({ ...item, hazards: Array.isArray(item.hazards) ? item.hazards : [] }));
      setStudies(typedData);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t.common.error, description: "Failed to load.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchStudies(); }, [user, type]);

  const handleDelete = async (id: string) => {
    try {
      const table = type === 'hazid' ? 'hazid_studies' : type === 'hazop' ? 'hazop_studies' : 'risk_assessments';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setStudies(prev => prev.filter(s => s.id !== id));
      toast({ title: t.common.deleted, description: t.history.deleteStudy });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t.common.error, description: "Failed to delete.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/40 backdrop-blur-xl border-primary/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (studies.length === 0) {
    return (
      <Card className="bg-card/40 backdrop-blur-xl border-primary/10">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t.history.noStudies}</p>
          <p className="text-sm text-muted-foreground/70">{t.history.noStudiesHint}</p>
        </CardContent>
      </Card>
    );
  }

  const Icon = type === 'hazid' ? FileText : type === 'hazop' ? ClipboardList : ShieldCheck;

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-primary/10">
      <CardContent className="space-y-3 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {studies.map((study, index) => (
            <motion.div key={study.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0"><Icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">{study.title}</p>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="truncate">{format(new Date(study.updated_at), 'MMM d, yyyy')}</span>
                    <span className="text-primary">•</span>
                    <span className="flex-shrink-0">{(study.hazards as any[])?.length || 0} {t.history.hazardsCount}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 ml-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => onLoadStudy(study)} className="h-7 sm:h-8 text-xs px-2 sm:px-3">
                  <span className="hidden sm:inline">{t.history.continueStudy}</span>
                  <span className="sm:hidden">{t.history.open}</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg mx-auto">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base sm:text-lg">{t.history.deleteStudy}</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        {t.history.deleteConfirm.replace('{title}', study.title)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                      <AlertDialogCancel className="w-full sm:w-auto">{t.history.cancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(study.id)} className="w-full sm:w-auto">{t.history.delete}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
