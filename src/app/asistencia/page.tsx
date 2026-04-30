"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
// @ts-ignore
import AsistenciaGrid from "@/components/AsistenciaGrid";
import { BACK_URL, getAuthHeaders } from "@/config/api";

export default function AsistenciaPage() {
  const router = useRouter();

  const [materiaSeleccionada,  setMateriaSeleccionada]  = useState("");
  const [comisionSeleccionada, setComisionSeleccionada] = useState("");
  const [materias,             setMaterias]             = useState<any[]>([]);
  const [comisiones,           setComisiones]           = useState<any[]>([]);
  const [infoComision,         setInfoComision]         = useState<any[]>(null);
  const [estudiantesMap,       setEstudiantesMap]       = useState<any[]>({});
  const [fechas,               setFechas]               = useState<any[]>([]);
  const [alumnos,              setAlumnos]              = useState<any[]>([]);
  const [asistencias,          setAsistencias]          = useState<any[]>([]);
  const [loading,              setLoading]              = useState(false);
  const [error,                setError]                = useState("");

const headers: HeadersInit = useMemo(() => {
  const auth = getAuthHeaders();

  return {
    Accept: "application/json",
    ...(auth?.Authorization && { Authorization: auth.Authorization }),
  };
}, []);

  // ── Carga inicial: materias, comisiones y estudiantes ────────
  useEffect(() => {
    if (!BACK_URL) { setError("Falta NEXT_PUBLIC_BACK_URL."); return; }
    (async () => {
      setLoading(true);
      try {
        const [resMat, resCom, resEst] = await Promise.all([
          fetch(`${BACK_URL}/api/materias`,   { headers }),
          fetch(`${BACK_URL}/api/comisiones`, { headers }),
          fetch(`${BACK_URL}/api/estudiantes`, { headers }),
        ]);
        if (!resMat.ok || !resCom.ok) throw new Error("Error cargando catálogo");

        const dataMat = await resMat.json();
        const dataCom = await resCom.json();
        const dataEst = resEst.ok ? await resEst.json() : [];

        setMaterias(dataMat.map((m: any) => ({
          id:     String(m.materiaId ?? m.id),
          nombre: m.nombre,
        })));

        setComisiones(dataCom.map((c: any) => ({
          id:        String(c.comisionId ?? c.id),
          nombre:    c.cod_comision ?? String(c.comisionId),
          materiaId: String(c.materiaId),
          // Datos de aula y edificio que vienen anidados en horarios
          aula:     c.horarios?.[0]?.aula
                      ? `${c.horarios[0].aula.sector}-${c.horarios[0].aula.numero}`
                      : "",
          edificio: c.horarios?.[0]?.aula?.edificio?.nombre ?? "",
          dia:      c.horarios?.[0]?.diaSemana ?? "",
          horario:  c.horarios?.[0]
                      ? `${c.horarios[0].horaDesde?.slice(0,5)} – ${c.horarios[0].horaHasta?.slice(0,5)}`
                      : "",
        })));

        // Map DNI → nombre_apellido
        const nom = {};
        for (const e of dataEst) {
          if (e.dni) nom[String(e.dni)] = e.nombre_apellido ?? String(e.dni);
        }
        setEstudiantesMap(nom);

      } catch (e: any) {
        setError(e.message ?? "Error cargando datos.");
      } finally { setLoading(false); }
    })();
  }, [headers]);

  // ── Al cambiar comisión: guardar info y cargar asistencias ───
  useEffect(() => {
    if (!comisionSeleccionada) { setInfoComision(null); return; }
    const com = comisiones.find((c) => c.id === comisionSeleccionada);
    setInfoComision(com ?? null);
  }, [comisionSeleccionada, comisiones]);

  useEffect(() => {
    if (!comisionSeleccionada) return;
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await fetch(
          `${BACK_URL}/api/asistencias?comisionId=${comisionSeleccionada}`,
          { headers }
        );
        if (!res.ok) throw new Error("Error cargando asistencias");
        const registros = await res.json();

        const soloAlumnos = registros.filter((r: any) => r.tipoUsuario !== "PROFESOR");
        const fechasOrd   = [...new Set(soloAlumnos.map((r) => r.fecha).filter(Boolean))].sort();

        const alumnosMap = new Map();
        for (const r of soloAlumnos) {
          const key = String(r.usuarioId);
          if (!alumnosMap.has(key)) {
            alumnosMap.set(key, {
              id:      key,
              dni:     key,
              apellido: estudiantesMap[key] ?? key,
              tipo:    "Estudiante",
            });
          }
        }

        const asis = soloAlumnos
          .filter((r) => r.estado === "PRESENTE")
          .map((r) => ({ alumnoId: String(r.usuarioId), fecha: r.fecha }));

        setFechas(fechasOrd);
        setAlumnos([...alumnosMap.values()]);
        setAsistencias(asis);
      } catch (e: any) {
        setError(e.message ?? "Error.");
      } finally { setLoading(false); }
    })();
  }, [comisionSeleccionada, headers, estudiantesMap]);

  const comisionesFiltradas = useMemo(
    () => comisiones.filter((c) => c.materiaId === materiaSeleccionada),
    [comisiones, materiaSeleccionada]
  );

  return (
    <main className="page-container">

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 28,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
            Asistencias
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Historial de asistencia por comisión
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Toggle bonito */}
          <div style={{
            display: "flex", borderRadius: 10, overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          }}>
            <div style={{
              padding: "9px 20px", fontWeight: 700, fontSize: 14,
              background: "#2563eb", color: "white",
              display: "flex", alignItems: "center", gap: 7,
              cursor: "default",
            }}>
              <span>👨‍🎓</span> Estudiantes
            </div>
            <button
              onClick={() => router.push("/asistencia-docente")}
              style={{
                padding: "9px 20px", fontWeight: 600, fontSize: 14,
                background: "#f1f5f9", color: "#475569",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 7,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
            >
              <span>👨‍🏫</span> Docentes
            </button>
          </div>

          <button
            onClick={() => router.push("/")}
            style={{
              padding: "9px 16px", borderRadius: 10, border: "1px solid #e2e8f0",
              background: "white", cursor: "pointer", fontWeight: 500,
              fontSize: 14, color: "#374151",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            ← Menú
          </button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background: "white", borderRadius: 14, padding: "20px 24px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: 20,
        display: "flex", gap: 20, flexWrap: "wrap",
      }}>
        <div className="asistencia-filtro" style={{ flex: 1, minWidth: 200 }}>
          <label htmlFor="materia">Materia</label>
          <select
            id="materia"
            value={materiaSeleccionada}
            onChange={(e) => { setMateriaSeleccionada(e.target.value); setComisionSeleccionada(""); }}
          >
            <option value="">Seleccionar materia</option>
            {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="asistencia-filtro" style={{ flex: 1, minWidth: 200 }}>
          <label htmlFor="comision">Comisión</label>
          <select
            id="comision"
            value={comisionSeleccionada}
            onChange={(e) => setComisionSeleccionada(e.target.value)}
            disabled={!materiaSeleccionada}
          >
            <option value="">Seleccionar comisión</option>
            {comisionesFiltradas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* ── Info de la comisión: edificio y aula ── */}
      {infoComision && (
        <div style={{
          display: "flex", gap: 0, marginBottom: 20,
          background: "white", borderRadius: 14,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}>
          {/* Franja de color lateral */}
          <div style={{ width: 5, background: "#2563eb", flexShrink: 0 }} />
          <div style={{ padding: "16px 24px", display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
            {infoComision.edificio && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  Edificio
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  🏢 {infoComision.edificio}
                </div>
              </div>
            )}
            {infoComision.aula && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  Aula
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  🚪 {infoComision.aula}
                </div>
              </div>
            )}
            {infoComision.dia && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  Día y horario
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  📅 {cap(infoComision.dia)} {infoComision.horario}
                </div>
              </div>
            )}
            {infoComision.nombre && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  Comisión
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {infoComision.nombre}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ marginBottom: 16, color: "#b91c1c", background: "#fee2e2", padding: "12px 16px", borderRadius: 10 }}>
          {error}
        </div>
      )}

      {/* ── Estados vacíos / loading / grilla ── */}
      {!comisionSeleccionada && (
        <div className="asistencia-placeholder">
          Seleccioná una materia y una comisión para ver la grilla.
        </div>
      )}
      {comisionSeleccionada && loading && (
        <div className="asistencia-placeholder">Cargando datos...</div>
      )}
      {comisionSeleccionada && !loading && (
        <AsistenciaGrid
          titulo="Asistencia de estudiantes"
          headerNombre="Nombre y apellido"
          fechas={fechas as any[]}
          alumnos={alumnos as any[]}
          asistencias={asistencias as any[]}
          mostrarDni={true}
          mostrarVolver={false}
        />
      )}
    </main>
  );
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
