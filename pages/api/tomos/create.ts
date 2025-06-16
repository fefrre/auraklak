import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { titulo, slug, contenido_html, autor, imagen_url, link } = req.body;

  if (!titulo || !slug || !contenido_html) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const { data, error } = await supabase.from("tomos").insert([
    {
      titulo,
      slug,
      contenido_html,
      autor,
      imagen_url: imagen_url || null,
      link: link || null,
      fecha_publicacion: new Date().toISOString(),
      borrador: true, // ✅ ahora se guarda como pendiente
    },
  ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ message: "Tomo creado", data });
}
