// pages/forgot-password.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, // Asegúrate de que esta URL exista
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("¡Correo de recuperación enviado! Revisa tu bandeja de entrada.");
      setEmail(""); // Limpiar el campo de email
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h2 className="text-4xl font-extrabold text-purple-400 text-center mb-8">
          Recuperar Contraseña
        </h2>
        <p className="text-gray-300 text-center mb-6">
          Ingresa tu correo electrónico para recibir un enlace de restablecimiento de contraseña.
        </p>
        <form onSubmit={handlePasswordReset} className="space-y-6">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg"
          >
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full mt-4 px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Volver a Iniciar Sesión
          </button>
        </form>

        {message && (
          <p
            className={`mt-6 text-center ${
              message.includes("Error") ? "text-red-500" : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}