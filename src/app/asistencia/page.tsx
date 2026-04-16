"use client";

import { useMemo, useState } from "react";
import AsistenciaGrid from "@/components/AsistenciaGrid";
import {
  fechas,
  alumnos,
  asistencias,
  Materias,
  Comisiones,
} from "@/config/mocks/mockAsistencias";

export default function AsistenciaPage() {
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [comisionSeleccionada, setComisionSeleccionada] = useState("");

  const comisionesFiltradas = useMemo(() => {
    if (!materiaSeleccionada) return [];

    return Comisiones.filter(
      (comision) => comision.materiaId === Number(materiaSeleccionada)
    );
  }, [materiaSeleccionada]);

  const handleMateriaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaMateria = event.target.value;
    setMateriaSeleccionada(nuevaMateria);
    setComisionSeleccionada("");
  };

  const handleComisionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setComisionSeleccionada(event.target.value);
  };

  return (
    <main className="page-container">
      <div className="asistencia-filtros">
        <div className="asistencia-filtro">
          <label htmlFor="materia">Materia</label>
          <select
            id="materia"
            value={materiaSeleccionada}
            onChange={handleMateriaChange}
          >
            <option value="">Seleccionar materia</option>
            {Materias.map((materia) => (
              <option key={materia.id} value={materia.id}>
                {materia.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="asistencia-filtro">
          <label htmlFor="comision">Comisión</label>
          <select
            id="comision"
            value={comisionSeleccionada}
            onChange={handleComisionChange}
            disabled={!materiaSeleccionada}
          >
            <option value="">Seleccionar comisión</option>
            {comisionesFiltradas.map((comision) => (
              <option key={comision.id} value={comision.id}>
                {comision.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {comisionSeleccionada ? (
        <AsistenciaGrid
          fechas={fechas}
          alumnos={alumnos}
          asistencias={asistencias}
        />
      ) : (
        <div className="asistencia-placeholder">
          Seleccioná una materia y una comisión para ver la grilla.
        </div>
      )}
    </main>
  );
}