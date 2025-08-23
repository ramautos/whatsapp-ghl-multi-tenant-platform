#!/bin/bash

echo "🔍 TEST DIRECTO - VERIFICAR SI EVOLUTION PUEDE ENVIAR WEBHOOKS"
echo "=============================================================="

EVOLUTION_URL="https://evolution.cloude.es"
INSTANCE_NAME="ray"
API_KEY="21PJg5GG39P0mvIIm8uSSSKBmk57X3wM"
WEBHOOK_URL="https://ray.cloude.es/webhook/evolution1"

echo "📋 Sistema:"
echo "- Evolution: $EVOLUTION_URL"
echo "- Instancia: $INSTANCE_NAME"
echo "- Webhook: $WEBHOOK_URL"
echo ""

# 1. Verificar que Evolution puede conectar con N8N
echo "1️⃣ Probando conectividad Evolution → N8N..."
curl -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"test": "connectivity_check", "from": "evolution_direct_test"}' \
    -w "\nStatus: %{http_code} | Time: %{time_total}s\n"

echo ""

# 2. Verificar configuración actual del webhook en Evolution
echo "2️⃣ Verificando configuración webhook en Evolution..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq '{url: .url, enabled: .enabled, events: .events}'

echo ""

# 3. Verificar últimos mensajes en Evolution
echo "3️⃣ Verificando últimos mensajes en Evolution..."
curl -s -X GET "$EVOLUTION_URL/chat/findMessages/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -G -d "limit=3" | jq '.[] | {timestamp: .messageTimestamp, fromMe: .key.fromMe, message: (.message.conversation // .message.extendedTextMessage.text // "multimedia")}'

echo ""

# 4. Probar envío manual de webhook desde Evolution
echo "4️⃣ Enviando mensaje de prueba desde Evolution para activar webhook..."

# Enviar mensaje de prueba para activar el webhook
TEST_MESSAGE=$(cat <<EOF
{
    "number": "18099939042",
    "options": {
        "delay": 1200,
        "presence": "composing"
    },
    "textMessage": {
        "text": "🧪 Mensaje de prueba para activar webhook - $(date)"
    }
}
EOF
)

curl -X POST "$EVOLUTION_URL/message/sendText/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$TEST_MESSAGE"

echo ""
echo ""

echo "5️⃣ Esperando 10 segundos para que el webhook se active..."
sleep 10

echo ""
echo "6️⃣ Verificando si llegó algo a N8N..."
echo "   Ve a https://ray.cloude.es y revisa las ejecuciones"
echo ""

echo "💡 POSIBLES PROBLEMAS:"
echo "- Firewall de Coolify bloqueando salida"
echo "- Evolution no puede resolver ray.cloude.es"
echo "- Configuración interna de Evolution"
echo "- Problema de red Docker en Coolify"
echo ""

echo "🔧 SIGUIENTE PASO:"
echo "Si no funciona, necesitamos implementar polling como alternativa"