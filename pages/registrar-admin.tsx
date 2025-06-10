// auraklak/pages/registrar-admin.tsx
// Importante: No uses 'use client' en la primera línea de este archivo.
// Solo lo usará el componente real que está más abajo.

import dynamic from 'next/dynamic';
import { useState } from 'react'; // Necesitarás estos imports aquí
import Link from 'next/link';     // Necesitarás estos imports aquí

// Define el componente directamente dentro de este archivo, pero solo para ser importado dinámicamente.
// NO LO EXPORTES COMO DEFAULT; exportalo como un componente nombrado.
const RegistrarAdminComponent = dynamic(async () => {
    // Aquí va el código que era de components/RegistrarAdminForm.tsx
    // Con la directiva 'use client' DENTRO de esta función (o en el archivo real si lo mueves).
    // Aunque dynamic con ssr: false hace que no se evalúe en el servidor,
    // la directiva 'use client' es para el funcionamiento de React en el navegador.

    // Simplemente pega todo el contenido de RegistrarAdminForm.tsx aquí dentro,
    // asegurándote de que la primera línea DENTRO de esta función sea 'use client';
    return function ClientOnlyRegistrarAdmin() {
        'use client'; // ¡Esta directiva es crucial y NECESARIA aquí!

        const [usuario, setUsuario] = useState('');
        const [contrasena, setContrasena] = useState('');
        const [mensaje, setMensaje] = useState('');

        const handleRegistro = async (e: React.FormEvent) => {
            e.preventDefault();
            setMensaje('');

            try {
                const res = await fetch('/api/registrar-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ usuario, contrasena }),
                });

                if (!res) {
                    setMensaje('Error: No se recibió respuesta del servidor.');
                    return;
                }

                const data = await res.json();

                if (res.status === 201) {
                    setMensaje('¡Administrador registrado con éxito!');
                    setUsuario('');
                    setContrasena('');
                } else {
                    setMensaje(`Error: ${data.mensaje || 'Ocurrió un error desconocido.'}`);
                }
            } catch (err: any) {
                console.error('Error al registrar administrador:', err);
                setMensaje('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
            }
        };

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 p-4">
                <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700 animate-fade-in">
                    <h2 className="text-4xl font-extrabold text-purple-400 text-center mb-8 drop-shadow-md">
                        Registrar Administrador
                    </h2>
                    <form onSubmit={handleRegistro} className="space-y-6">
                        <div>
                            <label
                                htmlFor="usuario"
                                className="block text-lg font-medium text-purple-300 mb-2"
                            >
                                Usuario:
                            </label>
                            <input
                                type="text"
                                id="usuario"
                                placeholder="Escribe el nombre de usuario"
                                className="w-full p-4 border border-purple-600 rounded-lg shadow-inner bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="contrasena"
                                className="block text-lg font-medium text-purple-300 mb-2"
                            >
                                Contraseña:
                            </label>
                            <input
                                type="password"
                                id="contrasena"
                                placeholder="Crea una contraseña segura"
                                className="w-full p-4 border border-purple-600 rounded-lg shadow-inner bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-4 mt-8">
                            <button
                                type="submit"
                                className="w-full px-8 py-4 bg-purple-700 text-white font-bold text-xl rounded-lg hover:bg-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-glow-md"
                            >
                                Registrar Administrador
                            </button>
                            <Link
                                href="/"
                                className="text-center text-sm text-purple-400 hover:text-purple-300 transition"
                            >
                                ← Volver al inicio
                            </Link>
                        </div>
                    </form>

                    {mensaje && (
                        <p
                            className={`mt-6 text-center text-lg ${
                                mensaje.includes('éxito') ? 'text-green-400' : 'text-red-400'
                            } animate-pulse`}
                        >
                            {mensaje}
                        </p>
                    )}
                </div>
            </div>
        );
    };
}, { ssr: false }); // ¡ssr: false es CRÍTICO aquí!

// Este es el componente de la página real que exporta Next.js
export default function RegistrarAdminPage() {
  return <RegistrarAdminComponent />;
}