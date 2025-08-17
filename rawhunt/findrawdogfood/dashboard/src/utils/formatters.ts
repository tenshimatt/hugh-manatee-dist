import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatTime = (timestamp: string) => {
  return format(parseISO(timestamp), 'HH:mm:ss');
};

export const formatDate = (timestamp: string) => {
  return format(parseISO(timestamp), 'MMM dd, yyyy');
};

export const formatRelativeTime = (timestamp: string) => {
  return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

export const formatPercentage = (num: number) => {
  return `${(num * 100).toFixed(1)}%`;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatUptime = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export const getRiskColor = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
  switch (level) {
    case 'LOW': return 'text-green-600 bg-green-100';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
    case 'HIGH': return 'text-red-600 bg-red-100';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'text-green-600 bg-green-100';
    case 'PAUSED': return 'text-yellow-600 bg-yellow-100';
    case 'ERROR': return 'text-red-600 bg-red-100';
    case 'healthy': return 'text-green-600 bg-green-100';
    case 'degraded': return 'text-yellow-600 bg-yellow-100';
    case 'down': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};