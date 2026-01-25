import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Activity, Clock, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Json } from '@/integrations/supabase/types';

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string | null;
  metadata: Json;
  page_url: string | null;
  created_at: string;
}

interface ActivityLogProps {
  activities: UserActivity[];
  title?: string;
  showUserId?: boolean;
}

const getActivityColor = (type: string) => {
  const typeMap: Record<string, string> = {
    login: 'bg-green-500/10 text-green-500',
    logout: 'bg-yellow-500/10 text-yellow-500',
    study_created: 'bg-blue-500/10 text-blue-500',
    study_updated: 'bg-purple-500/10 text-purple-500',
    ai_request: 'bg-cyan-500/10 text-cyan-500',
    export: 'bg-amber-500/10 text-amber-500',
    error: 'bg-red-500/10 text-red-500',
  };
  return typeMap[type] || 'bg-muted text-muted-foreground';
};

export function ActivityLog({ activities, title = 'Recent Activity', showUserId = false }: ActivityLogProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getActivityColor(activity.activity_type)}>
                        {activity.activity_type.replace(/_/g, ' ')}
                      </Badge>
                      {showUserId && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {activity.user_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    {activity.activity_description && (
                      <p className="text-sm text-foreground mb-2">
                        {activity.activity_description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(activity.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </span>
                      {activity.page_url && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {activity.page_url}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {activity.metadata && typeof activity.metadata === 'object' && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-3 p-2 rounded bg-background/50">
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                      {JSON.stringify(activity.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No activity recorded yet
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
