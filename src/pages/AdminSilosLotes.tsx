import React, { useState, useMemo } from 'react';
import { Warehouse, Plus, Search, X, Users, FileText, Package, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdminServicios } from '@/hooks/useAdminServicios';
import { useSilos } from '@/hooks/useSilos';
import { Silo, GrainBatch } from '@/types/grain';
import { format } from 'date-fns';
import AddEditSiloModal from '@/components/grain/AddEditSiloModal';
import AddBatchModal from '@/components/grain/AddBatchModal';

const AdminSilosLotes: React.FC = () => {
  const { clientes } = useAdminServicios();
  const { silos, addSilo, updateSilo, deleteSilo, getTotalQuantityInSilo, addBatchToSilo, updateBatch, deleteBatch } = useSilos();

  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSiloModal, setShowSiloModal] = useState(false);
  const [editingSilo, setEditingSilo] = useState<Silo | null>(null);
  const [expandedSilos, setExpandedSilos] = useState<Set<string>>(new Set());
  const [selectedSiloForBatch, setSelectedSiloForBatch] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<{ siloId: string; batch: GrainBatch } | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Obtener silos del cliente seleccionado
  const silosDelCliente = useMemo(() => {
    if (!selectedCliente) return silos;
    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) return [];
    // Filtrar silos asignados a este cliente
    return silos.filter(s => s.clienteEmail === cliente.email);
  }, [selectedCliente, silos, clientes]);

  // Filtrar silos por búsqueda
  const silosFiltrados = useMemo(() => {
    if (!searchQuery) return silosDelCliente;
    const query = searchQuery.toLowerCase();
    return silosDelCliente.filter(silo =>
      `silo ${silo.number}`.toLowerCase().includes(query) ||
      silo.nombre?.toLowerCase().includes(query) ||
      silo.batches.some(batch =>
        batch.grainType.toLowerCase().includes(query) ||
        batch.grainSubtype?.toLowerCase().includes(query) ||
        batch.origin.toLowerCase().includes(query)
      )
    );
  }, [silosDelCliente, searchQuery]);

  const handleAgregarSilo = () => {
    if (!selectedCliente) {
      alert('Por favor selecciona un cliente');
      return;
    }

    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) {
      alert('Cliente no encontrado');
      return;
    }

    // El modal se encargará de agregar el silo con el clienteEmail
    setEditingSilo(null);
    setShowSiloModal(true);
  };

  const handleEdit = (silo: Silo) => {
    setEditingSilo(silo);
    setShowSiloModal(true);
  };

  const handleDelete = (siloId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este silo? Esta acción eliminará todos los batches contenidos.')) {
      deleteSilo(siloId);
    }
  };

  const handleSubmitSilo = (siloData: Omit<Silo, 'id' | 'batches' | 'isActive'>) => {
    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) {
      alert('Cliente no encontrado');
      return;
    }

    const siloConCliente = {
      ...siloData,
      clienteEmail: cliente.email, // Agregar email del cliente
    };

    if (editingSilo) {
      updateSilo(editingSilo.id, siloConCliente);
    } else {
      addSilo(siloConCliente);
    }
    setShowSiloModal(false);
    setEditingSilo(null);
  };

  const handleCloseSiloModal = () => {
    setShowSiloModal(false);
    setEditingSilo(null);
  };

  const toggleSiloExpansion = (siloId: string) => {
    setExpandedSilos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(siloId)) {
        newSet.delete(siloId);
      } else {
        newSet.add(siloId);
      }
      return newSet;
    });
  };

  const handleAddBatch = (siloId: string) => {
    setSelectedSiloForBatch(siloId);
    setEditingBatch(null);
    setShowBatchModal(true);
  };

  const handleEditBatch = (siloId: string, batch: GrainBatch) => {
    setSelectedSiloForBatch(siloId);
    setEditingBatch({ siloId, batch });
    setShowBatchModal(true);
  };

  const handleDeleteBatch = (siloId: string, batchId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este batch?')) {
      deleteBatch(siloId, batchId);
    }
  };

  const handleSubmitBatch = (batchData: Omit<GrainBatch, 'id'>) => {
    if (selectedSiloForBatch) {
      if (editingBatch) {
        updateBatch(selectedSiloForBatch, editingBatch.batch.id, batchData);
      } else {
        addBatchToSilo(selectedSiloForBatch, batchData);
      }
      setShowBatchModal(false);
      setSelectedSiloForBatch(null);
      setEditingBatch(null);
    }
  };

  const handleCloseBatchModal = () => {
    setShowBatchModal(false);
    setSelectedSiloForBatch(null);
    setEditingBatch(null);
  };

  const clienteSeleccionado = clientes.find(c => c.id === selectedCliente);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Warehouse size={32} />
            Administración de Silos y Lotes
          </h1>
          <p className="text-gray-600 mt-2">
            Agrega y asigna silos a los clientes
          </p>
        </div>

        {/* Selector de Cliente */}
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
                onClick={handleAgregarSilo}
                disabled={!selectedCliente}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Agregar Silo
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

        {/* Tabla de Silos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Warehouse size={24} />
              Silos {selectedCliente ? `de ${clienteSeleccionado?.nombre}` : ''}
            </h2>
            <div className="flex-1 max-w-md ml-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar silos..."
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          {silosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Warehouse size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {silosDelCliente.length === 0
                  ? selectedCliente
                    ? 'No hay silos registrados para este cliente. Agrega el primer silo.'
                    : 'Selecciona un cliente para agregar silos.'
                  : 'No se encontraron silos con la búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batches
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {silosFiltrados
                    .sort((a, b) => a.number - b.number)
                    .map((silo) => {
                      const siloCliente = clientes.find(c => c.email === silo.clienteEmail);
                      const totalQuantity = getTotalQuantityInSilo(silo.id);
                      const capacityPercent = (totalQuantity / silo.capacity) * 100;
                      return (
                        <React.Fragment key={silo.id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium text-gray-900">
                                Silo {silo.number}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">
                                {silo.nombre || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">
                                {siloCliente?.nombre || silo.clienteEmail || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">
                                {totalQuantity.toFixed(2)} / {silo.capacity} toneladas
                              </span>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    capacityPercent >= 100 ? 'bg-red-500' : capacityPercent >= 80 ? 'bg-yellow-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">
                                {silo.batches.length} batch{silo.batches.length !== 1 ? 'es' : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {silo.isActive ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Vacío
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleSiloExpansion(silo.id)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                  title={expandedSilos.has(silo.id) ? "Ocultar batches" : "Ver batches"}
                                >
                                  {expandedSilos.has(silo.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <button
                                  onClick={() => handleAddBatch(silo.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                  title="Agregar batch"
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  onClick={() => handleEdit(silo)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Editar silo"
                                >
                                  <FileText size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(silo.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar silo"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedSilos.has(silo.id) && (
                            <tr>
                              <td colSpan={7} className="px-4 py-4 bg-gray-50">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-700">
                                      Batches del Silo {silo.number}
                                    </h4>
                                    <button
                                      onClick={() => handleAddBatch(silo.id)}
                                      className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                    >
                                      <Plus size={12} />
                                      Agregar Batch
                                    </button>
                                  </div>
                                  {silo.batches.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                      No hay batches en este silo
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {silo.batches.map((batch) => (
                                        <div
                                          key={batch.id}
                                          className="bg-white rounded-lg p-3 border border-gray-200 flex items-start justify-between"
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                              <span className="font-medium text-sm text-gray-900">
                                                {batch.grainType}
                                                {batch.grainSubtype && (
                                                  <span className="text-gray-500 ml-1">({batch.grainSubtype})</span>
                                                )}
                                              </span>
                                              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                ID: {batch.id.substring(0, 8).toUpperCase()}
                                              </span>
                                            </div>
                                            <div className="text-xs text-gray-600 space-y-1">
                                              <p>
                                                <span className="font-medium">Cantidad:</span> {batch.quantity} {batch.unit === 'tonnes' ? 'ton' : 'kg'}
                                              </p>
                                              <p>
                                                <span className="font-medium">Fecha de entrada:</span> {format(new Date(batch.entryDate), 'dd/MM/yyyy')}
                                              </p>
                                              <p>
                                                <span className="font-medium">Origen:</span> {batch.origin}
                                              </p>
                                              {batch.notes && (
                                                <p>
                                                  <span className="font-medium">Notas:</span> {batch.notes}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex gap-1 ml-4">
                                            <button
                                              onClick={() => handleEditBatch(silo.id, batch)}
                                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                              title="Editar batch"
                                            >
                                              <Edit size={14} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteBatch(silo.id, batch.id)}
                                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                              title="Eliminar batch"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para Agregar/Editar Silo */}
        <AddEditSiloModal
          isOpen={showSiloModal}
          onClose={handleCloseSiloModal}
          onSubmit={handleSubmitSilo}
          existingSilo={editingSilo || undefined}
          existingNumbers={silos.map(s => s.number)}
        />

        {/* Modal para Agregar/Editar Batch */}
        {selectedSiloForBatch && (
          <AddBatchModal
            isOpen={showBatchModal}
            onClose={handleCloseBatchModal}
            onSubmit={handleSubmitBatch}
            siloNumber={silos.find(s => s.id === selectedSiloForBatch)?.number || 0}
            existingBatch={editingBatch?.batch}
          />
        )}
      </div>
    </div>
  );
};

export default AdminSilosLotes;

