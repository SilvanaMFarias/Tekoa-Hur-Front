"use client";

import { useRef, useState } from "react";
import { getAuthHeaders } from "@/config/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const API_URL = process.env.NEXT_PUBLIC_BACK_URL || "http://localhost:3001";

export default function ImportarPage() {
  return (
    <ProtectedRoute roles={["administrador"]}>
      <ImportarContenido />
    </ProtectedRoute>
  );
}

function ImportarContenido() {
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [estado,   setEstado]   = useState("idle");
  const [preview,  setPreview]  = useState(null);
  const [mensaje,  setMensaje]  = useState("");

  function procesarArchivo(file) {
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setMensaje("Solo se aceptan archivos .xlsx o .xls");
      setEstado("error");
      return;
    }
    setArchivo(file);
    setEstado("idle");
    setMensaje("");
    setPreview(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    procesarArchivo(e.dataTransfer.files?.[0]);
  }

  // PASO 1 — Preview
  async function handlePreview() {
    if (!archivo) return;
    setEstado("previewing");
    setMensaje("");
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      // ✅ getAuthHeaders() devuelve el JWT Bearer — requerido porque /api/importar está protegido
      // Nota: NO pasar Content-Type con FormData, el browser lo setea automáticamente con el boundary
      const { Authorization } = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/importar/preview`, {
        method: "POST",
        headers: { Authorization },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? data?.message ?? "Error al previsualizar.");
      setPreview(data.resumen);
      setEstado("preview_ok");
    } catch (err) {
      setEstado("error");
      setMensaje(err?.message ?? "Error al leer el archivo.");
    }
  }

  // PASO 2 — Confirmar importación
  async function handleConfirmar() {
    if (!archivo) return;
    setEstado("importing");
    setMensaje("");
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      const { Authorization } = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/importar/confirmar`, {
        method: "POST",
        headers: { Authorization },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? data?.message ?? "Error al importar.");
      const r = data.resultados ?? {};
      setEstado("success");
      setMensaje(
        `✓ Importación completada — ` +
        `Edificios: ${r.edificios ?? 0}, Aulas: ${r.aulas ?? 0}, ` +
        `Profesores: ${r.profesores ?? 0}, Materias: ${r.materias ?? 0}, ` +
        `Comisiones: ${r.comisiones ?? 0}, Horarios: ${r.horarios ?? 0}, ` +
        `Estudiantes: ${r.estudiantes ?? 0}, Matrículas: ${r.matriculas ?? 0}` +
        (r.usuariosCreados ? `, Usuarios creados: ${r.usuariosCreados}` : "") + "."
      );
      setArchivo(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setEstado("error");
      setMensaje(err?.message ?? "Error al importar el archivo.");
    }
  }

  function handleReset() {
    setArchivo(null);
    setEstado("idle");
    setMensaje("");
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Importar Planilla de Cálculo</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cargá el archivo Excel con la información de comisiones y matriculación.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

          {/* Zona de drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !preview && inputRef.current?.click()}
            className={`mb-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition select-none ${
              dragging  ? "border-green-500 bg-green-50"
              : archivo ? "border-green-400 bg-green-50"
              :           "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50"
            } ${preview ? "cursor-default" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Zona para cargar archivo Excel"
            onKeyDown={(e) => !preview && e.key === "Enter" && inputRef.current?.click()}
          >
            <span className="text-4xl select-none" aria-hidden="true">
              {archivo ? "📄" : "📁"}
            </span>
            <div className="text-center">
              {archivo ? (
                <>
                  <p className="text-sm font-medium text-green-700">{archivo.name}</p>
                  <p className="text-xs text-gray-500">{(archivo.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600">Hacé click o arrastrá un archivo aquí</p>
                  <p className="text-xs text-gray-400">Solo archivos .xlsx o .xls</p>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={(e) => procesarArchivo(e.target.files?.[0])}
            />
          </div>

          {/* Resumen de preview */}
          {preview && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="mb-3 text-sm font-semibold text-green-800">Vista previa — lo que se va a importar:</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Comisiones",  valor: preview.comisiones },
                  { label: "Estudiantes", valor: preview.estudiantes },
                  { label: "Docentes",    valor: preview.docentes },
                  { label: "Materias",    valor: preview.materias?.length ?? 0 },
                  { label: "Edificios",   valor: preview.edificios?.length ?? 0 },
                  { label: "Aulas",       valor: preview.aulas },
                ].map(({ label, valor }) => (
                  <div key={label} className="rounded-lg bg-white px-3 py-2 text-center ring-1 ring-green-100">
                    <p className="text-lg font-bold text-green-700">{valor}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {estado === "error" && mensaje && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{mensaje}</p>
          )}
          {estado === "success" && mensaje && (
            <p role="status" className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{mensaje}</p>
          )}

          {/* Botones */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {!preview && estado !== "success" && (
              <button
                onClick={handlePreview}
                disabled={!archivo || estado === "previewing"}
                className="flex-1 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {estado === "previewing" ? "Leyendo archivo..." : "Previsualizar"}
              </button>
            )}
            {preview && (
              <button
                onClick={handleConfirmar}
                disabled={estado === "importing"}
                className="flex-1 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {estado === "importing" ? "Importando..." : "Confirmar importación"}
              </button>
            )}
            {archivo && estado !== "importing" && estado !== "previewing" && (
              <button
                onClick={handleReset}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
