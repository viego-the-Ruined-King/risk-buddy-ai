import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SystemLogsTable } from '@/components/admin/SystemLogsTable';

export default function AdminLogs() {
  const { 
    isAdmin, 
    isLoading, 
    systemLogs,
    fetchSystemLogs,
  } = useAdmin();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchSystemLogs(200);
    }
  }, [isAdmin]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSystemLogs(200);
    setIsRefreshing(false);
  };

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
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground mt-1">
            View system events and error logs
          </p>
        </div>

        <SystemLogsTable 
          logs={systemLogs}
          onRefresh={handleRefresh}
          isLoading={isRefreshing}
        />
      </div>
    </AdminLayout>
  );
}
