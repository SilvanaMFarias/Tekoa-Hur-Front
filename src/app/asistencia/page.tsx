import AsistenciaGrid from "@/components/AsistenciaGrid";
import { fechas, alumnos, asistencias } from "@/config/mocks/mockAsistencias";

export default function AsistenciaPage() {
  return (
    <main className="page-container">
      <AsistenciaGrid
        fechas={fechas}
        alumnos={alumnos}
        asistencias={asistencias}
      />
    </main>
  );
}