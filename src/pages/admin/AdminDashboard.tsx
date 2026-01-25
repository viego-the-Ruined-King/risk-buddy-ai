import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { AIUsageChart } from '@/components/admin/AIUsageChart';
import { ActivityLog } from '@/components/admin/ActivityLog';

export default function AdminDashboard() {
  const { 
    isAdmin, 
    isLoading, 
    stats,
    aiUsageStats,
    userActivity,
    fetchStats, 
    fetchAIUsageStats,
    fetchUserActivity,
  } = useAdmin();

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchAIUsageStats();
      fetchUserActivity(undefined, 20);
    }
  }, [isAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system activity and user statistics
          </p>
        </div>

        <AdminStatsCards stats={stats} isLoading={isLoading} />
        
        <AIUsageChart stats={aiUsageStats} />
        
        <ActivityLog 
          activities={userActivity} 
          title="Recent User Activity" 
          showUserId 
        />
      </div>
    </AdminLayout>
  );
}
