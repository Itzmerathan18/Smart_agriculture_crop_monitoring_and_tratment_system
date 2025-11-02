import React, { useState } from 'react';
import { HistoricalData } from '../types/sensors';
import { HistoricalChart } from './HistoricalChart';

interface ChartsContainerProps {
  historicalData: HistoricalData;
  timeRange: '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '24h' | '7d' | '30d') => void;
}

export const ChartsContainer: React.FC<ChartsContainerProps> = ({
  historicalData,
  timeRange,
  onTimeRangeChange,
}) => {
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  const chartConfigs = [
    {
      key: 'soil_moisture',
      title: 'Soil Moisture Trends',
      unit: '%',
      icon: '💧',
      color: '#3B82F6',
    },
    {
      key: 'ph_level',
      title: 'pH Level Trends',
      unit: 'pH',
      icon: '🧪',
      color: '#10B981',
    },
    {
      key: 'microbial_activity',
      title: 'Microbial Activity Trends',
      unit: 'CFU/ml',
      icon: '🦠',
      color: '#F59E0B',
    },
    {
      key: 'humidity',
      title: 'Humidity Trends',
      unit: '%',
      icon: '💨',
      color: '#8B5CF6',
    },
  ];

  const getChartData = (sensorId: string, metric: string) => {
    const sensorData = historicalData[sensorId];
    if (!sensorData || !sensorData[metric]) {
      return [];
    }
    return sensorData[metric];
  };

  // Get the first available sensor ID for charts
  const firstSensorId = Object.keys(historicalData)[0];

  if (!firstSensorId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historical Data</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p className="font-medium">No historical data available</p>
          <p className="text-sm">Data will appear here once sensors start reporting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span>📊</span>
            <span>Historical Data Analysis</span>
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Sensor: {firstSensorId}
            </span>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => onTimeRangeChange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartConfigs.map((config) => {
          const chartData = getChartData(firstSensorId, config.key);
          const isExpanded = expandedChart === config.key;

          return (
            <div
              key={config.key}
              className={`${isExpanded ? 'lg:col-span-2' : ''} transition-all duration-300`}
            >
              <HistoricalChart
                title={config.title}
                data={chartData}
                metric={config.key}
                unit={config.unit}
                icon={config.icon}
                color={config.color}
                height={isExpanded ? 300 : 200}
                timeRange={timeRange}
                onTimeRangeChange={onTimeRangeChange}
              />

              {/* Expand/Collapse Button */}
              <div className="mt-2 text-center">
                <button
                  onClick={() => setExpandedChart(isExpanded ? null : config.key)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isExpanded ? 'Collapse' : 'Expand'} Chart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chartConfigs.map((config) => {
            const chartData = getChartData(firstSensorId, config.key);
            if (chartData.length === 0) return null;

            const latest = chartData[chartData.length - 1];
            const min = Math.min(...chartData.map(d => d.value));
            const max = Math.max(...chartData.map(d => d.value));
            const avg = chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length;

            return (
              <div key={config.key} className="border-l-4 pl-4" style={{ borderLeftColor: config.color }}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{config.icon}</span>
                  <span className="font-medium text-gray-900">{config.title}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latest:</span>
                    <span className="font-medium">{latest.value.toFixed(1)} {config.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Range:</span>
                    <span className="font-medium">{min.toFixed(1)} - {max.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average:</span>
                    <span className="font-medium">{avg.toFixed(1)} {config.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};