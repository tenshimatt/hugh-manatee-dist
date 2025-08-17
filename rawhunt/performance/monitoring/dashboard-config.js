/**
 * GoHunta Performance Monitoring Dashboard Configuration
 * Configures dashboards for Grafana, DataDog, New Relic, and custom monitoring solutions
 * Specialized for hunting app metrics and rural performance monitoring
 */

export const GrafanaDashboardConfig = {
  dashboard: {
    id: null,
    title: "GoHunta Performance Monitoring",
    tags: ["gohunta", "performance", "hunting", "mobile"],
    timezone: "browser",
    refresh: "30s",
    time: {
      from: "now-1h",
      to: "now"
    },
    variables: [
      {
        name: "environment",
        type: "custom",
        options: [
          { text: "Production", value: "production" },
          { text: "Staging", value: "staging" },
          { text: "Development", value: "development" }
        ],
        current: { text: "Production", value: "production" }
      },
      {
        name: "region",
        type: "query",
        query: "label_values(gohunta_performance_score, region)",
        refresh: "on_dashboard_load"
      }
    ],
    panels: [
      // Row 1: Overall Performance Overview
      {
        id: 1,
        title: "Performance Score Overview",
        type: "stat",
        gridPos: { h: 8, w: 6, x: 0, y: 0 },
        targets: [{
          expr: 'gohunta_performance_score{environment="$environment"}',
          legendFormat: "Performance Score"
        }],
        options: {
          reduceOptions: {
            values: false,
            calcs: ["lastNotNull"],
            fields: ""
          },
          orientation: "auto",
          textMode: "auto",
          colorMode: "value",
          graphMode: "area",
          justifyMode: "auto"
        },
        fieldConfig: {
          defaults: {
            color: { mode: "thresholds" },
            mappings: [],
            thresholds: {
              steps: [
                { color: "red", value: null },
                { color: "yellow", value: 70 },
                { color: "green", value: 85 }
              ]
            },
            min: 0,
            max: 100,
            unit: "short"
          }
        }
      },
      {
        id: 2,
        title: "Test Suites Status",
        type: "stat",
        gridPos: { h: 8, w: 6, x: 6, y: 0 },
        targets: [{
          expr: 'sum(gohunta_test_suite_passed{environment="$environment"})',
          legendFormat: "Passed"
        }, {
          expr: 'sum(gohunta_test_suite_total{environment="$environment"})',
          legendFormat: "Total"
        }],
        options: {
          reduceOptions: {
            values: false,
            calcs: ["lastNotNull"],
            fields: ""
          },
          orientation: "auto",
          textMode: "value_and_name",
          colorMode: "value"
        }
      },
      {
        id: 3,
        title: "Critical Issues",
        type: "stat",
        gridPos: { h: 8, w: 6, x: 12, y: 0 },
        targets: [{
          expr: 'gohunta_critical_issues{environment="$environment"}',
          legendFormat: "Critical Issues"
        }],
        fieldConfig: {
          defaults: {
            color: { mode: "thresholds" },
            thresholds: {
              steps: [
                { color: "green", value: null },
                { color: "yellow", value: 1 },
                { color: "red", value: 3 }
              ]
            }
          }
        }
      },
      {
        id: 4,
        title: "Performance Trend (24h)",
        type: "timeseries",
        gridPos: { h: 8, w: 6, x: 18, y: 0 },
        targets: [{
          expr: 'gohunta_performance_score{environment="$environment"}',
          legendFormat: "Performance Score"
        }],
        fieldConfig: {
          defaults: {
            color: { mode: "palette-classic" },
            custom: {
              axisLabel: "",
              axisPlacement: "auto",
              barAlignment: 0,
              drawStyle: "line",
              fillOpacity: 10,
              gradientMode: "none",
              hideFrom: {
                legend: false,
                tooltip: false,
                vis: false
              },
              lineInterpolation: "linear",
              lineWidth: 2,
              pointSize: 5,
              scaleDistribution: {
                type: "linear"
              },
              showPoints: "never",
              spanNulls: false,
              stacking: {
                group: "A",
                mode: "none"
              },
              thresholdsStyle: {
                mode: "off"
              }
            },
            max: 100,
            min: 0
          }
        }
      },

      // Row 2: Mobile Performance Metrics
      {
        id: 10,
        title: "Mobile Performance",
        type: "row",
        gridPos: { h: 1, w: 24, x: 0, y: 8 },
        collapsed: false
      },
      {
        id: 11,
        title: "GPS Lock Time",
        type: "timeseries",
        gridPos: { h: 8, w: 8, x: 0, y: 9 },
        targets: [{
          expr: 'gohunta_mobile_gps_lock_time{environment="$environment"}',
          legendFormat: "GPS Lock Time (ms)"
        }],
        fieldConfig: {
          defaults: {
            unit: "ms",
            color: { mode: "palette-classic" },
            custom: {
              axisLabel: "Time (ms)",
              drawStyle: "line",
              lineWidth: 2,
              fillOpacity: 10
            },
            thresholds: {
              steps: [
                { color: "green", value: null },
                { color: "yellow", value: 5000 },
                { color: "red", value: 10000 }
              ]
            }
          }
        }
      },
      {
        id: 12,
        title: "Battery Drain Rate",
        type: "timeseries",
        gridPos: { h: 8, w: 8, x: 8, y: 9 },
        targets: [{
          expr: 'gohunta_mobile_battery_drain_per_hour{environment="$environment"}',
          legendFormat: "Battery Drain (%/hour)"
        }],
        fieldConfig: {
          defaults: {
            unit: "percent",
            color: { mode: "palette-classic" },
            thresholds: {
              steps: [
                { color: "green", value: null },
                { color: "yellow", value: 3 },
                { color: "red", value: 5 }
              ]
            }
          }
        }
      },
      {
        id: 13,
        title: "3G Network Performance",
        type: "timeseries",
        gridPos: { h: 8, w: 8, x: 16, y: 9 },
        targets: [{
          expr: 'gohunta_mobile_3g_load_time{environment="$environment"}',
          legendFormat: "3G Load Time (ms)"
        }],
        fieldConfig: {
          defaults: {
            unit: "ms",
            thresholds: {
              steps: [
                { color: "green", value: null },
                { color: "yellow", value: 1500 },
                { color: "red", value: 2000 }
              ]
            }
          }
        }
      },

      // Row 3: API Performance Metrics
      {
        id: 20,
        title: "API Performance",
        type: "row",
        gridPos: { h: 1, w: 24, x: 0, y: 17 },
        collapsed: false
      },
      {
        id: 21,
        title: "API Response Times",
        type: "timeseries",
        gridPos: { h: 8, w: 12, x: 0, y: 18 },
        targets: [
          {
            expr: 'histogram_quantile(0.50, rate(gohunta_api_request_duration_seconds_bucket{environment="$environment"}[5m]))',
            legendFormat: "50th percentile"
          },
          {
            expr: 'histogram_quantile(0.95, rate(gohunta_api_request_duration_seconds_bucket{environment="$environment"}[5m]))',
            legendFormat: "95th percentile"
          },
          {
            expr: 'histogram_quantile(0.99, rate(gohunta_api_request_duration_seconds_bucket{environment="$environment"}[5m]))',
            legendFormat: "99th percentile"
          }
        ],
        fieldConfig: {
          defaults: {
            unit: "s",
            color: { mode: "palette-classic" }
          }
        }
      },
      {
        id: 22,
        title: "API Error Rate",
        type: "timeseries",
        gridPos: { h: 8, w: 12, x: 12, y: 18 },
        targets: [{
          expr: 'rate(gohunta_api_requests_total{status=~"5.."}[5m]) / rate(gohunta_api_requests_total[5m])',
          legendFormat: "Error Rate"
        }],
        fieldConfig: {
          defaults: {
            unit: "percentunit",
            color: { mode: "palette-classic" },
            thresholds: {
              steps: [
                { color: "green", value: null },
                { color: "yellow", value: 0.01 },
                { color: "red", value: 0.05 }
              ]
            }
          }
        }
      },

      // Row 4: Edge Computing & CDN
      {
        id: 30,
        title: "Edge Computing & CDN",
        type: "row",
        gridPos: { h: 1, w: 24, x: 0, y: 26 },
        collapsed: false
      },
      {
        id: 31,
        title: "Cloudflare Workers Performance",
        type: "timeseries",
        gridPos: { h: 8, w: 8, x: 0, y: 27 },
        targets: [{
          expr: 'gohunta_worker_response_time{environment="$environment"}',
          legendFormat: "Worker Response Time"
        }],
        fieldConfig: {
          defaults: {
            unit: "ms",
            thresholds: {
              steps: [
                { color: "green", value: null },
                { color: "yellow", value: 75 },
                { color: "red", value: 100 }
              ]
            }
          }
        }
      },
      {
        id: 32,
        title: "Cache Hit Ratio",
        type: "stat",
        gridPos: { h: 8, w: 8, x: 8, y: 27 },
        targets: [{
          expr: 'gohunta_cache_hit_ratio{environment="$environment"}',
          legendFormat: "Cache Hit Ratio"
        }],
        fieldConfig: {
          defaults: {
            unit: "percentunit",
            thresholds: {
              steps: [
                { color: "red", value: null },
                { color: "yellow", value: 0.80 },
                { color: "green", value: 0.90 }
              ]
            }
          }
        }
      },
      {
        id: 33,
        title: "Rural Coverage Quality",
        type: "geomap",
        gridPos: { h: 8, w: 8, x: 16, y: 27 },
        targets: [{
          expr: 'gohunta_rural_coverage_latency{environment="$environment"}',
          legendFormat: "{{region}}"
        }],
        options: {
          view: {
            id: "coords",
            lat: 39.8283,
            lon: -98.5795,
            zoom: 4
          }
        }
      },

      // Row 5: PWA & Offline Performance
      {
        id: 40,
        title: "PWA & Offline Performance",
        type: "row",
        gridPos: { h: 1, w: 24, x: 0, y: 35 },
        collapsed: false
      },
      {
        id: 41,
        title: "Service Worker Performance",
        type: "timeseries",
        gridPos: { h: 8, w: 8, x: 0, y: 36 },
        targets: [
          {
            expr: 'gohunta_sw_install_time{environment="$environment"}',
            legendFormat: "Install Time"
          },
          {
            expr: 'gohunta_sw_cache_time{environment="$environment"}',
            legendFormat: "Cache Population Time"
          }
        ],
        fieldConfig: {
          defaults: {
            unit: "ms"
          }
        }
      },
      {
        id: 42,
        title: "Offline Boot Time",
        type: "timeseries",
        gridPos: { h: 8, w: 8, x: 8, y: 36 },
        targets: [{
          expr: 'gohunta_offline_boot_time{environment="$environment"}',
          legendFormat: "Offline Boot Time"
        }],
        fieldConfig: {
          defaults: {
            unit: "ms",
            thresholds: {
              steps: [
                { color: "green", value: null },
                { color: "yellow", value: 300 },
                { color: "red", value: 500 }
              ]
            }
          }
        }
      },
      {
        id: 43,
        title: "IndexedDB Operations",
        type: "timeseries",
        gridPos: { h: 8, w: 8, x: 16, y: 36 },
        targets: [
          {
            expr: 'gohunta_indexeddb_write_time{environment="$environment"}',
            legendFormat: "Write Time"
          },
          {
            expr: 'gohunta_indexeddb_read_time{environment="$environment"}',
            legendFormat: "Read Time"
          }
        ],
        fieldConfig: {
          defaults: {
            unit: "ms"
          }
        }
      },

      // Row 6: User Experience Metrics
      {
        id: 50,
        title: "Real User Experience",
        type: "row",
        gridPos: { h: 1, w: 24, x: 0, y: 44 },
        collapsed: false
      },
      {
        id: 51,
        title: "Core Web Vitals",
        type: "timeseries",
        gridPos: { h: 8, w: 12, x: 0, y: 45 },
        targets: [
          {
            expr: 'gohunta_web_vitals_lcp{environment="$environment"}',
            legendFormat: "Largest Contentful Paint"
          },
          {
            expr: 'gohunta_web_vitals_fid{environment="$environment"}',
            legendFormat: "First Input Delay"
          },
          {
            expr: 'gohunta_web_vitals_cls{environment="$environment"}',
            legendFormat: "Cumulative Layout Shift"
          }
        ]
      },
      {
        id: 52,
        title: "User Satisfaction Score",
        type: "stat",
        gridPos: { h: 8, w: 6, x: 12, y: 45 },
        targets: [{
          expr: 'gohunta_user_satisfaction_score{environment="$environment"}',
          legendFormat: "Satisfaction Score"
        }],
        fieldConfig: {
          defaults: {
            unit: "short",
            min: 0,
            max: 5,
            thresholds: {
              steps: [
                { color: "red", value: null },
                { color: "yellow", value: 3 },
                { color: "green", value: 4 }
              ]
            }
          }
        }
      },
      {
        id: 53,
        title: "Connection Types",
        type: "piechart",
        gridPos: { h: 8, w: 6, x: 18, y: 45 },
        targets: [{
          expr: 'gohunta_connection_type_distribution{environment="$environment"}',
          legendFormat: "{{connection_type}}"
        }]
      }
    ]
  }
};

