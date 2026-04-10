import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/tekoa-hur-logo-sin-leyenda.jpg"
            alt="Logo Tekoá-Hur"
            width={120}
            height={120}
            priority
          />
        </div>

        {/* Título */}
        <h1 className="mt-4 mb-4 text-center text-2xl font-bold text-gray-800">
          Tekoá-Hur
        </h1>

        {/* Botones */}
        <div className="flex flex-col gap-4">

          <Link
            href="/generar-qr"
            className="rounded-xl bg-blue-600 px-4 py-3 text-center font-medium text-white transition hover:bg-blue-700"
          >
            Generar QR del aula
          </Link>

          <Link
            href="/asistencia"
            className="rounded-xl bg-green-600 px-4 py-3 text-center font-medium text-white transition hover:bg-green-700"
          >
            Listado de asistencia
          </Link>

        </div>
      </div>
    </main>
  );
}