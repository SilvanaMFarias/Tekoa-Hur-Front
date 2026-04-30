"use client";

import LectorQR from "@/components/LectorQR";

/**
 * Página Leer Código QR.
 * Usa el componente LectorQR que incluye:
 *  - Detección de cámaras disponibles (prefiere cámara trasera)
 *  - Escaneo en tiempo real con html5-qrcode
 *  - Carga de imagen QR con 3 estrategias de decodificación:
 *      1. BarcodeDetector nativo (Chrome/Edge)
 *      2. jsQR en tamaño original
 *      3. jsQR escalado a 1024px
 *  - Redirección automática a /registrar-asistencia con los params del QR
 */
export default function LeerQRPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Leer código QR</h1>
          <p className="mt-1 text-sm text-gray-500">
            Activá la cámara para escanear un código QR o cargá una imagen.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <LectorQR />
        </div>
      </div>
    </div>
  );
}
