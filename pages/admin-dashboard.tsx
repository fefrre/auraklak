// codigo admin-dashboard.tsx
"use client";

import { useState, useEffect, useRef } from "react"; // Se añade useRef
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient"; // Importación actualizada

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

// Nueva interfaz para ContenidoExclusivoItem para el admin dashboard
type ContenidoExclusivoItem = {
  id: string; // UUID in Supabase is string
  titulo: string;
  descripcion: string;
  tipo: "imagen" | "video" | "documento"; // Asegúrate de que los tipos coincidan con tu DB
  url_archivo: string;
  created_at: string;
};


export default function AdminDashboardPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipoContenido, setTipoContenido] = useState<"imagen" | "video" | "documento" | "otro">("imagen"); // Nuevo estado para el tipo de contenido exclusivo

  // Referencia para el input de archivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loggedIn, setLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [obras, setObras] = useState<Obra[]>([]);
  const [contenidoExclusivo, setContenidoExclusivo] = useState<ContenidoExclusivoItem[]>([]); // Nuevo estado para el contenido exclusivo
  const [seccion, setSeccion] = useState<
    "inicio" | "pendientes" | "aprobadas" | "subirContenido" | "verContenidoExclusivo" // Nueva sección
  >("inicio");

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
      .select(
        "id, titulo, autor, descripcion, url_archivo, contacto, fecha, aprobada"
      )
      .eq("aprobada", aprobada)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error al cargar obras:", error);
    } else {
      setObras(data || []);
    }
  };

  const cargarContenidoExclusivo = async () => { // Nueva función para cargar contenido exclusivo
    const { data, error } = await supabase
      .from("contenido_exclusivo")
      .select("id, titulo, descripcion, tipo, url_archivo, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar contenido exclusivo:", error);
    } else {
      setContenidoExclusivo(data || []);
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
    const confirmar = confirm(
      "¿Eliminar esta obra? Esta acción es irreversible."
    );
    if (!confirmar) return;

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
    const bucketName = "obras-archivos"; // Define el bucket name aquí para claridad

    const { error: deleteStorageError } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (deleteStorageError) {
      // No detengas el proceso si el archivo ya no existe en el storage
      console.warn("Advertencia al eliminar del storage:", deleteStorageError.message);
    }

    const { error: deleteDbError } = await supabase
      .from("obras")
      .delete()
      .eq("id", id);

    if (deleteDbError) {
      alert("Error al eliminar obra de la base de datos.");
    } else {
      alert("Obra eliminada con éxito.");
      cargarObras(seccion === "aprobadas");
    }
  };
  
  const eliminarContenidoExclusivo = async (id: string, url_archivo: string) => { // Nueva función para eliminar contenido exclusivo
    const confirmar = confirm(
      "¿Eliminar este contenido exclusivo? Esta acción es irreversible."
    );
    if (!confirmar) return;

    // Extraer el nombre del archivo de la URL
    const urlParts = url_archivo.split("/");
    const fileName = decodeURIComponent(urlParts[urlParts.length - 1]);
    const bucketName = "contenido-exclusivo"; 

    // Eliminar del Storage
    const { error: deleteStorageError } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (deleteStorageError) {
      console.warn("Advertencia al eliminar del storage (contenido exclusivo):", deleteStorageError.message);
    }

    // Eliminar de la base de datos
    const { error: deleteDbError } = await supabase
      .from("contenido_exclusivo")
      .delete()
      .eq("id", id);

    if (deleteDbError) {
      alert("Error al eliminar contenido exclusivo de la base de datos.");
    } else {
      alert("Contenido exclusivo eliminado con éxito.");
      cargarContenidoExclusivo(); // Recargar la lista
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

  useEffect(() => {
    if (loggedIn) {
      if (seccion === "pendientes") {
        cargarObras(false);
      } else if (seccion === "aprobadas") {
        cargarObras(true);
      } else if (seccion === "verContenidoExclusivo") { // Cargar contenido exclusivo
        cargarContenidoExclusivo();
      }
    }
  }, [loggedIn, seccion]);
  
  // Limpia el estado del formulario al cambiar de sección
  useEffect(() => {
    if (seccion !== 'subirContenido') {
        setTitulo("");
        setDescripcion("");
        setArchivo(null);
        setTipoContenido("imagen"); // Resetear también el tipo de contenido
    }
  }, [seccion]);


  if (!loggedIn) return null;

  return (
    <div className="min-h-screen text-gray-100 bg-gray-950">
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
          scrollUp ? "translate-y-0" : "-translate-y-full"
        } bg-gray-900 shadow-lg border-b border-purple-800`}
      >
        <div className="flex items-center justify-between max-w-6xl px-4 py-4 mx-auto">
          <h1 className="text-2xl font-bold text-purple-400">Panel Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-white">
              Bienvenido, {usuario}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-base font-semibold text-white transition bg-purple-600 rounded-md shadow-md hover:bg-purple-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl p-6 pt-24 mx-auto">
        {seccion === "inicio" && (
          <div className="flex flex-col md:flex-row gap-10 justify-center items-center min-h-[300px]">
            <button
              onClick={() => setSeccion("pendientes")}
              className="px-10 py-8 text-3xl font-bold transition bg-purple-700 shadow-lg hover:bg-purple-800 rounded-3xl"
            >
              Obras Pendientes
            </button>
            <button
              onClick={() => setSeccion("aprobadas")}
              className="px-10 py-8 text-3xl font-bold transition bg-green-700 shadow-lg hover:bg-green-800 rounded-3xl"
            >
              Obras Aprobadas
            </button>
            <button
              onClick={() => setSeccion("subirContenido")}
              className="px-10 py-8 text-3xl font-bold transition bg-blue-700 shadow-lg hover:bg-blue-800 rounded-3xl"
            >
              Subir Contenido Exclusivo
            </button>
            <button // Nuevo botón para ver contenido exclusivo
              onClick={() => setSeccion("verContenidoExclusivo")}
              className="px-10 py-8 text-3xl font-bold transition bg-yellow-700 shadow-lg hover:bg-yellow-800 rounded-3xl"
            >
              Ver Contenido Exclusivo
            </button>
          </div>
        )}
        {seccion === "subirContenido" && (
          <div className="max-w-2xl p-6 mx-auto bg-gray-900 border border-purple-700 shadow-xl rounded-2xl">
            <button
              onClick={() => setSeccion("inicio")}
              className="px-6 py-3 mb-6 font-semibold bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              ← Volver al inicio
            </button>

            <h2 className="mb-6 text-3xl font-extrabold text-center text-purple-400">
              Subir Contenido Exclusivo
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!archivo) return alert("Por favor, selecciona un archivo.");

                const nombreArchivo = `${Date.now()}_${archivo.name}`;
                const { error: uploadError } =
                  await supabase.storage
                    .from("contenido-exclusivo") // Nombre de tu bucket en Supabase
                    .upload(nombreArchivo, archivo);

                if (uploadError) {
                  console.error("Error al subir archivo:", uploadError);
                  return alert("Error al subir el archivo. Revisa la consola para más detalles.");
                }

                const { data: publicUrlData } = supabase.storage
                  .from("contenido-exclusivo")
                  .getPublicUrl(nombreArchivo);

                if (!publicUrlData) {
                    return alert("No se pudo obtener la URL pública del archivo.");
                }

                // Determinar el tipo de archivo automáticamente o desde el estado
                let inferredType: "imagen" | "video" | "documento" = "documento";
                if (archivo.type.startsWith("image")) {
                    inferredType = "imagen";
                } else if (archivo.type.startsWith("video")) {
                    inferredType = "video";
                } else if (archivo.type === "application/pdf") { // Específico para PDF
                    inferredType = "documento";
                }
                // Si el tipoContenido fue seleccionado manualmente y no es "otro", úsalo
                const finalTipo = tipoContenido !== "otro" ? tipoContenido : inferredType;


                const { error: dbError } = await supabase
                  .from("contenido_exclusivo") // Nombre de tu tabla en la base de datos
                  .insert({
                    titulo,
                    descripcion,
                    tipo: finalTipo, // Usar el tipo inferido o seleccionado
                    url_archivo: publicUrlData.publicUrl,
                  });

                if (dbError) {
                  console.error("Error al guardar en BD:", dbError);
                  return alert("Error al guardar la información. Revisa la consola.");
                }

                alert("Contenido subido con éxito");
                setSeccion("inicio"); // Regresar al inicio tras el éxito
              }}
              className="space-y-6" // Aumentado el espacio para mejor estética
            >
              <input
                type="text"
                placeholder="Título del contenido"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="w-full p-3 text-white bg-gray-800 border-2 border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
              <textarea
                placeholder="Descripción detallada"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                rows={4}
                className="w-full p-3 text-white bg-gray-800 border-2 border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
              
              {/* Selector de tipo de contenido */}
              <div className="flex flex-col">
                <label htmlFor="tipoContenido" className="mb-2 text-gray-300">Tipo de Contenido:</label>
                <select
                  id="tipoContenido"
                  value={tipoContenido}
                  onChange={(e) => setTipoContenido(e.target.value as "imagen" | "video" | "documento" | "otro")}
                  className="w-full p-3 text-white bg-gray-800 border-2 border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
                >
                  <option value="imagen">Imagen</option>
                  <option value="video">Video</option>
                  <option value="documento">Documento (PDF, Word, etc.)</option>
                  <option value="otro">Detectar automáticamente</option>
                </select>
              </div>


              {/* --- INICIO DE CAMBIOS PARA EL BOTÓN DE ARCHIVO --- */}
              <input
                type="file"
                ref={fileInputRef} // Asignamos la referencia
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                required
                className="hidden" // Ocultamos el input original
              />
              <button
                type="button" // Importante: type="button" para no enviar el formulario
                onClick={() => fileInputRef.current?.click()} // Al hacer clic, activamos el input oculto
                className="w-full p-3 font-semibold text-center text-white bg-gray-700 border-2 border-gray-500 border-dashed rounded-lg cursor-pointer hover:bg-gray-600 hover:border-purple-500"
              >
                {archivo ? `Archivo: ${archivo.name}` : 'Seleccionar archivo'}
              </button>
              {/* --- FIN DE CAMBIOS --- */}

              <button
                type="submit"
                className="w-full px-6 py-3 text-lg font-bold text-white bg-purple-700 rounded-lg hover:bg-purple-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={!titulo || !descripcion || !archivo}
              >
                Subir Contenido
              </button>
            </form>
          </div>
        )}
        {seccion === "verContenidoExclusivo" && ( // Nueva sección para ver contenido exclusivo
            <>
              <button
                onClick={() => setSeccion("inicio")}
                className="px-6 py-3 mb-6 font-semibold bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                ← Volver al inicio
              </button>

              <h1 className="mb-10 text-4xl font-extrabold text-center text-purple-400">
                Contenido Exclusivo
              </h1>

              <div className="flex flex-col gap-8">
                {contenidoExclusivo.length === 0 ? (
                  <p className="text-xl italic text-center text-purple-300 animate-fade-in">
                    No hay contenido exclusivo subido aún.
                  </p>
                ) : (
                  contenidoExclusivo.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-6 p-8 bg-gray-900 border border-gray-700 shadow-xl rounded-2xl md:flex-row animate-fade-in"
                    >
                      <div className="flex-shrink-0 cursor-pointer" onClick={() => window.open(item.url_archivo, "_blank")}>
                        {item.tipo === "imagen" && (
                          <img
                            src={item.url_archivo}
                            alt={item.titulo}
                            className="object-cover w-full h-auto border border-purple-800 rounded-lg shadow-md md:w-64"
                          />
                        )}
                        {item.tipo === "video" && (
                          <video
                            controls
                            className="object-cover w-full h-auto border border-purple-800 rounded-lg shadow-md md:w-64"
                            src={item.url_archivo}
                          />
                        )}
                        {item.tipo === "documento" && (
                          <div className="flex flex-col items-center justify-center w-full h-full p-4 text-purple-400 bg-gray-800 border border-purple-800 rounded-lg shadow-md md:w-64 md:h-48">
                            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <p className="text-sm font-semibold text-center">Ver Documento</p>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h2 className="mb-2 text-3xl font-semibold text-purple-400">
                          {item.titulo}
                        </h2>
                        <p className="mb-2 text-lg text-gray-300">
                          <strong className="text-purple-300">Descripción:</strong>{" "}
                          {item.descripcion}
                        </p>
                        <p className="mb-2 text-lg text-gray-300">
                          <strong className="text-purple-300">Tipo:</strong>{" "}
                          {item.tipo}
                        </p>
                        <p className="mb-4 text-sm italic text-gray-400">
                          <strong className="text-purple-400">Subido el:</strong>{" "}
                          {new Date(item.created_at).toLocaleString()}
                        </p>

                        <div className="flex gap-4 mt-4">
                          <button
                            onClick={() => eliminarContenidoExclusivo(item.id, item.url_archivo)}
                            className="px-6 py-3 font-bold text-white transition-all bg-red-700 rounded-lg hover:bg-red-800"
                          >
                            Borrar Contenido
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
        )}
        {(seccion === "pendientes" || seccion === "aprobadas") && (
          <>
            <button
              onClick={() => setSeccion("inicio")}
              className="px-6 py-3 mb-6 font-semibold bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              ← Volver al inicio
            </button>

            <h1 className="mb-10 text-4xl font-extrabold text-center text-purple-400">
              {seccion === "pendientes"
                ? "Obras pendientes de aprobación"
                : "Obras aprobadas"}
            </h1>

            <div className="flex flex-col gap-8">
              {obras.length === 0 ? (
                <p className="text-xl italic text-center text-purple-300 animate-fade-in">
                  {seccion === "pendientes"
                    ? "No hay obras pendientes."
                    : "No hay obras aprobadas."}
                </p>
              ) : (
                obras.map((obra) => (
                  <div
                    key={obra.id}
                    className="flex flex-col gap-6 p-8 bg-gray-900 border border-gray-700 shadow-xl rounded-2xl md:flex-row animate-fade-in"
                  >
                    <div
                      className="flex-shrink-0 cursor-pointer"
                      onClick={() => window.open(obra.url_archivo, "_blank")}
                    >
                      {obra.url_archivo.includes(".mp4") || obra.url_archivo.includes(".webm") ? ( // Detección más robusta
                        <video
                          controls
                          className="object-cover w-full h-auto border border-purple-800 rounded-lg shadow-md md:w-64"
                          src={obra.url_archivo}
                        />
                      ) : (
                        <img
                          src={obra.url_archivo}
                          alt={obra.titulo}
                          className="object-cover w-full h-auto border border-purple-800 rounded-lg shadow-md md:w-64"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h2 className="mb-2 text-3xl font-semibold text-purple-400">
                        {obra.titulo}
                      </h2>
                      <p className="mb-2 text-lg text-gray-300">
                        <strong className="text-purple-300">Autor:</strong>{" "}
                        {obra.autor}
                      </p>
                      <p className="mb-2 text-lg text-gray-300">
                        <strong className="text-purple-300">
                          Descripción:
                        </strong>{" "}
                        {obra.descripcion}
                      </p>
                      <p className="mb-2 text-lg text-gray-300">
                        <strong className="text-purple-300">Contacto:</strong>{" "}
                        {obra.contacto}
                      </p>
                      <p className="mb-4 text-sm italic text-gray-400">
                        <strong className="text-purple-400">Subido el:</strong>{" "}
                        {new Date(obra.fecha).toLocaleString()}
                      </p>

                      <div className="flex gap-4 mt-4">
                        {seccion === "pendientes" ? (
                          <>
                            <button
                              onClick={() => aprobarObra(obra.id)}
                              className="px-6 py-3 font-bold text-white transition-all bg-green-600 rounded-lg hover:bg-green-700"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => eliminarObra(obra.id)}
                              className="px-6 py-3 font-bold text-white transition-all bg-red-700 rounded-lg hover:bg-red-800"
                            >
                              Rechazar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => eliminarObra(obra.id)}
                            className="px-6 py-3 font-bold text-white transition-all bg-red-700 rounded-lg hover:bg-red-800"
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