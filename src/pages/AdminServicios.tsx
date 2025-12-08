import React, { useState, useMemo } from 'react';
import { Settings, Plus, Search, X, CheckCircle2, XCircle, UserPlus, Users, Building2 } from 'lucide-react';
import { useAdminServicios, SERVICIOS_DISPONIBLES } from '@/hooks/useAdminServicios';
import { format } from 'date-fns';

const AdminServicios: React.FC = () => {
  const {
    serviciosAsignados,
    clientes,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    asignarServicio,
    desasignarServicio,
    toggleServicioActivo,
  } = useAdminServicios();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [showAsignarServicioModal, setShowAsignarServicioModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null);
  const [selectedServicio, setSelectedServicio] = useState<number | null>(null);
  const [newCliente, setNewCliente] = useState({ nombre: '', email: '' });

  const serviciosFiltrados = useMemo(() => {
    if (!searchQuery) return serviciosAsignados;
    const query = searchQuery.toLowerCase();
    return serviciosAsignados.filter(servicio =>
      servicio.servicioTitulo.toLowerCase().includes(query) ||
      servicio.clienteNombre.toLowerCase().includes(query) ||
      servicio.clienteEmail.toLowerCase().includes(query)
    );
  }, [serviciosAsignados, searchQuery]);

  const handleAgregarCliente = () => {
    if (!newCliente.nombre.trim() || !newCliente.email.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }
    agregarCliente(newCliente.nombre.trim(), newCliente.email.trim());
    setNewCliente({ nombre: '', email: '' });
    setShowAddClienteModal(false);
  };

  const handleAsignarServicio = () => {
    if (!selectedCliente || !selectedServicio) {
      alert('Por favor selecciona un cliente y un servicio');
      return;
    }

    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) {
      alert('Cliente no encontrado');
      return;
    }

    const servicio = SERVICIOS_DISPONIBLES.find(s => s.id === selectedServicio);
    if (!servicio) {
      alert('Servicio no encontrado');
      return;
    }

    const exito = asignarServicio(
      servicio.id,
      servicio.titulo,
      cliente.email,
      cliente.nombre
    );

    if (!exito) {
      alert('Este servicio ya está asignado a este cliente');
    } else {
      setShowAsignarServicioModal(false);
      setSelectedCliente(null);
      setSelectedServicio(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings size={32} />
            Administración de Servicios
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona los servicios asignados a cada cliente
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Clientes</p>
            <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Servicios Asignados</p>
            <p className="text-2xl font-bold text-gray-900">{serviciosAsignados.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Servicios Activos</p>
            <p className="text-2xl font-bold text-gray-900">
              {serviciosAsignados.filter(s => s.activo).length}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por servicio, cliente o email..."
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddClienteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <UserPlus size={18} />
                Agregar Cliente
              </button>
              <button
                onClick={() => setShowAsignarServicioModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <Plus size={18} />
                Asignar Servicio
              </button>
            </div>
          </div>
        </div>

        {/* Clientes Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users size={24} />
              Clientes
            </h2>
          </div>
          {clientes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay clientes registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicios Asignados
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Registro
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.map((cliente) => {
                    const serviciosDelCliente = serviciosAsignados.filter(
                      s => s.clienteEmail === cliente.email
                    );
                    return (
                      <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{cliente.nombre}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{cliente.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {serviciosDelCliente.length} servicio(s)
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {format(new Date(cliente.fechaCreacion), 'dd/MM/yyyy')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar el cliente "${cliente.nombre}"?`)) {
                                eliminarCliente(cliente.id);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar Cliente"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Servicios Asignados Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Building2 size={24} />
            Servicios Asignados
          </h2>
          {serviciosFiltrados.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay servicios asignados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Asignación
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serviciosFiltrados.map((servicio) => (
                    <tr key={servicio.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {servicio.activo ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700">Activo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle size={18} className="text-gray-400" />
                            <span className="text-xs font-medium text-gray-500">Inactivo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{servicio.servicioTitulo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{servicio.clienteNombre}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{servicio.clienteEmail}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {format(new Date(servicio.fechaAsignacion), 'dd/MM/yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleServicioActivo(servicio.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={servicio.activo ? 'Desactivar' : 'Activar'}
                          >
                            {servicio.activo ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Estás seguro de desasignar este servicio?')) {
                                desasignarServicio(servicio.id);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Desasignar Servicio"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Cliente Modal */}
        {showAddClienteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Agregar Cliente</h2>
                <button
                  onClick={() => {
                    setShowAddClienteModal(false);
                    setNewCliente({ nombre: '', email: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={newCliente.nombre}
                    onChange={(e) => setNewCliente({ ...newCliente, nombre: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="Ej: Aprovigra - Molinos Modernos S.A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email del Cliente
                  </label>
                  <input
                    type="email"
                    value={newCliente.email}
                    onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
                <div className="flex gap-3 pt-2 border-t">
                  <button
                    onClick={() => {
                      setShowAddClienteModal(false);
                      setNewCliente({ nombre: '', email: '' });
                    }}
                    className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAgregarCliente}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Agregar Cliente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Asignar Servicio Modal */}
        {showAsignarServicioModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Asignar Servicio a Cliente</h2>
                <button
                  onClick={() => {
                    setShowAsignarServicioModal(false);
                    setSelectedCliente(null);
                    setSelectedServicio(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    value={selectedCliente || ''}
                    onChange={(e) => setSelectedCliente(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} ({cliente.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicio
                  </label>
                  <select
                    value={selectedServicio || ''}
                    onChange={(e) => setSelectedServicio(parseInt(e.target.value))}
                    className="w-full border rounded-lg p-2.5"
                  >
                    <option value="">Selecciona un servicio</option>
                    {SERVICIOS_DISPONIBLES.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.titulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2 border-t">
                  <button
                    onClick={() => {
                      setShowAsignarServicioModal(false);
                      setSelectedCliente(null);
                      setSelectedServicio(null);
                    }}
                    className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAsignarServicio}
                    disabled={!selectedCliente || !selectedServicio}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Asignar Servicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServicios;

