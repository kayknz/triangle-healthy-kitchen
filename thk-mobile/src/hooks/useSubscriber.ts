import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { type Subscriber } from '@/types/subscription';

/**
 * Hook to manage subscriber profile data and synchronization.
 * Extracts data access logic from UI components.
 */
export function useSubscriber() {
  const { user } = useAuth();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriber = useCallback(async () => {
    if (!user) {
      setSubscriber(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: subData, error: fetchError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (subData) {
        let region = null;
        if (subData.preferred_region_id) {
          try {
            const { data: comm } = await supabase
              .from('regional_communities')
              .select('name, image_url')
              .eq('id', subData.preferred_region_id)
              .maybeSingle();
            region = comm;
          } catch (e) {
            // Ignore if regional_communities is missing
          }
        }
        setSubscriber({ ...subData, preferred_region: region } as Subscriber);
      } else {
        setSubscriber(null);
      }
      setError(null);
    } catch (err: any) {
      console.error('[useSubscriber] Failed to load:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSubscriber();
  }, [loadSubscriber]);

  const updateProfile = async (updates: Partial<Subscriber>) => {
    if (!subscriber) return { error: 'No active subscriber session' };

    try {
      const { data, error: updateError } = await supabase
        .from('subscribers')
        .update(updates)
        .eq('id', subscriber.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setSubscriber(data as Subscriber);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  return {
    subscriber,
    loading,
    error,
    refresh: loadSubscriber,
    updateProfile
  };
}
