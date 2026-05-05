"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const BACK_URL = process.env.NEXT_PUBLIC_BACK_URL;

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <PerfilContenido />
    </ProtectedRoute>
  );
}

function PerfilContenido() {
  const router              = useRouter();
  const { usuario, logout } = useAuth();

  const [form, setForm] = useState({
    passwordActual: "",
    passwordNueva:  "",
    passwordRepeat: "",
  });
  const [estado,  setEstado]  = useState("idle");
  const [mensaje, setMensaje] = useState("");

  const rolLabel = {
    alumno:        "Alumno",
    docente:       "Docente",
    administrador: "Área Académica",
  };

  function handleChange(e) {
    setEstado("idle");
    setMensaje("");
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje("");

    if (!form.passwordActual) { setMensaje("Ingresá tu contraseña actual."); setEstado("error"); return; }
    if (!form.passwordNueva)  { setMensaje("Ingresá la nueva contraseña.");  setEstado("error"); return; }
    if (form.passwordNueva.length < 6) { setMensaje("La nueva contraseña debe tener al menos 6 caracteres."); setEstado("error"); return; }
    if (form.passwordNueva !== form.passwordRepeat) { setMensaje("Las contraseñas nuevas no coinciden."); setEstado("error"); return; }

    setEstado("loading");
    try {
      const token = localStorage.getItem("tekoa_token");
      const res   = await fetch(`${BACK_URL}/api/auth/cambiar-password`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ passwordActual: form.passwordActual, passwordNueva: form.passwordNueva }),
      });
      const data = await res.json();

      if (!res.ok) { setEstado("error"); setMensaje(data.message ?? "Error al actualizar."); return; }

      setEstado("success");
      setMensaje(data.message);
      setForm({ passwordActual: "", passwordNueva: "", passwordRepeat: "" });
      setTimeout(() => { logout(); router.push("/login"); }, 2500);
    } catch {
      setEstado("error");
      setMensaje("No se pudo conectar con el servidor.");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mi perfil</h1>
          <p className="mt-1 text-sm text-gray-500">Administrá tus datos de acceso</p>
        </div>

        {/* Datos del usuario */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              {usuario.rol === "alumno" ? "🎓" : usuario.rol === "docente" ? "👨‍🏫" : "🔑"}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-800">{usuario.nombre}</p>
              <p className="text-sm text-gray-500">DNI: {usuario.dni}</p>
              <span className="mt-1 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {rolLabel[usuario.rol]}
              </span>
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-base font-semibold text-gray-800">Cambiar contraseña</h2>

          {estado === "success" && (
            <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              ✓ {mensaje} — Redirigiendo al login...
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {[
              { id: "passwordActual", label: "Contraseña actual",        placeholder: "Tu contraseña actual",      complete: "current-password" },
              { id: "passwordNueva",  label: "Nueva contraseña",          placeholder: "Mínimo 6 caracteres",        complete: "new-password" },
              { id: "passwordRepeat", label: "Repetir nueva contraseña",  placeholder: "Repetí la nueva contraseña", complete: "new-password" },
            ].map(({ id, label, placeholder, complete }) => (
              <div key={id} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
                <input
                  id={id} name={id} type="password" autoComplete={complete}
                  placeholder={placeholder}
                  value={form[id]} onChange={handleChange}
                  disabled={estado === "loading" || estado === "success"}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
                />
              </div>
            ))}

            {estado === "error" && mensaje && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{mensaje}</p>
            )}

            <button
              type="submit"
              disabled={estado === "loading" || estado === "success"}
              className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {estado === "loading" ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400">
            Al cambiar tu contraseña vas a tener que volver a iniciar sesión.
          </p>
        </div>
      </div>
    </div>
  );
}
