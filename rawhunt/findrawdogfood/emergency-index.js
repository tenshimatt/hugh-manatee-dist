// Emergency Test Worker - Just to get site back up
export default {
  async fetch(request, env) {
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>Find Raw Dog Food - Emergency Mode</title>
</head>
<body>
    <h1>🐕 Find Raw Dog Food</h1>
    <p>Site is temporarily in emergency mode while we fix the deployment.</p>
    <p>Normal service will resume shortly.</p>
</body>
</html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};