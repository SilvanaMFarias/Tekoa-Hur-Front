"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AsistenciaGrid from "@/components/AsistenciaGrid";
import { BACK_URL, getAuthHeaders } from "@/config/api";

export default function AsistenciaPage() {
  const router = useRouter();
  const [tab, setTab] = useState("estudiantes"); // "estudiantes" | "docentes"

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">

        {/* Encabezado + toggle de tabs */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Asistencias</h1>
            <p className="mt-1 text-sm text-gray-500">Historial de asistencia por comisión</p>
          </div>

          <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 self-start sm:self-auto">
            <TabBtn active={tab === "estudiantes"} onClick={() => setTab("estudiantes")}>
              🧑‍🎓 Estudiantes
            </TabBtn>
            <TabBtn active={tab === "docentes"} onClick={() => router.push("/asistencia-docente")}>
              👨‍🏫 Docentes
            </TabBtn>
          </div>
        </div>

        <TabEstudiantes />
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
        active ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Tab Estudiantes con AsistenciaGrid ──────────────────────── */
function TabEstudiantes() {
  const headers = useMemo(() => ({ Accept: "application/json", ...getAuthHeaders() }), []);

  const [materias,    setMaterias]    = useState([]);
  const [comisiones,  setComisiones]  = useState([]);
  const [materiaId,   setMateriaId]   = useState("");
  const [comisionId,  setComisionId]  = useState("");
  const [loadingCat,  setLoadingCat]  = useState(true);

  const [fechas,      setFechas]      = useState([]);
  const [alumnos,     setAlumnos]     = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  // Cargar materias y comisiones al montar
  useEffect(() => {
    if (!BACK_URL) { setError("Falta NEXT_PUBLIC_BACK_URL."); return; }
    Promise.all([
      fetch(`${BACK_URL}/api/materias`,   { headers }).then(r => r.json()),
      fetch(`${BACK_URL}/api/comisiones`, { headers }).then(r => r.json()),
    ])
      .then(([mats, coms]) => {
        setMaterias(Array.isArray(mats) ? mats : []);
        setComisiones(Array.isArray(coms) ? coms : []);
      })
      .catch(() => setError("Error cargando catálogo."))
      .finally(() => setLoadingCat(false));
  }, [headers]);

  // Comisiones filtradas por materia seleccionada
  const comisionesFiltradas = useMemo(() =>
    materiaId ? comisiones.filter(c => c.materiaId === materiaId) : [],
    [materiaId, comisiones]
  );

  const comisionInfo = comisiones.find(c => c.comisionId === comisionId);

  // Cuando cambia la materia resetear comisión
  function handleMateriaChange(e) {
    setMateriaId(e.target.value);
    setComisionId("");
    setFechas([]); setAlumnos([]); setAsistencias([]);
  }

  // Cargar asistencias cuando se elige comisión
  useEffect(() => {
    if (!comisionId) return;
    setLoading(true); setError("");
    (async () => {
      try {
        const [resAsis, resCom] = await Promise.all([
          fetch(`${BACK_URL}/api/asistencias?comisionId=${comisionId}`, { headers }),
          fetch(`${BACK_URL}/api/comisiones/${comisionId}`,             { headers }),
        ]);
        if (!resAsis.ok) throw new Error("Error cargando asistencias");

        const registros = await resAsis.json();
        // comision ya la tenemos en comisionInfo, pero si necesitamos estudiantes:
        const comData   = resCom.ok ? await resCom.json() : comisionInfo;

        // ─ Estudiantes matriculados en la comisión ─
        // La API de comisiones ya trae comision.estudiantes
        const estudiantesMatric = comData?.estudiantes ?? [];

        const alumnosFormateados = estudiantesMatric.map(e => ({
          id:      e.dni,
          dni:     e.dni,
          // ✅ nombre_apellido es el campo real del backend
          apellido: e.nombre_apellido,
        }));

        // ─ Fechas únicas de asistencia ─
        const soloEstudiantes = registros.filter(r => r.tipoUsuario === "ESTUDIANTE");
        const fechasOrd = [...new Set(soloEstudiantes.map(r => r.fecha).filter(Boolean))].sort();

        // ─ Set de presencias ─
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
    <div className="flex flex-col gap-4">

      {/* Filtros */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="materia" className="text-sm font-medium text-gray-700">Materia</label>
            <select
              id="materia"
              value={materiaId}
              onChange={handleMateriaChange}
              disabled={loadingCat}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
            >
              <option value="">{loadingCat ? "Cargando..." : "Seleccionar materia"}</option>
              {/* ✅ materiaId */}
              {materias.map(m => <option key={m.materiaId} value={m.materiaId}>{m.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="comision" className="text-sm font-medium text-gray-700">Comisión</label>
            <select
              id="comision"
              value={comisionId}
              onChange={e => setComisionId(e.target.value)}
              disabled={!materiaId || comisionesFiltradas.length === 0}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
            >
              <option value="">
                {!materiaId ? "Primero elegí una materia"
                  : comisionesFiltradas.length === 0 ? "Sin comisiones para esta materia"
                  : "Seleccionar comisión"}
              </option>
              {/* ✅ comisionId + cod_comision */}
              {comisionesFiltradas.map(c => (
                <option key={c.comisionId} value={c.comisionId}>{c.cod_comision}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info comisión seleccionada */}
      {comisionInfo && (
        <div className="flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="w-1.5 shrink-0 bg-green-700" />
          <div className="flex flex-wrap gap-6 px-5 py-3 text-xs text-gray-500">
            <span><strong className="text-gray-700">Comisión:</strong> {comisionInfo.cod_comision}</span>
            <span><strong className="text-gray-700">Materia:</strong> {comisionInfo.materia?.nombre}</span>
            <span><strong className="text-gray-700">Docente:</strong> {comisionInfo.profesor?.nombre_apellido}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Estados vacíos */}
      {!comisionId && !loading && (
        <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-200">
          Seleccioná una materia y una comisión para ver la grilla.
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

      {/* ✅ AsistenciaGrid — muestra P verde / A rojo igual que asistencia-docente */}
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
  );
}
