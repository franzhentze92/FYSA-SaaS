import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonData {
  metric: string;
  current: number;
  previous: number;
  unit: string;
}

interface WeeklyComparisonProps {
  data: ComparisonData[];
}

const WeeklyComparison: React.FC<WeeklyComparisonProps> = ({ data }) => {
  const getChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, trend: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
    };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral', isLossMetric: boolean) => {
    if (trend === 'neutral') return <Minus size={14} className="text-gray-400" />;
    if (trend === 'up') {
      return isLossMetric 
        ? <TrendingUp size={14} className="text-red-500" />
        : <TrendingUp size={14} className="text-emerald-500" />;
    }
    return isLossMetric 
      ? <TrendingDown size={14} className="text-emerald-500" />
      : <TrendingDown size={14} className="text-red-500" />;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Week-over-Week Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="text-left py-2 font-medium">Metric</th>
              <th className="text-right py-2 font-medium">Last Week</th>
              <th className="text-right py-2 font-medium">This Week</th>
              <th className="text-right py-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const change = getChange(row.current, row.previous);
              const isLossMetric = row.metric.toLowerCase().includes('loss') || row.metric.toLowerCase().includes('pest');
              return (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-3 font-medium text-gray-700">{row.metric}</td>
                  <td className="py-3 text-right text-gray-500">{row.previous}{row.unit}</td>
                  <td className="py-3 text-right font-semibold">{row.current}{row.unit}</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1">
                      {getTrendIcon(change.trend, isLossMetric)}
                      <span className={change.trend === 'neutral' ? 'text-gray-400' : ''}>{change.value}%</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyComparison;
