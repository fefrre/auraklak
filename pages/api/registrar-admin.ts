// auraklak/pages/api/registrar-admin.ts
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs'; // Asegúrate de tener 'bcryptjs' instalado
import { supabaseServerClient } from '../../lib/supabaseServer'; // ¡Importa el nuevo cliente de servidor!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ mensaje: 'Método no permitido' });
  }

  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ mensaje: 'Usuario y contraseña son requeridos' });
  }

  try {
    // Usa el cliente Supabase de servidor
    const supabase = supabaseServerClient;

    // 1. Verificar si el usuario ya existe en tu tabla 'administradores'
    const { data: usuarioExistente, error: findError } = await supabase
      .from('administradores') // Reemplaza 'administradores' con el nombre real de tu tabla
      .select('usuario')
      .eq('usuario', usuario)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 es "no rows found"
      console.error('Error al buscar usuario en Supabase:', findError);
      return res.status(500).json({ mensaje: 'Error al verificar usuario existente', error: findError.message });
    }

    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El usuario ya existe' });
    }

    // 2. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // 3. Insertar el nuevo administrador
    const { data, error: insertError } = await supabase
      .from('administradores') // Reemplaza 'administradores' con el nombre real de tu tabla
      .insert([
        {
          usuario: usuario,
          contrasena_hash: hashedPassword, // Ajusta el nombre de la columna si es diferente
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error('Error al insertar administrador en Supabase:', insertError);
      return res.status(500).json({ mensaje: 'Error al registrar administrador en Supabase', error: insertError.message });
    }

    res.status(201).json({ mensaje: 'Administrador registrado con éxito' });

  } catch (error: any) {
    console.error('Error inesperado en la API Route:', error);
    res.status(500).json({ mensaje: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.', error: error.message });
  }
}