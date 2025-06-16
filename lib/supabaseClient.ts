//import { createClient } from '@supabase/supabase-js';

//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
//const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

//export const supabase = createClient(supabaseUrl, supabaseKey);
//console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
//console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createPagesBrowserClient();
