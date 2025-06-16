// pages/index.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/router"; // Importar useRouter para la navegación programática

export default function HomePage() {
  const router = useRouter(); // Inicializar el router

  const [titulo, setTitulo] = useState("");
  const [contacto, setContacto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Nuevo estado para el modal de éxito
  const [isSubmitting, setIsSubmitting] = useState(false); // Para deshabilitar el botón durante el envío
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(""); // Limpiar mensajes anteriores
    setShowSuccessModal(false); // Asegurarse de que el modal esté oculto al inicio del envío
    setIsSubmitting(true); // Deshabilitar el botón

    if (!archivo) {
      setMensaje("Por favor selecciona un archivo.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Subir archivo a Supabase Storage
      const nombreArchivo = `${Date.now()}_${archivo.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("obras-archivos")
        .upload(nombreArchivo, archivo);

      if (uploadError) {
        console.error("Error al subir el archivo:", uploadError);
        setMensaje("Error al subir el archivo: " + uploadError.message);
        return;
      }

      // 2. Obtener la URL pública del archivo
      const urlArchivo = supabase.storage
        .from("obras-archivos")
        .getPublicUrl(nombreArchivo).data.publicUrl;

      // 3. Insertar en la base de datos
      const { error: dbError } = await supabase.from("obras").insert({
        titulo,
        descripcion,
        url_archivo: urlArchivo,
        contacto, // Incluir el contacto en la inserción
      });

      if (dbError) {
        console.error("Error al guardar en la base de datos:", dbError);
        setMensaje("Error al guardar en la base de datos: " + dbError.message);
      } else {
        setMensaje("¡Obra enviada con éxito!");
        setTitulo("");
        setDescripcion("");
        setContacto("");
        setArchivo(null);
        setShowSuccessModal(true); // Mostrar el modal de éxito
      }
    } catch (error: any) {
      console.error("Error inesperado:", error);
      setMensaje("Ocurrió un error inesperado: " + error.message);
    } finally {
      setIsSubmitting(false); // Volver a habilitar el botón
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const handleViewWorks = () => {
    router.push("/obras"); // Redirige a la página de obras
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-950 text-gray-100 pt-32">
      {/* NAVBAR AMPLIADA Y RESPONSIVA */}
      <nav className="w-full bg-gray-900 fixed top-0 z-50 border-b-2 border-purple-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo y Nombre */}
            <div className="flex items-center space-x-4">
              <Image
                src="/AURA.png"
                alt="Logo AURA"
                width={64}
                height={64}
                  className="rounded-xl shadow-lg transition-transform duration-500 ease-in-out hover:scale-110 hover:rotate-3"

              />
              <span className="text-purple-400 font-extrabold text-3xl tracking-widest">
                AURA
              </span>
            </div>
            {/* Menú hamburguesa (solo móvil) */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-300 hover:text-purple-400 focus:outline-none"
              >
                <svg
                  className="h-8 w-8"
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
            {/* Menú desktop */}
            <div className="hidden md:flex space-x-10 text-xl font-semibold text-gray-300">
             
              <Link
                href="/carpanta"
                className="hover:text-purple-400 transition"
              >
                Carpanta
              </Link>
              <Link
                href="/blacksirena"
                className="hover:text-purple-400 transition"
              >
                Blacksirena
              </Link>
             
            </div>{" "}
          </div>
        </div>

        {/* Menú mobile desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-purple-800 px-6 pb-4 text-lg">
           
            <Link
              href="/carpanta"
              className="block py-3 text-gray-300 hover:text-purple-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Carpanta
            </Link>
            <Link
              href="/blacksirena"
              className="block py-3 text-gray-300 hover:text-purple-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blacksirena
            </Link>
           
          </div>
        )}
      </nav>

      <div className="w-full flex flex-col items-center justify-center py-16 bg-gradient-to-b from-black via-gray-900 to-purple-950 shadow-lg">
        <div className="relative w-48 h-48 md:w-72 md:h-72 lg:w-96 lg:h-96">
          <Image
            src="/AURA.png" // Make sure this path is correct for your image
            alt="Logo de Arte Local"
            fill
            style={{ objectFit: "cover" }}
            priority
            sizes="(max-width: 768px) 12rem, (max-width: 1024px) 18rem, 24rem"
          />
        </div>
        <h1 className="mt-8 text-6xl font-extrabold text-white text-center drop-shadow-lg tracking-wider">
          AURA
        </h1>
      </div>

      {/* Formulario */}
      <section className="w-full max-w-3xl bg-gray-900 p-10 rounded-2xl shadow-xl border border-gray-700 mt-8 mb-12 mx-4 animate-fade-in">
        <h2 className="text-4xl font-semibold text-purple-400 text-center mb-8 drop-shadow-md">
          Comparte tu Obra
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="titulo"
              className="block text-xl font-medium text-purple-300 mb-2"
              style={{ fontStyle: "oblique" }}
            >
              Título:
            </label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full p-4 border border-purple-600 rounded-lg shadow-inner bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              style={{ fontStyle: "oblique" }}
              required
            />
          </div>

          <div>
            <label
              htmlFor="descripcion"
              className="block text-xl font-medium text-purple-300 mb-2"
            >
              Descripción:
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              className="w-full p-4 border border-purple-600 rounded-lg shadow-inner bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              style={{ fontStyle: "oblique" }}
              required
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="contacto"
              className="block text-xl font-medium text-purple-300 mb-2"
            >
              Contacto:
            </label>
            <input
              type="text"
              id="contacto"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className="w-full p-4 border border-purple-600 rounded-lg shadow-inner bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              style={{ fontStyle: "oblique" }}
              required
            />
          </div>
          <div>
            <label
              htmlFor="archivo"
              className="block text-xl font-medium text-purple-300 mb-2"
            >
              Archivo :
            </label>
            <input
              type="file"
              id="archivo"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="block w-full p-3 border border-purple-600 rounded-lg bg-gray-800 text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-700 file:text-white hover:file:bg-purple-800 transition-all duration-300"
              accept="image/*,video/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed"
            />
          </div>
          <div className="flex flex-col items-center gap-4 mt-6">
            <button
              type="submit"
              className="px-8 py-4 bg-purple-700 text-white font-bold text-xl rounded-lg hover:bg-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-glow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting} // Deshabilita el botón durante el envío
            >
              {isSubmitting ? "Subiendo..." : "Subir obra?"}
            </button>

            {/* Nuevo botón para visualizar obras */}
            <Link href="/obras">
              <button className="px-8 py-4 bg-blue-600 text-white font-bold text-xl rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-glow-md">
                Visualizar Obras
              </button>
            </Link>

            <Link href="/admin-login">
              <button className="px-8 py-4 bg-gray-700 text-gray-200 font-bold text-xl rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg">
                ¿Eres Administrador?
              </button>
            </Link>
          </div>
        </form>

        {mensaje &&
          !showSuccessModal && ( // Muestra el mensaje normal si no es un éxito o si el modal no se muestra
            <p className="mt-4 text-center text-lg text-red-400 animate-pulse">
              {mensaje}
            </p>
          )}
      </section>

      {/* Modal de éxito más llamativo */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-800 to-gray-900 border border-purple-600 rounded-lg shadow-2xl p-8 text-center max-w-md w-full animate-pop-in">
            <h3 className="text-4xl font-extrabold text-white mb-4 animate-bounce-text">
              ¡Obra Enviada con Éxito! 🎉
            </h3>
            <p className="text-xl text-purple-100 mb-6">
              Tu obra ha sido compartida en AURA.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleViewWorks}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold text-lg rounded-lg hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-xl"
              >
                Visualizar Obras
              </button>
              <button
                onClick={handleCloseModal}
                className="w-full px-6 py-3 bg-gray-600 text-white font-bold text-lg rounded-lg hover:bg-gray-700 transition-all duration-300 shadow-md"
              >
                Enviar Otra Obra
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
