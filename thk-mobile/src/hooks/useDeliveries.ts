import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { type RiderDelivery } from '@/types/shared';
import { getQatarDate } from '@/lib/date-utils';

/**
 * Hook to manage deliveries for both riders and subscribers.
 */
export function useDeliveries() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActiveDelivery = useCallback(async (subscriberId: string) => {
    const today = getQatarDate();

    const { data, error: fetchError } = await supabase
      .from('rider_deliveries')
      .select('*, rider_applications(current_lat, current_lng, last_active_at)')
      .eq('subscriber_id', subscriberId)
      .eq('delivery_date', today)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchError) {
      console.error('[useDeliveries] Failed to load active:', fetchError);
      return null;
    }
    return data as RiderDelivery | null;
  }, []);

  const getDeliveryCount = useCallback(async (subscriberId: string, status: string = 'delivered') => {
    const { count, error: countError } = await supabase
      .from('rider_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_id', subscriberId)
      .eq('status', status);

    return count || 0;
  }, []);

  const updateDeliveryStatus = async (deliveryId: string, status: string, notes?: string) => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('rider_deliveries')
        .update({
          status,
          notes,
          delivered_at: status === 'delivered' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (updateError) throw updateError;
      setError(null);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getActiveDelivery,
    getDeliveryCount,
    updateDeliveryStatus
  };
}
