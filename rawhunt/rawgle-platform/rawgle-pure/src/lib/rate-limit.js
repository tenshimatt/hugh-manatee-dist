// Rate limiting implementation

export async function rateLimit(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const key = `rate_limit:${ip}:${new Date().getMinutes()}`;
  
  const limit = parseInt(env.RATE_LIMIT_PER_MINUTE) || 60;
  
  try {
    const current = await env.RAWGLE_KV.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= limit) {
      return {
        allowed: false,
        retryAfter: 60 - new Date().getSeconds()
      };
    }
    
    // Increment counter
    await env.RAWGLE_KV.put(key, (count + 1).toString(), {
      expirationTtl: 60 // 1 minute
    });
    
    return { allowed: true };
  } catch (error) {
    // If KV fails, allow request but log error
    console.error('Rate limiting error:', error);
    return { allowed: true };
  }
}