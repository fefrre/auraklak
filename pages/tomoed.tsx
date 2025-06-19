"use client";

import { useState } from "react";
import Head from "next/head";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TomoEditor() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [autor, setAutor] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [link, setLink] = useState("");
  const [imagenes, setImagenes] = useState<File[]>([]);
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
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (selected.length + imagenes.length > 10) {
        setMensaje("❌ Solo puedes subir hasta 10 imágenes.");
        return;
      }
      setImagenes((prev) => [...prev, ...selected]);
    }
  };

  const eliminarImagen = (index: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contenido_html = editor?.getHTML();

    setMensaje("");
    setSubiendoImagen(true);

    const imagenUrls: string[] = [];

    for (const imagen of imagenes) {
      const fileExt = imagen.name.split(".").pop();
      const fileName = `${slug || "tomo"}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `imagenestomos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("imagenestomos")
        .upload(filePath, imagen);

      if (uploadError) {
        setMensaje(`❌ Error al subir imagen: ${uploadError.message}`);
        setSubiendoImagen(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("imagenestomos")
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        setMensaje("❌ Error al obtener URL de imagen.");
        setSubiendoImagen(false);
        return;
      }

      imagenUrls.push(publicUrlData.publicUrl);
    }

    const res = await fetch("/api/tomos/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        slug,
        contenido_html,
        autor,
        imagen_url: imagenUrls[0] || null,
          imagenes_urls: imagenUrls,  // usa la primera imagen como portada
        link: link.trim() || null,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMensaje("✅ Publicación enviada a revisión correctamente 🎉");
      setTitulo("");
      setSlug("");
      setAutor("");
      setLink("");
      setImagenes([]);
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
          Crear nueva publicación
        </h1>

        {mensaje && (
          <div
            className={`text-center text-base font-semibold px-4 py-3 rounded-md transition-all duration-300 ${
              mensaje.startsWith("✅")
                ? "bg-green-100 text-green-800 border border-green-400 animate-pulse"
                : "bg-red-100 text-red-800 border border-red-400"
            }`}
          >
            {mensaje}
          </div>
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
            <label className="block mb-1 font-medium">
              Imágenes (máx. 10)
            </label>
            <label
              htmlFor="imagenFileInput"
              className="inline-block cursor-pointer bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              {imagenes.length > 0 ? "Agregar más imágenes" : "Seleccionar imágenes"}
            </label>
            <input
              id="imagenFileInput"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagenChange}
              className="hidden"
            />
            {imagenes.length > 0 && (
              <ul className="mt-3 text-sm text-gray-700 list-disc pl-5 space-y-1">
                {imagenes.map((img, i) => (
                  <li key={i} className="flex items-center justify-between">
                    {img.name}
                    <button
                      type="button"
                      onClick={() => eliminarImagen(i)}
                      className="text-red-600 hover:underline ml-4 text-xs"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Contenido</label>
            <div className="border rounded bg-white">
              <EditorContent
                editor={editor}
                className="min-h-[200px] p-4 text-black leading-relaxed prose prose-sm"
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
            {subiendoImagen ? "Subiendo imágenes..." : "Solicitar publicación"}
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
