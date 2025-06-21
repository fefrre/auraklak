"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import { useState, useEffect, useRef } from "react"; // Added useRef
import { supabase } from "@/lib/supabaseClient"; // Make sure this path is correct
import { User } from "@supabase/supabase-js"; // Import User type
import { Heart, Menu, X, LogIn, UserPlus, LogOut, Eye, EyeOff } from "lucide-react"; // Import necessary icons

// --- TIPOS ACTUALIZADOS ---
type ContenidoExclusivoItem = {
  id: string; // UUID in Supabase is string
  titulo: string;
  descripcion: string;
  tipo: "imagen" | "video" | "documento";
  url_archivo: string;
  created_at: string;
  likes_count: number; // Now sourced directly from contenido_exclusivo
  user_has_liked?: boolean; // To know if the current user has liked it (calculated)
};

export default function ContenidoExclusivo() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatingLogo, setAnimatingLogo] = useState(false);
  const [contenidoExclusivo, setContenidoExclusivo] = useState<
    ContenidoExclusivoItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // Use User type for user state

  const [showModal, setShowModal] = useState(false);
  const [selectedContent, setSelectedContent] =
    useState<ContenidoExclusivoItem | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false); // For modal close animation

  // States for header/auth menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // Ref for click outside menu

  // States for the small login/register forms
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [showAuthForm, setShowAuthForm] = useState<"login" | "register" | null>(
    null
  );
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);


  const handleLogoClick = () => {
    setAnimatingLogo(true);
    setTimeout(() => {
      setAnimatingLogo(false);
      router.push("/");
    }, 1000);
  };

  // --- Efecto para obtener la sesión del usuario y suscribirse a cambios ---
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
      // Recargar contenido para actualizar el estado de 'likes' si el usuario inicia/cierra sesión
      if (_event === "SIGNED_IN" || _event === "SIGNED_OUT") {
        fetchContenidoExclusivo();
        // Close menu and auth forms on successful login/logout
        setIsMenuOpen(false);
        setShowAuthForm(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // --- Función para cargar el contenido exclusivo y los likes del usuario actual ---
  const fetchContenidoExclusivo = async () => {
    setLoading(true);
    setError(null);

    const { data: contentData, error: contentError } = await supabase
      .from("contenido_exclusivo")
      .select("id, titulo, descripcion, tipo, url_archivo, created_at, likes_count") // Now likes_count comes directly
      .order("created_at", { ascending: false });

    if (contentError) {
      console.error("Error al cargar contenido exclusivo:", contentError);
      setError("No se pudo cargar el contenido exclusivo. Intenta de nuevo más tarde.");
      setLoading(false);
      return;
    }

    let userLikes: { contenido_id: string }[] = [];
    if (user) {
      const { data: likesData, error: likesError } = await supabase
        .from("user_likes_contenido") // New table for user likes
        .select("contenido_id")
        .eq("user_id", user.id);

      if (likesError) {
        console.error("Error al cargar likes del usuario:", likesError);
      } else {
        userLikes = likesData || [];
      }
    }

    const formattedData: ContenidoExclusivoItem[] = contentData.map((item: any) => ({
      ...item,
      // user_has_liked is true if we find this contenido_id in the user's likes
      user_has_liked: userLikes.some((like) => like.contenido_id === item.id),
    }));

    setContenidoExclusivo(formattedData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchContenidoExclusivo();
  }, [user]); // Dependency on 'user' to reload when user changes

  // --- Funciones para manejar likes ---
  const handleLike = async (contenidoId: string, hasLiked: boolean) => {
    if (!user) {
      alert("Debes iniciar sesión para dar 'Me gusta'.");
      router.push("/login"); // Or your login page path
      return;
    }

    // Optimistic UI update
    setContenidoExclusivo((prev) =>
      prev.map((item) =>
        item.id === contenidoId
          ? {
              ...item,
              user_has_liked: !hasLiked,
              likes_count: hasLiked ? item.likes_count - 1 : item.likes_count + 1,
            }
          : item
      )
    );

    let error: any = null;

    if (hasLiked) {
      // Remove like: Delete from user_likes_contenido
      const { error: deleteError } = await supabase
        .from("user_likes_contenido")
        .delete()
        .eq("contenido_id", contenidoId)
        .eq("user_id", user.id);
      error = deleteError;
    } else {
      // Give like: Insert into user_likes_contenido
      const { error: insertError } = await supabase
        .from("user_likes_contenido")
        .insert({ contenido_id: contenidoId, user_id: user.id });
      error = insertError;
    }

    if (error) {
      console.error("Error al gestionar like/unlike:", error);
      alert("Error al procesar tu 'Me gusta'. Inténtalo de nuevo.");
      // Revert optimistic update on error
      setContenidoExclusivo((prev) =>
        prev.map((item) =>
          item.id === contenidoId
            ? {
                ...item,
                user_has_liked: hasLiked,
                likes_count: hasLiked ? item.likes_count + 1 : item.likes_count - 1,
              }
            : item
        )
      );
    }
    // Triggers in Supabase will handle updating likes_count in contenido_exclusivo
  };

  // --- Functions for the modal ---
  const openModal = (item: ContenidoExclusivoItem) => {
    setSelectedContent(item);
    setIsClosingModal(false);
    setShowModal(true);
    document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
  };

  const closeModal = () => {
    setIsClosingModal(true);
    document.body.style.overflow = "auto"; // Re-enable scrolling
    setTimeout(() => {
      setShowModal(false);
      setSelectedContent(null);
      setIsClosingModal(false);
    }, 300); // Match this duration with your fade-out animation
  };

  // --- Auth functions (copied from obras.tsx) ---
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
      router.push("/"); // Redirect to home or login page after logout
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
      setAuthMessage("¡Sesión iniciada con éxito! Recargando contenido...");
      setLoginEmail("");
      setLoginPassword("");
      // No explicit push to /obras here, as the useEffect tied to `user` will refetch content
    }
    setAuthLoading(false);
  };

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

  // Effect to close menu on outside click
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

  return (
    <>
      <Head>
        <title>Contenido Exclusivo | AURA</title>
      </Head>

      {/* NAVBAR (Updated with user status and auth forms) */}
      <nav className="fixed top-0 z-50 w-full bg-gray-900 border-b-2 border-purple-800 shadow-lg">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <div
              className="flex items-center space-x-4 cursor-pointer"
              onClick={handleLogoClick}
            >
              <div
                className={`relative w-16 h-16 transition-transform duration-700 ease-in-out ${
                  animatingLogo ? "rotate-[360deg]" : ""
                }`}
              >
                <Image
                  src="/AURA.png"
                  alt="Logo AURA"
                  fill
                  style={{ objectFit: "cover" }}
                  className="shadow-lg rounded-xl"
                  sizes="(max-width: 768px) 64px, 80px"
                />
              </div>
              <span className="text-3xl font-extrabold tracking-widest text-purple-400">
                AURA
              </span>
            </div>

            <div className="items-center hidden space-x-8 text-xl font-semibold text-gray-300 md:flex">
              <Link
                href="/"
                className="transition hover:text-purple-400 hover:scale-105"
              >
                Inicio
              </Link>
              <Link
                href="/carpanta"
                className="transition hover:text-purple-400 hover:scale-105"
              >
                Carpanta
              </Link>
              <Link
                href="/contenido"
                className="font-bold text-purple-400 underline"
              >
                Contenido Exclusivo
              </Link>
              <Link
                href="/obras"
                className="transition hover:text-purple-400 hover:scale-105"
              >
                Obras
              </Link>

              {/* Desktop Auth Menu (same as obras.tsx) */}
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
                        {/* Buttons to show login/register forms */}
                        <button
                          onClick={() => {
                            setShowAuthForm(
                              showAuthForm === "login" ? null : "login"
                            );
                            setAuthMessage("");
                          }}
                          className="flex items-center w-full px-4 py-3 mb-2 text-base font-semibold text-left text-white transition-colors duration-200 bg-green-600 rounded-md hover:bg-green-700"
                        >
                          <LogIn className="w-5 h-5 mr-3" /> Iniciar Sesión
                        </button>
                        <button
                          onClick={() => {
                            setShowAuthForm(
                              showAuthForm === "register" ? null : "register"
                            );
                            setAuthMessage("");
                          }}
                          className="flex items-center w-full px-4 py-3 mb-3 text-base font-semibold text-left text-white transition-colors duration-200 bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          <UserPlus className="w-5 h-5 mr-3" /> Registrarse
                        </button>

                        {/* Small forms (conditional) */}
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
                                  onClick={() =>
                                    setShowLoginPassword(!showLoginPassword)
                                  }
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
                                  onChange={(e) =>
                                    setRegisterPassword(e.target.value)
                                  }
                                  required
                                />
                                <button
                                  type="button"
                                  className="absolute text-purple-400 right-2 top-2"
                                  onClick={() =>
                                    setShowRegisterPassword(!showRegisterPassword)
                                  }
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
                              authMessage.includes("éxito") ||
                              authMessage.includes("Revisa tu email")
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

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-300 transition-transform duration-300 ease-in-out transform hover:text-purple-400 focus:outline-none hover:rotate-90"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      mobileMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="px-6 py-4 space-y-4 text-lg bg-gray-900 border-t border-purple-800 md:hidden animate-slide-down">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-300 rounded-md hover:text-purple-400 hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/carpanta"
              className="block px-3 py-2 text-gray-300 rounded-md hover:text-purple-400 hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Carpanta
            </Link>
            <Link
              href="/contenido"
              className="block px-3 py-2 font-bold text-purple-400 underline bg-gray-800 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contenido Exclusivo
            </Link>
            <Link
              href="/obras"
              className="block px-3 py-2 text-gray-300 rounded-md hover:text-purple-400 hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Obras
            </Link>
            {/* Mobile Auth options */}
            {user ? (
              <>
                <Link href="/index" className="block">
                    <button className="flex items-center w-full px-4 py-3 mb-2 text-base font-semibold text-left text-white transition-colors duration-200 bg-purple-600 rounded-md hover:bg-purple-700">
                      <UserPlus className="w-5 h-5 mr-3" /> Subir Obra
                    </button>
                  </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-gray-300 rounded-md hover:text-purple-400 hover:bg-gray-800"
                >
                  <LogOut className="w-5 h-5 mr-2" /> Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowAuthForm(showAuthForm === "login" ? null : "login");
                    setMobileMenuOpen(false); // Close main mobile menu
                  }}
                  className="flex items-center w-full px-3 py-2 text-gray-300 rounded-md hover:text-purple-400 hover:bg-gray-800"
                >
                  <LogIn className="w-5 h-5 mr-2" /> Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setShowAuthForm(showAuthForm === "register" ? null : "register");
                    setMobileMenuOpen(false); // Close main mobile menu
                  }}
                  className="flex items-center w-full px-3 py-2 text-gray-300 rounded-md hover:text-purple-400 hover:bg-gray-800"
                >
                  <UserPlus className="w-5 h-5 mr-2" /> Registrarse
                </button>
              </>
            )}
            {/* Mobile auth forms will be rendered directly below if showAuthForm is not null */}
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
                        onClick={() =>
                          setShowLoginPassword(!showLoginPassword)
                        }
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
                        onChange={(e) =>
                          setRegisterPassword(e.target.value)
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute text-purple-400 right-2 top-2"
                        onClick={() =>
                          setShowRegisterPassword(!showRegisterPassword)
                        }
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
                    authMessage.includes("éxito") ||
                    authMessage.includes("Revisa tu email")
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {authMessage}
                </p>
              )}
          </div>
        )}
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <section className="min-h-screen px-6 pt-32 pb-20 text-white bg-gradient-to-b from-black via-gray-900 to-purple-950 md:px-16">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="mb-6 text-5xl font-extrabold text-purple-400 drop-shadow-xl">
            Contenido Exclusivo
          </h1>
          <p className="max-w-2xl mx-auto mb-12 text-lg text-gray-300">
            Aquí encontrarás inspiración, ideas, obras únicas y secretos que no
            se revelan en ninguna otra parte de AURA. Este espacio es para ti.
          </p>

          {loading && (
            <p className="text-xl text-purple-300">Cargando contenido...</p>
          )}

          {error && <p className="text-xl text-red-400">{error}</p>}

          {!loading && !error && contenidoExclusivo.length === 0 && (
            <p className="text-xl italic text-gray-400">
              Aún no hay contenido exclusivo disponible. ¡Vuelve pronto!
            </p>
          )}

          {!loading && !error && contenidoExclusivo.length > 0 && (
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {contenidoExclusivo.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center p-6 text-center transition-all duration-300 bg-gray-900 border border-purple-600 shadow-xl rounded-xl hover:scale-105"
                >
                  <h2 className="mb-2 text-2xl font-bold text-purple-300">
                    {item.titulo}
                  </h2>
                  <p className="flex-grow mb-4 text-gray-400">
                    {item.descripcion}
                  </p>
                  {item.url_archivo && (
                    <div className="w-full mt-4">
                      {item.tipo === "imagen" && (
                        <div
                          className="relative w-full h-48 mb-2 overflow-hidden rounded-lg cursor-pointer group"
                          onClick={() => openModal(item)}
                        >
                          <Image
                            src={item.url_archivo}
                            alt={item.titulo}
                            fill
                            style={{ objectFit: "contain" }}
                            className="border border-gray-700 rounded-lg"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-xl text-white transition-opacity duration-300 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100">
                            Ver
                          </div>
                        </div>
                      )}
                      {(item.tipo === "video" ||
                        item.url_archivo.match(/\.(mp4|webm|ogg)$/i)) && (
                        <div
                          className="relative w-full h-48 mb-2 overflow-hidden rounded-lg cursor-pointer group"
                          onClick={() => openModal(item)}
                        >
                          <video
                            className="object-contain w-full h-full border border-gray-700 rounded-lg shadow-md"
                            src={item.url_archivo}
                            preload="metadata" // Carga solo metadatos para vista previa
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-xl text-white transition-opacity duration-300 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100">
                            Ver Video
                          </div>
                        </div>
                      )}
                      {item.tipo === "documento" && (
                        <a
                          href={item.url_archivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                          </svg>
                          Ver Documento
                        </a>
                      )}
                      {item.tipo === undefined &&
                        !item.url_archivo.match(/\.(mp4|webm|ogg)$/i) && (
                          <div
                            className="relative w-full h-48 mb-2 overflow-hidden rounded-lg cursor-pointer group"
                            onClick={() => openModal(item)}
                          >
                            <Image
                              src={item.url_archivo}
                              alt={item.titulo}
                              fill
                              style={{ objectFit: "contain" }}
                              className="border border-gray-700 rounded-lg"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xl text-white transition-opacity duration-300 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100">
                              Ver
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                  <p className="mt-4 text-xs italic text-gray-500">
                    Subido el: {new Date(item.created_at).toLocaleDateString()}
                  </p>

                  {/* --- Sección de Likes --- */}
                  <div className="flex items-center justify-center mt-4">
                    <button
                      onClick={() =>
                        handleLike(item.id, item.user_has_liked || false)
                      }
                      className={`flex items-center px-4 py-2 text-white rounded-full transition-all duration-300 ease-in-out ${
                        item.user_has_liked
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-gray-700 hover:bg-gray-600"
                      } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
                      disabled={!user} // Disable if no user is logged in
                    >
                      <Heart
                        className={`h-6 w-6 mr-2 ${
                          item.user_has_liked ? "fill-current text-white" : "text-gray-300"
                        }`}
                      />
                      <span>{item.likes_count}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- MODAL PARA VISUALIZAR CONTENIDO --- */}
      {showModal && selectedContent && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
            isClosingModal ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeModal}
        >
          {/* Contenido del modal */}
          <div
            className={`relative z-10 p-6 bg-gray-900 border border-purple-700 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto transform transition-all duration-300 ease-out ${
              isClosingModal
                ? "scale-90 opacity-0"
                : "scale-100 opacity-100 animate-zoom-in"
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <button
              onClick={closeModal}
              className="absolute text-3xl font-bold text-gray-400 transition-transform duration-200 transform top-3 right-3 hover:text-white hover:scale-110"
              aria-label="Cerrar"
            >
              &times;
            </button>

            <h2 className="mb-4 text-3xl font-bold text-center text-purple-400">
              {selectedContent.titulo}
            </h2>
            <p className="mb-6 text-center text-gray-300">
              {selectedContent.descripcion}
            </p>

            {/* Visualización del archivo en el modal */}
            <div className="flex justify-center items-center max-h-[60vh]">
              {selectedContent.tipo === "imagen" && (
                <div className="relative w-full h-[50vh]">
                  <Image
                    src={selectedContent.url_archivo}
                    alt={selectedContent.titulo}
                    fill
                    style={{ objectFit: "contain" }}
                    className="rounded-lg"
                  />
                </div>
              )}
              {(selectedContent.tipo === "video" ||
                selectedContent.url_archivo.match(/\.(mp4|webm|ogg)$/i)) && (
                <video
                  controls
                  autoPlay // AutoPlay when modal opens
                  className="w-full h-auto max-h-[60vh] rounded-lg"
                  src={selectedContent.url_archivo}
                >
                  Tu navegador no soporta el elemento de video.
                </video>
              )}
              {selectedContent.tipo === "documento" && (
                <iframe
                  src={selectedContent.url_archivo}
                  className="w-full h-[60vh] rounded-lg border-none"
                  title="Documento Exclusivo"
                >
                  Este navegador no soporta iframes para documentos.{" "}
                  <a
                    href={selectedContent.url_archivo}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Descarga el documento aquí.
                  </a>
                </iframe>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- Fin Modal --- */}

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes rotate-360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-zoom-in { animation: zoom-in 0.3s ease-out forwards; }
        .animate-slide-down { animation: slide-down 0.3s ease-out forwards; }
        .rotate-\\[360deg\\] { transform: rotate(360deg); } /* for animatingLogo */
      `}</style>
    </>
  );
}