import React, { useState, useEffect } from 'react';
import { Server, Database, Zap } from 'lucide-react';
import { api } from '../utils/api';
import { SystemHealth as SystemHealthType } from '../types/dashboard';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthType | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.getSystemHealth();
        setHealth(data);
      } catch (error) {
        console.error('Failed to fetch system health:', error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!health) return null;

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        System Health
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Worker</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              health.cloudflare.worker.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-500">{health.cloudflare.worker.latency}ms</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">D1 Database</span>
          </div>
          <span className="text-xs text-gray-500">{health.cloudflare.d1.avgTime}ms avg</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Reddit API</span>
          </div>
          <span className="text-xs text-gray-500">
            {health.apis.reddit.requestsUsed}/{health.apis.reddit.limit}
          </span>
        </div>
      </div>
    </div>
  );
};