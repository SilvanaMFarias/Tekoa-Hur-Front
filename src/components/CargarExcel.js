import React, { useState } from "react";
import axios from "axios";

const CargarExcel = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      alert("Selecciona un archivo primero");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://localhost:3001/api/cargar-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert(response.data.message);
    } catch (error) {
      alert("❌ Error al cargar datos: " + error.message);
    }
  };

  return (
    <div>
      <h2>Cargar archivo Excel</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <button onClick={handleConfirmUpload}>Aprobar carga</button>
    </div>
  );
};

export default CargarExcel;
