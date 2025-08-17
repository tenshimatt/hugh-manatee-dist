import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { api } from '../utils/api';
import { SubredditMetrics as SubredditMetricsType } from '../types/dashboard';

export const SubredditMetrics: React.FC = () => {
  const [subreddits, setSubreddits] = useState<SubredditMetricsType[]>([]);

  useEffect(() => {
    const fetchSubreddits = async () => {
      try {
        const data = await api.getSubreddits();
        setSubreddits(data);
      } catch (error) {
        console.error('Failed to fetch subreddits:', error);
      }
    };

    fetchSubreddits();
    const interval = setInterval(fetchSubreddits, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Subreddit Activity
        </h3>
        <Users className="w-5 h-5 text-gray-500" />
      </div>

      <div className="space-y-3">
        {subreddits.slice(0, 8).map((subreddit, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {subreddit.name}
              </div>
              <div className="text-xs text-gray-500">
                {subreddit.postsToday} posts today
              </div>
            </div>
            <div className="text-right">
              <div className={`status-badge ${
                subreddit.status === 'ACTIVE' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
              }`}>
                {subreddit.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};