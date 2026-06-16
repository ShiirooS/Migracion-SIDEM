// SCRUM-52: In-memory TTL cache for control_lists queries.
// Eliminates repeated Supabase round-trips during risk scoring — the lists
// change at most once per day (cron job at 02:00 UTC), so 6h TTL is safe.
import { supabase } from '../lib/supabase';

const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CacheEntry {
  data: unknown[];
  expiresAt: number;
}

// Keyed by `tipo_lista` value, or '*' for "all types"
const cache = new Map<string, CacheEntry>();

function isFresh(entry: CacheEntry): boolean {
  return Date.now() < entry.expiresAt;
}

/**
 * Returns control_lists rows for a given type (or all rows if tipo is omitted).
 * Results are cached in-process for 6 hours.
 */
export async function getControlLists(tipo?: string): Promise<unknown[]> {
  const key = tipo ?? '*';
  const cached = cache.get(key);

  if (cached && isFresh(cached)) {
    return cached.data;
  }

  let query = supabase.from('control_lists').select('*').eq('activo', true);
  if (tipo) query = query.eq('tipo_lista', tipo);

  const { data, error } = await query;

  if (error) {
    console.error('[control-lists-cache] Supabase error:', error.message);
    // Return stale data if available rather than crashing the risk engine
    return cached?.data ?? [];
  }

  const entry: CacheEntry = { data: data ?? [], expiresAt: Date.now() + TTL_MS };
  cache.set(key, entry);
  return entry.data;
}

/**
 * Invalidates all cached entries. Called by the cron job after a successful update.
 */
export function invalidateControlListsCache(): void {
  cache.clear();
  console.log('[control-lists-cache] Cache invalidated');
}
