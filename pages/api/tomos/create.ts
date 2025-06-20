// pages/api/tomos/create.ts
import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const {
    titulo,
    slug,
    contenido_html,
    autor,
    imagen_url,
    imagenes_urls, // 👈 importante: incluir aquí
    link,
  } = req.body;

  const { error } = await supabase
    .from("tomos")
    .insert([
      {
        titulo,
        slug,
        contenido_html,
        autor,
        imagen_url,
        imagenes_urls, // 👈 esto guarda el arreglo completo
        link,
        borrador: true, // o false, según cómo quieras publicarlos
        fecha_publicacion: new Date().toISOString(),
      },
    ]);

  if (error) {
    console.error("Error al insertar:", error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ message: "Tomo creado correctamente" });
}
