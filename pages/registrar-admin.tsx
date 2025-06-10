import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, mensaje: "Método no permitido" });
  }

  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ ok: false, mensaje: "Faltan datos obligatorios" });
  }

  try {
    const hash = await bcrypt.hash(contrasena, 10);

    const { error } = await supabase.from("administradores").insert({
      usuario,
      contrasena: hash,
    });

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ ok: false, mensaje: "El nombre de usuario ya existe." });
      }
      return res.status(500).json({ ok: false, mensaje: error.message });
    }

    res.status(201).json({ ok: true, mensaje: "Administrador registrado correctamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
}
