"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function traerEstudiantes() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_URL}/api/estudiantes`
        );

        if (!response.ok) {
          throw new Error("Error al obtener estudiantes");
        }

        const data = await response.json();

        setEstudiantes(data);
      } catch (err) {
        setError("No se pudo conectar con el backend");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    traerEstudiantes();
  }, []);

  return (
    <main className="page-container">
      <h1>Listado de estudiantes</h1>

      {loading && <p>Cargando estudiantes...</p>}

      {error && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <table style={{ marginTop: "20px", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>DNI</th>
              <th style={thStyle}>Nombre y apellido</th>
            </tr>
          </thead>

          <tbody>
            {estudiantes.map((estudiante) => (
              <tr key={estudiante.dni}>
                <td style={tdStyle}>{estudiante.dni}</td>
                <td style={tdStyle}>{estudiante.nombre_apellido}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const thStyle = {
  border: "1px solid #ddd",
  padding: "10px",
  backgroundColor: "#f3f4f6",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "10px",
};