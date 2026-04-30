"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Header global de la aplicación.
 * Muestra logo, nombre del sistema, usuario logueado y botón de logout.
 */
export default function Header() {
  const router = useRouter();

  // TODO: Reemplazar por datos reales del contexto de autenticación
  const user = {
    nombre: "Admin",
    rol: "administrador",
  };

  const rolLabel = {
    alumno: "Alumno",
    docente: "Docente",
    administrador: "Área Académica",
  };

  const rolColor = {
    alumno: "bg-blue-100 text-blue-800",
    docente: "bg-amber-100 text-amber-800",
    administrador: "bg-emerald-100 text-emerald-800",
  };

  function handleLogout() {
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-green-900 shadow-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* ── Logo + Nombre ── */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-900"
          aria-label="Ir al inicio — Tekoá-Hur"
        >
          {/* Usamos <img> estándar para evitar problemas de configuración de dominios en Next.js Image */}
          <img
            src="/logo.png"
            alt="Logo Tekoá-Hur"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full bg-white object-contain p-0.5"
          />
          <span className="text-base font-semibold text-white sm:text-lg">
            Tekoá-Hur
          </span>
        </Link>

        {/* ── Rol + Nombre + Logout ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium sm:flex ${rolColor[user.rol]}`}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
            {rolLabel[user.rol]}
          </div>

          <span className="hidden text-sm text-green-200 md:block">
            {user.nombre}
          </span>

          <button
            onClick={handleLogout}
            className="rounded border border-green-700 bg-green-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
