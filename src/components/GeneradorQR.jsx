"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { BACK_URL, getAuthHeaders } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

/**
 * GeneradorQR — Sin MUI, 100% Tailwind.
 *
 * Para el ROL DOCENTE:
 *   - Carga las comisiones que le pertenecen (filtra por su profesorId)
 *   - Muestra el aula de cada comisión preseleccionada
 *   - No ve aulas ni edificios ajenos
 *
 * Para ADMINISTRADOR:
 *   - Puede elegir cualquier edificio y aula (comportamiento original)
 */
export default function GeneradorQR() {
  const router        = useRouter();
  const { usuario }   = useAuth();
  const printRef      = useRef(null);
  const qrRef         = useRef(null);
  const isDocente     = usuario?.rol === "docente";

  // ─── Estado compartido ───────────────────────────────────────
  const [token,     setToken]     = useState("");
  const [mostrarQR, setMostrarQR] = useState(false);
  const [openPrint, setOpenPrint] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error,     setError]     = useState("");

  // ─── Estado DOCENTE ──────────────────────────────────────────
  const [comisionesDocente, setComisionesDocente] = useState([]);  // [{comisionId, cod, aulaId, aulaName, edificioNombre}]
  const [comisionElegida,   setComisionElegida]   = useState("");  // comisionId elegida
  const [loadingCom,        setLoadingCom]        = useState(false);

  // ─── Estado ADMIN ────────────────────────────────────────────
  const [edificios,        setEdificios]        = useState([]);
  const [aulas,            setAulas]            = useState([]);
  const [aulasCache,       setAulasCache]       = useState({});
  const [edificio,         setEdificio]         = useState("");
  const [aula,             setAula]             = useState("");
  const [loadingEdificios, setLoadingEdificios] = useState(false);
  const [loadingAulas,     setLoadingAulas]     = useState(false);

  // ─── Cargar datos según rol ──────────────────────────────────
  useEffect(() => {
    if (!usuario) return;

    if (isDocente) {
      // Para el docente: cargar sus comisiones con datos de aula
      setLoadingCom(true);
      (async () => {
        try {
          const headers = getAuthHeaders();
          // Obtener comisiones del docente usando su referenciaId (dni del profesor)
          const resProfesores = await fetch(`${BACK_URL}/api/profesores`, { headers });
          const profesores    = await resProfesores.json();
          const profesor      = profesores.find(p => p.dni === usuario.referenciaId || p.dni === usuario.dni);

          if (!profesor) { setError("No encontramos tu perfil de docente."); return; }

          const resComisiones = await fetch(`${BACK_URL}/api/comisiones`, { headers });
          const todasComisiones = await resComisiones.json();

          const misComisiones = todasComisiones.filter(
            c => String(c.profesorId) === String(profesor.profesorId)
          );

          // Para cada comisión, obtener los datos de aula del horario
          const comisionesCon = misComisiones.map(c => ({
            comisionId:    c.comisionId,
            cod:           c.cod_comision,
            aulaId:        c.horarios?.[0]?.aula?.aulaId ?? c.horarios?.[0]?.aulaId ?? null,
            aulaName:      c.horarios?.[0]?.aula
                             ? `${c.horarios[0].aula.sector}-${c.horarios[0].aula.numero}`
                             : "(sin aula asignada)",
            edificioId:    c.horarios?.[0]?.aula?.edificioId ?? null,
            edificioNombre:c.horarios?.[0]?.aula?.edificio?.nombre ?? "",
            materia:       c.materia?.nombre ?? c.cod_comision,
          }));

          setComisionesDocente(comisionesCon);
        } catch { setError("Error cargando tus comisiones."); }
        finally   { setLoadingCom(false); }
      })();

    } else {
      // Para admin: cargar edificios
      setLoadingEdificios(true);
      (async () => {
        try {
          const res  = await fetch(`${BACK_URL}/api/edificios`, { headers: getAuthHeaders() });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setEdificios(data.map(e => ({ ...e, edificioId: String(e.edificioId) })));
        } catch { setError("No se pudieron cargar los edificios."); }
        finally   { setLoadingEdificios(false); }
      })();
    }
  }, [usuario, isDocente]);

  // Cargar aulas cuando cambia el edificio (admin)
  useEffect(() => {
    if (isDocente || !edificio) { setAulas([]); return; }
    if (aulasCache[edificio]) { setAulas(aulasCache[edificio]); return; }
    (async () => {
      setLoadingAulas(true);
      try {
        const res  = await fetch(`${BACK_URL}/api/aulas?edificioId=${edificio}`, { headers: getAuthHeaders() });
        const data = await res.json();
        const norm = data.map(a => ({ ...a, aulaId: String(a.aulaId) }));
        setAulas(norm);
        setAulasCache(prev => ({ ...prev, [edificio]: norm }));
      } catch { setError("No se pudieron cargar las aulas."); }
      finally   { setLoadingAulas(false); }
    })();
  }, [edificio, isDocente]);

  // ─── Datos derivados ─────────────────────────────────────────
  const comisionInfo  = comisionesDocente.find(c => c.comisionId === comisionElegida);
  const selectedEdif  = edificios.find(e => e.edificioId === edificio);
  const selectedAula  = aulas.find(a => a.aulaId === aula);

  // aulaId efectiva (docente usa la de la comisión, admin usa el select)
  const aulaIdEfectiva    = isDocente ? comisionInfo?.aulaId    : aula;
  const edificioIdEfectivo = isDocente ? comisionInfo?.edificioId : edificio;

  const puedeGenerar = isDocente
    ? !!comisionElegida && !!comisionInfo?.aulaId
    : !!edificio && !!aula;

  const urlQR = useMemo(() => {
    if (!token || !aulaIdEfectiva || !edificioIdEfectivo) return "";
    return `${process.env.NEXT_PUBLIC_FRONT_URL}/registrar-asistencia?rtoken=${token}&aulaId=${aulaIdEfectiva}&edificioId=${edificioIdEfectivo}`;
  }, [token, aulaIdEfectiva, edificioIdEfectivo]);

  // ─── Acciones ────────────────────────────────────────────────
  const handleGenerarQR = async () => {
    if (!puedeGenerar) return;
    setError(""); setGenerando(true);
    try {
      const res  = await fetch(`${BACK_URL}/api/qr/generar`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ aulaId: aulaIdEfectiva }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Error al generar el QR"); return; }
      setToken(data.rtoken);
      setMostrarQR(true);
    } catch { setError("No se pudo conectar con el servidor."); }
    finally   { setGenerando(false); }
  };

  const handleImprimirQR = useReactToPrint({
    contentRef: printRef,
    documentTitle: `qr-aula`,
  });

  const handleDescargarQR = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const TAM = 1200; const MARGEN = 60;
    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = TAM;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, TAM, TAM);
      ctx.drawImage(img, MARGEN, MARGEN, TAM - MARGEN * 2, TAM - MARGEN * 2);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png", 1.0);
      link.download = `qr-aula-${aulaIdEfectiva}.png`;
      link.click(); URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const nombreAulaDisplay = isDocente
    ? (comisionInfo?.aulaName ?? "")
    : (selectedAula?.nombreCompleto ?? "");
  const nombreEdifDisplay = isDocente
    ? (comisionInfo?.edificioNombre ?? "")
    : (selectedEdif?.nombre ?? "");

  // ─── Render ──────────────────────────────────────────────────
  return (
    <>
      <div className="w-full max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Generar QR del Aula</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isDocente
              ? "Seleccioná tu comisión para generar el código QR del aula."
              : "Seleccioná el edificio y el aula para generar el código QR."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span> {error}
              <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {/* ── MODO DOCENTE ── */}
          {isDocente && (
            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Mi comisión</label>
              <select
                value={comisionElegida}
                disabled={loadingCom}
                onChange={e => { setComisionElegida(e.target.value); setMostrarQR(false); setToken(""); }}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
              >
                <option value="">{loadingCom ? "Cargando tus comisiones..." : "Seleccioná una comisión"}</option>
                {comisionesDocente.map(c => (
                  <option key={c.comisionId} value={c.comisionId}>
                    {c.cod} — {c.materia} ({c.aulaName})
                  </option>
                ))}
              </select>

              {comisionInfo && (
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500 px-1">
                  {comisionInfo.edificioNombre && <span>🏢 {comisionInfo.edificioNombre}</span>}
                  {comisionInfo.aulaName       && <span>🚪 {comisionInfo.aulaName}</span>}
                  {!comisionInfo.aulaId && (
                    <span className="text-amber-600">⚠️ Esta comisión no tiene aula asignada</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── MODO ADMIN ── */}
          {!isDocente && (
            <>
              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Edificio</label>
                <select
                  value={edificio}
                  disabled={loadingEdificios}
                  onChange={e => { setEdificio(e.target.value); setAula(""); setMostrarQR(false); setToken(""); }}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
                >
                  <option value="">{loadingEdificios ? "Cargando..." : "Seleccionar edificio"}</option>
                  {edificios.map(e => <option key={e.edificioId} value={e.edificioId}>{e.nombre}</option>)}
                </select>
              </div>

              <div className="mb-5 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Aula</label>
                <select
                  value={aula}
                  disabled={!edificio || loadingAulas}
                  onChange={e => { setAula(e.target.value); setMostrarQR(false); setToken(""); }}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
                >
                  <option value="">
                    {!edificio ? "Primero seleccioná un edificio" : loadingAulas ? "Cargando..." : "Seleccionar aula"}
                  </option>
                  {aulas.map(a => <option key={a.aulaId} value={a.aulaId}>{a.nombreCompleto}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Botón generar */}
          <button
            onClick={handleGenerarQR}
            disabled={!puedeGenerar || generando}
            className="w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generando ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Generando...
              </>
            ) : "Generar QR"}
          </button>

          {/* QR generado */}
          {mostrarQR && urlQR && (
            <div className="mt-6 flex flex-col items-center gap-4">
              {/* Imagen del QR */}
              <div ref={qrRef} className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-gray-200">
                <QRCode value={urlQR} size={240} level="H" />
              </div>

              {/* Info del aula */}
              <div className="text-center text-sm text-gray-600">
                {nombreEdifDisplay && <p>Edificio: <strong>{nombreEdifDisplay}</strong></p>}
                {nombreAulaDisplay && <p>Aula: <strong>{nombreAulaDisplay}</strong></p>}
              </div>

              {/* Acciones */}
              <div className="flex w-full gap-3">
                <button
                  onClick={handleDescargarQR}
                  className="flex-1 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                >
                  ⬇ Descargar
                </button>
                <button
                  onClick={() => setOpenPrint(true)}
                  className="flex-1 rounded-xl border border-green-700 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                >
                  🖨 Imprimir
                </button>
              </div>
            </div>
          )}

          {/* Cancelar */}
          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Modal impresión */}
      {openPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-center text-lg font-bold text-gray-800">Vista previa de impresión</h2>
            <div ref={printRef} className="flex flex-col items-center gap-3 p-4 text-center">
              <p className="text-lg font-bold">QR de aula</p>
              {nombreEdifDisplay && <p className="text-sm text-gray-600">Edificio: {nombreEdifDisplay}</p>}
              {nombreAulaDisplay && <p className="text-sm text-gray-600">Aula: {nombreAulaDisplay}</p>}
              <QRCode value={urlQR || "sin-token"} size={220} level="H" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setOpenPrint(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleImprimirQR}
                className="flex-1 rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
