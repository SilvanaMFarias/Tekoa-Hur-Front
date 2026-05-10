"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import GeneradorQR from "@/components/GeneradorQR";

export default function GenerarQRPage() {
  return (
    <ProtectedRoute roles={["docente", "administrador"]}>
      <div className="flex flex-1 flex-col items-center justify-start px-4 py-8 sm:py-10">
        <GeneradorQR />
      </div>
    </ProtectedRoute>
  );
}
