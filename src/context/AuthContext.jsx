"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "tekoa_token";
const USER_KEY  = "tekoa_user";

/**
 * AuthProvider — Envuelve toda la app y provee el estado de autenticación.
 *
 * Expone:
 *  - usuario  : { usuarioId, dni, nombre, rol, referenciaId } | null
 *  - token    : string | null
 *  - loading  : boolean (true mientras verifica el token al inicio)
 *  - login(dni, password) : llama al backend y guarda el token
 *  - logout() : limpia el estado y redirige al login
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar: recuperar sesión del localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser  = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUsuario(JSON.parse(savedUser));
      }
    } catch {
      // localStorage no disponible (SSR) — ignorar
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * login — Autentica al usuario contra el backend.
   * @returns {{ ok: boolean, error?: string }}
   */
  async function login(dni, password) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_URL}/api/auth/login`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ dni: String(dni).trim(), password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return { ok: false, error: data.message ?? "Error al iniciar sesión." };
      }

      // Guardar en estado y localStorage
      setToken(data.token);
      setUsuario(data.usuario);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));

      return { ok: true };
    } catch {
      return { ok: false, error: "No se pudo conectar con el servidor." };
    }
  }

  /** logout — Limpia la sesión local. */
  function logout() {
    setToken(null);
    setUsuario(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* ignorar */ }
  }

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** useAuth — Hook para acceder al contexto de autenticación. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
