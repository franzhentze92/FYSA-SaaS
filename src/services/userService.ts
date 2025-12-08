import { User, UserRole } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';

const USERS_STORAGE_KEY = 'fysa-users';
const CURRENT_USER_STORAGE_KEY = 'fysa-current-user';

// Usuarios iniciales por defecto
const DEFAULT_USERS: Omit<User, 'id' | 'fechaCreacion'>[] = [
  {
    email: 'admin@fysa.com',
    password: 'admin123', // En producción esto debería estar hasheado
    nombre: 'Administrador FYSA',
    role: 'admin',
    activo: true,
  },
  {
    email: 'aprovigra@fysa.com',
    password: 'aprovigra123', // En producción esto debería estar hasheado
    nombre: 'Aprovigra - Molinos Modernos S.A',
    role: 'cliente',
    activo: true,
  },
];

// Inicializar usuarios si no existen
export const initializeUsers = () => {
  const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
  if (!existingUsers) {
    const initialUsers: User[] = DEFAULT_USERS.map(user => ({
      ...user,
      id: uuidv4(),
      fechaCreacion: new Date().toISOString(),
    }));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
  }
};

// Obtener todos los usuarios
export const getUsers = (): User[] => {
  initializeUsers();
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersJson) return [];
  try {
    return JSON.parse(usersJson);
  } catch {
    return [];
  }
};

// Buscar usuario por email
export const getUserByEmail = (email: string): User | null => {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
};

// Autenticar usuario
export const authenticateUser = (email: string, password: string): User | null => {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (!user.activo) return null;
  if (user.password !== password) return null;
  return user;
};

// Guardar usuario actual en sesión
export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', user.email);
  } else {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
  }
};

// Obtener usuario actual de la sesión
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

// Verificar si el usuario actual es admin
export const isCurrentUserAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

// Agregar nuevo usuario (solo admin)
export const addUser = (userData: Omit<User, 'id' | 'fechaCreacion'>): User => {
  const users = getUsers();
  // Verificar que el email no exista
  if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
    throw new Error('El email ya está registrado');
  }
  const newUser: User = {
    ...userData,
    id: uuidv4(),
    fechaCreacion: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return newUser;
};

// Actualizar usuario
export const updateUser = (userId: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return users[index];
};

// Eliminar usuario
export const deleteUser = (userId: string): boolean => {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

// Cambiar contraseña
export const changePassword = (userId: string, newPassword: string): boolean => {
  const user = updateUser(userId, { password: newPassword });
  return user !== null;
};

