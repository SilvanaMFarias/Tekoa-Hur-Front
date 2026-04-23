"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress
} from "@mui/material";

export default function RegistroAsistencia({
  edificioId,
  aulaId,
  rtoken
}) {
  const [loading, setLoading] = useState(true);
  const [qrValido, setQrValido] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [dni, setDni] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [ok, setOk] = useState("");

  useEffect(() => {
    async function validarQr() {
      try {
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACK_URL}/api/qr/validar?edificioId=${edificioId}&aulaId=${aulaId}&rtoken=${rtoken}`
        );
        const url = `${process.env.NEXT_PUBLIC_BACK_URL}/api/qr/validar?edificioId=${edificioId}&aulaId=${aulaId}&rtoken=${rtoken}`;
        console.log("Validando QR en:", url);

        const response = await fetch(url);

        console.log("Status de respuesta:", response.status);
        
        const data = await response.json();

        if (!response.ok) {
          setQrValido(false);
          setMensaje(data.message || "QR inválido.");
          return;
        }

        setQrValido(true);
        setMensaje("QR válido. Podés registrar tu asistencia.");
      } catch (error) {
        console.error(error);
        setQrValido(false);
        setMensaje("Error al validar el QR.");
      } finally {
        setLoading(false);
      }
    }

    validarQr();
  }, [edificioId, aulaId, rtoken]);

  const registrarAsistencia = async () => {
    try {
      setRegistrando(true);
      setMensaje("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_URL}/api/asistencias/registrar-desde-qr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            edificioId,
            aulaId,
            rtoken,
            dni
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMensaje(data.message || "No se pudo registrar asistencia.");
        return;
      }

      setOk("Asistencia registrada correctamente");
      setDni("");
    } catch (error) {
      console.error(error);
      setMensaje("Error al registrar asistencia.");
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
      px={2}
    >
      <Paper elevation={4} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Registro de asistencia
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress />
          </Box>
        )}

        {!loading && mensaje && !qrValido && (
          <Alert severity="error">{mensaje}</Alert>
        )}

        {!loading && qrValido && (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              {mensaje}
            </Alert>

            <TextField
              fullWidth
              label="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              margin="normal"
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              disabled={!dni || registrando}
              onClick={registrarAsistencia}
            >
              {registrando ? "Registrando..." : "Registrar asistencia"}
            </Button>
          </>
        )}

        {ok && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {ok}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}