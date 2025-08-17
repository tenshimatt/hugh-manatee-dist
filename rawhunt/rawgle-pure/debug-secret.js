// Add a temporary debug endpoint to test-management.js
// This code should be temporarily added to routes/test-management.js for debugging

// Add this to the main handler in test-management.js:
/*
    // DEBUG: Check admin token value (REMOVE IN PRODUCTION!)
    else if (path === '/api/test-management/debug-token' && method === 'GET') {
      const providedToken = request.headers.get('X-Admin-Token');
      const expectedToken = env.ADMIN_TOKEN;
      
      response = new Response(JSON.stringify({
        provided: providedToken || 'none',
        expectedExists: !!expectedToken,
        expectedLength: expectedToken ? expectedToken.length : 0,
        matches: providedToken === expectedToken,
        // Don't expose actual token value for security
        debug: 'Token comparison debug info'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
*/

console.log('Add the debug endpoint code above to test-management.js temporarily');
console.log('Then deploy and test with:');
console.log('curl -H "X-Admin-Token: rawgle-admin-2025" https://rawgle-api.findrawdogfood.workers.dev/api/test-management/debug-token');