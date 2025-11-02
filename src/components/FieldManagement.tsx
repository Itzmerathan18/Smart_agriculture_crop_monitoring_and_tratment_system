import React, { useState } from 'react';
import { Field } from '../types/sensors';

interface FieldManagementProps {
  fields: Field[];
  selectedField: Field | null;
  onFieldSelect: (field: Field) => void;
  onFieldCreate: (field: Omit<Field, 'id'>) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<Field>) => void;
  onFieldDelete: (fieldId: string) => void;
}

export const FieldManagement: React.FC<FieldManagementProps> = ({
  fields,
  selectedField,
  onFieldSelect,
  onFieldCreate,
  onFieldUpdate,
  onFieldDelete,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    crop_type: '',
    boundaries: [] as { latitude: number; longitude: number }[],
  });

  const cropTypes = [
    'Wheat',
    'Corn',
    'Soybeans',
    'Rice',
    'Barley',
    'Tomatoes',
    'Potatoes',
    'Lettuce',
    'Strawberries',
    'Grapes',
    'Other',
  ];

  const handleCreateField = () => {
    if (formData.name && formData.crop_type) {
      onFieldCreate({
        name: formData.name,
        crop_type: formData.crop_type,
        boundaries: formData.boundaries,
        sensors: [],
        health_score: 100,
      });
      setFormData({ name: '', crop_type: '', boundaries: [] });
      setIsCreating(false);
    }
  };

  const handleUpdateField = (fieldId: string) => {
    if (formData.name && formData.crop_type) {
      onFieldUpdate(fieldId, {
        name: formData.name,
        crop_type: formData.crop_type,
        boundaries: formData.boundaries,
      });
      setEditingField(null);
      setFormData({ name: '', crop_type: '', boundaries: [] });
    }
  };

  const startEditing = (field: Field) => {
    setEditingField(field.id);
    setFormData({
      name: field.name,
      crop_type: field.crop_type,
      boundaries: field.boundaries,
    });
    setIsCreating(false);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setIsCreating(false);
    setFormData({ name: '', crop_type: '', boundaries: [] });
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>🚜</span>
          <span>Field Management</span>
        </h2>
        {!isCreating && !editingField && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            + Add New Field
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingField) && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-4">
            {isCreating ? 'Create New Field' : 'Edit Field'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Field A, North Field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop Type
              </label>
              <select
                value={formData.crop_type}
                onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select crop type</option>
                {cropTypes.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={cancelEditing}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => isCreating ? handleCreateField() : handleUpdateField(editingField!)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {isCreating ? 'Create Field' : 'Update Field'}
            </button>
          </div>
        </div>
      )}

      {/* Fields List */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🌾</div>
            <p className="font-medium">No fields configured</p>
            <p className="text-sm">Add your first field to start monitoring</p>
          </div>
        ) : (
          fields.map((field) => (
            <div
              key={field.id}
              className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                selectedField?.id === field.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Field Info */}
                <div
                  className="flex-1"
                  onClick={() => onFieldSelect(field)}
                >
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-900">{field.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${getHealthScoreColor(
                        field.health_score
                      )}`}
                    >
                      {getHealthScoreLabel(field.health_score)} ({field.health_score}%)
                    </span>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span>🌱</span>
                      <span>{field.crop_type}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>📡</span>
                      <span>{field.sensors.length} sensors</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>📍</span>
                      <span>{field.boundaries.length} GPS points</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onFieldSelect(field)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      selectedField?.id === field.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedField?.id === field.id ? 'Selected' : 'Select'}
                  </button>
                  <button
                    onClick={() => startEditing(field)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${field.name}?`)) {
                        onFieldDelete(field.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      field.health_score >= 80
                        ? 'bg-green-500'
                        : field.health_score >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${field.health_score}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {fields.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{fields.length}</div>
              <div className="text-sm text-gray-600">Total Fields</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {fields.reduce((sum, field) => sum + field.sensors.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Sensors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(fields.reduce((sum, field) => sum + field.health_score, 0) / fields.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg Health Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {[...new Set(fields.map(field => field.crop_type))].length}
              </div>
              <div className="text-sm text-gray-600">Crop Types</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};