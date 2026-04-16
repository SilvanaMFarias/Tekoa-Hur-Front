"use client";

import { Suspense } from "react";
import RegistroAsistencia from "@/components/RegistroAsistencia";
import { useSearchParams } from "next/navigation";

function PageContent() {
  const searchParams = useSearchParams();

  const edificioId = searchParams.get("edificioId");
  const aulaId = searchParams.get("aulaId");
  const rtoken = searchParams.get("rtoken");

  return (
    <RegistroAsistencia
      edificioId={edificioId}
      aulaId={aulaId}
      rtoken={rtoken}
    />
  );
}

export default function RegistroAsistenciaPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PageContent />
    </Suspense>
  );
}
