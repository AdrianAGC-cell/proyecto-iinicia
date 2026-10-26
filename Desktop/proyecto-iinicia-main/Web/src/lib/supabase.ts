import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://hwzkpkmithroyobntypq.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3emtwa21pdGhyb3lvYm50eXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MzU2NTYsImV4cCI6MjEwODIxMTY1Nn0.ncSUUAO-jojOdTu6NzuJxf7lxFCSyg3O_02yU9n1Jt0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
