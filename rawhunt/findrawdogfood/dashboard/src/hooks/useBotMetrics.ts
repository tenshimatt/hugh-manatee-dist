import { useState, useEffect } from 'react';
import { BotStatus } from '../types/dashboard';
import { api } from '../utils/api';

export const useBotMetrics = () => {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getBotStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bot status');
    } finally {
      setLoading(false);
    }
  };

  const pauseBot = async () => {
    try {
      await api.pauseBot();
      await fetchStatus(); // Refresh status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause bot');
    }
  };

  const resumeBot = async () => {
    try {
      await api.resumeBot();
      await fetchStatus(); // Refresh status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume bot');
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    loading,
    error,
    pauseBot,
    resumeBot,
    refetch: fetchStatus
  };
};