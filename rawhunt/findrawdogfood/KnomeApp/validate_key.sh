#!/bin/bash

echo "🔑 OpenAI API Key Validator"
echo "==========================="
echo ""

if [ -z "$1" ]; then
    echo "Usage: ./validate_key.sh YOUR_OPENAI_API_KEY"
    exit 1
fi

API_KEY="$1"

echo "Testing OpenAI API key..."

# Test API key with a simple request
RESPONSE=$(curl -s -w "\n%{http_code}" \
  https://api.openai.com/v1/models \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ API key is valid!"
    echo "✅ OpenAI connection successful"
    echo ""
    echo "Available models include:"
    echo "$BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    models = [model['id'] for model in data.get('data', []) if 'gpt' in model['id']]
    for model in sorted(models)[:5]:
        print(f'   • {model}')
    if len(models) > 5:
        print(f'   ... and {len(models)-5} more')
except:
    print('   • Model list parsing failed, but API key works!')
"
    echo ""
    echo "🚀 Ready to set up Knome production!"
    echo "   Run: ./setup_production.sh $API_KEY"
    
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo "❌ Invalid API key"
    echo "   Check your key at: https://platform.openai.com/api-keys"
    
elif [ "$HTTP_CODE" -eq 429 ]; then
    echo "⚠️  Rate limited or quota exceeded"
    echo "   Check your usage at: https://platform.openai.com/usage"
    
else
    echo "❌ API test failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
