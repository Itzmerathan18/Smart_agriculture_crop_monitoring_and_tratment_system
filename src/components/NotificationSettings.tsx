import React, { useState } from 'react';

interface NotificationSettingsProps {
  settings: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    email_address?: string;
    phone_number?: string;
    alert_types: {
      critical: boolean;
      high: boolean;
      medium: boolean;
      low: boolean;
    };
    quiet_hours: {
      enabled: boolean;
      start: string; // HH:mm
      end: string;   // HH:mm
    };
  };
  onSettingsChange: (settings: any) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handleAlertTypeChange = (severity: string, enabled: boolean) => {
    onSettingsChange({
      ...settings,
      alert_types: {
        ...settings.alert_types,
        [severity]: enabled,
      },
    });
  };

  const handleQuietHoursChange = (field: 'enabled' | 'start' | 'end', value: any) => {
    onSettingsChange({
      ...settings,
      quiet_hours: {
        ...settings.quiet_hours,
        [field]: value,
      },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>🔔</span>
          <span>Notification Settings</span>
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Quick Status */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${settings.email_enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm text-gray-600">Email</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${settings.sms_enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm text-gray-600">SMS</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${settings.push_enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm text-gray-600">Push</span>
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="space-y-6 border-t pt-4">
          {/* Notification Channels */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Notification Channels</h3>
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.email_enabled}
                      onChange={(e) => handleSettingChange('email_enabled', e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Email Notifications</div>
                      <div className="text-sm text-gray-600">
                        {settings.email_address || 'No email configured'}
                      </div>
                    </div>
                  </label>
                </div>
                {settings.email_enabled && (
                  <input
                    type="email"
                    value={settings.email_address || ''}
                    onChange={(e) => handleSettingChange('email_address', e.target.value)}
                    placeholder="Enter email address"
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>

              {/* SMS */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.sms_enabled}
                      onChange={(e) => handleSettingChange('sms_enabled', e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">SMS Notifications</div>
                      <div className="text-sm text-gray-600">
                        {settings.phone_number || 'No phone number configured'}
                      </div>
                    </div>
                  </label>
                </div>
                {settings.sms_enabled && (
                  <input
                    type="tel"
                    value={settings.phone_number || ''}
                    onChange={(e) => handleSettingChange('phone_number', e.target.value)}
                    placeholder="+1234567890"
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>

              {/* Push */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.push_enabled}
                    onChange={(e) => handleSettingChange('push_enabled', e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Push Notifications</div>
                    <div className="text-sm text-gray-600">Browser and mobile app notifications</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Alert Severity */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Alert Severity</h3>
            <div className="space-y-2">
              {Object.entries(settings.alert_types).map(([severity, enabled]) => (
                <label key={severity} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleAlertTypeChange(severity, e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="capitalize font-medium text-gray-900">{severity}</span>
                  <span className="text-sm text-gray-600">
                    {severity === 'critical' && 'Immediate notification for system failures'}
                    {severity === 'high' && 'Important alerts requiring attention'}
                    {severity === 'medium' && 'Moderate issues and warnings'}
                    {severity === 'low' && 'Informational updates'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Quiet Hours</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.quiet_hours.enabled}
                  onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="font-medium text-gray-900">Enable quiet hours</span>
              </label>

              {settings.quiet_hours.enabled && (
                <div className="flex items-center space-x-3 ml-6">
                  <label className="text-sm text-gray-600">From:</label>
                  <input
                    type="time"
                    value={settings.quiet_hours.start}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <label className="text-sm text-gray-600">To:</label>
                  <input
                    type="time"
                    value={settings.quiet_hours.end}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {settings.quiet_hours.enabled && (
                <p className="text-sm text-gray-600 ml-6">
                  Non-critical alerts will be silenced during these hours. Critical alerts will always be delivered.
                </p>
              )}
            </div>
          </div>

          {/* Test Notifications */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Test Notifications</h3>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                Send Test Email
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                Send Test SMS
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                Send Test Push
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};