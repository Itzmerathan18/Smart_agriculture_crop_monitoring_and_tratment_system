import React, { useState, useEffect } from 'react';
import { ResponsiveDashboard } from './components/ResponsiveDashboard';
import { AlertService } from './services/alertService';
import { ESP32Service } from './services/esp32Service';
import { Field, SensorReading, HistoricalData, SensorAlert } from './types/sensors';
import { DEFAULT_ALERT_THRESHOLDS } from './config/alertThresholds';

// Mock data for testing
const mockFields: Field[] = [
  {
    id: 'field_001',
    name: 'North Field',
    crop_type: 'Corn',
    boundaries: [
      { latitude: 40.7128, longitude: -74.0060 },
      { latitude: 40.7130, longitude: -74.0060 },
      { latitude: 40.7130, longitude: -74.0058 },
      { latitude: 40.7128, longitude: -74.0058 },
    ],
    sensors: ['esp32_001_sensor_1', 'esp32_001_sensor_2'],
    health_score: 85,
  },
  {
    id: 'field_002',
    name: 'South Field',
    crop_type: 'Wheat',
    boundaries: [
      { latitude: 40.7115, longitude: -74.0070 },
      { latitude: 40.7117, longitude: -74.0070 },
      { latitude: 40.7117, longitude: -74.0068 },
      { latitude: 40.7115, longitude: -74.0068 },
    ],
    sensors: ['esp32_002_sensor_1'],
    health_score: 92,
  },
];

const generateMockSensorData = (): SensorReading[] => {
  const sensors = ['esp32_001_sensor_1', 'esp32_001_sensor_2', 'esp32_002_sensor_1'];
  const readings: SensorReading[] = [];

  sensors.forEach((sensorId, index) => {
    const fieldId = index < 2 ? 'field_001' : 'field_002';
    const baseLatitude = 40.7128 + (index * 0.002);
    const baseLongitude = -74.0060 + (index * 0.001);

    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(Date.now() - (i * 15 * 60 * 1000)).toISOString(); // Every 15 minutes

      const soilMoisture = 30 + Math.random() * 40;
      const phLevel = 6.0 + Math.random() * 2.0;
      const microbialActivity = 10000 + Math.random() * 40000;
      const humidity = 40 + Math.random() * 30;

      const reading: SensorReading = {
        sensor_id: sensorId,
        esp32_id: sensorId.split('_')[0] + '_' + sensorId.split('_')[1],
        field_id: fieldId,
        timestamp,
        signal_strength: 40 + Math.random() * 60,
        battery_level: 20 + Math.random() * 80,
        sensors: {
          soil_moisture: soilMoisture,
          ph_level: phLevel,
          microbial_activity: microbialActivity,
          humidity: humidity,
          data_transfer_quality: Math.random() > 0.2 ? 'excellent' : Math.random() > 0.5 ? 'good' : 'poor',
        },
        location: {
          latitude: baseLatitude + (Math.random() - 0.5) * 0.001,
          longitude: baseLongitude + (Math.random() - 0.5) * 0.001,
        },
        alerts: [],
      };

      // Generate alerts based on conditions
      if (reading.battery_level < 15) {
        reading.alerts.push({
          type: 'low_battery',
          message: `Low battery: ${reading.battery_level.toFixed(1)}%`,
          severity: reading.battery_level < 5 ? 'critical' : 'medium',
          timestamp: reading.timestamp,
        });
      }

      if (reading.signal_strength < 20) {
        reading.alerts.push({
          type: 'sensor_offline',
          message: `Poor signal: ${reading.signal_strength.toFixed(1)}%`,
          severity: 'high',
          timestamp: reading.timestamp,
        });
      }

      if (soilMoisture < 25) {
        reading.alerts.push({
          type: 'threshold_breach',
          message: `Critical soil moisture: ${soilMoisture.toFixed(1)}%`,
          severity: 'critical',
          timestamp: reading.timestamp,
        });
      } else if (soilMoisture < 50) {
        reading.alerts.push({
          type: 'threshold_breach',
          message: `Low soil moisture: ${soilMoisture.toFixed(1)}%`,
          severity: 'medium',
          timestamp: reading.timestamp,
        });
      }

      readings.push(reading);
    }
  });

  return readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateMockHistoricalData = (): HistoricalData => {
  const data: HistoricalData = {};
  const sensors = ['esp32_001_sensor_1', 'esp32_001_sensor_2', 'esp32_002_sensor_1'];
  const metrics = ['soil_moisture', 'ph_level', 'microbial_activity', 'humidity'];

  sensors.forEach(sensorId => {
    data[sensorId] = {};
    metrics.forEach(metric => {
      data[sensorId][metric] = [];
      for (let i = 0; i < 96; i++) { // 24 hours of data (every 15 minutes)
        const timestamp = new Date(Date.now() - (i * 15 * 60 * 1000)).toISOString();
        let value: number;

        switch (metric) {
          case 'soil_moisture':
            value = 30 + Math.random() * 40 + Math.sin(i / 10) * 10;
            break;
          case 'ph_level':
            value = 6.5 + Math.random() * 1.0 + Math.sin(i / 20) * 0.5;
            break;
          case 'microbial_activity':
            value = 20000 + Math.random() * 20000 + Math.sin(i / 15) * 5000;
            break;
          case 'humidity':
            value = 50 + Math.random() * 20 + Math.sin(i / 8) * 10;
            break;
          default:
            value = Math.random() * 100;
        }

        data[sensorId][metric].push({
          timestamp,
          value: parseFloat(value.toFixed(2)),
          status: value > 70 ? 'optimal' : value > 40 ? 'warning' : 'critical',
        });
      }
    });
  });

  return data;
};

