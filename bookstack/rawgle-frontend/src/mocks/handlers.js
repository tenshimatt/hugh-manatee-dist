import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock API responses
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: Date.now() })
  }),
  
  http.get('/api/user', () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    })
  }),
  
  http.post('/api/auth/login', async ({ request }) => {
    const { email } = await request.json()
    
    if (email === 'test@example.com') {
      return HttpResponse.json({
        user: { id: '1', email, name: 'Test User' },
        token: 'mock-jwt-token',
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }),
  
  // Add more handlers as needed for your API endpoints
]