export const DataDogDashboardConfig = {
  title: "GoHunta Performance Monitoring",
  description: "Comprehensive performance monitoring for GoHunta hunting app",
  template_variables: [
    {
      name: "environment",
      prefix: "environment",
      default: "production"
    },
    {
      name: "region", 
      prefix: "region",
      default: "*"
    }
  ],
  widgets: [
    {
      definition: {
        type: "query_value",
        requests: [
          {
            q: "avg:gohunta.performance.score{environment:$environment}",
            aggregator: "avg"
          }
        ],
        title: "Performance Score",
        precision: 0
      }
    },
    {
      definition: {
        type: "timeseries",
        requests: [
          {
            q: "avg:gohunta.mobile.gps_lock_time{environment:$environment}",
            display_type: "line",
            style: {
              palette: "dog_classic",
              line_type: "solid",
              line_width: "normal"
            }
          }
        ],
        title: "GPS Lock Time",
        yaxis: {
          scale: "linear",
          label: "Milliseconds",
          include_zero: true,
          min: "auto",
          max: "auto"
        }
      }
    },
    {
      definition: {
        type: "heatmap", 
        requests: [
          {
            q: "avg:gohunta.api.response_time{environment:$environment} by {endpoint}",
            style: {
              palette: "dog_classic"
            }
          }
        ],
        title: "API Response Time Heatmap"
      }
    },
    {
      definition: {
        type: "toplist",
        requests: [
          {
            q: "top(avg:gohunta.performance.issues{environment:$environment} by {category}, 10, 'sum', 'desc')",
            style: {
              palette: "dog_classic"
            }
          }
        ],
        title: "Top Performance Issues"
      }
    }
  ]
};

