import React, { useState, useEffect } from 'react';
import { DollarSign, Eye, ShoppingCart, TrendingUp } from 'lucide-react';
import { api } from '../utils/api';
import { BusinessMetrics } from '../types/dashboard';
import { formatCurrency, formatNumber } from '../utils/formatters';

export const BusinessImpactPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.getBusinessMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch business metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  const businessStats = [
    {
      label: 'Estimated Revenue',
      value: formatCurrency(metrics.estimatedRevenue),
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
      change: '+12.5%'
    },
    {
      label: 'Direct Traffic',
      value: formatNumber(metrics.directTraffic),
      icon: Eye,
      color: 'text-blue-600 bg-blue-100',
      change: '+8.3%'
    },
    {
      label: 'Product Views',
      value: formatNumber(metrics.productViews),
      icon: ShoppingCart,
      color: 'text-purple-600 bg-purple-100',
      change: '+15.7%'
    },
    {
      label: 'Brand Impressions',
      value: formatNumber(metrics.brandImpressions),
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-100',
      change: '+22.1%'
    }
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Business Impact
        </h3>
        <span className="text-sm text-gray-500">Last 24 hours</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {businessStats.map((stat, index) => {
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
              <div className="text-xs text-green-600 font-medium">
                {stat.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Engagement Quality Metrics */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Engagement Quality
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {(metrics.engagementQuality.sentiment * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Positive Sentiment</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {(metrics.engagementQuality.upvoteRatio * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Upvote Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {(metrics.engagementQuality.replyRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Reply Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {metrics.engagementQuality.spamReports}
            </div>
            <div className="text-xs text-gray-500">Spam Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
};