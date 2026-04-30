// src/app/leer-qr/page.js
"use client";
import LectorQR  from "@/components/LectorQR";
import { useRouter } from "next/navigation";

export default function LeerQRPage() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h1 className="text-2xl font-bold text-gray-800">Leer código QR</h1>
          <button onClick={() => router.push("/")} style={{
            padding:"6px 14px", borderRadius:8, border:"1px solid #d1d5db",
            background:"white", cursor:"pointer", fontWeight:500, fontSize:13,
          }}>
            ← Menú
          </button>
        </div>
        <p className="mb-6 text-center text-sm text-gray-600">
          Activá la cámara trasera para escanear un código QR o cargá una imagen.
        </p>
        <LectorQR />
      </div>
    </main>
  );
}
