"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

type Obra = {
  id: number;
  titulo: string;
  autor: string;
  descripcion: string;
  url_archivo: string;
  contacto: string;
  fecha: string;
  aprobada: boolean;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [obras, setObras] = useState<Obra[]>([]);
  // Corrección aquí: Especificar el tipo para useState
  const [seccion, setSeccion] = useState<"inicio" | "pendientes" | "aprobadas">("inicio");
  const [scrollUp, setScrollUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const storedLoggedIn = sessionStorage.getItem("adminLoggedIn");
    const storedUser = sessionStorage.getItem("adminUser");
    if (storedLoggedIn === "true" && storedUser) {
      setLoggedIn(true);
      setUsuario(storedUser);
    } else {
      router.replace("/admin-login");
    }
  }, [router]);

  const cargarObras = async (aprobada: boolean) => {
    const { data, error } = await supabase
      .from("obras")
      .select("id, titulo, autor, descripcion, url_archivo, contacto, fecha, aprobada")
      .eq("aprobada", aprobada)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error al cargar obras:", error);
    } else {
      setObras(data || []);
    }
  };

  const aprobarObra = async (id: number) => {
    const { error } = await supabase
      .from("obras")
      .update({ aprobada: true })
      .eq("id", id);

    if (error) {
      alert("Error al aprobar obra: " + error.message);
    } else {
      alert("Obra aprobada con éxito");
      cargarObras(false);
    }
  };

  const eliminarObra = async (id: number) => {
    const confirmar = confirm("¿Eliminar esta obra? Esta acción es irreversible.");
    if (!confirmar) return;

    // Obtener url del archivo para borrar en storage
    const { data: selectData, error: selectError } = await supabase
      .from("obras")
      .select("url_archivo")
      .eq("id", id)
      .single();

    if (selectError || !selectData) {
      alert("Error al obtener archivo.");
      return;
    }

    const urlParts = selectData.url_archivo.split("/");
    const fileName = decodeURIComponent(urlParts[urlParts.length - 1]);

    const { error: deleteStorageError } = await supabase.storage
      .from("obras-archivos")
      .remove([fileName]);

    if (deleteStorageError) {
      alert("Error al eliminar archivo del storage.");
      return;
    }

    const { error: deleteDbError } = await supabase
      .from("obras")
      .delete()
      .eq("id", id);

    if (deleteDbError) {
      alert("Error al eliminar obra de la base de datos.");
    } else {
      alert("Obra eliminada con éxito.");
      // Recargar obras según sección actual
      cargarObras(seccion === "aprobadas");
    }
  };

  const handleLogout = () => {
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

  // Cuando cambies de sección carga las obras correspondientes
  useEffect(() => {
    if (loggedIn) {
      if (seccion === "pendientes") {
        cargarObras(false);
      } else if (seccion === "aprobadas") {
        cargarObras(true);
      }
    }
  }, [loggedIn, seccion]);

  if (!loggedIn) return null;

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
        {seccion === "inicio" && (
          <div className="flex flex-col md:flex-row gap-10 justify-center items-center min-h-[300px]">
            <button
              onClick={() => setSeccion("pendientes")}
              className="bg-purple-700 hover:bg-purple-800 px-10 py-8 rounded-3xl text-3xl font-bold shadow-lg transition"
            >
              Obras Pendientes
            </button>
            <button
              onClick={() => setSeccion("aprobadas")}
              className="bg-green-700 hover:bg-green-800 px-10 py-8 rounded-3xl text-3xl font-bold shadow-lg transition"
            >
              Obras Aprobadas
            </button>
          </div>
        )}

        {(seccion === "pendientes" || seccion === "aprobadas") && (
          <>
            <button
              onClick={() => setSeccion("inicio")}
              className="mb-6 px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold"
            >
              ← Volver al inicio
            </button>

            <h1 className="text-4xl font-extrabold text-purple-400 text-center mb-10">
              {seccion === "pendientes"
                ? "Obras pendientes de aprobación"
                : "Obras aprobadas"}
            </h1>

            <div className="flex flex-col gap-8">
              {obras.length === 0 ? (
                <p className="text-center text-xl text-purple-300 italic animate-fade-in">
                  {seccion === "pendientes"
                    ? "No hay obras pendientes."
                    : "No hay obras aprobadas."}
                </p>
              ) : (
                obras.map((obra) => (
                  <div
                    key={obra.id}
                    className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700 flex flex-col md:flex-row gap-6 animate-fade-in"
                  >
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => window.open(obra.url_archivo, "_blank")}>
                      {obra.url_archivo.includes("video") ? (
                        <video
                          controls
                          className="w-full md:w-64 h-auto rounded-lg shadow-md border border-purple-800 object-cover"
                          src={obra.url_archivo}
                        />
                      ) : (
                        <img
                          src={obra.url_archivo}
                          alt={obra.titulo}
                          className="w-full md:w-64 h-auto rounded-lg shadow-md border border-purple-800 object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h2 className="text-3xl font-semibold text-purple-400 mb-2">{obra.titulo}</h2>
                      <p className="text-gray-300 mb-2 text-lg">
                        <strong className="text-purple-300">Autor:</strong> {obra.autor}
                      </p>
                      <p className="text-gray-300 mb-2 text-lg">
                        <strong className="text-purple-300">Descripción:</strong> {obra.descripcion}
                      </p>
                      <p className="text-gray-300 mb-2 text-lg">
                        <strong className="text-purple-300">Contacto:</strong> {obra.contacto}
                      </p>
                      <p className="text-gray-400 text-sm italic mb-4">
                        <strong className="text-purple-400">Subido el:</strong>{" "}
                        {new Date(obra.fecha).toLocaleString()}
                      </p>

                      <div className="flex gap-4">
                        {seccion === "pendientes" ? (
                          <>
                            <button
                              onClick={() => aprobarObra(obra.id)}
                              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => eliminarObra(obra.id)}
                              className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-all"
                            >
                              Rechazar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => eliminarObra(obra.id)}
                            className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-all"
                          >
                            Borrar obra
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}