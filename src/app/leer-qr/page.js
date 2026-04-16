import LectorQR from "@/components/LectorQR";

export default function LeerQRPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
          Leer código QR
        </h1>

        <p className="mb-6 text-center text-sm text-gray-600">
          Activá la cámara trasera para escanear un código QR o cargá una imagen.
        </p>

        <LectorQR />
      </div>
    </main>
  );
}