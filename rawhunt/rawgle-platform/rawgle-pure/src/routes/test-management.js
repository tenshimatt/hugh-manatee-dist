import { corsHeaders } from '../lib/cors.js';
import { v4 as uuidv4 } from 'uuid';

// Authentication helper for admin access
async function checkAdminAccess(request, env) {
  const adminToken = request.headers.get('X-Admin-Token');
  return adminToken && adminToken === env.ADMIN_TOKEN;
}

// Store test run result
async function storeTestRun(request, env) {
  try {
    const isAdmin = await checkAdminAccess(request, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      runId,
      testSuite,
      testType,
      status,
      startTime,
      endTime,
      duration,
      passed,
      failed,
      skipped,
      coverage,
      environment,
      branch,
      commit,
      errors,
      warnings,
      metadata
    } = body;

    if (!runId || !testSuite || !testType || !status) {
      return new Response(JSON.stringify({
        error: 'runId, testSuite, testType, and status are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if test run already exists
    const existingRun = await env.RAWGLE_KV.get(`test-run:${runId}`);
    
    const testRun = {
      runId,
      testSuite,
      testType, // unit, integration, e2e, security, performance
      status, // running, passed, failed, cancelled
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || null,
      duration: duration || null,
      results: {
        passed: passed || 0,
        failed: failed || 0,
        skipped: skipped || 0,
        total: (passed || 0) + (failed || 0) + (skipped || 0)
      },
      coverage: coverage || null,
      environment: environment || 'development',
      branch: branch || 'main',
      commit: commit || null,
      errors: errors || [],
      warnings: warnings || [],
      metadata: metadata || {},
      createdAt: existingRun ? JSON.parse(existingRun).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in KV with TTL (30 days)
    await env.RAWGLE_KV.put(
      `test-run:${runId}`,
      JSON.stringify(testRun),
      { expirationTtl: 30 * 24 * 60 * 60 }
    );

    // Store in run history list
    const historyKey = `test-history:${testSuite}`;
    const existingHistory = await env.RAWGLE_KV.get(historyKey);
    const history = existingHistory ? JSON.parse(existingHistory) : [];
    
    // Remove existing run from history if it exists
    const updatedHistory = history.filter(run => run.runId !== runId);
    
    // Add current run to beginning
    updatedHistory.unshift({
      runId,
      testSuite,
      testType,
      status,
      startTime: testRun.startTime,
      endTime: testRun.endTime,
      duration: testRun.duration,
      results: testRun.results,
      coverage: testRun.coverage ? {
        statements: testRun.coverage.statements,
        branches: testRun.coverage.branches,
        functions: testRun.coverage.functions,
        lines: testRun.coverage.lines
      } : null,
      environment: testRun.environment,
      branch: testRun.branch,
      commit: testRun.commit
    });

    // Keep only last 100 runs per suite
    const trimmedHistory = updatedHistory.slice(0, 100);

    await env.RAWGLE_KV.put(
      historyKey,
      JSON.stringify(trimmedHistory),
      { expirationTtl: 90 * 24 * 60 * 60 } // 90 days for history
    );

    return new Response(JSON.stringify({
      runId: testRun.runId,
      status: testRun.status,
      message: 'Test run stored successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Store test run error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get specific test run
async function getTestRun(request, env) {
  try {
    const url = new URL(request.url);
    const runId = url.pathname.split('/').pop();

    const testRunData = await env.RAWGLE_KV.get(`test-run:${runId}`);
    
    if (!testRunData) {
      return new Response(JSON.stringify({ error: 'Test run not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const testRun = JSON.parse(testRunData);

    return new Response(JSON.stringify(testRun), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get test run error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get test history for a suite
async function getTestHistory(request, env) {
  try {
    const url = new URL(request.url);
    const testSuite = url.searchParams.get('suite') || 'all';
    const testType = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const branch = url.searchParams.get('branch');
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    let history = [];

    if (testSuite === 'all') {
      // Get history from all suites
      const suites = ['unit', 'integration', 'e2e', 'security', 'performance'];
      
      for (const suite of suites) {
        const suiteHistory = await env.RAWGLE_KV.get(`test-history:${suite}`);
        if (suiteHistory) {
          history = history.concat(JSON.parse(suiteHistory));
        }
      }
    } else {
      const suiteHistory = await env.RAWGLE_KV.get(`test-history:${testSuite}`);
      if (suiteHistory) {
        history = JSON.parse(suiteHistory);
      }
    }

    // Apply filters
    let filteredHistory = history;

    if (testType) {
      filteredHistory = filteredHistory.filter(run => run.testType === testType);
    }

    if (status) {
      filteredHistory = filteredHistory.filter(run => run.status === status);
    }

    if (branch) {
      filteredHistory = filteredHistory.filter(run => run.branch === branch);
    }

    // Sort by start time (most recent first)
    filteredHistory.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    // Apply limit
    const paginatedHistory = filteredHistory.slice(0, limit);

    // Calculate statistics
    const stats = {
      total: filteredHistory.length,
      passed: filteredHistory.filter(run => run.status === 'passed').length,
      failed: filteredHistory.filter(run => run.status === 'failed').length,
      running: filteredHistory.filter(run => run.status === 'running').length,
      cancelled: filteredHistory.filter(run => run.status === 'cancelled').length,
      avgDuration: filteredHistory.length > 0 ? 
        filteredHistory
          .filter(run => run.duration)
          .reduce((sum, run) => sum + run.duration, 0) / 
        filteredHistory.filter(run => run.duration).length : 0,
      avgCoverage: filteredHistory.length > 0 ?
        filteredHistory
          .filter(run => run.coverage && run.coverage.statements)
          .reduce((sum, run) => sum + run.coverage.statements, 0) / 
        filteredHistory.filter(run => run.coverage && run.coverage.statements).length : 0
    };

    return new Response(JSON.stringify({
      history: paginatedHistory,
      statistics: stats,
      filters: {
        suite: testSuite,
        type: testType,
        status,
        branch,
        limit
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get test history error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get test dashboard data
async function getTestDashboard(request, env) {
  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '7d';

    // Calculate date range
    const now = new Date();
    let cutoffDate = new Date(now);
    
    switch (timeframe) {
      case '24h':
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case '7d':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        break;
    }

    // Get recent test runs from all suites
    const suites = ['unit', 'integration', 'e2e', 'security', 'performance'];
    let allRuns = [];

    for (const suite of suites) {
      const suiteHistory = await env.RAWGLE_KV.get(`test-history:${suite}`);
      if (suiteHistory) {
        const runs = JSON.parse(suiteHistory);
        allRuns = allRuns.concat(runs);
      }
    }

    // Filter by timeframe
    const filteredRuns = allRuns.filter(run => 
      new Date(run.startTime) >= cutoffDate
    );

    // Calculate dashboard metrics
    const totalRuns = filteredRuns.length;
    const passedRuns = filteredRuns.filter(run => run.status === 'passed');
    const failedRuns = filteredRuns.filter(run => run.status === 'failed');
    const runningRuns = filteredRuns.filter(run => run.status === 'running');

    const successRate = totalRuns > 0 ? (passedRuns.length / totalRuns) * 100 : 0;

    // Calculate average duration
    const completedRuns = filteredRuns.filter(run => run.duration);
    const avgDuration = completedRuns.length > 0 ?
      completedRuns.reduce((sum, run) => sum + run.duration, 0) / completedRuns.length : 0;

    // Calculate coverage trends
    const runsWithCoverage = filteredRuns.filter(run => run.coverage && run.coverage.statements);
    const avgCoverage = runsWithCoverage.length > 0 ?
      runsWithCoverage.reduce((sum, run) => sum + run.coverage.statements, 0) / runsWithCoverage.length : 0;

    // Get test type breakdown
    const typeBreakdown = {};
    const suiteBreakdown = {};
    
    filteredRuns.forEach(run => {
      typeBreakdown[run.testType] = (typeBreakdown[run.testType] || 0) + 1;
      suiteBreakdown[run.testSuite] = (suiteBreakdown[run.testSuite] || 0) + 1;
    });

    // Get recent failures
    const recentFailures = filteredRuns
      .filter(run => run.status === 'failed')
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 10);

    // Trend data (daily aggregation)
    const trendData = [];
    const days = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRuns = filteredRuns.filter(run => 
        run.startTime.startsWith(dateStr)
      );
      
      trendData.push({
        date: dateStr,
        total: dayRuns.length,
        passed: dayRuns.filter(run => run.status === 'passed').length,
        failed: dayRuns.filter(run => run.status === 'failed').length,
        avgDuration: dayRuns.length > 0 ?
          dayRuns.filter(run => run.duration)
                 .reduce((sum, run) => sum + run.duration, 0) / 
          Math.max(1, dayRuns.filter(run => run.duration).length) : 0
      });
    }

    return new Response(JSON.stringify({
      timeframe,
      overview: {
        totalRuns,
        successRate: Math.round(successRate * 100) / 100,
        avgDuration: Math.round(avgDuration),
        avgCoverage: Math.round(avgCoverage * 100) / 100,
        runningTests: runningRuns.length
      },
      breakdown: {
        byType: typeBreakdown,
        bySuite: suiteBreakdown,
        byStatus: {
          passed: passedRuns.length,
          failed: failedRuns.length,
          running: runningRuns.length
        }
      },
      recentFailures: recentFailures.map(run => ({
        runId: run.runId,
        testSuite: run.testSuite,
        testType: run.testType,
        startTime: run.startTime,
        duration: run.duration,
        branch: run.branch,
        commit: run.commit
      })),
      trends: trendData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get test dashboard error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Delete test run
async function deleteTestRun(request, env) {
  try {
    const isAdmin = await checkAdminAccess(request, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const runId = url.pathname.split('/').pop();

    // Get test run to find its suite
    const testRunData = await env.RAWGLE_KV.get(`test-run:${runId}`);
    
    if (!testRunData) {
      return new Response(JSON.stringify({ error: 'Test run not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const testRun = JSON.parse(testRunData);

    // Delete from KV
    await env.RAWGLE_KV.delete(`test-run:${runId}`);

    // Remove from history
    const historyKey = `test-history:${testRun.testSuite}`;
    const historyData = await env.RAWGLE_KV.get(historyKey);
    
    if (historyData) {
      const history = JSON.parse(historyData);
      const updatedHistory = history.filter(run => run.runId !== runId);
      
      await env.RAWGLE_KV.put(
        historyKey,
        JSON.stringify(updatedHistory),
        { expirationTtl: 90 * 24 * 60 * 60 }
      );
    }

    return new Response(JSON.stringify({
      message: 'Test run deleted successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete test run error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Main handler
export default async function handleTestManagement(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let response;

    // POST /api/test-management/runs - Store test run result
    if (path === '/api/test-management/runs' && method === 'POST') {
      response = await storeTestRun(request, env);
    }
    // GET /api/test-management/runs/{runId} - Get specific test run
    else if (path.match(/^\/api\/test-management\/runs\/[a-f0-9-]+$/) && method === 'GET') {
      response = await getTestRun(request, env);
    }
    // DELETE /api/test-management/runs/{runId} - Delete test run
    else if (path.match(/^\/api\/test-management\/runs\/[a-f0-9-]+$/) && method === 'DELETE') {
      response = await deleteTestRun(request, env);
    }
    // GET /api/test-management/history - Get test history
    else if (path === '/api/test-management/history' && method === 'GET') {
      response = await getTestHistory(request, env);
    }
    // GET /api/test-management/dashboard - Get test dashboard
    else if (path === '/api/test-management/dashboard' && method === 'GET') {
      const isAdmin = await checkAdminAccess(request, env);
      if (!isAdmin) {
        response = new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        response = await getTestDashboard(request, env);
      }
    }
    else {
      response = new Response(JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          'POST /api/test-management/runs - Store test run result',
          'GET /api/test-management/runs/{runId} - Get specific test run',
          'DELETE /api/test-management/runs/{runId} - Delete test run',
          'GET /api/test-management/history?suite=&type=&status=&branch=&limit=50 - Get test history',
          'GET /api/test-management/dashboard?timeframe=24h|7d|30d|90d - Get test dashboard'
        ]
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('Test management handler error:', error);
    const response = new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}