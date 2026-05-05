"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AsistenciaGrid from "@/components/AsistenciaGrid";
import { BACK_URL, getAuthHeaders } from "@/config/api";

export default function AsistenciaPage() {
  return (
    <ProtectedRoute roles={["docente", "administrador"]}>
      <AsistenciaContenido />
    </ProtectedRoute>
  );
}

function AsistenciaContenido() {
  const router      = useRouter();
  const { usuario } = useAuth();
  const isDocente   = usuario?.rol === "docente";
  const headers     = useMemo(() => ({ Accept: "application/json", ...getAuthHeaders() }), []);

  const [comisiones,  setComisiones]  = useState([]);
  const [comisionId,  setComisionId]  = useState("");
  const [loadingCat,  setLoadingCat]  = useState(true);
  const [error,       setError]       = useState("");

  const [fechas,      setFechas]      = useState([]);
  const [alumnos,     setAlumnos]     = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading,     setLoading]     = useState(false);

  // ── Cargar comisiones según rol ──────────────────────────────
  // DOCENTE → solo sus comisiones
  // ADMIN   → todas las comisiones
  useEffect(() => {
    if (!BACK_URL || !usuario) return;

    (async () => {
      setLoadingCat(true); setError("");
      try {
        if (isDocente) {
          // Buscar el profesorId del docente logueado
          const [resProf, resCom] = await Promise.all([
            fetch(`${BACK_URL}/api/profesores`, { headers }),
            fetch(`${BACK_URL}/api/comisiones`, { headers }),
          ]);
          const profList = await resProf.json();
          const comList  = await resCom.json();

          const profesor = profList.find(
            p => p.dni === usuario.referenciaId || p.dni === usuario.dni
          );

          if (!profesor) { setError("No encontramos tu perfil de docente."); return; }

          // Solo las comisiones que le pertenecen
          const misComisiones = Array.isArray(comList)
            ? comList.filter(c => String(c.profesorId) === String(profesor.profesorId))
            : [];

          setComisiones(misComisiones);
        } else {
          // Admin: todas las comisiones
          const res  = await fetch(`${BACK_URL}/api/comisiones`, { headers });
          const data = await res.json();
          setComisiones(Array.isArray(data) ? data : []);
        }
      } catch {
        setError("Error cargando las comisiones.");
      } finally {
        setLoadingCat(false);
      }
    })();
  }, [usuario, isDocente, headers]);

  const comisionInfo = comisiones.find(c => c.comisionId === comisionId);

  // ── Cargar asistencias al elegir comisión ───────────────────
  useEffect(() => {
    if (!comisionId || !BACK_URL) return;
    setLoading(true); setError("");
    (async () => {
      try {
        const [resAsis, resCom] = await Promise.all([
          fetch(`${BACK_URL}/api/asistencias?comisionId=${comisionId}`, { headers }),
          fetch(`${BACK_URL}/api/comisiones/${comisionId}`,             { headers }),
        ]);
        if (!resAsis.ok) throw new Error("Error cargando asistencias");

        const registros = await resAsis.json();
        const comData   = resCom.ok ? await resCom.json() : comisionInfo;

        const estudiantesMatric  = comData?.estudiantes ?? [];
        const alumnosFormateados = estudiantesMatric.map(e => ({
          id:      e.dni,
          dni:     e.dni,
          apellido: e.nombre_apellido,
        }));

        const soloEstudiantes = registros.filter(r => r.tipoUsuario === "ESTUDIANTE");
        const fechasOrd = [...new Set(soloEstudiantes.map(r => r.fecha).filter(Boolean))].sort();
        const asisFormateadas = soloEstudiantes
          .filter(r => r.estado === "PRESENTE")
          .map(r => ({ alumnoId: String(r.usuarioId), fecha: r.fecha }));

        setFechas(fechasOrd);
        setAlumnos(alumnosFormateados);
        setAsistencias(asisFormateadas);
      } catch (e) {
        setError(e.message ?? "Error.");
      } finally {
        setLoading(false);
      }
    })();
  }, [comisionId, headers]);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">

        {/* Encabezado */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Asistencias</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isDocente
                ? "Asistencia de tus alumnos por comisión"
                : "Historial de asistencia por comisión"}
            </p>
          </div>

          {/* Tab Docentes — solo el admin lo necesita */}
          {!isDocente && (
            <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 self-start sm:self-auto">
              <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-green-800 shadow-sm">
                🧑‍🎓 Estudiantes
              </div>
              <button
                onClick={() => router.push("/asistencia-docente")}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                👨‍🏫 Docentes
              </button>
            </div>
          )}
        </div>

        {/* Selector de comisión — un solo select, simple y directo */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="comision" className="text-sm font-medium text-gray-700">
              {isDocente ? "Tu comisión" : "Comisión"}
            </label>
            <select
              id="comision"
              value={comisionId}
              onChange={e => {
                setComisionId(e.target.value);
                setFechas([]); setAlumnos([]); setAsistencias([]);
              }}
              disabled={loadingCat || comisiones.length === 0}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
            >
              <option value="">
                {loadingCat
                  ? "Cargando..."
                  : comisiones.length === 0
                  ? "Sin comisiones disponibles"
                  : isDocente
                  ? "Seleccioná una de tus comisiones"
                  : "Seleccionar comisión"}
              </option>
              {comisiones.map(c => (
                <option key={c.comisionId} value={c.comisionId}>
                  {c.cod_comision}{c.materia?.nombre ? ` — ${c.materia.nombre}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info de la comisión elegida */}
        {comisionInfo && (
          <div className="mb-4 flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="w-1.5 shrink-0 bg-green-700" />
            <div className="flex flex-wrap gap-4 px-5 py-3 text-xs text-gray-500">
              <span><strong className="text-gray-700">Comisión:</strong> {comisionInfo.cod_comision}</span>
              {comisionInfo.materia?.nombre && (
                <span><strong className="text-gray-700">Materia:</strong> {comisionInfo.materia.nombre}</span>
              )}
              {/* El admin ve el nombre del docente, el docente ya lo sabe */}
              {!isDocente && comisionInfo.profesor?.nombre_apellido && (
                <span><strong className="text-gray-700">Docente:</strong> {comisionInfo.profesor.nombre_apellido}</span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!comisionId && !loading && (
          <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-200">
            {isDocente
              ? "Seleccioná una de tus comisiones para ver la asistencia de tus alumnos."
              : "Seleccioná una comisión para ver la grilla."}
          </div>
        )}

        {comisionId && loading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white py-12 shadow-sm ring-1 ring-gray-200">
            <svg className="h-5 w-5 animate-spin text-green-700" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm text-gray-500">Cargando asistencias...</span>
          </div>
        )}

        {comisionId && !loading && !error && (
          <AsistenciaGrid
            titulo={`Asistencia — ${comisionInfo?.cod_comision ?? ""}`}
            headerNombre="Nombre y apellido"
            fechas={fechas}
            alumnos={alumnos}
            asistencias={asistencias}
            mostrarDni={true}
            mostrarVolver={false}
          />
        )}

      </div>
    </div>
  );
}
