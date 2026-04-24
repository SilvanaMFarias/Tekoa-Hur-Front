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
  rtoken,
  comisionId // 🔥 IMPORTANTE
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

        const url = `${process.env.NEXT_PUBLIC_BACK_URL}/api/qr/validar?edificioId=${edificioId}&aulaId=${aulaId}&rtoken=${rtoken}`;

        const response = await fetch(url);
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

      const now = new Date();
      const fecha = now.toISOString().split("T")[0];
      const horaRegistro = now.toTimeString().slice(0, 5);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_URL}/api/asistencias/registrar-desde-qr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            tipoUsuario: "ESTUDIANTE",
            usuarioId: dni,
            comisionId,
            fecha,
            horaRegistro,
            aulaId,
            rtoken
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
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Typography variant="h5" fontWeight="bold">
          Registro de asistencia
        </Typography>

        {loading && <CircularProgress />}

        {!loading && mensaje && !qrValido && (
          <Alert severity="error">{mensaje}</Alert>
        )}

        {!loading && qrValido && (
          <>
            <Alert severity="success">{mensaje}</Alert>

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
              disabled={!dni || registrando}
              onClick={registrarAsistencia}
            >
              {registrando ? "Registrando..." : "Registrar"}
            </Button>
          </>
        )}

        {ok && <Alert severity="success">{ok}</Alert>}
      </Paper>
    </Box>
  );
}
