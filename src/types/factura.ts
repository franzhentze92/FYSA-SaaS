export interface Factura {
  id: string;
  fechaFactura: string; // Fecha de la factura
  numeroFactura: string; // Número de factura
  reporteIds?: string[]; // IDs de los reportes de servicio asociados (opcional, múltiples)
  clienteEmail?: string; // Email del cliente al que está asignada la factura
  fechaCreacion: string;
  fechaModificacion: string;
  archivo?: {
    nombre: string;
    tipo: string;
    tamaño: number;
    contenido: string; // Base64 del PDF (for upload)
    url?: string; // URL from Supabase Storage (for viewing)
  };
  notas?: string;
}

