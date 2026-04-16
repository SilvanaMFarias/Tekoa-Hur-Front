"use client";

import { useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { AULAS, construirUrlMock, EDIFICIOS } from "@/config/mocks/mockQr";
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
} from "@mui/material";

export default function GeneradorQR() {
  const [edificio, setEdificio] = useState("");
  const [aula, setAula] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [token, setToken] = useState("");
  const [mostrarQR, setMostrarQR] = useState(false);
  const [openPrint, setOpenPrint] = useState(false);

  const qrRef = useRef(null);
  const printRef = useRef(null);
  const router = useRouter();

  const urlQR = useMemo(() => {
    // if (!edificio || !aula) return "";
    // return construirUrlMock(edificio, aula);
    if (!edificio || !aula || !fechaInicio || !fechaFin || !token) return "";

    return `${construirUrlMock(edificio, aula)}&rtoken=${token}`;
  }, [edificio, aula, fechaInicio, fechaFin, token]);

  const handleGenerarQR = () => {
    if (!edificio || !aula || !fechaInicio || !fechaFin) return;

    //const token = Math.floor(100000 + Math.random() * 900000);
    const token = 111;
    setToken(token);

    setMostrarQR(true);
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
              }}
            >
              <MenuItem value="">
                <em>Seleccionar edificio</em>
              </MenuItem>

              {EDIFICIOS.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
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
              }}
            >
              <MenuItem value="">
                <em>Seleccionar aula</em>
              </MenuItem>

              {AULAS.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
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
                Edificio: <strong>{edificio}</strong>
              </Typography>
              <Typography variant="body2">
                Aula: <strong>{aula}</strong>
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
