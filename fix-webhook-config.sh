#!/bin/bash

echo "🔧 CONFIGURANDO WEBHOOK EVOLUTION API → N8N (CORREGIDO)"
echo "======================================================="

EVOLUTION_URL="https://evolution.cloude.es"
WEBHOOK_URL="https://ray.cloude.es/webhook/evolution1"
INSTANCE_NAME="ray"
API_KEY="21PJg5GG39P0mvIIm8uSSSKBmk57X3wM"

echo "🔑 API Key: $API_KEY"
echo "📡 Evolution URL: $EVOLUTION_URL"
echo "🎯 Webhook URL: $WEBHOOK_URL"
echo "📱 Instancia: $INSTANCE_NAME"
echo ""

# Método corregido - usando la estructura correcta del webhook
echo "🔧 Configurando webhook para instancia '$INSTANCE_NAME'..."
curl -X POST "$EVOLUTION_URL/webhook/set/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"webhook\": {
            \"url\": \"$WEBHOOK_URL\",
            \"byEvents\": true,
            \"base64\": false,
            \"events\": [
                \"APPLICATION_STARTUP\",
                \"QRCODE_UPDATED\",
                \"CONNECTION_UPDATE\", 
                \"MESSAGES_UPSERT\",
                \"MESSAGES_UPDATE\",
                \"SEND_MESSAGE\",
                \"CONTACTS_SET\",
                \"CONTACTS_UPSERT\",
                \"PRESENCE_UPDATE\",
                \"CHATS_SET\",
                \"CHATS_UPSERT\"
            ]
        }
    }"

echo ""
echo ""

# Verificar configuración
echo "🔍 Verificando configuración del webhook..."
curl -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json"

echo ""
echo ""

echo "✅ WEBHOOK CONFIGURADO!"
echo ""
echo "📋 CONFIGURACIÓN:"
echo "- Instancia: $INSTANCE_NAME (conectada)"
echo "- Webhook: $WEBHOOK_URL"
echo "- Eventos: MESSAGES_UPSERT habilitado"
echo ""
echo "🧪 PRUEBA:"
echo "Envía un mensaje a WhatsApp de la instancia 'ray' para ver el flujo completo!"