/**
 * API Usage and Cost Monitor for FindRawDogFood
 * Tracks usage, calculates costs, and provides monitoring dashboard
 */

class APIMonitor {
  constructor() {
    this.usage = new Map();
    this.costs = new Map();
    this.alerts = [];
    
    this.setupCostRates();
    this.setupUsageTracking();
  }

  setupCostRates() {
    // Cost rates per API (in USD)
    this.costRates = {
      openai_whisper: {
        perMinute: 0.006,  // $0.006 per minute of audio
        unit: 'minutes'
      },
      anthropic_claude: {
        inputTokens: 0.000003,   // $3 per million input tokens
        outputTokens: 0.000015,  // $15 per million output tokens
        unit: 'tokens'
      },
      elevenlabs_tts: {
        perCharacter: 0.00003,   // Free tier: 10K chars/month, paid starts ~$3/month
        freeLimit: 10000,        // Monthly free character limit
        unit: 'characters'
      },
      google_places: {
        perRequest: 0.017,       // $17 per 1000 requests
        freeLimit: 1000,         // Daily free requests per key
        unit: 'requests'
      }
    };
  }

  setupUsageTracking() {
    // Initialize usage tracking for each API
    Object.keys(this.costRates).forEach(api => {
      this.usage.set(api, {
        requests: 0,
        characters: 0,
        tokens: 0,
        minutes: 0,
        inputTokens: 0,
        outputTokens: 0,
        dailyTotal: 0,
        monthlyTotal: 0,
        lastReset: Date.now()
      });
      
      this.costs.set(api, {
        daily: 0,
        monthly: 0,
        total: 0
      });
    });
  }

  recordUsage(apiName, usageData = {}) {
    const usage = this.usage.get(apiName);
    if (!usage) {
      console.warn(`Unknown API for monitoring: ${apiName}`);
      return;
    }

    const now = Date.now();
    
    // Update usage counters
    if (usageData.requests) usage.requests += usageData.requests;
    if (usageData.characters) usage.characters += usageData.characters;
    if (usageData.tokens) usage.tokens += usageData.tokens;
    if (usageData.minutes) usage.minutes += usageData.minutes;
    if (usageData.inputTokens) usage.inputTokens += usageData.inputTokens;
    if (usageData.outputTokens) usage.outputTokens += usageData.outputTokens;

    // Calculate costs
    const cost = this.calculateCost(apiName, usageData);
    const costs = this.costs.get(apiName);
    costs.daily += cost;
    costs.monthly += cost;
    costs.total += cost;

    // Update daily/monthly totals
    usage.dailyTotal += cost;
    usage.monthlyTotal += cost;

    // Check for cost alerts
    this.checkCostAlerts(apiName, costs, usage);

    console.log(`💰 ${apiName}: +$${cost.toFixed(4)} (Daily: $${costs.daily.toFixed(4)})`);
  }

  calculateCost(apiName, usageData) {
    const rate = this.costRates[apiName];
    let cost = 0;

    switch (apiName) {
      case 'openai_whisper':
        if (usageData.minutes) {
          cost = usageData.minutes * rate.perMinute;
        }
        break;

      case 'anthropic_claude':
        if (usageData.inputTokens && usageData.outputTokens) {
          cost = (usageData.inputTokens * rate.inputTokens) + 
                 (usageData.outputTokens * rate.outputTokens);
        } else if (usageData.tokens) {
          // Fallback for general token count (assume 70% input, 30% output)
          cost = (usageData.tokens * 0.7 * rate.inputTokens) + 
                 (usageData.tokens * 0.3 * rate.outputTokens);
        }
        break;

      case 'elevenlabs_tts':
        if (usageData.characters) {
          const usage = this.usage.get(apiName);
          if (usage.characters > rate.freeLimit) {
            // Only charge for characters beyond free limit
            const billableChars = Math.max(0, usage.characters - rate.freeLimit);
            cost = billableChars * rate.perCharacter;
          }
        }
        break;

      case 'google_places':
        if (usageData.requests) {
          const usage = this.usage.get(apiName);
          if (usage.requests > rate.freeLimit) {
            // Only charge for requests beyond free limit per key
            const billableRequests = Math.max(0, usage.requests - rate.freeLimit);
            cost = billableRequests * rate.perRequest;
          }
        }
        break;
    }

    return cost;
  }

