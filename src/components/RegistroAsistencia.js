"use client";

import { useEffect, useState } from "react";
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress, ToggleButton, ToggleButtonGroup,
} from "@mui/material";

/**
 * Componente de registro de asistencia desde QR.
 *
 * Cambios estéticos aplicados:
 *  - Eliminado minHeight: "100vh" y bgcolor hardcodeado — el AppShell ya
 *    provee el fondo y el centrado de la página (evita doble scroll)
 *  - Botón "Registrar asistencia" en verde institucional (#1B5E20)
 *  - ToggleButtonGroup con colores semánticos (verde = seleccionado)
 *  - Lógica interna sin cambios
 */
export default function RegistroAsistencia({ edificioId, aulaId, rtoken, fechaInicio, fechaFin }) {
  const [loading,     setLoading]     = useState(true);
  const [qrValido,    setQrValido]    = useState(false);
  const [msgError,    setMsgError]    = useState("");
  const [msgExito,    setMsgExito]    = useState("");
  const [dni,         setDni]         = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState("ESTUDIANTE");

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
        res.status === 409
          ? setMsgExito(data.message)
          : setMsgError(data.message || "Error al registrar.");
      } else {
        setMsgExito(data.message || "✅ Asistencia registrada");
        setDni("");
      }
    } catch {
      setMsgError("Error de red. Verificá tu conexión.");
    } finally {
      setRegistrando(false);
    }
  };

  return (
    // ✅ Sin minHeight 100vh ni bgcolor — el AppShell ya maneja el layout
    <Box display="flex" justifyContent="center" px={2} py={4}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 420, width: "100%", borderRadius: 3 }}>

        <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
          Registro de asistencia
        </Typography>

        {/* Spinner de validación */}
        {loading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress sx={{ color: "#1B5E20" }} />
          </Box>
        )}

        {/* QR inválido */}
        {!loading && !qrValido && (
          <Alert severity="error">{msgError}</Alert>
        )}

        {/* Formulario de registro */}
        {!loading && qrValido && (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              QR válido. Ingresá tu DNI para registrar asistencia.
            </Alert>

            {/* Selector de rol — ✅ verde cuando está seleccionado */}
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Soy:</Typography>
            <ToggleButtonGroup
              value={tipoUsuario}
              exclusive
              fullWidth
              sx={{ mb: 3 }}
              onChange={(_, v) => { if (v) { setTipoUsuario(v); setMsgError(""); setMsgExito(""); } }}
            >
              <ToggleButton
                value="ESTUDIANTE"
                sx={{
                  "&.Mui-selected": { bgcolor: "#1B5E20", color: "white", "&:hover": { bgcolor: "#2E7D32" } },
                }}
              >
                Estudiante
              </ToggleButton>
              <ToggleButton
                value="PROFESOR"
                sx={{
                  "&.Mui-selected": { bgcolor: "#1B5E20", color: "white", "&:hover": { bgcolor: "#2E7D32" } },
                }}
              >
                Docente
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Campo DNI */}
            <TextField
              fullWidth
              label="DNI"
              value={dni}
              margin="normal"
              inputProps={{ inputMode: "numeric" }}
              onChange={e => { setDni(e.target.value); setMsgError(""); setMsgExito(""); }}
              onKeyDown={e => { if (e.key === "Enter" && dni.trim()) registrar(); }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#1B5E20" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#1B5E20" },
              }}
            />

            {/* Botón principal — ✅ verde institucional */}
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2, py: 1.5, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}
              disabled={!dni.trim() || registrando}
              onClick={registrar}
            >
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
