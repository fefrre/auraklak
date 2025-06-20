"use client";

import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { FaInstagram } from "react-icons/fa";

import useEmblaCarousel from "embla-carousel-react";


import { BsArrowLeftCircleFill, BsArrowRightCircleFill } from "react-icons/bs";

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
  imagenes_urls?: string[];
  link?: string;
  fecha_publicacion: string;
}

export default function TomoPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [tomo, setTomo] = useState<Tomo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!emblaApi) return;

      if (event.key === "ArrowLeft") {
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [emblaApi, scrollPrev, scrollNext]);

  useEffect(() => {
    if (slug) {
      const fetchTomo = async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from("tomos")
          .select(
            "id, titulo, slug, contenido_html, autor, imagen_url, imagenes_urls, link, fecha_publicacion"
          )
          .eq("slug", slug)
          .single();

        if (error) {
          console.error("Error al obtener el tomo:", error);
          setError("No se pudo cargar el tomo. Inténtalo de nuevo más tarde.");
          setTomo(null);
        } else if (data) {
          console.log("Tomo recibido:", data);
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
        <Link href="/carpanta" className="mt-4 text-blue-600 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (!tomo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f1e8] font-serif text-[#1a1a1a]">
        <p className="text-gray-700 text-lg">Tomo no encontrado.</p>
        <Link href="/carpanta" className="mt-4 text-blue-600 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  let imagesToDisplay: string[] = [];

  if (tomo.imagenes_urls && tomo.imagenes_urls.length > 0) {
    imagesToDisplay = tomo.imagenes_urls.filter(
      (img): img is string => typeof img === "string" && img.length > 0
    );
  }

  if (
    tomo.imagen_url &&
    typeof tomo.imagen_url === "string" &&
    tomo.imagen_url.length > 0
  ) {
    if (!imagesToDisplay.includes(tomo.imagen_url)) {
      imagesToDisplay.unshift(tomo.imagen_url);
    }
  }

  imagesToDisplay = Array.from(new Set(imagesToDisplay));

  const isInstagramLink =
    tomo.link &&
    (tomo.link.includes("instagram.com") || tomo.link.includes("instagr.am"));

  return (
    <div
      className="min-h-screen font-serif text-[#1a1a3a] pt-[6rem] sm:pt-[7rem] md:pt-[8rem]"
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

      <nav
        className={`fixed top-0 w-full bg-[#eae4d6] border-b-2 border-[#3a3a3a] z-50 shadow-md transition-transform duration-500 ease-in-out ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ backdropFilter: "blur(4px)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[6rem] sm:h-[7rem] md:h-24 px-2 sm:px-4">
          {/* Altura y padding ajustados */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Espaciado ajustado */}
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
            className="md:hidden text-2xl px-2 py-1"
            // Padding al botón del menú
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú móvil"
          >
            ☰
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#f4f1e8] px-6 py-4 space-y-3 border-t border-gray-300">
            {/* Borde superior para separar */}
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
              Subir publicacion
            </Link>
          </div>
        )}
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

        {/* Sección del Carrusel de Imágenes */}
        <div className="embla mb-12 relative border-4 border-[#1a1a1a] rounded-xl shadow-[0_0_25px_rgba(0,0,0,0.3)] bg-[#faf8f2]">
          <div className="embla__viewport rounded-xl" ref={emblaRef}>
            <div className="embla__container">
              {imagesToDisplay.map((img, index) => (
                <div className="embla__slide" key={index}>
                  <div className="relative w-full h-[28rem] md:h-[36rem] overflow-hidden rounded-xl">
                    <Image
                      src={img}
                      alt={`${tomo.titulo} - imagen ${index + 1}`}
                      fill
                      style={{ objectFit: "contain" }}
                      sizes="100vw"
                      className="transition-transform duration-500 ease-in-out rounded-xl"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🎯 Botones de navegación */}
          <button
            className="embla__button embla__button--prev absolute top-1/2 left-2 -translate-y-1/2 bg-[#1a1a1a]/70 text-white rounded-full p-2 hover:bg-[#000]/90 transition z-10"
            onClick={scrollPrev}
            aria-label="Imagen anterior"
          >
            <BsArrowLeftCircleFill className="w-7 h-7" />
          </button>
          <button
            className="embla__button embla__button--next absolute top-1/2 right-2 -translate-y-1/2 bg-[#1a1a1a]/70 text-white rounded-full p-2 hover:bg-[#000]/90 transition z-10"
            onClick={scrollNext}
            aria-label="Imagen siguiente"
          >
            <BsArrowRightCircleFill className="w-7 h-7" />
          </button>
        </div>
        <div
          className="prose prose-lg max-w-none mx-auto leading-relaxed text-black"
          dangerouslySetInnerHTML={{ __html: tomo.contenido_html }}
        />

        {tomo.link && (
          <div className="mt-8 text-center">
            {isInstagramLink ? (
              <a
                href={tomo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-gradient-to-br from-purple-500 via-red-500 to-yellow-500 text-white px-6 py-3 rounded-md hover:opacity-90 transition-opacity text-lg shadow-lg"
              >
                <FaInstagram className="mr-2 text-2xl" />
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
