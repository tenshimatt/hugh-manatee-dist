export default {
  async fetch(request, env) {
    return new Response('Hello World! Test worker is working.', {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};