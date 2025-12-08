export interface ServicioAsignado {
  id: string;
  servicioId: number;
  servicioTitulo: string;
  clienteEmail: string;
  clienteNombre: string;
  fechaAsignacion: string;
  activo: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  fechaCreacion: string;
}

