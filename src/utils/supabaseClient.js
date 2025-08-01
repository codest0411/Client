import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://urmbcwkotuyxfarflvxw.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybWJjd2tvdHV5eGZhcmZsdnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDAwOTUsImV4cCI6MjA2ODY3NjA5NX0._Wq7igOsMifHZN0MrbG3JQItl8DlmYi2xsLk-wrnR18';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key exists:', !!SUPABASE_KEY);
 
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY); 