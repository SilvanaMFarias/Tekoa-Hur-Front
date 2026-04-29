"use client";

// ============================================================
// components/RegistroAsistencia.js
// ============================================================
// FIXES:
//  ✅ Selector Estudiante / Docente (antes solo funcionaba para alumnos)
//  ✅ Lee el token de los searchParams correctamente
//  ✅ Valida que lleguen los parámetros antes de llamar al backend
//  ✅ Enter en el campo DNI dispara el registro
//  ✅ Limpia DNI y mensajes tras registro exitoso
// ============================================================

import { useEffect, useState } from "react";
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress, ToggleButton, ToggleButtonGroup,
} from "@mui/material";

export default function RegistroAsistencia({ edificioId, aulaId, rtoken, fechaInicio, fechaFin }) {
  const [loading,     setLoading]     = useState(true);
  const [qrValido,    setQrValido]    = useState(false);
  const [msgError,    setMsgError]    = useState("");
  const [msgExito,    setMsgExito]    = useState("");
  const [dni,         setDni]         = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState("ESTUDIANTE"); // ✅ selector de rol

  // Validar QR al cargar
  useEffect(() => {
    async function validar() {
      if (!edificioId || !aulaId || !rtoken) {
        setQrValido(false);
        setMsgError("URL inválida: faltan parámetros del QR.");
        setLoading(false);
        return;
      }
      try {
        const res  = await fetch(
          `${process.env.NEXT_PUBLIC_BACK_URL}/api/qr/validar?edificioId=${edificioId}&aulaId=${aulaId}&rtoken=${rtoken}`
        );
        const data = await res.json();
        if (!res.ok) {
          setQrValido(false);
          setMsgError(data.message || "QR inválido.");
        } else {
          setQrValido(true);
        }
      } catch {
        setQrValido(false);
        setMsgError("No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    }
    validar();
  }, [edificioId, aulaId, rtoken]);

  const registrar = async () => {
    if (!dni.trim()) return;
    setRegistrando(true);
    setMsgError("");
    setMsgExito("");
    try {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_URL}/api/asistencias/registrar-desde-qr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipoUsuario, usuarioId: dni.trim(), aulaId, rtoken, fechaInicio, fechaFin }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        // 409 = ya estaba registrado → lo tratamos como info, no como error grave
        res.status === 409 ? setMsgExito(data.message) : setMsgError(data.message || "Error al registrar.");
      } else {
        setMsgExito(data.message || "✅ Asistencia registrada");
        setDni(""); // limpiar para el próximo alumno
      }
    } catch {
      setMsgError("Error de red. Verificá tu conexión.");
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5" px={2}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 420, width: "100%", borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
          Registro de asistencia
        </Typography>

        {loading && <Box display="flex" justifyContent="center" py={3}><CircularProgress/></Box>}

        {!loading && !qrValido && (
          <Alert severity="error">{msgError}</Alert>
        )}

        {!loading && qrValido && (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              QR válido. Ingresá tu DNI para registrar asistencia.
            </Alert>

            {/* Selector de rol */}
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Soy:</Typography>
            <ToggleButtonGroup value={tipoUsuario} exclusive fullWidth sx={{ mb: 3 }}
              onChange={(_, v) => { if (v) { setTipoUsuario(v); setMsgError(""); setMsgExito(""); } }}>
              <ToggleButton value="ESTUDIANTE">Estudiante</ToggleButton>
              <ToggleButton value="PROFESOR">Docente</ToggleButton>
            </ToggleButtonGroup>

            <TextField fullWidth label="DNI" value={dni} margin="normal"
              inputProps={{ inputMode: "numeric" }}
              onChange={e => { setDni(e.target.value); setMsgError(""); setMsgExito(""); }}
              onKeyDown={e => { if (e.key === "Enter" && dni.trim()) registrar(); }}
            />

            <Button fullWidth variant="contained" color="primary" sx={{ mt: 2, py: 1.5 }}
              disabled={!dni.trim() || registrando} onClick={registrar}>
              {registrando ? <CircularProgress size={22} color="inherit"/> : "Registrar asistencia"}
            </Button>

            {msgError && <Alert severity="error"  sx={{ mt: 2 }}>{msgError}</Alert>}
          </>
        )}

        {msgExito && <Alert severity="success" sx={{ mt: 2 }}>{msgExito}</Alert>}
      </Paper>
    </Box>
  );
}
