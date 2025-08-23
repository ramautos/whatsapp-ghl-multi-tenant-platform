#!/bin/bash

echo "🔧 ACTUALIZAR EVOLUTION → N8N WEBHOOK FINAL"
echo "==========================================="

EVOLUTION_URL="https://evolutionv2.cloude.es"
NEW_N8N_WEBHOOK="https://ray.cloude.es/webhook/evolution1333"
API_KEY="CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg"

echo "🎯 Configurando webhook final:"
echo "- Evolution: $EVOLUTION_URL"
echo "- N8N Webhook: $NEW_N8N_WEBHOOK"
echo "- Instance: ray"
echo ""

# 1. Configurar webhook hacia N8N
echo "1️⃣ Configurando webhook hacia N8N..."
curl -X POST "$EVOLUTION_URL/webhook/set/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"webhook\": {
            \"url\": \"$NEW_N8N_WEBHOOK\",
            \"enabled\": true,
            \"byEvents\": true,
            \"base64\": false,
            \"events\": [\"MESSAGES_UPSERT\"]
        }
    }"

echo ""
echo ""

# 2. Verificar configuración
echo "2️⃣ Verificando configuración final..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""
echo ""

# 3. Test del webhook N8N
echo "3️⃣ Test del webhook N8N..."
curl -X POST "$NEW_N8N_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d '{
        "event": "messages.upsert",
        "instance": "ray",
        "data": {
            "key": {
                "remoteJid": "5511999999999@s.whatsapp.net",
                "fromMe": false,
                "id": "TEST123"
            },
            "message": {
                "conversation": "Test de webhook final"
            },
            "messageTimestamp": 1755831937
        }
    }' \
    -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""

echo "✅ CONFIGURACIÓN COMPLETADA"
echo ""
echo "🧪 PRUEBA FINAL:"
echo "1. Envía un mensaje a WhatsApp (instancia ray)"
echo "2. Ve a N8N executions"
echo "3. Verifica contacto en GoHighLevel"
echo ""
echo "🎯 FLUJO COMPLETO:"
echo "📱 WhatsApp → 🔄 Evolution API → 🎯 N8N → 🏢 GoHighLevel"