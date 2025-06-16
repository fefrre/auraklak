"use client";

import { useState } from "react";
import Head from "next/head";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";

// Inicializa Supabase con variables de entorno

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TomoEditor() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [autor, setAutor] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [link, setLink] = useState("");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Escribe el contenido del tomo aquí…",
      }),
    ],
    content: "",
    editable: true,
  });

  const generarSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const handleTituloChange = (value: string) => {
    setTitulo(value);
    setSlug(generarSlug(value));
  };

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImagenFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contenido_html = editor?.getHTML();

    setMensaje("");
    setSubiendoImagen(true);

    let imagenUrl = "";

    if (imagenFile) {
      const fileExt = imagenFile.name.split(".").pop();
      const fileName = `${slug || "tomo"}-${Date.now()}.${fileExt}`;
      const filePath = `imagenestomos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("imagenestomos")
        .upload(filePath, imagenFile);

      if (uploadError) {
        setMensaje(`❌ Error al subir la imagen: ${uploadError.message}`);
        setSubiendoImagen(false);
        return;
      }

      // MODIFICACIÓN CLAVE AQUÍ: getPublicUrl solo devuelve 'data', no 'error' directamente.
      const { data: publicUrlData } = supabase.storage
        .from("imagenestomos")
        .getPublicUrl(filePath);

      // Verificamos si la URL pública está disponible
      if (!publicUrlData || !publicUrlData.publicUrl) {
        setMensaje(
          `❌ Error al obtener la URL pública: La URL no está disponible.`
        );
        setSubiendoImagen(false);
        return;
      }

      imagenUrl = publicUrlData.publicUrl;
    }

    const res = await fetch("/api/tomos/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        slug,
        contenido_html,
        autor,
        imagen_url: imagenUrl,
        link: link.trim() || null,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMensaje("✅ Publicacion enviada a revision");
      setTitulo("");
      setSlug("");
      setAutor("");
      setLink("");
      setImagenFile(null);
      editor?.commands.setContent("");
    } else {
      setMensaje(`❌ Error: ${data.error}`);
    }

    setSubiendoImagen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f1e8] p-8 font-serif text-black">
      <Head>
        <title>Editor | Carpanta</title>
      </Head>

      <div className="max-w-4xl mx-auto bg-white rounded shadow-md p-6 space-y-6 border border-[#ccc]">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Crear nueva publicacion
        </h1>

        {mensaje && (
          <p
            className={`text-center font-semibold text-sm ${
              mensaje.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {mensaje}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          encType="multipart/form-data"
        >
          <div>
            <label className="block mb-1 font-medium">Título </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => handleTituloChange(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Slug</label>
            <input
              type="text"
              value={slug}
              readOnly
              className="w-full border px-3 py-2 bg-gray-100 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Autor (opcional)</label>
            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Link (opcional)</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://ejemplo.com"
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Imagen (opcional)</label>
            <label
              htmlFor="imagenFileInput"
              className="inline-block cursor-pointer bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              {imagenFile ? "Cambiar imagen" : "Seleccionar imagen"}
            </label>
            <input
              id="imagenFileInput"
              type="file"
              accept="image/*"
              onChange={handleImagenChange}
              className="hidden"
            />
            {imagenFile && (
              <p className="mt-1 text-sm text-gray-600">
                Archivo seleccionado: {imagenFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Contenido</label>
            <div className="border rounded bg-white">
              <EditorContent
                editor={editor}
                className="min-h-[200px] p-4 text-black leading-relaxed prose prose-sm"
                style={{ backgroundColor: "white" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={subiendoImagen}
            className={`px-6 py-2 rounded text-white ${
              subiendoImagen
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            } transition`}
          >
            {subiendoImagen ? "Subiendo imagen..." : "Solicitar publicacion"}
          </button>
          
        </form>
        <div className="flex justify-center mt-6">
  <button
    type="button"
    onClick={() => router.push("/carpanta")}
    className="inline-block cursor-pointer bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
  >
    Ir al inicio
  </button>
</div>
      </div>

      <style jsx>{`
        .ProseMirror {
          position: relative;
          min-height: 200px;
          padding: 1rem;
        }
        .ProseMirror p.is-empty:first-child::before {
          content: attr(data-placeholder);
          color: #999;
          pointer-events: none;
          position: absolute;
          top: 1rem;
          left: 1rem;
          right: 1rem;
          white-space: pre-wrap;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
