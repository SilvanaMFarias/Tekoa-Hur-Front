"use client";

// ============================================================
// components/GeneradorQR.jsx
// ============================================================
// FIXES:
//  ✅ Estado "generando" separado del "loadingAulas" (antes el botón
//     se trababa cuando cargaba aulas)
//  ✅ Alert de error visible al usuario cuando falla algo
//  ✅ URL del QR con estructura mínima (token + aulaId + edificioId)
// ============================================================

import { useMemo, useRef, useState, useEffect } from "react";
import QRCode        from "react-qr-code";
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
  const [generando,        setGenerando]        = useState(false); // ✅ estado propio
  const [error,            setError]            = useState("");

  const qrRef    = useRef(null);
  const printRef = useRef(null);
  const router   = useRouter();

  // Cargar edificios al montar
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACK_URL}/api/edificios`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Error cargando edificios");
        const data = await res.json();
        setEdificios(data.map(e => ({ ...e, edificioId: String(e.edificioId) })));
      } catch (e) {
        setError("No se pudieron cargar los edificios.");
      } finally {
        setLoadingEdificios(false);
      }
    })();
  }, []);

  // Cargar aulas al elegir edificio
  useEffect(() => {
    if (!edificio) { setAulas([]); return; }
    if (aulasCache[edificio]) { setAulas(aulasCache[edificio]); return; }
    (async () => {
      try {
        setLoadingAulas(true);
        const res  = await fetch(`${BACK_URL}/api/aulas?edificioId=${edificio}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Error cargando aulas");
        const data = await res.json();
        const norm = data.map(a => ({ ...a, aulaId: String(a.aulaId) }));
        setAulas(norm);
        setAulasCache(prev => ({ ...prev, [edificio]: norm }));
      } catch (e) {
        setError("No se pudieron cargar las aulas.");
      } finally {
        setLoadingAulas(false);
      }
    })();
  }, [edificio]);

  useEffect(() => {
    if (aula && !aulas.find(a => a.aulaId === aula)) setAula("");
  }, [aulas, aula]);

  const selectedEdificio = edificios.find(e => e.edificioId === edificio);
  const selectedAula     = aulas.find(a => a.aulaId === aula);

  // URL que va dentro del QR
  const urlQR = useMemo(() => {
    if (!token) return "";
    return `${process.env.NEXT_PUBLIC_FRONT_URL}/registrar-asistencia?rtoken=${token}&aulaId=${aula}&edificioId=${edificio}`;
  }, [token, aula, edificio]);

  const handleGenerarQR = async () => {
    if (!edificio || !aula) return;
    setError("");
    setGenerando(true);
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
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGenerando(false);
    }
  };

  const handleImprimirQR = useReactToPrint({
    contentRef: printRef,
    documentTitle: `qr-${selectedAula?.nombreCompleto || aula}`,
  });

  const handleDescargarQR = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 300;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white"; ctx.fillRect(0,0,300,300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-${selectedAula?.nombreCompleto || aula}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <>
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 600, p: 4, borderRadius: 4, mx: "auto" }}>
        <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>Generar QR</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        {/* Edificio */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Edificio</InputLabel>
            <Select value={edificio} label="Edificio"
              onChange={e => { setEdificio(String(e.target.value)); setAula(""); setMostrarQR(false); }}
              disabled={loadingEdificios}>
              <MenuItem value=""><em>Seleccionar edificio</em></MenuItem>
              {loadingEdificios
                ? <MenuItem disabled><CircularProgress size={20}/></MenuItem>
                : edificios.map(i => <MenuItem key={i.edificioId} value={i.edificioId}>{i.nombre}</MenuItem>)
              }
            </Select>
          </FormControl>
        </Box>

        {/* Aula */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Aula</InputLabel>
            <Select value={aula} label="Aula"
              onChange={e => { setAula(String(e.target.value)); setMostrarQR(false); }}
              disabled={!edificio || loadingAulas}>
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
          onClick={handleGenerarQR} disabled={!edificio || !aula || generando}>
          {generando ? <CircularProgress size={22} color="inherit"/> : "Generar QR"}
        </Button>

        {/* QR resultado */}
        {mostrarQR && urlQR && (
          <Box sx={{ mt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Paper ref={qrRef} elevation={2} sx={{ p: 2, borderRadius: 3, background: "white" }}>
              <QRCode value={urlQR} size={220}/>
            </Paper>
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">Edificio: <strong>{selectedEdificio?.nombre}</strong></Typography>
              <Typography variant="body2">Aula: <strong>{selectedAula?.nombreCompleto}</strong></Typography>
            </Box>
            <Box sx={{ mt: 3, width: "100%", display: "flex", gap: 2 }}>
              <Button variant="contained" color="success" fullWidth onClick={handleDescargarQR}>Descargar</Button>
              <Button variant="contained" color="inherit" fullWidth onClick={() => setOpenPrint(true)}>Imprimir</Button>
            </Box>
          </Box>
        )}

        <Button variant="outlined" color="error" fullWidth onClick={() => router.push("/")} sx={{ mt: 3 }}>
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
            <Box sx={{ mt: 2 }}><QRCode value={urlQR || "sin-token"} size={220}/></Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={() => setOpenPrint(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleImprimirQR}>Imprimir</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
