import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://rcsamjsjaeyirreinfln.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JeEjm-s2imhtY-qzmFyIbg_nX6ak4jz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
