// pages/admincar/paneladmin.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { createClient } from "@supabase/supabase-js";
import { AuthSession } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPanel() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  // Efecto para verificar la sesión del administrador al cargar la página
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        // Redirigir al login si no hay sesión
        router.push('/admincar/login');
      }
    });

    // Escuchar cambios en la sesión (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          router.push('/admincar/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]); // Asegúrate de incluir router en las dependencias

  // Si no hay sesión, muestra un mensaje o redirige
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1e8] font-serif text-[#1a1a1a]">
        <p>Redirigiendo al inicio de sesión...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-serif text-[#1a1a1a] p-8"
      style={{
        backgroundImage: "url('/textures/papel-antiguo.jpg')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundColor: "#f4f1e8",
      }}
    >
      <Head>
        <title>Panel de Administración - Carpanta</title>
      </Head>

      {/* Barra de Navegación del Admin */}
      <nav className="bg-[#eae4d6] border-b-2 border-[#3a3a3a] py-6 px-4 shadow-md mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admincar/paneladmin" className="flex items-center space-x-2">
            <Image
              src="/logocarpanta.png"
              alt="Logo Carpanta"
              width={40}
              height={40}
              className="rounded shadow-sm"
            />
            <span
              className="text-2xl font-black tracking-widest"
              style={{ fontFamily: "UnifrakturCook, serif", color: "#1a1a1a" }}
            >
              CARPANTA ADMIN
            </span>
          </Link>
          <div className="space-x-4">
            <Link href="/carpanta" className="text-lg hover:underline">
              Ir a la web
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/admincar/login');
              }}
              className="text-lg hover:underline text-red-600"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Título del Panel */}
      <h1 className="text-4xl font-bold text-center mb-12">
        Bienvenido al Panel de Administración
      </h1>

      {/* Contenedor de Botones de Navegación */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Botón 1: Subir Tomo Directamente (tomoed.tsx) */}
        <Link href="/admincar/tomoed" className="block bg-white p-8 rounded-lg shadow-lg border border-[#3a3a3a] hover:shadow-xl transition-shadow text-center">
          <h2 className="text-2xl font-bold mb-4">Subir Tomo Directamente</h2>
          <p className="text-gray-700">Publica un nuevo tomo de inmediato.</p>
        </Link>

        {/* Botón 2: Gestionar Solicitudes (solicitudes.tsx) */}
        <Link href="/admincar/solicitudes" className="block bg-white p-8 rounded-lg shadow-lg border border-[#3a3a3a] hover:shadow-xl transition-shadow text-center">
          <h2 className="text-2xl font-bold mb-4">Gestionar Solicitudes</h2>
          <p className="text-gray-700">Revisa, edita y aprueba los tomos enviados por usuarios.</p>
        </Link>

        {/* Botón 3: Borrar Tomos Publicados (borrar-tomo.tsx) */}
        <Link href="/admincar/borrar-tomo" className="block bg-white p-8 rounded-lg shadow-lg border border-[#3a3a3a] hover:shadow-xl transition-shadow text-center">
          <h2 className="text-2xl font-bold mb-4">Borrar/Editar Tomos Publicados</h2>
          <p className="text-gray-700">Elimina o edita tomos que ya están visibles en la web principal.</p>
        </Link>

        {/* Botón 4: Editar Cualquier Tomo (editar-tomo.tsx) - Incluirá tanto borradores como publicados*/}
        <Link href="/admincar/editar-tomo" className="block bg-white p-8 rounded-lg shadow-lg border border-[#3a3a3a] hover:shadow-xl transition-shadow text-center">
          <h2 className="text-2xl font-bold mb-4">Editar Todos los Tomos</h2>
          <p className="text-gray-700">Modifica cualquier tomo, sea borrador o esté publicado.</p>
        </Link>

      </div>

      {/* Pie de página */}
      <footer className="text-center py-6 text-sm text-gray-600 bg-[#eae4d6] border-t-2 border-[#3a3a3a] mt-8">
        © {new Date().getFullYear()} Carpanta. Panel de Administración.
      </footer>
    </div>
  );
}