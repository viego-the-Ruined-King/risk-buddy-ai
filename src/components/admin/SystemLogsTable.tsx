import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { FileText, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Json } from '@/integrations/supabase/types';

interface SystemLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Json;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface SystemLogsTableProps {
  logs: SystemLog[];
  onRefresh: () => void;
  isLoading?: boolean;
}

const getActionBadgeVariant = (action: string) => {
  if (action.includes('error') || action.includes('fail')) return 'destructive';
  if (action.includes('auth') || action.includes('login')) return 'default';
  if (action.includes('create') || action.includes('success')) return 'secondary';
  return 'outline';
};

export function SystemLogsTable({ logs, onRefresh, isLoading }: SystemLogsTableProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            System Logs
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border/30 hover:bg-muted/20"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.user_id ? `${log.user_id.slice(0, 8)}...` : 'System'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 ? (
                        <pre className="text-xs text-muted-foreground truncate">
                          {JSON.stringify(log.details)}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {log.user_agent || '—'}
                    </TableCell>
                  </motion.tr>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No system logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
