import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { SensorMetricsGrid } from './SensorMetricCard';
import { AlertPanel } from './AlertPanel';
import { ChartsContainer } from './ChartsContainer';
import { FieldManagement } from './FieldManagement';
import { MapLocationManager } from './MapLocationManager';
import { DataExport } from './DataExport';
import { NotificationSettings } from './NotificationSettings';
import { Field, SensorReading, HistoricalData } from '../types/sensors';

type ViewMode = 'dashboard' | 'fields' | 'charts' | 'map' | 'exports' | 'settings';

interface ResponsiveDashboardProps {
  fields: Field[];
  selectedField: Field | null;
  sensors: SensorReading[];
  historicalData: HistoricalData;
  alerts: any[];
  onFieldSelect: (field: Field) => void;
  onFieldCreate: (field: any) => void;
  onFieldUpdate: (fieldId: string, updates: any) => void;
  onFieldDelete: (fieldId: string) => void;
  onTimeRangeChange: (range: '24h' | '7d' | '30d') => void;
  timeRange: '24h' | '7d' | '30d';
  thresholds: any;
}

export const ResponsiveDashboard: React.FC<ResponsiveDashboardProps> = ({
  fields,
  selectedField,
  sensors,
  historicalData,
  alerts,
  onFieldSelect,
  onFieldCreate,
  onFieldUpdate,
  onFieldDelete,
  onTimeRangeChange,
  timeRange,
  thresholds,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentSensorReading = sensors.find(s => s.field_id === selectedField?.id) || sensors[0];

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', mobileLabel: '📊' },
    { id: 'fields', label: 'Fields', icon: '🚜', mobileLabel: '🚜' },
    { id: 'charts', label: 'Analytics', icon: '📈', mobileLabel: '📈' },
    { id: 'map', label: 'Map', icon: '🗺️', mobileLabel: '🗺️' },
    { id: 'exports', label: 'Exports', icon: '📥', mobileLabel: '📥' },
    { id: 'settings', label: 'Settings', icon: '⚙️', mobileLabel: '⚙️' },
  ];

  const renderContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Sensor Metrics Grid */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-time Sensor Data</h2>
              {currentSensorReading ? (
                <SensorMetricsGrid
                  sensorReading={currentSensorReading}
                  thresholds={thresholds}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                  <div className="text-4xl mb-2">📡</div>
                  <p>No sensor data available</p>
                </div>
              )}
            </div>

            {/* Alerts Panel */}
            <AlertPanel
              alerts={alerts}
              maxVisible={isMobile ? 3 : 5}
              onDismissAlert={(index) => console.log('Dismiss alert:', index)}
            />

            {/* Quick Charts Preview */}
            {!isMobile && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{fields.length}</div>
                    <div className="text-sm text-gray-600">Active Fields</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{sensors.length}</div>
                    <div className="text-sm text-gray-600">Sensors Online</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{alerts.length}</div>
                    <div className="text-sm text-gray-600">Active Alerts</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedField ? selectedField.health_score : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Field Health</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'fields':
        return (
          <FieldManagement
            fields={fields}
            selectedField={selectedField}
            onFieldSelect={onFieldSelect}
            onFieldCreate={onFieldCreate}
            onFieldUpdate={onFieldUpdate}
            onFieldDelete={onFieldDelete}
          />
        );

      case 'charts':
        return (
          <ChartsContainer
            historicalData={historicalData}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
          />
        );

      case 'map':
        return (
          <MapLocationManager
            fields={fields}
            sensors={sensors}
            selectedField={selectedField}
            onFieldSelect={onFieldSelect}
          />
        );

      case 'exports':
        return (
          <DataExport
            historicalData={historicalData}
            fields={fields}
            onExport={async (request) => {
              console.log('Export request:', request);
              // Implement export functionality
            }}
          />
        );

      case 'settings':
        return (
          <NotificationSettings
            settings={{
              email_enabled: true,
              sms_enabled: false,
              push_enabled: true,
              email_address: 'farmer@agrisense.com',
              alert_types: {
                critical: true,
                high: true,
                medium: true,
                low: false,
              },
              quiet_hours: {
                enabled: false,
                start: '22:00',
                end: '06:00',
              },
            }}
            onSettingsChange={(settings) => console.log('Settings changed:', settings)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader
        selectedField={selectedField}
        fields={fields}
        onFieldChange={(fieldId) => {
          const field = fields.find(f => f.id === fieldId);
          if (field) onFieldSelect(field);
        }}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
      />

      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <div className={`
          ${isMobile ? 'fixed left-0 top-0 h-full z-50 transform transition-transform duration-300' : 'relative'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'w-64' : 'w-20 lg:w-64'}
          bg-white shadow-lg min-h-screen
        `}>
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">AgriSense</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setViewMode(item.id as ViewMode);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center ${isMobile ? 'space-x-3' : 'justify-center lg:justify-start lg:space-x-3'}
                      px-3 py-2 rounded-lg transition-colors
                      ${viewMode === item.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="text-xl">{isMobile ? item.icon : item.mobileLabel}</span>
                    {!isMobile && (
                      <span className="hidden lg:block font-medium">{item.label}</span>
                    )}
                    {isMobile && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="text-center">
              <div className={`text-xs text-gray-500 ${isMobile ? 'block' : 'hidden lg:block'}`}>
                AgriSense v1.0
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {fields.length} fields, {sensors.length} sensors
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Navigation Bar */}
          {isMobile && (
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  ☰
                </button>
                <h1 className="text-lg font-semibold text-gray-900">
                  {navigationItems.find(item => item.id === viewMode)?.label || 'Dashboard'}
                </h1>
                <div className="w-8" /> {/* Spacer for centering */}
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className={`p-4 ${isMobile ? '' : 'p-6'}`}>
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === viewMode)?.label || 'Dashboard'}
              </h1>
              {!isMobile && (
                <p className="text-gray-600 mt-1">
                  {viewMode === 'dashboard' && 'Real-time monitoring and alerts'}
                  {viewMode === 'fields' && 'Manage your agricultural fields'}
                  {viewMode === 'charts' && 'Historical data and trends'}
                  {viewMode === 'map' && 'Geographic view of sensors and fields'}
                  {viewMode === 'exports' && 'Export data and generate reports'}
                  {viewMode === 'settings' && 'Notification preferences and alerts'}
                </p>
              )}
            </div>

            {/* Content Area */}
            <div className={isMobile ? '' : 'max-w-7xl mx-auto'}>
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Responsive Design Classes */}
      <style jsx>{`
        @media (max-width: 640px) {
          .sensor-metrics-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .sensor-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1025px) {
          .sensor-metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};