import React, { useState, useMemo } from 'react';
import { Package, Search, Plus } from 'lucide-react';
import { useSilos } from '@/hooks/useSilos';
import SiloCard from '@/components/grain/SiloCard';
import AddBatchModal from '@/components/grain/AddBatchModal';
import TraspasoBatchModal from '@/components/grain/TraspasoBatchModal';
import AddEditSiloModal from '@/components/grain/AddEditSiloModal';
import { GrainBatch, Silo } from '@/types/grain';

const Lotes: React.FC = () => {
  const {
    silos,
    addBatchToSilo,
    updateBatch,
    deleteBatch,
    removeBatchFromSilo,
    traspasarBatch,
    addSilo,
    updateSilo,
    deleteSilo,
    getTotalQuantityInSilo,
  } = useSilos();

  // Verificar si el usuario es admin
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

  // Filtrar silos según el rol del usuario
  const silosVisibles = useMemo(() => {
    if (isAdmin) {
      return silos; // Admin ve todos los silos
    } else {
      // Cliente solo ve sus silos asignados
      return silos.filter(s => s.clienteEmail === userEmail);
    }
  }, [silos, isAdmin, userEmail]);

  const [selectedSilo, setSelectedSilo] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<{ siloId: string; batch: GrainBatch } | null>(null);
  const [traspasandoBatch, setTraspasandoBatch] = useState<{ siloId: string; batch: GrainBatch } | null>(null);
  const [editingSilo, setEditingSilo] = useState<Silo | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showTraspasoModal, setShowTraspasoModal] = useState(false);
  const [showSiloModal, setShowSiloModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddBatch = (siloId: string) => {
    if (!isAdmin) return; // Solo admin puede agregar batches
    setSelectedSilo(siloId);
    setEditingBatch(null);
    setShowBatchModal(true);
  };

  const handleEditBatch = (siloId: string, batch: GrainBatch) => {
    if (!isAdmin) return; // Solo admin puede editar batches
    setSelectedSilo(siloId);
    setEditingBatch({ siloId, batch });
    setShowBatchModal(true);
  };

  const handleDeleteBatch = (siloId: string, batchId: string) => {
    if (!isAdmin) return; // Solo admin puede eliminar batches
    if (window.confirm('¿Estás seguro de que deseas vaciar este silo? El batch será removido del silo pero se mantendrá en el historial.')) {
      removeBatchFromSilo(siloId, batchId);
    }
  };

  const handleTraspasarBatch = (siloId: string, batch: GrainBatch) => {
    if (!isAdmin) return; // Solo admin puede traspasar batches
    setTraspasandoBatch({ siloId, batch });
    setShowTraspasoModal(true);
  };

  const handleSubmitTraspaso = (siloDestinoId: string, cantidad: number, notas?: string) => {
    if (traspasandoBatch) {
      traspasarBatch(
        traspasandoBatch.siloId,
        siloDestinoId,
        traspasandoBatch.batch.id,
        cantidad,
        notas
      );
      setShowTraspasoModal(false);
      setTraspasandoBatch(null);
    }
  };

  const handleCloseTraspasoModal = () => {
    setShowTraspasoModal(false);
    setTraspasandoBatch(null);
  };

  const handleAddSilo = () => {
    if (!isAdmin) return; // Solo admin puede agregar silos
    setEditingSilo(null);
    setShowSiloModal(true);
  };

  const handleEditSilo = (silo: Silo) => {
    if (!isAdmin) return; // Solo admin puede editar silos
    setEditingSilo(silo);
    setShowSiloModal(true);
  };

  const handleDeleteSilo = (siloId: string) => {
    if (!isAdmin) return; // Solo admin puede eliminar silos
    deleteSilo(siloId);
  };

  const handleSubmitSilo = (siloData: Omit<Silo, 'id' | 'batches' | 'isActive'>) => {
    if (editingSilo) {
      updateSilo(editingSilo.id, siloData);
    } else {
      addSilo(siloData);
    }
    setShowSiloModal(false);
    setEditingSilo(null);
  };

  const handleCloseSiloModal = () => {
    setShowSiloModal(false);
    setEditingSilo(null);
  };

  const handleSubmitBatch = (batchData: Omit<GrainBatch, 'id'>) => {
    if (selectedSilo) {
      if (editingBatch) {
        // Actualizar batch existente
        updateBatch(selectedSilo, editingBatch.batch.id, batchData);
      } else {
        // Agregar nuevo batch
        addBatchToSilo(selectedSilo, batchData);
      }
      setShowBatchModal(false);
      setSelectedSilo(null);
      setEditingBatch(null);
    }
  };

  const handleCloseModal = () => {
    setShowBatchModal(false);
    setSelectedSilo(null);
    setEditingBatch(null);
  };

  // Filtrar silos por búsqueda
  const filteredSilos = silosVisibles.filter(silo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      `silo ${silo.number}`.includes(query) ||
      silo.batches.some(batch =>
        batch.grainType.toLowerCase().includes(query) ||
        batch.grainSubtype?.toLowerCase().includes(query) ||
        batch.origin.toLowerCase().includes(query)
      )
    );
  });

  const activeSilosCount = silosVisibles.filter(s => s.isActive).length;
  const totalBatches = silosVisibles.reduce((sum, s) => sum + s.batches.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package size={32} />
                Silos y Granos
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona los batches de grano en cada silo
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Silos Activos</p>
                <p className="text-2xl font-bold text-emerald-600">{activeSilosCount}/30</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Batches</p>
                <p className="text-2xl font-bold text-slate-700">{totalBatches}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative max-w-md flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por silo, tipo de grano, origen..."
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            {/* Botón agregar silo */}
            {isAdmin && (
              <button
                onClick={handleAddSilo}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
              >
                <Plus size={20} />
                Agregar Silo
              </button>
            )}
          </div>
        </div>

        {/* Silos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSilos.map((silo) => (
            <SiloCard
              key={silo.id}
              silo={silo}
              onAddBatch={() => handleAddBatch(silo.id)}
              onEditBatch={(batch) => handleEditBatch(silo.id, batch)}
              onDeleteBatch={(batchId) => handleDeleteBatch(silo.id, batchId)}
              onTraspasarBatch={(batch) => handleTraspasarBatch(silo.id, batch)}
              onEditSilo={(silo) => handleEditSilo(silo)}
              onDeleteSilo={(siloId) => handleDeleteSilo(siloId)}
              totalQuantity={getTotalQuantityInSilo(silo.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        {filteredSilos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No se encontraron silos con la búsqueda "{searchQuery}"</p>
          </div>
        )}

        {/* Modal para agregar/editar batch */}
        {selectedSilo && (
          <AddBatchModal
            isOpen={showBatchModal}
            onClose={handleCloseModal}
            onSubmit={handleSubmitBatch}
            siloNumber={silos.find(s => s.id === selectedSilo)?.number || 0}
            existingBatch={editingBatch?.batch}
          />
        )}

        {/* Modal para traspasar batch */}
        {traspasandoBatch && (
          <TraspasoBatchModal
            isOpen={showTraspasoModal}
            onClose={handleCloseTraspasoModal}
            onSubmit={handleSubmitTraspaso}
            batch={traspasandoBatch.batch}
            siloOrigen={silos.find(s => s.id === traspasandoBatch.siloId)!}
            silos={silos}
          />
        )}

        {/* Modal para agregar/editar silo */}
        <AddEditSiloModal
          isOpen={showSiloModal}
          onClose={handleCloseSiloModal}
          onSubmit={handleSubmitSilo}
          existingSilo={editingSilo || undefined}
          existingNumbers={silos.map(s => s.number)}
        />
      </div>
    </div>
  );
};

export default Lotes;
