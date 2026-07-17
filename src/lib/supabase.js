import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Voorkom cryptische fouten: geef duidelijke melding
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Supabase configuratie ontbreekt!\n' +
    'Zorg dat VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY zijn ingesteld.\n' +
    'URL gevonden:', !!supabaseUrl, '\n' +
    'Key gevonden:', !!supabaseAnonKey
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
