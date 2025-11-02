import { Router, Request, Response } from 'express';
import { SensorReading, ApiResponse } from '../types/sensors';
import { AlertService } from '../services/alertService';
import { ExportService } from '../services/exportService';
import { ExportRequest } from '../types/sensors';

const router = Router();
const alertService = new AlertService();

// In-memory storage for demo purposes (replace with database in production)
let sensorReadings: SensorReading[] = [];
let fields = [
  {
    id: 'field_001',
    name: 'Field A',
    crop_type: 'Corn',
    boundaries: [
      { latitude: 40.7128, longitude: -74.0060 },
      { latitude: 40.7129, longitude: -74.0061 },
      { latitude: 40.7130, longitude: -74.0060 },
      { latitude: 40.7129, longitude: -74.0059 },
    ],
    sensors: ['esp32_001', 'esp32_002'],
    health_score: 85,
  },
  {
    id: 'field_002',
    name: 'Field B',
    crop_type: 'Wheat',
    boundaries: [
      { latitude: 40.7135, longitude: -74.0070 },
      { latitude: 40.7136, longitude: -74.0071 },
      { latitude: 40.7137, longitude: -74.0070 },
      { latitude: 40.7136, longitude: -74.0069 },
    ],
    sensors: ['esp32_003'],
    health_score: 92,
  },
];

// Middleware to validate sensor data format
const validateSensorReading = (req: Request, res: Response, next: any) => {
  const reading = req.body;

  const required = [
    'sensor_id',
    'esp32_id',
    'field_id',
    'timestamp',
    'signal_strength',
    'battery_level',
    'sensors',
    'location'
  ];

  for (const field of required) {
    if (!reading[field]) {
      return res.status(400).json({
        success: false,
        error: `Missing required field: ${field}`
      });
    }
  }

  const requiredSensors = ['soil_moisture', 'ph_level', 'microbial_activity', 'humidity', 'data_transfer_quality'];
  for (const sensor of requiredSensors) {
    if (!reading.sensors[sensor]) {
      return res.status(400).json({
        success: false,
        error: `Missing required sensor data: ${sensor}`
      });
    }
  }

  next();
};

// POST /api/sensors/data - Receive data from ESP32
router.post('/data', validateSensorReading, async (req: Request, res: Response) => {
  try {
    const reading: SensorReading = {
      ...req.body,
      timestamp: new Date(reading.timestamp).toISOString(), // Ensure ISO format
    };

    // Add the reading to storage
    sensorReadings.push(reading);

    // Process alerts
    const newAlerts = alertService.processSensorReading(reading);

    // Keep only last 1000 readings per sensor to prevent memory issues
    const readingsPerSensor = sensorReadings.filter(r => r.sensor_id === reading.sensor_id);
    if (readingsPerSensor.length > 1000) {
      sensorReadings = sensorReadings.filter(r =>
        r.sensor_id !== reading.sensor_id ||
        readingsPerSensor.indexOf(r) >= readingsPerSensor.length - 1000
      );
    }

    const response: ApiResponse<{ reading: SensorReading; alerts_generated: number }> = {
      success: true,
      data: {
        reading,
        alerts_generated: newAlerts.length,
      },
      message: 'Sensor data received successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error processing sensor data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing sensor data',
    });
  }
});

// GET /api/sensors/current - Get latest readings for all sensors
router.get('/current', (req: Request, res: Response) => {
  try {
    const { field_id } = req.query;

    let filteredReadings = sensorReadings;

    if (field_id) {
      filteredReadings = filteredReadings.filter(reading => reading.field_id === field_id);
    }

    // Get latest reading for each sensor
    const latestReadings = filteredReadings.reduce((acc: { [key: string]: SensorReading }, reading) => {
      const existing = acc[reading.sensor_id];
      if (!existing || new Date(reading.timestamp) > new Date(existing.timestamp)) {
        acc[reading.sensor_id] = reading;
      }
      return acc;
    }, {});

    const readings = Object.values(latestReadings);

    const response: ApiResponse<SensorReading[]> = {
      success: true,
      data: readings,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching current readings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching current readings',
    });
  }
});

// GET /api/sensors/history - Get historical data
router.get('/history', (req: Request, res: Response) => {
  try {
    const {
      sensor_id,
      field_id,
      start_date,
      end_date,
      limit = '100',
    } = req.query;

    let filteredReadings = [...sensorReadings];

    // Apply filters
    if (sensor_id) {
      filteredReadings = filteredReadings.filter(reading => reading.sensor_id === sensor_id);
    }

    if (field_id) {
      filteredReadings = filteredReadings.filter(reading => reading.field_id === field_id);
    }

    if (start_date) {
      const start = new Date(start_date as string);
      filteredReadings = filteredReadings.filter(reading => new Date(reading.timestamp) >= start);
    }

    if (end_date) {
      const end = new Date(end_date as string);
      filteredReadings = filteredReadings.filter(reading => new Date(reading.timestamp) <= end);
    }

    // Sort by timestamp (newest first)
    filteredReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    const limitNum = parseInt(limit as string, 10);
    const limitedReadings = filteredReadings.slice(0, limitNum);

    const response: ApiResponse<{
      readings: SensorReading[];
      total_count: number;
      filtered_count: number;
    }> = {
      success: true,
      data: {
        readings: limitedReadings,
        total_count: sensorReadings.length,
        filtered_count: filteredReadings.length,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching historical data',
    });
  }
});

