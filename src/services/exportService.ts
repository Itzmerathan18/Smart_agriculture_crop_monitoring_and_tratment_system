import { ExportRequest, SensorReading, HistoricalData } from '../types/sensors';

export class ExportService {
  // Generate CSV export
  static generateCSV(data: SensorReading[], metrics: string[]): string {
    if (data.length === 0) return 'No data available for export';

    // CSV Headers
    const headers = [
      'Timestamp',
      'Sensor ID',
      'ESP32 ID',
      'Field ID',
      'Signal Strength (%)',
      'Battery Level (%)',
      'Latitude',
      'Longitude',
      ...metrics.map(metric => this.formatMetricName(metric))
    ];

    // CSV Data Rows
    const rows = data.map(reading => {
      const baseData = [
        new Date(reading.timestamp).toLocaleString(),
        reading.sensor_id,
        reading.esp32_id,
        reading.field_id,
        reading.signal_strength,
        reading.battery_level,
        reading.location.latitude,
        reading.location.longitude,
      ];

      const metricData = metrics.map(metric => {
        const value = this.getMetricValue(reading, metric);
        return value !== null ? value.toString() : 'N/A';
      });

      return [...baseData, ...metricData].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  // Generate JSON export
  static generateJSON(data: SensorReading[], metrics: string[]): string {
    const exportData = {
      metadata: {
        export_date: new Date().toISOString(),
        total_records: data.length,
        metrics_exported: metrics,
        date_range: {
          start: data.length > 0 ? data[0].timestamp : null,
          end: data.length > 0 ? data[data.length - 1].timestamp : null,
        },
      },
      data: data.map(reading => {
        const baseData = {
          timestamp: reading.timestamp,
          sensor_id: reading.sensor_id,
          esp32_id: reading.esp32_id,
          field_id: reading.field_id,
          signal_strength: reading.signal_strength,
          battery_level: reading.battery_level,
          location: reading.location,
          alerts: reading.alerts,
        };

        const metricsData = {};
        metrics.forEach(metric => {
          const value = this.getMetricValue(reading, metric);
          if (value !== null) {
            metricsData[metric] = value;
          }
        });

        return {
          ...baseData,
          sensors: metricsData,
        };
      }),
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Generate PDF export (simplified version)
  static async generatePDF(data: SensorReading[], metrics: string[]): Promise<Blob> {
    // In a real implementation, you would use a library like jsPDF or Puppeteer
    // For now, we'll create a simple HTML-to-PDF conversion

    const htmlContent = this.generatePDFHTML(data, metrics);

    // This would normally use a PDF generation library
    // For now, we'll simulate PDF creation by returning HTML as a blob
    return new Blob([htmlContent], { type: 'application/pdf' });
  }

  // Generate HTML content for PDF
  private static generatePDFHTML(data: SensorReading[], metrics: string[]): string {
    const generateSummaryStats = (metric: string) => {
      const values = data
        .map(reading => this.getMetricValue(reading, metric))
        .filter(value => value !== null) as number[];

      if (values.length === 0) return { min: 'N/A', max: 'N/A', avg: 'N/A' };

      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

      return {
        min: min.toFixed(2),
        max: max.toFixed(2),
        avg: avg.toFixed(2),
      };
    };

    const formatDate = (timestamp: string) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>AgriSense Data Export Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #10B981; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary h2 { color: #333; margin-top: 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric-card { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10B981; }
        .metric-card h3 { margin: 0 0 10px 0; color: #333; }
        .metric-stats { display: flex; justify-content: space-between; font-size: 14px; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .data-table th { background: #f8f9fa; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌾 AgriSense Data Export Report</h1>
        <p><strong>Generated:</strong> ${formatDate(new Date().toISOString())}</p>
        <p><strong>Total Records:</strong> ${data.length}</p>
        <p><strong>Metrics:</strong> ${metrics.map(m => this.formatMetricName(m)).join(', ')}</p>
        <p><strong>Date Range:</strong> ${data.length > 0 ? `${formatDate(data[0].timestamp)} - ${formatDate(data[data.length - 1].timestamp)}` : 'N/A'}</p>
    </div>

    <div class="summary">
        <h2>📊 Summary Statistics</h2>
        <div class="summary-grid">
            ${metrics.map(metric => {
              const stats = generateSummaryStats(metric);
              return `
                <div class="metric-card">
                    <h3>${this.formatMetricName(metric)}</h3>
                    <div class="metric-stats">
                        <span>Min: ${stats.min}</span>
                        <span>Avg: ${stats.avg}</span>
                        <span>Max: ${stats.max}</span>
                    </div>
                </div>
              `;
            }).join('')}
        </div>
    </div>

    <h2>📋 Raw Data</h2>
    <table class="data-table">
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>Sensor ID</th>
                <th>Signal (%)</th>
                <th>Battery (%)</th>
                ${metrics.map(metric => `<th>${this.formatMetricName(metric)}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.slice(0, 100).map(reading => `
                <tr>
                    <td>${formatDate(reading.timestamp)}</td>
                    <td>${reading.sensor_id}</td>
                    <td>${reading.signal_strength}</td>
                    <td>${reading.battery_level}</td>
                    ${metrics.map(metric => {
                      const value = this.getMetricValue(reading, metric);
                      return `<td>${value !== null ? value.toFixed(2) : 'N/A'}</td>`;
                    }).join('')}
                </tr>
            `).join('')}
            ${data.length > 100 ? `<tr><td colspan="${4 + metrics.length}" style="text-align: center; font-style: italic;">... and ${data.length - 100} more records</td></tr>` : ''}
        </tbody>
    </table>

    <div class="footer">
        <p>Generated by AgriSense Smart Agriculture Dashboard</p>
        <p>For questions or support, contact: support@agrisense.com</p>
    </div>
</body>
</html>
    `;
  }

  // Get metric value from sensor reading
  private static getMetricValue(reading: SensorReading, metric: string): number | null {
    switch (metric) {
      case 'soil_moisture':
        return reading.sensors.soil_moisture;
      case 'ph_level':
        return reading.sensors.ph_level;
      case 'microbial_activity':
        return reading.sensors.microbial_activity;
      case 'humidity':
        return reading.sensors.humidity;
      case 'signal_strength':
        return reading.signal_strength;
      case 'battery_level':
        return reading.battery_level;
      default:
        return null;
    }
  }

  // Format metric name for display
  private static formatMetricName(metric: string): string {
    return metric
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Download file
  static downloadFile(content: string | Blob, filename: string, contentType: string): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // Generate filename
  static generateFilename(format: string, fieldId?: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fieldPrefix = fieldId ? `_${fieldId}` : '';
    return `agrisense_export${fieldPrefix}_${timestamp}.${format}`;
  }

  // Export data with format handling
  static async exportData(
    data: SensorReading[],
    request: ExportRequest
  ): Promise<void> {
    if (data.length === 0) {
      throw new Error('No data available for export');
    }

    let content: string | Blob;
    let contentType: string;

    switch (request.format) {
      case 'csv':
        content = this.generateCSV(data, request.metrics);
        contentType = 'text/csv';
        break;
      case 'json':
        content = this.generateJSON(data, request.metrics);
        contentType = 'application/json';
        break;
      case 'pdf':
        content = await this.generatePDF(data, request.metrics);
        contentType = 'application/pdf';
        break;
      default:
        throw new Error(`Unsupported export format: ${request.format}`);
    }

    const filename = this.generateFilename(request.format, request.field_id);
    this.downloadFile(content, filename, contentType);
  }

  // Filter data by date range and field
  static filterData(
    data: SensorReading[],
    startDate: string,
    endDate: string,
    fieldId?: string
  ): SensorReading[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return data.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      const dateInRange = readingDate >= start && readingDate <= end;
      const fieldMatch = !fieldId || reading.field_id === fieldId;
      return dateInRange && fieldMatch;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}