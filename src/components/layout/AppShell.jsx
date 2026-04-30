import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/layout/Breadcrumb";

/**
 * AppShell — Estructura base de toda la aplicación.
 *
 * Incluye:
 *  - Header fijo con logo, rol y logout
 *  - Breadcrumb automático (invisible en "/")
 *  - Área de contenido principal
 *  - Footer institucional
 *
 * Uso: se aplica en layout.js, no hace falta importarlo en cada página.
 *
 * @param {React.ReactNode} children - Contenido de la página actual
 */
export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">

      {/* ── Header global (sticky) ── */}
      <Header />

      {/* ── Breadcrumb (se auto-oculta en "/") ── */}
      <Breadcrumb />

      {/* ── Contenido de la página ── */}
      <main
        id="main-content"
        className="flex flex-1 flex-col"
        role="main"
      >
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-center text-xs text-gray-400">
            Tekoá-Hur — Sistema de Control de Asistencias Académicas
          </p>
        </div>
      </footer>

    </div>
  );
}
