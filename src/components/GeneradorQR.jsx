"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { BACK_URL, getAuthHeaders } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

export default function GeneradorQR() {
  const router      = useRouter();
  const { usuario } = useAuth();
  const printRef    = useRef(null);
  const qrRef       = useRef(null);
  const isDocente   = usuario?.rol === "docente";

  // Estado compartido
  const [token,       setToken]       = useState("");
  const [mostrarQR,   setMostrarQR]   = useState(false);
  const [openPrint,   setOpenPrint]   = useState(false);
  const [generando,   setGenerando]   = useState(false);
  const [error,       setError]       = useState("");
  const [expiraInfo,  setExpiraInfo]  = useState(null); // { minutos, expiraEn }

  // Duración configurable por el docente (en minutos)
  const [duracion, setDuracion] = useState(120);

  // Estado DOCENTE
  const [comisionesDocente, setComisionesDocente] = useState([]);
  const [comisionElegida,   setComisionElegida]   = useState("");
  const [loadingCom,        setLoadingCom]        = useState(false);

  // Estado ADMIN
  const [edificios,        setEdificios]        = useState([]);
  const [aulas,            setAulas]            = useState([]);
  const [aulasCache,       setAulasCache]       = useState({});
  const [edificio,         setEdificio]         = useState("");
  const [aula,             setAula]             = useState("");
  const [loadingEdificios, setLoadingEdificios] = useState(false);
  const [loadingAulas,     setLoadingAulas]     = useState(false);

  // Cargar datos según rol
  useEffect(() => {
    if (!usuario) return;

    if (isDocente) {
      setLoadingCom(true);
      (async () => {
        try {
          const headers = getAuthHeaders();
          const resProfesores   = await fetch(`${BACK_URL}/api/profesores`, { headers });
          const profesores      = await resProfesores.json();
          const profesor        = profesores.find(p => p.dni === usuario.referenciaId || p.dni === usuario.dni);
          if (!profesor) { setError("No encontramos tu perfil de docente."); return; }

          const resComisiones   = await fetch(`${BACK_URL}/api/comisiones`, { headers });
          const todasComisiones = await resComisiones.json();
          const misComisiones   = todasComisiones.filter(
            c => String(c.profesorId) === String(profesor.profesorId)
          );

          // El endpoint de comisiones devuelve aulaId en el horario pero NO el objeto aula completo.
          // Hay que buscar los datos del aula por separado para obtener sector, numero y edificioId.
          const aulaIds = [...new Set(
            misComisiones
              .flatMap(c => c.horarios ?? [])
              .map(h => h.aulaId)
              .filter(Boolean)
          )];

          // Cargar todas las aulas necesarias en paralelo
          const aulasMap = {};
          await Promise.all(aulaIds.map(async (aulaId) => {
            try {
              const r = await fetch(`${BACK_URL}/api/aulas/${aulaId}`, { headers });
              if (r.ok) {
                const a = await r.json();
                aulasMap[aulaId] = a;
              }
            } catch {}
          }));

          setComisionesDocente(misComisiones.map(c => {
            const aulaId  = c.horarios?.[0]?.aulaId ?? null;
            const aulaObj = aulaId ? aulasMap[aulaId] : null;
            return {
              comisionId:     c.comisionId,
              cod:            c.cod_comision,
              materia:        c.materia?.nombre ?? c.cod_comision,
              docenteNombre:  profesor.nombre_apellido,
              aulaId:         aulaId,
              aulaName:       aulaObj
                                ? `${aulaObj.sector}-${aulaObj.numero}`
                                : aulaId ? "(cargando...)" : "(sin aula asignada)",
              edificioId:     aulaObj?.edificioId ?? null,
              edificioNombre: aulaObj?.edificio?.nombre ?? "",
            };
          }));
        } catch { setError("Error cargando tus comisiones."); }
        finally   { setLoadingCom(false); }
      })();
    } else {
      setLoadingEdificios(true);
      (async () => {
        try {
          const res  = await fetch(`${BACK_URL}/api/edificios`, { headers: getAuthHeaders() });
          const data = await res.json();
          setEdificios(data.map(e => ({ ...e, edificioId: String(e.edificioId) })));
        } catch { setError("No se pudieron cargar los edificios."); }
        finally   { setLoadingEdificios(false); }
      })();
    }
  }, [usuario, isDocente]);

  // Cargar aulas (admin)
  useEffect(() => {
    if (isDocente || !edificio) { setAulas([]); return; }
    if (aulasCache[edificio])   { setAulas(aulasCache[edificio]); return; }
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

  const comisionInfo      = comisionesDocente.find(c => c.comisionId === comisionElegida);
  const selectedEdif      = edificios.find(e => e.edificioId === edificio);
  const selectedAula      = aulas.find(a => a.aulaId === aula);
  const aulaIdEfectiva    = isDocente ? comisionInfo?.aulaId    : aula;
  const edificioIdEfectivo = isDocente ? comisionInfo?.edificioId : edificio;

  const puedeGenerar = isDocente
    ? !!comisionElegida && !!comisionInfo?.aulaId
    : !!edificio && !!aula;

  const urlQR = useMemo(() => {
    if (!token || !aulaIdEfectiva || !edificioIdEfectivo) return "";
    return `${process.env.NEXT_PUBLIC_FRONT_URL}/registrar-asistencia?rtoken=${token}&aulaId=${aulaIdEfectiva}&edificioId=${edificioIdEfectivo}`;
  }, [token, aulaIdEfectiva, edificioIdEfectivo]);

  // Info para mostrar en el QR impreso
  const infoQR = {
    materia:   isDocente ? (comisionInfo?.materia ?? "")        : "",
    comision:  isDocente ? (comisionInfo?.cod ?? "")            : (selectedAula?.nombreCompleto ?? ""),
    docente:   isDocente ? (comisionInfo?.docenteNombre ?? "")  : "",
    edificio:  isDocente ? (comisionInfo?.edificioNombre ?? "")  : (selectedEdif?.nombre ?? ""),
    aula:      isDocente ? (comisionInfo?.aulaName ?? "")        : (selectedAula?.nombreCompleto ?? ""),
  };

  const handleGenerarQR = async () => {
    if (!puedeGenerar) return;
    setError(""); setGenerando(true);
    try {
      const res  = await fetch(`${BACK_URL}/api/qr/generar`, {
        method:  "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body:    JSON.stringify({
          aulaId:          aulaIdEfectiva,
          comisionId:      isDocente ? comisionElegida : null,
          duracionMinutos: duracion,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Error al generar el QR"); return; }
      setToken(data.rtoken);
      setExpiraInfo({ minutos: data.minutos, expiraEn: data.expiraEn });
      setMostrarQR(true);
    } catch { setError("No se pudo conectar con el servidor."); }
    finally   { setGenerando(false); }
  };

  const handleImprimirQR = useReactToPrint({
    contentRef: printRef,
    documentTitle: `qr-${infoQR.comision || infoQR.aula}`,
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
      link.download = `qr-${infoQR.comision || infoQR.aula}.png`;
      link.click(); URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <>
      <div className="w-full max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Generar QR del Aula</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isDocente
              ? "Seleccioná tu comisión y configurá la duración del QR."
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

          {/* MODO DOCENTE */}
          {isDocente && (
            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Mi comisión</label>
              <select
                value={comisionElegida}
                disabled={loadingCom}
                onChange={e => { setComisionElegida(e.target.value); setMostrarQR(false); setToken(""); setExpiraInfo(null); }}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-50"
              >
                <option value="">{loadingCom ? "Cargando..." : "Seleccioná una comisión"}</option>
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

          {/* MODO ADMIN */}
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

          {/* Campo duración — visible siempre */}
          <div className="mb-5 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Duración del QR <span className="text-gray-400 font-normal">(en minutos)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={480}
                value={duracion}
                onChange={e => { setDuracion(Number(e.target.value)); setMostrarQR(false); setToken(""); }}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
              <div className="flex gap-2">
                {[30, 60, 90, 120].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setDuracion(m); setMostrarQR(false); setToken(""); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      duracion === m
                        ? "bg-green-700 text-white"
                        : "border border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400">
              El QR expirará a los {duracion} minutos de generado.
            </p>
          </div>

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

              {/* Info de expiración */}
              {expiraInfo && (
                <div className="w-full rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
                  <span>⏱</span>
                  <span>
                    Válido por <strong>{expiraInfo.minutos} minutos</strong> · Expira a las{" "}
                    <strong>{new Date(expiraInfo.expiraEn).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</strong>
                  </span>
                </div>
              )}

              {/* QR + info identificatoria */}
              <div ref={qrRef} className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-200 flex flex-col items-center gap-3 w-full max-w-xs">
                <QRCode value={urlQR} size={220} level="H" />
                <div className="text-center text-sm text-gray-700 w-full border-t border-gray-100 pt-3">
                  {infoQR.materia   && <p className="font-bold text-base text-gray-900">{infoQR.materia}</p>}
                  {infoQR.comision  && <p className="text-xs text-gray-500 mt-0.5">{infoQR.comision}</p>}
                  {infoQR.docente   && <p className="text-sm font-medium text-gray-700 mt-1">👨‍🏫 {infoQR.docente}</p>}
                  {infoQR.edificio  && <p className="text-xs text-gray-400 mt-1">🏢 {infoQR.edificio}</p>}
                  {infoQR.aula && !isDocente && <p className="text-xs text-gray-400">🚪 {infoQR.aula}</p>}
                  {expiraInfo       && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⏱ Válido {expiraInfo.minutos} min
                    </p>
                  )}
                </div>
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
              {infoQR.materia  && <p className="text-xl font-bold text-gray-900">{infoQR.materia}</p>}
              {infoQR.comision && <p className="text-sm text-gray-500">{infoQR.comision}</p>}
              {infoQR.docente  && <p className="text-sm font-medium text-gray-700">👨‍🏫 {infoQR.docente}</p>}
              {infoQR.edificio && <p className="text-xs text-gray-400">🏢 {infoQR.edificio} {infoQR.aula && `· 🚪 ${infoQR.aula}`}</p>}
              <QRCode value={urlQR || "sin-token"} size={220} level="H" />
              {expiraInfo && (
                <p className="text-xs text-amber-600">⏱ Válido por {expiraInfo.minutos} minutos</p>
              )}
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
