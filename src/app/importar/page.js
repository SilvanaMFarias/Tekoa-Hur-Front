"use client";
import { useState, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function ImportarPage() {
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmado, setConfirmado] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivo(file);
    setPreview(null);
    setConfirmado(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!archivo) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const res = await fetch(`${API_URL}/importar/preview`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar el archivo");
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (!archivo) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const res = await fetch(`${API_URL}/importar/confirmar`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setConfirmado(data);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setArchivo(null);
    setPreview(null);
    setConfirmado(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>📥 Importar Planilla de Calculo</h1>
        <p style={styles.subtitle}>
          Cargá el archivo con la información de comisiones y matriculación para impactarla en la base de datos.
        </p>

        {/* Upload area */}
        {!confirmado && (
          <div style={styles.uploadArea}>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              style={styles.fileInput}
              id="fileInput"
            />
            <label htmlFor="fileInput" style={styles.uploadLabel}>
              {archivo ? (
                <>
                  <span style={styles.fileIcon}>📄</span>
                  <span style={styles.fileName}>{archivo.name}</span>
                  <span style={styles.fileSize}>({(archivo.size / 1024).toFixed(1)} KB)</span>
                </>
              ) : (
                <>
                  <span style={styles.uploadIcon}>📂</span>
                  <span>Hacé click o arrastrá un archivo .xlsx aquí</span>
                </>
              )}
            </label>

            {archivo && !preview && (
              <button
                onClick={handlePreview}
                disabled={loading}
                style={{ ...styles.btn, ...styles.btnPrimary }}
              >
                {loading ? "Procesando..." : "📋 Ver resumen de carga"}
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {/* Preview */}
        {preview && !confirmado && (
          <div style={styles.previewSection}>
            <h2 style={styles.sectionTitle}>Resumen de carga</h2>

            <div style={styles.statsGrid}>
              <StatCard label="Comisiones" value={preview.resumen.comisiones} color="#3b82f6" icon="🏫" />
              <StatCard label="Estudiantes" value={preview.resumen.estudiantes} color="#10b981" icon="👩‍🎓" />
              <StatCard label="Docentes" value={preview.resumen.docentes} color="#8b5cf6" icon="👨‍🏫" />
              <StatCard label="Aulas" value={preview.resumen.aulas} color="#f59e0b" icon="🚪" />
            </div>

            <div style={styles.listsRow}>
              <div style={styles.listBox}>
                <h3 style={styles.listTitle}>Edificios detectados</h3>
                {preview.resumen.edificios.map((e, i) => (
                  <div key={i} style={styles.listItem}>🏢 {e}</div>
                ))}
              </div>
              <div style={styles.listBox}>
                <h3 style={styles.listTitle}>Materias detectadas</h3>
                {preview.resumen.materias.map((m, i) => (
                  <div key={i} style={styles.listItem}>📚 {m}</div>
                ))}
              </div>
            </div>

            <h3 style={styles.listTitle}>Comisiones a importar</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Comisión</th>
                    <th style={styles.th}>Docente</th>
                    <th style={styles.th}>Materia</th>
                    <th style={styles.th}>Día</th>
                    <th style={styles.th}>Horario</th>
                    <th style={styles.th}>Aula</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.comisiones.map((c, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>{c.cod_comision}</td>
                      <td style={styles.td}>{c.docente_nombre}</td>
                      <td style={styles.td}>{c.actividad}</td>
                      <td style={styles.td}>{c.dia}</td>
                      <td style={styles.td}>{c.horaDesde} - {c.horaHasta}</td>
                      <td style={styles.td}>{c.espacio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ ...styles.listTitle, marginTop: 20 }}>Primeros 20 estudiantes</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nombre y Apellido</th>
                    <th style={styles.th}>DNI</th>
                    <th style={styles.th}>Materia</th>
                    <th style={styles.th}>Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.estudiantes.map((e, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>{e.nombre_apellido}</td>
                      <td style={styles.td}>{e.dni}</td>
                      <td style={styles.td}>{e.materia}</td>
                      <td style={styles.td}>{e.cod_comision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.actionRow}>
              <button onClick={handleReset} style={{ ...styles.btn, ...styles.btnSecondary }}>
                ✕ Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={loading}
                style={{ ...styles.btn, ...styles.btnSuccess }}
              >
                {loading ? "Importando..." : "✅ Confirmar e importar a la base de datos"}
              </button>
            </div>
          </div>
        )}

        {/* Confirmado */}
        {confirmado && (
          <div style={styles.successSection}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.successTitle}>¡Importación completada!</h2>
            <p style={styles.successMsg}>{confirmado.mensaje}</p>

            <div style={styles.statsGrid}>
              <StatCard label="Edificios" value={confirmado.resultados.edificios} color="#3b82f6" icon="🏢" />
              <StatCard label="Aulas" value={confirmado.resultados.aulas} color="#f59e0b" icon="🚪" />
              <StatCard label="Profesores" value={confirmado.resultados.profesores} color="#8b5cf6" icon="👨‍🏫" />
              <StatCard label="Materias" value={confirmado.resultados.materias} color="#ec4899" icon="📚" />
              <StatCard label="Comisiones" value={confirmado.resultados.comisiones} color="#3b82f6" icon="🏫" />
              <StatCard label="Horarios" value={confirmado.resultados.horarios} color="#14b8a6" icon="⏰" />
              <StatCard label="Estudiantes" value={confirmado.resultados.estudiantes} color="#10b981" icon="👩‍🎓" />
              <StatCard label="Matrículas" value={confirmado.resultados.matriculas} color="#6366f1" icon="📋" />
            </div>

            {confirmado.resultados.errores?.length > 0 && (
              <div style={styles.warningBox}>
                <strong>⚠️ Advertencias ({confirmado.resultados.errores.length}):</strong>
                {confirmado.resultados.errores.slice(0, 5).map((e, i) => (
                  <div key={i} style={{ fontSize: 13, marginTop: 4 }}>• {e}</div>
                ))}
              </div>
            )}

            <button onClick={handleReset} style={{ ...styles.btn, ...styles.btnPrimary, marginTop: 24 }}>
              📥 Importar otro archivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: 32,
    width: "100%",
    maxWidth: 900,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    marginBottom: 28,
  },
  uploadArea: {
    border: "2px dashed #cbd5e1",
    borderRadius: 10,
    padding: 24,
    textAlign: "center",
    background: "#f8fafc",
  },
  fileInput: {
    display: "none",
  },
  uploadLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    color: "#475569",
    fontSize: 15,
    padding: "12px 0",
  },
  uploadIcon: { fontSize: 36 },
  fileIcon: { fontSize: 32 },
  fileName: { fontWeight: 600, color: "#1e293b" },
  fileSize: { color: "#94a3b8", fontSize: 13 },
  btn: {
    padding: "10px 22px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    transition: "opacity 0.2s",
  },
  btnPrimary: { background: "#3b82f6", color: "#fff", marginTop: 16 },
  btnSuccess: { background: "#10b981", color: "#fff" },
  btnSecondary: { background: "#e2e8f0", color: "#475569" },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#dc2626",
    marginTop: 16,
    fontSize: 14,
  },
  warningBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#92400e",
    marginTop: 16,
    fontSize: 14,
  },
  previewSection: { marginTop: 28 },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 16 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "16px 12px",
    textAlign: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  statValue: { fontSize: 28, fontWeight: 700, margin: "4px 0" },
  statLabel: { fontSize: 13, color: "#64748b" },
  listsRow: { display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" },
  listBox: {
    flex: 1,
    minWidth: 200,
    background: "#f8fafc",
    borderRadius: 8,
    padding: 16,
  },
  listTitle: { fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 10 },
  listItem: { fontSize: 14, color: "#475569", padding: "4px 0", borderBottom: "1px solid #e2e8f0" },
  tableWrapper: { overflowX: "auto", borderRadius: 8, border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    background: "#f1f5f9",
    padding: "10px 12px",
    textAlign: "left",
    fontWeight: 600,
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: { padding: "8px 12px", color: "#334155", borderBottom: "1px solid #f1f5f9" },
  trEven: { background: "#fafafa" },
  actionRow: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 },
  successSection: { textAlign: "center", padding: "20px 0" },
  successIcon: { fontSize: 56, marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: 700, color: "#1e293b" },
  successMsg: { color: "#64748b", marginBottom: 24 },
};