import { User, UserRole } from '@/types/user';
import { supabase } from '@/lib/supabase';

const CURRENT_USER_STORAGE_KEY = 'fysa-current-user';

// Default users for initialization
const DEFAULT_USERS = [
  {
    email: 'admin@fysa.com',
    password: 'admin123',
    nombre: 'Administrador FYSA',
    role: 'admin' as UserRole,
    activo: true,
  },
  {
    email: 'aprovigra@gmail.com',
    password: 'aprovigra123',
    nombre: 'Aprovigra - Molinos Modernos S.A',
    role: 'cliente' as UserRole,
    activo: true,
  },
  {
    email: 'greentec3r@gmail.com',
    password: 'greentec3r123',
    nombre: 'Greentec 3R',
    role: 'cliente' as UserRole,
    activo: true,
  },
];

// Initialize default users in Supabase if they don't exist
export const initializeUsers = async () => {
  try {
    for (const defaultUser of DEFAULT_USERS) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', defaultUser.email)
        .single();

      if (!existing) {
        await supabase.from('users').insert({
          email: defaultUser.email,
          nombre: defaultUser.nombre,
          role: defaultUser.role,
          activo: defaultUser.activo,
        });
      }
    }
  } catch (err) {
    console.error('Error initializing users:', err);
  }
};

// Get all users from Supabase
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;

    return (data || []).map(u => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      role: u.role as UserRole,
      activo: u.activo,
      fechaCreacion: u.fecha_creacion,
      password: '', // Password not stored in this table for security
    }));
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};

// Get user by email from Supabase
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      nombre: data.nombre,
      role: data.role as UserRole,
      activo: data.activo,
      fechaCreacion: data.fecha_creacion,
      password: '',
    };
  } catch (err) {
    console.error('Error fetching user:', err);
    return null;
  }
};

// Authenticate user - for now using simple password check
// In production, you'd use Supabase Auth
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  // Check against default users for password validation
  // In production, use Supabase Auth instead
  const defaultUser = DEFAULT_USERS.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!defaultUser) {
    // Also check if user exists in clientes table
    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (cliente) {
      // For client users, check if password matches (using email as default password for now)
      // In production, implement proper auth
      const expectedPassword = email.split('@')[0] + '123';
      if (password === expectedPassword) {
        const user: User = {
          id: cliente.id,
          email: cliente.email,
          nombre: cliente.nombre,
          role: 'cliente',
          activo: cliente.activo,
          fechaCreacion: cliente.fecha_creacion,
          password: '',
        };
        return user;
      }
    }
    return null;
  }

  // Get or create user in Supabase
  let user = await getUserByEmail(email);
  
  if (!user) {
    // Create user if doesn't exist
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: defaultUser.email,
        nombre: defaultUser.nombre,
        role: defaultUser.role,
        activo: defaultUser.activo,
      })
      .select()
      .single();

    if (error || !data) return null;

    user = {
      id: data.id,
      email: data.email,
      nombre: data.nombre,
      role: data.role as UserRole,
      activo: data.activo,
      fechaCreacion: data.fecha_creacion,
      password: '',
    };
  }

  if (!user.activo) return null;

  return user;
};

// Save current user to session (localStorage for quick access)
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

// Get current user from session
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

// Check if current user is admin
export const isCurrentUserAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

// Add new user to Supabase
export const addUser = async (userData: Omit<User, 'id' | 'fechaCreacion'>): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: userData.email,
      nombre: userData.nombre,
      role: userData.role,
      activo: userData.activo,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    email: data.email,
    nombre: data.nombre,
    role: data.role as UserRole,
    activo: data.activo,
    fechaCreacion: data.fecha_creacion,
    password: '',
  };
};

// Update user in Supabase
export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  const dbUpdates: any = {};
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.nombre !== undefined) dbUpdates.nombre = updates.nombre;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.activo !== undefined) dbUpdates.activo = updates.activo;

  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    nombre: data.nombre,
    role: data.role as UserRole,
    activo: data.activo,
    fechaCreacion: data.fecha_creacion,
    password: '',
  };
};

// Delete user from Supabase
export const deleteUser = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  return !error;
};

// Change password - In production, use Supabase Auth
export const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
  // For production, implement with Supabase Auth
  console.warn('Password change not implemented with Supabase Auth yet');
  return false;
};
