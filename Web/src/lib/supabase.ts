import { createClient } from '@supabase/supabase-js';

// VULN-001 & URL Sanitizer:
// Cleans URLs that might contain whitespace, quotes or accidental markdown link syntax
function sanitizeUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  const match = url.match(/https?:\/\/[^\s)\]"']+/);
  if (match) {
    url = match[0];
  }
  return url.replace(/^[\["']+|[\]"']+$/g, '');
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const cleanedUrl = sanitizeUrl(rawUrl);
// Institutional Supabase endpoint
const INSTITUTIONAL_URL = 'https://rcsamjsjaeyirreinfln.supabase.co';
const SUPABASE_URL = cleanedUrl && (cleanedUrl.startsWith('https://') || cleanedUrl.startsWith('http://'))
  ? cleanedUrl
  : INSTITUTIONAL_URL;

const SUPABASE_ANON_KEY = (rawAnonKey || '').trim();

if (!rawUrl || !rawAnonKey) {
  console.warn(
    '[IINICIA Security] Supabase environment variables were not fully detected from env. ' +
    'Using institutional configuration fallback.'
  );
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjc2FtanNqYWV5aXJyZWluZmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NDg1MDIsImV4cCI6MjExMDAyNDUwMn0.XujGoPht4DjP7eBx2uOXewW0Rx6RkZnJOeOI4Jy-SL8'
);
