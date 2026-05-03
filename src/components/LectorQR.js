"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";

export default function LectorQR() {
  const qrRef = useRef(null);
  const router = useRouter();

  const [escaneando, setEscaneando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [camaras, setCamaras] = useState([]);
  const [camaraId, setCamaraId] = useState("");
  const [procesando, setProcesando] = useState(false);

  // 📸 obtener cámaras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        setCamaras(devices || []);
        if (devices?.length > 0) {
          setCamaraId(devices[0].id);
        }
      })
      .catch(() => setError("No se pudieron obtener las cámaras."));
  }, []);

  // 🔥 parsear URL del QR
  const parseQR = (url) => {
    try {
      const u = new URL(url);

      return {
        aulaId: u.searchParams.get("aulaId"),
        rtoken: u.searchParams.get("rtoken"),
        fechaInicio: u.searchParams.get("fechaInicio"),
        fechaFin: u.searchParams.get("fechaFin"),
      };
    } catch {
      return null;
    }
  };

  // 🚀 registrar asistencia automático
  const registrar = async (dataQR) => {
    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      const res = await fetch("/api/proxy/api/asistencias/registrar-desde-qr", {
        method: "POST",
        credentials: "include", // 🔥 clave
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataQR),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al registrar");
      } else {
        setMensaje("✅ Asistencia registrada");
      }
    } catch {
      setError("Error de red");
    } finally {
      setProcesando(false);
    }
  };

  // ▶ iniciar scanner
  const iniciarScanner = async () => {
    try {
      setError("");
      setMensaje("");

      const html5QrCode = new Html5Qrcode("reader");
      qrRef.current = html5QrCode;

      await html5QrCode.start(
        camaraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (procesando) return;

          const dataQR = parseQR(decodedText);

          if (!dataQR || !dataQR.aulaId || !dataQR.rtoken) {
            setError("QR inválido");
            return;
          }

          await detenerScanner();
          await registrar(dataQR);
        }
      );

      setEscaneando(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar la cámara.");
    }
  };

  // ⛔ detener scanner
  const detenerScanner = async () => {
    try {
      if (qrRef.current) {
        await qrRef.current.stop();
        await qrRef.current.clear();
        qrRef.current = null;
      }
    } catch {}
    setEscaneando(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* selector cámara */}
      <select
        value={camaraId}
        onChange={(e) => setCamaraId(e.target.value)}
        disabled={escaneando}
        className="border p-2 rounded"
      >
        {camaras.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label || c.id}
          </option>
        ))}
      </select>

      {/* botones */}
      {!escaneando ? (
        <button onClick={iniciarScanner} className="bg-green-600 text-white p-3 rounded">
          Activar cámara
        </button>
      ) : (
        <button onClick={detenerScanner} className="bg-red-600 text-white p-3 rounded">
          Detener
        </button>
      )}

      {/* visor */}
      <div id="reader" className="min-h-[300px] border rounded" />

      {/* estado */}
      {procesando && <p>⏳ Registrando...</p>}
      {mensaje && <p className="text-green-600">{mensaje}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <Button onClick={() => router.push("/")}>Volver</Button>
    </div>
  );
}