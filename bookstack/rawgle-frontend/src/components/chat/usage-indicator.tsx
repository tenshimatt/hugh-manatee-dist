'use client';

import { UsageTier } from '@/types/chat';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface UsageIndicatorProps {
  usage: UsageTier;
  onUpgrade?: () => void;
  className?: string;
}

export function UsageIndicator({ usage, onUpgrade, className = '' }: UsageIndicatorProps) {
  const usagePercentage = usage.dailyLimit === Infinity 
    ? 0 
    : (usage.currentUsage / usage.dailyLimit) * 100;
  
  const remaining = usage.dailyLimit === Infinity 
    ? Infinity 
    : usage.dailyLimit - usage.currentUsage;

  const getUsageColor = () => {
    if (usagePercentage >= 100) return 'bg-red-500';
    if (usagePercentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageTextColor = () => {
    if (usagePercentage >= 100) return 'text-red-600';
    if (usagePercentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatTimeUntilReset = () => {
    const now = new Date();
    const resetTime = new Date(usage.resetTime);
    const diff = resetTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Reset available';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m until reset`;
    }
    return `${minutes}m until reset`;
  };

  if (usage.name === 'premium') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg ${className}`}
      >
        <Crown className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-700">Premium Active</span>
        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
          Unlimited
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-3 p-3 bg-gray-50 border rounded-lg ${className}`}
    >
      {/* Usage Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Daily Usage
          </span>
        </div>
        <span className={`text-sm font-semibold ${getUsageTextColor()}`}>
          {remaining === 0 ? 'Limit Reached' : `${remaining} remaining`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={usagePercentage} 
          className="h-2"
          // Apply custom color based on usage
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{usage.currentUsage}/{usage.dailyLimit === Infinity ? '∞' : usage.dailyLimit} messages</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimeUntilReset()}</span>
          </div>
        </div>
      </div>

      {/* Upgrade Prompt */}
      {remaining <= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Upgrade to Premium
                </h4>
                <p className="text-xs text-blue-700">
                  Get unlimited messages, voice features, and priority support
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                  Unlimited Messages
                </Badge>
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                  Voice I/O
                </Badge>
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                  Export History
                </Badge>
              </div>
              {onUpgrade && (
                <Button 
                  size="sm" 
                  onClick={onUpgrade}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Start 7-Day Free Trial
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Post-Message Upgrade Banner */}
      {remaining === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg"
        >
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">Daily Limit Reached</h3>
              <p className="text-sm text-amber-700">
                You&apos;ve used all {usage.dailyLimit} free messages today
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-amber-600">
                Premium benefits:
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                  Unlimited Messages
                </Badge>
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                  Voice Features
                </Badge>
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                  Priority Support
                </Badge>
              </div>
            </div>
            {onUpgrade && (
              <Button 
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                Upgrade to Premium
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}