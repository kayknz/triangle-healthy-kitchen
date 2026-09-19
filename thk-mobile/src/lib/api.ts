import { supabase } from './supabase';

/**
 * Standardized wrapper for Supabase Edge Function calls.
 * Ensures consistent error handling and type safety.
 */
export async function invokeFunction<T = any>(
  functionName: string,
  body: any = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body
    });

    if (error) {
      // Handle Supabase internal errors (e.g., function not found)
      let message = 'Gateway Error';
      try {
        const errBody = await error.context.json();
        message = errBody.error || message;
      } catch {
        message = error.message || message;
      }
      return { data: null, error: message };
    }

    if (data?.error) {
      // Handle business logic errors returned by the function
      return { data: null, error: data.error };
    }

    return { data: data as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network Failure' };
  }
}
