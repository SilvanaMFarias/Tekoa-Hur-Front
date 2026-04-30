"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Pantalla de Login.
 *
 * TODO: Conectar con el backend:
 *  - POST /api/auth/login  { dni, password }
 *  - Guardar token JWT en cookie HttpOnly o localStorage
 *  - Redirigir según el rol recibido
 */
export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ dni: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validación básica en cliente
    if (!form.dni.trim()) {
      setError("Ingresá tu DNI.");
      return;
    }
    if (!form.password.trim()) {
      setError("Ingresá tu contraseña.");
      return;
    }

    setLoading(true);
    try {
      // TODO: Reemplazar con llamada real al backend
      // const res = await authService.login(form.dni, form.password);
      // guardarToken(res.token);
      // redirigirSegunRol(res.user.rol);

      // Simulación temporal — quitar cuando esté el backend de auth
      await new Promise((r) => setTimeout(r, 800));
      router.push("/");
    } catch (err) {
      setError(err?.message ?? "DNI o contraseña incorrectos. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm px-4">
      <div className="rounded-2xl bg-white p-8 shadow-lg">

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-green-50 p-1 ring-2 ring-green-200">
            <Image
              src="/logo.png"
              alt="Logo Tekoá-Hur"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Tekoá-Hur</h1>
            <p className="text-sm text-gray-500">Control de Asistencias</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

          {/* DNI */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="dni"
              className="text-sm font-medium text-gray-700"
            >
              DNI
            </label>
            <input
              id="dni"
              name="dni"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              placeholder="Ej: 35123456"
              value={form.dni}
              onChange={handleChange}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <p
              id="login-error"
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </button>

        </form>

        {/* Nota de soporte */}
        <p className="mt-5 text-center text-xs text-gray-400">
          ¿Problemas para ingresar? Contactá al Área Académica.
        </p>
      </div>
    </div>
  );
}
