// Unified Platform Entry Point
// Serves both Rawgle and GoHunta platforms

import { Hono } from 'hono';
import { PlatformDetector } from './core/platform-detector.js';
import apiRoutes from './routes/index.js';

const app = new Hono();

// Platform detection middleware
app.use('*', async (c, next) => {
  const platform = PlatformDetector.detect(c.req);
  c.set('platform', platform);
  
  try {
    const platformConfig = await PlatformDetector.getConfig(platform, c.env.DB);
    c.set('platformConfig', platformConfig);
  } catch (error) {
    console.warn('Failed to load platform config:', error);
    c.set('platformConfig', null);
  }
  
  await next();
});

// Mount API routes
app.route('/', apiRoutes);

// Root endpoint
app.get('/', (c) => {
  const platform = c.get('platform');
  const platformConfig = c.get('platformConfig');
  
  return c.json({
    message: `Welcome to ${platformConfig?.displayName || platform} API`,
    platform,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      platform: `/api/platform/${platform}`,
      auth: '/api/auth',
      users: '/api/users',
      pets: '/api/pets',
      suppliers: '/api/suppliers'
    }
  });
});

export default app;