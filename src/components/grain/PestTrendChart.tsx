import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PestTrendChartProps {
  data: { date: string; weevils: number; borers: number; beetles: number; moths: number }[];
}

const PestTrendChart: React.FC<PestTrendChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pest Population Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="weevils" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} name="Weevils" />
            <Line type="monotone" dataKey="borers" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Borers" />
            <Line type="monotone" dataKey="beetles" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Beetles" />
            <Line type="monotone" dataKey="moths" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Moths" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PestTrendChart;
