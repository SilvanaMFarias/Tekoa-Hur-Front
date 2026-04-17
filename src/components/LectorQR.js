"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";

export default function LectorQR() {
  const qrRef = useRef(null);
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");
  const [camaras, setCamaras] = useState([]);
  const [camaraId, setCamaraId] = useState("");
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function cargarCamaras() {
      try {
        const devices = await Html5Qrcode.getCameras();

        if (!mounted) return;

        setCamaras(devices || []);

        if (devices && devices.length > 0) {
          setCamaraId(devices[0].id);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError("No se pudieron obtener las cámaras del dispositivo.");
        }
      }
    }

    cargarCamaras();

    return () => {
      mounted = false;
    };
  }, []);

  const iniciarScanner = async () => {
    try {
      setError("");
      setResultado("");

      if (!camaraId) {
        setError("No hay una cámara disponible para iniciar.");
        return;
      }

      if (escaneando) return;

      const html5QrCode = new Html5Qrcode("reader");
      qrRef.current = html5QrCode;

      await html5QrCode.start(
        camaraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.7778,
          disableFlip: false,
        },
        (decodedText) => {
          setResultado(decodedText);
          detenerScanner();
        },
        () => {},
      );

      setEscaneando(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar el lector con la cámara seleccionada.");
    }
  };

  const detenerScanner = async () => {
    try {
      if (qrRef.current) {
        try {
          await qrRef.current.stop();
        } catch {
          // puede fallar si no estaba realmente iniciado
        }

        try {
          await qrRef.current.clear();
        } catch {
          // Se ignora si ya estaba limpio
        }

        qrRef.current = null;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEscaneando(false);
    }
  };

  const leerImagen = async (e) => {
    const file = e.target.files?.[0];

    try {
      setError("");
      setResultado("");

      if (!file) return;

      if (escaneando) {
        await detenerScanner();
      }

      const html5QrCode = new Html5Qrcode("reader");
      qrRef.current = html5QrCode;

      const decodedText = await html5QrCode.scanFile(file, true);
      setResultado(decodedText);

      await html5QrCode.clear();
      qrRef.current = null;
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo leer el QR de la imagen. Prueba con una imagen más nítida o un QR más grande.",
      );
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Cámara disponible
        </label>
        <select
          value={camaraId}
          onChange={(e) => setCamaraId(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
          disabled={escaneando}
        >
          {camaras.length === 0 ? (
            <option value="">No hay cámaras detectadas</option>
          ) : (
            camaras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.label || `Cámara ${cam.id}`}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {!escaneando ? (
          <button
            type="button"
            onClick={iniciarScanner}
            className="w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700"
          >
            Activar cámara
          </button>
        ) : (
          <button
            type="button"
            onClick={detenerScanner}
            className="w-full rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
          >
            Detener lector
          </button>
        )}

        <label className="w-full cursor-pointer rounded-xl bg-blue-600 px-4 py-3 text-center font-medium text-white transition hover:bg-blue-700">
          Cargar imagen QR
          <input
            type="file"
            accept="image/*"
            onChange={leerImagen}
            className="hidden"
          />
        </label>
      </div>

      <div
        id="reader"
        className="min-h-[300px] w-full overflow-hidden rounded-xl border border-gray-300 bg-gray-50"
      />

      {resultado && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4">
          <p className="mb-1 text-sm font-semibold text-green-700">
            QR leído correctamente
          </p>
          <a
            href={resultado}
            className="mt-2 inline-block rounded-xl bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
          >
            Continuar registro de asistencia
          </a>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
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
    </div>
  );
}
