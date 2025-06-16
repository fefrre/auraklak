"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react"; // O usa un SVG si prefieres no importar íconos

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Credenciales inválidas");
    } else {
      router.push("/admincar/revisiones");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleLogin}
        className="bg-paper border border-brown-dark p-8 rounded shadow-md max-w-md w-full font-newspaper"
      >
        <h1 className="text-3xl font-bold mb-6 text-center text-brown-dark tracking-widest">
          Login Administrador
        </h1>

        {errorMsg && (
          <p className="text-red-700 text-center mb-4 font-semibold animate-fade-in">
            {errorMsg}
          </p>
        )}

        <input
          type="email"
          placeholder="Correo"
          className="w-full border border-brown-medium bg-yellow-light text-black font-baskerville p-3 mb-5 rounded focus:outline-none focus:ring-2 focus:ring-brown-dark transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />

        {/* Campo de contraseña con ojito */}
        <div className="relative mb-6">
          <input
            type={mostrarPassword ? "text" : "password"}
            placeholder="Contraseña"
            className="w-full border border-brown-medium bg-yellow-light text-black font-baskerville p-3 pr-10 rounded focus:outline-none focus:ring-2 focus:ring-brown-dark transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brown-dark"
            aria-label="Ver contraseña"
          >
            {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-brown-dark text-yellow-light py-3 rounded shadow-inner hover:bg-black transition-colors font-semibold"
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => router.push("/carpanta")}
          className="w-full mt-4 border-2 border-brown-dark text-brown-dark py-2 rounded hover:bg-yellow-light hover:text-black transition font-semibold"
        >
          Ir a Carpanta 📰
        </button>
      </form>

      {/* Estilos personalizados */}
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Special+Elite&family=Libre+Baskerville&display=swap");

        .font-newspaper {
          font-family: "Special Elite", serif;
        }
        .font-baskerville {
          font-family: "Libre Baskerville", serif;
        }
        .bg-paper {
          background: #f7f1e1
            url("https://www.transparenttextures.com/patterns/paper-fibers.png");
        }
        .text-brown-dark {
          color: #4b2e05;
        }
        .border-brown-dark {
          border-color: #4b2e05;
        }
        .border-brown-medium {
          border-color: #7c5e28;
        }
        .bg-brown-dark {
          background-color: #4b2e05;
        }
        .bg-yellow-light {
          background-color: #f3e3b3;
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease forwards;
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
      `}</style>
    </div>
  );
}
