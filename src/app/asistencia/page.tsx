"use client";

import { useEffect, useMemo, useState } from "react";
import AsistenciaGrid from "@/components/AsistenciaGrid";
import { BACK_URL, getAuthHeaders } from "@/config/api";

type RegistroAsistencia = {
  usuarioId?: string | number;
  fecha?: string;
  estado?: string;
  tipoUsuario?: string;
  comision?: {
    comisionId?: string;
    cod_comision?: string;
    materiaId?: string | number;
  };
};

type EstudianteApi = {
  dni?: string | number;
  nombre_apellido?: string;
};

type AlumnoGrid = {
  id: string | number;
  apellido: string;
  tipo: string;
};

type AsistenciaGridType = {
  alumnoId: string | number;
  fecha: string;
};

export default function AsistenciaPage() {
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [comisionSeleccionada, setComisionSeleccionada] = useState("");
  const [materias, setMaterias] = useState<any[]>([]);
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [allRegistros, setAllRegistros] = useState<RegistroAsistencia[]>([]);
  const [estudiantesMap, setEstudiantesMap] = useState<Record<string, string>>({});
  const [fechas, setFechas] = useState<string[]>([]);
  const [alumnos, setAlumnos] = useState<AlumnoGrid[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaGridType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    async function cargarCatálogo() {
      setLoading(true);
      setError("");

      if (!BACK_URL) {
        setError(
          "La variable de entorno NEXT_PUBLIC_BACK_URL no está configurada."
        );
        setLoading(false);
        return;
      }

      try {
        const url = `${BACK_URL}/api/asistencias`;
        const headers: Record<string, string> = {
          Accept: "application/json",
        };
        const authHeaders = getAuthHeaders();

        if (authHeaders.Authorization) {
          headers.Authorization = authHeaders.Authorization;
        }

        const response = await fetch(url, {
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Error ${response.status}: ${errorText || response.statusText}`
          );
        }

        const data = await response.json();
        const registros = Array.isArray(data) ? data : [];

        if (!registros.length) {
          setError("El backend no devolvió datos de asistencias.");
          setLoading(false);
          return;
        }

        const comisionesBackend = Array.from(
          new Map(
            registros.map((item) => [
              item.comision?.comisionId,
              {
                id: item.comision?.comisionId,
                nombre:
                  item.comision?.cod_comision || item.comision?.comisionId,
                materiaId: item.comision?.materiaId?.toString(),
              },
            ])
          ).values()
        ).filter(Boolean);

        let materiasBackend = Array.from(
          new Map(
            registros.map((item) => [
              item.comision?.materiaId,
              {
                id: item.comision?.materiaId?.toString(),
                nombre:
                  item.comision?.materiaId &&
                  `Materia ${item.comision?.materiaId}`,
              },
            ])
          ).values()
        ).filter(Boolean);

        // Intentar cargar materias desde el endpoint /api/materias
        try {
          const materiasUrl = `${BACK_URL}/api/materias`;
          const materiasResponse = await fetch(materiasUrl, {
            headers,
          });

          if (materiasResponse.ok) {
            const materiasData = await materiasResponse.json();
            if (Array.isArray(materiasData) && materiasData.length > 0) {
              materiasBackend = materiasData.map((materia) => ({
                id: materia.id?.toString() || materia.materiaId?.toString(),
                nombre: materia.nombre || `Materia ${materia.id}`,
              }));
            }
          }
        } catch (err) {
          console.error("Error cargando materias:", err);
        }

        let estudiantesMapBackend: Record<string, string> = {};
        try {
          const estudiantesUrl = `${BACK_URL}/api/estudiantes`;
          const estudiantesResponse = await fetch(estudiantesUrl, {
            headers,
          });

          if (estudiantesResponse.ok) {
            const estudiantesData = await estudiantesResponse.json();
            if (Array.isArray(estudiantesData)) {
              estudiantesMapBackend = estudiantesData.reduce(
                (map: Record<string, string>, estudiante: EstudianteApi) => {
                  if (estudiante?.dni && estudiante?.nombre_apellido) {
                    map[estudiante.dni.toString()] = estudiante.nombre_apellido;
                  }
                  return map;
                },
                {},
              );
            }
          }
        } catch (err) {
          console.error("Error cargando estudiantes:", err);
        }

        setComisiones(comisionesBackend);
        setMaterias(materiasBackend);
        setAllRegistros(registros);
        setEstudiantesMap(estudiantesMapBackend);
        setUseBackend(true);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar materias y comisiones desde el backend.");
      } finally {
        setLoading(false);
      }
    }

    cargarCatálogo();
  }, []);

  useEffect(() => {
    if (!comisionSeleccionada || !useBackend) return;

    const registros = allRegistros.filter(
      (item) => item.comision?.comisionId === comisionSeleccionada
    );

    const fechasBackend = Array.from(
      new Set(
        registros
          .map((item) => item.fecha)
          .filter((fecha): fecha is string => typeof fecha === "string"),
      )
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const alumnosBackend = Array.from(
      new Map(
        registros
          .filter((item): item is RegistroAsistencia & { usuarioId: string | number } =>
            item.usuarioId !== undefined,
          )
          .map((item) => {
            const usuarioKey = item.usuarioId.toString();

            return [
              usuarioKey,
              {
                id: item.usuarioId,
                apellido: estudiantesMap[usuarioKey] ?? usuarioKey,
                tipo: item.tipoUsuario || "Estudiante",
              },
            ] as const;
          }),
      ).values(),
    );

    const asistenciasBackend = registros
      .filter(
        (item): item is RegistroAsistencia & {
          usuarioId: string | number;
          fecha: string;
        } =>
          item.estado === "PRESENTE" &&
          item.usuarioId !== undefined &&
          typeof item.fecha === "string",
      )
      .map((item) => ({
        alumnoId: item.usuarioId,
        fecha: item.fecha,
      }));

    setFechas(fechasBackend);
    setAlumnos(alumnosBackend);
    setAsistencias(asistenciasBackend);
  }, [comisionSeleccionada, useBackend, allRegistros, estudiantesMap]);

  const comisionesFiltradas = useMemo(() => {
    if (!materiaSeleccionada) return [];

    return comisiones.filter(
      (comision) => comision.materiaId?.toString() === materiaSeleccionada
    );
  }, [materiaSeleccionada, comisiones]);

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
            {materias.map((materia) => (
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
        <>
          {loading && (
            <div className="asistencia-placeholder">
              Cargando datos desde el backend...
            </div>
          )}

          {error && (
            <div
              style={{
                marginBottom: 16,
                color: "#b91c1c",
                backgroundColor: "#fee2e2",
                padding: "12px 16px",
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}

          {!loading && (
            <AsistenciaGrid
              fechas={fechas}
              alumnos={alumnos}
              asistencias={asistencias}
            />
          )}
        </>
      ) : (
        <div className="asistencia-placeholder">
          Seleccioná una materia y una comisión para ver la grilla.
        </div>
      )}
    </main>
  );
}