"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";

import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { BACK_URL, getAuthHeaders } from "@/config/api";

export default function GeneradorQR() {
  const [edificio, setEdificio] = useState("");
  const [aula, setAula] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [token, setToken] = useState("");
  const [mostrarQR, setMostrarQR] = useState(false);
  const [openPrint, setOpenPrint] = useState(false);

  const [edificios, setEdificios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [aulasCache, setAulasCache] = useState({});

  const [loadingEdificios, setLoadingEdificios] = useState(true);
  const [loadingAulas, setLoadingAulas] = useState(false);

  const qrRef = useRef(null);
  const printRef = useRef(null);
  const router = useRouter();

  // 🔹 EDIFICIOS
  useEffect(() => {
    const fetchEdificios = async () => {
      try {
        const response = await fetch(`${BACK_URL}/api/edificios`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();

          const normalizados = data.map((e) => ({
            ...e,
            edificioId: String(e.edificioId),
          }));

          setEdificios(normalizados);
        }
      } catch (error) {
        console.error("Error fetching edificios:", error);
      } finally {
        setLoadingEdificios(false);
      }
    };

    fetchEdificios();
  }, []);

  // 🔹 AULAS
  useEffect(() => {
    if (!edificio) {
      setAulas([]);
      return;
    }

    if (aulasCache[edificio]) {
      setAulas(aulasCache[edificio]);
      return;
    }

    const fetchAulas = async () => {
      try {
        setLoadingAulas(true);

        const response = await fetch(
          `${BACK_URL}/api/aulas?edificioId=${edificio}`,
          { headers: getAuthHeaders() }
        );

        if (response.ok) {
          const data = await response.json();

          const normalizados = data.map((a) => ({
            ...a,
            aulaId: String(a.aulaId),
          }));

          setAulas(normalizados);

          setAulasCache((prev) => ({
            ...prev,
            [edificio]: normalizados,
          }));
        }
      } catch (error) {
        console.error("Error fetching aulas:", error);
      } finally {
        setLoadingAulas(false);
      }
    };

    fetchAulas();
  }, [edificio]);

  // 🔹 Consistencia
  useEffect(() => {
    if (aula && !aulas.find((a) => a.aulaId === aula)) {
      setAula("");
    }
  }, [aulas, aula]);

  const selectedEdificio = edificios.find(
    (e) => e.edificioId === edificio
  );
  const selectedAula = aulas.find((a) => a.aulaId === aula);

  // URL REAL, la fecha ahora la decide el backend 
  const urlQR = useMemo(() => {
  if (!edificio || !aula || !token) return "";

  return `${process.env.NEXT_PUBLIC_FRONT_URL}/registrar-asistencia?edificioId=${edificio}&aulaId=${aula}&rtoken=${token}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
}, [edificio, aula, token, fechaInicio, fechaFin]);


  const handleGenerarQR = async () => {
  if (!edificio || !aula) return;

  try {
    setLoadingAulas(true); // opcional: podés usar otro loading si querés

    const response = await fetch(`${BACK_URL}/api/qr/generar`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ aulaId: aula })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message);
      return;
    }

    setToken(data.rtoken);
    setMostrarQR(true);

  } catch (error) {
    console.error("Error generando QR:", error);
  } finally {
    setLoadingAulas(false);
  }
};

  const handleImprimirQR = useReactToPrint({
    contentRef: printRef,
    documentTitle: `qr-${
      selectedEdificio?.nombre?.toLowerCase().replace(/\s+/g, "-") || edificio
    }-aula-${selectedAula?.nombreCompleto || aula}`,
  });

  const handleDescargarQR = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, 300, 300);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `qr-${
        selectedEdificio?.nombre?.toLowerCase().replace(/\s+/g, "-") || edificio
      }-aula-${selectedAula?.nombreCompleto || aula}.png`;
      link.click();

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  return (
    <>
      <Paper suppressHydrationWarning elevation={3} sx={{ width: "100%", maxWidth: 600, p: 4, borderRadius: 4, mx: "auto" }}>
        <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
          Generar QR
        </Typography>

        {/* EDIFICIO */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Edificio</InputLabel>
            <Select
              value={edificio}
              label="Edificio"
              onChange={(e) => {
                setEdificio(String(e.target.value));
                setAula("");
                setMostrarQR(false);
              }}
              disabled={loadingEdificios}
            >
              <MenuItem value="">
                <em>Seleccionar edificio</em>
              </MenuItem>

              {loadingEdificios ? (
                <MenuItem disabled>
                  <CircularProgress size={20} />
                </MenuItem>
              ) : (
                edificios.map((item) => (
                  <MenuItem key={item.edificioId} value={item.edificioId}>
                    {item.nombre}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>

        {/* AULA */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Aula</InputLabel>
            <Select
              value={aula}
              label="Aula"
              onChange={(e) => {
                setAula(String(e.target.value));
                setMostrarQR(false);
              }}
              disabled={!edificio || loadingAulas}
            >
              {!edificio ? (
                <MenuItem disabled>
                  <em>Primero seleccioná un edificio</em>
                </MenuItem>
              ) : loadingAulas ? (
                <MenuItem disabled>
                  <CircularProgress size={20} />
                </MenuItem>
              ) : (
                aulas.map((item) => (
                  <MenuItem key={item.aulaId} value={item.aulaId}>
                    {item.nombreCompleto}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>

        {/* FECHAS */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2">Fecha inicio</Typography>
          <input
            type="datetime-local"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2">Fecha fin</Typography>
          <input
            type="datetime-local"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </Box>

        <Button fullWidth variant="contained" onClick={handleGenerarQR}>
          Generar QR
        </Button>

        {/* QR */}
        {mostrarQR && urlQR && (
          <Box sx={{ mt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Paper ref={qrRef} elevation={2} sx={{ p: 2, borderRadius: 3, backgroundColor: "white" }}>
              <QRCode value={urlQR} size={220} />
            </Paper>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2">
                Edificio: <strong>{selectedEdificio?.nombre}</strong>
              </Typography>
              <Typography variant="body2">
                Aula: <strong>{selectedAula?.nombreCompleto}</strong>
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ mt: 2, wordBreak: "break-all" }}>
              {urlQR}
            </Typography>

            <Box sx={{ mt: 3, width: "100%", display: "flex", gap: 2 }}>
              <Button variant="contained" color="success" fullWidth onClick={handleDescargarQR}>
                Descargar QR
              </Button>
              <Button variant="contained" color="inherit" fullWidth onClick={() => setOpenPrint(true)}>
                Imprimir QR
              </Button>
            </Box>
          </Box>
        )}

        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={() => router.push("/")}
          sx={{ mt: 3 }}
        >
          Cancelar
        </Button>
      </Paper>

      <Dialog open={openPrint} onClose={() => setOpenPrint(false)} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ textAlign: "center" }}>
    Vista previa de impresión
  </DialogTitle>

  <DialogContent>
    <Box
      ref={printRef}
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Typography variant="h5">QR de aula</Typography>

      <Typography>Edificio: {selectedEdificio?.nombre}</Typography>
      <Typography>Aula: {selectedAula?.nombreCompleto}</Typography>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <QRCode value={urlQR} size={220} />
      </Box>
    </Box>
  </DialogContent>

  <DialogActions sx={{ justifyContent: "center" }}>
    <Button onClick={() => setOpenPrint(false)}>Cancelar</Button>
    <Button variant="contained" onClick={handleImprimirQR}>
      Imprimir
    </Button>
  </DialogActions>
</Dialog>
    </>
  );
}