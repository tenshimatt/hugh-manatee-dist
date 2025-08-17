import React from 'react';
import { Play, Pause, Settings, AlertTriangle } from 'lucide-react';
import { useBotMetrics } from '../hooks/useBotMetrics';

export const BotControls: React.FC = () => {
  const { status, pauseBot, resumeBot, loading } = useBotMetrics();

  const handlePause = async () => {
    if (window.confirm('Are you sure you want to pause the bot? This will stop all monitoring activities.')) {
      await pauseBot();
    }
  };

  const handleResume = async () => {
    await resumeBot();
  };

  const isActive = status?.status === 'ACTIVE';
  const isPaused = status?.status === 'PAUSED';
  const hasError = status?.status === 'ERROR';

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Bot Controls
        </h3>
        <div className={`status-badge ${
          isActive ? 'text-green-600 bg-green-100' :
          isPaused ? 'text-yellow-600 bg-yellow-100' :
          'text-red-600 bg-red-100'
        }`}>
          {status?.status || 'UNKNOWN'}
        </div>
      </div>

      <div className="space-y-4">
        {/* Emergency Stop */}
        {isActive && (
          <button
            onClick={handlePause}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 rounded-md font-medium transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span>Emergency Stop</span>
          </button>
        )}

        {/* Resume */}
        {isPaused && (
          <button
            onClick={handleResume}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded-md font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Resume Bot</span>
          </button>
        )}

        {/* Error State */}
        {hasError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Bot Error Detected</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Check system logs for details
            </p>
          </div>
        )}

        {/* Configuration */}
        <button className="w-full flex items-center justify-center space-x-2 btn-secondary">
          <Settings className="w-4 h-4" />
          <span>Configuration</span>
        </button>
      </div>

      {/* Current Settings Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Current Settings
        </h4>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Daily Limit:</span>
            <span>12 comments</span>
          </div>
          <div className="flex justify-between">
            <span>Min Interval:</span>
            <span>30 minutes</span>
          </div>
          <div className="flex justify-between">
            <span>Quality Threshold:</span>
            <span>70%</span>
          </div>
          <div className="flex justify-between">
            <span>Risk Threshold:</span>
            <span>30%</span>
          </div>
        </div>
      </div>
    </div>
  );
};