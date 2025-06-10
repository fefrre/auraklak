// auraklak/pages/api/login-admin.ts
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { supabaseServerClient } from '../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  try {
    const supabase = supabaseServerClient;

    // Buscar al usuario en la tabla
    const { data: admin, error } = await supabase
      .from('administradores')
      .select('contrasena')
      .eq('usuario', usuario)
      .single();

    if (error || !admin) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Comparar contraseñas
    const passwordMatch = await bcrypt.compare(contrasena, admin.contrasena);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Login exitoso
    return res.status(200).json({ message: 'Login exitoso' });
  } catch (err: any) {
    console.error('Error en login:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
