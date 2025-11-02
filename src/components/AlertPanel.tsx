import React from 'react';
import { SensorAlert } from '../types/sensors';
import { getStatusColor } from '../config/alertThresholds';

interface AlertPanelProps {
  alerts: SensorAlert[];
  onDismissAlert?: (alertIndex: number) => void;
  maxVisible?: number;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  onDismissAlert,
  maxVisible = 5,
}) => {
  const visibleAlerts = alerts.slice(0, maxVisible);
  const hasMoreAlerts = alerts.length > maxVisible;

  const getAlertIcon = (type: SensorAlert['type']) => {
    switch (type) {
      case 'sensor_offline':
        return '📡';
      case 'low_battery':
        return '🔋';
      case 'threshold_breach':
        return '⚠️';
      default:
        return '❗';
    }
  };

  const getAlertColor = (severity: SensorAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <span>🔔</span>
          <span>Alerts & Notifications</span>
        </h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-medium">All systems operational</p>
          <p className="text-sm">No active alerts at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>🔔</span>
          <span>Alerts & Notifications</span>
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </h2>
        {hasMoreAlerts && (
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All ({alerts.length})
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {visibleAlerts.map((alert, index) => (
          <div
            key={index}
            className={`border-l-4 p-4 rounded-r-lg transition-all duration-300 hover:shadow-md ${getAlertColor(
              alert.severity
            )}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-xl mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1">{alert.message}</p>
                  <p className="text-xs opacity-75">{formatTime(alert.timestamp || new Date().toISOString())}</p>
                </div>
              </div>
              {onDismissAlert && (
                <button
                  onClick={() => onDismissAlert(index)}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <span className="text-xl">×</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* More Alerts Indicator */}
      {hasMoreAlerts && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Load {alerts.length - maxVisible} more alerts
          </button>
        </div>
      )}
    </div>
  );
};