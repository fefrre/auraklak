// pages/obras.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare } from "lucide-react"; // Iconos para Like y Comentario (opcional)

type Obra = {
  id: number;
  titulo: string;
  descripcion: string;
  url_archivo: string;
  contacto: string;
  fecha: string; // ISO string from Supabase
  likes: number; // Nuevo campo para los likes
};

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el header dinámico
  const [scrollUp, setScrollUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Función para cargar las obras
  const cargarObras = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("obras")
      .select("id, titulo, descripcion, url_archivo, contacto, fecha, likes")
      .order("id", { ascending: false }); // Ordenar por ID o fecha más reciente

    if (error) {
      console.error("Error al cargar obras:", error);
      setError(
        "No se pudieron cargar las obras. Inténtalo de nuevo más tarde."
      );
      setLoading(false);
      return;
    }
    setObras(data || []);
    setLoading(false);
  }, []);

  // Función para manejar el "Me gusta"
  const handleLike = useCallback(
    async (obraId: number, currentLikes: number) => {
      // Optimistic update: actualiza la UI antes de la respuesta del servidor
      setObras((prevObras) =>
        prevObras.map((obra) =>
          obra.id === obraId ? { ...obra, likes: obra.likes + 1 } : obra
        )
      );

      const { error } = await supabase
        .from("obras")
        .update({ likes: currentLikes + 1 })
        .eq("id", obraId);

      if (error) {
        console.error("Error al dar like:", error);
        // Revertir el optimistic update si hubo un error
        setObras((prevObras) =>
          prevObras.map((obra) =>
            obra.id === obraId ? { ...obra, likes: obra.likes - 1 } : obra
          )
        );
        alert("Error al dar 'me gusta'. Inténtalo de nuevo.");
      }
    },
    []
  );

  // Efecto para cargar las obras al montar el componente
  useEffect(() => {
    cargarObras();
  }, [cargarObras]);

  // Efecto para el header dinámico (scroll)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      // Mostrar el header si el scroll es hacia arriba o si estamos en la parte superior
      setScrollUp(currentY < lastScrollY || currentY < 50); // Muestra si sube o si está cerca del top
      setLastScrollY(currentY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header Fijo/Dinámico */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
          scrollUp ? "translate-y-0" : "-translate-y-full"
        } bg-gray-900 shadow-lg border-b border-purple-800`}
      >
        {/* Aumentamos el padding vertical (py) y la altura mínima (min-h) del div interno del header */}
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center min-h-[72px] sm:min-h-[80px]">
          {/* Logo AURA a la izquierda */}
          <Link href="/" className="flex items-center space-x-2">
            {/*
              CAMBIOS AQUÍ para el logo:
              - Aumentamos los tamaños base y responsivos del contenedor (div).
              - Cambiamos objectFit a 'cover' si quieres que la imagen llene el espacio,
                o 'contain' si prefieres que la imagen se vea completa aunque deje espacios.
                Dado que el logo es una calavera con fondo, 'contain' podría ser lo mejor para evitar recortes.
                Si el logo AURA tiene un fondo que debería ser invisible, verifica que sea PNG con transparencia.
            */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0">
              {" "}
              {/* Contenedor para la imagen, con flex-shrink-0 */}
              <Image
                src="/AURA.png" // Asegúrate de que esta ruta sea correcta
                alt="Logo AURA"
                fill // Hace que la imagen ocupe todo el espacio del div padre
                style={{ objectFit: "cover" }} // 'contain' para que la imagen se vea completa, 'cover' si quieres que llene el espacio y se recorte si es necesario
                sizes="(max-width: 640px) 48px, (max-width: 768px) 64px, 80px" // Define el tamaño de la imagen para diferentes viewports
              />
            </div>
            {/* Ajustamos el tamaño del texto "AURA" para que acompañe al logo más grande */}
            <span className="hidden sm:inline text-xl sm:text-2xl lg:text-3xl font-bold text-white whitespace-nowrap">
              AURA
            </span>
          </Link>

          {/* Título central */}
          {/* Aumentamos el tamaño del título central */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-purple-400 text-center flex-grow mx-2">
            {" "}
            {/* Agregamos mx-2 para un pequeño margen si el logo es muy grande */}
            OBRAS PUBLICADAS
          </h1>

          {/* Botón "Subir Obra" a la derecha */}
          <Link href="/">
            {/* Aumentamos el padding y el tamaño de fuente del botón */}
            <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base lg:text-lg rounded-md transition font-semibold shadow-md whitespace-nowrap">
              Subir Obra
            </button>
          </Link>
        </div>
      </header>

      {/* Contenido principal de la galería */}
      {/* Ajustamos el padding-top para compensar el header más grande */}
      <main className="flex-grow pt-[88px] sm:pt-[96px] md:pt-[104px] p-6 max-w-5xl mx-auto w-full">
        {loading && (
          <p className="text-center text-xl text-purple-300 mt-10">
            Cargando obras...
          </p>
        )}
        {error && (
          <p className="text-center text-xl text-red-500 mt-10">
            Error: {error}
          </p>
        )}
        {!loading && !error && obras.length === 0 && (
          <p className="text-center text-xl text-purple-300 italic mt-10 animate-fade-in">
            Aún no hay obras publicadas. ¡Sé el primero en subir una!
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {obras.map((obra) => (
            <div
              key={obra.id}
              className="bg-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col transform hover:scale-105 transition-transform duration-300 animate-fade-in"
            >
              {/* Contenido multimedia (imagen/video) */}
              <div className="relative w-full h-60 bg-gray-800 flex items-center justify-center overflow-hidden">
                {obra.url_archivo.includes("video") ? (
                  <video
                    controls
                    className="w-full h-full object-cover"
                    src={obra.url_archivo}
                    preload="metadata" // Para cargar metadatos y mostrar un poster
                  ></video>
                ) : (
                  <Image
                    src={obra.url_archivo}
                    alt={obra.titulo}
                    fill
                    style={{ objectFit: "cover" }}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false} // No es necesario cargar todas las imágenes con alta prioridad
                  />
                )}
              </div>

              {/* Detalles de la obra */}
              <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-2xl font-semibold text-purple-400 mb-2 truncate">
                  {obra.titulo}
                </h2>
                <p className="text-gray-300 text-base mb-3 overflow-hidden text-ellipsis line-clamp-3">
                  {obra.descripcion}
                </p>
                <p className="text-gray-400 text-sm italic mb-2">
                  <strong className="text-purple-300">Contacto:</strong>{" "}
                  {obra.contacto}
                </p>
                <p className="text-gray-500 text-xs mt-auto">
                  Subido el: {new Date(obra.fecha).toLocaleDateString()}
                </p>

                {/* Sección de acciones (Likes, Comentarios - si los añades) */}
                <div className="flex items-center justify-between mt-4 border-t border-gray-700 pt-4">
                  <button
                    onClick={() => handleLike(obra.id, obra.likes)}
                    className="flex items-center space-x-2 text-purple-300 hover:text-purple-500 transition-colors duration-200"
                    aria-label={`Dar me gusta a ${obra.titulo}`}
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        obra.likes && obra.likes > 0
                          ? "fill-current text-red-500"
                          : ""
                      }`}
                    />
                    <span className="font-bold text-lg">{obra.likes ?? 0}</span>
                  </button>
                  {/* Puedes añadir un botón para comentarios si implementas esa funcionalidad */}
                  {/* <button className="flex items-center space-x-2 text-blue-300 hover:text-blue-500 transition-colors duration-200">
                    <MessageSquare className="w-6 h-6" />
                    <span className="font-bold text-lg">0</span>
                  </button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
