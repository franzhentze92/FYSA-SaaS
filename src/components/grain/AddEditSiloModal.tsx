import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Silo } from '@/types/grain';

interface AddEditSiloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (silo: Omit<Silo, 'id' | 'batches' | 'isActive'>) => void;
  existingSilo?: Silo;
  existingNumbers: number[]; // Números de silos ya existentes
}

const AddEditSiloModal: React.FC<AddEditSiloModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingSilo,
  existingNumbers,
}) => {
  const [number, setNumber] = useState(1);
  const [nombre, setNombre] = useState('');
  const [capacity, setCapacity] = useState(3600);

  useEffect(() => {
    if (existingSilo) {
      setNumber(existingSilo.number);
      setNombre(existingSilo.nombre || '');
      setCapacity(existingSilo.capacity);
    } else {
      // Encontrar el siguiente número disponible
      const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      setNumber(maxNumber + 1);
      setNombre('');
      setCapacity(3600);
    }
  }, [existingSilo, isOpen, existingNumbers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que el número no esté duplicado (excepto si es el mismo silo)
    if (!existingSilo && existingNumbers.includes(number)) {
      alert(`El número de silo ${number} ya está en uso. Por favor, elige otro número.`);
      return;
    }

    if (existingSilo && number !== existingSilo.number && existingNumbers.includes(number)) {
      alert(`El número de silo ${number} ya está en uso. Por favor, elige otro número.`);
      return;
    }

    onSubmit({
      number,
      nombre: nombre.trim() || undefined,
      capacity,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">
              {existingSilo ? 'Editar Silo' : 'Agregar Nuevo Silo'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Silo *
            </label>
            <input
              type="number"
              value={number}
              onChange={e => setNumber(+e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Número único para identificar el silo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Silo (opcional)
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Silo Principal, Silo Norte, etc."
              className="w-full border rounded-lg p-2.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nombre descriptivo para el silo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad (toneladas) *
            </label>
            <input
              type="number"
              value={capacity}
              onChange={e => setCapacity(+e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
              min="1"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Capacidad máxima en toneladas
            </p>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
            >
              {existingSilo ? 'Actualizar' : 'Agregar'} Silo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditSiloModal;

