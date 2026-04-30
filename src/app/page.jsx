import Link from "next/link";

/**
 * Página principal — Menú de navegación por módulos.
 *
 * El menú se adapta al rol del usuario (pendiente de conectar con AuthContext).
 * Por ahora muestra todas las opciones disponibles.
 *
 * Responsive:
 *  - Mobile: 1 columna
 *  - Tablet (sm): 2 columnas
 *  - Desktop (lg): 3 columnas con ítem destacado
 */

const MENU_ITEMS = [
  {
    href: "/generar-qr",
    label: "Generar QR del Aula",
    description: "Creá un código QR para identificar un aula",
    icon: "🏛️",
    variant: "primary",
    roles: ["administrador"],
  },
  {
    href: "/leer-qr",
    label: "Leer Código QR",
    description: "Escaneá un QR para registrar asistencia",
    icon: "📷",
    variant: "secondary",
    roles: ["alumno", "docente", "administrador"],
  },
  {
    href: "/asistencia",
    label: "Listado de Asistencia",
    description: "Consultá el historial de asistencias por comisión",
    icon: "📋",
    variant: "secondary",
    roles: ["docente", "administrador"],
  },
  {
    href: "/importar",
    label: "Cargar Planilla",
    description: "Importá el archivo Excel con comisiones y alumnos",
    icon: "📊",
    variant: "secondary",
    roles: ["administrador"],
  },
  {
    href: "/prueba-conexion",
    label: "Listado de Estudiantes",
    description: "Visualizá el padrón de estudiantes registrados",
    icon: "👥",
    variant: "secondary",
    roles: ["docente", "administrador"],
  },
];

export default function HomePage() {
  // TODO: Filtrar MENU_ITEMS según user.rol cuando esté el AuthContext
  const items = MENU_ITEMS;

  return (
    <div className="flex flex-1 flex-col items-center justify-start py-8 px-4 sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl">

        {/* Título de bienvenida */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            ¿Qué querés hacer?
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Seleccioná una opción para continuar
          </p>
        </div>

        {/* Grilla de opciones */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <MenuCard key={item.href} item={item} />
          ))}
        </div>

      </div>
    </div>
  );
}

/**
 * Tarjeta individual del menú.
 * Variante "primary" → fondo verde sólido (acción destacada).
 * Variante "secondary" → fondo blanco con borde verde.
 */
function MenuCard({ item }) {
  const isPrimary = item.variant === "primary";

  return (
    <Link
      href={item.href}
      className={`
        group flex items-start gap-4 rounded-2xl border p-5 transition
        focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2
        ${
          isPrimary
            ? "border-green-800 bg-green-800 hover:bg-green-700 text-white"
            : "border-green-200 bg-white hover:border-green-400 hover:shadow-sm text-gray-800"
        }
      `}
    >
      {/* Ícono */}
      <span
        className={`
          flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl
          ${isPrimary ? "bg-green-700" : "bg-green-50"}
        `}
        aria-hidden="true"
      >
        {item.icon}
      </span>

      {/* Texto */}
      <div className="flex flex-col gap-0.5">
        <span
          className={`text-sm font-semibold leading-tight ${
            isPrimary ? "text-white" : "text-gray-800"
          }`}
        >
          {item.label}
        </span>
        <span
          className={`text-xs leading-snug ${
            isPrimary ? "text-green-200" : "text-gray-500"
          }`}
        >
          {item.description}
        </span>
      </div>
    </Link>
  );
}
