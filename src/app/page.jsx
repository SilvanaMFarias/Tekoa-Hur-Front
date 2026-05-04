"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect }  from "react";
import { useAuth }    from "@/context/AuthContext";

/**
 * Definición del menú con control de acceso por rol.
 *
 * roles: qué roles pueden ver este ítem.
 *  - Si roles está vacío → visible para todos los autenticados.
 *  - Si no está autenticado → redirige al login.
 */
const MENU_ITEMS = [
  {
    href:        "/generar-qr",
    label:       "Generar QR del Aula",
    description: "Creá un código QR para identificar un aula",
    icon:        "🏛️",
    variant:     "primary",
    roles:       ["docente", "administrador"],
  },
  {
    href:        "/leer-qr",
    label:       "Leer Código QR",
    description: "Escaneá un QR para registrar asistencia",
    icon:        "📷",
    variant:     "secondary",
    roles:       ["alumno", "docente", "administrador"],
  },
  {
    href:        "/asistencia",
    label:       "Listado de Asistencia",
    description: "Consultá el historial de asistencias por comisión",
    icon:        "📋",
    variant:     "secondary",
    roles:       ["docente", "administrador"],
  },
  {
    href:        "/importar",
    label:       "Cargar Planilla",
    description: "Importá el archivo Excel con comisiones y alumnos",
    icon:        "📊",
    variant:     "secondary",
    roles:       ["administrador"],
  },
  {
    href:        "/prueba-conexion",
    label:       "Listado de Estudiantes",
    description: "Visualizá el padrón de estudiantes registrados",
    icon:        "👥",
    variant:     "secondary",
    roles:       ["docente", "administrador"],
  },
];

export default function HomePage() {
  const router          = useRouter();
  const { usuario, loading } = useAuth();

  // Si no está logueado → redirigir al login
  useEffect(() => {
    if (!loading && !usuario) {
      router.push("/login");
    }
  }, [loading, usuario, router]);

  if (loading || !usuario) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-green-700" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  // Filtrar ítems según el rol del usuario logueado
  const itemsVisibles = MENU_ITEMS.filter(
    (item) => item.roles.length === 0 || item.roles.includes(usuario.rol)
  );

  const pares    = itemsVisibles.slice(0, itemsVisibles.length % 2 === 0 ? itemsVisibles.length : -1);
  const huerfano = itemsVisibles.length % 2 !== 0 ? [itemsVisibles[itemsVisibles.length - 1]] : [];

  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-10 sm:px-6 sm:py-14">
      <div className="w-full max-w-2xl">

        {/* Bienvenida personalizada */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Hola, {usuario.nombre.split(" ")[0]} 👋
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            ¿Qué querés hacer hoy?
          </p>
        </div>

        {/* Grilla de opciones filtradas por rol */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {pares.map((item) => (
            <MenuCard key={item.href} item={item} />
          ))}
        </div>

        {/* Ítem huérfano centrado */}
        {huerfano.length > 0 && (
          <div className="mt-3 flex justify-center">
            <div className="w-full sm:w-1/2">
              <MenuCard item={huerfano[0]} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function MenuCard({ item }) {
  const isPrimary = item.variant === "primary";

  return (
    <Link
      href={item.href}
      className={`
        group flex items-start gap-4 rounded-2xl border p-5 transition
        focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2
        ${isPrimary
          ? "border-green-800 bg-green-800 hover:bg-green-700"
          : "border-green-200 bg-white hover:border-green-400 hover:shadow-sm"
        }
      `}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
          isPrimary ? "bg-green-700" : "bg-green-50"
        }`}
        aria-hidden="true"
      >
        {item.icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className={`text-sm font-semibold leading-tight ${isPrimary ? "text-white" : "text-gray-800"}`}>
          {item.label}
        </span>
        <span className={`text-xs leading-snug ${isPrimary ? "text-green-200" : "text-gray-500"}`}>
          {item.description}
        </span>
      </div>
    </Link>
  );
}
