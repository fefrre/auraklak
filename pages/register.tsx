"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(`Error al registrarse: ${error.message}`);
    } else {
      setMessage(
        "¡Registro exitoso! Por favor revisa tu email para confirmar la cuenta."
      );
      // Opcional: redirigir después de un tiempo
      setTimeout(() => {
        router.push("/login");
      }, 4000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h2 className="text-4xl font-extrabold text-purple-400 text-center mb-8">
          Crear Cuenta
        </h2>
        <form onSubmit={handleRegister} className="space-y-6">
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
              placeholder="Crea una contraseña segura"
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
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-6 text-center ${
              message.includes("error") ? "text-red-500" : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
