import request from 'supertest';
import { JSDOM } from 'jsdom';
import { server } from '../../src/server';

/**
 * TDD Portal CSP Compliance Tests
 * 
 * This test suite verifies that the TDD portal complies with Content Security Policy
 * requirements and can properly load fonts and execute scripts.
 */
describe('TDD Portal CSP Compliance', () => {
  let app: any;

  beforeAll(async () => {
    app = server.getApp();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('CSP Headers Configuration', () => {
    it('should return proper CSP headers for TDD portal', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      // Check if CSP header is present
      expect(response.headers['content-security-policy']).toBeDefined();
      
      const cspHeader = response.headers['content-security-policy'];
      
      // Verify CSP directives are correctly set
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
      expect(cspHeader).toContain("script-src 'self' 'unsafe-inline'");
      expect(cspHeader).toContain("img-src 'self' data: https:");
      expect(cspHeader).toContain("connect-src 'self'");
      expect(cspHeader).toContain("font-src 'self' data:");
      expect(cspHeader).toContain("object-src 'none'");
      expect(cspHeader).toContain("media-src 'self'");
      expect(cspHeader).toContain("frame-src 'none'");
    });

    it('should allow inline styles as specified in CSP', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const cspHeader = response.headers['content-security-policy'];
      expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
    });

    it('should allow inline scripts as specified in CSP', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const cspHeader = response.headers['content-security-policy'];
      expect(cspHeader).toContain("script-src 'self' 'unsafe-inline'");
    });

    it('should allow data URIs for fonts', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const cspHeader = response.headers['content-security-policy'];
      expect(cspHeader).toContain("font-src 'self' data:");
    });
  });

  describe('HTML Content Validation', () => {
    it('should return valid HTML structure', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('<html lang="en">');
      expect(response.text).toContain('TDD Automation Management Portal');
    });

    it('should include proper meta tags', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      const charsetMeta = document.querySelector('meta[charset]');
      expect(charsetMeta?.getAttribute('charset')).toBe('UTF-8');

      const viewportMeta = document.querySelector('meta[name="viewport"]');
      expect(viewportMeta?.getAttribute('content')).toBe('width=device-width, initial-scale=1.0');
    });

    it('should have inline CSS within style tags', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      const styleElements = document.querySelectorAll('style');
      expect(styleElements.length).toBeGreaterThan(0);

      // Check if essential styles are present
      const styleContent = Array.from(styleElements).map(el => el.textContent).join('');
      expect(styleContent).toContain('body');
      expect(styleContent).toContain('.header');
      expect(styleContent).toContain('.btn');
    });

    it('should have inline JavaScript within script tags', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      const scriptElements = document.querySelectorAll('script');
      expect(scriptElements.length).toBeGreaterThan(0);

      // Check if essential JavaScript functions are present
      const scriptContent = Array.from(scriptElements).map(el => el.textContent).join('');
      expect(scriptContent).toContain('loadStatus');
      expect(scriptContent).toContain('runTests');
      expect(scriptContent).toContain('API_BASE');
    });
  });

  describe('Font Loading Compatibility', () => {
    it('should use only system fonts that work with CSP', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      const styleElements = document.querySelectorAll('style');
      const styleContent = Array.from(styleElements).map(el => el.textContent).join('');

      // Check for system fonts that should work with CSP
      expect(styleContent).toContain('-apple-system');
      expect(styleContent).toContain('BlinkMacSystemFont');
      expect(styleContent).toContain('Roboto');
      expect(styleContent).toContain('sans-serif');

      // Should NOT contain external font URLs that would violate CSP
      expect(styleContent).not.toContain('@import url');
      expect(styleContent).not.toContain('fonts.googleapis.com');
      expect(styleContent).not.toContain('fonts.gstatic.com');
    });

    it('should not include external font references', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      // Check for link elements that might load external fonts
      const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
      linkElements.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          expect(href).not.toContain('fonts.googleapis.com');
          expect(href).not.toContain('fonts.gstatic.com');
          expect(href).not.toContain('cdnjs.cloudflare.com');
        }
      });
    });
  });

  describe('JavaScript Execution Compliance', () => {
    it('should have properly formatted inline event handlers', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      // Check onclick handlers on buttons
      const buttons = document.querySelectorAll('button[onclick]');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        const onclick = button.getAttribute('onclick');
        expect(onclick).toBeTruthy();
        // Should be simple function calls, not complex scripts
        expect(onclick).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*\([^;]*\)$/);
      });
    });

    it('should have script content that complies with CSP', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      const scriptElements = document.querySelectorAll('script');
      scriptElements.forEach(script => {
        // Should not have src attribute pointing to external resources
        const src = script.getAttribute('src');
        if (src) {
          expect(src).not.toContain('http://');
          expect(src).not.toContain('https://');
          expect(src).not.toContain('//');
        }

        // Should have inline content
        expect(script.textContent).toBeTruthy();
      });
    });

    it('should define required JavaScript functions', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      const scriptContent = Array.from(document.querySelectorAll('script'))
        .map(el => el.textContent)
        .join('');

      // Check for essential functions
      expect(scriptContent).toContain('async function loadStatus()');
      expect(scriptContent).toContain('async function loadLatestReport()');
      expect(scriptContent).toContain('async function loadLogs()');
      expect(scriptContent).toContain('async function runTests(');
      expect(scriptContent).toContain('function runTestsWithCoverage()');
      expect(scriptContent).toContain('function refreshStatus()');
      expect(scriptContent).toContain('function viewLogs()');
    });
  });

  describe('API Endpoints Integration', () => {
    it('should define correct API base URL', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const scriptContent = response.text;
      expect(scriptContent).toContain("const API_BASE = window.location.origin + '/api/v1/tdd'");
    });

    it('should use fetch API with proper CORS configuration', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const scriptContent = response.text;
      
      // Check for proper fetch usage
      expect(scriptContent).toContain('await fetch(API_BASE +');
      expect(scriptContent).toContain("headers: { 'Content-Type': 'application/json' }");
    });
  });

  describe('Cache Busting Mechanisms', () => {
    it('should include timestamp parameters for cache busting', async () => {
      const response1 = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const response2 = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      // Responses should include dynamic content (timestamps)
      expect(response1.text).toContain('new Date().toISOString()');
      expect(response2.text).toContain('new Date().toISOString()');
    });

    it('should have proper cache control headers', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      // For HTML content, we might want no-cache or short cache
      const cacheControl = response.headers['cache-control'];
      // This is optional - depends on caching strategy
      if (cacheControl) {
        expect(cacheControl).toMatch(/(no-cache|max-age=\d+)/);
      }
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should have proper error handling in JavaScript', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const scriptContent = response.text;

      // Check for try-catch blocks
      expect(scriptContent).toContain('try {');
      expect(scriptContent).toContain('} catch (error) {');
      
      // Check for error logging
      expect(scriptContent).toContain('console.error(');
    });

    it('should handle loading states properly', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      // Check for loading indicators
      const loadingElements = document.querySelectorAll('.loading');
      expect(loadingElements.length).toBeGreaterThan(0);

      loadingElements.forEach(element => {
        expect(element.textContent).toContain('Loading...');
      });
    });
  });

  describe('Responsive Design and Mobile Compatibility', () => {
    it('should include responsive CSS media queries', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const styleContent = response.text;
      expect(styleContent).toContain('@media (max-width: 768px)');
    });

    it('should have proper viewport configuration', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const dom = new JSDOM(response.text);
      const document = dom.window.document;

      const viewportMeta = document.querySelector('meta[name="viewport"]');
      expect(viewportMeta?.getAttribute('content')).toBe('width=device-width, initial-scale=1.0');
    });
  });

  describe('Performance and Optimization', () => {
    it('should minimize inline styles and scripts', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      // Basic check for reasonable content size
      expect(response.text.length).toBeLessThan(100000); // Less than 100KB

      // Should not have excessive whitespace
      const minifiedSize = response.text.replace(/\s+/g, ' ').length;
      const originalSize = response.text.length;
      const compressionRatio = minifiedSize / originalSize;
      
      // Some level of minification should be possible
      expect(compressionRatio).toBeLessThan(0.8);
    });

    it('should use efficient CSS selectors', async () => {
      const response = await request(app)
        .get('/api/v1/tdd/')
        .expect(200);

      const styleContent = response.text;
      
      // Should use class selectors efficiently
      expect(styleContent).toContain('.card');
      expect(styleContent).toContain('.btn');
      expect(styleContent).toContain('.status');
      
      // Should avoid overly complex selectors
      expect(styleContent).not.toMatch(/[.#]\w+\s+[.#]\w+\s+[.#]\w+\s+[.#]\w+/);
    });
  });
});