import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdicrcdybukzfuhgyoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkY2lyY2R5YnVremZ6dWhneW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MjEzNzEsImV4cCI6MjA4NjI5NzM3MX0.NfaDEXnh10R-TcnsZr75OLqqTjjQHNX-2xJg5KTPI1Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
