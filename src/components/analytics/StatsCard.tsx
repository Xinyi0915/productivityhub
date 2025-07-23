import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  icon?: string;
  color?: string;
  iconColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'bg-white',
  iconColor = 'text-primary-600',
}) => {
  return (
    <div className={`${color} rounded-lg shadow-sm p-6`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {icon && <span className={`text-2xl ${iconColor}`}>{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-primary-600">{value}</p>
      <div className="mt-1 flex items-center space-x-2">
        <p className="text-sm text-gray-600">{subtitle}</p>
        {trend && (
          <div
            className={`flex items-center text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span className="mr-1">
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-gray-500">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard; 