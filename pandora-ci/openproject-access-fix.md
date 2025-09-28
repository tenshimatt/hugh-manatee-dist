# OpenProject Access Fix

## Current Status
OpenProject is **running correctly** on your Docker server at 10.90.10.6

## The Issue
You're trying to access it via HTTPS (https://10.90.10.6:3002/) but it's configured for HTTP only.

## Solution

### Access OpenProject using HTTP (not HTTPS):
```
http://10.90.10.6:3002/
```

### Current Configuration:
- Container: pandora-openproject
- Status: Running (Up 9 minutes)
- Internal Port: 80
- External Port: 3002
- Protocol: HTTP only
- HTTPS: Disabled (OPENPROJECT_HTTPS=false)

## Optional: Enable HTTPS

If you need HTTPS access, you have two options:

### Option 1: Use a Reverse Proxy (Recommended)
Add an nginx or traefik container to handle SSL termination and proxy to OpenProject.

### Option 2: Direct HTTPS (Not recommended for production)
You would need to:
1. Generate SSL certificates
2. Mount them in the container
3. Update environment variables:
   - Set OPENPROJECT_HTTPS=true
   - Configure SSL certificate paths
4. Change port mapping to 443

## Current Container Health
- OpenProject: ✅ Running
- PostgreSQL Database: ✅ Connected
- Redis Cache: ⚠️ Intermittent connection warnings (but functional)

## Access Credentials
Default OpenProject credentials (if not changed):
- Username: admin
- Password: admin

**Remember to change these on first login!**