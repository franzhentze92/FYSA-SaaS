import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title, value, subtitle, icon, trend, trendValue, variant = 'default'
}) => {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    danger: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    success: 'bg-emerald-50 border-emerald-200'
  };

  const iconBgStyles = {
    default: 'bg-slate-100 text-slate-600',
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-600',
    success: 'bg-emerald-100 text-emerald-600'
  };

  const trendColors = {
    up: 'text-red-600',
    down: 'text-emerald-600',
    neutral: 'text-gray-500'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${iconBgStyles[variant]}`}>
          {icon}
        </div>
      </div>
      {trend && trendValue && (
        <div className={`mt-3 flex items-center gap-1 text-sm ${trendColors[trend]}`}>
          <TrendIcon size={14} />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
