import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dnzsmogsqctscfqulffr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pINhdvMNkPDccZrkuGpxKw_9Js8NA5j';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
