// pages/api/tomos/reject.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { id } = req.body;

  const { error } = await supabase
    .from('tomos')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: 'Tomo rechazado y eliminado' });
}
