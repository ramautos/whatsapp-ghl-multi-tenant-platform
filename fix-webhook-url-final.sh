#!/bin/bash

echo "🔧 ARREGLO FINAL: WEBHOOK URL EVOLUTION → N8N"
echo "=============================================="

EVOLUTION_URL="https://evolutionv2.cloude.es"
CORRECT_WEBHOOK="https://ray.cloude.es/webhook/evolution1"
API_KEY="CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg"

echo "🎯 Configurando webhook correcto:"
echo "- Evolution: $EVOLUTION_URL"
echo "- Webhook correcto: $CORRECT_WEBHOOK"
echo ""

# 1. Configurar webhook correcto
echo "1️⃣ Configurando webhook hacia N8N..."
curl -X POST "$EVOLUTION_URL/webhook/set/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"webhook\": {
            \"url\": \"$CORRECT_WEBHOOK\",
            \"enabled\": true,
            \"byEvents\": true,
            \"base64\": false,
            \"events\": [\"MESSAGES_UPSERT\"]
        }
    }"

echo ""
echo ""

# 2. Verificar configuración
echo "2️⃣ Verificando nueva configuración..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""
echo ""

# 3. Test inmediato del webhook
echo "3️⃣ Test inmediato del webhook..."
curl -X POST "$CORRECT_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d '{"test": "final_test", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
    -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""

echo "✅ WEBHOOK RECONFIGURADO"
echo ""
echo "🧪 AHORA PRUEBA:"
echo "1. Asegúrate que N8N workflow esté ACTIVO"
echo "2. Envía mensaje a WhatsApp instancia 'ray'"
echo "3. Webhook debería funcionar inmediatamente"
echo ""
echo "🎯 Si N8N dice 'webhook not registered':"
echo "   → Ve a N8N y ACTIVA el workflow (toggle verde)"