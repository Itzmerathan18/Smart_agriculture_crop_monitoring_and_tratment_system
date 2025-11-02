import React from 'react';
import { SensorReading } from '../types/sensors';
import { getSensorStatus, getStatusColor, getStatusIcon } from '../config/alertThresholds';

interface SensorMetricCardProps {
  title: string;
  value: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  icon: string;
  lastUpdated?: string;
  threshold?: {
    optimal_min: number;
    optimal_max: number;
  };
}

export const SensorMetricCard: React.FC<SensorMetricCardProps> = ({
  title,
  value,
  unit,
  status,
  trend,
  icon,
  lastUpdated,
  threshold,
}) => {
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'stable':
        return '→';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '#10B981'; // Green
      case 'down':
        return '#EF4444'; // Red
      case 'stable':
        return '#6B7280'; // Gray
      default:
        return '#6B7280'; // Gray
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 border-l-4 transition-all duration-300 hover:shadow-lg"
      style={{ borderLeftColor: statusColor }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className="text-sm font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor
            }}
          >
            {statusIcon} {status.toUpperCase()}
          </span>
          {trend && (
            <span
              className="text-lg font-medium"
              style={{ color: getTrendColor(trend) }}
            >
              {getTrendIcon(trend)}
            </span>
          )}
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="text-lg text-gray-600">{unit}</span>
        </div>
      </div>

      {/* Threshold Indicator */}
      {threshold && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">
            Optimal: {threshold.optimal_min} - {threshold.optimal_max} {unit}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, (value / threshold.optimal_max) * 100))}%`,
                backgroundColor: statusColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {lastUpdated && (
          <span>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
        )}
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
      </div>
    </div>
  );
};

interface SensorMetricsGridProps {
  sensorReading: SensorReading;
  thresholds: any;
}

export const SensorMetricsGrid: React.FC<SensorMetricsGridProps> = ({
  sensorReading,
  thresholds,
}) => {
  const metrics = [
    {
      title: 'Soil Moisture',
      value: sensorReading.sensors.soil_moisture,
      unit: '%',
      icon: '💧',
      threshold: thresholds.soil_moisture,
    },
    {
      title: 'pH Level',
      value: sensorReading.sensors.ph_level,
      unit: 'pH',
      icon: '🧪',
      threshold: thresholds.ph_level,
    },
    {
      title: 'Microbial Activity',
      value: sensorReading.sensors.microbial_activity,
      unit: 'CFU/ml',
      icon: '🦠',
      threshold: thresholds.microbial_activity,
    },
    {
      title: 'Humidity',
      value: sensorReading.sensors.humidity,
      unit: '%',
      icon: '💨',
      threshold: { optimal_min: 40, optimal_max: 70 },
    },
    {
      title: 'Signal Strength',
      value: sensorReading.signal_strength,
      unit: '%',
      icon: '📡',
      threshold: thresholds.esp32_signal,
    },
    {
      title: 'Battery Level',
      value: sensorReading.battery_level,
      unit: '%',
      icon: '🔋',
      threshold: thresholds.battery_level,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <SensorMetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          unit={metric.unit}
          status={getSensorStatus(metric.value, metric.threshold)}
          icon={metric.icon}
          lastUpdated={sensorReading.timestamp}
          threshold={metric.threshold}
        />
      ))}
    </div>
  );
};