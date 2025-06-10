// pages/admin-dashboard.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

type Obra = {
  id: number;
  titulo: string;
  descripcion: string;
  url_archivo: string;
  contacto: string;
  fecha: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [obras, setObras] = useState<Obra[]>([]);
  const [scrollUp, setScrollUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Efecto para verificar el estado de la sesión al cargar la página
  useEffect(() => {
    if (typeof window !== "undefined") {
      // *** CAMBIO CLAVE AQUÍ: Usamos sessionStorage en lugar de localStorage ***
      const storedLoggedIn = sessionStorage.getItem("adminLoggedIn");
      const storedUser = sessionStorage.getItem("adminUser");
      if (storedLoggedIn === "true" && storedUser) {
        setLoggedIn(true);
        setUsuario(storedUser);
      } else {
        // Si no está logueado, redirige a la página de login
        router.replace("/admin-login");
      }
    }
  }, [router]);

  const cargarObras = async () => {
    const { data, error } = await supabase
      .from("obras")
      .select("id, titulo, descripcion, url_archivo, contacto, fecha")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error al cargar obras:", error);
      return;
    }
    setObras(data || []);
  };

  const eliminarObra = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta obra? Esta acción es irreversible.")) {
      return;
    }

    const { data: selectData, error: selectError } = await supabase
      .from("obras")
      .select("url_archivo")
      .eq("id", id)
      .single();

    if (selectError) {
      console.error("Error al obtener la URL del archivo de la DB:", selectError);
      alert("Error al intentar eliminar la obra (no se encontró el archivo en la DB).");
      return;
    }

    if (selectData && selectData.url_archivo) {
      console.log("URL completa del archivo obtenida de la DB:", selectData.url_archivo);
      const urlParts = selectData.url_archivo.split("/");
      const encodedFileName = urlParts[urlParts.length - 1];
      const filePath = decodeURIComponent(encodedFileName);

      console.log("Nombre del archivo (filePath) extraído para borrar (decodificado):", filePath);

      if (filePath) {
        const { error: deleteStorageError } = await supabase.storage
          .from("obras-archivos")
          .remove([filePath]);

        if (deleteStorageError) {
          console.error("Error al eliminar el archivo del storage:", deleteStorageError);
          alert("Error al eliminar el archivo del storage: " + deleteStorageError.message);
        } else {
          console.log("Archivo borrado del storage exitosamente:", filePath);
        }
      } else {
        console.warn("No se pudo extraer el nombre del archivo de la URL:", selectData.url_archivo);
        alert("Advertencia: No se pudo identificar el archivo para borrar del storage.");
      }
    } else {
      console.warn("No se encontró 'url_archivo' para la obra con ID:", id);
      alert("Advertencia: No se encontró la URL del archivo en la base de datos.");
    }

    const { error: deleteDbError } = await supabase
      .from("obras")
      .delete()
      .eq("id", id);

    if (deleteDbError) {
      console.error("Error al eliminar de la base de datos:", deleteDbError);
      alert("Error al eliminar la obra de la base de datos: " + deleteDbError.message);
    } else {
      cargarObras();
      console.log("Obra eliminada de la base de datos y UI actualizada.");
      alert("Obra eliminada con éxito.");
    }
  };

  const handleLogout = () => {
    // *** CAMBIO CLAVE AQUÍ: Usamos sessionStorage.removeItem ***
    sessionStorage.removeItem("adminLoggedIn");
    sessionStorage.removeItem("adminUser");
    setLoggedIn(false);
    setUsuario("");
    router.push("/admin-login");
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrollUp(currentY < lastScrollY || currentY < 10);
      setLastScrollY(currentY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (loggedIn) {
      cargarObras();
    }
  }, [loggedIn]);

  if (!loggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
          scrollUp ? "translate-y-0" : "-translate-y-full"
        } bg-gray-900 shadow-lg border-b border-purple-800`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-400">Panel Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-white font-medium text-lg">Bienvenido, {usuario}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-base rounded-md transition font-semibold shadow-md"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 p-6 max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-purple-400 text-center mb-10 drop-shadow-lg tracking-wide">
          Obras publicas
        </h1>
        <div className="flex flex-col gap-8">
          {obras.length === 0 ? (
            <p className="text-center text-xl text-purple-300 italic animate-fade-in">
              No hay obras aún.
            </p>
          ) : (
            obras.map((obra) => (
              <div
                key={obra.id}
                className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700 flex flex-col md:flex-row gap-6 animate-fade-in"
              >
                <div className="flex-shrink-0">
                  {obra.url_archivo.includes("video") ? (
                    <video
                      controls
                      className="w-full md:w-64 h-auto rounded-lg shadow-md border border-purple-800 object-cover"
                      src={obra.url_archivo}
                    ></video>
                  ) : (
                    <img
                      src={obra.url_archivo}
                      alt={obra.titulo}
                      className="w-full md:w-64 h-auto rounded-lg shadow-md border border-purple-800 object-cover"
                    />
                  )}
                </div>
                <div className="flex-grow">
                  <h2 className="text-3xl font-semibold text-purple-400 mb-2">
                    {obra.titulo}
                  </h2>
                  <p className="text-gray-300 mb-2 text-lg">
                    <strong className="text-purple-300">Descripción:</strong>{" "}
                    {obra.descripcion}
                  </p>
                  <p className="text-gray-300 mb-2 text-lg">
                    <strong className="text-purple-300">Contacto:</strong>{" "}
                    {obra.contacto}
                  </p>
                  <p className="text-gray-400 text-sm italic mb-4">
                    <strong className="text-purple-400">Subido el:</strong>{" "}
                    {new Date(obra.fecha).toLocaleString()}
                  </p>
                  <button
                    onClick={() => eliminarObra(obra.id)}
                    className="px-6 py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Eliminar Obra
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}