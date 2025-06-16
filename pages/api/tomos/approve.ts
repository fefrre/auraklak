// pages/api/tomos/approve.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { id } = req.body;

  if (!id || typeof id !== "number") {
    return res.status(400).json({ error: "ID inválido o faltante" });
  }

  const { data, error } = await supabase
    .from("tomos")
    .update({ borrador: false })
    .eq("id", id)
    .select(); // Agrega esto para verificar lo que devuelve

  if (error) {
    console.error("Error al aprobar tomo:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    message: "✅ Tomo aprobado correctamente",
    updated: data,
  });
}
