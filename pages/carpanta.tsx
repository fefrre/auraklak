// pages/carpanta.tsx (o como tengas nombrado tu archivo de página principal)
"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

// Importa el icono de Instagram
import { FaInstagram } from "react-icons/fa"; // O puedes usar RiInstagramFill de Remix Icon, o AiOutlineInstagram de Ant Design Icons, etc.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CarpantaPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [tomos, setTomos] = useState<any[]>([]);

  const fecha = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const fetchTomos = async () => {
      const { data, error } = await supabase
        .from("tomos")
        .select("*")
        .eq("borrador", false)
        .order("fecha_publicacion", { ascending: false });

      if (error) {
        console.error("Error al obtener tomos:", error);
      } else {
        setTomos(data || []);
      }
    };

    fetchTomos();
  }, []);

  return (
    <div
      className="min-h-screen font-serif text-[#1a1a1a]"
      style={{
        backgroundImage: "url('/textures/papel-antiguo.jpg')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundColor: "#f4f1e8",
      }}
    >
      <Head>
        <title>Carpanta – Periódico de Arte Local</title>
      </Head>

      <Image
        src="/decorado-carapanta.png"
        alt="Decoración"
        width={300}
        height={300}
        className="absolute top-10 left-1/2 transform -translate-x-1/2 opacity-10 pointer-events-none z-0"
      />

      <nav
        className={`fixed top-0 w-full bg-[#eae4d6] border-b-2 border-[#3a3a3a] z-50 shadow-md transition-transform duration-500 ease-in-out ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ backdropFilter: "blur(4px)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-24 px-4">
          <div className="flex items-center space-x-4">
            <Image
              src="/logocarpanta.png"
              alt="Logo Carpanta"
              width={64}
              height={64}
              className="rounded shadow-md"
            />
            <span
              className="text-4xl md:text-5xl font-black tracking-widest"
              style={{
                fontFamily: "UnifrakturCook, serif",
                color: "#1a1a1a",
                textShadow: "1px 1px 0px #ccc",
              }}
            >
              CARPANTA
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-lg">
            <Link href="/carpanta" className="hover:underline">
              Inicio
            </Link>
            <Link href="#noticias" className="hover:underline">
              Noticias
            </Link>

            <Link href="/tomoed" className="hover:underline">
              Subir publicacion
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
            className="md:hidden text-2xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#f4f1e8] px-6 py-4 space-y-3">
            <Link href="/" className="block hover:underline">
              Inicio
            </Link>
            <Link href="#noticias" className="block hover:underline">
              Noticias
            </Link>
            <Link href="/tomos/galeria" className="block hover:underline">
              Tomos
            </Link>
            <Link href="/" className="block hover:underline">
              AURA
            </Link>
            <Link href="/blacksirena" className="block hover:underline">
              Blacksirena
            </Link>
            <Link href="/tomoed" className="block hover:underline">
              Subir publicacion
            </Link>
          </div>
        )}
      </nav>

      <section className="pt-40 pb-10 px-6 border-b-2 border-[#3a3a3a] text-center bg-[#f9f7f2]">
        <p className="text-sm uppercase tracking-widest text-gray-600 mb-2">
          {fecha}
        </p>
        <h2 className="text-4xl md:text-5xl font-bold leading-snug text-[#1a1a1a]">
          𝘙𝘦𝘷𝘪𝘴𝘵𝘢 𝘦𝘮𝘦𝘳𝘨𝘦𝘯𝘵𝘦 𝘲𝘶𝘦 𝘣𝘶𝘴𝘤𝘢 𝘭𝘢 𝘥𝘪𝘷𝘶𝘭𝘨𝘢𝘤𝘪ó𝘯 𝘥𝘦 𝘢𝘳𝘵𝘦 𝘭𝘰𝘤𝘢𝘭.
        </h2>
        <p className="text-lg mt-4 max-w-2xl mx-auto text-gray-700">
          Una exposición permanente del arte, cultura y expresión visual de
          proyectos emergentes como **AURA** y **Blacksirena**.
        </p>
      </section>

      {/* Sección de "Noticias" (Tomos) */}
      <section
        id="noticias"
        className="max-w-6xl mx-auto px-6 py-16 grid gap-14 md:grid-cols-2"
      >
        {tomos.length === 0 ? (
          <p className="text-center text-gray-600 col-span-2">
            No hay tomos publicados aún.
          </p>
        ) : (
          tomos.map((tomo) => (
            <article
              key={tomo.id}
              className="border-2 border-[#3a3a3a] bg-[#ffffffcc] p-6 rounded-md shadow-md flex flex-col"
            >
              {/* Imagen del tomo (si existe) */}
              {tomo.imagen_url && (
                <div className="mb-4 relative w-full h-48 sm:h-64 lg:h-72 overflow-hidden rounded-md">
                  <Image
                    src={tomo.imagen_url}
                    alt={tomo.titulo || "Imagen del Tomo"}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="rounded-md"
                  />
                </div>
              )}

              {/* Título del Tomo (enlazado si hay un slug) */}
              {tomo.slug ? (
                <Link href={`/tomos/${tomo.slug}`} className="hover:underline">
                  <h3 className="text-2xl font-bold mb-2 cursor-pointer">
                    {tomo.titulo}
                  </h3>
                </Link>
              ) : (
                <h3 className="text-2xl font-bold mb-2">{tomo.titulo}</h3>
              )}

              {/* Autor y Fecha de Publicación */}
              {tomo.autor && (
                <p className="text-sm text-gray-500 mb-1">Por: {tomo.autor}</p>
              )}
              {tomo.fecha_publicacion && (
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(tomo.fecha_publicacion).toLocaleDateString(
                    "es-ES",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              )}

              {/* Contenido HTML del Tomo */}
              <div
                className="prose prose-sm max-w-none text-black flex-grow overflow-hidden"
                dangerouslySetInnerHTML={{ __html: tomo.contenido_html }}
              />

              <div className="mt-4 flex justify-between items-center">
                {/* Enlace de lectura completa si hay un slug */}
                {tomo.slug && (
                  <Link
                    href={`/tomos/${tomo.slug}`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Leer más →
                  </Link>
                )}

                {/* Ícono de Instagram si existe el link y es de Instagram */}
                {tomo.link &&
                  (tomo.link.includes("instagram.com") ||
                    tomo.link.includes("instagr.am")) && (
                    <a
                      href={tomo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black hover:text-gray-700 transition-colors" // Estilo en negro y hover suave
                      aria-label="Visitar en Instagram" // Para accesibilidad
                    >
                      <FaInstagram className="text-2xl" />{" "}
                      {/* Tamaño del icono */}
                    </a>
                  )}
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="text-center py-6 text-sm text-gray-600 bg-[#eae4d6] border-t-2 border-[#3a3a3a]">
        © {new Date().getFullYear()} Carpanta. Publicación independiente de arte
        y cultura.
        <br />
        <Link
          href="/admincar/login"
          className="underline text-gray-800 hover:text-black"
        >
          Panel de Administración
        </Link>
      </footer>
    </div>
  );
}
