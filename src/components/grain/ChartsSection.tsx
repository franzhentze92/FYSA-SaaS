import React from 'react';
import PestTrendChart from './PestTrendChart';
import LossChart from './LossChart';
import PestCompositionChart from './PestCompositionChart';
import RiskMatrix from './RiskMatrix';
import WeeklyComparison from './WeeklyComparison';
import { pestTrendData, lossChartData, pestCompositionData, riskMatrixData, weeklyComparisonData } from '@/data/chartData';

const ChartsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Analytics & Insights</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PestTrendChart data={pestTrendData} />
        <LossChart data={lossChartData} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PestCompositionChart data={pestCompositionData} />
        <div className="lg:col-span-2">
          <RiskMatrix data={riskMatrixData} />
        </div>
      </div>
      
      <WeeklyComparison data={weeklyComparisonData} />
    </div>
  );
};

export default ChartsSection;
