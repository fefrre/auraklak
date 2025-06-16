"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { FiCheckCircle, FiXCircle, FiLogOut } from "react-icons/fi";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@carpanta.com";

export default function RevisionesTomos() {
  const [tomos, setTomos] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/admincar/login");
      } else {
        setUserChecked(true);
      }
    };
    checkAdmin();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/admincar/login");
  };

  const fetchTomos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tomos")
      .select("*")
      .eq("borrador", true)
      .order("fecha_publicacion", { ascending: false });

    if (error) {
      console.error("Error al obtener tomos:", error);
      setMensaje("Error al cargar tomos");
    } else setTomos(data || []);
    setLoading(false);
  };

  const aprobarTomo = async (id: number) => {
    setMensaje("");
    const res = await fetch("/api/tomos/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const result = await res.json();
    setMensaje(result.message || "Tomo aprobado");
    fetchTomos();
  };

  const rechazarTomo = async (id: number) => {
    setMensaje("");
    const res = await fetch("/api/tomos/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const result = await res.json();
    setMensaje(result.message || "Tomo rechazado");
    fetchTomos();
  };

  useEffect(() => {
    if (userChecked) fetchTomos();
  }, [userChecked]);

  if (!userChecked) return null;

  return (
    <div className="min-h-screen bg-paper p-8 font-serif text-black max-w-7xl mx-auto">
      {/* Header fijo */}
      <header className="sticky top-0 z-30 bg-paper shadow-md border-b border-brown-dark flex justify-between items-center px-6 py-4 mb-8">
        <h1 className="text-4xl font-bold tracking-widest text-brown-dark font-newspaper">
          Solicitudes de Tomos
        </h1>
        <button
          onClick={cerrarSesion}
          title="Cerrar sesión"
          className="flex items-center gap-2 text-brown-dark hover:text-black transition-colors text-lg border border-brown-dark rounded px-3 py-1 hover:bg-brown-light"
        >
          <FiLogOut size={22} />
          Cerrar sesión
        </button>
      </header>

      {/* Mensaje con animación */}
      {mensaje && (
        <div
          className="mb-6 max-w-xl mx-auto bg-yellow-light border border-brown-dark text-brown-dark px-6 py-3 rounded shadow-md animate-fade-in"
          role="alert"
        >
          {mensaje}
        </div>
      )}

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center mt-20 text-brown-dark font-semibold text-xl">
          Cargando tomos...
        </div>
      ) : tomos.length === 0 ? (
        <p className="text-center text-brown-dark text-xl mt-20 font-semibold">
          No hay tomos pendientes de aprobación.
        </p>
      ) : (
        <section className="grid gap-10 md:grid-cols-2">
          {tomos.map((tomo) => (
            <article
              key={tomo.id}
              className="bg-paper border border-brown-dark rounded-md shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              {tomo.imagen_url && (
                <div className="relative w-full h-56 overflow-hidden rounded-t-md border-b border-brown-dark">
                  <Image
                    src={tomo.imagen_url}
                    alt={tomo.titulo || "Imagen del Tomo"}
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-t-md"
                    quality={80}
                  />
                </div>
              )}

              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-2 text-brown-dark font-newspaper">
                  {tomo.titulo}
                </h3>

                {tomo.autor && (
                  <p className="text-sm text-brown-medium mb-1 italic">
                    Por: {tomo.autor}
                  </p>
                )}
                {tomo.fecha_publicacion && (
                  <p className="text-xs text-brown-medium mb-3">
                    {new Date(tomo.fecha_publicacion).toLocaleDateString(
                      "es-ES",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                )}

                <div
                  className="prose prose-sm max-w-none text-brown-dark flex-grow overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: tomo.contenido_html }}
                />

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => aprobarTomo(tomo.id)}
                    className="flex items-center justify-center gap-2 bg-brown-dark hover:bg-black text-yellow-light px-4 py-2 rounded-md shadow-inner transition-colors duration-200 w-full"
                    aria-label="Aprobar Tomo"
                  >
                    <FiCheckCircle size={20} />
                    Aprobar
                  </button>
                  <button
                    onClick={() => rechazarTomo(tomo.id)}
                    className="flex items-center justify-center gap-2 bg-yellow-light hover:bg-yellow-200 text-brown-dark px-4 py-2 rounded-md border border-brown-dark shadow-inner transition-colors duration-200 w-full"
                    aria-label="Rechazar Tomo"
                  >
                    <FiXCircle size={20} />
                    Rechazar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Libre+Baskerville&display=swap');

        .font-newspaper {
          font-family: 'Special Elite', 'Libre Baskerville', serif;
        }

        .bg-paper {
          background: #f7f1e1 url('https://www.transparenttextures.com/patterns/paper-fibers.png');
        }
        .text-brown-dark {
          color: #4b2e05;
        }
        .text-brown-medium {
          color: #7c5e28;
        }
        .border-brown-dark {
          border-color: #4b2e05;
        }
        .bg-brown-dark {
          background-color: #4b2e05;
        }
        .bg-brown-light {
          background-color: #d6c1a1;
        }
        .bg-yellow-light {
          background-color: #f3e3b3;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease forwards;
        }
      `}</style>
    </div>
  );
}
