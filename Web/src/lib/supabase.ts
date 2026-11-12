import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://rcsamjsjaeyirreinfln.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjc2FtanNqYWV5aXJyZWluZmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NDg1MDIsImV4cCI6MjExMDAyNDUwMn0.XujGoPht4DjP7eBx2uOXewW0Rx6RkZnJOeOI4Jy-SL8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
