# Fix Browser Forcing HTTPS for OpenProject

## Immediate Solutions (Try in Order):

### 1. **Use IP with Port Explicitly in URL Bar**
Type exactly this in your browser address bar and press Enter:
```
http://10.90.10.6:3002
```
**Important:** Don't click on bookmarks or history entries - TYPE it manually.

### 2. **Try Different Browsers**
If Chrome is forcing HTTPS, try:
- Firefox
- Safari
- Edge
- Brave (with shields down)

### 3. **Use Incognito/Private Mode**
- Chrome: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
- Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
- Safari: Cmd+Shift+N (Mac)

Then navigate to: `http://10.90.10.6:3002`

### 4. **Clear HSTS Cache for This Site**

#### Chrome:
1. Navigate to: `chrome://net-internals/#hsts`
2. Scroll down to "Delete domain security policies"
3. Enter: `10.90.10.6`
4. Click "Delete"
5. Close and reopen Chrome
6. Try accessing: `http://10.90.10.6:3002`

#### Firefox:
1. Type `about:support` in address bar
2. Click "Clear Startup Cache"
3. Or: Settings → Privacy & Security → Clear Data → Clear
4. Restart Firefox

#### Safari:
1. Safari → Preferences → Privacy
2. Click "Manage Website Data"
3. Search for `10.90.10.6`
4. Select and Remove
5. Restart Safari

### 5. **Use Command Line Browser Test**
Open terminal and run:
```bash
curl -L http://10.90.10.6:3002
```
If this works, it confirms the server is fine and it's a browser issue.

### 6. **Disable HTTPS-Only Mode** (Temporary)

#### Chrome:
1. Go to: `chrome://settings/security`
2. Turn off "Always use secure connections"

#### Firefox:
1. Go to: Settings → Privacy & Security
2. Scroll to "HTTPS-Only Mode"
3. Select "Don't enable HTTPS-Only Mode"

### 7. **Access via Different Network Path**
Add to your `/etc/hosts` file:
```bash
sudo echo "10.90.10.6 openproject.local" >> /etc/hosts
```
Then access: `http://openproject.local:3002`

## Permanent Solution:

### Add a Reverse Proxy with HTTPS
Since your browser wants HTTPS, let's give it HTTPS properly:

1. **Install nginx on the Docker host:**
```bash
ssh root@10.90.10.6 "apt-get update && apt-get install -y nginx"
```

2. **Configure nginx as HTTPS proxy:**
Create `/etc/nginx/sites-available/openproject`:
```nginx
server {
    listen 443 ssl;
    server_name 10.90.10.6;

    # Self-signed cert for development
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

3. **Generate self-signed certificate:**
```bash
ssh root@10.90.10.6 "openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt \
  -subj '/CN=10.90.10.6'"
```

Then you can access OpenProject via: `https://10.90.10.6` (default HTTPS port 443)

## Quick Test Right Now:

Try this URL format with explicit port declaration:
```
http://10.90.10.6:3002/login
```

Or use curl to test if the server is responding:
```bash
curl -I http://10.90.10.6:3002/
```

The issue is 100% browser-side HSTS/security policy - the server is working perfectly on HTTP.