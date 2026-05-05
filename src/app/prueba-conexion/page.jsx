"use client";

import { useEffect, useState } from "react";
import { BACK_URL, getAuthHeaders } from "@/config/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function EstudiantesPage() {
  return (
    <ProtectedRoute roles={["docente", "administrador"]}>
      <EstudiantesContenido />
    </ProtectedRoute>
  );
}

function EstudiantesContenido() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [busqueda,    setBusqueda]    = useState("");

  useEffect(() => {
    fetch(`${BACK_URL}/api/estudiantes`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setEstudiantes(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar los estudiantes."))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = estudiantes.filter(e => {
    const t = busqueda.toLowerCase();
    return e.dni?.toString().includes(t) || e.nombre_apellido?.toLowerCase().includes(t);
  });

  return (
    <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">

        {/* Encabezado */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">Estudiantes</h1>
            <p className="mt-0.5 text-sm text-gray-500">Padrón de estudiantes registrados</p>
          </div>
          <input
            type="search"
            placeholder="Buscar por DNI o nombre..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 sm:w-60"
          />
        </div>

        {/* Contenido */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-14">
              <svg className="h-5 w-5 animate-spin text-green-700" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <span className="text-sm text-gray-500">Cargando...</span>
            </div>
          ) : error ? (
            <p className="px-5 py-4 text-sm text-red-700">{error}</p>
          ) : (
            <>
              <div className="border-b border-gray-100 px-4 py-2.5">
                <span className="text-xs text-gray-400">
                  {filtrados.length} {filtrados.length === 1 ? "estudiante" : "estudiantes"}
                  {busqueda && ` para "${busqueda}"`}
                </span>
              </div>

              {/* Vista desktop: tabla */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-32">DNI</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre y apellido</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Comisiones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtrados.length === 0 ? (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-400">No se encontraron estudiantes.</td></tr>
                    ) : filtrados.map(est => (
                      <tr key={est.dni} className="transition hover:bg-gray-50">
                        <td className="px-5 py-3 font-mono text-sm text-gray-600">{est.dni}</td>
                        <td className="px-5 py-3 font-medium text-gray-800">{est.nombre_apellido}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(est.comisiones ?? []).map(c => (
                              <span key={c.comisionId} className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                {c.cod_comision}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista mobile: tarjetas */}
              <div className="sm:hidden divide-y divide-gray-100">
                {filtrados.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">No se encontraron estudiantes.</p>
                ) : filtrados.map(est => (
                  <div key={est.dni} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{est.nombre_apellido}</p>
                        <p className="mt-0.5 font-mono text-xs text-gray-500">{est.dni}</p>
                      </div>
                    </div>
                    {(est.comisiones ?? []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {est.comisiones.map(c => (
                          <span key={c.comisionId} className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            {c.cod_comision}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