export const NewRelicDashboardConfig = {
  name: "GoHunta Performance Dashboard",
  description: "Performance monitoring for hunting app with rural focus",
  permissions: "PUBLIC_READ_WRITE",
  pages: [
    {
      name: "Overview",
      description: "High-level performance overview",
      widgets: [
        {
          title: "Performance Score",
          layout: {
            column: 1,
            row: 1,
            width: 4,
            height: 3
          },
          rawConfiguration: {
            nrqlQueries: [
              {
                query: "SELECT average(performance_score) FROM GoHuntaPerformance WHERE environment = '{{environment}}' SINCE 1 hour ago",
                accountId: "YOUR_ACCOUNT_ID"
              }
            ]
          }
        },
        {
          title: "Mobile GPS Performance",
          layout: {
            column: 5,
            row: 1,
            width: 8,
            height: 3
          },
          rawConfiguration: {
            nrqlQueries: [
              {
                query: "SELECT average(gps_lock_time) FROM GoHuntaMobile WHERE environment = '{{environment}}' SINCE 1 hour ago TIMESERIES",
                accountId: "YOUR_ACCOUNT_ID"
              }
            ]
          }
        },
        {
          title: "API Performance by Region",
          layout: {
            column: 1,
            row: 4,
            width: 12,
            height: 4
          },
          rawConfiguration: {
            nrqlQueries: [
              {
                query: "SELECT percentile(response_time, 95) FROM GoHuntaAPI WHERE environment = '{{environment}}' FACET region SINCE 1 hour ago TIMESERIES",
                accountId: "YOUR_ACCOUNT_ID"
              }
            ]
          }
        }
      ]
    },
    {
      name: "Rural Performance",
      description: "Performance metrics specific to rural hunting areas",
      widgets: [
        {
          title: "Rural Coverage Map",
          layout: {
            column: 1,
            row: 1,
            width: 12,
            height: 6
          },
          rawConfiguration: {
            nrqlQueries: [
              {
                query: "SELECT average(latency) FROM GoHuntaEdge WHERE rural = true FACET region SINCE 1 day ago",
                accountId: "YOUR_ACCOUNT_ID"
              }
            ]
          }
        }
      ]
    }
  ],
  variables: [
    {
      name: "environment",
      items: [
        {
          title: "Production",
          value: "production"
        },
        {
          title: "Staging", 
          value: "staging"
        }
      ],
      defaultValues: ["production"],
      nrqlQuery: {
        query: "SELECT uniques(environment) FROM GoHuntaPerformance",
        accountId: "YOUR_ACCOUNT_ID"
      },
      replacementStrategy: "STRING"
    }
  ]
};

