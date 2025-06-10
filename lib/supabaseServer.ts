// auraklak/lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

// Estas variables DEBEN estar en tu .env.local y en la configuración de Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

// Este cliente usa la Service Role Key y está destinado a usarse SOLO en el lado del servidor.
// Proporciona permisos elevados para interactuar con tu base de datos de Supabase.
export const supabaseServerClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false, // No persistas la sesión en el servidor para API Routes
  },
});