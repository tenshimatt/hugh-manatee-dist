#!/bin/bash

# Daily Automated Deployment Script for Rawgle Platform
# Add to crontab: 0 2 * * * /path/to/daily-deploy.sh

LOG_FILE="/var/log/rawgle-deploy.log"
PROJECT_DIR="/Users/mattwright/pandora/rawgle-platform/rawgle-pure"

echo "========================================" >> $LOG_FILE
echo "Starting daily deployment at $(date)" >> $LOG_FILE

cd $PROJECT_DIR

# Pull latest changes if using git
if [ -d .git ]; then
    echo "Pulling latest changes..." >> $LOG_FILE
    git pull origin main >> $LOG_FILE 2>&1
fi

# Load environment variables
source .env

# Run tests before deployment
echo "Running tests..." >> $LOG_FILE
npm test --silent >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
    echo "Tests passed, proceeding with deployment..." >> $LOG_FILE
    
    # Deploy to production
    ./deploy-rawgle-production.sh >> $LOG_FILE 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful at $(date)" >> $LOG_FILE
        
        # Send health check
        HEALTH_CHECK=$(curl -s https://rawgle-api.findrawdogfood.workers.dev/api/health)
        echo "Health check: $HEALTH_CHECK" >> $LOG_FILE
        
        # Optional: Send notification (email, Slack, etc.)
        # echo "Rawgle deployed successfully" | mail -s "Deployment Success" your-email@example.com
    else
        echo "❌ Deployment failed at $(date)" >> $LOG_FILE
        # Optional: Send failure notification
        # echo "Rawgle deployment failed. Check logs at $LOG_FILE" | mail -s "Deployment Failed" your-email@example.com
    fi
else
    echo "❌ Tests failed, skipping deployment at $(date)" >> $LOG_FILE
fi

echo "Daily deployment completed at $(date)" >> $LOG_FILE
echo "========================================" >> $LOG_FILE