export const CustomDashboardConfig = {
  // Configuration for custom React dashboard
  layout: {
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    rowHeight: 60
  },
  
  widgets: [
    {
      id: "performance-score",
      type: "metric-card",
      title: "Performance Score",
      layout: { x: 0, y: 0, w: 3, h: 4 },
      config: {
        metric: "performance_score",
        threshold: { warning: 70, critical: 50 },
        format: "number",
        suffix: "/100"
      }
    },
    {
      id: "gps-performance",
      type: "line-chart",
      title: "GPS Lock Time Trend",
      layout: { x: 3, y: 0, w: 6, h: 4 },
      config: {
        metrics: ["gps_lock_time"],
        timeRange: "1h",
        yAxis: { label: "Time (ms)", max: 15000 }
      }
    },
    {
      id: "api-heatmap",
      type: "heatmap",
      title: "API Response Time by Endpoint",
      layout: { x: 0, y: 4, w: 9, h: 6 },
      config: {
        metric: "api_response_time",
        groupBy: "endpoint",
        colorScheme: "RdYlGn"
      }
    },
    {
      id: "rural-coverage",
      type: "geo-map",
      title: "Rural Coverage Quality",
      layout: { x: 9, y: 0, w: 3, h: 10 },
      config: {
        metric: "rural_latency",
        center: [39.8283, -98.5795],
        zoom: 4,
        colorMetric: "latency"
      }
    },
    {
      id: "alerts-list",
      type: "alert-list",
      title: "Active Performance Alerts",
      layout: { x: 0, y: 10, w: 12, h: 4 },
      config: {
        maxItems: 10,
        severity: ["critical", "warning"]
      }
    }
  ],
  
  alerts: [
    {
      id: "high-gps-lock-time",
      name: "High GPS Lock Time",
      condition: "gps_lock_time > 10000",
      severity: "critical",
      message: "GPS lock time exceeding 10 seconds"
    },
    {
      id: "low-performance-score", 
      name: "Low Performance Score",
      condition: "performance_score < 70",
      severity: "warning",
      message: "Overall performance score below threshold"
    },
    {
      id: "high-api-latency",
      name: "High API Latency",
      condition: "avg(api_response_time) > 500",
      severity: "critical",
      message: "API response time exceeding 500ms"
    },
    {
      id: "poor-rural-coverage",
      name: "Poor Rural Coverage",
      condition: "rural_coverage_quality < 0.8",
      severity: "warning", 
      message: "Rural area performance degraded"
    }
  ]
};

