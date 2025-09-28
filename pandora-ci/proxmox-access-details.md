# Proxmox Access Configuration

## CONFIRMED PROXMOX HOST: 10.90.10.10

### Current Status:
- ✅ **Host Found**: 10.90.10.10
- ✅ **SSH Port**: 22 (open)
- ✅ **Web Interface**: https://10.90.10.10:8006
- ❌ **SSH Access**: Permission denied (need credentials)

## Required Access Methods:

### Option 1: SSH Key Authentication (Recommended)
```bash
# Add your SSH key to Proxmox
ssh-copy-id root@10.90.10.10

# Or manually add to ~/.ssh/authorized_keys on Proxmox host
```

### Option 2: Password Authentication
```bash
# Enable password auth if disabled
ssh root@10.90.10.10
# Will prompt for root password
```

### Option 3: Web Interface Access
- **URL**: https://10.90.10.10:8006
- **Default User**: root@pam
- **Need**: Root password

### Option 4: API Token (For Automation)
```bash
# Create API token via web interface
# Users > root@pam > API Tokens > Add
```

## What We Need From You:

### Immediate Access (Choose One):
1. **Root Password**: For `ssh root@10.90.10.10`
2. **SSH Key Setup**: Copy your public key to Proxmox
3. **Web Interface**: Root password for https://10.90.10.10:8006

### For CI Automation:
1. **API Token**: For programmatic access
2. **SSH Keys**: For automated scripts

## Test Commands Once Access Works:
```bash
# Verify Proxmox access
ssh root@10.90.10.10 "pve-manager --version"

# List all containers
ssh root@10.90.10.10 "pct list"

# Check specific containers from your 32-app stack
ssh root@10.90.10.10 "pct status 200"  # OpenWebUI
ssh root@10.90.10.10 "pct status 204"  # n8n
```

## Network Layout Confirmed:
- **UniFi Gateway**: 10.90.10.1 (UDM Pro Max)
- **Proxmox Host**: 10.90.10.10
- **Docker Host**: 10.90.10.6 (where we have access)
- **Container Subnets**: 10.90.10.0/24 and 10.90.11.0/24

## Next Steps:
1. **Provide root password** for 10.90.10.10, OR
2. **Add SSH key** to 10.90.10.10, OR
3. **Set up API token** via web interface

Once we have Proxmox access, we can immediately start:
- Container health checks
- Service updates
- Monitoring deployment
- Automation setup