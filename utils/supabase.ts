import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwzszdzhelzrtguxscok.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3enN6ZHpoZWx6cnRndXhzY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzg4MTEsImV4cCI6MjA4NTYxNDgxMX0.Y9YUL5dRHO0YyXchxNSsGF-VwQfPs6Lbt--QtqjxC3I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
