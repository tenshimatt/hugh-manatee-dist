# Rawgle AI-Driven CI/CD Pipeline Deployment Guide

## Overview

This guide covers deploying the complete automated AI-driven CI/CD pipeline for rawgle.com using Docker containers and your existing Open WebUI setup.

## Prerequisites

✅ **Confirmed Available:**
- Docker environment (pandora-ci containers)
- Open WebUI at https://openwebui.beyondpandora.com
- Qwen2.5-Coder model loaded in Ollama
- GitLab (Port 3000)
- Jenkins (Port 3001)
- Selenium Hub (Port 4444)

## Quick Deployment Steps

### 1. Deploy to GitLab Repository

```bash
# Navigate to GitLab container
docker exec -it pandora-gitlab bash

# Create the rawgle project
cd /var/opt/gitlab/git-data/repositories/@hashed
# Or use GitLab UI at http://localhost:3000

# Push this codebase to GitLab
cd /path/to/rawgle-platform
git remote add origin http://pandora-gitlab:3000/rawgle/platform.git
git push origin main
```

### 2. Configure Jenkins Pipeline

```bash
# Access Jenkins at http://localhost:3001
# Create new pipeline job: "ai-fix-pipeline"
# Point to Jenkinsfile in repository
# Configure webhook from GitLab for CI trigger
```

### 3. Test the AI Integration

```bash
# Test direct Ollama connection
curl -X POST http://pandora-ollama:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-coder:latest",
    "prompt": "Generate a Jest test for user authentication",
    "stream": false
  }'
```

### 4. Enable Scheduled Tests

```bash
# In GitLab CI/CD settings, create schedule:
# Cron: */30 * * * *  (every 30 minutes)
# Target: main branch
# Variables: CI_SCHEDULE=true
```

### 5. Configure Monitoring

```bash
# Import Grafana dashboard
curl -X POST http://pandora-grafana:3005/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @monitoring/grafana-dashboard.json

# Load Prometheus rules
curl -X POST http://pandora-prometheus:3006/api/v1/rules \
  -H "Content-Type: application/yaml" \
  --data-binary @monitoring/prometheus-rules.yml
```

## Validation Testing

### Test 1: Trigger Intentional Failure

```bash
# Run the intentional failure test
npm test tests/intentional-failures/auth-failure.test.js

# This should:
# 1. Fail the tests
# 2. Trigger Jenkins pipeline
# 3. AI reads authentication.md
# 4. AI generates fix
# 5. Auto-applies and tests fix
# 6. Auto-merges if successful
```

### Test 2: Verify AI Fix Generation

```bash
# Check Jenkins job execution
curl http://pandora-jenkins:3001/job/ai-fix-pipeline/lastBuild/api/json

# Check GitLab for AI-generated merge requests
curl http://pandora-gitlab:3000/api/v4/projects/1/merge_requests

# Verify logs in Elasticsearch
curl http://pandora-elasticsearch:9200/ai-fixes/_search
```

### Test 3: Monitor Dashboard

```bash
# Access Grafana dashboard
open http://pandora-grafana:3005

# Verify metrics are flowing:
# - AI fix attempts
# - Success rates
# - Pipeline execution times
# - Test results
```

## Pipeline Configuration

### Environment Variables (Required)

```bash
# GitLab CI
CI_REGISTRY=pandora-registry:5000
OLLAMA_URL=http://pandora-ollama:11434
SELENIUM_HUB=http://pandora-selenium-hub:4444
MODEL_NAME=qwen2.5-coder:latest

# Jenkins
GITLAB_TOKEN=your_gitlab_token
OPENWEBUI_URL=https://openwebui.beyondpandora.com
```

### Docker Network Configuration

All services must be on the same Docker network:

```bash
# Verify network connectivity
docker exec pandora-jenkins ping pandora-ollama
docker exec pandora-gitlab ping pandora-jenkins
docker exec pandora-selenium-hub ping pandora-ollama
```

## AI Model Integration Points

