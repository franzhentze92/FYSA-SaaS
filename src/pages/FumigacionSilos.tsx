import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import { useFumigacionSilos } from '@/hooks/useFumigacionSilos';
import { useSilos } from '@/hooks/useSilos';
import { useAdminServicios, SERVICIOS_DISPONIBLES } from '@/hooks/useAdminServicios';
import { FumigacionSilo } from '@/types/grain';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AddEditFumigacionModal from '@/components/grain/AddEditFumigacionModal';

const FumigacionSilos: React.FC = () => {
  const { fumigaciones, loading, addFumigacion, updateFumigacion, deleteFumigacion } = useFumigacionSilos();
  const { silos } = useSilos();
  const { clientes } = useAdminServicios();

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

  const [showModal, setShowModal] = useState(false);
  const [editingFumigacion, setEditingFumigacion] = useState<FumigacionSilo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSilo, setFilterSilo] = useState('');
  const [filterTipoGrano, setFilterTipoGrano] = useState('');
  const [filterCliente, setFilterCliente] = useState('');

  // Lista de silos únicos para filtro
  const silosUnicos = useMemo(() => {
    const silos = new Set(fumigaciones.map(f => f.silo));
    return Array.from(silos).sort();
  }, [fumigaciones]);

  // Lista de tipos de grano únicos para filtro
  const tiposGranoUnicos = useMemo(() => {
    const tipos = new Set(fumigaciones.map(f => f.tipoGrano));
    return Array.from(tipos).sort();
  }, [fumigaciones]);

  // Lista de clientes únicos para filtro (basado en los silos de las gasificaciones)
  const clientesUnicos = useMemo(() => {
    const clientesMap = new Map<string, string>(); // email -> nombre
    fumigaciones.forEach(f => {
      const siloNum = parseInt(f.silo.replace('AP-', ''));
      const siloEncontrado = silos.find(s => s.number === siloNum);
      if (siloEncontrado?.clienteEmail) {
        const cliente = clientes.find(c => c.email === siloEncontrado.clienteEmail);
        if (cliente) {
          clientesMap.set(cliente.email, cliente.nombre);
        }
      }
    });
    return Array.from(clientesMap.entries())
      .map(([email, nombre]) => ({ email, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [fumigaciones, silos, clientes]);

  // Función helper para obtener el nombre del cliente de una fumigación
  const getClienteNombre = (fumigacion: FumigacionSilo): string => {
    const siloNum = parseInt(fumigacion.silo.replace('AP-', ''));
    const siloEncontrado = silos.find(s => s.number === siloNum);
    if (siloEncontrado?.clienteEmail) {
      const cliente = clientes.find(c => c.email === siloEncontrado.clienteEmail);
      return cliente?.nombre || siloEncontrado.clienteEmail || '-';
    }
    return '-';
  };

  // Función helper para obtener el nombre del servicio
  const getServicioNombre = (fumigacion: FumigacionSilo): string => {
    if (!fumigacion.servicioId) return '-';
    const servicio = SERVICIOS_DISPONIBLES.find(s => s.id === fumigacion.servicioId);
    return servicio?.titulo || '-';
  };

  // Filtrar gasificaciones
  const fumigacionesFiltradas = useMemo(() => {
    return fumigaciones.filter(f => {
      const clienteNombre = getClienteNombre(f);
      const matchesSearch = !searchQuery || 
        f.silo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tipoGrano.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.productoUtilizado && f.productoUtilizado.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.tecnico && f.tecnico.toLowerCase().includes(searchQuery.toLowerCase())) ||
        clienteNombre.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSilo = !filterSilo || f.silo === filterSilo;
      const matchesTipoGrano = !filterTipoGrano || f.tipoGrano === filterTipoGrano;
      const matchesCliente = !filterCliente || (() => {
        const siloNum = parseInt(f.silo.replace('AP-', ''));
        const siloEncontrado = silos.find(s => s.number === siloNum);
        return siloEncontrado?.clienteEmail === filterCliente;
      })();

      return matchesSearch && matchesSilo && matchesTipoGrano && matchesCliente;
    });
  }, [fumigaciones, searchQuery, filterSilo, filterTipoGrano, filterCliente, silos]);

  const handleAdd = () => {
    setEditingFumigacion(null);
    setShowModal(true);
  };

  const handleEdit = (fumigacion: FumigacionSilo) => {
    setEditingFumigacion(fumigacion);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta fumigación?')) {
      try {
        await deleteFumigacion(id);
      } catch (error) {
        alert('Error al eliminar la fumigación');
        console.error(error);
      }
    }
  };

  const handleSubmit = async (fumigacionData: Omit<FumigacionSilo, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingFumigacion) {
        await updateFumigacion(editingFumigacion.id, fumigacionData);
      } else {
        await addFumigacion(fumigacionData);
      }
      setShowModal(false);
      setEditingFumigacion(null);
    } catch (error) {
      alert(`Error al ${editingFumigacion ? 'actualizar' : 'agregar'} la fumigación`);
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFumigacion(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando fumigaciones...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Fumigación de Silos</h1>
        <p className="text-gray-600">Registro de fumigaciones realizadas a silos y granos</p>
      </div>

      {/* Header con búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por silo, tipo de grano, producto, técnico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={filterSilo}
                onChange={(e) => setFilterSilo(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los silos</option>
                {silosUnicos.map(silo => (
                  <option key={silo} value={silo}>{silo}</option>
                ))}
              </select>
            </div>

            <select
              value={filterTipoGrano}
              onChange={(e) => setFilterTipoGrano(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              {tiposGranoUnicos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            {/* Filtro por cliente - Solo visible para admin */}
            {isAdmin && (
              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los clientes</option>
                {clientesUnicos.map(cliente => (
                  <option key={cliente.email} value={cliente.email}>{cliente.nombre}</option>
                ))}
              </select>
            )}

            {/* Botón Agregar Fumigación - Solo visible para admin */}
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>Agregar Fumigación</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de fumigaciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {fumigacionesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {fumigaciones.length === 0 
              ? 'No hay fumigaciones registradas. Agrega una nueva fumigación para comenzar.'
              : 'No se encontraron fumigaciones que coincidan con los filtros seleccionados.'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Servicio Realizado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Silo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Grano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto Utilizado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                  {/* Columna Acciones - Solo visible para admin */}
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fumigacionesFiltradas.map((fumigacion) => (
                  <tr key={fumigacion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(fumigacion.fechaFumigacion), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getClienteNombre(fumigacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {fumigacion.silo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {fumigacion.tipoGrano}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getServicioNombre(fumigacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {fumigacion.productoUtilizado || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {fumigacion.dosis 
                        ? `${fumigacion.dosis} ${fumigacion.unidadMedida || ''}`.trim()
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {fumigacion.tecnico || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={fumigacion.notas || ''}>
                      {fumigacion.notas || '-'}
                    </td>
                    {/* Columna Acciones - Solo visible para admin */}
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(fumigacion)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(fumigacion.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar/editar fumigación */}
      <AddEditFumigacionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        existingFumigacion={editingFumigacion || undefined}
      />
    </div>
  );
};

export default FumigacionSilos;

