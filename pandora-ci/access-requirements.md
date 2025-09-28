# Required Access for 32-Container Infrastructure

## Current Situation:
- ✅ SSH to Docker host: `ssh root@10.90.10.6`
- ❌ SSH to Proxmox host: **MISSING**
- ❌ Container management access: **BLOCKED**

## Critical Missing Access:

### 1. Proxmox Host SSH
**Need:** SSH access to the Proxmox hypervisor (likely 10.90.10.1 or similar)
**Format:** `ssh root@<proxmox-ip>`
**Purpose:** Manage the 32 LXC containers using `pct` commands

### 2. Container Access Pattern:
```bash
# From Proxmox host:
pct list                    # List all containers
pct exec 200 -- systemctl status  # Execute commands in container 200
pct start/stop/restart 200  # Control container lifecycle
```

## What We Can Do Right Now:

### Option A: Direct Container SSH (if configured)
Try SSH directly to container IPs:
```bash
ssh root@10.90.11.161  # OpenWebUI (200)
ssh root@10.90.10.124  # Ollama (201)
ssh root@10.90.11.189  # n8n (204)
```

### Option B: Docker Host as Jump Server
If containers have SSH, use Docker host as proxy:
```bash
ssh -J root@10.90.10.6 root@10.90.11.161
```

## Required for CI Infrastructure:

1. **Proxmox root access** - to manage all 32 containers
2. **Network connectivity** - to reach 10.90.10.0/24 and 10.90.11.0/24 subnets
3. **Service credentials** - for n8n, Grafana, Wazuh configuration

## First Step: Determine Proxmox IP
The Proxmox host is likely:
- 10.90.10.1 (gateway)
- 10.90.11.1 (secondary gateway)
- Or check your network documentation

## Test Commands:
```bash
# Find Proxmox host
ping 10.90.10.1
ping 10.90.11.1

# Try SSH to potential Proxmox hosts
ssh root@10.90.10.1
ssh root@10.90.11.1

# Test direct container access
ssh root@10.90.11.161  # OpenWebUI
ssh root@10.90.11.189  # n8n
```

Without Proxmox access, we can only work on individual containers that have SSH enabled.