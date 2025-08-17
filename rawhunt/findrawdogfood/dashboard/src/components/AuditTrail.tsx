import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { api } from '../utils/api';
import { formatTime, formatRelativeTime } from '../utils/formatters';

interface AuditEntry {
  timestamp: string;
  type: string;
  subreddit: string;
  postTitle: string;
  action: string;
  result?: {
    engagement?: string;
    productMatched?: string;
    postUrl?: string;
  };
}

export const AuditTrail: React.FC = () => {
  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        setLoading(true);
        const data = await api.getAuditTrail(20);
        setAuditData(data);
      } catch (error) {
        console.error('Failed to fetch audit data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
    const interval = setInterval(fetchAuditData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity Log
        </h3>
        <FileText className="w-5 h-5 text-gray-500" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Time</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Type</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Subreddit</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Post</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Action</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Result</th>
            </tr>
          </thead>
          <tbody>
            {auditData.map((entry, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3 px-3">
                  <div className="text-gray-900 dark:text-white">
                    {formatTime(entry.timestamp)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatRelativeTime(entry.timestamp)}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className={`status-badge ${
                    entry.type === 'COMMENT' ? 'text-green-600 bg-green-100' :
                    entry.type === 'SKIP' ? 'text-yellow-600 bg-yellow-100' :
                    'text-blue-600 bg-blue-100'
                  }`}>
                    {entry.type}
                  </span>
                </td>
                <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                  {entry.subreddit}
                </td>
                <td className="py-3 px-3">
                  <div className="max-w-xs truncate text-gray-900 dark:text-white">
                    {entry.postTitle}
                  </div>
                </td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                  {entry.action}
                </td>
                <td className="py-3 px-3">
                  {entry.result?.engagement && (
                    <div className="text-gray-600 dark:text-gray-400">
                      {entry.result.engagement}
                    </div>
                  )}
                  {entry.result?.postUrl && (
                    <div className="mt-1">
                      <a 
                        href={entry.result.postUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View Post →
                      </a>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {auditData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No audit data available</p>
          </div>
        )}
      </div>
    </div>
  );
};