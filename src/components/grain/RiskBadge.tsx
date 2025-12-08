import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level, showIcon = true, size = 'md' }) => {
  const config = {
    low: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      icon: CheckCircle,
      label: 'Low Risk'
    },
    medium: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-300',
      icon: AlertCircle,
      label: 'Medium Risk'
    },
    high: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
      icon: AlertTriangle,
      label: 'High Risk'
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const iconSizes = { sm: 12, md: 14, lg: 16 };
  const { bg, text, border, icon: Icon, label } = config[level];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${text} ${border} ${sizeClasses[size]} font-medium`}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {label}
    </span>
  );
};

export default RiskBadge;
