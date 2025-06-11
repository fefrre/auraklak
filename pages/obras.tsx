"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare, Menu, X, LogIn, UserPlus, LogOut, FileText, FileAudio, FileVideo, FileImage, FileArchive, Download } from "lucide-react"; // Import new icons, including 'Download'
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/router";

// Definición de tipo para una obra
type Obra = {
  id: number;
  titulo: string;
  descripcion: string;
  url_archivo: string;
  contacto: string;
  fecha: string;
  likes: number;
  has_liked?: boolean;
};

// Helper function to determine file type for display
const getFileType = (url: string) => {
  const extension = url.split(".").pop()?.toLowerCase();
  if (!extension) return "unknown";

  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) return "image";
  if (["mp4", "webm", "ogg"].includes(extension)) return "video";
  if (["pdf"].includes(extension)) return "pdf";
  if (["doc", "docx"].includes(extension)) return "word";
  if (["ppt", "pptx"].includes(extension)) return "powerpoint";
  if (["xls", "xlsx"].includes(extension)) return "excel";
  if (["txt"].includes(extension)) return "text";
  if (["zip", "rar"].includes(extension)) return "archive";
  return "unknown";
};

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Estados para el header dinámico
  const [scrollUp, setScrollUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Nuevo estado para controlar la visibilidad del menú desplegable
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Referencia para detectar clics fuera del menú
  const menuRef = useRef<HTMLDivElement>(null);

  // Estados para los campos pequeños de login/registro
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [showAuthForm, setShowAuthForm] = useState<"login" | "register" | null>(null);

  // --- Nuevos estados para el modal de imagen ---
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false); // Para la animación de cierre del modal
  // --- Fin nuevos estados ---

  // Efecto para cerrar el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowAuthForm(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Función para obtener el nombre del archivo de la URL
  const getFileNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      // Eliminar el prefijo 'storage/v1/object/public/obras/' si existe
      const fileNameWithQuery = parts[parts.length - 1];
      const fileNameParts = fileNameWithQuery.split('?'); // Remove query parameters
      return decodeURIComponent(fileNameParts[0]); // Decode URI component
    } catch (e) {
      console.error("Error parsing URL for file name:", e);
      return "archivo_descarga"; // Fallback name
    }
  };


  // Efecto para obtener el usuario autenticado y suscribirse a cambios
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setIsMenuOpen(false);
        setShowAuthForm(null);
      }
    });

    return () => {
      // Limpiar la suscripción cuando el componente se desmonte
      if (subscription) { // Asegura que la suscripción existe antes de intentar anularla
        subscription.unsubscribe();
      }
    };
  }, []); // Dependencias vacías para que se ejecute solo una vez al montar

  // Función para cargar las obras y los likes del usuario
  const cargarObras = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select("id, titulo, descripcion, url_archivo, contacto, fecha, likes")
      .order("id", { ascending: false });

    if (obrasError) {
      console.error("Error al cargar obras:", obrasError);
      setError(
        "No se pudieron cargar las obras. Inténtalo de nuevo más tarde."
      );
      setLoading(false);
      return;
    }

    let loadedObras: Obra[] = obrasData || [];

    if (user) {
      const { data: userLikesData, error: userLikesError } = await supabase
        .from("user_likes")
        .select("obra_id")
        .eq("user_id", user.id);

      if (userLikesError) {
        console.error("Error al cargar likes del usuario:", userLikesError);
      } else {
        const likedObraIds = new Set(
          userLikesData?.map((like) => like.obra_id)
        );
        loadedObras = loadedObras.map((obra) => ({
          ...obra,
          has_liked: likedObraIds.has(obra.id),
        }));
      }
    }

    setObras(loadedObras);
    setLoading(false);
  }, [user]);

  // Función para manejar el "Me gusta"
  const handleLike = useCallback(
    async (obraId: number, currentLikes: number, hasLiked: boolean) => {
      if (!user) {
        alert("Debes iniciar sesión para dar 'me gusta'.");
        router.push("/login");
        return;
      }

      setObras((prevObras) =>
        prevObras.map((obra) =>
          obra.id === obraId
            ? {
                ...obra,
                has_liked: !hasLiked,
                likes: hasLiked ? obra.likes - 1 : obra.likes + 1,
              }
            : obra
        )
      );

      let error: any = null;

      if (!hasLiked) {
        const { error: insertError } = await supabase
          .from("user_likes")
          .insert({
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
        setObras((prevObras) =>
          prevObras.map((obra) =>
            obra.id === obraId
              ? {
                  ...obra,
                  has_liked: hasLiked,
                  likes: hasLiked ? obra.likes + 1 : obra.likes - 1,
                }
              : obra
          )
        );
        alert("Error al procesar tu 'me gusta'. Inténtalo de nuevo.");
      }
    },
    [user, router]
  );

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error.message);
      setAuthMessage("Error al cerrar sesión. Inténtalo de nuevo.");
    } else {
      setUser(null);
      setAuthMessage("Sesión cerrada con éxito.");
      setIsMenuOpen(false);
      setShowAuthForm(null);
      router.push("/login");
    }
    setAuthLoading(false);
  };

  // Función para manejar el inicio de sesión desde el pequeño formulario
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setAuthMessage(`Error al iniciar sesión: ${error.message}`);
    } else {
      setAuthMessage("¡Sesión iniciada con éxito! Redirigiendo...");
      setLoginEmail("");
      setLoginPassword("");
      setTimeout(() => router.push("/obras"), 1000);
    }
    setAuthLoading(false);
  };

  // Función para manejar el registro desde el pequeño formulario
  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
    });

    if (error) {
      setAuthMessage(`Error al registrarse: ${error.message}`);
    } else {
      setAuthMessage(
        "¡Registro exitoso! Revisa tu email para confirmar y luego inicia sesión."
      );
      setRegisterEmail("");
      setRegisterPassword("");
      setShowAuthForm("login");
    }
    setAuthLoading(false);
  };

  // Efecto para cargar las obras al montar el componente o cuando el usuario cambie
  useEffect(() => {
    cargarObras();
  }, [cargarObras]);

  // Efecto para el header dinámico (scroll)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrollUp(currentY < lastScrollY || currentY < 50);
      setLastScrollY(currentY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

 

  const openModal = (obra: Obra) => {
    setSelectedObra(obra);
    setIsClosingModal(false); // Asegura que no está en estado de cierre
    document.body.style.overflow = "hidden"; // Deshabilita el scroll del fondo
  };

  const closeModal = () => {
    setIsClosingModal(true); // Inicia la animación de cierre
    document.body.style.overflow = "auto"; // Habilita el scroll del fondo
    // Retrasar el cierre completo para que la animación se complete
    setTimeout(() => {
      setSelectedObra(null);
    }, 300); // Duración de la animación (0.3s)
  };

  // --- AQUÍ ES DONDE VA LA FUNCIÓN handleDownload ---
  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al descargar el archivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileName = getFileNameFromUrl(url); // Reutilizamos tu función para el nombre del archivo
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName; // Esto sugiere el nombre del archivo para la descarga
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl); // Limpia la URL del objeto Blob
    } catch (error) {
      console.error("Error al iniciar la descarga:", error);
      alert("No se pudo descargar el archivo. Inténtalo de nuevo.");
    }
  };
  // --- Fin funciones modal ---

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

          {/* Icono del menú y menú desplegable */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? (
                <X className="w-8 h-8 text-white" />
              ) : (
                <Menu className="w-8 h-8 text-white" />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-72 md:w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-3 px-4 animate-fade-in-down z-50">
                {user ? (
                  <>
                    <p className="text-gray-300 text-sm mb-3 px-2">
                      Hola, {user.email}
                    </p>
                    <Link href="/index" className="block">
                      <button className="flex items-center w-full px-4 py-3 text-left text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors duration-200 text-base font-semibold mb-2">
                        <UserPlus className="mr-3 w-5 h-5" /> Subir Obra
                      </button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-left text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 text-base font-semibold"
                      disabled={authLoading}
                    >
                      <LogOut className="mr-3 w-5 h-5" />{" "}
                      {authLoading ? "Cerrando..." : "Cerrar Sesión"}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Botones para mostrar los formularios de login/registro */}
                    <button
                      onClick={() => {
                        setShowAuthForm(showAuthForm === "login" ? null : "login");
                        setAuthMessage("");
                      }}
                      className="flex items-center w-full px-4 py-3 text-left text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200 text-base font-semibold mb-2"
                    >
                      <LogIn className="mr-3 w-5 h-5" /> Iniciar Sesión
                    </button>
                    <button
                      onClick={() => {
                        setShowAuthForm(showAuthForm === "register" ? null : "register");
                        setAuthMessage("");
                      }}
                      className="flex items-center w-full px-4 py-3 text-left text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 text-base font-semibold mb-3"
                    >
                      <UserPlus className="mr-3 w-5 h-5" /> Registrarse
                    </button>

                    {/* Formularios pequeños (condicionales) */}
                    {showAuthForm === "login" && (
                      <form onSubmit={handleInlineLogin} className="space-y-3 mt-4 p-3 bg-gray-700 rounded-lg">
                        <h3 className="text-xl font-bold text-purple-400 text-center mb-3">Login</h3>
                        <div>
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-2 border border-purple-600 rounded-md bg-gray-900 text-gray-100 placeholder-gray-500 text-sm"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="password"
                            placeholder="Contraseña"
                            className="w-full p-2 border border-purple-600 rounded-md bg-gray-900 text-gray-100 placeholder-gray-500 text-sm"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full p-2.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition"
                          disabled={authLoading}
                        >
                          {authLoading ? "Iniciando..." : "Entrar"}
                        </button>
                      </form>
                    )}

                    {showAuthForm === "register" && (
                      <form onSubmit={handleInlineRegister} className="space-y-3 mt-4 p-3 bg-gray-700 rounded-lg">
                        <h3 className="text-xl font-bold text-purple-400 text-center mb-3">Registro</h3>
                        <div>
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-2 border border-purple-600 rounded-md bg-gray-900 text-gray-100 placeholder-gray-500 text-sm"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="password"
                            placeholder="Contraseña"
                            className="w-full p-2 border border-purple-600 rounded-md bg-gray-900 text-gray-100 placeholder-gray-500 text-sm"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full p-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition"
                          disabled={authLoading}
                        >
                          {authLoading ? "Registrando..." : "Crear Cuenta"}
                        </button>
                      </form>
                    )}

                    {authMessage && (
                      <p
                        className={`mt-4 text-center text-sm ${
                          authMessage.includes("éxito") || authMessage.includes("Revisa tu email")
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {authMessage}
                      </p>
                    )}
                  </>
                )}
              </div>
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
          {obras.map((obra) => {
            const fileType = getFileType(obra.url_archivo);
            return (
              <div
                key={obra.id}
                className="bg-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col transform hover:scale-105 transition-transform duration-300 animate-fade-in"
              >
                {/* Contenido multimedia (imagen/video/documento) - Agregamos onClick */}
                <div
                  className="relative w-full h-60 bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => openModal(obra)} // Aquí se llama a openModal
                >
                  {fileType === "image" && (
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
                  {fileType === "video" && (
                    <video
                      controls
                      className="w-full h-full object-cover"
                      src={obra.url_archivo}
                      preload="metadata"
                    ></video>
                  )}
                  {fileType === "pdf" && (
                    <div className="flex flex-col items-center justify-center text-purple-400">
                      <FileText className="w-24 h-24 mb-2" />
                      <p className="text-lg font-semibold text-center px-4">Documento PDF</p>
                    </div>
                  )}
                  {(fileType === "word" || fileType === "powerpoint" || fileType === "excel" || fileType === "text" || fileType === "archive" || fileType === "unknown") && (
                    <div className="flex flex-col items-center justify-center text-purple-400">
                      {fileType === "word" && <FileText className="w-24 h-24 mb-2" />}
                      {fileType === "powerpoint" && <FileVideo className="w-24 h-24 mb-2" />} {/* Using video icon for presentation */}
                      {fileType === "excel" && <FileText className="w-24 h-24 mb-2" />}
                      {fileType === "text" && <FileText className="w-24 h-24 mb-2" />}
                      {fileType === "archive" && <FileArchive className="w-24 h-24 mb-2" />}
                      {fileType === "unknown" && <FileText className="w-24 h-24 mb-2" />}
                      <p className="text-lg font-semibold text-center px-4">Haz clic para ver/descargar {fileType === "unknown" ? "el archivo" : fileType}</p>
                    </div>
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
                      onClick={() =>
                        handleLike(obra.id, obra.likes, obra.has_liked ?? false)
                      }
                      className={`flex items-center space-x-2 transition-colors duration-200 ${
                        user // Si hay un usuario, el color depende de si ha dado like
                          ? obra.has_liked
                            ? "text-red-500 hover:text-red-600"
                            : "text-purple-300 hover:text-purple-500"
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
            );
          })}
        </div>
      </main>

      {/* --- Modal para ver contenido ampliado --- */}
      {selectedObra && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            isClosingModal ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeModal} // Permite cerrar el modal haciendo clic fuera
        >
          <div
            className={`relative bg-gray-900 rounded-lg shadow-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out ${
              isClosingModal ? "scale-90 opacity-0" : "scale-100 opacity-100 animate-zoom-in"
            }`}
            onClick={(e) => e.stopPropagation()} // Evita que el clic en el contenido cierre el modal
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 p-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white transition-colors duration-200 z-10"
              aria-label="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-bold text-purple-400 mb-4 text-center">
              {selectedObra.titulo}
            </h2>

            {/* Contenido dinámico del modal */}
            <div className="relative w-full min-h-[24rem] bg-gray-800 flex items-center justify-center rounded-lg overflow-hidden mb-6">
              {getFileType(selectedObra.url_archivo) === "image" && (
                <Image
                  src={selectedObra.url_archivo}
                  alt={selectedObra.titulo}
                  fill
                  style={{ objectFit: "contain" }} // 'contain' para que la imagen se vea completa
                  className="rounded-lg"
                  sizes="100vw"
                  priority={true} // Prioriza la carga
                />
              )}
              {getFileType(selectedObra.url_archivo) === "video" && (
                <video
                  controls
                  className="w-full h-full object-contain"
                  src={selectedObra.url_archivo}
                  preload="metadata"
                ></video>
              )}
              {getFileType(selectedObra.url_archivo) === "pdf" && (
                <iframe
                  src={selectedObra.url_archivo}
                  className="w-full h-full"
                  title="PDF Viewer"
                >
                  <p className="text-gray-400 text-center">
                    Tu navegador no soporta la previsualización de PDFs.
                    <br />
                    Puedes{" "}
                    <a
                      href={selectedObra.url_archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:underline"
                    >
                      descargar el archivo aquí
                    </a>
                    .
                  </p>
                </iframe>
              )}
              {(getFileType(selectedObra.url_archivo) === "word" ||
                getFileType(selectedObra.url_archivo) === "powerpoint" ||
                getFileType(selectedObra.url_archivo) === "excel" ||
                getFileType(selectedObra.url_archivo) === "text" ||
                getFileType(selectedObra.url_archivo) === "archive" ||
                getFileType(selectedObra.url_archivo) === "unknown") && (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <FileText className="w-32 h-32 text-purple-400 mb-4" />
                  <p className="text-xl text-gray-200 mb-4">
                    Este tipo de archivo no puede ser previsualizado directamente.
                  </p>
                  {/* El botón de descarga ahora está fuera de esta condicional y es global */}
                </div>
              )}
            </div>

            <div className="text-gray-200 space-y-3">
              <p className="text-lg leading-relaxed">{selectedObra.descripcion}</p>
              <p className="text-purple-300 font-semibold">
                Contacto: <span className="text-gray-300">{selectedObra.contacto}</span>
              </p>
              <p className="text-gray-400 text-sm">
                Publicado el: {new Date(selectedObra.fecha).toLocaleDateString()}
              </p>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Heart className="w-6 h-6 text-red-500 fill-current" />
                  <span className="font-bold text-xl">{selectedObra.likes ?? 0}</span>
                  <span className="text-gray-400">me gusta</span>
                </div>
                {/* Botón de Descargar siempre presente en el modal */}
                <button
                  onClick={() => handleDownload(selectedObra.url_archivo, selectedObra.titulo)}
                  className="flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200"
                >
                  <Download className="w-5 h-5 mr-2" /> Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- Fin Modal --- */}
    </div>
  );
}