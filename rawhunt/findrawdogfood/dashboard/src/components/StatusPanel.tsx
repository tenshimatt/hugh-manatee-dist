import React from 'react';
import { Activity, Clock, MessageSquare, TrendingUp } from 'lucide-react';
import { useBotMetrics } from '../hooks/useBotMetrics';
import { formatNumber, formatUptime, formatPercentage, getStatusColor } from '../utils/formatters';

export const StatusPanel: React.FC = () => {
  const { status, loading } = useBotMetrics();

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const stats = [
    {
      label: 'Bot Status',
      value: status.status,
      icon: Activity,
      color: getStatusColor(status.status),
      description: `Active since ${formatUptime(Number(status.uptime))}`
    },
    {
      label: 'Posts Processed',
      value: formatNumber(status.postsProcessed),
      icon: MessageSquare,
      color: 'text-blue-600 bg-blue-100',
      description: 'Posts analyzed today'
    },
    {
      label: 'Comments Generated',
      value: formatNumber(status.commentsGenerated),
      icon: MessageSquare,
      color: 'text-green-600 bg-green-100',
      description: 'Successful engagements'
    },
    {
      label: 'Engagement Rate',
      value: formatPercentage(status.engagementRate),
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-100',
      description: 'Success rate today'
    }
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          System Overview
        </h2>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Current Cycle: {status.currentCycle}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};