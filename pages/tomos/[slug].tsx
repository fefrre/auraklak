// pages/tomos/[slug].tsx
"use client";

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Importa el icono de Instagram de React Icons
// Puedes elegir entre diferentes estilos (Fa para Font Awesome, Ai para Ant Design, etc.)
// Aquí usaremos FaInstagram de Font Awesome
import { FaInstagram } from 'react-icons/fa'; 

// Inicializa Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Tomo {
  id: number;
  titulo: string;
  slug: string;
  contenido_html: string;
  autor?: string;
  imagen_url?: string;
  imagenes_urls?: string[]; // 👈 añadimos este campo nuevo
  link?: string;
  fecha_publicacion: string;
}


export default function TomoPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [tomo, setTomo] = useState<Tomo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      const fetchTomo = async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from("tomos")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) {
          console.error("Error al obtener el tomo:", error);
          setError("No se pudo cargar el tomo. Inténtalo de nuevo más tarde.");
          setTomo(null);
        } else if (data) {
          setTomo(data as Tomo);
        } else {
          setError("Tomo no encontrado.");
          setTomo(null);
        }
        setLoading(false);
      };

      fetchTomo();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1e8] font-serif text-[#1a1a1a]">
        <p>Cargando tomo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f1e8] font-serif text-[#1a1a1a]">
        <p className="text-red-600 text-lg">{error}</p>
        <Link href="/carpanta" className="mt-4 text-blue-600 hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  if (!tomo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f1e8] font-serif text-[#1a1a1a]">
        <p className="text-gray-700 text-lg">Tomo no encontrado.</p>
        <Link href="/carpanta" className="mt-4 text-blue-600 hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  // Detecta si el enlace es de Instagram
  const isInstagramLink = tomo.link && (tomo.link.includes('instagram.com') || tomo.link.includes('instagr.am'));

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
        <title>{tomo.titulo} | Carpanta</title>
        <meta name="description" content={`Lee el tomo: ${tomo.titulo}`} />
      </Head>

      <nav className="bg-[#eae4d6] border-b-2 border-[#3a3a3a] py-6 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/carpanta" className="flex items-center space-x-2">
            <Image
              src="/logocarpanta.png"
              alt="Logo Carpanta"
              width={40}
              height={40}
              className="rounded shadow-sm"
            />
            <span
              className="text-2xl font-black tracking-widest"
              style={{ fontFamily: "UnifrakturCook, serif", color: "#1a1a1a" }}
            >
              CARPANTA
            </span>
          </Link>
          <Link href="/carpanta#noticias" className="text-lg hover:underline">
            ← Volver a Tomos
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-6 bg-white rounded-lg shadow-xl my-8 border border-[#ccc]">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6 leading-tight">
          {tomo.titulo}
        </h1>

        {tomo.autor && (
          <p className="text-center text-gray-600 mb-2">
            Por: <span className="font-semibold">{tomo.autor}</span>
          </p>
        )}
        {tomo.fecha_publicacion && (
          <p className="text-center text-gray-500 text-sm mb-6">
            Publicado el{" "}
            {new Date(tomo.fecha_publicacion).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

{(tomo.imagenes_urls || [tomo.imagen_url])
  .filter((img): img is string => typeof img === "string")
  .map((img, index) => (
    <div
      key={index}
      className="relative w-full h-72 md:h-96 mb-8 overflow-hidden rounded-lg shadow-md"
    >
      <Image
        src={img}
        alt={`${tomo.titulo} - imagen ${index + 1}`}
        fill
        style={{ objectFit: "cover" }}
        sizes="100vw"
        className="rounded-lg"
      />
    </div>
))}


        <div
          className="prose prose-lg max-w-none mx-auto leading-relaxed text-black"
          dangerouslySetInnerHTML={{ __html: tomo.contenido_html }}
        />

        {/* Lógica para mostrar el icono de Instagram o el enlace genérico */}
        {tomo.link && (
          <div className="mt-8 text-center">
            {isInstagramLink ? (
              <a
                href={tomo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-gradient-to-br from-purple-500 via-red-500 to-yellow-500 text-white px-6 py-3 rounded-md hover:opacity-90 transition-opacity text-lg shadow-lg"
              >
                <FaInstagram className="mr-2 text-2xl" /> {/* Icono de Instagram */}
                Visitar Instagram
              </a>
            ) : (
              <a
                href={tomo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition text-lg shadow-lg"
              >
                Visitar sitio externo →
              </a>
            )}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-sm text-gray-600 bg-[#eae4d6] border-t-2 border-[#3a3a3a] mt-8">
        © {new Date().getFullYear()} Carpanta. Publicación independiente de arte y cultura.
      </footer>
    </div>
  );
}