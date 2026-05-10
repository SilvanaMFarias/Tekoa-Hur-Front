export const BACK_URL    = process.env.NEXT_PUBLIC_BACK_URL;
export const BASIC_USER  = process.env.NEXT_PUBLIC_BASIC_USER;
export const BASIC_PASS  = process.env.NEXT_PUBLIC_BASIC_PASS;

/**
 * getAuthHeaders — Devuelve los headers de autorización correctos.
 *
 * Prioridad:
 *  1. JWT Bearer (si hay token en localStorage) — usado por el sistema de roles
 *  2. Basic Auth (fallback para compatibilidad)
 *
 * Uso:
 *   fetch(`${BACK_URL}/api/comisiones`, { headers: getAuthHeaders() })
 */
export function getAuthHeaders() {
  // Intentar JWT primero (disponible solo en cliente)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("tekoa_token");
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    }
  }

  // Fallback: Basic Auth (durante desarrollo sin JWT)
  if (BASIC_USER && BASIC_PASS) {
    return {
      Authorization: `Basic ${btoa(`${BASIC_USER}:${BASIC_PASS}`)}`,
    };
  }

  return {};
}
