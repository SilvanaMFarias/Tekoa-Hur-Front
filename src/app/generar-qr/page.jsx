"use client";

import GeneradorQR from "@/components/GeneradorQR";

/**
 * Página Generar QR del Aula.
 * Usa el componente GeneradorQR que incluye:
 *  - Selección de edificio/aula desde la API real
 *  - Generación del token via POST /api/qr/generar
 *  - Visualización del QR con react-qr-code
 *  - Descarga en alta resolución (1200x1200 PNG)
 *  - Vista previa de impresión
 */
export default function GenerarQRPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-8 sm:py-12">
      <GeneradorQR />
    </div>
  );
}
