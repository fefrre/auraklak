"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import {
  FiCheckCircle,
  FiXCircle,
  FiLogOut,
  FiTrash2,
  FiEye,
  FiX,
} from "react-icons/fi";

import useEmblaCarousel from "embla-carousel-react";
import { BsArrowLeftCircleFill, BsArrowRightCircleFill } from "react-icons/bs";

// Modal para ver obra con carrusel y fondo difuminado, con soporte modo oscuro
function MiniTomoViewer({
  tomo,
  onClose,
  darkMode,
}: {
  tomo: any;
  onClose: () => void;
  darkMode: boolean;
}) {
  const imagesToShow: string[] = [];

  if (tomo.imagen_url) imagesToShow.push(tomo.imagen_url);
  if (tomo.imagenes_urls && Array.isArray(tomo.imagenes_urls)) {
    tomo.imagenes_urls.forEach((url: string) => {
      if (!imagesToShow.includes(url)) imagesToShow.push(url);
    });
  }

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // Cerrar modal con ESC y flechas para navegar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (!emblaApi) return;
      else if (event.key === "ArrowLeft") emblaApi.scrollPrev();
      else if (event.key === "ArrowRight") emblaApi.scrollNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emblaApi, onClose]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-[100] ${
        darkMode
          ? "bg-black/80 backdrop-blur-md"
          : "bg-black/40 backdrop-blur-md"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto border p-6 animate-scale-in-content
          ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-gray-100"
              : "bg-white border-brown-dark text-brown-dark"
          }
        `}
        onClick={(e) => e.stopPropagation()} // evitar cerrar modal al clicar dentro
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 rounded-full p-2 hover:brightness-110 z-10 ${
            darkMode
              ? "text-gray-100 bg-gray-700 hover:bg-gray-600"
              : "text-brown-dark bg-yellow-light hover:bg-yellow-medium"
          }`}
          aria-label="Cerrar vista previa"
        >
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-2 font-newspaper break-words">
          {tomo.titulo}
        </h2>
        {tomo.autor && (
          <p className="text-center italic text-sm mb-1">
            Por: {tomo.autor}
          </p>
        )}
        {tomo.fecha_publicacion && (
          <p className="text-center text-xs mb-4">
            Publicado el{" "}
            {new Date(tomo.fecha_publicacion).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        {imagesToShow.length > 0 ? (
          <div
            className={`embla relative w-full h-[28rem] sm:h-[32rem] mb-4 rounded border overflow-hidden ${
              darkMode ? "border-gray-700" : "border-brown-dark"
            }`}
          >
            <div className="embla__viewport h-full" ref={emblaRef}>
              <div className="embla__container h-full">
                {imagesToShow.map((img, index) => (
                  <div className="embla__slide h-full" key={index}>
                    <div className="relative w-full h-full overflow-hidden rounded">
                      <Image
                        src={img}
                        alt={`${tomo.titulo} - imagen ${index + 1}`}
                        fill
                        style={{ objectFit: "contain" }}
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="transition-transform duration-500 ease-in-out"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de navegación */}
            <button
              className="embla__button embla__button--prev absolute top-1/2 left-2 -translate-y-1/2 bg-[#1a1a1a]/70 text-white rounded-full p-2 hover:bg-[#000]/90 transition z-10"
              onClick={() => emblaApi && emblaApi.scrollPrev()}
              aria-label="Imagen anterior"
            >
              <BsArrowLeftCircleFill className="w-7 h-7" />
            </button>
            <button
              className="embla__button embla__button--next absolute top-1/2 right-2 -translate-y-1/2 bg-[#1a1a1a]/70 text-white rounded-full p-2 hover:bg-[#000]/90 transition z-10"
              onClick={() => emblaApi && emblaApi.scrollNext()}
              aria-label="Imagen siguiente"
            >
              <BsArrowRightCircleFill className="w-7 h-7" />
            </button>
          </div>
        ) : (
          <p className={`text-center italic mb-4 ${darkMode ? "text-gray-400" : "text-brown-medium"}`}>
            No hay imagen disponible.
          </p>
        )}

        <div
          className="prose prose-sm max-w-none"
          style={{ color: darkMode ? "#d1d5db" : undefined }}
          dangerouslySetInnerHTML={{
            __html: tomo.contenido_html || "No hay descripción disponible.",
          }}
        />

        {tomo.link && (
          <div className="pt-6 text-center">
            <a
              href={tomo.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block px-5 py-2 rounded-md shadow-lg transition text-base ${
                darkMode
                  ? "bg-yellow-500 text-gray-900 hover:bg-yellow-600"
                  : "bg-brown-dark text-yellow-light hover:bg-black"
              }`}
            >
              Visitar Instagram
            </a>
          </div>
        )}

        <style jsx>{`
          @keyframes scale-in-content {
            from {
              transform: scale(0.95);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-scale-in-content {
            animation: scale-in-content 0.3s
              cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          .embla {
            overflow: hidden;
          }
          .embla__viewport {
            overflow: hidden;
            width: 100%;
            height: 100%;
          }
          .embla__container {
            display: flex;
            user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
            height: 100%;
          }
          .embla__slide {
            position: relative;
            min-width: 100%;
            height: 100%;
          }
          .embla__button {
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s ease;
          }
          .embla__button:focus {
            outline: none;
            box-shadow: 0 0 0 2px #ffbf00;
          }
        `}</style>
      </div>
    </div>
  );
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@carpanta.com";

type Tomo = {
  id: number;
  titulo: string;
  slug: string;
  autor?: string;
  fecha_publicacion?: string;
  contenido_html?: string;
  imagen_url?: string;
  imagenes_urls?: string[];
  link?: string;
  borrador: boolean;
};

export default function RevisionesTomos() {
  const [tomos, setTomos] = useState<Tomo[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const router = useRouter();

  const [currentView, setCurrentView] = useState<"pendientes" | "publicados">(
    "pendientes"
  );
  const [showPreviewModal, setShowPreviewModal] = useState<Tomo | null>(null);

  // Estado para modo oscuro
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.email !== ADMIN_EMAIL) {
        router.replace("/admincar/login");
      } else {
        setUserChecked(true);
      }
    };
    checkAdmin();
  }, [router]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/admincar/login");
  };

  const fetchTomos = async () => {
    setLoading(true);
    setTomos([]);
    setMensaje("");

    let query = supabase
      .from("tomos")
      .select("*")
      .order("fecha_publicacion", { ascending: false });

    if (currentView === "pendientes") {
      query = query.eq("borrador", true);
    } else {
      query = query.eq("borrador", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener tomos:", error);
      setMensaje("Error al cargar tomos.");
    } else {
      setTomos(data || []);
      if (data && data.length === 0) {
        setMensaje(
          `No hay tomos ${
            currentView === "pendientes"
              ? "pendientes de aprobación"
              : "publicados"
          }.`
        );
      }
    }
    setLoading(false);
  };

  const aprobarTomo = async (id: number) => {
    setMensaje("");
    const { error } = await supabase
      .from("tomos")
      .update({ borrador: false })
      .eq("id", id);

    if (error) {
      console.error("Error al aprobar tomo:", error);
      setMensaje(`Error al aprobar tomo: ${error.message}`);
    } else {
      setMensaje("Tomo aprobado con éxito.");
      fetchTomos();
    }
  };

  const rechazarTomo = async (id: number, titulo: string = "este tomo") => {
    if (
      !confirm(
        `¿Estás seguro de que quieres RECHAZAR y eliminar "${titulo}"? Esta acción es irreversible.`
      )
    ) {
      return;
    }
    setMensaje("");
    setLoading(true);

    const { data: selectData, error: selectError } = await supabase
      .from("tomos")
      .select("imagen_url, imagenes_urls")
      .eq("id", id)
      .single();

    if (selectError) {
      console.error("Error al obtener URLs de imagen:", selectError);
      setMensaje("Error al obtener datos del tomo para eliminar.");
      setLoading(false);
      return;
    }

    const filesToDelete: string[] = [];
    if (selectData?.imagen_url) {
      const pathSegments = selectData.imagen_url.split("/public/");
      if (pathSegments.length > 1) filesToDelete.push(pathSegments[1]);
    }
    if (selectData?.imagenes_urls && Array.isArray(selectData.imagenes_urls)) {
      selectData.imagenes_urls.forEach((url: string) => {
        const pathSegments = url.split("/public/");
        if (pathSegments.length > 1) filesToDelete.push(pathSegments[1]);
      });
    }

    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("carpanta-images")
        .remove(filesToDelete);

      if (storageError) {
        console.error("Error al eliminar imágenes del storage:", storageError);
        setMensaje(
          `Error al eliminar las imágenes asociadas del storage: ${storageError.message}`
        );
      }
    }

    const { error } = await supabase.from("tomos").delete().eq("id", id);

    if (error) {
      console.error("Error al rechazar tomo:", error);
      setMensaje(`Error al rechazar tomo: ${error.message}`);
    } else {
      setMensaje("Tomo rechazado y eliminado con éxito.");
      fetchTomos();
    }
    setLoading(false);
  };

  const eliminarTomo = async (id: number, titulo: string = "este tomo") => {
    if (
      !confirm(
        `¿Estás seguro de que quieres ELIMINAR el tomo "${titulo}"? Esta acción es irreversible.`
      )
    ) {
      return;
    }
    setMensaje("");
    setLoading(true);

    const { data: selectData, error: selectError } = await supabase
      .from("tomos")
      .select("imagen_url, imagenes_urls")
      .eq("id", id)
      .single();

    if (selectError) {
      console.error("Error al obtener URLs de imagen:", selectError);
      setMensaje("Error al obtener datos del tomo para eliminar.");
      setLoading(false);
      return;
    }

    const filesToDelete: string[] = [];
    if (selectData?.imagen_url) {
      const pathSegments = selectData.imagen_url.split("/public/");
      if (pathSegments.length > 1) filesToDelete.push(pathSegments[1]);
    }
    if (selectData?.imagenes_urls && Array.isArray(selectData.imagenes_urls)) {
      selectData.imagenes_urls.forEach((url: string) => {
        const pathSegments = url.split("/public/");
        if (pathSegments.length > 1) filesToDelete.push(pathSegments[1]);
      });
    }

    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("carpanta-images")
        .remove(filesToDelete);

      if (storageError) {
        console.error("Error al eliminar imágenes del storage:", storageError);
        setMensaje(
          `Error al eliminar las imágenes asociadas del storage: ${storageError.message}`
        );
      }
    }

    const { error: dbError } = await supabase
      .from("tomos")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Error al eliminar tomo de la base de datos:", dbError);
      setMensaje(`Error al eliminar tomo: ${dbError.message}`);
    } else {
      setMensaje("Tomo eliminado con éxito.");
      fetchTomos();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userChecked) {
      fetchTomos();
    }
  }, [userChecked, currentView]);

  if (!userChecked) return null;

  return (
     <div className={darkMode ? "bg-gray-900 text-gray-100 min-h-screen" : "bg-paper text-black min-h-screen"}>
    <div className="max-w-7xl mx-auto p-4 sm:p-8 font-serif">
      <header
        className={`sticky top-0 z-30 shadow-md border-b flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-3 sm:py-4 mb-6 sm:mb-8 ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-paper border-brown-dark"
        }`}
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-widest font-newspaper mb-3 sm:mb-0 text-center sm:text-left">
          Panel de Administración
        </h1>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 items-center">
          {/* Switch modo oscuro */}
          <label
            htmlFor="darkModeToggle"
            className="flex items-center cursor-pointer select-none text-sm sm:text-base"
          >
            <div className="relative">
              <input
                id="darkModeToggle"
                type="checkbox"
                className="sr-only"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                  darkMode ? "bg-yellow-500" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
                  darkMode ? "translate-x-5" : "translate-x-0"
                }`}
              ></div>
            </div>
            <span className="ml-3 select-none">
              {darkMode ? "Modo Oscuro" : "Modo Claro"}
            </span>
          </label>

          <button
            onClick={() => setCurrentView("pendientes")}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md transition-colors duration-200 text-sm sm:text-lg font-semibold ${
              currentView === "pendientes"
                ? darkMode
                  ? "bg-yellow-500 text-gray-900 shadow-md"
                  : "bg-brown-dark text-yellow-light shadow-md"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-yellow-light text-brown-dark border border-brown-dark hover:bg-yellow-200"
            }`}
          >
            Tomos Pendientes
          </button>
          <button
            onClick={() => setCurrentView("publicados")}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md transition-colors duration-200 text-sm sm:text-lg font-semibold ${
              currentView === "publicados"
                ? darkMode
                  ? "bg-yellow-500 text-gray-900 shadow-md"
                  : "bg-brown-dark text-yellow-light shadow-md"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-yellow-light text-brown-dark border border-brown-dark hover:bg-yellow-200"
            }`}
          >
            Tomos Publicados
          </button>
          <button
            onClick={cerrarSesion}
            className={`flex items-center gap-1 rounded-md px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-lg font-semibold transition-colors duration-200 ${
              darkMode
                ? "bg-red-700 text-gray-100 hover:bg-red-600"
                : "bg-red-500 text-white hover:bg-red-400"
            }`}
          >
            <FiLogOut />
            Cerrar sesión
          </button>
        </div>
      </header>

      {mensaje && (
        <p
          className={`mb-6 text-center font-semibold ${
            darkMode ? "text-yellow-400" : "text-red-700"
          }`}
        >
          {mensaje}
        </p>
      )}

      {loading && (
        <p className="text-center text-lg font-semibold mb-6">
          Cargando tomos...
        </p>
      )}

      {!loading && tomos.length === 0 && !mensaje && (
        <p className="text-center italic mb-6">
          No hay tomos para mostrar.
        </p>
      )}

      <ul className="space-y-4">
        {tomos.map((tomo) => (
          <li
            key={tomo.id}
            className={`border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
              darkMode
                ? "border-gray-700 bg-gray-800 hover:bg-gray-700"
                : "border-brown-dark hover:bg-yellow-light"
            }`}
          >
            <div className="flex flex-col">
              <h3 className="text-xl font-bold font-newspaper">{tomo.titulo}</h3>
              {tomo.autor && (
                <p className={`italic ${darkMode ? "text-gray-400" : "text-brown-medium"}`}>
                  Por: {tomo.autor}
                </p>
              )}
              {tomo.fecha_publicacion && (
                <p className={`text-sm ${darkMode ? "text-gray-500" : "text-brown-medium"}`}>
                  Publicado el{" "}
                  {new Date(tomo.fecha_publicacion).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {currentView === "pendientes" && (
                <>
                  <button
                    title="Aprobar"
                    className="rounded-full p-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => aprobarTomo(tomo.id)}
                  >
                    <FiCheckCircle size={24} />
                  </button>
                  <button
                    title="Rechazar"
                    className="rounded-full p-2 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => rechazarTomo(tomo.id, tomo.titulo)}
                  >
                    <FiXCircle size={24} />
                  </button>
                </>
              )}
              {currentView === "publicados" && (
                <button
                  title="Eliminar"
                  className="rounded-full p-2 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => eliminarTomo(tomo.id, tomo.titulo)}
                >
                  <FiTrash2 size={24} />
                </button>
              )}
              <button
                title="Ver obra"
                className={`rounded-full p-2 ${
                  darkMode
                    ? "bg-yellow-500 text-gray-900 hover:bg-yellow-600"
                    : "bg-brown-dark text-yellow-light hover:bg-black"
                }`}
                onClick={() => setShowPreviewModal(tomo)}
              >
                <FiEye size={24} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showPreviewModal && (
        <MiniTomoViewer
          tomo={showPreviewModal}
          onClose={() => setShowPreviewModal(null)}
          darkMode={darkMode}
        />
      )}
    </div>
     </div>
  );
}
