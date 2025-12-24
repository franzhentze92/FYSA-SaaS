import React, { useState, useMemo } from 'react';
import { Ship, Plus, Search, X, Users, FileText, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useAdminServicios } from '@/hooks/useAdminServicios';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useSilos } from '@/hooks/useSilos';
import { useBarcos } from '@/hooks/useBarcos';
import { BarcoMaestro } from '@/types/grain';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AdminBarcos: React.FC = () => {
  const { clientes } = useAdminServicios();
  const { barcosMaestros, addBarcoMaestro, updateBarcoMaestro, deleteBarcoMaestro } = useCatalogos();
  const { silos } = useSilos();
  const { getBarcoById } = useBarcos();

  // Verificar si el usuario es admin
  const currentUser = React.useMemo(() => {
    const userJson = localStorage.getItem('fysa-current-user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }, []);
  const isAdmin = currentUser?.role === 'admin';
  const userEmail = currentUser?.email || '';

  // Si no es admin, obtener el cliente correspondiente al email del usuario
  const clienteUsuario = React.useMemo(() => {
    if (isAdmin) return null;
    return clientes.find(c => c.email.toLowerCase() === userEmail.toLowerCase());
  }, [isAdmin, clientes, userEmail]);

  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBarco, setEditingBarco] = useState<BarcoMaestro | null>(null);
  const [newBarco, setNewBarco] = useState({
    nombre: '',
    activo: true,
  });

  // Si no es admin, establecer automáticamente el cliente seleccionado
  React.useEffect(() => {
    if (!isAdmin && clienteUsuario) {
      setSelectedCliente(clienteUsuario.id);
    }
  }, [isAdmin, clienteUsuario]);

  // Obtener barcos del cliente seleccionado
  const barcosDelCliente = useMemo(() => {
    if (isAdmin) {
      // Admin: filtrar por cliente seleccionado o mostrar todos
      if (!selectedCliente) return barcosMaestros;
      const cliente = clientes.find(c => c.id === selectedCliente);
      if (!cliente) return [];
      return barcosMaestros.filter(b => b.clienteEmail === cliente.email);
    } else {
      // Cliente: solo ver sus propios barcos
      if (!clienteUsuario) return [];
      return barcosMaestros.filter(b => b.clienteEmail === clienteUsuario.email);
    }
  }, [selectedCliente, barcosMaestros, clientes, isAdmin, clienteUsuario]);

  // Filtrar barcos por búsqueda
  const barcosFiltrados = useMemo(() => {
    if (!searchQuery) return barcosDelCliente;
    const query = searchQuery.toLowerCase();
    return barcosDelCliente.filter(barco =>
      barco.nombre.toLowerCase().includes(query)
    );
  }, [barcosDelCliente, searchQuery]);

  // Calcular si cada barco maestro tiene batches activos en silos
  const barcosConEstadoActivo = useMemo(() => {
    // Obtener todos los batches que están en silos (tienen silo_id)
    const batchesEnSilos = silos.flatMap(silo => silo.batches || []);

    // Crear un Set con los IDs de BarcoMaestro que tienen batches en silos
    const barcoMaestroIdsConBatches = new Set<string>();
    
    batchesEnSilos.forEach(batch => {
      if (batch.barcoId) {
        // batch.barcoId es el ID del Barco (fondeo), necesitamos obtener el BarcoMaestro
        const barco = getBarcoById(batch.barcoId);
        if (barco?.barcoId) {
          // barco.barcoId es el ID del BarcoMaestro
          barcoMaestroIdsConBatches.add(barco.barcoId);
        }
      }
    });

    // Retornar un Set para consulta rápida
    return barcoMaestroIdsConBatches;
  }, [silos, getBarcoById]);

  const handleAgregarBarco = () => {
    if (!selectedCliente) {
      alert('Por favor selecciona un cliente');
      return;
    }

    if (!newBarco.nombre.trim()) {
      alert('Por favor ingresa el nombre del barco');
      return;
    }

    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) {
      alert('Cliente no encontrado');
      return;
    }

    const barcoData: Omit<BarcoMaestro, 'id' | 'fechaCreacion' | 'fechaModificacion'> = {
      nombre: newBarco.nombre.trim(),
      activo: newBarco.activo,
      clienteEmail: cliente.email, // Agregar email del cliente
    };

    if (editingBarco) {
      updateBarcoMaestro(editingBarco.id, barcoData);
    } else {
      addBarcoMaestro(barcoData);
    }

    // Resetear formulario
    setNewBarco({ nombre: '', activo: true });
    setEditingBarco(null);
    setShowAddModal(false);
  };

  const handleEdit = (barco: BarcoMaestro) => {
    setEditingBarco(barco);
    setNewBarco({ nombre: barco.nombre, activo: barco.activo });
    setShowAddModal(true);
  };

  const handleDelete = async (barcoId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este barco?')) {
      try {
        await deleteBarcoMaestro(barcoId);
        toast.success('Barco eliminado correctamente');
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar el barco');
      }
    }
  };

  const clienteSeleccionado = clientes.find(c => c.id === selectedCliente);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Ship size={32} />
            Administración de Barcos
          </h1>
          <p className="text-gray-600 mt-2">
            Agrega y asigna barcos a los clientes
          </p>
        </div>

        {/* Selector de Cliente - Solo visible para admin */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select
                  value={selectedCliente}
                  onChange={(e) => setSelectedCliente(e.target.value)}
                  className="w-full border rounded-lg p-2.5"
                >
                  <option value="">Todos los clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} ({cliente.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => {
                    setEditingBarco(null);
                    setNewBarco({ nombre: '', activo: true });
                    setShowAddModal(true);
                  }}
                  disabled={!selectedCliente}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                  Agregar Barco
                </button>
              </div>
            </div>
            {selectedCliente && clienteSeleccionado && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Cliente seleccionado:</span> {clienteSeleccionado.nombre}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tabla de Barcos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Ship size={24} />
              Barcos {selectedCliente ? `de ${clienteSeleccionado?.nombre}` : ''}
            </h2>
            <div className="flex-1 max-w-md ml-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar barcos..."
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          {barcosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Ship size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {barcosDelCliente.length === 0
                  ? selectedCliente
                    ? 'No hay barcos registrados para este cliente. Agrega el primer barco.'
                    : 'Selecciona un cliente para agregar barcos.'
                  : 'No se encontraron barcos con la búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre del Barco
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Registro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    {/* Columna Acciones - Solo visible para admin */}
                    {isAdmin && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {barcosFiltrados
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                    .map((barco) => {
                      const barcoCliente = clientes.find(c => c.email === barco.clienteEmail);
                      // Determinar si el barco está activo: tiene batches en silos
                      const tieneBatchesEnSilos = barcosConEstadoActivo.has(barco.id);
                      return (
                        <tr key={barco.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {barco.nombre}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {barcoCliente?.nombre || barco.clienteEmail || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {format(new Date(barco.fechaCreacion), 'dd/MM/yyyy')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tieneBatchesEnSilos
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {tieneBatchesEnSilos ? (
                                <>
                                  <CheckCircle size={12} />
                                  Activo
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} />
                                  Inactivo
                                </>
                              )}
                            </span>
                          </td>
                          {/* Columna Acciones - Solo visible para admin */}
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(barco)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Editar"
                                >
                                  <FileText size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(barco.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para Agregar/Editar Barco */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {editingBarco ? 'Editar Barco' : 'Agregar Nuevo Barco'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewBarco({ nombre: '', activo: true });
                    setEditingBarco(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Barco *
                  </label>
                  <input
                    type="text"
                    value={newBarco.nombre}
                    onChange={(e) => setNewBarco({ ...newBarco, nombre: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="Ej: Titan"
                    required
                  />
                </div>
                {selectedCliente && clienteSeleccionado && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Cliente:</span> {clienteSeleccionado.nombre}
                    </p>
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBarco.activo}
                      onChange={(e) => setNewBarco({ ...newBarco, activo: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Barco activo (disponible para seleccionar)
                    </span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewBarco({ nombre: '', activo: true });
                      setEditingBarco(null);
                    }}
                    className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAgregarBarco}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                  >
                    {editingBarco ? 'Guardar Cambios' : 'Agregar Barco'}
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

export default AdminBarcos;

