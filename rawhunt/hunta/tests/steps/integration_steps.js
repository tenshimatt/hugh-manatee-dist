import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';

// Integration steps for connecting backend to new frontend at https://afc39a6e.rawgle-frontend.pages.dev/

// Backend Integration Setup
Given('the backend is connected to the new frontend', async function () {
  // Set the new frontend URL
  this.frontendUrl = 'https://afc39a6e.rawgle-frontend.pages.dev';
  this.backendUrl = 'https://gohunta-backend.findrawdogfood.workers.dev';
  
  // Verify backend is accessible
  const healthCheck = await page.request.get(`${this.backendUrl}/health`);
  expect(healthCheck.ok()).to.be.true;
  
  // Navigate to new frontend
  await page.goto(this.frontendUrl);
  await page.waitForSelector('body');
});

Given('API endpoints are configured for the new frontend', async function () {
  // Verify CORS headers allow the new frontend domain
  const response = await page.request.get(`${this.backendUrl}/api/routes`, {
    headers: {
      'Origin': this.frontendUrl
    }
  });
  
  expect(response.headers()['access-control-allow-origin']).to.include('*');
});

// Route Planning Integration
Given('I am on the route planning page of the new frontend', async function () {
  await page.goto(`${this.frontendUrl}/routes`);
  await page.waitForSelector('[data-testid="route-planning-interface"]');
});

When('I create a route through the new frontend interface', async function () {
  await page.click('[data-testid="create-route-btn"]');
  await page.fill('[data-testid="route-name"]', 'Test Route via New Frontend');
  await page.selectOption('[data-testid="hunt-type"]', 'upland_birds');
  await page.click('[data-testid="save-route-btn"]');
});

Then('the route should be saved to the backend database', async function () {
  // Verify via direct API call
  const routes = await page.request.get(`${this.backendUrl}/api/routes`);
  const routeData = await routes.json();
  
  const createdRoute = routeData.data.routes.find(r => r.name === 'Test Route via New Frontend');
  expect(createdRoute).to.exist;
  expect(createdRoute.hunt_type).to.equal('upland_birds');
});

// Training Management Integration
Given('I am on the training page of the new frontend', async function () {
  await page.goto(`${this.frontendUrl}/training`);
  await page.waitForSelector('[data-testid="training-interface"]');
});

When('I log a training session through the new frontend', async function () {
  await page.click('[data-testid="new-training-session"]');
  await page.fill('[data-testid="session-duration"]', '45');
  await page.selectOption('[data-testid="session-type"]', 'field_work');
  await page.click('[data-testid="save-training-session"]');
});

Then('the training session should be stored in the backend', async function () {
  const training = await page.request.get(`${this.backendUrl}/api/training`);
  const trainingData = await training.json();
  
  expect(trainingData.success).to.be.true;
  expect(trainingData.data.sessions).to.be.an('array');
});

// Gear Reviews Integration  
Given('I am on the gear reviews page of the new frontend', async function () {
  await page.goto(`${this.frontendUrl}/gear`);
  await page.waitForSelector('[data-testid="gear-reviews-interface"]');
});

When('I submit a gear review through the new frontend', async function () {
  await page.click('[data-testid="write-review-btn"]');
  await page.fill('[data-testid="product-name"]', 'Test GPS Collar');
  await page.click('[data-testid="rating-4-stars"]');
  await page.fill('[data-testid="review-text"]', 'Great collar for field work');
  await page.click('[data-testid="submit-review-btn"]');
});

Then('the gear review should be saved to the backend', async function () {
  const gear = await page.request.get(`${this.backendUrl}/api/gear`);
  const gearData = await gear.json();
  
  const testReview = gearData.data.gear.find(g => g.name === 'Test GPS Collar');
  expect(testReview).to.exist;
});

// Ethics & Conservation Integration
Given('I am on the ethics page of the new frontend', async function () {
  await page.goto(`${this.frontendUrl}/ethics`);
  await page.waitForSelector('[data-testid="ethics-hub"]');
});

When('I access ethics content through the new frontend', async function () {
  await page.click('[data-testid="ethics-article"]');
  await page.waitForSelector('[data-testid="article-content"]');
});

Then('ethics content should load from the backend', async function () {
  const ethics = await page.request.get(`${this.backendUrl}/api/ethics`);
  const ethicsData = await ethics.json();
  
  expect(ethicsData.success).to.be.true;
  expect(ethicsData.data.articles).to.be.an('array');
  expect(ethicsData.data.articles.length).to.be.greaterThan(0);
});

// Community Integration
Given('I am on the community page of the new frontend', async function () {
  await page.goto(`${this.frontendUrl}/community`);
  await page.waitForSelector('[data-testid="community-hub"]');
});

