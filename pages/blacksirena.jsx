// pages/blacksirena.tsx
"use client";

import React, { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Truck, BookOpen, Sparkles } from "lucide-react";

export default function BlackSirenaPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const servicios = [
    {
      nombre: "Catálogo",
      descripcion: "Descubre las nuevas colecciones de temporada",
      icono: <BookOpen size={32} className="text-[#f0e68c]" />,
      href: "/catalogo-blacksirena.pdf",
    },
    {
      nombre: "Carrito",
      descripcion: "Consulta tus artículos seleccionados",
      icono: <ShoppingCart size={32} className="text-[#f0e68c]" />,
      href: "/carrito", // puede ser futuro
    },
    {
      nombre: "Envíos",
      descripcion: "Ropa hasta tu puerta en todo el país",
      icono: <Truck size={32} className="text-[#f0e68c]" />,
      href: "#envios",
    },
    {
      nombre: "Pedidos Personalizados",
      descripcion: "Diseñamos lo que imaginas",
      icono: <Sparkles size={32} className="text-[#f0e68c]" />,
      href: "#personalizados",
    },
  ];

  return (
    <div className="min-h-screen text-gray-200 font-serif bg-[#0b0b0d]">
      <Head>
        <title>BlackSirena – Moda Abismal</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel&family=UnifrakturCook&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/90 to-transparent border-b border-[#2a2a2a] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <span
            className="text-4xl font-black tracking-widest text-[#f0e68c]"
            style={{ fontFamily: "UnifrakturCook, serif" }}
          >
            BLACKSIRENA
          </span>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-8 text-sm md:text-base text-gray-300 font-semibold tracking-widest">
            <Link href="/" className="hover:text-[#f0e68c] transition">AURA</Link>
            <Link href="/carpanta" className="hover:text-[#f0e68c] transition">Carpanta</Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-[#f0e68c] focus:outline-none"
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
                  d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 border-t border-[#2a2a2a] px-6 pb-6 pt-2 text-base animate-fade-in-down">
            <Link href="/" className="block py-3 text-gray-300 hover:text-[#f0e68c]" onClick={() => setMobileMenuOpen(false)}>AURA</Link>
            <Link href="/carpanta" className="block py-3 text-gray-300 hover:text-[#f0e68c]" onClick={() => setMobileMenuOpen(false)}>Carpanta</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section
        className="relative h-screen flex flex-col items-center justify-center text-center text-gray-100 px-6"
        style={{
          backgroundImage: "url('/textures/heroblack.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-10 max-w-4xl">
          <h1
            className="text-6xl md:text-7xl font-extrabold mb-6"
            style={{ fontFamily: "Cinzel, serif" }}
          >
            Black Sirena Chlorine Shirts
          </h1>
          <p className="text-lg md:text-xl text-gray-300 italic">
            ESPACIO PARA SLOGAN  
          </p>
        </div>
      </section>

      {/* Servicios Destacados */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-center">
        {servicios.map((servicio, index) => (
          <Link
            key={index}
            href={servicio.href}
            className="group bg-[#161616] border border-[#2a2a2a] p-6 rounded-lg shadow-md hover:border-[#f0e68c] transition"
          >
            <div className="flex flex-col items-center gap-3">
              {servicio.icono}
              <h3 className="text-xl font-semibold text-[#f0e68c]">{servicio.nombre}</h3>
              <p className="text-sm text-gray-400">{servicio.descripcion}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Pedidos personalizados */}
      <section id="personalizados" className="px-6 py-24 bg-[#101010] border-t border-[#2a2a2a]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0e68c]" style={{ fontFamily: "Cinzel, serif" }}>
            Pedidos Personalizados
          </h2>
          <p className="mt-4 text-gray-400">
            ¿Tienes una visión? Nosotros la traemos a la oscuridad. Rellena un formulario y diseñamos algo único para ti.
          </p>
          <div className="mt-6">
            <a
              href="/formulario-personalizado"
              className="inline-block px-6 py-2.5 bg-[#333] text-white font-semibold rounded hover:bg-[#555] transition"
            >
              Hacer pedido personalizado
            </a>
          </div>
        </div>
      </section>

      {/* Envíos */}
      <section id="envios" className="px-6 py-16 bg-[#0d0d0d] border-t border-[#2a2a2a] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#f0e68c]">Envíos Nacionales</h2>
          <p className="mt-2 text-gray-400">
            Enviamos a todo México con empaques eco-estéticos y seguimiento personalizado.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500 border-t border-[#3a3a3a] bg-black">
        © 2025 BlackSirena – Moda independiente desde las profundidades.
      </footer>
    </div>
  );
}
