"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACK_URL, getAuthHeaders } from "@/config/api";

export default function MisAsistenciasDocentePage() {
  return (
    <ProtectedRoute roles={["docente"]}>
      <MisAsistenciasDocenteContenido />
    </ProtectedRoute>
  );
}

function MisAsistenciasDocenteContenido() {
  const { usuario } = useAuth();
  const headers = useMemo(() => ({ Accept: "application/json", ...getAuthHeaders() }), []);

  const [comisiones,  setComisiones]  = useState([]); // [{comision, asistencias[]}]
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!usuario) return;

    (async () => {
      setLoading(true); setError("");
      try {
        // 1. Obtener el profesor por DNI
        const resProf = await fetch(`${BACK_URL}/api/profesores`, { headers });
        const profList = await resProf.json();
        const profesor = profList.find(p => p.dni === usuario.referenciaId || p.dni === usuario.dni);

        if (!profesor) throw new Error("No encontramos tu perfil de docente.");

        // 2. Obtener todas las comisiones
        const resCom = await fetch(`${BACK_URL}/api/comisiones`, { headers });
        const todasCom = await resCom.json();
        const misComisiones = todasCom.filter(c => String(c.profesorId) === String(profesor.profesorId));

        if (misComisiones.length === 0) { setComisiones([]); setLoading(false); return; }

        // 3. Para cada comisión obtener asistencias del docente
        const resultados = await Promise.all(
          misComisiones.map(async (com) => {
            const [resDetalle, resAsis] = await Promise.all([
              fetch(`${BACK_URL}/api/comisiones/${com.comisionId}`, { headers }),
              fetch(`${BACK_URL}/api/asistencias?comisionId=${com.comisionId}`, { headers }),
            ]);

            const detalle   = resDetalle.ok ? await resDetalle.json() : com;
            const asistencias = resAsis.ok  ? await resAsis.json()   : [];

            // Filtrar solo asistencias del docente
            const misAsist = Array.isArray(asistencias)
              ? asistencias.filter(
                  a => String(a.usuarioId) === String(profesor.dni) && a.tipoUsuario === "PROFESOR"
                )
              : [];

            return { comision: detalle, asistencias: misAsist };
          })
        );

        setComisiones(resultados);
      } catch (e) {
        setError(e.message ?? "Error al cargar tus asistencias.");
      } finally {
        setLoading(false);
      }
    })();
  }, [usuario, headers]);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mi asistencia</h1>
          <p className="mt-1 text-sm text-gray-500">
            Historial de tus asistencias como docente — {usuario?.nombre}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white py-16 shadow-sm ring-1 ring-gray-200">
            <svg className="h-5 w-5 animate-spin text-green-700" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span className="text-sm text-gray-500">Cargando tus asistencias...</span>
          </div>
        )}

        {!loading && !error && comisiones.length === 0 && (
          <div className="rounded-2xl bg-white px-5 py-12 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm font-medium text-gray-600">No tenés comisiones asignadas.</p>
          </div>
        )}

        {!loading && !error && comisiones.length > 0 && (
          <div className="flex flex-col gap-5">
            {comisiones.map(({ comision, asistencias }) => (
              <ComisionDocenteCard
                key={comision.comisionId ?? comision.id}
                comision={comision}
                asistencias={asistencias}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function ComisionDocenteCard({ comision, asistencias }) {
  const fechas = [...new Set(asistencias.map(a => a.fecha).filter(Boolean))].sort();
  const presentes = new Set(asistencias.filter(a => a.estado === "PRESENTE").map(a => a.fecha));

  const totalClases   = fechas.length;
  const totalPresente = presentes.size;
  const porcentaje    = totalClases > 0 ? Math.round((totalPresente / totalClases) * 100) : null;

  const colorPorcentaje =
    porcentaje === null ? "text-gray-400"
    : porcentaje >= 75  ? "text-green-700"
    : porcentaje >= 60  ? "text-amber-600"
    :                     "text-red-600";

  const nombreMateria = comision.materia?.nombre ?? comision.cod_comision ?? "Comisión";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div>
          <p className="text-sm font-bold text-gray-800">{nombreMateria}</p>
          <p className="mt-0.5 text-xs text-gray-500">Comisión: <strong>{comision.cod_comision}</strong></p>
        </div>
        {porcentaje !== null && (
          <div className="text-right shrink-0 ml-4">
            <p className={`text-2xl font-bold ${colorPorcentaje}`}>{porcentaje}%</p>
            <p className="text-xs text-gray-400">{totalPresente}/{totalClases} clases</p>
          </div>
        )}
      </div>

      {fechas.length === 0 ? (
        <p className="px-5 py-4 text-sm text-gray-400">Aún no hay clases registradas.</p>
      ) : (
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {fechas.map(fecha => {
              const presente = presentes.has(fecha);
              return (
                <div key={fecha} title={fecha}
                  className={`flex flex-col items-center rounded-lg border px-2.5 py-2 text-center min-w-[48px] ${
                    presente ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}>
                  <span className="text-xs text-gray-500 leading-tight">{formatFecha(fecha)}</span>
                  <span className={`mt-1 text-sm font-bold ${presente ? "text-green-700" : "text-red-600"}`}>
                    {presente ? "P" : "A"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-green-200"/>Presente</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-200"/>Ausente</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatFecha(f) {
  const p = f.split("-");
  return p.length < 3 ? f : `${p[2]}/${p[1]}`;
}
