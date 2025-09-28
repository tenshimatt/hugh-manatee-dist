# PANDORA-CI Quick Start Guide

## ✅ What's Been Created

1. **PANDORA-CI.MD** - Complete specification (3000+ lines)
2. **install-pandora-ci.sh** - Automated installation script
3. Full Docker Compose stack with 10+ services
4. AI Developer integration (Claude, Qwen, Ollama)
5. 24/7 autonomous test-fixing loop

## 🚀 Installation on Your Proxmox Ubuntu 24 Container

### Step 1: Transfer Files to Your Container
```bash
# From your Mac
scp -r /Users/mattwright/pandora/pandora-ci/ root@YOUR_CONTAINER_IP:/opt/
```

### Step 2: Run Installation
```bash
# On your Ubuntu 24 container
cd /opt/pandora-ci
chmod +x install-pandora-ci.sh
sudo ./install-pandora-ci.sh
```

### Step 3: Configure API Keys
```bash
cp /opt/pandora-ci/.env.template /opt/pandora-ci/.env
nano /opt/pandora-ci/.env

# Add your keys:
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY
GITLAB_PAT=glpat-YOUR-TOKEN
```

### Step 4: Clone Your Repository
```bash
mkdir -p /opt/pandora-ci/repos
cd /opt/pandora-ci/repos
git clone https://github.com/YOUR-ORG/YOUR-REPO.git main
```

### Step 5: Start Services
```bash
cd /opt/pandora-ci
docker compose up -d
systemctl start pandora-ai-developer.service
```

## 📊 Access Your Services

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| GitLab | http://YOUR-IP:3000 | root / PandoraAdmin2025! |
| Jenkins | http://YOUR-IP:3001 | Check initial password |
| OpenProject | http://YOUR-IP:3002 | admin / admin |
| SonarQube | http://YOUR-IP:3004 | admin / admin |
| Grafana | http://YOUR-IP:3005 | admin / pandora2025 |
| Prometheus | http://YOUR-IP:3006 | No auth |

## 🤖 AI Models Included

- **Claude 3 Opus** - Primary developer (via API)
- **Qwen 2.5 Coder 32B** - Backup developer (local)
- **CodeLlama 34B** - Additional support (local)
- **DeepSeek Coder 33B** - Specialized tasks (local)

## 🔄 How It Works

1. **Tests run every 10 minutes**
2. **If tests fail** → AI analyzes and fixes
3. **Auto-commits** every 10 minutes
4. **Specs drive development** → AI implements from docs
5. **24/7 operation** → Never stops improving

## ⚠️ Critical Setup Items

Before starting, ensure you have:

- [ ] Anthropic API key ($20/month budget recommended)
- [ ] GitLab or GitHub PAT token
- [ ] 32GB RAM minimum on container
- [ ] 500GB storage for models and data
- [ ] Your repository URL ready
- [ ] Test suite already in your repo

## 🎯 Success Metrics

Your system is working when you see:

- ✅ All Docker containers running
- ✅ AI models loaded (check with `ollama list`)
- ✅ Tests running automatically
- ✅ Commits appearing every 10 minutes
- ✅ Grafana showing metrics
- ✅ Zero human intervention for 24 hours

## 🆘 Troubleshooting

### Docker services not starting
```bash
docker compose logs -f SERVICE_NAME
```

### AI models not responding
```bash
ollama serve  # Start Ollama service
ollama pull qwen2.5-coder:32b-instruct  # Re-pull model
```

### Tests not running
```bash
cd /opt/pandora-ci/repos/main
npm install  # Install dependencies
npm test     # Test manually
```

### Check system status
```bash
/opt/pandora-ci/check-status.sh
```

## 📝 Remember

**"Tests ARE the specification. AI makes them pass."**

This is not about writing perfect code upfront. It's about:
1. Writing tests that define what you want
2. Letting AI make those tests pass
3. Continuous improvement through iteration

## 🎉 You're Ready!

Your autonomous development infrastructure is ready to run 24/7 without human intervention. The AI will continuously:

- Fix failing tests
- Implement new features from specs
- Improve code quality
- Maintain documentation
- Deploy successful builds

Welcome to the future of software development!
