#!/bin/bash

echo "🔍 DEBUGGING WEBHOOK EVOLUTION API"
echo "=================================="

EVOLUTION_URL="https://evolution.cloude.es"
INSTANCE_NAME="ray"
API_KEY="21PJg5GG39P0mvIIm8uSSSKBmk57X3wM"

echo "📋 Información del sistema:"
echo "- Evolution API: $EVOLUTION_URL"
echo "- Instancia: $INSTANCE_NAME"
echo "- API Key: $API_KEY"
echo ""

# 1. Verificar estado de la instancia
echo "1️⃣ Estado de la instancia..."
curl -s -X GET "$EVOLUTION_URL/instance/connectionState/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""

# 2. Verificar configuración del webhook
echo "2️⃣ Configuración actual del webhook..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""

# 3. Verificar información de la instancia
echo "3️⃣ Información completa de la instancia..."
curl -s -X GET "$EVOLUTION_URL/instance/fetchInstances" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq '.[] | select(.name == "ray")'

echo ""

# 4. Test del webhook URL
echo "4️⃣ Probando conectividad al webhook URL..."
curl -s -X POST "https://ray.cloude.es/webhook/evolution1" \
    -H "Content-Type: application/json" \
    -d '{"test": true, "message": "test webhook"}' \
    -w "\nStatus Code: %{http_code}\n"

echo ""
echo "🔧 Si no funciona, intentemos reconfigurar..."