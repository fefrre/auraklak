"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

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
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnonimo, setIsAnonimo] = useState(false);

  // --- Estados y referencias para Drag & Drop ---
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLLabelElement>(null);

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

  // --- Función centralizada para añadir imágenes ---
  const agregarNuevasImagenes = useCallback(
    (nuevosArchivos: File[]) => {
      if (nuevosArchivos.length + imagenes.length > 10) {
        setMensaje("❌ Solo puedes subir hasta 10 imágenes.");
        return;
      }
      // Filtrar para asegurar que solo sean imágenes
      const archivosDeImagen = nuevosArchivos.filter((file) =>
        file.type.startsWith("image/")
      );
      if (archivosDeImagen.length !== nuevosArchivos.length) {
          setMensaje("⚠️ Se han omitido archivos que no son imágenes.");
      }
      if (archivosDeImagen.length > 0) {
        setImagenes((prev) => [...prev, ...archivosDeImagen]);
      }
    },
    [imagenes] // Dependencia para que la validación del total sea correcta
  );

  // --- El manejador del input ahora usa la función centralizada ---
  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      agregarNuevasImagenes(Array.from(e.target.files));
    }
  };

  const eliminarImagen = (index: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Manejadores para eventos de Drag & Drop y Pegar ---
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer?.files) {
        agregarNuevasImagenes(Array.from(e.dataTransfer.files));
      }
    },
    [agregarNuevasImagenes]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
              files.push(file);
            }
          }
        }
        if (files.length > 0) {
          agregarNuevasImagenes(files);
        }
      }
    },
    [agregarNuevasImagenes]
  );

  // --- useEffect para añadir y limpiar los listeners de eventos ---
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (dropZone) {
      dropZone.addEventListener("dragover", handleDragOver);
      dropZone.addEventListener("dragleave", handleDragLeave);
      dropZone.addEventListener("drop", handleDrop);
    }
    // Añadimos el listener de pegado a toda la ventana
    window.addEventListener("paste", handlePaste);

    return () => {
      if (dropZone) {
        dropZone.removeEventListener("dragover", handleDragOver);
        dropZone.removeEventListener("dragleave", handleDragLeave);
        dropZone.removeEventListener("drop", handleDrop);
      }
      window.removeEventListener("paste", handlePaste);
    };
  }, [handleDragOver, handleDragLeave, handleDrop, handlePaste]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contenido_html = editor?.getHTML();

    setMensaje("");
    setSubiendoImagen(true);
    
    // --- Validación de campos ---
    if (!titulo.trim()) {
      setMensaje("⚠️ El campo 'Título' es obligatorio.");
      setSubiendoImagen(false);
      return;
    }
    if (!isAnonimo && !autor.trim()) {
      setMensaje("⚠️ El campo 'Autor' es obligatorio (o activa el modo anónimo).");
      setSubiendoImagen(false);
      return;
    }
    if (!contenido_html || editor?.isEmpty) {
      setMensaje("⚠️ El campo 'Contenido' no puede estar vacío.");
      setSubiendoImagen(false);
      return;
    }
    if (imagenes.length === 0) {
      setMensaje("⚠️ Debes seleccionar, arrastrar o pegar al menos una imagen.");
      setSubiendoImagen(false);
      return;
    }

    const imagenUrls: string[] = [];
    for (const imagen of imagenes) {
      try {
        const fileExt = imagen.name.split(".").pop();
        const fileName = `${slug || "tomo"}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `imagenestomos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("imagenestomos")
          .upload(filePath, imagen);

        if (uploadError) throw new Error(uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from("imagenestomos")
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl)
          throw new Error("No se pudo obtener la URL pública.");

        imagenUrls.push(publicUrlData.publicUrl);
      } catch (err: any) {
        setMensaje(`❌ Error al subir imagen: ${err.message}`);
        setSubiendoImagen(false);
        return;
      }
    }

    const finalAutor = isAnonimo ? "" : autor;
    const finalLink = isAnonimo ? "" : link.trim();

    const res = await fetch("/api/tomos/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        slug,
        contenido_html,
        autor: finalAutor,
        imagen_url: imagenUrls[0] || null,
        imagenes_urls: imagenUrls,
        link: finalLink || null,
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
      setIsAnonimo(false);
    } else {
      setMensaje(`❌ Error: ${data.error}`);
    }
    setSubiendoImagen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-[#f4f1e8] font-serif text-black">
      <Head>
        <title>Editor | Carpanta</title>
      </Head>

      {/* NAVBAR */}
      <nav
        className={`fixed top-0 w-full bg-[#eae4d6] border-b-2 border-[#3a3a3a] z-50 shadow-md transition-transform duration-500 ease-in-out ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ backdropFilter: "blur(4px)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[6rem] sm:h-[7rem] md:h-24 px-2 sm:px-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/carpanta" className="flex items-center space-x-2">
              <Image
                src="/carpanta-pez.svg"
                alt="Logo Carpanta"
                width={0}
                height={0}
                sizes="(max-width: 768px) 56px, (max-width: 1200px) 72px, 80px"
                className="w-14 sm:w-18 md:w-20 h-auto object-contain"
                style={{ backgroundColor: "transparent" }}
              />
              <Image
                src="/carpanta-letras.svg"
                alt="Carpanta Título"
                width={160}
                height={50}
                className="object-contain"
                style={{ backgroundColor: "transparent" }}
              />
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-lg">
            <Link href="/carpanta" className="hover:underline">
              Inicio
            </Link>
            <Link href="/carpanta#noticias" className="hover:underline">
              Noticias
            </Link>
            <Link href="/tomoed" className="hover:underline">
              Subir publicación
            </Link>
            <div className="relative group">
              <button className="hover:underline">Extensiones</button>
              <div className="absolute right-0 mt-2 bg-white border border-gray-300 rounded shadow-lg w-40 opacity-0 group-hover:opacity-100 transition duration-200 z-50">
                <Link href="/" className="block px-4 py-2 hover:bg-gray-100">
                  AURA
                </Link>
                <Link
                  href="/blacksirena"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Blacksirena
                </Link>
              </div>
            </div>
          </div>
          <button
            className="md:hidden text-2xl px-2 py-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú móvil"
          >
            ☰
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#f4f1e8] px-6 py-4 space-y-3 border-t border-gray-300">
            <Link
              href="/carpanta"
              className="block hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/carpanta#noticias"
              className="block hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Noticias
            </Link>
            <Link
              href="/tomos/galeria"
              className="block hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tomos
            </Link>
            <Link
              href="/"
              className="block hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              AURA
            </Link>
            <Link
              href="/blacksirena"
              className="block hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blacksirena
            </Link>
            <Link
              href="/tomoed"
              className="block hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Subir publicación
            </Link>
          </div>
        )}
      </nav>

      {/* SPACER para que el contenido no se corte */}
      <div style={{ height: "6rem" }} className="sm:h-[7rem] md:h-24" />

      {/* CONTENIDO PRINCIPAL */}
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
          {/* Switch Anónimo */}
          <div className="flex items-center justify-end">
            <label
              htmlFor="anonimo-toggle"
              className="flex items-center cursor-pointer"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  id="anonimo-toggle"
                  className="sr-only"
                  checked={isAnonimo}
                  onChange={() => setIsAnonimo(!isAnonimo)}
                />
                <div
                  className={`block w-14 h-8 rounded-full ${
                    isAnonimo ? "bg-green-500" : "bg-gray-300"
                  } transition-colors duration-300`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${
                    isAnonimo ? "translate-x-full" : "translate-x-0"
                  }`}
                ></div>
              </div>
              <div className="ml-3 text-gray-700 font-medium">
                Publicar de forma anónima
              </div>
            </label>
          </div>

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
            <label className="block mb-1 font-medium">Autor</label>
            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              className={`w-full border px-3 py-2 rounded ${
                isAnonimo ? "bg-gray-200 cursor-not-allowed" : ""
              }`}
              disabled={isAnonimo}
              required={!isAnonimo}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Link (opcional)</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://ejemplo.com"
              className={`w-full border px-3 py-2 rounded ${
                isAnonimo ? "bg-gray-200 cursor-not-allowed" : ""
              }`}
              disabled={isAnonimo}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Imágenes (máx. 10)</label>
            <label
              htmlFor="imagenFileInput"
              ref={dropZoneRef}
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-300 ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
                <span className="text-gray-600">
                  {imagenes.length > 0
                    ? "Agregar más imágenes"
                    : "Seleccionar imágenes"}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                    o arrástralas y suéltalas aquí
                </span>
                 <span className="text-xs text-gray-400 mt-2">
                    (También puedes pegar imágenes desde el portapapeles en cualquier lugar de la página)
                </span>
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
                    <span>
                        {img.name} - {Math.round(img.size / 1024)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarImagen(i)}
                      className="text-red-600 hover:underline ml-4 text-xs font-semibold"
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
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={subiendoImagen}
              className={`px-6 py-2 rounded text-white ${
                subiendoImagen
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800"
              } transition`}
            >
              {subiendoImagen
                ? "Subiendo imágenes..."
                : "Solicitar publicación"}
            </button>
          </div>
        </form>
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