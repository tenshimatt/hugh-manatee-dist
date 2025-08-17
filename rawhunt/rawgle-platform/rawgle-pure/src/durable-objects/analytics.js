export class AnalyticsDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.websockets = new Set();
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request);
    }
    
    if (url.pathname === '/metrics') {
      return this.handleMetrics(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    
    server.accept();
    this.websockets.add(server);
    
    const currentMetrics = await this.state.storage.get('live_metrics') || {};
    server.send(JSON.stringify(currentMetrics));
    
    server.addEventListener('close', () => {
      this.websockets.delete(server);
    });
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleMetrics(request) {
    const metrics = await request.json();
    
    const current = await this.state.storage.get('live_metrics') || {};
    const updated = { ...current, ...metrics, timestamp: Date.now() };
    
    await this.state.storage.put('live_metrics', updated);
    
    for (const ws of this.websockets) {
      try {
        ws.send(JSON.stringify(updated));
      } catch (e) {
        this.websockets.delete(ws);
      }
    }
    
    return Response.json({ status: 'stored' });
  }
}