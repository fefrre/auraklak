// pages/register.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router"; // Importar useRouter para redirigir
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(`Error al registrarse: ${error.message}`);
    } else {
      setMessage(
        "¡Registro exitoso! Por favor, revisa tu email para confirmar tu cuenta y luego inicia sesión."
      );
      // Opcional: Redirigir al usuario a la página de login después de un breve retraso
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700 animate-fade-in">
        <h2 className="text-4xl font-extrabold text-purple-400 text-center mb-8 drop-shadow-md">
          Crear Cuenta
        </h2>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-lg font-medium text-purple-300 mb-2"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              placeholder="tu@correo.com"
              className="w-full p-4 border border-purple-600 rounded-lg shadow-inner bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-lg font-medium text-purple-300 mb-2"
            >
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              placeholder="Crea una contraseña segura"
              className="w-full p-4 border border-purple-600 rounded-lg shadow-inner bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-4 mt-8">
            <button
              type="submit"
              className="w-full px-8 py-4 bg-purple-700 text-white font-bold text-xl rounded-lg hover:bg-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-glow-md"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
            <p className="text-center text-sm text-gray-400">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300 transition"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>

        {message && (
          <p
            className={`mt-6 text-center text-lg ${
              message.includes("éxito") || message.includes("revisa tu email")
                ? "text-green-400"
                : "text-red-400"
            } animate-pulse`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}