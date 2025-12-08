export interface DocumentoServicio {
  id: string;
  servicioId: number; // ID del servicio (217402, 187066, etc.)
  fechaServicio: string; // Fecha del servicio
  numeroReporte: string; // Número de reporte
  fechaCreacion: string;
  fechaModificacion: string;
  archivo?: {
    nombre: string;
    tipo: string;
    tamaño: number;
    contenido: string; // Base64 del PDF
  };
  notas?: string;
}

