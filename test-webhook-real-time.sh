#!/bin/bash

echo "🔍 PRUEBA EN TIEMPO REAL - MONITOREANDO WEBHOOKS"
echo "================================================"

EVOLUTION_URL="https://evolution.cloude.es"
INSTANCE_NAME="ray"
API_KEY="21PJg5GG39P0mvIIm8uSSSKBmk57X3wM"

echo "🎯 INSTRUCCIONES:"
echo "1. Deja este script corriendo"
echo "2. Envía un mensaje a WhatsApp (instancia ray)"
echo "3. Observa si Evolution detecta el mensaje"
echo ""

# Función para verificar los últimos mensajes
check_messages() {
    echo "🔍 Verificando últimos mensajes en Evolution..."
    curl -s -X GET "$EVOLUTION_URL/chat/findMessages/$INSTANCE_NAME" \
        -H "apikey: $API_KEY" \
        -H "Content-Type: application/json" \
        -G -d "limit=5" | jq '.[] | {key: .key, messageTimestamp: .messageTimestamp, fromMe: .key.fromMe, message: .message}'
}

# Función para verificar logs de webhook
check_webhook_logs() {
    echo "🔍 Estado actual del webhook..."
    curl -s -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
        -H "apikey: $API_KEY" \
        -H "Content-Type: application/json" | jq '{url: .url, enabled: .enabled, events: .events, updatedAt: .updatedAt}'
}

echo "📊 Estado inicial:"
check_webhook_logs
echo ""

echo "📱 Últimos 5 mensajes:"
check_messages
echo ""

echo "⏰ Monitoreando en tiempo real..."
echo "   Envía un mensaje AHORA y veremos si aparece aquí..."
echo ""

# Monitor en tiempo real (cada 5 segundos por 2 minutos)
for i in {1..24}; do
    echo "🕐 Check $i/24 ($(date '+%H:%M:%S'))"
    check_messages
    echo "---"
    sleep 5
done

echo ""
echo "⏹️ Monitoreo completado."
echo ""
echo "💡 Si los mensajes aparecen aquí pero NO llegan a N8N:"
echo "   → Evolution detecta mensajes pero no envía webhooks"
echo "   → Problema de conectividad Evolution → N8N"
echo ""
echo "💡 Si los mensajes NO aparecen aquí:"
echo "   → Problema con la instancia de WhatsApp"
echo "   → Verificar conexión QR en Evolution Manager"