const App: React.FC = () => {
  const [fields, setFields] = useState<Field[]>(mockFields);
  const [selectedField, setSelectedField] = useState<Field | null>(mockFields[0]);
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({});
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [alertService] = useState(() => new AlertService(DEFAULT_ALERT_THRESHOLDS));
  const [esp32Service] = useState(() => new ESP32Service({
    device_id: 'esp32_001',
    api_endpoint: '/api/sensors/data',
    wifi_ssid: 'YOUR_WIFI_SSID',
    wifi_password: 'YOUR_WIFI_PASSWORD',
    api_key: 'YOUR_API_KEY',
    reading_interval: 300000, // 5 minutes
    retry_attempts: 3,
    timeout: 10000,
  }));

  // Initialize with mock data
  useEffect(() => {
    const mockData = generateMockSensorData();
    setSensorData(mockData);
    setHistoricalData(generateMockHistoricalData());

    // Process alerts from mock data
    const allAlerts: SensorAlert[] = [];
    mockData.forEach(reading => {
      const newAlerts = alertService.processSensorReading(reading);
      allAlerts.push(...newAlerts);
    });
    setAlerts(alertService.getActiveAlerts());

    // Subscribe to alert updates
    alertService.onAlertUpdate((newAlerts) => {
      setAlerts(newAlerts);
    });
  }, [alertService]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newReading = esp32Service.simulateESP32Data(1)[0];
      setSensorData(prev => [newReading, ...prev.slice(0, 99)]); // Keep last 100 readings

      // Update historical data
      setHistoricalData(prev => {
        const updated = { ...prev };
        if (!updated[newReading.sensor_id]) {
          updated[newReading.sensor_id] = {
            soil_moisture: [],
            ph_level: [],
            microbial_activity: [],
            humidity: [],
          };
        }

        Object.keys(updated[newReading.sensor_id]).forEach(metric => {
          const value = newReading.sensors[metric as keyof typeof newReading.sensors];
          if (typeof value === 'number') {
            updated[newReading.sensor_id][metric].push({
              timestamp: newReading.timestamp,
              value,
              status: 'optimal', // Simplified status
            });

            // Keep only last 96 data points (24 hours)
            if (updated[newReading.sensor_id][metric].length > 96) {
              updated[newReading.sensor_id][metric] = updated[newReading.sensor_id][metric].slice(-96);
            }
          }
        });

        return updated;
      });
    }, 30000); // Update every 30 seconds for demo

    return () => clearInterval(interval);
  }, [esp32Service]);

  const handleFieldCreate = (fieldData: Omit<Field, 'id'>) => {
    const newField: Field = {
      ...fieldData,
      id: `field_${Date.now()}`,
    };
    setFields(prev => [...prev, newField]);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<Field>) => {
    setFields(prev => prev.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    ));
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleFieldDelete = (fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleExport = async (request: any) => {
    console.log('Export request:', request);
    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Export completed');
  };

  return (
    <div className="App">
      <ResponsiveDashboard
        fields={fields}
        selectedField={selectedField}
        sensors={sensorData}
        historicalData={historicalData}
        alerts={alerts}
        onFieldSelect={setSelectedField}
        onFieldCreate={handleFieldCreate}
        onFieldUpdate={handleFieldUpdate}
        onFieldDelete={handleFieldDelete}
        onTimeRangeChange={setTimeRange}
        timeRange={timeRange}
        thresholds={DEFAULT_ALERT_THRESHOLDS}
      />
    </div>
  );
};

export default App;