import React from 'react';
import { TrendingDown } from 'lucide-react';

const PerdidaEconomica: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingDown size={32} />
            Pérdida Económica
          </h1>
          <p className="text-gray-600 mt-2">
            Análisis de pérdidas económicas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <TrendingDown size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Página en desarrollo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerdidaEconomica;

