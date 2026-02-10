import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LopaStudyHistoryProps {
  onLoadStudy: (study: any) => void;
  onNewStudy: () => void;
}

const LopaStudyHistory = ({ onLoadStudy, onNewStudy }: LopaStudyHistoryProps) => {
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => { if (user) loadStudies(); }, [user]);

  const loadStudies = async () => {
    try {
      const { data, error } = await supabase.from('lopa_studies').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setStudies(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t.common.error, description: "Failed to load.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('lopa_studies').delete().eq('id', id);
      if (error) throw error;
      setStudies(studies.filter(s => s.id !== id));
      toast({ title: t.common.deleted, description: t.history.deleteStudy });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t.common.error, description: "Failed to delete.", variant: "destructive" });
    }
  };

  const getSilBadgeColor = (sil?: string) => {
    if (!sil || sil === 'None') return 'bg-green-500/20 text-green-700';
    if (sil === 'SIL-1') return 'bg-yellow-500/20 text-yellow-700';
    if (sil === 'SIL-2') return 'bg-orange-500/20 text-orange-700';
    if (sil === 'SIL-3' || sil === 'SIL-4') return 'bg-red-500/20 text-red-700';
    return 'bg-muted';
  };

  if (isLoading) {
    return <Card className="mt-4"><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t.history.loadingStudies}</p></CardContent></Card>;
  }

  return (
    <Card className="mt-4 bg-card/40 backdrop-blur-xl border-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t.history.previousLopa} ({studies.length})</h3>
          <Button variant="outline" size="sm" onClick={onNewStudy}>
            <Plus className="h-4 w-4 mr-1" />{t.history.newStudy}
          </Button>
        </div>

        {studies.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.history.noPreviousLopa}</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {studies.map((study) => (
              <div key={study.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium truncate">{study.scenario_title}</span>
                    <Badge className={`${getSilBadgeColor(study.sil_required)} text-xs`}>{study.sil_required || t.common.none}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{study.scenario_number}</span>
                    <span>•</span>
                    <span>{new Date(study.created_at).toLocaleDateString()}</span>
                    {study.hazop_study_id && (<><span>•</span><span className="text-primary">{t.history.linkedToHazop}</span></>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => onLoadStudy(study)}>{t.history.load}</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.history.deleteLopaTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{t.history.deleteLopaConfirm.replace('{title}', study.scenario_title)}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.history.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(study.id)} className="bg-destructive text-destructive-foreground">{t.history.delete}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LopaStudyHistory;