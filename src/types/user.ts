export type UserRole = 'admin' | 'cliente';

export interface User {
  id: string;
  email: string;
  password: string; // En producción esto debería estar hasheado
  nombre: string;
  role: UserRole;
  activo: boolean;
  fechaCreacion: string;
}

