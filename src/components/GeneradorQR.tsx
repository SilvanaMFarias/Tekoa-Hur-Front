"use client";

import { useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { AULAS, construirUrlMock, SECTORES } from "@/config/qr";

export default function GeneradorQR() {
  const [sector, setSector] = useState("");
  const [aula, setAula] = useState("");
  const [mostrarQR, setMostrarQR] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  const urlQR = useMemo(() => {
    if (!sector || !aula) return "";
    return construirUrlMock(sector, aula);
  }, [sector, aula]);

  const handleGenerarQR = () => {
    if (!sector || !aula) return;
    setMostrarQR(true);
  };

  const handleDescargarQR = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, 300, 300);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `qr-${sector.toLowerCase().replace(/\s+/g, "-")}-aula-${aula}.png`;
      link.click();

      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  const handleImprimirQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const ventana = window.open("", "_blank", "width=600,height=800");
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>Imprimir QR</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px;
            }
            .contenedor {
              text-align: center;
              border: 1px solid #ddd;
              padding: 24px;
              border-radius: 12px;
            }
            .titulo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 12px;
            }
            .detalle {
              margin-top: 16px;
              font-size: 18px;
            }
            .qr {
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="contenedor">
            <div class="titulo">QR de aula</div>
            <div>Sector: ${sector}</div>
            <div>Aula: ${aula}</div>
            <div class="qr">${svgString}</div>
            <div class="detalle">Escaneá este código para registrar asistencia</div>
          </div>
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
        Generar QR
      </h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-800">
          Sector
        </label>
        <select
          value={sector}
          onChange={(e) => {
            setSector(e.target.value);
            setMostrarQR(false);
          }}
          className="w-full rounded-lg border border-gray-300 p-3 text-gray-800"
        >
          <option value="">Seleccionar sector</option>
          {SECTORES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-800">
          Aula
        </label>
        <select
          value={aula}
          onChange={(e) => {
            setAula(e.target.value);
            setMostrarQR(false);
          }}
          className="w-full rounded-lg border border-gray-300 p-3 text-gray-800"
        >
          <option value="">Seleccionar aula</option>
          {AULAS.map((item) => (
            <option key={item} value={item}>
              Aula {item}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={handleGenerarQR}
        disabled={!sector || !aula}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 mt-4 font-medium mt-4 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        Generar QR
      </button>

      {mostrarQR && urlQR && (
        <div className="mt-4 flex flex-col items-center">
          <div
            ref={qrRef}
            className="rounded-xl bg-white p-4 shadow"
          >
            <QRCode value={urlQR} size={220} />
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-800">
              Sector: <span className="font-medium">{sector}</span>
            </p>
            <p className="text-sm text-gray-800">
              Aula: <span className="font-medium">{aula}</span>
            </p>
          </div>

          <p className="mt-4 break-all text-center text-xs text-gray-800">
            {urlQR}
          </p>

          <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleDescargarQR}
              className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700"
            >
              Descargar QR
            </button>

            <button
              type="button"
              onClick={handleImprimirQR}
              className="flex-1 rounded-xl bg-gray-700 px-4 py-3 font-medium text-white transition hover:bg-gray-800"
            >
              Imprimir QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}