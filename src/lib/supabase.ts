import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = 'https://ucgepgmnmujuaewowaxq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZ2VwZ21ubXVqdWFld293YXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjYwMzAsImV4cCI6MjA4MDgwMjAzMH0.1rryOWMhbkySHp7o22Sj9Roptlk8wPXaPTVf_Is0pPQ';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper to get current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

