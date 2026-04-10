import GeneradorQR from "@/components/GeneradorQR";

export default function GenerarQRPage() {
  return (
    // <main className="min-h-screen bg-gray-100 px-4 py-10">
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      {/* <div className="mx-auto flex max-w-xg justify-center"> */}
        <GeneradorQR />
      {/* </div> */}
    </main>
  );
}