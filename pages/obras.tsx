// pages/obras.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare } from "lucide-react"; // Iconos para Like y Comentario (opcional)
import { User } from "@supabase/supabase-js"; // Importar el tipo User de Supabase
import { useRouter } from "next/router"; // Importar useRouter

type Obra = {
  id: number;
  titulo: string;
  descripcion: string;
  url_archivo: string;
  contacto: string;
  fecha: string; // ISO string from Supabase
  likes: number; // Campo para el conteo total de likes
  has_liked?: boolean; // Nuevo campo para indicar si el usuario actual ha dado like
};

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // Estado para el usuario autenticado
  const router = useRouter(); // Inicializar useRouter

  // Estados para el header dinámico
  const [scrollUp, setScrollUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Efecto para obtener el usuario autenticado
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Función para cargar las obras y los likes del usuario
  const cargarObras = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Cargar las obras
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select("id, titulo, descripcion, url_archivo, contacto, fecha, likes")
      .order("id", { ascending: false });

    if (obrasError) {
      console.error("Error al cargar obras:", obrasError);
      setError("No se pudieron cargar las obras. Inténtalo de nuevo más tarde.");
      setLoading(false);
      return;
    }

    let loadedObras: Obra[] = obrasData || [];

    // 2. Si hay un usuario autenticado, cargar sus likes
    if (user) {
      const { data: userLikesData, error: userLikesError } = await supabase
        .from("user_likes")
        .select("obra_id")
        .eq("user_id", user.id); // Solo los likes del usuario actual

      if (userLikesError) {
        console.error("Error al cargar likes del usuario:", userLikesError);
        // No bloqueamos la carga de obras, solo mostramos un mensaje si es necesario
      } else {
        const likedObraIds = new Set(userLikesData?.map((like) => like.obra_id));
        loadedObras = loadedObras.map((obra) => ({
          ...obra,
          has_liked: likedObraIds.has(obra.id),
        }));
      }
    }

    setObras(loadedObras);
    setLoading(false);
  }, [user]); // Recargar obras cuando el usuario cambie

  // Función para manejar el "Me gusta"
  const handleLike = useCallback(
    async (obraId: number, currentLikes: number, hasLiked: boolean) => {
      if (!user) {
        alert("Debes iniciar sesión para dar 'me gusta'.");
        router.push("/login"); // Redirige al login si no está autenticado
        return;
      }

      // Optimistic update: actualiza la UI antes de la respuesta del servidor
      setObras((prevObras) =>
        prevObras.map((obra) =>
          obra.id === obraId
            ? { ...obra, has_liked: !hasLiked, likes: hasLiked ? obra.likes - 1 : obra.likes + 1 }
            : obra
        )
      );

      let error: any = null;

      if (!hasLiked) {
        const { error: insertError } = await supabase.from("user_likes").insert({
          user_id: user.id,
          obra_id: obraId,
        });
        error = insertError;
        if (!error) {
          await supabase.rpc("increment_likes", { obra_id_param: obraId });
        }
      } else {
        const { error: deleteError } = await supabase
          .from("user_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("obra_id", obraId);
        error = deleteError;
        if (!error) {
          await supabase.rpc("decrement_likes", { obra_id_param: obraId });
        }
      }

      if (error) {
        console.error("Error al gestionar like/unlike:", error);
        // Revertir el optimistic update si hubo un error
        setObras((prevObras) =>
          prevObras.map((obra) =>
            obra.id === obraId
              ? { ...obra, has_liked: hasLiked, likes: hasLiked ? obra.likes + 1 : obra.likes - 1 }
              : obra
          )
        );
        alert("Error al procesar tu 'me gusta'. Inténtalo de nuevo.");
      }
    },
    [user, router] // Añadir router a las dependencias
  );

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error.message);
      alert("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
    } else {
      setUser(null); // Limpiar el estado del usuario localmente
      alert("Sesión cerrada con éxito.");
      router.push("/login"); // Redirige a la página de login
    }
  };

  // Efecto para cargar las obras al montar el componente o cuando el usuario cambie
  useEffect(() => {
    cargarObras();
  }, [cargarObras]);

  // Efecto para el header dinámico (scroll) - Mantener sin cambios
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrollUp(currentY < lastScrollY || currentY < 50);
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center min-h-[72px] sm:min-h-[80px]">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0">
              <Image
                src="/AURA.png"
                alt="Logo AURA"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 48px, (max-width: 768px) 64px, 80px"
              />
            </div>
            <span className="hidden sm:inline text-xl sm:text-2xl lg:text-3xl font-bold text-white whitespace-nowrap">
              AURA
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-purple-400 text-center flex-grow mx-2">
            OBRAS PUBLICADAS
          </h1>

          {/* Botones de acción en el header (condicionales) */}
          <div className="flex items-center space-x-3">
            {user ? ( // Si hay un usuario autenticado
              <>
                {/* Puedes añadir un Link a una página de subir obra si el usuario está autenticado */}
                <Link href="/subir-obra"> {/* Asumiendo que tendrás una página para subir obra */}
                  <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base lg:text-lg rounded-md transition font-semibold shadow-md whitespace-nowrap">
                    Subir Obra
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base lg:text-lg rounded-md transition font-semibold shadow-md whitespace-nowrap"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              // Si no hay usuario autenticado
              <>
                <Link href="/login">
                  <button className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base lg:text-lg rounded-md transition font-semibold shadow-md whitespace-nowrap">
                    Iniciar Sesión
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base lg:text-lg rounded-md transition font-semibold shadow-md whitespace-nowrap">
                    Registrarse
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal de la galería */}
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
                    preload="metadata"
                  ></video>
                ) : (
                  <Image
                    src={obra.url_archivo}
                    alt={obra.titulo}
                    fill
                    style={{ objectFit: "cover" }}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false}
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

                {/* Sección de acciones (Likes) */}
                <div className="flex items-center justify-between mt-4 border-t border-gray-700 pt-4">
                  <button
                    onClick={() => handleLike(obra.id, obra.likes, obra.has_liked ?? false)}
                    className={`flex items-center space-x-2 transition-colors duration-200 ${
                      user // Si hay un usuario, el color depende de si ha dado like
                        ? obra.has_liked ? "text-red-500 hover:text-red-600" : "text-purple-300 hover:text-purple-500"
                        : "text-gray-500 cursor-not-allowed" // Deshabilitado si no hay usuario
                    }`}
                    aria-label={`Dar me gusta a ${obra.titulo}`}
                    disabled={!user} // Deshabilita el botón si no hay usuario
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        obra.has_liked ? "fill-current text-red-500" : ""
                      }`}
                    />
                    <span className="font-bold text-lg">{obra.likes ?? 0}</span>
                  </button>
                  {/* Puedes añadir un botón para comentarios si implementas esa funcionalidad */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}