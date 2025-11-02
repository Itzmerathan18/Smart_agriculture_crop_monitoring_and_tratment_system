import React from 'react';
import { Field } from '../types/sensors';

interface DashboardHeaderProps {
  selectedField: Field | null;
  fields: Field[];
  onFieldChange: (fieldId: string) => void;
  userName?: string;
  lastRefresh?: Date;
  isRefreshing?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedField,
  fields,
  onFieldChange,
  userName = 'Farmer',
  lastRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and App Name */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌾</span>
              <h1 className="text-xl font-bold text-gray-900">AgriSense</h1>
            </div>
            <span className="text-sm text-gray-500 hidden sm:inline">Smart Agriculture Dashboard</span>
          </div>

          {/* Field Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="field-select" className="text-sm font-medium text-gray-700">
                Field:
              </label>
              <select
                id="field-select"
                value={selectedField?.id || ''}
                onChange={(e) => onFieldChange(e.target.value)}
                className="block w-40 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Health Score */}
            {selectedField && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-600">Health:</span>
                <span
                  className={`text-sm font-medium ${
                    selectedField.health_score >= 80
                      ? 'text-green-600'
                      : selectedField.health_score >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {selectedField.health_score}%
                </span>
              </div>
            )}

            {/* Last Refresh */}
            <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500">
              {isRefreshing ? (
                <div className="flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                  <span>Refreshing...</span>
                </div>
              ) : (
                <>
                  <span>Last refresh:</span>
                  <span>{lastRefresh?.toLocaleTimeString() || 'Never'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Bar with Field Info */}
        {selectedField && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-600">Crop:</span>
                  <span className="font-medium text-gray-900">{selectedField.crop_type}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-600">Sensors:</span>
                  <span className="font-medium text-gray-900">{selectedField.sensors.length}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Welcome back, {userName}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};