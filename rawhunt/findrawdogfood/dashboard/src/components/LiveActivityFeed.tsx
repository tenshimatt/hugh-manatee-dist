import React from 'react';
import { MessageSquare, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { formatTime, getRiskColor } from '../utils/formatters';

export const LiveActivityFeed: React.FC = () => {
  const { activities, isConnected } = useRealTimeData();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'SCAN': return Eye;
      case 'COMMENT': return MessageSquare;
      case 'SKIP': return AlertCircle;
      case 'ERROR': return AlertCircle;
      default: return CheckCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'SCAN': return 'text-blue-600 bg-blue-100';
      case 'COMMENT': return 'text-green-600 bg-green-100';
      case 'SKIP': return 'text-yellow-600 bg-yellow-100';
      case 'ERROR': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Live Activity Feed
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Waiting for activity...</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`status-badge ${getRiskColor(activity.riskLevel)}`}>
                        {activity.riskLevel}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">{activity.subreddit}</span>
                    {' • '}
                    <span className="truncate">{activity.postTitle}</span>
                  </p>
                  
                  {activity.result?.postUrl && (
                    <div className="mt-1">
                      <a 
                        href={activity.result.postUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View Reddit Post →
                      </a>
                    </div>
                  )}
                  
                  {activity.result && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {activity.result.engagement && (
                        <span>Status: {activity.result.engagement}</span>
                      )}
                      {activity.result.upvotes && (
                        <span className="ml-3">Upvotes: {activity.result.upvotes}</span>
                      )}
                      {activity.result.productMatched && (
                        <span className="ml-3">Product: {activity.result.productMatched}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};