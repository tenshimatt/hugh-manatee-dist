const API_BASE = 'https://superluxe-dashboard-api.findrawdogfood.workers.dev';

export class DashboardAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Bot Status & Control
  async getBotStatus() {
    return this.fetch('/api/status');
  }

  async pauseBot() {
    return this.fetch('/api/bot/pause', { method: 'POST' });
  }

  async resumeBot() {
    return this.fetch('/api/bot/resume', { method: 'POST' });
  }

  // Metrics & Analytics
  async getDailyMetrics() {
    return this.fetch('/api/metrics/daily');
  }

  async getWeeklyMetrics() {
    return this.fetch('/api/metrics/weekly');
  }

  async getDashboard() {
    return this.fetch('/api/dashboard');
  }

  // Subreddit Management
  async getSubreddits() {
    return this.fetch('/api/subreddits');
  }

  async updateSubreddit(name: string, config: any) {
    return this.fetch('/api/subreddits', {
      method: 'POST',
      body: JSON.stringify({ name, config }),
    });
  }

  // Audit & Activity
  async getAuditTrail(limit = 50) {
    return this.fetch(`/api/audit?limit=${limit}`);
  }

  async deleteAuditEntry(id: string) {
    return this.fetch(`/api/audit/${id}`, { method: 'DELETE' });
  }

  // Health & System
  async getSystemHealth() {
    return this.fetch('/api/health');
  }

  async getGPTAnalytics() {
    return this.fetch('/api/analytics/gpt');
  }

  async getBusinessMetrics() {
    return this.fetch('/api/analytics/business');
  }

  // Real-time Stream
  createEventSource(endpoint: string) {
    return new EventSource(`${this.baseUrl}${endpoint}`);
  }
}

export const api = new DashboardAPI();