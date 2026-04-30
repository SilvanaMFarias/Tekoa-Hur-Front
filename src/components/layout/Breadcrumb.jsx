"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ✅ Todas las rutas reales del proyecto mapeadas a etiquetas legibles
const ROUTE_LABELS = {
  "":                      "Inicio",
  "generar-qr":            "Generar QR del Aula",
  "leer-qr":               "Leer Código QR",
  "asistencia":            "Asistencias",
  "asistencia-docente":    "Asistencias Docentes",
  "registrar-asistencia":  "Registrar Asistencia",
  "importar":              "Importar Planilla",
  "login":                 "Iniciar Sesión",
  "dashboard":             "Panel Principal",
  "reportes":              "Reportes",
  "aulas":                 "Aulas",
  "comisiones":            "Comisiones",
  "estudiantes":           "Estudiantes",
  "docentes":              "Docentes",
  "prueba-conexion":       "Listado de Estudiantes",
};

export default function Breadcrumb() {
  const pathname = usePathname();

  // No mostrar en inicio ni en registrar-asistencia (pantalla pública de QR)
  if (pathname === "/" || pathname === "/login") return null;

  const segments = pathname.split("/").filter(Boolean);

  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = ROUTE_LABELS[segment] ?? capitalizeFirst(segment);
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav
      aria-label="Ruta de navegación"
      className="w-full border-b border-gray-200 bg-gray-50"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-xs text-gray-500 transition hover:text-green-700 focus:outline-none focus-visible:text-green-700"
        >
          Inicio
        </Link>

        {items.map(({ href, label, isLast }) => (
          <span key={href} className="flex items-center gap-1.5">
            <span className="text-xs text-gray-300" aria-hidden="true">›</span>
            {isLast ? (
              <span className="shrink-0 text-xs font-medium text-green-800" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="shrink-0 text-xs text-gray-500 transition hover:text-green-700 focus:outline-none focus-visible:text-green-700"
              >
                {label}
              </Link>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}

function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
