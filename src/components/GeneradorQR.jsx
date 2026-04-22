"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { BACK_URL, getAuthHeaders } from "@/config/api";

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
  Alert,
} from "@mui/material";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const edificioSeleccionado = edificios.find(e => e.id === edificio);
  const aulaSeleccionada = aulas.find(a => a.id === aula);

  const [urlQR, setUrlQR] = useState("");
  const qrRef = useRef(null);
  const printRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      setError("");

      if (!BACK_URL) {
        setError("La variable de entorno NEXT_PUBLIC_BACK_URL no está configurada.");
        setLoading(false);
        return;
      }

      try {
        const headers = {
          Accept: "application/json",
        };
        const authHeaders = getAuthHeaders();
        if (authHeaders.Authorization) {
          headers.Authorization = authHeaders.Authorization;
        }

        // Cargar edificios
        const edificiosResponse = await fetch(`${BACK_URL}/api/edificios`, { headers });
        if (edificiosResponse.ok) {
          const edificiosData = await edificiosResponse.json();
          if (Array.isArray(edificiosData)) {
            setEdificios(edificiosData.map(ed => ({
              id: ed.edificioId,
              nombre: ed.nombre,
            })));
          }
        }

        // Cargar aulas
        const aulasResponse = await fetch(`${BACK_URL}/api/aulas`, { headers });
        if (aulasResponse.ok) {
          const aulasData = await aulasResponse.json();
          if (Array.isArray(aulasData)) {
            setAulas(aulasData.map(aula => ({
              id: aula.aulaId,
              nombre: aula.nombreCompleto,
              edificioId: aula.edificioId,
            })));
          }
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("No se pudieron cargar edificios y aulas desde el backend.");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  const handleGenerarQR = async () => {
    if (!edificio || !aula || !fechaInicio || !fechaFin) return;

    setLoading(true);
    setError("");

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      const authHeaders = getAuthHeaders();
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }

      const response = await fetch(`${BACK_URL}/api/qr/generar`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          edificioId: edificio,
          aulaId: aula,
          fechaInicio,
          fechaFin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Error al generar el QR.");
        return;
      }

      const data = await response.json();
      setUrlQR(data.url);
      setToken(data.token || ""); // Si el backend devuelve token
      setMostrarQR(true);
    } catch (err) {
      console.error("Error generando QR:", err);
      setError("Error al conectar con el backend para generar el QR.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrint = () => {
    setOpenPrint(true);
  };

  const handleClosePrint = () => {
    setOpenPrint(false);
  };

  const handleImprimirQR = useReactToPrint({
    contentRef: printRef,
    documentTitle: `qr-${edificio}-aula-${aula}`,
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
      link.download = `qr-${edificio.toLowerCase().replace(/\s+/g, "-")}-aula-${aula}.png`;
      link.click();

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 600,
          p: 4,
          borderRadius: 4,
          mx: "auto",
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          align="center"
          fontWeight="bold"
          gutterBottom
        >
          Generar QR
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="edificio-label">Edificio</InputLabel>
            <Select
              labelId="edificio-label"
              value={edificio}
              label="edificio"
              onChange={(e) => {
                setEdificio(e.target.value);
                setMostrarQR(false);
                setUrlQR("");
              }}
            >
              <MenuItem value="">
                <em>Seleccionar edificio</em>
              </MenuItem>

              {edificios.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="aula-label">Aula</InputLabel>
            <Select
              labelId="aula-label"
              value={aula}
              label="Aula"
              onChange={(e) => {
                setAula(e.target.value);
                setMostrarQR(false);
                setUrlQR("");
              }}
            >
              <MenuItem value="">
                <em>Seleccionar aula</em>
              </MenuItem>

              {aulas.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Fecha inicio
            </Typography>

            <input
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setMostrarQR(false);
                setUrlQR("");
              }}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Fecha fin
            </Typography>

            <input
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setMostrarQR(false);
                setUrlQR("");
              }}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
          </FormControl>
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={handleGenerarQR}
          disabled={!edificio || !aula || !fechaInicio || !fechaFin}
          sx={{
            mt: 2,
            py: 1.5,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Generar QR
        </Button>

        {mostrarQR && urlQR && (
          <Box
            sx={{
              mt: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Paper
              ref={qrRef}
              elevation={2}
              sx={{
                p: 2,
                borderRadius: 3,
                backgroundColor: "white",
              }}
            >
              <QRCode value={urlQR} size={220} />
            </Paper>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2">
                Edificio: <strong>{edificioSeleccionado?.nombre}</strong>
              </Typography>
              <Typography variant="body2">
                Aula: <strong>{aulaSeleccionada?.nombre}</strong>
              </Typography>
            </Box>

            <Typography
              variant="caption"
              sx={{
                mt: 2,
                textAlign: "center",
                wordBreak: "break-all",
                display: "block",
              }}
            >
              {urlQR}
            </Typography>

            <Box
              sx={{
                mt: 3,
                width: "100%",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={handleDescargarQR}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                Descargar QR
              </Button>

              <Button
                variant="contained"
                color="inherit"
                fullWidth
                onClick={handleOpenPrint}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
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
          sx={{
            mt: 3,
            py: 1.5,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Cancelar
        </Button>
      </Paper>

      <Dialog
        open={openPrint}
        onClose={handleClosePrint}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Vista previa de impresión</DialogTitle>

        <DialogContent>
          <Box
            ref={printRef}
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              backgroundColor: "white",
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              QR de aula
            </Typography>

            <Typography variant="body1" sx={{ mb: 0.5 }}>
              Edificio: {edificio}
            </Typography>

            <Typography variant="body1" sx={{ mb: 3 }}>
              Aula: {aula}
            </Typography>

            <Box
              sx={{
                p: 2,
                border: "1px solid #ddd",
                borderRadius: 2,
                backgroundColor: "white",
              }}
            >
              <QRCode value={urlQR} size={220} />
            </Box>

            <Typography variant="body2" sx={{ mt: 3 }}>
              Escaneá este código para registrar asistencia
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePrint} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleImprimirQR}
            sx={{ textTransform: "none" }}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
