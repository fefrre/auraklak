"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("email not confirmed") ||
        error.message.toLowerCase().includes("confirm your email")
      ) {
        setMessage("Debes confirmar tu correo antes de iniciar sesión.");
      } else {
        setMessage(`Error al iniciar sesión: ${error.message}`);
      }
    } else {
      setMessage("¡Sesión iniciada con éxito! Redirigiendo...");
      setTimeout(() => {
        router.push("/obras"); // Ajusta esta ruta según tu proyecto
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h2 className="text-4xl font-extrabold text-purple-400 text-center mb-8">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 text-purple-300 font-medium">
              Email:
            </label>
            <input
              type="email"
              id="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 rounded-lg bg-gray-800 border border-purple-600 text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-purple-300 font-medium">
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-4 rounded-lg bg-gray-800 border border-purple-600 text-gray-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg"
          >
            {loading ? "Iniciando..." : "Iniciar Sesión"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-6 text-center ${
              message.includes("error") || message.includes("confirmar")
                ? "text-red-500"
                : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-gray-400">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-purple-400 hover:text-purple-300">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
