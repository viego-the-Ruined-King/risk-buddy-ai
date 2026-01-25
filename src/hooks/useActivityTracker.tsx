import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

export function useActivityTracker() {
  const { user } = useAuth();

  const trackActivity = useCallback(async (
    activityType: string,
    activityDescription?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        activity_type: activityType,
        activity_description: activityDescription || null,
        metadata: (metadata || {}) as Json,
        page_url: window.location.pathname,
      });
    } catch (err) {
      console.error('Error tracking activity:', err);
    }
  }, [user]);

  const logSystemEvent = useCallback(async (
    action: string,
    details?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      await supabase.from('system_logs').insert({
        user_id: user.id,
        action,
        details: (details || {}) as Json,
        user_agent: navigator.userAgent,
      });
    } catch (err) {
      console.error('Error logging system event:', err);
    }
  }, [user]);

  const trackAIUsage = useCallback(async (
    functionName: string,
    tokensUsed: number,
    modelUsed?: string
  ) => {
    if (!user) return;

    try {
      await supabase.from('ai_usage_stats').insert({
        user_id: user.id,
        function_name: functionName,
        tokens_used: tokensUsed,
        model_used: modelUsed || null,
      });
    } catch (err) {
      console.error('Error tracking AI usage:', err);
    }
  }, [user]);

  return {
    trackActivity,
    logSystemEvent,
    trackAIUsage,
  };
}
