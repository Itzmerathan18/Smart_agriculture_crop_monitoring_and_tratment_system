import React, { useState } from 'react';
import { ExportRequest, HistoricalData } from '../types/sensors';

interface DataExportProps {
  historicalData: HistoricalData;
  fields: { id: string; name: string }[];
  onExport: (request: ExportRequest) => Promise<void>;
}

export const DataExport: React.FC<DataExportProps> = ({
  historicalData,
  fields,
  onExport,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [formData, setFormData] = useState({
    field_id: '',
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    end_date: new Date().toISOString().split('T')[0], // today
    format: 'csv' as 'csv' | 'pdf' | 'json',
    metrics: ['soil_moisture', 'ph_level', 'microbial_activity', 'humidity'],
  });

  const availableMetrics = [
    { key: 'soil_moisture', label: 'Soil Moisture', unit: '%' },
    { key: 'ph_level', label: 'pH Level', unit: 'pH' },
    { key: 'microbial_activity', label: 'Microbial Activity', unit: 'CFU/ml' },
    { key: 'humidity', label: 'Humidity', unit: '%' },
    { key: 'signal_strength', label: 'Signal Strength', unit: '%' },
    { key: 'battery_level', label: 'Battery Level', unit: '%' },
  ];

  const handleMetricToggle = (metric: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  const handleExport = async () => {
    if (formData.metrics.length === 0) {
      alert('Please select at least one metric to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const request: ExportRequest = {
        field_id: formData.field_id || undefined,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date + 'T23:59:59').toISOString(),
        format: formData.format,
        metrics: formData.metrics,
      };

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onExport(request);

      clearInterval(progressInterval);
      setExportProgress(100);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
      alert('Export failed. Please try again.');
    }
  };

  const generateQuickReport = async () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const request: ExportRequest = {
      start_date: lastWeek.toISOString(),
      end_date: today.toISOString(),
      format: 'pdf',
      metrics: ['soil_moisture', 'ph_level', 'microbial_activity', 'humidity'],
    };

    setIsExporting(true);
    try {
      await onExport(request);
    } catch (error) {
      console.error('Quick report failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>📊</span>
          <span>Data Export & Reports</span>
        </h2>
        <button
          onClick={generateQuickReport}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          📄 Quick Weekly Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Form */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Custom Export</h3>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                max={formData.end_date}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field (Optional)
            </label>
            <select
              value={formData.field_id}
              onChange={(e) => setFormData({ ...formData, field_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Fields</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['csv', 'pdf', 'json'] as const).map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => setFormData({ ...formData, format })}
                  className={`px-3 py-2 rounded-md border transition-colors ${
                    formData.format === format
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metrics to Export
            </label>
            <div className="space-y-2">
              {availableMetrics.map((metric) => (
                <label key={metric.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.metrics.includes(metric.key)}
                    onChange={() => handleMetricToggle(metric.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {metric.label} ({metric.unit})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || formData.metrics.length === 0}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting... ({exportProgress}%)</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Export Data</span>
              </>
            )}
          </button>

          {/* Progress Bar */}
          {isExporting && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          {/* Quick Reports */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Quick Reports</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({
                  ...formData,
                  start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end_date: new Date().toISOString().split('T')[0],
                  format: 'pdf',
                })}
                className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
              >
                <div className="font-medium text-gray-900">Daily Summary</div>
                <div className="text-sm text-gray-600">Last 24 hours</div>
              </button>
              <button
                onClick={() => setFormData({
                  ...formData,
                  start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end_date: new Date().toISOString().split('T')[0],
                  format: 'pdf',
                })}
                className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
              >
                <div className="font-medium text-gray-900">Weekly Report</div>
                <div className="text-sm text-gray-600">Last 7 days</div>
              </button>
              <button
                onClick={() => setFormData({
                  ...formData,
                  start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end_date: new Date().toISOString().split('T')[0],
                  format: 'pdf',
                })}
                className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
              >
                <div className="font-medium text-gray-900">Monthly Report</div>
                <div className="text-sm text-gray-600">Last 30 days</div>
              </button>
              <button
                onClick={() => setFormData({
                  ...formData,
                  start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                  end_date: new Date().toISOString().split('T')[0],
                  format: 'pdf',
                })}
                className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
              >
                <div className="font-medium text-gray-900">Yearly Report</div>
                <div className="text-sm text-gray-600">Year to date</div>
              </button>
            </div>
          </div>

          {/* Format Information */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Format Information</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-900 mb-1">CSV</div>
                <div className="text-sm text-gray-600">
                  Raw data in spreadsheet format. Best for data analysis in Excel or Google Sheets.
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-900 mb-1">PDF</div>
                <div className="text-sm text-gray-600">
                  Formatted report with charts and summary statistics. Best for presentations and sharing.
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-900 mb-1">JSON</div>
                <div className="text-sm text-gray-600">
                  Machine-readable data format. Best for integration with other applications.
                </div>
              </div>
            </div>
          </div>

          {/* Export History */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Recent Exports</h3>
            <div className="text-center py-4 text-gray-500">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-sm">No recent exports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};