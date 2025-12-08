import { useState, useEffect } from 'react';
import { ServicioAsignado, Cliente } from '@/types/admin';
import { v4 as uuidv4 } from 'uuid';

// Lista de servicios disponibles (hardcodeada por ahora)
export const SERVICIOS_DISPONIBLES = [
  { id: 148998, titulo: 'Aspersión en banda' },
  { id: 148591, titulo: 'Lib. De Encarpado' },
  { id: 136260, titulo: 'Fumigación General' },
  { id: 136259, titulo: 'Muestreo de Granos' },
  { id: 136257, titulo: 'Gas. y Encarpado' },
  { id: 136258, titulo: 'Control de Roedores' },
  { id: 136256, titulo: 'Servicios Generales' },
];

export const useAdminServicios = () => {
  const [serviciosAsignados, setServiciosAsignados] = useState<ServicioAsignado[]>(() => {
    const saved = localStorage.getItem('admin-servicios-asignados');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('admin-clientes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('admin-servicios-asignados', JSON.stringify(serviciosAsignados));
  }, [serviciosAsignados]);

  useEffect(() => {
    localStorage.setItem('admin-clientes', JSON.stringify(clientes));
  }, [clientes]);

  const agregarCliente = (nombre: string, email: string) => {
    const nuevoCliente: Cliente = {
      id: uuidv4(),
      nombre,
      email,
      fechaCreacion: new Date().toISOString(),
    };
    setClientes(prev => [...prev, nuevoCliente]);
  };

  const actualizarCliente = (id: string, updates: Partial<Cliente>) => {
    setClientes(prev => prev.map(cliente =>
      cliente.id === id ? { ...cliente, ...updates } : cliente
    ));
  };

  const eliminarCliente = (id: string) => {
    setClientes(prev => prev.filter(cliente => cliente.id !== id));
    // También eliminar servicios asignados a este cliente
    setServiciosAsignados(prev => prev.filter(servicio => {
      const cliente = clientes.find(c => c.id === id);
      return cliente ? servicio.clienteEmail !== cliente.email : true;
    }));
  };

  const asignarServicio = (servicioId: number, servicioTitulo: string, clienteEmail: string, clienteNombre: string) => {
    // Verificar si ya está asignado
    const yaAsignado = serviciosAsignados.some(
      s => s.servicioId === servicioId && s.clienteEmail === clienteEmail
    );
    
    if (yaAsignado) {
      return false; // Ya está asignado
    }

    const nuevoServicio: ServicioAsignado = {
      id: uuidv4(),
      servicioId,
      servicioTitulo,
      clienteEmail,
      clienteNombre,
      fechaAsignacion: new Date().toISOString(),
      activo: true,
    };
    
    setServiciosAsignados(prev => [...prev, nuevoServicio]);
    return true;
  };

  const desasignarServicio = (id: string) => {
    setServiciosAsignados(prev => prev.filter(servicio => servicio.id !== id));
  };

  const toggleServicioActivo = (id: string) => {
    setServiciosAsignados(prev => prev.map(servicio =>
      servicio.id === id ? { ...servicio, activo: !servicio.activo } : servicio
    ));
  };

  const getServiciosPorCliente = (clienteEmail: string) => {
    return serviciosAsignados.filter(
      servicio => servicio.clienteEmail === clienteEmail && servicio.activo
    );
  };

  return {
    serviciosAsignados,
    clientes,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    asignarServicio,
    desasignarServicio,
    toggleServicioActivo,
    getServiciosPorCliente,
  };
};

