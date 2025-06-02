#!/bin/bash

# === Config ===
TARGET_URL="http://54.217.250.25:5005/kucoin-webhook-handler"
LOG_FILE="kucoin-test-log.json"
TMP_RESPONSE="kucoin-response.tmp"
TIMESTAMP=$(date -Iseconds)

# === Payload ===
PAYLOAD='{
  "orderId": "TEST-CI-001",
  "status": "SUCCESS",
  "externalOrderNo": "9999"
}'

# === Execute test ===
curl -s -X POST $TARGET_URL \
  -H "Content-Type: application/json" \
  -H "X-Kucoin-Signature: invalid" \
  -d "$PAYLOAD" > $TMP_RESPONSE

STATUS_CODE=$?
RESPONSE=$(cat $TMP_RESPONSE)

# === Log result as JSON ===
echo "{
  \"timestamp\": \"$TIMESTAMP\",
  \"target\": \"$TARGET_URL\",
  \"status\": $STATUS_CODE,
  \"response\": $RESPONSE
}" >> $LOG_FILE

rm -f $TMP_RESPONSE

echo "✅ Test completed. Logged to $LOG_FILE"
