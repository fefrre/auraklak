// register.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react"; // Asegúrate de tener lucide-react instalado

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Nuevo estado para visibilidad de contraseña
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
          Registrarse
        </h2>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 text-purple-300 font-medium">
              Correo Electrónico:
            </label>
            <input
              type="email"
              id="email"
              placeholder="tu@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 rounded-lg bg-gray-800 border border-purple-600 text-gray-100"
            />
          </div>
          <div className="relative"> {/* Contenedor relative para el ícono */}
            <label htmlFor="password" className="block mb-2 text-purple-300 font-medium">
              Contraseña:
            </label>
            <input
              type={showPassword ? "text" : "password"} // Tipo dinámico
              id="password"
              placeholder="Crea una contraseña segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-4 rounded-lg bg-gray-800 border border-purple-600 text-gray-100 pr-12" // Añade padding a la derecha
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center pt-8 text-gray-400 hover:text-purple-400"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full mt-4 px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Volver al inicio
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
        <p className="mt-2 text-center text-gray-400">
          <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300 underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </div>
  );
}