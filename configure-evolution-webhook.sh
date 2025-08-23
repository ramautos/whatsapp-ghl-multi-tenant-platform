#!/bin/bash

echo "🔧 CONFIGURANDO WEBHOOK EVOLUTION API → N8N"
echo "============================================="

EVOLUTION_URL="https://evolution.cloude.es"
WEBHOOK_URL="https://ray.cloude.es/webhook/evolution1"
INSTANCE_NAME="ray"

# Necesitas proporcionar tu API Key de Evolution
if [ -z "$1" ]; then
    echo "❌ Error: Proporciona la API Key de Evolution"
    echo "Uso: ./configure-evolution-webhook.sh <API_KEY>"
    exit 1
fi

API_KEY="$1"

echo "🔑 API Key: $API_KEY"
echo "📡 Evolution URL: $EVOLUTION_URL"
echo "🎯 Webhook URL: $WEBHOOK_URL"
echo "📱 Instancia: $INSTANCE_NAME"
echo ""

# 1. Verificar que la instancia existe
echo "1️⃣ Verificando instancia '$INSTANCE_NAME'..."
INSTANCE_CHECK=$(curl -s -X GET "$EVOLUTION_URL/instance/fetchInstances" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json")

echo "Respuesta: $INSTANCE_CHECK"
echo ""

# 2. Configurar webhook para la instancia
echo "2️⃣ Configurando webhook para instancia '$INSTANCE_NAME'..."
curl -X POST "$EVOLUTION_URL/webhook/set/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"url\": \"$WEBHOOK_URL\",
        \"webhook_by_events\": true,
        \"webhook_base64\": false,
        \"events\": [
            \"APPLICATION_STARTUP\",
            \"QRCODE_UPDATED\",
            \"CONNECTION_UPDATE\",
            \"MESSAGES_UPSERT\",
            \"MESSAGES_UPDATE\",
            \"MESSAGES_DELETE\",
            \"SEND_MESSAGE\",
            \"CONTACTS_SET\",
            \"CONTACTS_UPSERT\",
            \"CONTACTS_UPDATE\",
            \"PRESENCE_UPDATE\",
            \"CHATS_SET\",
            \"CHATS_UPSERT\",
            \"CHATS_UPDATE\",
            \"CHATS_DELETE\",
            \"GROUPS_UPSERT\",
            \"GROUP_UPDATE\",
            \"GROUP_PARTICIPANTS_UPDATE\",
            \"NEW_JWT_TOKEN\"
        ]
    }"

echo ""
echo ""

# 3. Verificar configuración del webhook
echo "3️⃣ Verificando configuración del webhook..."
curl -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json"

echo ""
echo ""

# 4. Verificar estado de la instancia
echo "4️⃣ Verificando estado de conexión..."
curl -X GET "$EVOLUTION_URL/instance/connectionState/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json"

echo ""
echo ""

echo "✅ CONFIGURACIÓN COMPLETADA!"
echo ""
echo "📋 RESUMEN:"
echo "- Evolution API: $EVOLUTION_URL"
echo "- Instancia: $INSTANCE_NAME"
echo "- Webhook URL: $WEBHOOK_URL"
echo "- N8N: https://ray.cloude.es"
echo ""
echo "🧪 PRÓXIMO PASO:"
echo "Envía un mensaje a WhatsApp para probar el flujo completo!"
echo ""
echo "🔍 PARA DEBUGGEAR:"
echo "- Logs N8N: https://ray.cloude.es (ver ejecuciones del workflow)"
echo "- Logs Evolution: Revisar instancia en $EVOLUTION_URL/manager"