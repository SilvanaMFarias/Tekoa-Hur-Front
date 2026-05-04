"use client";

import { useEffect, useState } from "react";
import { BACK_URL, getAuthHeaders } from "@/config/api"; // ✅ igual que el resto del proyecto

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [busqueda, setBusqueda]       = useState("");

  useEffect(() => {
    fetch(`${BACK_URL}/api/estudiantes`, {
      headers: getAuthHeaders(), // ✅ envía Basic Auth
    })
      .then((r) => r.json())
      .then((data) => setEstudiantes(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar los estudiantes."))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = estudiantes.filter((e) => {
    const texto = busqueda.toLowerCase();
    return (
      e.dni?.toString().includes(texto) ||
      e.nombre_apellido?.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Estudiantes</h1>
            <p className="mt-1 text-sm text-gray-500">
              Padrón de estudiantes registrados en el sistema.
            </p>
          </div>
          <input
            type="search"
            placeholder="Buscar por DNI o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 sm:w-64"
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <svg className="h-5 w-5 animate-spin text-green-700" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm text-gray-500">Cargando estudiantes...</span>
            </div>
          ) : error ? (
            <p role="alert" className="px-6 py-4 text-sm text-red-700">{error}</p>
          ) : (
            <>
              <div className="border-b border-gray-100 px-5 py-3">
                <span className="text-xs text-gray-400">
                  {filtrados.length} {filtrados.length === 1 ? "estudiante" : "estudiantes"}
                  {busqueda && ` para "${busqueda}"`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="w-32 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        DNI
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Nombre y apellido
                      </th>
                      <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">
                        Comisiones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-400">
                          No se encontraron estudiantes.
                        </td>
                      </tr>
                    ) : (
                      filtrados.map((est) => (
                        <tr key={est.dni} className="transition hover:bg-gray-50">
                          <td className="px-5 py-3.5 font-mono text-sm text-gray-600">
                            {est.dni}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-gray-800">
                            {est.nombre_apellido}
                          </td>
                          <td className="hidden px-5 py-3.5 sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(est.comisiones ?? []).map((c) => (
                                <span
                                  key={c.comisionId}
                                  className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                                >
                                  {c.cod_comision}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
