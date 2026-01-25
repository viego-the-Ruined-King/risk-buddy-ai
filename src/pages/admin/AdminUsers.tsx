import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UsersTable } from '@/components/admin/UsersTable';
import { ActivityLog } from '@/components/admin/ActivityLog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const { 
    isAdmin, 
    isLoading, 
    users,
    userActivity,
    fetchUsers, 
    fetchUserActivity,
    assignRole,
    removeRole,
  } = useAdmin();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleViewActivity = async (userId: string) => {
    setSelectedUserId(userId);
    await fetchUserActivity(userId, 50);
    setIsActivityDialogOpen(true);
  };

  const handleAssignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    const { error } = await assignRole(userId, role);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Role "${role}" assigned successfully`,
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    const { error } = await removeRole(userId, role);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove role',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Role removed successfully',
      });
    }
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage registered users
          </p>
        </div>

        <UsersTable 
          users={users}
          onViewActivity={handleViewActivity}
          onAssignRole={handleAssignRole}
          onRemoveRole={handleRemoveRole}
        />

        <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>User Activity History</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh]">
              <ActivityLog 
                activities={userActivity.filter(a => a.user_id === selectedUserId)} 
                title="Activity"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
