import React, { useState } from 'react';
import { Package, Plus, Edit, Trash2, Search, CheckCircle, XCircle, X, Trash } from 'lucide-react';
import { useCatalogos } from '@/hooks/useCatalogos';
import { VariedadGrano, GRAIN_TYPES } from '@/types/grain';

const GranosVariedades: React.FC = () => {
  const {
    variedadesGrano,
    addVariedadGrano,
    updateVariedadGrano,
    deleteVariedadGrano,
    deleteAllVariedades,
    getTiposGranoConVariedades,
  } = useCatalogos();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVariedad, setEditingVariedad] = useState<VariedadGrano | null>(null);
  const [tipoGrano, setTipoGrano] = useState('Trigo');
  const [variedad, setVariedad] = useState('');
  const [activo, setActivo] = useState(true);

  const handleAdd = () => {
    setEditingVariedad(null);
    setTipoGrano('Trigo');
    setVariedad('');
    setActivo(true);
    setShowModal(true);
  };

  const handleEdit = (variedadItem: VariedadGrano) => {
    setEditingVariedad(variedadItem);
    setTipoGrano(variedadItem.tipoGrano);
    setVariedad(variedadItem.variedad);
    setActivo(variedadItem.activo);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta variedad?')) {
      deleteVariedadGrano(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVariedad) {
      updateVariedadGrano(editingVariedad.id, { tipoGrano, variedad, activo });
    } else {
      addVariedadGrano({ tipoGrano, variedad, activo });
    }
    setShowModal(false);
    setEditingVariedad(null);
    setTipoGrano('Trigo');
    setVariedad('');
    setActivo(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVariedad(null);
    setTipoGrano('Trigo');
    setVariedad('');
    setActivo(true);
  };

  const tiposConVariedades = getTiposGranoConVariedades();
  const filteredTipos = tiposConVariedades.filter(tipo =>
    tipo.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tipo.variedades.some(v => v.variedad.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalVariedades = variedadesGrano.length;
  const variedadesActivas = variedadesGrano.filter(v => v.activo).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package size={32} />
                Granos y Variedades
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona los tipos de granos y sus variedades
              </p>
            </div>
            <div className="flex gap-2">
              {variedadesGrano.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que deseas eliminar todas las ${variedadesGrano.length} variedades registradas? Esta acción no se puede deshacer.`)) {
                      deleteAllVariedades();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  <Trash size={20} />
                  Eliminar Todas
                </button>
              )}
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                <Plus size={20} />
                Agregar Variedad
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Total de Variedades</p>
              <p className="text-2xl font-bold text-slate-700">{totalVariedades}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Variedades Activas</p>
              <p className="text-2xl font-bold text-emerald-600">{variedadesActivas}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tipo o variedad..."
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Lista por Tipo de Grano */}
        {filteredTipos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery
                ? `No se encontraron resultados con la búsqueda "${searchQuery}"`
                : 'No hay variedades registradas'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus size={18} />
                Agregar Primera Variedad
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTipos.map((tipoData) => (
              <div key={tipoData.tipo} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{tipoData.tipo}</h3>
                  <p className="text-sm text-gray-500">
                    {tipoData.variedades.length} variedad{tipoData.variedades.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                {tipoData.variedades.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>No hay variedades registradas para este tipo</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {tipoData.variedades.map((variedadItem) => (
                      <div key={variedadItem.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium text-gray-900">{variedadItem.variedad}</p>
                            <p className="text-sm text-gray-500">{tipoData.tipo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            variedadItem.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {variedadItem.activo ? (
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(variedadItem)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(variedadItem.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {editingVariedad ? 'Editar Variedad' : 'Agregar Variedad'}
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
                    Tipo de Grano *
                  </label>
                  <select
                    value={tipoGrano}
                    onChange={(e) => setTipoGrano(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                    required
                  >
                    {GRAIN_TYPES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variedad *
                  </label>
                  <input
                    type="text"
                    value={variedad}
                    onChange={(e) => setVariedad(e.target.value)}
                    placeholder="Ej: HWED, Premium, etc."
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
                      Variedad activa (disponible para seleccionar)
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
                    {editingVariedad ? 'Actualizar' : 'Agregar'}
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

export default GranosVariedades;

