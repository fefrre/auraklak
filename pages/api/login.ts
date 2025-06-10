// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';

type Data = {
  ok: boolean;
  mensaje: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  }

  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos' });
  }

  try {
    // Buscar el usuario en Supabase
    const { data, error } = await supabase
      .from('administradores')
      .select('usuario, contrasena')
      .eq('usuario', usuario)
      .single();

    if (error || !data) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    // Comparar la contraseña con el hash guardado
    const esValido = await bcrypt.compare(contrasena, data.contrasena);

    if (!esValido) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
    }

    // Login correcto
    return res.status(200).json({ ok: true, mensaje: 'Login correcto' });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}
