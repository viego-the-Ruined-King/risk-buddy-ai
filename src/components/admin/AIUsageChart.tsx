import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AIUsageStat {
  id: string;
  user_id: string;
  function_name: string;
  tokens_used: number;
  request_count: number;
  model_used: string | null;
  created_at: string;
}

interface AIUsageChartProps {
  stats: AIUsageStat[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AIUsageChart({ stats }: AIUsageChartProps) {
  const usageByFunction = useMemo(() => {
    const grouped = stats.reduce((acc, stat) => {
      if (!acc[stat.function_name]) {
        acc[stat.function_name] = { tokens: 0, requests: 0 };
      }
      acc[stat.function_name].tokens += stat.tokens_used;
      acc[stat.function_name].requests += stat.request_count;
      return acc;
    }, {} as Record<string, { tokens: number; requests: number }>);

    return Object.entries(grouped).map(([name, data]) => ({
      name: name.replace(/-/g, ' '),
      tokens: data.tokens,
      requests: data.requests,
    }));
  }, [stats]);

  const usageByUser = useMemo(() => {
    const grouped = stats.reduce((acc, stat) => {
      if (!acc[stat.user_id]) {
        acc[stat.user_id] = { tokens: 0, requests: 0 };
      }
      acc[stat.user_id].tokens += stat.tokens_used;
      acc[stat.user_id].requests += stat.request_count;
      return acc;
    }, {} as Record<string, { tokens: number; requests: number }>);

    return Object.entries(grouped)
      .map(([userId, data]) => ({
        name: `${userId.slice(0, 6)}...`,
        value: data.tokens,
        requests: data.requests,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [stats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-card/50 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Usage by Function
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usageByFunction.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageByFunction}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="tokens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No AI usage data yet
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/50 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Users by Token Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usageByUser.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usageByUser}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {usageByUser.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [`${value.toLocaleString()} tokens`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No AI usage data yet
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
