import React, { useState } from 'react';
import { Ship, Plus, Search, AlertTriangle } from 'lucide-react';
import { useBarcos } from '@/hooks/useBarcos';
import { useCatalogos } from '@/hooks/useCatalogos';
import BarcoCard from '@/components/grain/BarcoCard';
import AddBarcoModal from '@/components/grain/AddBarcoModal';
import { Barco } from '@/types/grain';

const Barcos: React.FC = () => {
  const {
    barcos,
    addBarco,
    updateBarco,
    deleteBarco,
    totalBarcos,
    barcosConTratamiento,
    totalGrano,
  } = useBarcos();
  
  const { getBarcoMaestroById, variedadesGrano } = useCatalogos();
  
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
      return barcos; // Admin ve todos los barcos
    } else {
      // Cliente solo ve sus barcos asignados
      return barcos.filter(b => (b as any).clienteEmail === userEmail);
    }
  }, [barcos, isAdmin, userEmail]);
  
  const getVariedadNombre = (variedadId?: string) => {
    if (!variedadId) return null;
    const variedad = variedadesGrano.find(v => v.id === variedadId);
    return variedad?.variedad || null;
  };

  const [selectedBarco, setSelectedBarco] = useState<Barco | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddBarco = () => {
    setSelectedBarco(null);
    setShowModal(true);
  };

  const handleEditBarco = (barco: Barco) => {
    setSelectedBarco(barco);
    setShowModal(true);
  };

  const handleDeleteBarco = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de barco?')) {
      deleteBarco(id);
    }
  };

  const handleSubmitBarco = (barcoData: Omit<Barco, 'id'>) => {
    if (selectedBarco) {
      updateBarco(selectedBarco.id, barcoData);
    } else {
      addBarco(barcoData);
    }
    setShowModal(false);
    setSelectedBarco(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBarco(null);
  };

  // Filtrar barcos por búsqueda
  const filteredBarcos = barcosVisibles.filter(barco => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const barcoMaestro = getBarcoMaestroById(barco.barcoId);
    const nombreBarco = barcoMaestro?.nombre || '';
    return (
      nombreBarco.toLowerCase().includes(query) ||
      barco.granos.some(g => g.tipoGrano.toLowerCase().includes(query)) ||
      barco.muestreoInsectos.some(insect => 
        insect.pestType.toLowerCase().includes(query)
      )
    );
  });

  // Ordenar por fecha de fondeo (más reciente primero)
  const sortedBarcos = [...filteredBarcos].sort((a, b) => 
    new Date(b.fechaFondeo).getTime() - new Date(a.fechaFondeo).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Ship size={32} />
                Fondeo de Barcos
              </h1>
              <p className="text-gray-600 mt-2">
                Registro de entradas de barcos al país
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleAddBarco}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                <Plus size={20} />
                Agregar Barco
              </button>
            )}
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Total de Barcos</p>
              <p className="text-2xl font-bold text-slate-700">{totalBarcos}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Con Tratamiento OIRSA</p>
              <p className="text-2xl font-bold text-red-600">{barcosConTratamiento}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Total Grano (toneladas)</p>
              <p className="text-2xl font-bold text-emerald-600">
                {totalGrano.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, tipo de grano, insectos..."
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Alertas si hay barcos con tratamiento */}
        {barcosConTratamiento > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">
                {barcosConTratamiento} barco{barcosConTratamiento > 1 ? 's' : ''} requirió tratamiento cuarentenario OIRSA
              </p>
              <p className="text-sm text-red-600">
                Revisa los detalles de cada barco para más información
              </p>
            </div>
          </div>
        )}

        {/* Grid de Barcos */}
        {sortedBarcos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Ship size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery 
                ? `No se encontraron barcos con la búsqueda "${searchQuery}"`
                : 'No hay barcos registrados'}
            </p>
            {!searchQuery && isAdmin && (
              <button
                onClick={handleAddBarco}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus size={18} />
                Agregar Primer Barco
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedBarcos.map((barco) => {
              const barcoMaestro = getBarcoMaestroById(barco.barcoId);
              const nombreBarco = barcoMaestro?.nombre || 'Barco desconocido';
              return (
                <BarcoCard
                  key={barco.id}
                  barco={barco}
                  nombreBarco={nombreBarco}
                  getVariedadNombre={getVariedadNombre}
                  onEdit={() => handleEditBarco(barco)}
                  onDelete={() => handleDeleteBarco(barco.id)}
                />
              );
            })}
          </div>
        )}

        {/* Modal para agregar/editar barco */}
        <AddBarcoModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={handleSubmitBarco}
          existingBarco={selectedBarco || undefined}
        />
      </div>
    </div>
  );
};

export default Barcos;

