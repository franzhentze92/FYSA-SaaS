import React from 'react';
import { Plus, BarChart3 } from 'lucide-react';

interface HeroSectionProps {
  onCreateLot: () => void;
  totalLots: number;
  totalValue: number;
  totalLoss: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onCreateLot, totalLots, totalValue, totalLoss }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url(https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775037076_77a4ee78.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Stored Grain Pest Monitoring
            </h2>
            <p className="text-slate-300 max-w-xl">
              Track pest populations, calculate economic losses, and receive actionable recommendations 
              to protect your stored grain inventory.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={onCreateLot}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                New Grain Lot
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors backdrop-blur">
                <BarChart3 size={18} />
                View Analytics
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{totalLots}</p>
              <p className="text-xs text-slate-300 mt-1">Active Lots</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">${(totalValue / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-300 mt-1">Total Value</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-400">${(totalLoss / 1000).toFixed(1)}K</p>
              <p className="text-xs text-slate-300 mt-1">Est. Loss</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
