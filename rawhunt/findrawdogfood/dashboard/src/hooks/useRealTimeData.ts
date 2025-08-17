import { useState, useEffect } from 'react';
import { ActivityEvent } from '../types/dashboard';
import { api } from '../utils/api';

export const useRealTimeData = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = api.createEventSource('/api/stream');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'activity') {
          setActivities(prev => [data.data, ...prev.slice(0, 49)]); // Keep last 50
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { activities, isConnected };
};