import React, { useState } from 'react';
import { X } from 'lucide-react';
import { GRAIN_TYPES } from '@/types/grain';

interface CreateLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { grainType: string; quantity: number; unit: 'kg' | 'tonnes'; pricePerTon: number; facility: string; startDate: string }) => void;
}

const CreateLotModal: React.FC<CreateLotModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [grainType, setGrainType] = useState('Maíz');
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState<'kg' | 'tonnes'>('tonnes');
  const [pricePerTon, setPricePerTon] = useState(300);
  const [facility, setFacility] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ grainType, quantity, unit, pricePerTon, facility, startDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Create New Grain Lot</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grain Type</label>
            <select value={grainType} onChange={e => setGrainType(e.target.value)} className="w-full border rounded-lg p-2.5">
              {GRAIN_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} className="w-full border rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value as 'kg' | 'tonnes')} className="w-full border rounded-lg p-2.5">
                <option value="kg">Kilograms</option>
                <option value="tonnes">Tonnes</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per Ton ($)</label>
            <input type="number" value={pricePerTon} onChange={e => setPricePerTon(+e.target.value)} className="w-full border rounded-lg p-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facility / Silo</label>
            <input type="text" value={facility} onChange={e => setFacility(e.target.value)} placeholder="e.g., Silo A-1" className="w-full border rounded-lg p-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-lg p-2.5" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900">Create Lot</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLotModal;
