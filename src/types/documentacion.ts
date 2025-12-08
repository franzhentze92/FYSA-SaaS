export interface Documento {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: 'auditoria' | 'tecnicos' | 'croquis';
  fechaCreacion: string;
  fechaModificacion: string;
  archivo?: {
    nombre: string;
    tipo: string;
    tamaño: number;
    contenido: string; // Base64 del PDF
  };
  tags?: string[];
  creadoPor?: string;
}

