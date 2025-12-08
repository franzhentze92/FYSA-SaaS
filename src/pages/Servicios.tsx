import React, { useState } from 'react';
import { ClipboardList, Search, CheckSquare, Square } from 'lucide-react';

interface Servicio {
  id: number;
  titulo: string;
  activo: boolean;
}

const Servicios: React.FC = () => {
  const [servicios, setServicios] = useState<Servicio[]>([
    { id: 217402, titulo: 'Fumigación de Graneleras - APROVIGRA', activo: false },
    { id: 187066, titulo: 'Solicitud de Fumigación APROVIGRA', activo: false },
    { id: 150702, titulo: 'Fumigación de graneleras APROVIGRA 2.0', activo: false },
    { id: 148998, titulo: 'Aspersión en banda APROVIGRA', activo: false },
    { id: 148591, titulo: 'Liberación de Encarpado APROVIGRA', activo: false },
    { id: 136260, titulo: 'Fumigación General APROVIGRA', activo: false },
    { id: 136259, titulo: 'Muestreo de Granos APROVIGRA', activo: false },
    { id: 136258, titulo: 'Control de Roedores APROVIGRA', activo: false },
    { id: 136257, titulo: 'Gasificación y Encarpado APROVIGRA', activo: false },
    { id: 136256, titulo: 'Servicios generales APROVIGRA', activo: false },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const toggleServicio = (id: number) => {
    setServicios(prev => prev.map(servicio =>
      servicio.id === id ? { ...servicio, activo: !servicio.activo } : servicio
    ));
  };

  const serviciosFiltrados = servicios.filter(servicio =>
    servicio.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    servicio.id.toString().includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ClipboardList size={32} />
                Servicios
              </h1>
              <p className="text-gray-600 mt-2">
                Gestión de servicios disponibles
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID o título..."
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Tabla de Servicios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <CheckSquare size={16} className="text-gray-400" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviciosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No se encontraron servicios con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  serviciosFiltrados.map((servicio) => (
                    <tr
                      key={servicio.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        servicio.activo ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleServicio(servicio.id)}
                          className="flex items-center justify-center"
                        >
                          {servicio.activo ? (
                            <CheckSquare size={20} className="text-blue-600" />
                          ) : (
                            <Square size={20} className="text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-blue-600">
                          {servicio.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {servicio.titulo}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {serviciosFiltrados.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {serviciosFiltrados.length} de {servicios.length} servicios
          </div>
        )}
      </div>
    </div>
  );
};

export default Servicios;

