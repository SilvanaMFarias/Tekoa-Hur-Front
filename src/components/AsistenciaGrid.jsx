"use client";

// AsistenciaGrid.jsx
// Grilla original preservada. Cambios mínimos:
//  - Quita columna "ID" (no tiene valor para el usuario)
//  - Reemplaza "Apellido" por prop headerNombre (default "Nombre y apellido")
//  - Agrega columna "DNI" solo si el alumno tiene prop dni
//  - Acepta prop titulo

import { useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";

export default function AsistenciaGrid({
  fechas       = [],
  alumnos      = [],
  asistencias  = [],
  titulo       = "Grilla de asistencias",
  headerNombre = "Nombre y apellido",
  mostrarDni   = true,
  mostrarVolver = true,
}) {
  const asistenciaSet = useMemo(() => {
    return new Set(asistencias.map((a) => `${a.alumnoId}-${a.fecha}`));
  }, [asistencias]);

  const router = useRouter();

  const fechasOrdenadas = useMemo(() => {
    return [...fechas].sort((a, b) => new Date(a) - new Date(b));
  }, [fechas]);

  const columns = useMemo(() => {
    const base = [
      {
        field: "apellido",
        headerName: headerNombre,
        minWidth: 220,
        flex: 2,
      },
    ];

    if (mostrarDni) {
      base.push({
        field: "dni",
        headerName: "DNI",
        minWidth: 110,
        flex: 1,
      });
    }

    const colsFechas = fechasOrdenadas.map((fecha) => ({
      field: fecha,
      headerName: formatearFecha(fecha),
      width: fechasOrdenadas.length > 10 ? 75 : 95,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const presente = params.value;
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "50%",
            fontWeight: 700,
            color:           presente ? "#166534" : "#991b1b",
            backgroundColor: presente ? "#dcfce7" : "#fee2e2",
          }}>
            {presente ? "P" : "A"}
          </span>
        );
      },
    }));

    return [...base, ...colsFechas];
  }, [fechasOrdenadas, headerNombre, mostrarDni]);

  const rows = useMemo(() => {
    return alumnos
      .slice()
      .sort((a, b) => a.apellido.localeCompare(b.apellido))
      .map((alumno) => {
        const fila = {
          id:      alumno.id,
          apellido: alumno.apellido,
          dni:     alumno.dni ?? alumno.id,
        };
        fechasOrdenadas.forEach((fecha) => {
          fila[fecha] = asistenciaSet.has(`${alumno.id}-${fecha}`);
        });
        return fila;
      });
  }, [alumnos, fechasOrdenadas, asistenciaSet]);

  return (
    <Box sx={{
      backgroundColor: "#ffffff",
      borderRadius: 3,
      padding: 3,
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
    }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        {titulo}
      </Typography>

      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 900, height: 520 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            pageSizeOptions={[10, 20, 30]}
            initialState={{
              pagination: { paginationModel: { pageSize: 20, page: 0 } },
            }}
          />
        </Box>
      </Box>

      {mostrarVolver && (
        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={() => router.push("/")}
          sx={{ mt: 3, py: 1.5, borderRadius: 3, textTransform: "none", fontWeight: 500 }}
        >
          ← Volver al menú principal
        </Button>
      )}
    </Box>
  );
}

function formatearFecha(fecha) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}
