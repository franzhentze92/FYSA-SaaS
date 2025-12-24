import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Types
export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  fechaCreacion: string;
  activo?: boolean;
}

export interface ServicioAsignado {
  id: string;
  servicioId: number;
  servicioTitulo: string;
  clienteId?: string;
  clienteEmail: string;
  clienteNombre: string;
  fechaAsignacion: string;
  activo: boolean;
}

// Lista de servicios disponibles (hardcodeada por ahora)
export const SERVICIOS_DISPONIBLES = [
  { id: 148998, titulo: 'Aspersión en banda' },
  { id: 148591, titulo: 'Lib. De Encarpado' },
  { id: 136260, titulo: 'Fumigación General' },
  { id: 136259, titulo: 'Muestreo de Granos' },
  { id: 136257, titulo: 'Gas. y Encarpado' },
  { id: 136258, titulo: 'Control de Roedores' },
  { id: 136256, titulo: 'Servicios Generales' },
  { id: 1362563, titulo: 'Trampas de Luz' },
  { id: 1362564, titulo: 'Tratamiento de Contenedores' },
  { id: 1362565, titulo: 'Fum. de Silo Vacío' },
  { id: 1362566, titulo: 'Fum. Graneleras' },
];

export const useAdminServicios = () => {
  const [serviciosAsignados, setServiciosAsignados] = useState<ServicioAsignado[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch clientes from Supabase
  const fetchClientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      const formattedClientes: Cliente[] = (data || []).map(c => ({
        id: c.id,
        nombre: c.nombre,
        email: c.email,
        fechaCreacion: c.fecha_creacion,
        activo: c.activo,
      }));

      setClientes(formattedClientes);
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setError(err instanceof Error ? err.message : 'Error fetching clientes');
    }
  }, []);

  // Fetch servicios asignados from Supabase
  const fetchServiciosAsignados = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('servicios_asignados')
        .select('*')
        .order('fecha_asignacion', { ascending: false });

      if (error) throw error;

      const formattedServicios: ServicioAsignado[] = (data || []).map(s => ({
        id: s.id,
        servicioId: s.servicio_id,
        servicioTitulo: s.servicio_titulo,
        clienteId: s.cliente_id,
        clienteEmail: s.cliente_email,
        clienteNombre: s.cliente_nombre,
        fechaAsignacion: s.fecha_asignacion,
        activo: s.activo,
      }));

      setServiciosAsignados(formattedServicios);
    } catch (err) {
      console.error('Error fetching servicios:', err);
      setError(err instanceof Error ? err.message : 'Error fetching servicios');
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClientes(), fetchServiciosAsignados()]);
      setLoading(false);
    };
    loadData();
  }, [fetchClientes, fetchServiciosAsignados]);

  // Real-time subscriptions
  useEffect(() => {
    const clientesSubscription = supabase
      .channel('clientes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        fetchClientes();
      })
      .subscribe();

    const serviciosSubscription = supabase
      .channel('servicios-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios_asignados' }, () => {
        fetchServiciosAsignados();
      })
      .subscribe();

    return () => {
      clientesSubscription.unsubscribe();
      serviciosSubscription.unsubscribe();
    };
  }, [fetchClientes, fetchServiciosAsignados]);

  const agregarCliente = async (nombre: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nombre,
          email,
          activo: true,
        })
        .select()
        .single();

      if (error) throw error;

      const nuevoCliente: Cliente = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        fechaCreacion: data.fecha_creacion,
        activo: data.activo,
      };

      setClientes(prev => [nuevoCliente, ...prev]);
      return nuevoCliente;
    } catch (err) {
      console.error('Error adding cliente:', err);
      throw err;
    }
  };

  const actualizarCliente = async (id: string, updates: Partial<Cliente>) => {
    try {
      const dbUpdates: any = {};
      if (updates.nombre !== undefined) dbUpdates.nombre = updates.nombre;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.activo !== undefined) dbUpdates.activo = updates.activo;

      const { error } = await supabase
        .from('clientes')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setClientes(prev => prev.map(cliente =>
        cliente.id === id ? { ...cliente, ...updates } : cliente
      ));
    } catch (err) {
      console.error('Error updating cliente:', err);
      throw err;
    }
  };

  const eliminarCliente = async (id: string) => {
    try {
      const cliente = clientes.find(c => c.id === id);
      
      // Delete associated servicios first (cascade should handle this, but just in case)
      if (cliente) {
        await supabase
          .from('servicios_asignados')
          .delete()
          .eq('cliente_email', cliente.email);
      }

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClientes(prev => prev.filter(c => c.id !== id));
      if (cliente) {
        setServiciosAsignados(prev => prev.filter(s => s.clienteEmail !== cliente.email));
      }
    } catch (err) {
      console.error('Error deleting cliente:', err);
      throw err;
    }
  };

  const asignarServicio = async (servicioId: number, servicioTitulo: string, clienteEmail: string, clienteNombre: string) => {
    try {
      // Check if already assigned
      const yaAsignado = serviciosAsignados.some(
        s => s.servicioId === servicioId && s.clienteEmail === clienteEmail
      );
      
      if (yaAsignado) {
        return false;
      }

      const cliente = clientes.find(c => c.email === clienteEmail);

      const { data, error } = await supabase
        .from('servicios_asignados')
        .insert({
          servicio_id: servicioId,
          servicio_titulo: servicioTitulo,
          cliente_id: cliente?.id || null,
          cliente_email: clienteEmail,
          cliente_nombre: clienteNombre,
          activo: true,
        })
        .select()
        .single();

      if (error) throw error;

      const nuevoServicio: ServicioAsignado = {
        id: data.id,
        servicioId: data.servicio_id,
        servicioTitulo: data.servicio_titulo,
        clienteId: data.cliente_id,
        clienteEmail: data.cliente_email,
        clienteNombre: data.cliente_nombre,
        fechaAsignacion: data.fecha_asignacion,
        activo: data.activo,
      };

      setServiciosAsignados(prev => [nuevoServicio, ...prev]);
      return true;
    } catch (err) {
      console.error('Error assigning servicio:', err);
      return false;
    }
  };

  const desasignarServicio = async (id: string) => {
    try {
      const { error } = await supabase
        .from('servicios_asignados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServiciosAsignados(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error unassigning servicio:', err);
      throw err;
    }
  };

  const toggleServicioActivo = async (id: string) => {
    try {
      const servicio = serviciosAsignados.find(s => s.id === id);
      if (!servicio) return;

      const { error } = await supabase
        .from('servicios_asignados')
        .update({ activo: !servicio.activo })
        .eq('id', id);

      if (error) throw error;

      setServiciosAsignados(prev => prev.map(s =>
        s.id === id ? { ...s, activo: !s.activo } : s
      ));
    } catch (err) {
      console.error('Error toggling servicio:', err);
      throw err;
    }
  };

  const getServiciosPorCliente = (clienteEmail: string) => {
    return serviciosAsignados.filter(
      servicio => servicio.clienteEmail === clienteEmail && servicio.activo
    );
  };

  return {
    serviciosAsignados,
    clientes,
    loading,
    error,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    asignarServicio,
    desasignarServicio,
    toggleServicioActivo,
    getServiciosPorCliente,
    refetch: () => Promise.all([fetchClientes(), fetchServiciosAsignados()]),
  };
};
