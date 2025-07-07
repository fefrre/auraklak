// index.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react"; // Importa los íconos de lucide-react

export default function HomePage() {
  const router = useRouter();

  // Estados para formulario de obra
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [contacto, setContacto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Estados para menú móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados para modal de login/registro
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false); // Nuevo estado para visibilidad de contraseña en el modal

  // Manejar envío de obra
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setShowSuccessModal(false);
    setIsSubmitting(true);

    if (!archivo) {
      setMensaje("Por favor selecciona un archivo.");
      setIsSubmitting(false);
      return;
    }

    if (!titulo.trim()) {
      setMensaje("Por favor ingresa un título para tu obra.");
      setIsSubmitting(false);
      return;
    }

    if (!isAnonymous) {
      if (!autor.trim()) {
        setMensaje("Por favor ingresa el nombre del autor de la obra.");
        setIsSubmitting(false);
        return;
      }
      if (!contacto.trim()) {
        setMensaje("Por favor ingresa tu información de contacto.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const nombreArchivo = `${Date.now()}_${archivo.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("obras-archivos")
        .upload(nombreArchivo, archivo);

      if (uploadError) {
        setMensaje("Error al subir el archivo: " + uploadError.message);
        setIsSubmitting(false);
        return;
      }

      const urlArchivo = supabase.storage
        .from("obras-archivos")
        .getPublicUrl(nombreArchivo).data.publicUrl;

      const submissionData = {
        titulo: titulo,
        autor: isAnonymous ? "Anónimo" : autor,
        descripcion,
        url_archivo: urlArchivo,
        contacto: isAnonymous ? "Anónimo" : contacto,
        aprobada: false,
      };

      const { error: dbError } = await supabase
        .from("obras")
        .insert(submissionData);

      if (dbError) {
        setMensaje("Error al guardar en la base de datos: " + dbError.message);
      } else {
        setMensaje("¡Obra enviada con éxito!");
        setTitulo("");
        setAutor("");
        setDescripcion("");
        setContacto("");
        setArchivo(null);
        setIsAnonymous(false);
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      setMensaje("Ocurrió un error inesperado: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const handleViewWorks = () => {
    router.push("/obras");
  };

  // Funciones de autenticación con Supabase
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setShowAuthModal(false);
          router.reload();
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
        } else {
          alert("Registro exitoso, revisa tu correo para confirmar.");
          setShowAuthModal(false);
        }
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthError("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthMode(authMode === "login" ? "register" : "login");
  };

  return (
    <main className="flex flex-col items-center min-h-screen pt-32 text-gray-100 bg-gray-950">
      {/* NAVBAR */}
      <nav className="fixed top-0 z-50 w-full bg-gray-900 border-b-2 border-purple-800 shadow-lg">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center space-x-4">
              <Image
                src="/AURA.png"
                alt="Logo AURA"
                width={64}
                height={64}
                className="transition-transform duration-500 ease-in-out shadow-lg rounded-xl hover:scale-110 hover:rotate-3"
              />
              <span className="text-3xl font-extrabold tracking-widest text-purple-400">
                AURA
              </span>
            </div>

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

            {/* Desktop Menu */}
            <div className="items-center hidden space-x-8 text-xl font-semibold text-gray-300 md:flex">
              <Link
                href="/carpanta"
                className="transition transform hover:text-purple-400 hover:scale-105"
              >
                Carpanta
              </Link>
              <Link
                href="/contenido"
                className="transition transform hover:text-purple-400 hover:scale-105"
              >
                Contenido Exclusivo
              </Link>
              <div className="relative group">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="transition transform cursor-pointer hover:text-purple-400 hover:scale-105"
                >
                  Cuenta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="px-6 py-4 space-y-4 text-lg bg-gray-900 border-t border-purple-800 md:hidden animate-slide-down">
            <Link
              href="/carpanta"
              className="block px-3 py-2 text-gray-300 transition-all duration-200 rounded-md hover:text-purple-400 hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Carpanta
            </Link>
            <Link
              href="/contenido"
              className="block px-3 py-2 text-gray-300 transition-all duration-200 rounded-md hover:text-purple-400 hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contenido Exclusivo
            </Link>

            <button
              onClick={() => {
                setAuthMode("login");
                setShowAuthModal(true);
                setMobileMenuOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-gray-300 transition-all duration-200 rounded-md hover:text-purple-400 hover:bg-gray-800"
            >
              Iniciar Sesión / Registrarse
            </button>
            <Link
              href="/obras"
              className="block px-3 py-2 text-gray-300 transition-all duration-200 rounded-md hover:text-purple-400 hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Visualizar Obras
            </Link>
            <Link
              href="/admin-login"
              className="block px-3 py-2 text-gray-300 transition-all duration-200 rounded-md hover:text-purple-400 hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Administrador?
            </Link>
          </div>
        )}
      </nav>

      <div className="flex flex-col items-center justify-center w-full py-16 shadow-lg bg-gradient-to-b from-black via-gray-900 to-purple-950">
        <div className="relative w-48 h-48 md:w-72 md:h-72 lg:w-96 lg:h-96">
          <Image
            src="/AURA.png"
            alt="Logo de Arte Local"
            fill
            style={{ objectFit: "cover" }}
            priority
            sizes="(max-width: 768px) 12rem, (max-width: 1024px) 18rem, 24rem"
          />
        </div>
        <h1 className="mt-8 text-6xl font-extrabold tracking-wider text-center text-white drop-shadow-lg">
          AURA
        </h1>
      </div>

      {/* Formulario de compartir obra */}
      <section className="w-full max-w-3xl p-10 mx-4 mt-8 mb-12 bg-gray-900 border border-gray-700 shadow-xl rounded-2xl animate-fade-in">
        <h2 className="mb-8 text-4xl font-semibold text-center text-purple-400 drop-shadow-md">
          Comparte tu Obra
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Switch de anonimato estilo iOS */}
          <div className="flex items-center justify-between mb-6">
            <label
              htmlFor="anonymousSwitch"
              className="text-xl font-medium text-purple-300"
            >
              Compartir de forma anónima
            </label>
            <div
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                isAnonymous ? "bg-green-500" : "bg-gray-600"
              }`}
              onClick={() => setIsAnonymous(!isAnonymous)}
            >
              <input
                type="checkbox"
                id="anonymousSwitch"
                className="absolute w-full h-full opacity-0 cursor-pointer"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(!isAnonymous)}
              />
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-gray-100 rounded-full shadow-md transform transition-transform duration-200 ${
                  isAnonymous ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="titulo"
              className="block mb-2 text-xl font-medium text-purple-300"
              style={{ fontStyle: "oblique" }}
            >
              Título:
            </label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full p-4 text-gray-100 placeholder-gray-500 transition-all duration-300 bg-gray-800 border border-purple-600 rounded-lg shadow-inner focus:ring-purple-500 focus:border-purple-500"
              style={{ fontStyle: "oblique" }}
              required
              placeholder="Título de tu obra"
            />
          </div>

          {/* Nuevo campo de Autor */}
          <div>
            <label
              htmlFor="autor"
              className="block mb-2 text-xl font-medium text-purple-300"
              style={{ fontStyle: "oblique" }}
            >
              Autor:
            </label>
            <input
              type="text"
              id="autor"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              className={`w-full p-4 border ${
                isAnonymous
                  ? "border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "border-purple-600 bg-gray-800 text-gray-100 focus:ring-purple-500 focus:border-purple-500"
              } rounded-lg shadow-inner placeholder-gray-500 transition-all duration-300`}
              style={{ fontStyle: "oblique" }}
              required={!isAnonymous}
              disabled={isAnonymous}
              placeholder={
                isAnonymous ? "Autor anónimo" : "Tu nombre o seudónimo"
              }
            />
          </div>

          <div>
            <label
              htmlFor="descripcion"
              className="block mb-2 text-xl font-medium text-purple-300"
            >
              Descripción:
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              className="w-full p-4 text-gray-100 placeholder-gray-500 transition-all duration-300 bg-gray-800 border border-purple-600 rounded-lg shadow-inner focus:ring-purple-500 focus:border-purple-500"
              style={{ fontStyle: "oblique" }}
              required
            ></textarea>
          </div>

          <div>
            <label
              htmlFor="contacto"
              className="block mb-2 text-xl font-medium text-purple-300"
            >
              Contacto:
            </label>
            <input
              type="text"
              id="contacto"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className={`w-full p-4 border ${
                isAnonymous
                  ? "border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "border-purple-600 bg-gray-800 text-gray-100 focus:ring-purple-500 focus:border-purple-500"
              } rounded-lg shadow-inner placeholder-gray-500 transition-all duration-300`}
              style={{ fontStyle: "oblique" }}
              required={!isAnonymous}
              disabled={isAnonymous}
              placeholder={
                isAnonymous
                  ? "Contacto no visible"
                  : "Usa tu '@'de Instagram."
              }
            />
          </div>

          <div>
            <label
              htmlFor="archivo"
              className="block mb-2 text-xl font-medium text-purple-300"
            >
              Archivo:
            </label>
            <input
              type="file"
              id="archivo"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="block w-full p-3 text-gray-100 transition-all duration-300 bg-gray-800 border border-purple-600 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-700 file:text-white hover:file:bg-purple-800"
              accept="image/*,video/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed"
              required
            />
          </div>

          <div className="flex flex-col items-center gap-4 mt-6">
            <button
              type="submit"
              className="px-8 py-4 text-xl font-bold text-white transition-all duration-300 bg-purple-700 rounded-lg shadow-lg hover:bg-purple-800 hover:shadow-purple-glow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Subiendo..." : "Enviar a revision?"}
            </button>

            <Link href="/obras">
              <button className="px-8 py-4 text-xl font-bold text-white transition-all duration-300 bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-glow-md">
                Visualizar Obras
              </button>
            </Link>

            <Link href="/admin-login">
              <button className="px-8 py-4 text-xl font-bold text-gray-200 transition-all duration-300 bg-gray-700 rounded-lg shadow-md hover:bg-gray-800 hover:shadow-lg">
                ¿Eres Administrador?
              </button>
            </Link>
          </div>
        </form>

        {mensaje && !showSuccessModal && (
          <p className="mt-4 text-lg text-center text-red-400 animate-pulse">
            {mensaje}
          </p>
        )}
      </section>

      {/* Modal éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="w-full max-w-md p-8 text-center border border-purple-600 rounded-lg shadow-2xl bg-gradient-to-br from-purple-800 to-gray-900 animate-pop-in">
            <h3 className="mb-4 text-4xl font-extrabold text-white animate-bounce-text">
              ¡Obra Enviada a Revision con Éxito! 🎉
            </h3>
            <p className="mb-6 text-xl text-purple-100">
              Tu obra ha sido llevada a revision a los administradores AURA.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleViewWorks}
                className="w-full px-6 py-3 text-lg font-bold text-white transition-all duration-300 bg-green-500 rounded-lg shadow-md hover:bg-green-600 hover:shadow-xl"
              >
                Visualizar Obras
              </button>
              <button
                onClick={handleCloseModal}
                className="w-full px-6 py-3 text-lg font-bold text-white transition-all duration-300 bg-gray-600 rounded-lg shadow-md hover:bg-gray-700"
              >
                Enviar Otra Obra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal autenticación */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="w-full max-w-md p-8 bg-gray-900 border border-purple-600 rounded-lg shadow-2xl">
            <h2 className="mb-6 text-3xl font-extrabold text-center text-purple-400">
              {authMode === "login" ? "Iniciar Sesión" : "Registrarse"}
            </h2>
            <form onSubmit={handleAuthSubmit} className="space-y-6">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="w-full p-3 text-gray-100 bg-gray-800 border border-purple-600 rounded focus:ring-purple-500 focus:border-purple-500"
              />
              <div className="relative">
                {" "}
                {/* Contenedor relative para el ícono */}
                <input
                  type={showModalPassword ? "text" : "password"} // Tipo dinámico
                  placeholder="Contraseña"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="w-full p-3 pr-10 text-gray-100 bg-gray-800 border border-purple-600 rounded focus:ring-purple-500 focus:border-purple-500" // Añade padding a la derecha
                />
                <button
                  type="button"
                  onClick={() => setShowModalPassword(!showModalPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-purple-400"
                  aria-label={
                    showModalPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showModalPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {authError && (
                <p className="text-center text-red-500">{authError}</p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 font-bold text-white transition bg-purple-700 rounded hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading
                  ? authMode === "login"
                    ? "Iniciando..."
                    : "Registrando..."
                  : authMode === "login"
                  ? "Iniciar Sesión"
                  : "Registrarse"}
              </button>
            </form>

            {authMode === "login" && (
              <p className="mt-4 text-center text-gray-400">
                <Link
                  href="/forgot-password"
                  className="font-semibold text-purple-400 underline hover:text-purple-300"
                  onClick={() => setShowAuthModal(false)}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
            )}

            <p className="mt-4 text-center text-gray-400">
              {authMode === "login"
                ? "¿No tienes cuenta? "
                : "¿Ya tienes cuenta? "}
              <button
                onClick={toggleAuthMode}
                className="font-semibold text-purple-400 underline hover:text-purple-300"
              >
                {authMode === "login"
                  ? "Regístrate aquí"
                  : "Inicia sesión aquí"}
              </button>
            </p>

            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full py-2 mt-6 font-semibold text-white bg-gray-700 rounded hover:bg-gray-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
