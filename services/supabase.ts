import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://aqfcbijhvdbwlqrvmrxa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uYPotcTGMSAcM4BgDPN_HQ_KyE-fFYg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const checkConnection = async (): Promise<boolean> => {
  try {
    // Try to fetch a single row or head from a core table to verify access
    const { error } = await supabase.from('sites').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("Supabase Connection Error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected Connection Error:", err);
    return false;
  }
};