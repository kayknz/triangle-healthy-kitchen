import { Health } from '@capgo/capacitor-health';
import { supabase } from '@/lib/supabase';
import { getQatarStartOfDay, getUTCISO } from '@/lib/date-utils';

/**
 * Sync Status for Health data
 */
export interface HealthSyncStatus {
  lastSyncTimestamp: number | null;
  permissionErrors: string[];
  isAvailable: boolean;
  sourcePlatform: string | null;
}

let syncStatus: HealthSyncStatus = {
  lastSyncTimestamp: null,
  permissionErrors: [],
  isAvailable: false,
  sourcePlatform: null,
};

type Listener = (status: HealthSyncStatus) => void;
const listeners = new Set<Listener>();

function updateStatus(updates: Partial<HealthSyncStatus>) {
  syncStatus = { ...syncStatus, ...updates };
  listeners.forEach((listener) => listener(syncStatus));
}

/**
 * Store to track health sync state
 */
export const healthSyncStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(syncStatus);
    return () => listeners.delete(listener);
  },
  getStatus: () => syncStatus,
};

/**
 * Checks if health data is available on the current device.
 * iOS (HealthKit) and Android (Health Connect).
 */
export const checkHealthAvailability = async (): Promise<boolean> => {
  try {
    const result = await Health.isAvailable();
    const platformName = result.platform === 'ios' ? 'Apple Health' : 'Health Connect';
    updateStatus({
      isAvailable: result.available,
      sourcePlatform: platformName
    });
    return result.available;
  } catch (error) {
    console.error('[Health] Availability check failed:', error);
    updateStatus({ isAvailable: false });
    return false;
  }
};

/**
 * Requests permissions for steps, distance, and activity (workouts).
 */
export const requestHealthPermissions = async (): Promise<boolean> => {
  try {
    const result = await Health.requestAuthorization({
      read: ['steps', 'distance', 'workouts'],
    });

    const hasErrors = result.readDenied.length > 0;
    updateStatus({
      permissionErrors: result.readDenied.map((d) => `Permission denied for ${d}`),
    });

    return !hasErrors;
  } catch (error) {
    console.error('[Health] Permission request failed:', error);
    updateStatus({ permissionErrors: ['Failed to request health permissions'] });
    return false;
  }
};

/**
 * Queries total steps and walking distance for the current day
 * and synchronizes it with the reconcile-activity Edge Function.
 */
export const syncHealthData = async () => {
  try {
    const healthInfo = await Health.isAvailable();
    if (!healthInfo.available) {
      throw new Error('Health data is not available on this device.');
    }

    const authorized = await requestHealthPermissions();
    if (!authorized) {
      throw new Error('Health permissions not granted.');
    }

    const platformName = healthInfo.platform === 'ios' ? 'Apple Health' : 'Health Connect';

    const startOfDay = getQatarStartOfDay();
    const endOfDay = getUTCISO();

    // Query aggregated data for today
    const [stepsData, distanceData] = await Promise.all([
      Health.queryAggregated({
        dataType: 'steps',
        startDate: startOfDay,
        endDate: endOfDay,
        bucket: 'day',
        aggregation: 'sum',
      }),
      Health.queryAggregated({
        dataType: 'distance',
        startDate: startOfDay,
        endDate: endOfDay,
        bucket: 'day',
        aggregation: 'sum',
      }),
    ]);

    // Sum values in case multiple samples returned (usually one per day for bucket: 'day')
    const steps = stepsData.samples.reduce((sum, s) => sum + (s.value || 0), 0);
    const distance = distanceData.samples.reduce((sum, s) => sum + (s.value || 0), 0);

    const payload = {
      steps: Math.round(steps),
      distance_meters: Math.round(distance),
      timestamp: endOfDay,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: platformName,
    };

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('reconcile-activity', {
      body: payload,
    });

    if (error) throw error;

    const lastSync = Date.now();
    updateStatus({
      lastSyncTimestamp: lastSync,
      permissionErrors: [],
      sourcePlatform: platformName
    });

    return { success: true, data, source: platformName, timestamp: lastSync };
  } catch (error: any) {
    console.error('[Health] Sync failed:', error);
    const message = error.message || 'Unknown sync error';
    updateStatus({
      permissionErrors: [message],
    });
    return { success: false, error: message };
  }
};
