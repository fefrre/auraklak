// pages/registro-usuario.tsx
"use client";
import { useState } from "react";

export default function RegistroUsuario() {
  const [form, setForm] = useState({
    usuario: "",
    nombre: "",
    correo: "",
    contrasena: "",
    telefono: "",
  });

  const [mensaje, setMensaje] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");

    const res = await fetch("/api/registrar-usuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      setMensaje("¡Registro exitoso!");
      setForm({ usuario: "", nombre: "", correo: "", contrasena: "", telefono: "" });
    } else {
      setMensaje(data.mensaje || "Error al registrar");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Registro de Usuario</h2>
        <input
          type="text"
          name="usuario"
          placeholder="Usuario"
          value={form.usuario}
          onChange={handleChange}
          required
          className="w-full p-3 rounded bg-gray-700 border border-gray-600"
        />
        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={handleChange}
          required
          className="w-full p-3 rounded bg-gray-700 border border-gray-600"
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo"
          value={form.correo}
          onChange={handleChange}
          required
          className="w-full p-3 rounded bg-gray-700 border border-gray-600"
        />
        <input
          type="password"
          name="contrasena"
          placeholder="Contraseña"
          value={form.contrasena}
          onChange={handleChange}
          required
          className="w-full p-3 rounded bg-gray-700 border border-gray-600"
        />
        <input
          type="tel"
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-700 border border-gray-600"
        />
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 transition p-3 rounded font-semibold"
        >
          Registrarse
        </button>
        {mensaje && <p className="text-center mt-4">{mensaje}</p>}
      </form>
    </div>
  );
}
