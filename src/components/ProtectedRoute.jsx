"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PropTypes from "prop-types";

/**
 * ProtectedRoute — Protege páginas que requieren autenticación.
 *
 * Comportamiento:
 *  - loading === true  → muestra spinner (espera a que el contexto hidrate)
 *  - sin sesión        → redirige a /login
 *  - rol no permitido  → redirige a /
 *  - ok                → renderiza children
 *
 * Uso:
 *   <ProtectedRoute roles={["administrador"]}>
 *     <MiPagina />
 *   </ProtectedRoute>
 *
 *   // Sin restricción de rol (cualquier usuario logueado):
 *   <ProtectedRoute>
 *     <MiPagina />
 *   </ProtectedRoute>
 */
//export default function ProtectedRoute({ children, roles =  [] ,}) {
export default function ProtectedRoute(props) {
  const {
    children,
    roles = [],
  } = props;
  const router               = useRouter();
  const { usuario, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // esperar a que hidrate

    if (!usuario) {
      router.replace("/login");
      return;
    }

    //if (roles.length > 0 && !roles.includes(usuario.rol)) {}
    if (roles?.length > 0 && !roles.includes(usuario.rol)) {
      router.push("/");
    }
  }, [loading, usuario, roles, router]);

  // Mientras hidrata → spinner centrado
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <svg className="h-8 w-8 animate-spin text-green-700" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

 // Sin sesión
  if (!usuario) return null;

  // Rol inválido
  //if (
  //  tieneRoles &&
  //  !roles.includes(usuario.rol)
  //) {
  //  return null;
  //}

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  roles: PropTypes.arrayOf(PropTypes.string),
};