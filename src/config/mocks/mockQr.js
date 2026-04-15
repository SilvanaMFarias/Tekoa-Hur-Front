export const EDIFICIOS = [
  "Justicia Social",
];

//export const AULAS = Array.from({ length: 5 }, (_, i) => `${i + 1}`);
export const AULAS = [
  "004",
]

export const construirUrlMock = (edificio, aula) => {
  //return `${process.env.NEXT_PUBLIC_BACK_URL}/api/validar?edificioId=${edificio}&aulaId=${aula}`;
  //return `${process.env.NEXT_PUBLIC_BACK_URL}/api/qr/validar?edificioId=11111111-1111-1111-1111-111111111111&aulaId=22222222-2222-2222-2222-222222222222`;
  return `${process.env.NEXT_PUBLIC_FRONT_URL}/registrar-asistencia?edificioId=11111111-1111-1111-1111-111111111111&aulaId=22222222-2222-2222-2222-222222222222`;
};

//Con url real, por ejemplo
// export const construirUrl = (sectorId, aulaId) =>
//   `${process.env.NEXT_PUBLIC_BACK_URL}/api/qr?sectorId=${sectorId}&aulaId=${aulaId}`;