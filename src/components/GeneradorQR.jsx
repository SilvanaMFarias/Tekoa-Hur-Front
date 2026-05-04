"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import {
  Box, Paper, Typography, FormControl, InputLabel,
  Select, MenuItem, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Alert,
} from "@mui/material";
import { BACK_URL, getAuthHeaders } from "@/config/api";

export default function GeneradorQR() {
  const [edificio,         setEdificio]         = useState("");
  const [aula,             setAula]             = useState("");
  const [token,            setToken]            = useState("");
  const [mostrarQR,        setMostrarQR]        = useState(false);
  const [openPrint,        setOpenPrint]        = useState(false);
  const [edificios,        setEdificios]        = useState([]);
  const [aulas,            setAulas]            = useState([]);
  const [aulasCache,       setAulasCache]       = useState({});
  const [loadingEdificios, setLoadingEdificios] = useState(true);
  const [loadingAulas,     setLoadingAulas]     = useState(false);
  const [generando,        setGenerando]        = useState(false);
  const [error,            setError]            = useState("");

  const qrRef    = useRef(null);
  const printRef = useRef(null);
  const router   = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${BACK_URL}/api/edificios`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Error cargando edificios");
        const data = await res.json();
        setEdificios(data.map(e => ({ ...e, edificioId: String(e.edificioId) })));
      } catch { setError("No se pudieron cargar los edificios."); }
      finally   { setLoadingEdificios(false); }
    })();
  }, []);

  useEffect(() => {
    if (!edificio) { setAulas([]); return; }
    if (aulasCache[edificio]) { setAulas(aulasCache[edificio]); return; }
    (async () => {
      try {
        setLoadingAulas(true);
        const res  = await fetch(`${BACK_URL}/api/aulas?edificioId=${edificio}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const norm = data.map(a => ({ ...a, aulaId: String(a.aulaId) }));
        setAulas(norm);
        setAulasCache(prev => ({ ...prev, [edificio]: norm }));
      } catch { setError("No se pudieron cargar las aulas."); }
      finally   { setLoadingAulas(false); }
    })();
  }, [edificio]);

  useEffect(() => {
    if (aula && !aulas.find(a => a.aulaId === aula)) setAula("");
  }, [aulas, aula]);

  const selectedEdificio = edificios.find(e => e.edificioId === edificio);
  const selectedAula     = aulas.find(a => a.aulaId === aula);

  const urlQR = useMemo(() => {
    if (!token) return "";
    return `${process.env.NEXT_PUBLIC_FRONT_URL}/registrar-asistencia?rtoken=${token}&aulaId=${aula}&edificioId=${edificio}`;
  }, [token, aula, edificio]);

  const handleGenerarQR = async () => {
    if (!edificio || !aula) return;
    setError(""); setGenerando(true);
    try {
      const res  = await fetch(`${BACK_URL}/api/qr/generar`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ aulaId: aula }),
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
    documentTitle: `qr-${selectedAula?.nombreCompleto || aula}`,
  });

  // Descarga en alta resolución (1200×1200)
  const handleDescargarQR = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const TAM    = 1200;
    const MARGEN = 60;

    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();

    img.onload = () => {
      const canvas  = document.createElement("canvas");
      canvas.width  = TAM;
      canvas.height = TAM;
      const ctx     = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, TAM, TAM);
      ctx.drawImage(img, MARGEN, MARGEN, TAM - MARGEN * 2, TAM - MARGEN * 2);
      const link    = document.createElement("a");
      link.href     = canvas.toDataURL("image/png", 1.0);
      link.download = `qr-${selectedAula?.nombreCompleto || aula}.png`;
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <>
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 600, p: 4, borderRadius: 4, mx: "auto" }}>
        <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>Generar QR</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Edificio</InputLabel>
            <Select value={edificio} label="Edificio" disabled={loadingEdificios}
              onChange={e => { setEdificio(String(e.target.value)); setAula(""); setMostrarQR(false); }}>
              <MenuItem value=""><em>Seleccionar edificio</em></MenuItem>
              {loadingEdificios
                ? <MenuItem disabled><CircularProgress size={20}/></MenuItem>
                : edificios.map(i => <MenuItem key={i.edificioId} value={i.edificioId}>{i.nombre}</MenuItem>)
              }
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Aula</InputLabel>
            <Select value={aula} label="Aula" disabled={!edificio || loadingAulas}
              onChange={e => { setAula(String(e.target.value)); setMostrarQR(false); }}>
              {!edificio
                ? <MenuItem disabled><em>Primero seleccioná un edificio</em></MenuItem>
                : loadingAulas
                  ? <MenuItem disabled><CircularProgress size={20}/></MenuItem>
                  : aulas.map(i => <MenuItem key={i.aulaId} value={i.aulaId}>{i.nombreCompleto}</MenuItem>)
              }
            </Select>
          </FormControl>
        </Box>

        <Button fullWidth variant="contained"
          sx={{ bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}
          onClick={handleGenerarQR} disabled={!edificio || !aula || generando}>
          {generando ? <CircularProgress size={22} color="inherit"/> : "Generar QR"}
        </Button>

        {mostrarQR && urlQR && (
          <Box sx={{ mt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Paper ref={qrRef} elevation={2} sx={{ p: 2, borderRadius: 3, background: "white" }}>
              <QRCode value={urlQR} size={300} level="H" />
            </Paper>
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">Edificio: <strong>{selectedEdificio?.nombre}</strong></Typography>
              <Typography variant="body2">Aula: <strong>{selectedAula?.nombreCompleto}</strong></Typography>
            </Box>
            <Box sx={{ mt: 3, width: "100%", display: "flex", gap: 2 }}>
              {/* ✅ Descarga y impresión en verde institucional */}
              <Button variant="contained" fullWidth onClick={handleDescargarQR}
                sx={{ bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
                Descargar
              </Button>
              <Button variant="outlined" fullWidth onClick={() => setOpenPrint(true)}
                sx={{ borderColor: "#1B5E20", color: "#1B5E20", "&:hover": { borderColor: "#2E7D32", bgcolor: "#E8F5E9" } }}>
                Imprimir
              </Button>
            </Box>
          </Box>
        )}

        {/* ✅ Botón Cancelar: gris neutro en lugar de rojo — el rojo es para errores, no acciones secundarias */}
        <Button variant="outlined" fullWidth onClick={() => router.push("/")}
          sx={{ mt: 3, borderColor: "#D1D5DB", color: "#6B7280", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
          Cancelar
        </Button>
      </Paper>

      <Dialog open={openPrint} onClose={() => setOpenPrint(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center" }}>Vista previa de impresión</DialogTitle>
        <DialogContent>
          <Box ref={printRef} sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <Typography variant="h5">QR de aula</Typography>
            <Typography>Edificio: {selectedEdificio?.nombre}</Typography>
            <Typography>Aula: {selectedAula?.nombreCompleto}</Typography>
            <Box sx={{ mt: 2 }}><QRCode value={urlQR || "sin-token"} size={280} level="H"/></Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={() => setOpenPrint(false)}
            sx={{ color: "#6B7280" }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleImprimirQR}
            sx={{ bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
