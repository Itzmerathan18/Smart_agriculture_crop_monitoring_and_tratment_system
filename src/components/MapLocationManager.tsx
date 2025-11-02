import React, { useState, useRef, useEffect } from 'react';
import { Field, SensorReading } from '../types/sensors';

interface MapLocationManagerProps {
  fields: Field[];
  sensors: SensorReading[];
  selectedField: Field | null;
  onFieldSelect: (field: Field) => void;
  onSensorSelect?: (sensor: SensorReading) => void;
  onLocationUpdate?: (fieldId: string, coordinates: { latitude: number; longitude: number }) => void;
}

interface MapMarker {
  id: string;
  type: 'field' | 'sensor';
  name: string;
  latitude: number;
  longitude: number;
  status?: 'optimal' | 'warning' | 'critical';
  data?: any;
}

export const MapLocationManager: React.FC<MapLocationManagerProps> = ({
  fields,
  sensors,
  selectedField,
  onFieldSelect,
  onSensorSelect,
  onLocationUpdate,
}) => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.0060 });
  const [zoom, setZoom] = useState(13);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapMode, setMapMode] = useState<'view' | 'edit' | 'add'>('view');
  const mapRef = useRef<HTMLDivElement>(null);

  // Update markers when fields or sensors change
  useEffect(() => {
    const newMarkers: MapMarker[] = [];

    // Add field markers
    fields.forEach(field => {
      if (field.boundaries && field.boundaries.length > 0) {
        // Use center of field boundaries
        const centerLat = field.boundaries.reduce((sum, point) => sum + point.latitude, 0) / field.boundaries.length;
        const centerLng = field.boundaries.reduce((sum, point) => sum + point.longitude, 0) / field.boundaries.length;

        newMarkers.push({
          id: field.id,
          type: 'field',
          name: field.name,
          latitude: centerLat,
          longitude: centerLng,
          status: field.health_score >= 80 ? 'optimal' : field.health_score >= 60 ? 'warning' : 'critical',
          data: field,
        });
      }
    });

    // Add sensor markers
    sensors.forEach(sensor => {
      newMarkers.push({
        id: sensor.sensor_id,
        type: 'sensor',
        name: `Sensor ${sensor.sensor_id}`,
        latitude: sensor.location.latitude,
        longitude: sensor.location.longitude,
        status: sensor.signal_strength > 50 ? 'optimal' : sensor.signal_strength > 20 ? 'warning' : 'critical',
        data: sensor,
      });
    });

    setMarkers(newMarkers);
  }, [fields, sensors]);

  // Center map on selected field
  useEffect(() => {
    if (selectedField && selectedField.boundaries.length > 0) {
      const centerLat = selectedField.boundaries.reduce((sum, point) => sum + point.latitude, 0) / selectedField.boundaries.length;
      const centerLng = selectedField.boundaries.reduce((sum, point) => sum + point.longitude, 0) / selectedField.boundaries.length;
      setMapCenter({ lat: centerLat, lng: centerLng });
      setZoom(15);
    }
  }, [selectedField]);

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (mapMode === 'add' && isAddingLocation) {
      const rect = mapRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert pixel coordinates to lat/lng (simplified calculation)
      const lat = mapCenter.lat + ((rect.height / 2 - y) / rect.height) * (0.01 / zoom);
      const lng = mapCenter.lng + ((x - rect.width / 2) / rect.width) * (0.01 / zoom);

      if (onLocationUpdate && selectedField) {
        onLocationUpdate(selectedField.id, { latitude: lat, longitude: lng });
      }

      setIsAddingLocation(false);
      setMapMode('view');
    }
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);

    if (marker.type === 'field') {
      onFieldSelect(marker.data as Field);
    } else if (marker.type === 'sensor' && onSensorSelect) {
      onSensorSelect(marker.data as SensorReading);
    }
  };

  const getMarkerIcon = (marker: MapMarker) => {
    if (marker.type === 'field') {
      const statusColor = marker.status === 'optimal' ? '🟩' : marker.status === 'warning' ? '🟨' : '🟥';
      return `🚜${statusColor}`;
    } else {
      const statusColor = marker.status === 'optimal' ? '🟢' : marker.status === 'warning' ? '🟡' : '🔴';
      return `📡${statusColor}`;
    }
  };

  const getMarkerPosition = (marker: MapMarker) => {
    const scale = zoom * 100;
    const x = (marker.longitude - mapCenter.lng) * scale + 50; // % from left
    const y = 50 - (marker.latitude - mapCenter.lat) * scale; // % from top

    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>🗺️</span>
          <span>Location Management</span>
        </h2>

        {/* Map Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setMapMode('view')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                mapMode === 'view' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              View
            </button>
            <button
              onClick={() => setMapMode('edit')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                mapMode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Edit
            </button>
            {selectedField && (
              <button
                onClick={() => {
                  setMapMode('add');
                  setIsAddingLocation(true);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  mapMode === 'add' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Add Point
              </button>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoom(Math.min(20, zoom + 1))}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
            >
              +
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {zoom}x
            </span>
            <button
              onClick={() => setZoom(Math.max(1, zoom - 1))}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div
            ref={mapRef}
            className={`relative bg-gray-100 rounded-lg overflow-hidden border-2 ${
              isAddingLocation ? 'border-blue-500 cursor-crosshair' : 'border-gray-300'
            }`}
            style={{ height: '500px' }}
            onClick={handleMapClick}
          >
            {/* Simple Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50">
              {/* Grid lines for visual reference */}
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Markers */}
            {markers.map((marker) => {
              const position = getMarkerPosition(marker);
              const isSelected = selectedMarker?.id === marker.id;

              return (
                <div
                  key={marker.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                    isSelected ? 'z-10 scale-125' : 'hover:scale-110'
                  }`}
                  style={{
                    left: position.x,
                    top: position.y,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkerClick(marker);
                  }}
                >
                  <div className="relative">
                    <div className="text-2xl">
                      {getMarkerIcon(marker)}
                    </div>
                    {isSelected && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                        {marker.name}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Field Boundaries */}
            {selectedField && selectedField.boundaries.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={selectedField.boundaries.map(boundary => {
                    const position = getMarkerPosition({
                      id: 'temp',
                      type: 'field',
                      name: 'temp',
                      latitude: boundary.latitude,
                      longitude: boundary.longitude,
                    });
                    return `${position.x},${position.y}`;
                  }).join(' ')}
                  fill="rgba(34, 197, 94, 0.2)"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            )}

            {/* Instructions */}
            {isAddingLocation && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-md text-sm">
                📍 Click on the map to add a new location point
              </div>
            )}

            {/* Map Info */}
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-md px-3 py-2 text-xs text-gray-600">
              <div>Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}</div>
              <div>Markers: {markers.length} ({markers.filter(m => m.type === 'field').length} fields, {markers.filter(m => m.type === 'sensor').length} sensors)</div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Marker Info */}
          {selectedMarker && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedMarker.type === 'field' ? '🚜 Field' : '📡 Sensor'}: {selectedMarker.name}
              </h3>

              {selectedMarker.type === 'field' ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Crop Type:</span>
                    <span className="font-medium">{selectedMarker.data.crop_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Score:</span>
                    <span className={`font-medium ${
                      selectedMarker.data.health_score >= 80 ? 'text-green-600' :
                      selectedMarker.data.health_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedMarker.data.health_score}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sensors:</span>
                    <span className="font-medium">{selectedMarker.data.sensors.length}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Signal:</span>
                    <span className="font-medium">{selectedMarker.data.signal_strength.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Battery:</span>
                    <span className="font-medium">{selectedMarker.data.battery_level.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="font-medium">
                      {new Date(selectedMarker.data.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-600">
                <div>📍 {selectedMarker.latitude.toFixed(6)}, {selectedMarker.longitude.toFixed(6)}</div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🚜🟩</span>
                <span>Field (Optimal)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🚜🟨</span>
                <span>Field (Warning)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🚜🟥</span>
                <span>Field (Critical)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">📡🟢</span>
                <span>Sensor (Good Signal)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">📡🟡</span>
                <span>Sensor (Fair Signal)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">📡🔴</span>
                <span>Sensor (Poor Signal)</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Center on all markers
                  if (markers.length > 0) {
                    const avgLat = markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length;
                    const avgLng = markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length;
                    setMapCenter({ lat: avgLat, lng: avgLng });
                    setZoom(12);
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-left"
              >
                🗺️ Fit All Markers
              </button>
              {selectedField && (
                <button
                  onClick={() => {
                    const centerLat = selectedField.boundaries.reduce((sum, point) => sum + point.latitude, 0) / selectedField.boundaries.length;
                    const centerLng = selectedField.boundaries.reduce((sum, point) => sum + point.longitude, 0) / selectedField.boundaries.length;
                    setMapCenter({ lat: centerLat, lng: centerLng });
                    setZoom(16);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-left"
                >
                  🎯 Center on Field
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions for Edit Mode */}
      {mapMode === 'edit' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">Edit Mode Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click on markers to select and view details</li>
            <li>• Use "Add Point" mode to add new GPS coordinates to selected field</li>
            <li>• Zoom controls allow you to navigate the map</li>
            <li>• Field boundaries are shown as dashed green polygons</li>
          </ul>
        </div>
      )}
    </div>
  );
};