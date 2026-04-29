"use client";

import { useEffect, useMemo, useState } from "react";
import AsistenciaGrid from "@/components/AsistenciaGrid";
import { BACK_URL, getAuthHeaders } from "@/config/api";
import { useRouter } from "next/navigation";

type AlumnoGrid    = { id: string; apellido: string; tipo: string };
type AsistenciaRow = { alumnoId: string; fecha: string };
type InfoComision  = { nombre: string; materia: string; aula: string; edificio: string; dia: string; horario: string };

export default function AsistenciaPage() {
  const router = useRouter();

  const [materias,             setMaterias]             = useState<any[]>([]);
  const [comisiones,           setComisiones]           = useState<any[]>([]);
  const [materiaSeleccionada,  setMateriaSeleccionada]  = useState("");
  const [comisionSeleccionada, setComisionSeleccionada] = useState("");
  const [infoComision,         setInfoComision]         = useState<InfoComision | null>(null);

  const [fechas,              setFechas]              = useState<string[]>([]);
  const [alumnos,             setAlumnos]             = useState<AlumnoGrid[]>([]);
  const [docentes,            setDocentes]            = useState<AlumnoGrid[]>([]);
  const [asistencias,         setAsistencias]         = useState<AsistenciaRow[]>([]);
  const [asistenciasDocentes, setAsistenciasDocentes] = useState<AsistenciaRow[]>([]);
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState("");

  const headers = useMemo(() => ({ Accept: "application/json", ...getAuthHeaders() }), []);

  // Cargar catálogo al montar
  useEffect(() => {
    if (!BACK_URL) { setError("Falta NEXT_PUBLIC_BACK_URL."); return; }
    (async () => {
      setLoading(true);
      try {
        const [resMat, resCom] = await Promise.all([
          fetch(`${BACK_URL}/api/materias`,   { headers }),
          fetch(`${BACK_URL}/api/comisiones`, { headers }),
        ]);
        if (!resMat.ok || !resCom.ok) throw new Error("Error cargando catálogo");
        const dataMat: any[] = await resMat.json();
        const dataCom: any[] = await resCom.json();

        setMaterias(dataMat.map(m => ({ id: String(m.materiaId ?? m.id), nombre: m.nombre })));

        // Incluimos los datos de horario/aula/edificio si vienen incluidos en comisiones
        setComisiones(dataCom.map(c => ({
          id:        String(c.comisionId ?? c.id),
          nombre:    c.cod_comision ?? c.nombre ?? String(c.comisionId),
          materiaId: String(c.materiaId),
          materia:   c.materia?.nombre ?? "",
          aula:      c.horarios?.[0]?.aula ? `${c.horarios[0].aula.sector}-${c.horarios[0].aula.numero}` : "",
          edificio:  c.horarios?.[0]?.aula?.edificio?.nombre ?? "",
          dia:       c.horarios?.[0]?.diaSemana ?? "",
          horario:   c.horarios?.[0] ? `${c.horarios[0].horaDesde?.slice(0,5)} - ${c.horarios[0].horaHasta?.slice(0,5)}` : "",
        })));
      } catch (e: any) {
        setError(e.message ?? "Error cargando datos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [headers]);

  // Cargar asistencias al elegir comisión
  useEffect(() => {
    if (!comisionSeleccionada) return;
    const com = comisiones.find(c => c.id === comisionSeleccionada);
    if (com) setInfoComision({
      nombre:   com.nombre,
      materia:  com.materia || materias.find(m => m.id === com.materiaId)?.nombre || "",
      aula:     com.aula,
      edificio: com.edificio,
      dia:      com.dia,
      horario:  com.horario,
    });

    (async () => {
      setLoading(true); setError("");
      try {
        const [resAsis, resEst, resProf] = await Promise.all([
          fetch(`${BACK_URL}/api/asistencias?comisionId=${comisionSeleccionada}`, { headers }),
          fetch(`${BACK_URL}/api/estudiantes`, { headers }),
          fetch(`${BACK_URL}/api/profesores`,  { headers }),
        ]);
        if (!resAsis.ok) throw new Error("Error cargando asistencias");

        const registros: any[]  = await resAsis.json();
        const estudiantes: any[] = resEst.ok  ? await resEst.json()  : [];
        const profesores: any[]  = resProf.ok ? await resProf.json() : [];

        // Maps de DNI → nombre completo
        const nomEst: Record<string,string> = {};
        for (const e of estudiantes) if (e.dni) nomEst[String(e.dni)] = e.nombre_apellido ?? String(e.dni);
        const nomProf: Record<string,string> = {};
        for (const p of profesores) if (p.dni) nomProf[String(p.dni)] = p.nombre_apellido ?? String(p.dni);

        // Fechas únicas ordenadas
        const fechasOrd = [...new Set<string>(registros.map(r => r.fecha).filter(Boolean))].sort();

        // Separar alumnos y docentes
        const alumnosMap  = new Map<string, AlumnoGrid>();
        const docentesMap = new Map<string, AlumnoGrid>();
        for (const r of registros) {
          const key = String(r.usuarioId);
          if (r.tipoUsuario === "PROFESOR") {
            if (!docentesMap.has(key)) docentesMap.set(key, { id: key, apellido: nomProf[key] ?? key, tipo: "Docente" });
          } else {
            if (!alumnosMap.has(key))  alumnosMap.set(key,  { id: key, apellido: nomEst[key]  ?? key, tipo: "Estudiante" });
          }
        }

        // Asistencias por grilla
        const presente = registros.filter(r => r.estado === "PRESENTE");
        setAsistencias(presente.filter(r => r.tipoUsuario !== "PROFESOR").map(r => ({ alumnoId: String(r.usuarioId), fecha: r.fecha })));
        setAsistenciasDocentes(presente.filter(r => r.tipoUsuario === "PROFESOR").map(r => ({ alumnoId: String(r.usuarioId), fecha: r.fecha })));
        setFechas(fechasOrd);
        setAlumnos([...alumnosMap.values()]);
        setDocentes([...docentesMap.values()]);
      } catch (e: any) {
        setError(e.message ?? "Error cargando asistencias.");
      } finally {
        setLoading(false);
      }
    })();
  }, [comisionSeleccionada, headers, comisiones, materias]);

  const comisionesFiltradas = useMemo(
    () => comisiones.filter(c => c.materiaId === materiaSeleccionada),
    [comisiones, materiaSeleccionada]
  );

  return (
    <main className="page-container">

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <h1 className="page-title" style={{ margin:0 }}>Grilla de asistencias</h1>
        <button onClick={() => router.push("/")} style={{
          padding:"8px 20px", borderRadius:8, border:"1px solid #d1d5db",
          background:"white", cursor:"pointer", fontWeight:500, fontSize:14,
        }}>
          ← Menú principal
        </button>
      </div>

      {/* Filtros */}
      <div className="asistencia-filtros">
        <div className="asistencia-filtro">
          <label htmlFor="materia">Materia</label>
          <select id="materia" value={materiaSeleccionada}
            onChange={e => { setMateriaSeleccionada(e.target.value); setComisionSeleccionada(""); setInfoComision(null); }}>
            <option value="">Seleccionar materia</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="asistencia-filtro">
          <label htmlFor="comision">Comisión</label>
          <select id="comision" value={comisionSeleccionada} disabled={!materiaSeleccionada}
            onChange={e => setComisionSeleccionada(e.target.value)}>
            <option value="">Seleccionar comisión</option>
            {comisionesFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Info de la comisión */}
      {infoComision && (
        <div style={{
          background:"white", borderRadius:12, padding:"16px 24px",
          boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:24,
          display:"flex", flexWrap:"wrap", gap:"12px 32px",
        }}>
          {infoComision.materia  && <Chip label="Materia"  val={infoComision.materia} />}
          {infoComision.aula     && <Chip label="Aula"     val={infoComision.aula} />}
          {infoComision.edificio && <Chip label="Edificio" val={infoComision.edificio} />}
          {infoComision.dia      && <Chip label="Día"      val={cap(infoComision.dia)} />}
          {infoComision.horario  && <Chip label="Horario"  val={infoComision.horario} />}
        </div>
      )}

      {/* Error */}
      {error && <div style={{ marginBottom:16, color:"#b91c1c", background:"#fee2e2", padding:"12px 16px", borderRadius:8 }}>{error}</div>}

      {!comisionSeleccionada && <div className="asistencia-placeholder">Seleccioná una materia y una comisión para ver la grilla.</div>}
      {comisionSeleccionada && loading && <div className="asistencia-placeholder">Cargando datos...</div>}

      {comisionSeleccionada && !loading && (
        <>
          <AsistenciaGrid
            titulo="Asistencia de estudiantes"
            fechas={fechas}
            alumnos={alumnos}
            asistencias={asistencias}
            columnaPersona="Nombre y apellido"
          />
          {docentes.length > 0 && (
            <div style={{ marginTop:32 }}>
              <AsistenciaGrid
                titulo="Asistencia del docente"
                fechas={fechas}
                alumnos={docentes}
                asistencias={asistenciasDocentes}
                columnaPersona="Docente"
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}

function Chip({ label, val }: { label: string; val: string }) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:600, color:"#111827", marginTop:2 }}>{val}</div>
    </div>
  );
}
function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
