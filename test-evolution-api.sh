#!/bin/bash

echo "🧪 TESTING EVOLUTION API - https://evolution.cloude.es"
echo "======================================================="

EVOLUTION_URL="https://evolution.cloude.es"
# API_KEY se pasará como parámetro

if [ -z "$1" ]; then
    echo "❌ Error: Proporciona la API Key"
    echo "Uso: ./test-evolution-api.sh <API_KEY>"
    exit 1
fi

API_KEY="$1"

echo "🔑 API Key: $API_KEY"
echo "🌐 Testing URL: $EVOLUTION_URL"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
curl -s -X GET "$EVOLUTION_URL/instance/fetchInstances" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq . || echo "❌ Health check falló"

echo ""

# Test 2: List Instances  
echo "2️⃣ Testing List Instances..."
curl -s -X GET "$EVOLUTION_URL/instance/fetchInstances" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq . || echo "❌ List instances falló"

echo ""

# Test 3: Create Test Instance
echo "3️⃣ Testing Create Instance..."
curl -s -X POST "$EVOLUTION_URL/instance/create" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "instanceName": "test_sms_scanner",
        "qrcode": true,
        "integration": "WHATSAPP-BAILEYS",
        "webhookUrl": "https://n8n.cloude.es/webhook/evolution",
        "webhookByEvents": true,
        "events": ["QRCODE_UPDATED", "MESSAGES_UPSERT", "CONNECTION_UPDATE"]
    }' | jq . || echo "❌ Create instance falló"

echo ""
echo "✅ Tests completados!"
echo ""
echo "📋 PRÓXIMO PASO:"
echo "Si todo funcionó, usar la instancia 'test_sms_scanner' para generar QR"