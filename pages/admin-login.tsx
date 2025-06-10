"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errorLogin, setErrorLogin] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin(""); // Limpia errores anteriores

    try {
      const res = await fetch("'/api/registrar-admin'", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });

      if (!res.ok) {
        // Si el status HTTP no es 2xx, lee el mensaje de error
        const errorData = await res.json();
        setErrorLogin(errorData.message || "Credenciales incorrectas");
        return;
      }

      // Si todo está OK, parseamos el JSON
      const result = await res.json();

      // Aquí asumo que tu API devuelve { message: "Login exitoso" }
      // Para validar login exitoso, solo con que no haya error ya es suficiente

      // Guardamos datos de sesión y redirigimos
      sessionStorage.setItem("adminLoggedIn", "true");
      sessionStorage.setItem("adminUser", usuario);
      router.push("/admin-dashboard");
    } catch (error) {
      console.error("Error en la solicitud de login:", error);
      setErrorLogin("Error de conexión. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-100 px-4">
      <h2 className="text-3xl font-extrabold text-purple-400 mb-8 text-center tracking-wide">
        Acceso Administrador
      </h2>
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-10 rounded-2xl shadow-xl border border-gray-700 w-full max-w-sm space-y-6"
      >
        <input
          type="text"
          placeholder="Usuario"
          className="w-full border border-purple-600 p-4 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />
        <div className="relative w-full">
          <input
            type={mostrarContrasena ? "text" : "password"}
            placeholder="Contraseña"
            className="w-full border border-purple-600 p-4 pr-12 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setMostrarContrasena(!mostrarContrasena)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-white"
            tabIndex={-1}
          >
            {mostrarContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button
          type="submit"
          className="w-full px-8 py-4 bg-purple-700 text-white font-bold text-xl rounded-lg hover:bg-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-glow-md"
        >
          Iniciar Sesión
        </button>
        {errorLogin && (
          <p className="text-red-500 text-base text-center mt-4 animate-pulse">
            {errorLogin}
          </p>
        )}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full mt-4 px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
        >
          Volver al inicio
        </button>
      </form>
    </div>
  );
}
