import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // No lanzamos error en build para permitir deploys sin env; avisamos por consola.
  console.warn('[supabase] Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url ?? 'http://localhost', anon ?? 'public-anon-key', {
  realtime: { params: { eventsPerSecond: 5 } },
});
