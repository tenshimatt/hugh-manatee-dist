'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity,
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Calendar,
  Weight,
  Thermometer,
  Bot,
  Zap,
  Target,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedPetChat } from '@/components/chat/enhanced-pet-chat';
import healthDataService, { PetHealthContext } from '@/services/health-data';

interface ChatHealthIntegrationProps {
  petId?: string;
  className?: string;
}

export function ChatHealthIntegration({ petId, className = '' }: ChatHealthIntegrationProps) {
  const [healthContext, setHealthContext] = useState<PetHealthContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [healthInsights, setHealthInsights] = useState<string[]>([]);

  useEffect(() => {
    if (petId) {
      loadHealthData();
    }
  }, [petId]);

  const loadHealthData = async () => {
    if (!petId) return;
    
    setLoading(true);
    try {
      const data = await healthDataService.getPetHealthContext(petId);
      setHealthContext(data);
      generateHealthInsights(data);
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHealthInsights = (context: PetHealthContext) => {
    const insights: string[] = [];
    
    // Weight insights
    if (context.insights.weightTrend) {
      insights.push(`Weight is ${context.insights.weightTrend} - consider asking about portion adjustments`);
    }
    
    // Health condition insights
    if (context.healthConditions.length > 0) {
      insights.push(`Has ${context.healthConditions.length} health condition(s) - ask about specialized dietary needs`);
    }
    
    // Activity level insights
    if (context.activityLevel === 'high') {
      insights.push('High activity level - may need increased caloric intake');
    } else if (context.activityLevel === 'low') {
      insights.push('Low activity level - portion control may be important');
    }
    
    // Recent health alerts
    context.insights.healthAlerts.forEach(alert => {
      insights.push(`Health alert: ${alert}`);
    });
    
    setHealthInsights(insights);
  };

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatHealthMetric = (value: number | undefined, unit: string) => {
    return value ? `${value}${unit}` : 'Not recorded';
  };

  if (!petId) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Nutrition Chat</h3>
            <p className="text-gray-600 mb-4">
              Get personalized nutrition advice for your pets from our AI expert.
            </p>
            <EnhancedPetChat 
              className="h-96"
              showPetSelector={true}
              embedded={true}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Health Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Health Summary for {healthContext?.petName || 'Your Pet'}
            {loading && (
              <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthContext && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Weight className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900">
                  {healthContext.weight ? `${healthContext.weight} lbs` : 'Not recorded'}
                </div>
                <div className="text-sm text-gray-600">Current Weight</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {healthContext.activityLevel}
                </div>
                <div className="text-sm text-gray-600">Activity Level</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900">
                  {healthContext.age} years
                </div>
                <div className="text-sm text-gray-600">Age</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900">
                  {healthContext.currentDiet || 'Not specified'}
                </div>
                <div className="text-sm text-gray-600">Current Diet</div>
              </div>
            </div>
          )}
          
          {/* Health Insights */}
          {healthInsights.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                AI Health Insights
              </h4>
              <div className="space-y-2">
                {healthInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <span className="text-sm text-yellow-800">{insight}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Action Buttons */}
          <div className="flex gap-3 mb-4">
            <Button
              onClick={() => setShowChat(true)}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Ask AI Nutritionist
            </Button>
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Health Trends
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Health Records */}
      {healthContext?.recentHealthRecords && healthContext.recentHealthRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Recent Health Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthContext.recentHealthRecords.slice(0, 3).map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        Health Check • {new Date(record.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {record.weight && `Weight: ${record.weight} lbs`}
                        {record.temperature && ` • Temp: ${record.temperature}°F`}
                        {record.symptoms.length > 0 && ` • ${record.symptoms.length} symptoms noted`}
                      </div>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowChat(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl h-[80vh] bg-white rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">AI Nutrition Consultation</h2>
                      <p className="text-sm text-gray-600">
                        Personalized advice for {healthContext?.petName}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                </div>
                <div className="flex-1 p-4">
                  <EnhancedPetChat 
                    className="h-full"
                    defaultPetId={petId}
                    showPetSelector={false}
                    embedded={true}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatHealthIntegration;