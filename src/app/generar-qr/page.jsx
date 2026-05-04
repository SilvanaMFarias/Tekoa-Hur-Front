"use client";

import GeneradorQR from "@/components/GeneradorQR";

/**
 * Página Generar QR del Aula.
 * Delega toda la lógica al componente GeneradorQR que incluye:
 *  - Selección edificio/aula desde la API real
 *  - Generación del token via POST /api/qr/generar
 *  - QR con react-qr-code (alta resolución 300px, nivel H)
 *  - Descarga en PNG 1200×1200
 *  - Vista previa de impresión
 */
export default function GenerarQRPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-8 sm:py-12">
      <GeneradorQR />
    </div>
  );
}
