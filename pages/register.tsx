"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Primero verificamos si el usuario ya existe
     const { data: { user }, error: userError } = await supabase
  .auth
  .admin
  .getUserById(email);

if (user) {
  setMessage("Este correo ya está registrado");
  setLoading(false);
  return;
}

      // Si no existe, procedemos con el registro
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
        setTimeout(() => {
          router.push("/login");
        }, 4000);
      }
    } catch (err) {
      setMessage("Ocurrió un error al verificar el usuario. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 text-gray-100 bg-gray-950">
      <div className="w-full max-w-md p-8 bg-gray-900 border border-gray-700 shadow-xl rounded-2xl">
        <h2 className="mb-8 text-4xl font-extrabold text-center text-purple-400">
          Registrarse
        </h2>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 font-medium text-purple-300">
              Correo Electrónico:
            </label>
            <input
              type="email"
              id="email"
              placeholder="tu@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 text-gray-100 bg-gray-800 border border-purple-600 rounded-lg"
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block mb-2 font-medium text-purple-300">
              Contraseña:
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Crea una contraseña segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-4 pr-12 text-gray-100 bg-gray-800 border border-purple-600 rounded-lg"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pt-8 pr-3 text-gray-400 hover:text-purple-400"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 font-bold text-white bg-purple-700 rounded-lg hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full px-8 py-3 mt-4 text-white transition bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            Volver al inicio
          </button>
        </form>

        {message && (
          <p
            className={`mt-6 text-center ${
              message.includes("Error") || message.includes("error") || message.includes("ya está") 
                ? "text-red-500" 
                : "text-green-400"
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
          <Link href="/forgot-password" className="text-purple-400 underline hover:text-purple-300">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </div>
  );
}