// GET /api/fields - Get all fields
router.get('/fields', (req: Request, res: Response) => {
  try {
    const response: ApiResponse<typeof fields> = {
      success: true,
      data: fields,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching fields',
    });
  }
});

// POST /api/fields - Create new field
router.post('/fields', (req: Request, res: Response) => {
  try {
    const { name, crop_type, boundaries } = req.body;

    if (!name || !crop_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, crop_type',
      });
    }

    const newField = {
      id: `field_${Date.now()}`,
      name,
      crop_type,
      boundaries: boundaries || [],
      sensors: [],
      health_score: 100,
    };

    fields.push(newField);

    const response: ApiResponse<typeof newField> = {
      success: true,
      data: newField,
      message: 'Field created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating field:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating field',
    });
  }
});

// GET /api/alerts - Get alerts
router.get('/alerts', (req: Request, res: Response) => {
  try {
    const { severity, type, active_only = 'true' } = req.query;

    let alerts = alertService.getAllAlerts();

    if (active_only === 'true') {
      alerts = alertService.getActiveAlerts();
    }

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }

    const response: ApiResponse<{ alerts: typeof alerts; total_count: number }> = {
      success: true,
      data: {
        alerts,
        total_count: alerts.length,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching alerts',
    });
  }
});

// POST /api/alerts/configure - Configure alert thresholds
router.post('/alerts/configure', (req: Request, res: Response) => {
  try {
    const thresholds = req.body;
    alertService.updateThresholds(thresholds);

    const response: ApiResponse<{ thresholds: any }> = {
      success: true,
      data: {
        thresholds: alertService.getThresholds(),
      },
      message: 'Alert thresholds updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error configuring alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while configuring alerts',
    });
  }
});

// GET /api/reports/export - Generate and download data export
router.post('/reports/export', async (req: Request, res: Response) => {
  try {
    const exportRequest: ExportRequest = req.body;

    // Filter data based on request
    const filteredData = ExportService.filterData(
      sensorReadings,
      exportRequest.start_date,
      exportRequest.end_date,
      exportRequest.field_id
    );

    if (filteredData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found for the specified criteria',
      });
    }

    // Generate export content
    let content: string;
    let contentType: string;
    let filename: string;

    switch (exportRequest.format) {
      case 'csv':
        content = ExportService.generateCSV(filteredData, exportRequest.metrics);
        contentType = 'text/csv';
        break;
      case 'json':
        content = ExportService.generateJSON(filteredData, exportRequest.metrics);
        contentType = 'application/json';
        break;
      case 'pdf':
        // For PDF, generate and send directly
        const pdfBlob = await ExportService.generatePDF(filteredData, exportRequest.metrics);
        filename = ExportService.generateFilename('pdf', exportRequest.field_id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(pdfBlob);
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported export format',
        });
    }

    filename = ExportService.generateFilename(exportRequest.format, exportRequest.field_id);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    console.error('Error generating export:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating export',
    });
  }
});

// GET /api/health - Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      sensors: {
        total_readings: sensorReadings.length,
        active_sensors: [...new Set(sensorReadings.map(r => r.sensor_id))].length,
        fields_count: fields.length,
      },
      alerts: {
        active_count: alertService.getActiveAlerts().length,
        total_count: alertService.getAllAlerts().length,
      },
    };

    const response: ApiResponse<typeof health> = {
      success: true,
      data: health,
    };

    res.json(response);
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while checking health',
    });
  }
});

// DELETE /api/alerts/:index - Dismiss specific alert
router.delete('/alerts/:index', (req: Request, res: Response) => {
  try {
    const alertIndex = parseInt(req.params.index, 10);
    alertService.dismissAlert(alertIndex);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Alert dismissed successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while dismissing alert',
    });
  }
});

// POST /api/sensors/test - Generate test data (for development)
router.post('/test/generate-data', (req: Request, res: Response) => {
  try {
    const { count = 10 } = req.body;
    const testReadings: SensorReading[] = [];

    const sensorIds = ['esp32_001', 'esp32_002', 'esp32_003'];
    const fieldIds = ['field_001', 'field_002'];

    for (let i = 0; i < count; i++) {
      const sensorId = sensorIds[Math.floor(Math.random() * sensorIds.length)];
      const fieldId = fieldIds[Math.floor(Math.random() * fieldIds.length)];
      const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();

      const reading: SensorReading = {
        sensor_id: `${sensorId}_sensor_${i}`,
        esp32_id: sensorId,
        field_id,
        timestamp,
        signal_strength: 50 + Math.random() * 50,
        battery_level: 20 + Math.random() * 80,
        sensors: {
          soil_moisture: 20 + Math.random() * 70,
          ph_level: 5 + Math.random() * 4,
          microbial_activity: 1000 + Math.random() * 50000,
          humidity: 30 + Math.random() * 60,
          data_transfer_quality: ['excellent', 'good', 'poor'][Math.floor(Math.random() * 3)] as any,
        },
        location: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
        },
        alerts: [],
      };

      testReadings.push(reading);
      sensorReadings.push(reading);

      // Process alerts for test data
      alertService.processSensorReading(reading);
    }

    const response: ApiResponse<{ generated: number; total: number }> = {
      success: true,
      data: {
        generated: testReadings.length,
        total: sensorReadings.length,
      },
      message: 'Test data generated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating test data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating test data',
    });
  }
});

export default router;