import React from 'react';
import { StatusPanel } from './StatusPanel';
import { LiveActivityFeed } from './LiveActivityFeed';
import { BotControls } from './BotControls';
import { SystemHealth } from './SystemHealth';
import { SubredditMetrics } from './SubredditMetrics';
import { GPTInsights } from './GPTInsights';
import { BusinessImpactPanel } from './BusinessImpactPanel';
import { AuditTrail } from './AuditTrail';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                SUPERLUXE Engagement Bot
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time Reddit Community Monitoring Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Status Panel - Full Width */}
          <div className="col-span-12">
            <StatusPanel />
          </div>
          
          {/* Live Feed + Controls Row */}
          <div className="col-span-8">
            <LiveActivityFeed />
          </div>
          <div className="col-span-4 space-y-6">
            <BotControls />
            <SystemHealth />
          </div>
          
          {/* Analytics Row */}
          <div className="col-span-6">
            <SubredditMetrics />
          </div>
          <div className="col-span-6">
            <GPTInsights />
          </div>
          
          {/* Business Metrics - Full Width */}
          <div className="col-span-12">
            <BusinessImpactPanel />
          </div>
          
          {/* Audit Trail - Full Width */}
          <div className="col-span-12">
            <AuditTrail />
          </div>
        </div>
      </div>
    </div>
  );
};