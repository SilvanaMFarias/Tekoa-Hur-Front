"use client";

// ============================================================
// components/AsistenciaGrid.jsx
// ============================================================
// CAMBIOS:
//  ✅ Acepta prop "titulo" para mostrar título propio
//  ✅ Acepta prop "columnaPersona" para el nombre de la columna
//  ✅ La columna de nombre muestra el nombre completo (apellido = nombre_apellido)
//  ✅ Botón "Volver al menú" integrado al final de la grilla
// ============================================================

"use client";
import { useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";

export default function AsistenciaGrid({
  titulo        = "Grilla de asistencias",
  columnaPersona = "Nombre y apellido",
  fechas,
  alumnos,
  asistencias,
  mostrarBotonVolver = false, // solo la primera grilla muestra el botón
}) {
  const router = useRouter();

  const asistenciaSet = useMemo(() => new Set(
    asistencias.map(a => `${a.alumnoId}-${a.fecha}`)
  ), [asistencias]);

  const fechasOrdenadas = useMemo(
    () => [...fechas].sort((a, b) => new Date(a) - new Date(b)),
    [fechas]
  );

  const columns = useMemo(() => {
    const base = [
      {
        field: "apellido",
        headerName: columnaPersona,  // ← usa la prop
        minWidth: 220,
        flex: 2,
      },
      {
        field: "tipo",
        headerName: "Tipo",
        minWidth: 100,
        flex: 1,
      },
    ];

    const colsFechas = fechasOrdenadas.map(fecha => ({
      field: fecha,
      headerName: formatearFecha(fecha),
      width: fechasOrdenadas.length > 10 ? 70 : 90,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const presente = params.value;
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: "50%", fontWeight: 700,
            color:           presente ? "#166534" : "#991b1b",
            backgroundColor: presente ? "#dcfce7" : "#fee2e2",
          }}>
            {presente ? "P" : "A"}
          </span>
        );
      },
    }));

    return [...base, ...colsFechas];
  }, [fechasOrdenadas, columnaPersona]);

  const rows = useMemo(() => alumnos
    .slice()
    .sort((a, b) => a.apellido.localeCompare(b.apellido))
    .map(alumno => {
      const fila = { id: alumno.id, apellido: alumno.apellido, tipo: alumno.tipo };
      fechasOrdenadas.forEach(fecha => {
        fila[fecha] = asistenciaSet.has(`${alumno.id}-${fecha}`);
      });
      return fila;
    }),
    [alumnos, fechasOrdenadas, asistenciaSet]
  );

  return (
    <Box sx={{
      backgroundColor: "#ffffff", borderRadius: 3, padding: 3,
      boxShadow: "0 4px 14px rgba(0,0,0,0.08)", mb: 2,
    }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {titulo}
      </Typography>

      {alumnos.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
          Sin registros de asistencia todavía.
        </Typography>
      ) : (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Box sx={{ minWidth: 700, height: Math.min(120 + rows.length * 52, 520) }}>
            <DataGrid
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              hideFooterSelectedRowCount
              pageSizeOptions={[10, 20, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
            />
          </Box>
        </Box>
      )}

      {mostrarBotonVolver && (
        <Button variant="outlined" color="inherit" onClick={() => router.push("/")}
          sx={{ mt: 3, borderRadius: 3, textTransform: "none", fontWeight: 500 }}>
          ← Volver al menú principal
        </Button>
      )}
    </Box>
  );
}

function formatearFecha(fecha) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}
