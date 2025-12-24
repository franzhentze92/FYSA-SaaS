import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Search, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useAdminServicios } from '@/hooks/useAdminServicios';

const Servicios: React.FC = () => {
  const navigate = useNavigate();
  const { serviciosAsignados } = useAdminServicios();
  const [searchQuery, setSearchQuery] = useState('');

  // Obtener el usuario actual del localStorage
  const currentUser = useMemo(() => {
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

  // Filtrar servicios según el rol del usuario
  const serviciosDelUsuario = useMemo(() => {
    if (isAdmin) {
      return serviciosAsignados; // Admin ve todos los servicios asignados
    } else {
      // Cliente solo ve sus servicios asignados
      return serviciosAsignados.filter(s => s.clienteEmail === userEmail);
    }
  }, [serviciosAsignados, isAdmin, userEmail]);

  // Filtrar por búsqueda
  const serviciosFiltrados = useMemo(() => {
    if (!searchQuery) return serviciosDelUsuario;
    const query = searchQuery.toLowerCase();
    return serviciosDelUsuario.filter(servicio =>
      servicio.servicioTitulo.toLowerCase().includes(query) ||
      servicio.servicioId.toString().includes(query)
    );
  }, [serviciosDelUsuario, searchQuery]);

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
                {isAdmin 
                  ? 'Todos los servicios asignados' 
                  : 'Servicios asignados a tu cuenta'}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título del Servicio
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviciosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-4 py-12 text-center">
                      <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">
                        {serviciosDelUsuario.length === 0
                          ? isAdmin
                            ? 'No hay servicios asignados. Ve a Administración de Servicios para asignar servicios a clientes.'
                            : 'No tienes servicios asignados. Contacta al administrador para que te asigne servicios.'
                          : 'No se encontraron servicios con la búsqueda.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  serviciosFiltrados.map((servicio) => (
                    <tr
                      key={servicio.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        servicio.activo ? '' : 'opacity-60'
                      }`}
                    >
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
                        <span className="text-sm font-medium text-blue-600">
                          {servicio.servicioId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 font-medium">
                          {servicio.servicioTitulo}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm text-gray-900">{servicio.clienteNombre}</span>
                            <span className="text-xs text-gray-500 block">{servicio.clienteEmail}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/servicios/${servicio.servicioId}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                          title="Ver documentos del servicio"
                        >
                          Ver
                          <ChevronRight size={16} />
                        </button>
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
            Mostrando {serviciosFiltrados.length} de {serviciosDelUsuario.length} servicios
          </div>
        )}
      </div>
    </div>
  );
};

export default Servicios;