When('I create a community post through the new frontend', async function () {
  await page.click('[data-testid="create-post-btn"]');
  await page.fill('[data-testid="post-title"]', 'Test Community Post');
  await page.fill('[data-testid="post-content"]', 'This is a test post from the new frontend');
  await page.click('[data-testid="publish-post-btn"]');
});

Then('the community post should be saved to the backend', async function () {
  const posts = await page.request.get(`${this.backendUrl}/api/posts`);
  const postData = await posts.json();
  
  const testPost = postData.data.posts.find(p => p.title === 'Test Community Post');
  expect(testPost).to.exist;
  expect(testPost.content).to.include('test post from the new frontend');
});

// Authentication Integration
Given('I log in through the new frontend', async function () {
  await page.goto(`${this.frontendUrl}/login`);
  await page.fill('[data-testid="login-email"]', 'test@example.com');
  await page.fill('[data-testid="login-password"]', 'testpassword123');
  await page.click('[data-testid="login-submit"]');
  await page.waitForSelector('[data-testid="user-dashboard"]');
});

When('I access protected content', async function () {
  await page.goto(`${this.frontendUrl}/dogs`);
  await page.waitForSelector('[data-testid="dogs-list"]');
});

Then('the backend should authenticate my session', async function () {
  // Check that protected endpoints work with session
  const userProfile = await page.request.get(`${this.backendUrl}/api/users/me`, {
    headers: {
      'Authorization': 'Bearer demo-token' // Using demo auth for testing
    }
  });
  
  expect(userProfile.status()).to.equal(200);
});

// Data Synchronization
When('I perform CRUD operations through the new frontend', async function () {
  // Create a dog profile
  await page.goto(`${this.frontendUrl}/dogs`);
  await page.click('[data-testid="add-dog-btn"]');
  await page.fill('[data-testid="dog-name"]', 'Frontend Test Dog');
  await page.selectOption('[data-testid="dog-breed"]', 'German Shorthaired Pointer');
  await page.click('[data-testid="save-dog-btn"]');
  
  // Wait for save confirmation
  await page.waitForSelector('[data-testid="success-message"]');
});

Then('data should be consistently stored and retrieved from backend', async function () {
  // Verify data was saved via API
  const dogs = await page.request.get(`${this.backendUrl}/api/dogs`, {
    headers: {
      'Authorization': 'Bearer demo-token'
    }
  });
  
  const dogData = await dogs.json();
  const testDog = dogData.data.dogs.find(d => d.name === 'Frontend Test Dog');
  
  expect(testDog).to.exist;
  expect(testDog.breed).to.equal('German Shorthaired Pointer');
});

// Performance Integration
When('I load pages on the new frontend with backend data', async function () {
  this.startTime = Date.now();
  await page.goto(`${this.frontendUrl}/dashboard`);
  await page.waitForSelector('[data-testid="dashboard-loaded"]');
  this.loadTime = Date.now() - this.startTime;
});

Then('pages should load within performance thresholds', async function () {
  expect(this.loadTime).to.be.lessThan(3000); // 3 second threshold
});

Then('backend API calls should be optimized', async function () {
  // Check that API responses are reasonably fast
  const apiStartTime = Date.now();
  await page.request.get(`${this.backendUrl}/api/routes`);
  const apiResponseTime = Date.now() - apiStartTime;
  
  expect(apiResponseTime).to.be.lessThan(1000); // 1 second API threshold
});

// Error Handling Integration
When('the backend is temporarily unavailable', async function () {
  // Simulate by trying to access non-existent endpoint
  await page.route(`${this.backendUrl}/api/**`, route => {
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Service Temporarily Unavailable' })
    });
  });
});

Then('the new frontend should handle errors gracefully', async function () {
  await page.goto(`${this.frontendUrl}/routes`);
  
  // Should show error state instead of crashing
  await page.waitForSelector('[data-testid="error-message"]');
  const errorText = await page.textContent('[data-testid="error-message"]');
  expect(errorText).to.include('temporarily unavailable');
});

// Cross-browser Integration
Given('I test the integration across different browsers', async function () {
  // This would be expanded to test Chrome, Firefox, Safari, etc.
  // For now, ensuring the basic integration works
  await page.goto(this.frontendUrl);
  await page.waitForSelector('body');
  
  // Verify essential features load
  const navigation = await page.locator('[data-testid="main-navigation"]');
  expect(await navigation.isVisible()).to.be.true;
});

// Mobile Integration
Given('I access the new frontend from a mobile device', async function () {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.goto(this.frontendUrl);
  await page.waitForSelector('[data-testid="mobile-navigation"]');
});

Then('mobile-optimized backend integration should work', async function () {
  // Test mobile-specific API calls work properly
  const mobileApiCall = await page.request.get(`${this.backendUrl}/api/routes`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    }
  });
  
  expect(mobileApiCall.ok()).to.be.true;
});