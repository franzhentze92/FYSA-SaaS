import React, { useState } from 'react';
import { X, Plus, Minus, Thermometer, Droplets, Scale } from 'lucide-react';
import { GrainLot, PEST_TYPES, PestCount } from '@/types/grain';

interface InspectionModalProps {
  lot: GrainLot;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { pestCounts: PestCount[]; temperature: number; humidity: number; sampleWeight: number; notes: string }) => void;
}

const InspectionModal: React.FC<InspectionModalProps> = ({ lot, isOpen, onClose, onSubmit }) => {
  const [pestCounts, setPestCounts] = useState<PestCount[]>(
    PEST_TYPES.slice(0, 6).map(p => ({ pestType: p.name, alive: 0, dead: 0 }))
  );
  const [temperature, setTemperature] = useState(25);
  const [humidity, setHumidity] = useState(60);
  const [sampleWeight, setSampleWeight] = useState(1);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const updateCount = (idx: number, field: 'alive' | 'dead', delta: number) => {
    setPestCounts(prev => prev.map((p, i) => 
      i === idx ? { ...p, [field]: Math.max(0, p[field] + delta) } : p
    ));
  };

  const handleSubmit = () => {
    onSubmit({ pestCounts: pestCounts.filter(p => p.alive > 0 || p.dead > 0), temperature, humidity, sampleWeight, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">New Inspection</h2>
            <p className="text-sm text-gray-500">{lot.grainType} - {lot.facility}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-xs text-gray-500 flex items-center gap-1"><Thermometer size={12} /> Temp (°C)</label>
              <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} className="w-full mt-1 text-lg font-semibold bg-transparent" />
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-xs text-gray-500 flex items-center gap-1"><Droplets size={12} /> Humidity (%)</label>
              <input type="number" value={humidity} onChange={e => setHumidity(+e.target.value)} className="w-full mt-1 text-lg font-semibold bg-transparent" />
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-xs text-gray-500 flex items-center gap-1"><Scale size={12} /> Sample (kg)</label>
              <input type="number" step="0.1" value={sampleWeight} onChange={e => setSampleWeight(+e.target.value)} className="w-full mt-1 text-lg font-semibold bg-transparent" />
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Pest Counts</h3>
            <div className="space-y-2">
              {pestCounts.map((pc, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                  <span className="flex-1 text-sm font-medium">{pc.pestType}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 w-10">Alive</span>
                    <button onClick={() => updateCount(idx, 'alive', -1)} className="p-1 hover:bg-gray-200 rounded"><Minus size={14} /></button>
                    <span className="w-8 text-center font-mono">{pc.alive}</span>
                    <button onClick={() => updateCount(idx, 'alive', 1)} className="p-1 hover:bg-gray-200 rounded"><Plus size={14} /></button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 w-10">Dead</span>
                    <button onClick={() => updateCount(idx, 'dead', -1)} className="p-1 hover:bg-gray-200 rounded"><Minus size={14} /></button>
                    <span className="w-8 text-center font-mono">{pc.dead}</span>
                    <button onClick={() => updateCount(idx, 'dead', 1)} className="p-1 hover:bg-gray-200 rounded"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." className="w-full border rounded-lg p-3 h-20" />
        </div>
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">Save Inspection</button>
        </div>
      </div>
    </div>
  );
};

export default InspectionModal;
