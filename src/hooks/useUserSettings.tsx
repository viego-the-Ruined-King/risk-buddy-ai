import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface RiskMatrixConfig {
  scale: number;
  likelihood_labels: string[];
  severity_labels: string[];
  colors: {
    low: string;
    medium: string;
    high: string;
    extreme: string;
  };
  matrix: number[][];
}

export interface UserSettings {
  id: string;
  user_id: string;
  industry_standards: string[];
  risk_matrix: RiskMatrixConfig;
  created_at: string;
  updated_at: string;
}

const DEFAULT_MATRIX: RiskMatrixConfig = {
  scale: 5,
  likelihood_labels: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'],
  severity_labels: ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
  colors: { low: '#22c55e', medium: '#eab308', high: '#f97316', extreme: '#ef4444' },
  matrix: [
    [1,1,2,2,3],
    [1,2,2,3,3],
    [2,2,3,3,4],
    [2,3,3,4,4],
    [3,3,4,4,4],
  ],
};

export function useUserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default settings
        const { data: newData, error: insertError } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (insertError) throw insertError;
        setSettings({
          ...newData,
          industry_standards: (newData.industry_standards as string[]) || [],
          risk_matrix: (newData.risk_matrix as unknown as RiskMatrixConfig) || DEFAULT_MATRIX,
        });
      } else {
        setSettings({
          ...data,
          industry_standards: (data.industry_standards as string[]) || [],
          risk_matrix: (data.risk_matrix as unknown as RiskMatrixConfig) || DEFAULT_MATRIX,
        });
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Pick<UserSettings, 'industry_standards' | 'risk_matrix'>>) => {
    if (!user || !settings) return;
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
      setSettings(prev => prev ? { ...prev, ...updates } : prev);
      toast({ title: 'Settings saved', description: 'Your configuration has been updated.' });
    } catch (err: any) {
      toast({ title: 'Error saving settings', description: err.message, variant: 'destructive' });
    }
  };

  return { settings, isLoading, updateSettings, refetch: fetchSettings };
}
