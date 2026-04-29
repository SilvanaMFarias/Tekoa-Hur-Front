"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AsistenciaGrid from "@/components/AsistenciaGrid";
import { BACK_URL, getAuthHeaders } from "@/config/api";

export default function AsistenciaDocentePage() {
  const router = useRouter();

  const [profesores,           setProfesores]           = useState([]);
  const [comisiones,           setComisiones]           = useState([]);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState("");
  const [comisionSeleccionada, setComisionSeleccionada] = useState("");
  const [infoComision,         setInfoComision]         = useState(null);

  const [fechas,      setFechas]      = useState([]);
  const [docentes,    setDocentes]    = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingCat,  setLoadingCat]  = useState(true);
  const [error,       setError]       = useState("");

  const headers = useMemo(() => ({
    Accept: "application/json",
    ...getAuthHeaders(),
  }), []);

  // ── Cargar catálogo inicial ──────────────────────────────────
  useEffect(() => {
    if (!BACK_URL) { setError("Falta NEXT_PUBLIC_BACK_URL."); return; }
    (async () => {
      try {
        const [resProf, resCom] = await Promise.all([
          fetch(`${BACK_URL}/api/profesores`,  { headers }),
          fetch(`${BACK_URL}/api/comisiones`,  { headers }),
        ]);
        if (!resProf.ok || !resCom.ok) throw new Error("Error cargando catálogo");

        const dataProf = await resProf.json();
        const dataCom  = await resCom.json();

        setProfesores(dataProf.map((p) => ({
          id:     String(p.profesorId ?? p.dni),
          dni:    p.dni,
          nombre: p.nombre_apellido,
        })));

        setComisiones(dataCom.map((c) => ({
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
      } catch (e) {
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

  // ── Cargar asistencias del docente ───────────────────────────
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

        const registros   = await resAsis.json();
        const profesoresR = resProf.ok ? await resProf.json() : [];

        const profMap = {};
        for (const p of profesoresR) {
          if (p.dni) profMap[String(p.dni)] = { nombre: p.nombre_apellido, dni: p.dni };
        }

        const soloDocentes = registros.filter((r) => r.tipoUsuario === "PROFESOR");
        const fechasOrd    = [...new Set(soloDocentes.map((r) => r.fecha).filter(Boolean))].sort();

        const docentesMap = new Map();
        for (const r of soloDocentes) {
          const key  = String(r.usuarioId);
          const prof = profMap[key];
          if (!docentesMap.has(key)) {
            docentesMap.set(key, {
              id:      key,
              // ✅ NO incluimos dni — el DNI ya aparece en el bloque de info superior
              // así no se duplica en la grilla
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
      } catch (e) {
        setError(e.message ?? "Error.");
      } finally { setLoading(false); }
    })();
  }, [comisionSeleccionada, headers]);

  const profSeleccionado = profesores.find((p) => p.id === profesorSeleccionado);

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
            Historial de asistencia por docente
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Toggle bonito */}
          <div style={{
            display: "flex", borderRadius: 10, overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          }}>
            <button
              onClick={() => router.push("/asistencia")}
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
              <span>👨‍🎓</span> Estudiantes
            </button>
            <div style={{
              padding: "9px 20px", fontWeight: 700, fontSize: 14,
              background: "#2563eb", color: "white",
              display: "flex", alignItems: "center", gap: 7,
              cursor: "default",
            }}>
              <span>👨‍🏫</span> Docentes
            </div>
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
          <label htmlFor="docente">Docente</label>
          <select
            id="docente"
            value={profesorSeleccionado}
            disabled={loadingCat}
            onChange={(e) => { setProfesorSeleccionado(e.target.value); setComisionSeleccionada(""); }}
          >
            <option value="">{loadingCat ? "Cargando..." : "Seleccionar docente"}</option>
            {profesores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="asistencia-filtro" style={{ flex: 1, minWidth: 200 }}>
          <label htmlFor="comision">Comisión</label>
          <select
            id="comision"
            value={comisionSeleccionada}
            disabled={!profesorSeleccionado || comisionesFiltradas.length === 0}
            onChange={(e) => setComisionSeleccionada(e.target.value)}
          >
            <option value="">
              {!profesorSeleccionado ? "Primero elegí un docente"
                : comisionesFiltradas.length === 0 ? "Sin comisiones"
                : "Seleccionar comisión"}
            </option>
            {comisionesFiltradas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* ── Info del docente + comisión ── */}
      {profSeleccionado && (
        <div style={{
          display: "flex", gap: 0, marginBottom: 20,
          background: "white", borderRadius: 14,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}>
          <div style={{ width: 5, background: "#7c3aed", flexShrink: 0 }} />
          <div style={{ padding: "16px 24px", display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                Docente
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                👨‍🏫 {profSeleccionado.nombre}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                DNI
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                {profSeleccionado.dni}
              </div>
            </div>
            {infoComision?.edificio && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  Edificio
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  🏢 {infoComision.edificio}
                </div>
              </div>
            )}
            {infoComision?.aula && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  Aula
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  🚪 {infoComision.aula}
                </div>
              </div>
            )}
            {infoComision?.dia && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  Día y horario
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  📅 {cap(infoComision.dia)} {infoComision.horario}
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

      {/* ── Estados ── */}
      {!profesorSeleccionado && (
        <div className="asistencia-placeholder">Seleccioná un docente para ver su historial.</div>
      )}
      {profesorSeleccionado && !comisionSeleccionada && (
        <div className="asistencia-placeholder">Ahora elegí una comisión.</div>
      )}
      {comisionSeleccionada && loading && (
        <div className="asistencia-placeholder">Cargando datos...</div>
      )}
      {comisionSeleccionada && !loading && (
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
    </main>
  );
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
