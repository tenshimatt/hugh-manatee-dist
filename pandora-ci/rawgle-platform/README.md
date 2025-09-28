# 🚀 Rawgle AI-Driven CI/CD Pipeline

**Fully automated CI/CD pipeline where AI developers automatically fix failing tests by reading documentation files, creating a self-healing development ecosystem for rawgle.com.**

## 🎯 The Golden Rule

**AI ONLY builds from documentation files (`/docs`) - NEVER from todo lists or task descriptions**

## 🏗 Architecture Overview

### Core Components
- **GitLab** (Port 3000) - Repository & CI/CD
- **Jenkins** (Port 3001) - AI orchestration pipeline
- **Ollama** (Port 11434) - AI model hosting (Qwen2.5-Coder)
- **Open WebUI** - https://openwebui.beyondpandora.com
- **Selenium Grid** (Port 4444) - Browser testing
- **Grafana** (Port 3005) - Monitoring dashboards

### The Automated Loop

```
Cron (30min) → Tests Fail → Issue Created → AI Reads Docs →
Fix Generated → Tests Pass → Auto-Merge → Metrics Updated
```

## 🚀 Quick Start

### 1. Validate Pipeline
```bash
./scripts/test-pipeline.sh
```

### 2. Deploy to GitLab
```bash
# Push to your GitLab instance
git remote add origin http://pandora-gitlab:3000/rawgle/platform.git
git push origin main
```

### 3. Configure Jenkins
- Create pipeline job pointing to `Jenkinsfile`
- Configure GitLab webhook
- Set environment variables

### 4. Enable Automation
```bash
# GitLab CI schedule: */30 * * * *
# Jenkins cron: H/30 * * * *
```

## 🧠 AI Integration

### Primary: Direct Ollama API
```python
requests.post("http://pandora-ollama:11434/api/generate", {
    "model": "qwen2.5-coder:latest",
    "prompt": documentation_driven_prompt
})
```

### Secondary: Open WebUI Dashboard
- **Monitor**: https://openwebui.beyondpandora.com
- **Review**: AI-generated fixes
- **Override**: Manual intervention when needed

## 📋 Test Strategy

### Test Types
1. **Unit Tests** - Individual component testing
2. **Integration Tests** - API endpoint validation
3. **E2E Tests** - Full user workflows with Selenium
4. **Intentional Failures** - Validate AI fix generation

### Example Test Flow
```javascript
// E2E Test: User Registration
await driver.get('/register');
await driver.findElement(By.id('email')).sendKeys('test@example.com');
await driver.findElement(By.css('[type="submit"]')).click();
expect(await driver.getCurrentUrl()).toContain('/dashboard');
```

## 📊 Monitoring

### Key Metrics
- **AI Fix Success Rate**: Target >80%
- **Pipeline Execution Time**: Target <5 minutes
- **Test Pass Rate**: Monitor trends
- **Auto-Merge Rate**: Track automation success

### Dashboards
- **Grafana**: Real-time pipeline health
- **Prometheus**: Metrics collection
- **Elasticsearch**: AI interaction logs

## 🛠 Development Workflow

### Documentation-Driven Development
1. **Write Documentation** - Specify behavior in `/docs`
2. **Generate Tests** - AI creates tests from docs
3. **Implement Features** - AI fixes failing tests
4. **Validate & Merge** - Automated testing & deployment

### Manual Override Points
- **Open WebUI**: Review AI responses
- **Jenkins**: Manual pipeline trigger
- **GitLab**: Manual merge review
- **Grafana**: Performance analysis

## 📁 Project Structure

```
rawgle-platform/
├── docs/                     # AI READS FROM HERE ONLY
│   ├── api/                 # API specifications
│   ├── features/            # Feature requirements
│   ├── architecture/        # System design
│   └── testing/            # Test patterns
├── scripts/                 # AI integration scripts
│   ├── ai_fix_generator.py # Core AI logic
│   ├── parse_failures.py  # Test failure analysis
│   └── test-pipeline.sh   # Validation script
├── tests/
│   ├── unit/               # Jest unit tests
│   ├── integration/        # API tests
│   ├── e2e/               # Selenium tests
│   └── intentional-failures/ # AI validation
├── monitoring/             # Grafana & Prometheus config
├── .gitlab-ci.yml         # CI configuration
└── Jenkinsfile           # AI orchestration pipeline
```

## 🔧 Configuration

### Environment Variables
```bash
OLLAMA_URL=http://pandora-ollama:11434
MODEL_NAME=qwen2.5-coder:latest
SELENIUM_HUB=http://pandora-selenium-hub:4444
OPENWEBUI_URL=https://openwebui.beyondpandora.com
```

### Docker Network
All services must communicate within the same Docker network:
```bash
docker network create pandora-network
```

## 🧪 Testing the Pipeline

### Run Intentional Failure
```bash
# This should trigger the complete AI fix cycle
npm test tests/intentional-failures/auth-failure.test.js
```

### Expected Flow
1. Test fails with auth validation errors
2. GitLab webhook triggers Jenkins
3. AI reads `docs/api/authentication.md`
4. AI generates fix based on documentation
5. Fix applied to new branch
6. Tests re-run on fixed code
7. Auto-merge if tests pass
8. Metrics updated in Grafana

## 🚨 Troubleshooting

### Common Issues

**AI not generating fixes:**
```bash
curl http://pandora-ollama:11434/api/tags
# Verify qwen2.5-coder:latest is loaded
```

**Jenkins pipeline failing:**
```bash
docker logs pandora-jenkins
curl -X POST http://pandora-jenkins:3001/job/ai-fix-pipeline/build
```

**Selenium tests failing:**
```bash
curl http://pandora-selenium-hub:4444/status
docker logs pandora-selenium-chrome
```

## 🔐 Security

### AI Safety Measures
- AI only reads from `/docs` directory
- Generated code reviewed before auto-merge
- Rate limiting on AI API calls
- Human override always available
- No secrets in prompts or logs

### Token Management
- GitLab API tokens in Jenkins credentials
- JWT secrets in environment variables only
- Webhook signatures validated

## 📈 Performance Expectations

### Target Metrics
- **AI Response Time**: <30 seconds
- **Pipeline Execution**: <5 minutes
- **Fix Success Rate**: >80%
- **False Positive Rate**: <10%

### Scaling Considerations
- Ollama: ~10 concurrent requests
- Jenkins: Multiple executors
- Selenium: Scalable browser nodes
- Database: PostgreSQL + Redis

## 🎉 Success Criteria

✅ **Phase 1**: All services connected and responding
✅ **Phase 2**: Intentional failures trigger AI fixes
✅ **Phase 3**: AI generates valid fixes from docs
✅ **Phase 4**: Auto-merge works when tests pass
✅ **Phase 5**: Monitoring shows pipeline health

## 📖 Additional Resources

- **[Deployment Guide](docs/deployment-guide.md)** - Complete setup instructions
- **[API Documentation](docs/api/)** - Endpoint specifications
- **[Test Patterns](docs/testing/)** - Testing guidelines
- **[Architecture](docs/architecture/)** - System design

## 🤝 Contributing

This is an automated system. To modify behavior:

1. **Update Documentation** in `/docs` directory
2. **AI will adapt** based on new specifications
3. **Monitor Results** in Grafana dashboard
4. **Iterate** documentation as needed

Remember: **The AI only learns from documentation, not from code comments or issues.**

---

*🚀 Built for rawgle.com - A raw dog food community platform powered by AI-driven development*