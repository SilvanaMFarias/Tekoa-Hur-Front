"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

export default function RegistroAsistencia({
  edificioId,
  aulaId,
  rtoken,
  fechaInicio,
  fechaFin,
}) {
  const [loading, setLoading] = useState(true);
  const [qrValido, setQrValido] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgExito, setMsgExito] = useState("");
  const [registrando, setRegistrando] = useState(false);

  // 🔍 Validar QR
  useEffect(() => {
    async function validar() {
      if (!edificioId || !aulaId || !rtoken) {
        setQrValido(false);
        setMsgError("URL inválida");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACK_URL}/api/qr/validar?edificioId=${edificioId}&aulaId=${aulaId}&rtoken=${rtoken}`
        );

        const data = await res.json();

        if (!res.ok) {
          setQrValido(false);
          setMsgError(data.message || "QR inválido");
        } else {
          setQrValido(true);
        }
      } catch {
        setQrValido(false);
        setMsgError("Error de conexión");
      } finally {
        setLoading(false);
      }
    }

    validar();
  }, [edificioId, aulaId, rtoken]);

  // ✅ REGISTRO SIN DNI
  const registrar = async () => {
    setRegistrando(true);
    setMsgError("");
    setMsgExito("");

    try {
      const res = await fetch("/api/proxy/api/asistencias/registrar-desde-qr", {
        method: "POST",
        credentials: "include", // 🔥 clave
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aulaId,
          rtoken,
          fechaInicio,
          fechaFin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        res.status === 409
          ? setMsgExito(data.message)
          : setMsgError(data.message || "Error");
      } else {
        setMsgExito(data.message || "✅ Asistencia registrada");
      }

    } catch {
      setMsgError("Error de red");
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
      <Paper elevation={4} sx={{ p: 4, maxWidth: 420, width: "100%", borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" align="center" gutterBottom>
          Registro de asistencia
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        )}

        {!loading && !qrValido && (
          <Alert severity="error">{msgError}</Alert>
        )}

        {!loading && qrValido && (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              QR válido. Presioná el botón para registrar asistencia.
            </Alert>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ py: 1.5 }}
              onClick={registrar}
              disabled={registrando}
            >
              {registrando ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Registrar asistencia"
              )}
            </Button>

            {msgError && <Alert severity="error" sx={{ mt: 2 }}>{msgError}</Alert>}
            {msgExito && <Alert severity="success" sx={{ mt: 2 }}>{msgExito}</Alert>}
          </>
        )}
      </Paper>
    </Box>
  );
}