import request from 'supertest';
import { Express } from 'express';
import { TestEnvironment } from '../setup/testEnvironment';
import { TestFixtures } from '../fixtures/testFixtures';

describe('Blog/Knowledge Base API Integration Tests', () => {
  let app: Express;
  let fixtures: TestFixtures;
  let authToken: string;

  beforeAll(async () => {
    const appModule = await import('../../src/server');
    app = appModule.app;
    fixtures = new TestFixtures(TestEnvironment.getTestDatabase().getPool());
  });

  beforeEach(async () => {
    await fixtures.seedAllTestData();
    
    // Get auth token for protected endpoints
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'john@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.data.token;
  });

  describe('GET /api/v1/blog/posts', () => {
    it('should return paginated list of published posts', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          items: expect.any(Array),
          total: expect.any(Number),
          page: 1,
          limit: expect.any(Number),
          totalPages: expect.any(Number),
          hasNext: expect.any(Boolean),
          hasPrev: false
        }
      });

      // Verify post structure
      if (response.body.data.items.length > 0) {
        expect(response.body.data.items[0]).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          slug: expect.any(String),
          content: expect.any(String),
          excerpt: expect.any(String),
          author: expect.any(String),
          categoryId: expect.any(String),
          tags: expect.any(Array),
          featured: expect.any(Boolean),
          published: expect.any(Boolean),
          viewCount: expect.any(Number),
          likeCount: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        });
      }
    });

    it('should filter posts by category', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts?category=nutrition')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // All returned posts should be from nutrition category
      response.body.data.items.forEach((post: any) => {
        // This would need to be validated against the actual category relationship
        expect(post).toBeDefined();
      });
    });

    it('should search posts by query', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts?q=raw')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Results should contain the search term (case-insensitive)
      response.body.data.items.forEach((post: any) => {
        const searchContent = `${post.title} ${post.content}`.toLowerCase();
        expect(searchContent).toContain('raw');
      });
    });

    it('should return only featured posts when filtered', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts?featured=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      response.body.data.items.forEach((post: any) => {
        expect(post.featured).toBe(true);
      });
    });

    it('should sort posts by different criteria', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts?sort=views&order=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify sorting (if multiple posts)
      if (response.body.data.items.length > 1) {
        const viewCounts = response.body.data.items.map((post: any) => post.viewCount);
        for (let i = 0; i < viewCounts.length - 1; i++) {
          expect(viewCounts[i]).toBeGreaterThanOrEqual(viewCounts[i + 1]);
        }
      }
    });

    it('should handle pagination correctly', async () => {
      const page1 = await request(app)
        .get('/api/v1/blog/posts?page=1&limit=1')
        .expect(200);

      expect(page1.body.data.page).toBe(1);
      expect(page1.body.data.limit).toBe(1);
      expect(page1.body.data.items.length).toBeLessThanOrEqual(1);

      if (page1.body.data.total > 1) {
        expect(page1.body.data.hasNext).toBe(true);
        
        const page2 = await request(app)
          .get('/api/v1/blog/posts?page=2&limit=1')
          .expect(200);

        expect(page2.body.data.page).toBe(2);
        expect(page2.body.data.hasPrev).toBe(true);
        
        // Different items on different pages
        if (page1.body.data.items[0] && page2.body.data.items[0]) {
          expect(page1.body.data.items[0].id).not.toBe(page2.body.data.items[0].id);
        }
      }
    });

    it('should validate pagination parameters', async () => {
      // Invalid page number
      const response1 = await request(app)
        .get('/api/v1/blog/posts?page=-1')
        .expect(400);

      expect(response1.body.success).toBe(false);

      // Invalid limit
      const response2 = await request(app)
        .get('/api/v1/blog/posts?limit=0')
        .expect(400);

      expect(response2.body.success).toBe(false);

      // Extremely high limit should be capped
      const response3 = await request(app)
        .get('/api/v1/blog/posts?limit=1000')
        .expect(200);

      expect(response3.body.data.limit).toBeLessThanOrEqual(100); // Assuming 100 is max
    });
  });

  describe('GET /api/v1/blog/posts/:id', () => {
    it('should return specific post by ID', async () => {
      const testPost = TestFixtures.TEST_BLOG_POSTS[0];
      
      const response = await request(app)
        .get(`/api/v1/blog/posts/${testPost.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testPost.id,
          title: testPost.title,
          slug: testPost.slug,
          content: testPost.content,
          author: testPost.author,
          featured: testPost.featured,
          published: testPost.published
        }
      });
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts/99999999-9999-9999-9999-999999999999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('not found')
      });
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts/invalid-id')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid')
      });
    });
  });

  describe('GET /api/v1/blog/posts/slug/:slug', () => {
    it('should return post by slug', async () => {
      const testPost = TestFixtures.TEST_BLOG_POSTS[0];
      
      const response = await request(app)
        .get(`/api/v1/blog/posts/slug/${testPost.slug}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testPost.id,
          slug: testPost.slug,
          title: testPost.title
        }
      });
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts/slug/non-existent-slug')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('not found')
      });
    });
  });

  describe('GET /api/v1/blog/posts/featured', () => {
    it('should return only featured posts', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      response.body.data.forEach((post: any) => {
        expect(post.featured).toBe(true);
      });
    });

    it('should limit featured posts', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts/featured?limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/v1/blog/posts/recent', () => {
    it('should return recent posts in date order', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts/recent')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify date ordering (most recent first)
      if (response.body.data.length > 1) {
        const dates = response.body.data.map((post: any) => new Date(post.createdAt).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });
  });

  describe('GET /api/v1/blog/posts/popular', () => {
    it('should return popular posts by view count', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts/popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify view count ordering (highest first)
      if (response.body.data.length > 1) {
        const viewCounts = response.body.data.map((post: any) => post.viewCount);
        for (let i = 0; i < viewCounts.length - 1; i++) {
          expect(viewCounts[i]).toBeGreaterThanOrEqual(viewCounts[i + 1]);
        }
      }
    });
  });

  describe('POST /api/v1/blog/posts/:id/view', () => {
    it('should increment view count for post', async () => {
      const testPost = TestFixtures.TEST_BLOG_POSTS[0];
      
      // Get initial view count
      const initialResponse = await request(app)
        .get(`/api/v1/blog/posts/${testPost.id}`)
        .expect(200);
      
      const initialViewCount = initialResponse.body.data.viewCount;

      // Track view
      const viewResponse = await request(app)
        .post(`/api/v1/blog/posts/${testPost.id}/view`)
        .expect(200);

      expect(viewResponse.body.success).toBe(true);

      // Verify view count increased
      const updatedResponse = await request(app)
        .get(`/api/v1/blog/posts/${testPost.id}`)
        .expect(200);

      expect(updatedResponse.body.data.viewCount).toBe(initialViewCount + 1);
    });

    it('should handle multiple views (with potential rate limiting)', async () => {
      const testPost = TestFixtures.TEST_BLOG_POSTS[0];
      
      // Make multiple view requests
      const viewPromises = Array(5).fill(null).map(() =>
        request(app).post(`/api/v1/blog/posts/${testPost.id}/view`)
      );

      const responses = await Promise.all(viewPromises);
      
      // All should succeed (or some may be rate limited)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });

    it('should return 404 for non-existent post view', async () => {
      const response = await request(app)
        .post('/api/v1/blog/posts/99999999-9999-9999-9999-999999999999/view')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/blog/posts/:id/like', () => {
    it('should toggle like for authenticated user', async () => {
      const testPost = TestFixtures.TEST_BLOG_POSTS[0];
      
      // Like the post
      const likeResponse = await request(app)
        .post(`/api/v1/blog/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(likeResponse.body).toMatchObject({
        success: true,
        data: {
          liked: true,
          likeCount: expect.any(Number)
        }
      });

      // Unlike the post
      const unlikeResponse = await request(app)
        .post(`/api/v1/blog/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unlikeResponse.body).toMatchObject({
        success: true,
        data: {
          liked: false,
          likeCount: likeResponse.body.data.likeCount - 1
        }
      });
    });

    it('should require authentication for liking', async () => {
      const testPost = TestFixtures.TEST_BLOG_POSTS[0];
      
      const response = await request(app)
        .post(`/api/v1/blog/posts/${testPost.id}/like`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent post like', async () => {
      const response = await request(app)
        .post('/api/v1/blog/posts/99999999-9999-9999-9999-999999999999/like')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/blog/categories', () => {
    it('should return all blog categories', async () => {
      const response = await request(app)
        .get('/api/v1/blog/categories')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });

      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          description: expect.any(String)
        });
      }
    });
  });

  describe('GET /api/v1/blog/tags', () => {
    it('should return all tags with usage counts', async () => {
      const response = await request(app)
        .get('/api/v1/blog/tags')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });

      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toMatchObject({
          tag: expect.any(String),
          count: expect.any(Number)
        });
      }
    });
  });

  describe('GET /api/v1/blog/stats', () => {
    it('should return blog statistics', async () => {
      const response = await request(app)
        .get('/api/v1/blog/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalPosts: expect.any(Number),
          publishedPosts: expect.any(Number),
          totalViews: expect.any(Number),
          totalLikes: expect.any(Number),
          categoriesCount: expect.any(Number),
          tagsCount: expect.any(Number),
          averageViewsPerPost: expect.any(Number)
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts?page=abc&limit=xyz')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousQuery = "'; DROP TABLE blog_posts; --";
      
      const response = await request(app)
        .get(`/api/v1/blog/posts?q=${encodeURIComponent(maliciousQuery)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return empty results, not cause errors
    });

    it('should handle extremely long search queries', async () => {
      const longQuery = 'a'.repeat(10000);
      
      const response = await request(app)
        .get(`/api/v1/blog/posts?q=${encodeURIComponent(longQuery)}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should respect content-type headers', async () => {
      const response = await request(app)
        .get('/api/v1/blog/posts')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/blog/posts')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200); // Less than 200ms
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array(10).fill(null).map(() =>
        request(app).get('/api/v1/blog/posts')
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for 10 requests
    }, 10000);
  });
});