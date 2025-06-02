#!/bin/bash

set -e

echo "🔧 Starting KuCoin Lambda Deployment..."

cd ~/pandora/lambda/kucoin || exit 1

# Ensure tools are installed
echo "📦 Installing dependencies..."
sudo apt-get update -y
sudo apt-get install -y python3-pip zip

# Clean old build
rm -rf package lambda.zip
mkdir -p package

# Install only required packages
pip3 install flask requests -t ./package

# Package
echo "📦 Zipping deployment..."
cd package && zip -r ../lambda.zip . > /dev/null && cd ..
zip -g lambda.zip lambda_function.py > /dev/null

# Deploy
echo "🚀 Uploading to AWS Lambda..."
aws lambda update-function-code \
  --function-name kucoin-webhook-handler \
  --zip-file fileb://lambda.zip \
  --region eu-west-1

echo "✅ Lambda deployment complete!"
