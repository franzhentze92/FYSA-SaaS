import React, { useState } from 'react';
import { Ship, Plus, Edit, Trash2, Search, CheckCircle, XCircle, X } from 'lucide-react';
import { useCatalogos } from '@/hooks/useCatalogos';
import { BarcoMaestro } from '@/types/grain';

const BarcosMaestros: React.FC = () => {
  const {
    barcosMaestros,
    addBarcoMaestro,
    updateBarcoMaestro,
    deleteBarcoMaestro,
  } = useCatalogos();

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

  // Filtrar barcos según el rol del usuario
  const barcosVisibles = React.useMemo(() => {
    if (isAdmin) {
      return barcosMaestros; // Admin ve todos los barcos
    } else {
      // Cliente solo ve sus barcos asignados
      return barcosMaestros.filter(b => b.clienteEmail === userEmail && b.activo);
    }
  }, [barcosMaestros, isAdmin, userEmail]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBarco, setEditingBarco] = useState<BarcoMaestro | null>(null);
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);

  const handleAdd = () => {
    setEditingBarco(null);
    setNombre('');
    setActivo(true);
    setShowModal(true);
  };

  const handleEdit = (barco: BarcoMaestro) => {
    setEditingBarco(barco);
    setNombre(barco.nombre);
    setActivo(barco.activo);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este barco del catálogo?')) {
      deleteBarcoMaestro(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBarco) {
      updateBarcoMaestro(editingBarco.id, { nombre, activo });
    } else {
      addBarcoMaestro({ nombre, activo });
    }
    setShowModal(false);
    setEditingBarco(null);
    setNombre('');
    setActivo(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBarco(null);
    setNombre('');
    setActivo(true);
  };

  const filteredBarcos = barcosVisibles.filter(barco =>
    barco.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const barcosActivos = barcosVisibles.filter(b => b.activo).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Ship size={32} />
                Catálogo de Barcos
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona los barcos disponibles en el sistema
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                <Plus size={20} />
                Agregar Barco
              </button>
            )}
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Total de Barcos</p>
              <p className="text-2xl font-bold text-slate-700">{barcosVisibles.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Barcos Activos</p>
              <p className="text-2xl font-bold text-emerald-600">{barcosActivos}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar barco..."
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Lista de Barcos */}
        {filteredBarcos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Ship size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery 
                ? `No se encontraron barcos con la búsqueda "${searchQuery}"`
                : 'No hay barcos registrados'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus size={18} />
                Agregar Primer Barco
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBarcos.map((barco) => (
                  <tr key={barco.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Ship size={20} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{barco.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        barco.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {barco.activo ? (
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
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(barco)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(barco.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {editingBarco ? 'Editar Barco' : 'Agregar Barco'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Barco *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Barco Titan"
                    className="w-full border rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Barco activo (disponible para seleccionar)
                    </span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
                  >
                    {editingBarco ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcosMaestros;