  checkCostAlerts(apiName, costs, usage) {
    const alerts = [];
    
    // Daily cost alerts
    if (costs.daily > 1.00) {
      alerts.push({
        type: 'daily_cost',
        api: apiName,
        amount: costs.daily,
        threshold: 1.00,
        message: `Daily cost for ${apiName} exceeded $1.00`
      });
    }

    // Monthly cost alerts
    if (costs.monthly > 10.00) {
      alerts.push({
        type: 'monthly_cost',
        api: apiName,
        amount: costs.monthly,
        threshold: 10.00,
        message: `Monthly cost for ${apiName} exceeded $10.00`
      });
    }

    // Usage-specific alerts
    if (apiName === 'elevenlabs_tts') {
      const freeLimit = this.costRates[apiName].freeLimit;
      if (usage.characters > freeLimit * 0.8) {
        alerts.push({
          type: 'usage_warning',
          api: apiName,
          usage: usage.characters,
          limit: freeLimit,
          message: `ElevenLabs usage at ${Math.round((usage.characters / freeLimit) * 100)}% of free limit`
        });
      }
    }

    // Add new alerts
    alerts.forEach(alert => {
      alert.timestamp = new Date().toISOString();
      this.alerts.push(alert);
      console.warn(`⚠️  COST ALERT: ${alert.message}`);
    });

    // Keep only recent alerts (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > oneDayAgo
    );
  }

  getUsageReport(apiName = null) {
    if (apiName) {
      return this.getSingleAPIReport(apiName);
    }

    // Generate comprehensive report for all APIs
    const report = {
      summary: {
        totalDailyCost: 0,
        totalMonthlyCost: 0,
        totalCost: 0,
        activeAPIs: 0,
        lastUpdated: new Date().toISOString()
      },
      apis: {},
      alerts: this.alerts,
      recommendations: []
    };

    for (const [apiName] of this.usage) {
      const apiReport = this.getSingleAPIReport(apiName);
      report.apis[apiName] = apiReport;
      
      report.summary.totalDailyCost += apiReport.costs.daily;
      report.summary.totalMonthlyCost += apiReport.costs.monthly;
      report.summary.totalCost += apiReport.costs.total;
      
      if (apiReport.usage.requests > 0) {
        report.summary.activeAPIs++;
      }
    }

    // Add cost optimization recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  getSingleAPIReport(apiName) {
    const usage = this.usage.get(apiName);
    const costs = this.costs.get(apiName);
    const rate = this.costRates[apiName];

    if (!usage || !costs) {
      return { error: `No data for API: ${apiName}` };
    }

    return {
      api: apiName,
      usage: { ...usage },
      costs: { ...costs },
      rates: { ...rate },
      efficiency: this.calculateEfficiency(apiName, usage, costs),
      projections: this.calculateProjections(apiName, usage, costs)
    };
  }

  calculateEfficiency(apiName, usage, costs) {
    const rate = this.costRates[apiName];
    
    switch (apiName) {
      case 'openai_whisper':
        return {
          costPerRequest: usage.requests > 0 ? costs.daily / usage.requests : 0,
          avgMinutesPerRequest: usage.requests > 0 ? usage.minutes / usage.requests : 0
        };
        
      case 'anthropic_claude':
        return {
          costPerRequest: usage.requests > 0 ? costs.daily / usage.requests : 0,
          avgTokensPerRequest: usage.requests > 0 ? usage.tokens / usage.requests : 0,
          costPerToken: usage.tokens > 0 ? costs.daily / usage.tokens : 0
        };
        
      case 'elevenlabs_tts':
        return {
          costPerRequest: usage.requests > 0 ? costs.daily / usage.requests : 0,
          avgCharsPerRequest: usage.requests > 0 ? usage.characters / usage.requests : 0,
          freeUsagePercent: Math.min(100, (usage.characters / rate.freeLimit) * 100)
        };
        
      case 'google_places':
        return {
          costPerRequest: usage.requests > 0 ? costs.daily / usage.requests : 0,
          freeUsagePercent: Math.min(100, (usage.requests / rate.freeLimit) * 100)
        };
        
      default:
        return {};
    }
  }

  calculateProjections(apiName, usage, costs) {
    // Simple linear projection based on current usage
    const hoursInDay = 24;
    const daysInMonth = 30;
    const currentHour = new Date().getHours();
    
    const dailyProjection = costs.daily * (hoursInDay / Math.max(1, currentHour));
    const monthlyProjection = costs.daily * daysInMonth;
    
    return {
      projectedDailyCost: dailyProjection,
      projectedMonthlyCost: monthlyProjection,
      projectedDailyUsage: {
        requests: usage.requests * (hoursInDay / Math.max(1, currentHour))
      }
    };
  }

  generateRecommendations(report) {
    const recommendations = [];
    
    // High cost APIs
    Object.entries(report.apis).forEach(([apiName, data]) => {
      if (data.costs.daily > 0.50) {
        recommendations.push({
          type: 'cost_optimization',
          api: apiName,
          message: `Consider implementing caching for ${apiName} to reduce daily costs ($${data.costs.daily.toFixed(4)})`
        });
      }
      
      if (data.efficiency.freeUsagePercent > 80) {
        recommendations.push({
          type: 'quota_warning',
          api: apiName,
          message: `${apiName} is at ${Math.round(data.efficiency.freeUsagePercent)}% of free quota`
        });
      }
    });
    
    // Overall recommendations
    if (report.summary.totalMonthlyCost > 25) {
      recommendations.push({
        type: 'general',
        message: 'Consider upgrading to paid tiers for better rate limits and cost efficiency'
      });
    }
    
    return recommendations;
  }

  generateDashboardHTML(realTimeCosts = null) {
    const report = this.getUsageReport();
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>FindRawDogFood API Monitor</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .summary { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .api-card { background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 4px; margin: 5px 0; }
        .alert.warning { background: #fffbeb; border-color: #fed7aa; }
        .recommendation { background: #f0f9ff; border: 1px solid #bae6fd; padding: 10px; border-radius: 4px; margin: 5px 0; }
        .progress-bar { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; background: #3b82f6; transition: width 0.3s; }
        .progress-fill.warning { background: #f59e0b; }
        .progress-fill.danger { background: #ef4444; }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>FindRawDogFood API Monitor</h1>
        
        <div class="summary">
            <h2>Cost Summary</h2>
            <div class="metric">
                <div class="metric-value">$${report.summary.totalDailyCost.toFixed(4)}</div>
                <div class="metric-label">Daily Cost</div>
            </div>
            <div class="metric">
                <div class="metric-value">$${report.summary.totalMonthlyCost.toFixed(4)}</div>
                <div class="metric-label">Monthly Cost</div>
            </div>
            <div class="metric">
                <div class="metric-value">$${report.summary.totalCost.toFixed(4)}</div>
                <div class="metric-label">Total Cost (Internal)</div>
            </div>
            ${realTimeCosts ? `
            <div class="metric">
                <div class="metric-value">$${realTimeCosts.totalCost.toFixed(4)}</div>
                <div class="metric-label">Real-time Total</div>
            </div>
            ` : ''}
            <div class="metric">
                <div class="metric-value">${report.summary.activeAPIs}</div>
                <div class="metric-label">Active APIs</div>
            </div>
        </div>
        
        ${realTimeCosts ? `
        <div class="summary">
            <h2>Real-time API Costs</h2>
            ${realTimeCosts.services.map(service => `
                <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <strong>${service.service}:</strong> $${(service.totalCost || 0).toFixed(4)}
                    ${service.error ? `<span style="color: red;"> (Error: ${service.error})</span>` : ''}
                    ${service.breakdown ? `
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            ${Object.entries(service.breakdown).map(([key, data]) => 
                                `${key}: ${data.usage || 0} ${data.unit || 'units'} = $${(data.cost || 0).toFixed(4)}`
                            ).join(' | ')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
            <div style="font-size: 12px; color: #666; margin-top: 10px;">
                Last updated: ${new Date(realTimeCosts.lastUpdated).toLocaleString()}
            </div>
        </div>
        ` : ''}
        
        ${report.alerts.length > 0 ? `
        <div class="summary">
            <h2>Alerts</h2>
            ${report.alerts.map(alert => `
                <div class="alert ${alert.type.includes('warning') ? 'warning' : ''}">
                    <strong>${alert.type.toUpperCase()}:</strong> ${alert.message}
                    <small style="float: right;">${new Date(alert.timestamp).toLocaleString()}</small>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${Object.entries(report.apis).map(([apiName, data]) => `
            <div class="api-card">
                <h3>${apiName.toUpperCase()}</h3>
                <div class="metric">
                    <div class="metric-value">${data.usage.requests}</div>
                    <div class="metric-label">Requests</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$${data.costs.daily.toFixed(4)}</div>
                    <div class="metric-label">Daily Cost</div>
                </div>
                ${data.efficiency.freeUsagePercent !== undefined ? `
                    <div style="margin: 10px 0;">
                        <div style="font-size: 12px; color: #666;">Free Quota Usage</div>
                        <div class="progress-bar">
                            <div class="progress-fill ${data.efficiency.freeUsagePercent > 80 ? 'danger' : data.efficiency.freeUsagePercent > 60 ? 'warning' : ''}" 
                                 style="width: ${Math.min(100, data.efficiency.freeUsagePercent)}%"></div>
                        </div>
                        <div style="font-size: 12px;">${Math.round(data.efficiency.freeUsagePercent)}%</div>
                    </div>
                ` : ''}
            </div>
        `).join('')}
        
        ${report.recommendations.length > 0 ? `
        <div class="summary">
            <h2>Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation">
                    <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            Last updated: ${new Date(report.summary.lastUpdated).toLocaleString()}
        </div>
    </div>
</body>
</html>`;
  }

  // Reset daily counters (should be called daily via cron)
  resetDailyCounters() {
    for (const [apiName, usage] of this.usage) {
      const costs = this.costs.get(apiName);
      costs.daily = 0;
      usage.dailyTotal = 0;
      usage.lastReset = Date.now();
    }
    console.log('📅 Daily API usage counters reset');
  }

  // Get cost summary for logging
  getCostSummary() {
    const report = this.getUsageReport();
    return `💰 Daily costs: $${report.summary.totalDailyCost.toFixed(4)} | Monthly: $${report.summary.totalMonthlyCost.toFixed(4)}`;
  }
}

// Singleton instance
const apiMonitor = new APIMonitor();

export { APIMonitor, apiMonitor };