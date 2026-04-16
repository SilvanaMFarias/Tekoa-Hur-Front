"use client";

import { useSearchParams } from "next/navigation";
import RegistroAsistencia from "@/components/RegistroAsistencia";

export default function RegistroAsistenciaPage() {
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