import React from 'react';
import { ChartDataPoint } from '../types/sensors';

interface HistoricalChartProps {
  title: string;
  data: ChartDataPoint[];
  metric: string;
  unit: string;
  icon: string;
  color: string;
  height?: number;
  showGrid?: boolean;
  timeRange?: '24h' | '7d' | '30d';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d') => void;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  title,
  data,
  metric,
  unit,
  icon,
  color,
  height = 200,
  showGrid = true,
  timeRange = '24h',
  onTimeRangeChange,
}) => {
  // Simple SVG chart implementation (can be replaced with Chart.js or Recharts)
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;

  const width = 600;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatLabel = (timestamp: string, index: number) => {
    const totalPoints = data.length;
    if (timeRange === '24h') {
      return index % Math.ceil(totalPoints / 6) === 0 ? formatTime(timestamp) : '';
    } else if (timeRange === '7d') {
      return index % Math.ceil(totalPoints / 7) === 0 ? formatDate(timestamp) : '';
    } else {
      return index % Math.ceil(totalPoints / 8) === 0 ? formatDate(timestamp) : '';
    }
  };

  const getX = (index: number) => {
    return padding + (index / Math.max(1, data.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
  };

  // Create path for line chart
  const pathData = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.value);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Add threshold lines if data has status
  const getThresholdLines = () => {
    const thresholdValues = data
      .filter(d => d.status)
      .map(d => ({ value: d.value, status: d.status! }));

    return thresholdValues.map((threshold, index) => {
      const y = getY(threshold.value);
      return (
        <line
          key={index}
          x1={padding}
          y1={y}
          x2={width - padding}
          y2={y}
          stroke={threshold.status === 'critical' ? '#EF4444' : threshold.status === 'warning' ? '#F59E0B' : '#10B981'}
          strokeDasharray={threshold.status === 'critical' ? '0' : threshold.status === 'warning' ? '5,5' : '3,3'}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Time Range Selector */}
        {onTimeRangeChange && (
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
                {range}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="w-full h-auto">
          {/* Grid */}
          {showGrid && (
            <g className="text-gray-300">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                <line
                  key={fraction}
                  x1={padding}
                  y1={padding + fraction * chartHeight}
                  x2={width - padding}
                  y2={padding + fraction * chartHeight}
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              ))}

              {/* Vertical grid lines */}
              {data.map((_, index) => {
                if (index % Math.ceil(data.length / 6) !== 0) return null;
                const x = getX(index);
                return (
                  <line
                    key={index}
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={height - padding}
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                );
              })}
            </g>
          )}

          {/* Threshold lines */}
          {getThresholdLines()}

          {/* Data line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => (
            <circle
              key={index}
              cx={getX(index)}
              cy={getY(point.value)}
              r="3"
              fill={color}
              className="hover:r-4 cursor-pointer transition-all"
            >
              <title>
                {`${metric}: ${point.value.toFixed(1)} ${unit}\n${new Date(point.timestamp).toLocaleString()}`}
              </title>
            </circle>
          ))}

          {/* Y-axis labels */}
          <g className="text-xs text-gray-600">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const value = minValue + fraction * valueRange;
              const y = padding + (1 - fraction) * chartHeight;
              return (
                <text
                  key={fraction}
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {value.toFixed(1)}
                </text>
              );
            })}
            <text x={padding - 10} y={padding + 12} textAnchor="end" dominantBaseline="middle">
              {unit}
            </text>
          </g>

          {/* X-axis labels */}
          <g className="text-xs text-gray-600">
            {data.map((point, index) => {
              const label = formatLabel(point.timestamp, index);
              if (!label) return null;
              const x = getX(index);
              return (
                <text
                  key={index}
                  x={x}
                  y={height - padding + 20}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                >
                  {label}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Summary Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-gray-600">Min</div>
          <div className="font-semibold text-gray-900">
            {minValue.toFixed(1)} {unit}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-600">Average</div>
          <div className="font-semibold text-gray-900">
            {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(1)} {unit}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-600">Max</div>
          <div className="font-semibold text-gray-900">
            {maxValue.toFixed(1)} {unit}
          </div>
        </div>
      </div>
    </div>
  );
};