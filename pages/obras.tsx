"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut,
  FileText,
  FileAudio,
  FileVideo,
  FileImage,
  FileArchive,
  Download,
  Instagram,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/router";

type Obra = {
  id: number;
  titulo: string;
  autor: string;
  descripcion: string;
  url_archivo: string;
  contacto: string;
  fecha: string;
  likes: number;
  has_liked?: boolean;
};

const getFileType = (url: string) => {
  const extension = url.split(".").pop()?.toLowerCase();
  if (!extension) return "unknown";

  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension))
    return "image";
  if (["mp4", "webm", "ogg"].includes(extension)) return "video";
  if (["pdf"].includes(extension)) return "pdf";
  if (["doc", "docx"].includes(extension)) return "word";
  if (["ppt", "pptx"].includes(extension)) return "powerpoint";
  if (["xls", "xlsx"].includes(extension)) return "excel";
  if (["txt"].includes(extension)) return "text";
  if (["zip", "rar"].includes(extension)) return "archive";
  return "unknown";
};

// Función para detectar handles de Instagram
const isInstagramHandle = (text: string) => {
  return text?.startsWith("@");
};

// Función para construir URL de Instagram desde handle
const buildInstagramUrl = (handle: string) => {
  if (!handle) return "";
  const cleanHandle = handle.replace(/^@/, "").trim();
  return `https://instagram.com/${cleanHandle}`;
};

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [scrollUp, setScrollUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [showAuthForm, setShowAuthForm] = useState<"login" | "register" | null>(null);
  const [animatingLogo, setAnimatingLogo] = useState(false);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false);

  const handleLogoClick = () => {
    if (animatingLogo) return;
    setAnimatingLogo(true);
    setTimeout(() => {
      router.push("/");
    }, 600);
  };

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

  const getFileNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split("/");
      const fileNameWithQuery = parts[parts.length - 1];
      const fileNameParts = fileNameWithQuery.split("?");
      return decodeURIComponent(fileNameParts[0]);
    } catch (e) {
      console.error("Error parsing URL for file name:", e);
      return "archivo_descarga";
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

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
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const cargarObras = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select("id, titulo, autor, descripcion, url_archivo, contacto, fecha, likes")
      .eq("aprobada", true)
      .order("id", { ascending: false });

    if (obrasError) {
      console.error("Error al cargar obras:", obrasError);
      setError("No se pudieron cargar las obras. Inténtalo de nuevo más tarde.");
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
        const likedObraIds = new Set(userLikesData?.map((like) => like.obra_id));
        loadedObras = loadedObras.map((obra) => ({
          ...obra,
          has_liked: likedObraIds.has(obra.id),
        }));
      }
    }

    setObras(loadedObras);
    setLoading(false);
  }, [user]);

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

const handleInlineRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setAuthLoading(true);
  setAuthMessage("");

  try {
    // Verificación usando listUsers (API de administración)
    const { data: { users }, error: listError } = await supabase
      .auth
      .admin
      .listUsers();

    const userExists = users?.some(user => user.email === registerEmail);

    if (userExists) {
      setAuthMessage("Este correo ya está registrado. Por favor inicia sesión.");
      setAuthLoading(false);
      return;
    }

    // Resto del código de registro...
    const { error: signUpError } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
    });

    if (signUpError) {
      setAuthMessage(`Error al registrarse: ${signUpError.message}`);
    } else {
      setAuthMessage("¡Registro exitoso! Revisa tu email para confirmar.");
      setRegisterEmail("");
      setRegisterPassword("");
      setShowAuthForm("login");
    }
  } catch (error) {
    console.error("Error en el registro:", error);
    setAuthMessage("Ocurrió un error. Inténtalo de nuevo.");
  } finally {
    setAuthLoading(false);
  }
};

  useEffect(() => {
    cargarObras();
  }, [cargarObras]);

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
    setIsClosingModal(false);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsClosingModal(true);
    document.body.style.overflow = "auto";
    setTimeout(() => {
      setSelectedObra(null);
    }, 300);
  };

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al descargar el archivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileName = getFileNameFromUrl(url);
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error al iniciar la descarga:", error);
      alert("No se pudo descargar el archivo. Inténtalo de nuevo.");
    }
  };

  const isValidUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-100 bg-gray-950">
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
          scrollUp ? "translate-y-0" : "-translate-y-full"
        } bg-gray-900 shadow-lg border-b border-purple-800`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center min-h-[72px] sm:min-h-[80px]">
          <div
            onClick={handleLogoClick}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div
              className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0 transition-transform duration-700 ease-in-out ${
                animatingLogo ? "rotate-[360deg]" : ""
              }`}
            >
              <Image
                src="/AURA.png"
                alt="Logo AURA"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 48px, (max-width: 768px) 64px, 80px"
                className="transition-transform duration-500 ease-in-out shadow-lg rounded-xl hover:scale-110 hover:rotate-3"
              />
            </div>
            <span className="hidden text-xl font-bold text-white sm:inline sm:text-2xl lg:text-3xl whitespace-nowrap">
              AURA
            </span>
          </div>
          <h1 className="flex-grow mx-2 text-2xl font-extrabold text-center text-purple-400 sm:text-3xl lg:text-4xl">
            OBRAS PUBLICADAS
          </h1>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 transition-all duration-200 bg-purple-700 rounded-md hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? (
                <X className="w-8 h-8 text-white" />
              ) : (
                <Menu className="w-8 h-8 text-white" />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 z-50 px-4 py-3 mt-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-72 md:w-80 animate-fade-in-down">
                {user ? (
                  <>
                    <p className="px-2 mb-3 text-sm text-gray-300">
                      Hola, {user.email}
                    </p>
                    <Link href="/index" className="block">
                      <button className="flex items-center w-full px-4 py-3 mb-2 text-base font-semibold text-left text-white transition-colors duration-200 bg-purple-600 rounded-md hover:bg-purple-700">
                        <UserPlus className="w-5 h-5 mr-3" /> Subir Obra
                      </button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-base font-semibold text-left text-white transition-colors duration-200 bg-red-600 rounded-md hover:bg-red-700"
                      disabled={authLoading}
                    >
                      <LogOut className="w-5 h-5 mr-3" />{" "}
                      {authLoading ? "Cerrando..." : "Cerrar Sesión"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowAuthForm(showAuthForm === "login" ? null : "login");
                        setAuthMessage("");
                      }}
                      className="flex items-center w-full px-4 py-3 mb-2 text-base font-semibold text-left text-white transition-colors duration-200 bg-green-600 rounded-md hover:bg-green-700"
                    >
                      <LogIn className="w-5 h-5 mr-3" /> Iniciar Sesión
                    </button>
                    <button
                      onClick={() => {
                        setShowAuthForm(showAuthForm === "register" ? null : "register");
                        setAuthMessage("");
                      }}
                      className="flex items-center w-full px-4 py-3 mb-3 text-base font-semibold text-left text-white transition-colors duration-200 bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      <UserPlus className="w-5 h-5 mr-3" /> Registrarse
                    </button>

                    {showAuthForm === "login" && (
                      <form
                        onSubmit={handleInlineLogin}
                        className="p-3 mt-4 space-y-3 bg-gray-700 rounded-lg"
                      >
                        <h3 className="mb-3 text-xl font-bold text-center text-purple-400">
                          Login
                        </h3>
                        <div>
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-2 text-sm text-gray-100 placeholder-gray-500 bg-gray-900 border border-purple-600 rounded-md"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <div className="relative">
                            <input
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="Contraseña"
                              className="w-full p-2 text-sm text-gray-100 placeholder-gray-500 bg-gray-900 border border-purple-600 rounded-md"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              required
                            />
                            <button
                              type="button"
                              className="absolute text-purple-400 right-2 top-2"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                            >
                              {showLoginPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
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
                      <form
                        onSubmit={handleInlineRegister}
                        className="p-3 mt-4 space-y-3 bg-gray-700 rounded-lg"
                      >
                        <h3 className="mb-3 text-xl font-bold text-center text-purple-400">
                          Registro
                        </h3>
                        <div>
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-2 text-sm text-gray-100 placeholder-gray-500 bg-gray-900 border border-purple-600 rounded-md"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <div className="relative">
                            <input
                              type={showRegisterPassword ? "text" : "password"}
                              placeholder="Contraseña"
                              className="w-full p-2 text-sm text-gray-100 placeholder-gray-500 bg-gray-900 border border-purple-600 rounded-md"
                              value={registerPassword}
                              onChange={(e) => setRegisterPassword(e.target.value)}
                              required
                            />
                            <button
                              type="button"
                              className="absolute text-purple-400 right-2 top-2"
                              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            >
                              {showRegisterPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
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

      <main className="flex-grow pt-[88px] sm:pt-[96px] md:pt-[104px] p-6 max-w-5xl mx-auto w-full">
        {loading && (
          <p className="mt-10 text-xl text-center text-purple-300">
            Cargando obras...
          </p>
        )}
        {error && (
          <p className="mt-10 text-xl text-center text-red-500">
            Error: {error}
          </p>
        )}
        {!loading && !error && obras.length === 0 && (
          <p className="mt-10 text-xl italic text-center text-purple-300 animate-fade-in">
            Aún no hay obras publicadas. ¡Sé el primero en subir una!
          </p>
        )}

        <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2 lg:grid-cols-3">
          {obras.map((obra) => {
            const fileType = getFileType(obra.url_archivo);
            return (
              <div
                key={obra.id}
                className="flex flex-col overflow-hidden transition-transform duration-300 transform bg-gray-900 border border-gray-700 shadow-xl rounded-2xl hover:scale-105 animate-fade-in"
              >
                <div
                  className="relative flex items-center justify-center w-full overflow-hidden bg-gray-800 cursor-pointer h-60"
                  onClick={() => openModal(obra)}
                >
                  {fileType === "image" && (
                    <Image
                      src={obra.url_archivo}
                      alt={obra.titulo}
                      fill
                      style={{ objectFit: "cover" }}
                      className="object-cover w-full h-full"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false}
                    />
                  )}
                  {fileType === "video" && (
                    <video
                      controls
                      className="object-cover w-full h-full"
                      src={obra.url_archivo}
                      preload="metadata"
                    ></video>
                  )}
                  {fileType === "pdf" && (
                    <div className="flex flex-col items-center justify-center text-purple-400">
                      <FileText className="w-24 h-24 mb-2" />
                      <p className="px-4 text-lg font-semibold text-center">
                        Documento PDF
                      </p>
                    </div>
                  )}
                  {(fileType === "word" ||
                    fileType === "powerpoint" ||
                    fileType === "excel" ||
                    fileType === "text" ||
                    fileType === "archive" ||
                    fileType === "unknown") && (
                    <div className="flex flex-col items-center justify-center text-purple-400">
                      {fileType === "word" && <FileText className="w-24 h-24 mb-2" />}
                      {fileType === "powerpoint" && <FileVideo className="w-24 h-24 mb-2" />}
                      {fileType === "excel" && <FileText className="w-24 h-24 mb-2" />}
                      {fileType === "text" && <FileText className="w-24 h-24 mb-2" />}
                      {fileType === "archive" && <FileArchive className="w-24 h-24 mb-2" />}
                      {fileType === "unknown" && <FileText className="w-24 h-24 mb-2" />}
                      <p className="px-4 text-lg font-semibold text-center">
                        Haz clic para ver/descargar{" "}
                        {fileType === "unknown" ? "el archivo" : fileType}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-grow p-6">
                  <h2 className="mb-2 text-2xl font-semibold text-purple-400 truncate">
                    {obra.titulo}
                  </h2>
                  <p className="mb-3 overflow-hidden text-base text-gray-300 text-ellipsis line-clamp-3">
                    <strong className="text-purple-300">Autor:</strong> {obra.autor}
                  </p>
                  <p className="mb-3 overflow-hidden text-base text-gray-300 text-ellipsis line-clamp-3">
                    {obra.descripcion}
                  </p>
                  <p className="flex items-center gap-1 mb-2 text-sm italic text-gray-400">
                    <strong className="text-purple-300">Contacto:</strong>{" "}
                    {obra.contacto && obra.contacto !== "Anónimo" ? (
                      <>
                        <span>{obra.contacto}</span>
                        {isInstagramHandle(obra.contacto) && (
                          <a
                            href={buildInstagramUrl(obra.contacto)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-purple-400 transition-colors hover:text-purple-500"
                            aria-label="Ir a Instagram del contacto"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                      </>
                    ) : (
                      obra.contacto
                    )}
                  </p>
                  <p className="mt-auto text-xs text-gray-500">
                    Subido el: {new Date(obra.fecha).toLocaleDateString()}
                  </p>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleLike(obra.id, obra.likes, obra.has_liked ?? false)}
                      className={`flex items-center space-x-2 transition-colors duration-200 ${
                        user
                          ? obra.has_liked
                            ? "text-red-500 hover:text-red-600"
                            : "text-purple-300 hover:text-purple-500"
                          : "text-gray-500 cursor-not-allowed"
                      }`}
                      aria-label={`Dar me gusta a ${obra.titulo}`}
                      disabled={!user}
                    >
                      <Heart
                        className={`w-6 h-6 ${
                          obra.has_liked ? "fill-current text-red-500" : ""
                        }`}
                      />
                      <span className="text-lg font-bold">{obra.likes ?? 0}</span>
                    </button>
                    {obra.contacto && obra.contacto !== "Anónimo" && isInstagramHandle(obra.contacto) && (
                      <a
                        href={buildInstagramUrl(obra.contacto)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 transition-colors hover:text-gray-400"
                        aria-label="Ir a Instagram"
                      >
                        <Instagram className="w-7 h-7" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {selectedObra && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            isClosingModal ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeModal}
        >
          <div
            className={`relative bg-gray-900 rounded-lg shadow-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out ${
              isClosingModal
                ? "scale-90 opacity-0"
                : "scale-100 opacity-100 animate-zoom-in"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute z-10 p-2 text-white transition-colors duration-200 bg-purple-700 rounded-full top-3 right-3 hover:bg-purple-800"
              aria-label="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="mb-4 text-3xl font-bold text-center text-purple-400">
              {selectedObra.titulo}
            </h2>

            <div className="relative w-full min-h-[24rem] bg-gray-800 flex items-center justify-center rounded-lg overflow-hidden mb-6">
              {getFileType(selectedObra.url_archivo) === "image" && (
                <Image
                  src={selectedObra.url_archivo}
                  alt={selectedObra.titulo}
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-lg"
                  sizes="100vw"
                  priority={true}
                />
              )}
              {getFileType(selectedObra.url_archivo) === "video" && (
                <video
                  controls
                  className="object-contain w-full h-full"
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
                  <p className="text-center text-gray-400">
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
                  <FileText className="w-32 h-32 mb-4 text-purple-400" />
                  <p className="mb-4 text-xl text-gray-200">
                    Este tipo de archivo no puede ser previsualizado
                    directamente.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 text-gray-200">
              <p className="text-lg leading-relaxed">
                <strong className="text-purple-300">Autor:</strong> {selectedObra.autor}
              </p>
              <p className="text-lg leading-relaxed">
                {selectedObra.descripcion}
              </p>
              <p className="flex items-center gap-1 font-semibold text-purple-300">
                Contacto:{" "}
                {selectedObra.contacto && selectedObra.contacto !== "Anónimo" ? (
                  <>
                    <span>{selectedObra.contacto}</span>
                    {isInstagramHandle(selectedObra.contacto) && (
                      <a
                        href={buildInstagramUrl(selectedObra.contacto)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-purple-400 transition-colors hover:text-purple-500"
                        aria-label="Ir a Instagram del contacto"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                  </>
                ) : (
                  <span className="text-gray-300">{selectedObra.contacto}</span>
                )}
              </p>
              <p className="text-sm text-gray-400">
                Publicado el: {new Date(selectedObra.fecha).toLocaleDateString()}
              </p>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Heart className="w-6 h-6 text-red-500 fill-current" />
                  <span className="text-xl font-bold">
                    {selectedObra.likes ?? 0}
                  </span>
                  <span className="text-gray-400">me gusta</span>
                </div>
                <button
                  onClick={() => handleDownload(selectedObra.url_archivo, selectedObra.titulo)}
                  className="flex items-center px-5 py-2 font-semibold text-white transition-colors duration-200 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-5 h-5 mr-2" /> Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
