export const SECTORES = [
  "Trabajo Argentino",
  "Justicia Social",
  "Malvinas Argentinas",
];

export const AULAS = Array.from({ length: 10 }, (_, i) => `${i + 1}`);

export const construirUrlMock = (sector: string, aula: string) => {

  return `https://www.instagram.com/unahurlingham/?hl=es`;
};

//Con url real, por ejemplo
// export const construirUrl = (sectorId: string, aulaId: string) =>
//   `${process.env.NEXT_PUBLIC_BACK_URL}/api/qr?sectorId=${sectorId}&aulaId=${aulaId}`;