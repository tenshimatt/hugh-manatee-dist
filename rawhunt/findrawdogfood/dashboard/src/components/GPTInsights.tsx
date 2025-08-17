import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { api } from '../utils/api';
import { GPTAnalytics } from '../types/dashboard';

export const GPTInsights: React.FC = () => {
  const [analytics, setAnalytics] = useState<GPTAnalytics | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getGPTAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch GPT analytics:', error);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!analytics) return null;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Analysis Insights
        </h3>
        <Brain className="w-5 h-5 text-gray-500" />
      </div>

      <div className="space-y-4">
        {/* Content Classification */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sentiment Analysis
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-semibold text-green-600">
                {analytics.contentClassification.positive}%
              </div>
              <div className="text-xs text-green-600">Positive</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-semibold text-gray-600">
                {analytics.contentClassification.neutral}%
              </div>
              <div className="text-xs text-gray-600">Neutral</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-lg font-semibold text-red-600">
                {analytics.contentClassification.negative}%
              </div>
              <div className="text-xs text-red-600">Negative</div>
            </div>
          </div>
        </div>

        {/* Top Art Categories */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Top Art Categories
          </h4>
          <div className="space-y-2">
            {Object.entries(analytics.artCategories).slice(0, 3).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{category}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {(analytics.averageConfidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {analytics.processingTime}ms
            </div>
            <div className="text-xs text-gray-500">Avg Response</div>
          </div>
        </div>
      </div>
    </div>
  );
};