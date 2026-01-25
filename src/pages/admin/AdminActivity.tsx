import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ActivityLog } from '@/components/admin/ActivityLog';

export default function AdminActivity() {
  const { 
    isAdmin, 
    isLoading, 
    userActivity,
    fetchUserActivity,
  } = useAdmin();

  useEffect(() => {
    if (isAdmin) {
      fetchUserActivity(undefined, 200);
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
          <h1 className="text-3xl font-bold">Activity Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Track all user actions across the platform
          </p>
        </div>

        <ActivityLog 
          activities={userActivity} 
          title="All Activity" 
          showUserId 
        />
      </div>
    </AdminLayout>
  );
}
