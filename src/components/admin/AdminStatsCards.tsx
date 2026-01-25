import { motion } from 'framer-motion';
import { Users, Activity, Cpu, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdminStats {
  total_users: number;
  active_today: number;
  total_ai_requests: number;
  total_tokens_used: number;
}

interface AdminStatsCardsProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

const statsConfig = [
  {
    key: 'total_users',
    label: 'Total Users',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    key: 'active_today',
    label: 'Active Today',
    icon: Activity,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    key: 'total_ai_requests',
    label: 'AI Requests',
    icon: Cpu,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    key: 'total_tokens_used',
    label: 'Tokens Used',
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    format: (val: number) => val.toLocaleString(),
  },
];

export function AdminStatsCards({ stats, isLoading }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((config, index) => (
        <motion.div
          key={config.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                  <p className="text-3xl font-bold mt-1">
                    {isLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : stats ? (
                      config.format 
                        ? config.format(stats[config.key as keyof AdminStats] as number)
                        : stats[config.key as keyof AdminStats]
                    ) : (
                      '0'
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${config.bgColor}`}>
                  <config.icon className={`h-6 w-6 ${config.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
