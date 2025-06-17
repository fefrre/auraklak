// pages/update-password.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react"; // Asegúrate de tener lucide-react instalado

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false); // Nuevo estado para visibilidad de nueva contraseña
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Nuevo estado para visibilidad de confirmar contraseña
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth event:", event, "Session:", currentSession);
        if (event === 'SIGNED_IN' && currentSession) {
          setSession(currentSession);
          setMessage("Por favor, introduce tu nueva contraseña.");
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setMessage("Por favor, usa el enlace de recuperación de contraseña enviado a tu correo.");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (!initialSession) {
        setMessage("Esperando enlace de restablecimiento de contraseña...");
      } else {
        setMessage("Listo para establecer tu nueva contraseña.");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (!password) {
        setMessage("La contraseña no puede estar vacía.");
        setLoading(false);
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            setMessage(`Error al actualizar la contraseña: ${error.message}`);
        } else {
            setMessage("¡Contraseña actualizada con éxito! Redirigiendo a iniciar sesión...");
            setPassword("");
            setConfirmPassword("");
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        }
    } catch (err: any) {
        setMessage(`Ocurrió un error inesperado: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

  if (!session) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
            <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700 text-center">
                <p className="text-xl text-purple-300 mb-4">{message}</p>
                <p className="text-gray-400">
                    Si llegaste aquí por error o necesitas reiniciar el proceso,{" "}
                    <Link href="/forgot-password" className="text-purple-400 underline hover:text-purple-300">
                        solicita un nuevo enlace.
                    </Link>
                </p>
                <button
                    onClick={() => router.push("/login")}
                    className="mt-6 w-full py-3 bg-gray-700 rounded hover:bg-gray-800 text-white font-semibold"
                >
                    Volver a Iniciar Sesión
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h2 className="text-4xl font-extrabold text-purple-400 text-center mb-8">
          Establecer Nueva Contraseña
        </h2>
        <p className="text-green-400 text-center mb-4">{message}</p>
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div className="relative"> {/* Contenedor relative para el ícono */}
            <label htmlFor="password" className="block mb-2 text-purple-300 font-medium">
              Nueva Contraseña:
            </label>
            <input
              type={showPassword ? "text" : "password"} // Tipo dinámico
              id="password"
              placeholder="Ingresa tu nueva contraseña"
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
          <div className="relative"> {/* Contenedor relative para el ícono */}
            <label htmlFor="confirmPassword" className="block mb-2 text-purple-300 font-medium">
              Confirmar Contraseña:
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"} // Tipo dinámico
              id="confirmPassword"
              placeholder="Confirma tu nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-4 rounded-lg bg-gray-800 border border-purple-600 text-gray-100 pr-12" // Añade padding a la derecha
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center pt-8 text-gray-400 hover:text-purple-400"
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>

        {message && !message.includes("Listo para establecer") && !message.includes("Esperando enlace") && (
          <p
            className={`mt-6 text-center ${
              message.includes("Error") || message.includes("no coinciden")
                ? "text-red-500"
                : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-gray-400">
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            Volver a Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}