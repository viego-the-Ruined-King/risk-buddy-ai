import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  role: string | null;
}

interface SystemLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Json;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AIUsageStat {
  id: string;
  user_id: string;
  function_name: string;
  tokens_used: number;
  request_count: number;
  model_used: string | null;
  created_at: string;
}

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string | null;
  metadata: Json;
  page_url: string | null;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  active_today: number;
  total_ai_requests: number;
  total_tokens_used: number;
}

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [aiUsageStats, setAIUsageStats] = useState<AIUsageStat[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    const { data, error } = await supabase
      .from('admin_users_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setUsers((data as AdminUser[]) || []);
  };

  const fetchSystemLogs = async (limit = 100) => {
    if (!isAdmin) return;
    
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching system logs:', error);
      return;
    }

    setSystemLogs((data as SystemLog[]) || []);
  };

  const fetchAIUsageStats = async () => {
    if (!isAdmin) return;
    
    const { data, error } = await supabase
      .from('ai_usage_stats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI usage stats:', error);
      return;
    }

    setAIUsageStats((data as AIUsageStat[]) || []);
  };

  const fetchUserActivity = async (userId?: string, limit = 100) => {
    if (!isAdmin) return;
    
    let query = supabase
      .from('user_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user activity:', error);
      return;
    }

    setUserActivity((data as UserActivity[]) || []);
  };

  const fetchStats = async () => {
    if (!isAdmin) return;
    
    const { data, error } = await supabase.rpc('get_admin_user_stats');

    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }

    if (data && data.length > 0) {
      setStats(data[0]);
    }
  };

  const assignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    if (!isAdmin) return { error: new Error('Unauthorized') };
    
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });

    if (!error) {
      await fetchUsers();
    }

    return { error };
  };

  const removeRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    if (!isAdmin) return { error: new Error('Unauthorized') };
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (!error) {
      await fetchUsers();
    }

    return { error };
  };

  return {
    isAdmin,
    isLoading,
    users,
    systemLogs,
    aiUsageStats,
    userActivity,
    stats,
    fetchUsers,
    fetchSystemLogs,
    fetchAIUsageStats,
    fetchUserActivity,
    fetchStats,
    assignRole,
    removeRole,
    checkAdminStatus,
  };
}