### Primary: Direct Ollama API
```python
# Used by Jenkins pipeline
requests.post("http://pandora-ollama:11434/api/generate", {
    "model": "qwen2.5-coder:latest",
    "prompt": documentation_driven_prompt,
    "stream": False,
    "temperature": 0.1
})
```

### Secondary: Open WebUI Access
```bash
# For manual review and debugging
https://openwebui.beyondpandora.com/?model=ollama%2FQwen2.5-coder%3Alatest
```

## Expected Pipeline Flow

### Automated 30-Minute Cycle:

1. **15:00** - Scheduled test run starts
2. **15:02** - Tests detect failures
3. **15:03** - GitLab webhook triggers Jenkins
4. **15:04** - Jenkins reads relevant docs
5. **15:05** - AI generates fix via Ollama
6. **15:07** - Fix applied to new branch
7. **15:08** - Tests run on fixed code
8. **15:09** - Auto-merge if tests pass
9. **15:10** - Metrics updated in Grafana

### Manual Override Points:

- **Open WebUI**: Review AI prompts/responses
- **Jenkins**: Manual pipeline trigger
- **GitLab**: Manual merge request review
- **Grafana**: Pipeline performance analysis

## Troubleshooting

### Common Issues

**AI not generating fixes:**
```bash
# Check Ollama model status
curl http://pandora-ollama:11434/api/tags

# Verify model is loaded
docker logs pandora-ollama
```

**Jenkins pipeline failing:**
```bash
# Check Jenkins logs
docker logs pandora-jenkins

# Verify GitLab webhook
curl -X POST http://pandora-jenkins:3001/job/ai-fix-pipeline/build
```

**Tests not triggering:**
```bash
# Check GitLab CI schedule
# Verify cron expression: */30 * * * *
# Check runner availability
```

**Selenium tests failing:**
```bash
# Check Selenium Grid status
curl http://pandora-selenium-hub:4444/status

# Verify browser nodes
docker logs pandora-selenium-chrome
```

### Debug Commands

```bash
# Full pipeline test
scripts/test-pipeline.sh

# Check all services
docker ps | grep pandora

# View AI interaction logs
cat logs/ai_interaction_*.json

# Monitor real-time pipeline
tail -f /var/log/jenkins/pipeline.log
```

## Security Considerations

### Token Management
- GitLab API tokens stored in Jenkins credentials
- JWT secrets in environment variables only
- No secrets in repository or logs

### Network Security
- All communication within Docker network
- External access only through designated ports
- Webhook signatures validated

### AI Safety
- AI only reads from `/docs` directory
- Generated code reviewed before auto-merge
- Rate limiting on AI API calls
- Human override always available

## Performance Optimization

### Expected Metrics
- **AI Response Time**: < 30 seconds
- **Pipeline Execution**: < 5 minutes
- **Fix Success Rate**: > 80%
- **False Positive Rate**: < 10%

### Scaling Considerations
- Ollama model can handle ~10 concurrent requests
- Jenkins supports multiple pipeline executors
- Selenium Grid can scale browser nodes
- PostgreSQL/Redis handle expected load

## Next Steps After Deployment

1. **Monitor first 24 hours** of automated cycles
2. **Review AI-generated fixes** for quality
3. **Adjust documentation** based on AI feedback
4. **Fine-tune prompts** for better results
5. **Scale up** if performance meets expectations

## Integration with Open WebUI

Your existing Open WebUI setup provides:
- **Model Management**: Switch between AI models
- **Prompt Testing**: Test prompts before pipeline integration
- **Response Analysis**: Review AI-generated fixes
- **Manual Override**: Human-in-the-loop when needed

The pipeline primarily uses direct Ollama API for automation, but Open WebUI remains available for monitoring and manual intervention.

## Success Criteria

✅ **Phase 1**: Pipeline deploys and connects all services
✅ **Phase 2**: Intentional test failures trigger AI fixes
✅ **Phase 3**: AI generates valid fixes from documentation
✅ **Phase 4**: Auto-merge works when tests pass
✅ **Phase 5**: Monitoring shows pipeline health

When all phases complete, you'll have a fully automated, self-healing CI/CD pipeline powered by AI that maintains rawgle.com without human intervention.