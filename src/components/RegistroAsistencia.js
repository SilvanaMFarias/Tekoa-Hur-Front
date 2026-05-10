"use client";

import { useEffect, useState } from "react";
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress, ToggleButton, ToggleButtonGroup,
} from "@mui/material";

const BACK_URL = process.env.NEXT_PUBLIC_BACK_URL;

/**
 * RegistroAsistencia — flujo según si el usuario está logueado:
 *
 * CON sesión (alumno/docente logueado):
 *   → Registra automáticamente usando los datos del JWT guardado en localStorage
 *   → No pide DNI ni selector de rol (ya los sabe)
 *   → Muestra nombre del usuario y un botón "Registrar mi asistencia"
 *
 * SIN sesión (escaneó el QR sin estar logueado):
 *   → Muestra el formulario manual con selector de rol y campo DNI
 *   → Mismo comportamiento de antes
 */
export default function RegistroAsistencia({ edificioId, aulaId, rtoken, fechaInicio, fechaFin }) {
  const [loading,     setLoading]     = useState(true);
  const [qrValido,    setQrValido]    = useState(false);
  const [msgError,    setMsgError]    = useState("");
  const [msgExito,    setMsgExito]    = useState("");
  const [registrando, setRegistrando] = useState(false);

  // Modo manual (sin sesión)
  const [dni,         setDni]         = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("ESTUDIANTE");

  // Datos del usuario logueado (del localStorage)
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  // Leer sesión del localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tekoa_user");
      if (raw) setUsuarioLogueado(JSON.parse(raw));
    } catch { /* ignorar */ }
  }, []);

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
        const res  = await fetch(`${BACK_URL}/api/qr/validar?edificioId=${edificioId}&aulaId=${aulaId}&rtoken=${rtoken}`);
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

  // Registrar asistencia — acepta override de dni/tipo para el modo manual
  const registrar = async (dniOverride, tipoOverride) => {
    const dniFinal  = dniOverride  ?? dni.trim();
    const tipoFinal = tipoOverride ?? tipoUsuario;

    if (!dniFinal) return;
    setRegistrando(true);
    setMsgError("");
    setMsgExito("");

    try {
      // Intentar enviar con JWT si existe
      const token   = localStorage.getItem("tekoa_token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res  = await fetch(`${BACK_URL}/api/asistencias/registrar-desde-qr`, {
        method: "POST",
        headers,
        body:   JSON.stringify({ tipoUsuario: tipoFinal, usuarioId: dniFinal, aulaId, rtoken, fechaInicio, fechaFin }),
      });
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

  // Mapa de rol del sistema → tipoUsuario del backend
  const rolToTipo = { alumno: "ESTUDIANTE", docente: "PROFESOR", administrador: "PROFESOR" };

  return (
    <Box display="flex" justifyContent="center" px={2} py={4}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 420, width: "100%", borderRadius: 3 }}>

        <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
          Registro de asistencia
        </Typography>

        {/* Spinner de validación del QR */}
        {loading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress sx={{ color: "#1B5E20" }} />
          </Box>
        )}

        {/* QR inválido */}
        {!loading && !qrValido && (
          <Alert severity="error">{msgError}</Alert>
        )}

        {/* QR válido ─────────────────────────────────────────── */}
        {!loading && qrValido && (
          <>
            {/* ── MODO AUTOMÁTICO: usuario logueado ── */}
            {usuarioLogueado ? (
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  QR válido. Tu asistencia se va a registrar automáticamente.
                </Alert>

                {/* Tarjeta del usuario */}
                <Box sx={{
                  mb: 3, p: 2, borderRadius: 2,
                  bgcolor: "#F0FFF4", border: "1px solid #A5D6A7",
                  display: "flex", flexDirection: "column", gap: 0.5,
                }}>
                  <Typography variant="body2" color="text.secondary" fontSize={12}>
                    Registrando como
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="#1B5E20">
                    {usuarioLogueado.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    DNI: {usuarioLogueado.dni} &nbsp;·&nbsp;
                    {usuarioLogueado.rol === "alumno" ? "Estudiante" : "Docente"}
                  </Typography>
                </Box>

                {/* Botón único */}
                <Button
                  fullWidth variant="contained"
                  sx={{ py: 1.5, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}
                  disabled={registrando || !!msgExito}
                  onClick={() => registrar(
                    usuarioLogueado.dni,
                    rolToTipo[usuarioLogueado.rol] ?? "ESTUDIANTE"
                  )}
                >
                  {registrando
                    ? <CircularProgress size={22} color="inherit" />
                    : "Registrar mi asistencia"}
                </Button>
              </>
            ) : (
              /* ── MODO MANUAL: sin sesión ── */
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  QR válido. Ingresá tu DNI para registrar asistencia.
                </Alert>

                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Soy:</Typography>
                <ToggleButtonGroup
                  value={tipoUsuario} exclusive fullWidth sx={{ mb: 3 }}
                  onChange={(_, v) => { if (v) { setTipoUsuario(v); setMsgError(""); setMsgExito(""); } }}
                >
                  <ToggleButton value="ESTUDIANTE" sx={{ "&.Mui-selected": { bgcolor: "#1B5E20", color: "white", "&:hover": { bgcolor: "#2E7D32" } } }}>
                    Estudiante
                  </ToggleButton>
                  <ToggleButton value="PROFESOR" sx={{ "&.Mui-selected": { bgcolor: "#1B5E20", color: "white", "&:hover": { bgcolor: "#2E7D32" } } }}>
                    Docente
                  </ToggleButton>
                </ToggleButtonGroup>

                <TextField
                  fullWidth label="DNI" value={dni} margin="normal"
                  inputProps={{ inputMode: "numeric" }}
                  onChange={e => { setDni(e.target.value); setMsgError(""); setMsgExito(""); }}
                  onKeyDown={e => { if (e.key === "Enter" && dni.trim()) registrar(); }}
                  sx={{
                    "& .MuiOutlinedInput-root": { "&.Mui-focused fieldset": { borderColor: "#1B5E20" } },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#1B5E20" },
                  }}
                />

                <Button
                  fullWidth variant="contained"
                  sx={{ mt: 2, py: 1.5, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}
                  disabled={!dni.trim() || registrando}
                  onClick={() => registrar()}
                >
                  {registrando ? <CircularProgress size={22} color="inherit" /> : "Registrar asistencia"}
                </Button>

                {msgError && <Alert severity="error" sx={{ mt: 2 }}>{msgError}</Alert>}
              </>
            )}

            {/* Mensaje de éxito — aparece en ambos modos */}
            {msgExito && <Alert severity="success" sx={{ mt: 2 }}>{msgExito}</Alert>}
          </>
        )}
      </Paper>
    </Box>
  );
}