export const PrometheusAlertsConfig = {
  groups: [
    {
      name: "gohunta.performance",
      rules: [
        {
          alert: "HighGPSLockTime",
          expr: "gohunta_mobile_gps_lock_time > 10000",
          for: "5m",
          labels: {
            severity: "critical",
            category: "mobile"
          },
          annotations: {
            summary: "GPS lock time is too high",
            description: "GPS lock time has been above 10 seconds for more than 5 minutes"
          }
        },
        {
          alert: "LowPerformanceScore", 
          expr: "gohunta_performance_score < 70",
          for: "10m",
          labels: {
            severity: "warning",
            category: "overall"
          },
          annotations: {
            summary: "Performance score is below threshold",
            description: "Overall performance score has been below 70 for more than 10 minutes"
          }
        },
        {
          alert: "HighAPILatency",
          expr: "histogram_quantile(0.95, rate(gohunta_api_request_duration_seconds_bucket[5m])) > 0.5",
          for: "3m",
          labels: {
            severity: "critical",
            category: "api"
          },
          annotations: {
            summary: "API response time is too high",
            description: "95th percentile API response time has been above 500ms for more than 3 minutes"
          }
        },
        {
          alert: "PoorRuralCoverage",
          expr: "gohunta_rural_coverage_quality < 0.8",
          for: "15m",
          labels: {
            severity: "warning",
            category: "rural"
          },
          annotations: {
            summary: "Rural area performance is degraded",
            description: "Rural coverage quality has been below 80% for more than 15 minutes"
          }
        }
      ]
    }
  ]
};

export default {
  GrafanaDashboardConfig,
  DataDogDashboardConfig,
  NewRelicDashboardConfig,
  CustomDashboardConfig,
  PrometheusAlertsConfig
};