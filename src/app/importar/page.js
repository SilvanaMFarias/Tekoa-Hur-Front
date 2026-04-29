"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_BACK_URL || "http://localhost:3001/api";

export default function ImportarPage() {
  const router = useRouter();
  const [archivo,    setArchivo]    = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [confirmado, setConfirmado] = useState(null);
  const [error,      setError]      = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivo(file); setPreview(null); setConfirmado(null); setError(null);
  };

  const handlePreview = async () => {
    if (!archivo) return;
    setLoading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const res  = await fetch(`${API_URL}/api/importar/preview`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar el archivo");
      setPreview(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleConfirmar = async () => {
    if (!archivo) return;
    setLoading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const res  = await fetch(`${API_URL}/api/importar/confirmar`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setConfirmado(data); setPreview(null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    setArchivo(null); setPreview(null); setConfirmado(null); setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header con botón volver */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <h1 style={s.title}>📥 Importar Planilla de Cálculo</h1>
          <button onClick={() => router.push("/")} style={s.btnVolver}>← Menú principal</button>
        </div>

        <p style={s.subtitle}>Cargá el archivo con la información de comisiones y matriculación.</p>

        {/* Upload */}
        {!confirmado && (
          <div style={s.uploadArea}>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display:"none" }} id="fileInput" />
            <label htmlFor="fileInput" style={s.uploadLabel}>
              {archivo ? (
                <><span style={{ fontSize:32 }}>📄</span><span style={{ fontWeight:600 }}>{archivo.name}</span><span style={{ color:"#94a3b8", fontSize:13 }}>({(archivo.size/1024).toFixed(1)} KB)</span></>
              ) : (
                <><span style={{ fontSize:36 }}>📂</span><span>Hacé click o arrastrá un archivo .xlsx aquí</span></>
              )}
            </label>
            {archivo && !preview && (
              <button onClick={handlePreview} disabled={loading} style={{ ...s.btn, ...s.btnPrimary }}>
                {loading ? "Procesando..." : "📋 Ver resumen de carga"}
              </button>
            )}
          </div>
        )}

        {error && <div style={s.errorBox}><strong>⚠️ Error:</strong> {error}</div>}

        {/* Preview */}
        {preview && !confirmado && (
          <div style={{ marginTop:28 }}>
            <h2 style={s.sectionTitle}>Resumen de carga</h2>
            <div style={s.statsGrid}>
              <StatCard label="Comisiones" value={preview.resumen.comisiones} color="#3b82f6" icon="🏫"/>
              <StatCard label="Estudiantes" value={preview.resumen.estudiantes} color="#10b981" icon="👩‍🎓"/>
              <StatCard label="Docentes"   value={preview.resumen.docentes}    color="#8b5cf6" icon="👨‍🏫"/>
              <StatCard label="Aulas"      value={preview.resumen.aulas}       color="#f59e0b" icon="🚪"/>
            </div>
            <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" }}>
              <ListBox title="Edificios detectados" items={preview.resumen.edificios} icon="🏢"/>
              <ListBox title="Materias detectadas"  items={preview.resumen.materias}  icon="📚"/>
            </div>
            <h3 style={s.listTitle}>Comisiones a importar</h3>
            <TableWrapper>
              <thead><tr>{["Comisión","Docente","Materia","Día","Horario","Aula"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>{preview.comisiones.map((c,i)=>(
                <tr key={i} style={i%2===0?{background:"#fafafa"}:{}}>
                  <td style={s.td}>{c.cod_comision}</td><td style={s.td}>{c.docente_nombre}</td>
                  <td style={s.td}>{c.actividad}</td><td style={s.td}>{c.dia}</td>
                  <td style={s.td}>{c.horaDesde} - {c.horaHasta}</td><td style={s.td}>{c.espacio}</td>
                </tr>
              ))}</tbody>
            </TableWrapper>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:24 }}>
              <button onClick={handleReset}    style={{ ...s.btn, background:"#e2e8f0", color:"#475569" }}>✕ Cancelar</button>
              <button onClick={handleConfirmar} disabled={loading} style={{ ...s.btn, ...s.btnSuccess }}>
                {loading ? "Importando..." : "✅ Confirmar e importar"}
              </button>
            </div>
          </div>
        )}

        {/* Éxito */}
        {confirmado && (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:56, marginBottom:8 }}>✅</div>
            <h2 style={{ fontSize:22, fontWeight:700, color:"#1e293b" }}>¡Importación completada!</h2>
            <p style={{ color:"#64748b", marginBottom:24 }}>{confirmado.mensaje}</p>
            <div style={s.statsGrid}>
              <StatCard label="Edificios"   value={confirmado.resultados.edificios}   color="#3b82f6" icon="🏢"/>
              <StatCard label="Aulas"       value={confirmado.resultados.aulas}       color="#f59e0b" icon="🚪"/>
              <StatCard label="Profesores"  value={confirmado.resultados.profesores}  color="#8b5cf6" icon="👨‍🏫"/>
              <StatCard label="Materias"    value={confirmado.resultados.materias}    color="#ec4899" icon="📚"/>
              <StatCard label="Comisiones"  value={confirmado.resultados.comisiones}  color="#3b82f6" icon="🏫"/>
              <StatCard label="Horarios"    value={confirmado.resultados.horarios}    color="#14b8a6" icon="⏰"/>
              <StatCard label="Estudiantes" value={confirmado.resultados.estudiantes} color="#10b981" icon="👩‍🎓"/>
              <StatCard label="Matrículas"  value={confirmado.resultados.matriculas}  color="#6366f1" icon="📋"/>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:24 }}>
              <button onClick={handleReset} style={{ ...s.btn, ...s.btnPrimary }}>📥 Importar otro archivo</button>
              <button onClick={() => router.push("/")} style={{ ...s.btn, ...s.btnVolver }}>← Menú principal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background:"#f8fafc", borderRadius:8, padding:"16px 12px", textAlign:"center", borderTop:`3px solid ${color}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize:24 }}>{icon}</div>
      <div style={{ fontSize:28, fontWeight:700, color, margin:"4px 0" }}>{value}</div>
      <div style={{ fontSize:13, color:"#64748b" }}>{label}</div>
    </div>
  );
}

function ListBox({ title, items, icon }) {
  return (
    <div style={{ flex:1, minWidth:200, background:"#f8fafc", borderRadius:8, padding:16 }}>
      <h3 style={{ fontSize:15, fontWeight:600, color:"#334155", marginBottom:10 }}>{title}</h3>
      {items.map((item, i) => <div key={i} style={{ fontSize:14, color:"#475569", padding:"4px 0", borderBottom:"1px solid #e2e8f0" }}>{icon} {item}</div>)}
    </div>
  );
}

function TableWrapper({ children }) {
  return (
    <div style={{ overflowX:"auto", borderRadius:8, border:"1px solid #e2e8f0" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>{children}</table>
    </div>
  );
}

const s = {
  page:       { minHeight:"100vh", background:"#f1f5f9", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"40px 16px" },
  card:       { background:"#fff", borderRadius:12, boxShadow:"0 4px 24px rgba(0,0,0,0.08)", padding:32, width:"100%", maxWidth:900 },
  title:      { fontSize:24, fontWeight:700, color:"#1e293b", margin:0 },
  subtitle:   { color:"#64748b", fontSize:15, marginBottom:28 },
  uploadArea: { border:"2px dashed #cbd5e1", borderRadius:10, padding:24, textAlign:"center", background:"#f8fafc" },
  uploadLabel:{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer", color:"#475569", fontSize:15, padding:"12px 0" },
  btn:        { padding:"10px 22px", borderRadius:8, border:"none", cursor:"pointer", fontSize:15, fontWeight:600 },
  btnPrimary: { background:"#3b82f6", color:"#fff", marginTop:16 },
  btnSuccess: { background:"#10b981", color:"#fff" },
  btnVolver:  { padding:"8px 16px", borderRadius:8, border:"1px solid #d1d5db", background:"white", cursor:"pointer", fontWeight:500, fontSize:14 },
  errorBox:   { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"12px 16px", color:"#dc2626", marginTop:16, fontSize:14 },
  sectionTitle:{ fontSize:20, fontWeight:700, color:"#1e293b", marginBottom:16 },
  statsGrid:  { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:12, marginBottom:24 },
  listTitle:  { fontSize:15, fontWeight:600, color:"#334155", marginBottom:10 },
  th:         { background:"#f1f5f9", padding:"10px 12px", textAlign:"left", fontWeight:600, color:"#475569", borderBottom:"1px solid #e2e8f0", whiteSpace:"nowrap" },
  td:         { padding:"8px 12px", color:"#334155", borderBottom:"1px solid #f1f5f9" },
};
