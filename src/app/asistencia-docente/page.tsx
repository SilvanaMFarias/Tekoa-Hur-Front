"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation"; 
// @ts-ignore
import AsistenciaGrid from "@/components/AsistenciaGrid";
import { BACK_URL, getAuthHeaders } from "@/config/api";

export default function AsistenciaDocentePage() {
  const router = useRouter();

  const [profesores,           setProfesores]           = useState<any[]>([]);
  const [comisiones,           setComisiones]           = useState<any[]>([]);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState("");
  const [comisionSeleccionada, setComisionSeleccionada] = useState("");
  const [infoComision,         setInfoComision]         = useState<any>(null);

  const [fechas,      setFechas]      = useState<any[]>([]);
  const [docentes,    setDocentes]    = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingCat,  setLoadingCat]  = useState(true);
  const [error,       setError]       = useState("");

  const headers: HeadersInit = useMemo(() => {
  const auth = getAuthHeaders();

  return {
    Accept: "application/json",
    ...(auth?.Authorization && { Authorization: auth.Authorization }),
  };
}, []);

  // Cargar catálogo inicial
  useEffect(() => {
    if (!BACK_URL) { setError("Falta NEXT_PUBLIC_BACK_URL."); return; }
    (async () => {
      try {
        const [resProf, resCom] = await Promise.all([
          fetch(`${BACK_URL}/api/profesores`, { headers }),
          fetch(`${BACK_URL}/api/comisiones`, { headers }),
        ]);
        if (!resProf.ok || !resCom.ok) throw new Error("Error cargando catálogo");

        const dataProf = await resProf.json();
        const dataCom  = await resCom.json();

        setProfesores(dataProf.map((p: any) => ({
          id:     String(p.profesorId ?? p.dni),
          dni:    p.dni,
          nombre: p.nombre_apellido,
        })));

        setComisiones(dataCom.map((c: any) => ({
          id:         String(c.comisionId ?? c.id),
          nombre:     c.cod_comision ?? String(c.comisionId),
          profesorId: String(c.profesorId),
          aula:       c.horarios?.[0]?.aula
                        ? `${c.horarios[0].aula.sector}-${c.horarios[0].aula.numero}`
                        : "",
          edificio:   c.horarios?.[0]?.aula?.edificio?.nombre ?? "",
          dia:        c.horarios?.[0]?.diaSemana ?? "",
          horario:    c.horarios?.[0]
                        ? `${c.horarios[0].horaDesde?.slice(0,5)} – ${c.horarios[0].horaHasta?.slice(0,5)}`
                        : "",
        })));
      } catch (e: any) {
        setError(e.message ?? "Error.");
      } finally { setLoadingCat(false); }
    })();
  }, [headers]);

  // Comisiones del docente seleccionado
  const comisionesFiltradas = useMemo(() => {
    if (!profesorSeleccionado) return [];
    return comisiones.filter((c) => c.profesorId === profesorSeleccionado);
  }, [profesorSeleccionado, comisiones]);

  // Info de la comisión elegida
  useEffect(() => {
    if (!comisionSeleccionada) { setInfoComision(null); return; }
    setInfoComision(comisiones.find((c) => c.id === comisionSeleccionada) ?? null);
  }, [comisionSeleccionada, comisiones]);

  // Cargar asistencias del docente
  useEffect(() => {
    if (!comisionSeleccionada) return;
    (async () => {
      setLoading(true); setError("");
      try {
        const [resAsis, resProf] = await Promise.all([
          fetch(`${BACK_URL}/api/asistencias?comisionId=${comisionSeleccionada}`, { headers }),
          fetch(`${BACK_URL}/api/profesores`, { headers }),
        ]);
        if (!resAsis.ok) throw new Error("Error cargando asistencias");

        const registros: any[]   = await resAsis.json();
        const profesoresR = resProf.ok ? await resProf.json() : [];

        const profMap: Record<string, any> = {};
        for (const p of profesoresR) {
          if (p.dni) profMap[String(p.dni)] = { nombre: p.nombre_apellido, dni: p.dni };
        }

        const soloDocentes = registros.filter((r: any) => r.tipoUsuario === "PROFESOR");
        const fechasOrd = [...new Set(soloDocentes.map((r: any) => r.fecha).filter(Boolean))].sort();

        const docentesMap = new Map();
        for (const r of soloDocentes) {
          const key  = String(r.usuarioId);
          const prof = profMap[key];
          if (!docentesMap.has(key)) {
            docentesMap.set(key, {
              id:      key,
              apellido: prof?.nombre ?? key,
              tipo:    "Docente",
            });
          }
        }

        const asis = soloDocentes
          .filter((r) => r.estado === "PRESENTE")
          .map((r) => ({ alumnoId: String(r.usuarioId), fecha: r.fecha }));

        setFechas(fechasOrd);
        setDocentes([...docentesMap.values()]);
        setAsistencias(asis);
      } catch (e: any) {
        setError(e.message ?? "Error.");
      } finally { setLoading(false); }
    })();
  }, [comisionSeleccionada, headers]);

  const profSeleccionado = profesores.find((p) => p.id === profesorSeleccionado);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">

        {/* ── Encabezado + tabs ──────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Asistencias</h1>
            <p className="mt-1 text-sm text-gray-500">Historial de asistencia por docente</p>
          </div>

          {/* Toggle — ✅ verde institucional, sin botón Menú duplicado */}
          <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 self-start sm:self-auto">
            <button
              onClick={() => router.push("/asistencia")}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              🧑‍🎓 Estudiantes
            </button>
            {/* ✅ Verde institucional en lugar de azul #2563eb */}
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-green-800 shadow-sm">
              👨‍🏫 Docentes
            </div>
          </div>
        </div>

        {/* ── Filtros ─────────────────────────────────────────────── */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="docente" className="text-sm font-medium text-gray-700">Docente</label>
              <select
                id="docente"
                value={profesorSeleccionado}
                disabled={loadingCat}
                onChange={(e) => { setProfesorSeleccionado(e.target.value); setComisionSeleccionada(""); }}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
              >
                <option value="">{loadingCat ? "Cargando..." : "Seleccionar docente"}</option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="comision" className="text-sm font-medium text-gray-700">Comisión</label>
              <select
                id="comision"
                value={comisionSeleccionada}
                disabled={!profesorSeleccionado || comisionesFiltradas.length === 0}
                onChange={(e) => setComisionSeleccionada(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
              >
                <option value="">
                  {!profesorSeleccionado ? "Primero elegí un docente"
                    : comisionesFiltradas.length === 0 ? "Sin comisiones"
                    : "Seleccionar comisión"}
                </option>
                {comisionesFiltradas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Info del docente + comisión ─────────────────────────── */}
        {profSeleccionado && (
          <div className="mb-4 flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            {/* ✅ Barra lateral verde institucional en lugar de violeta */}
            <div className="w-1.5 shrink-0 bg-green-700" />
            <div className="flex flex-wrap items-center gap-6 px-5 py-4">
              {[
                { label: "Docente",      valor: `👨‍🏫 ${profSeleccionado.nombre}` },
                { label: "DNI",          valor: profSeleccionado.dni },
                infoComision?.edificio && { label: "Edificio", valor: `🏢 ${infoComision.edificio}` },
                infoComision?.aula      && { label: "Aula",     valor: `🚪 ${infoComision.aula}` },
                infoComision?.dia       && { label: "Día y horario", valor: `📅 ${cap(infoComision.dia)} ${infoComision.horario}` },
              ].filter(Boolean).map(({ label, valor }) => (
                <div key={label}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
                  <div className="mt-0.5 text-sm font-semibold text-gray-800">{valor}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Estados vacíos ─────────────────────────────────────── */}
        {!profesorSeleccionado && !loading && (
          <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-200">
            Seleccioná un docente para ver su historial.
          </div>
        )}
        {profesorSeleccionado && !comisionSeleccionada && (
          <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-200">
            Ahora elegí una comisión.
          </div>
        )}
        {comisionSeleccionada && loading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white py-12 shadow-sm ring-1 ring-gray-200">
            <svg className="h-5 w-5 animate-spin text-green-700" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm text-gray-500">Cargando datos...</span>
          </div>
        )}

        {/* ── Grilla ─────────────────────────────────────────────── */}
        {comisionSeleccionada && !loading && !error && (
          <AsistenciaGrid
            titulo={`Asistencia — ${profSeleccionado?.nombre ?? ""}`}
            headerNombre="Docente"
            fechas={fechas}
            alumnos={docentes}
            asistencias={asistencias}
            mostrarDni={false}
            mostrarVolver={false}
          />
        )}

      </div>
    </div>
  );
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
