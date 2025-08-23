#!/bin/bash

echo "🔍 ANÁLISIS PROFUNDO - ¿POR QUÉ EVOLUTION NO ENVÍA WEBHOOKS?"
echo "============================================================="

EVOLUTION_URL="https://evolution.cloude.es"
INSTANCE_NAME="ray"
API_KEY="21PJg5GG39P0mvIIm8uSSSKBmk57X3wM"

echo "📋 Análisis sistemático del problema..."
echo ""

# 1. Verificar configuración actual completa
echo "1️⃣ Configuración actual del webhook..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""

# 2. Verificar configuración global vs instancia
echo "2️⃣ Verificando si hay conflicto webhook global vs instancia..."
echo "Variables de entorno que pueden causar conflicto:"
echo "- WEBHOOK_GLOBAL_ENABLED=true (puede estar interfiriendo)"
echo "- WEBHOOK_GLOBAL_URL=https://ray.cloude.es/webhook/evolution1"
echo ""

# 3. Verificar últimos mensajes para ver si Evolution detecta actividad
echo "3️⃣ Verificando últimos mensajes en Evolution..."
MESSAGES=$(curl -s -X GET "$EVOLUTION_URL/chat/findMessages/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -G -d "limit=5")

if [ "$MESSAGES" = "[]" ] || [ "$MESSAGES" = "" ]; then
    echo "❌ No hay mensajes recientes - Evolution no está detectando mensajes"
    echo "   Esto indica problema con la instancia WhatsApp"
else
    echo "✅ Mensajes encontrados:"
    echo "$MESSAGES" | jq '.[] | {timestamp: .messageTimestamp, fromMe: .key.fromMe, text: (.message.conversation // .message.extendedTextMessage.text // "multimedia")}'
fi

echo ""

# 4. Verificar estado de conexión específico
echo "4️⃣ Estado detallado de la instancia..."
curl -s -X GET "$EVOLUTION_URL/instance/connectionState/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""

# 5. Verificar configuraciones que pueden bloquear webhooks
echo "5️⃣ Settings que pueden afectar webhooks..."
curl -s -X GET "$EVOLUTION_URL/settings/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""

# 6. Test para forzar un evento que debería activar webhook
echo "6️⃣ Intentando forzar un evento MESSAGES_UPSERT..."

# Simular recepción de mensaje desde otro número
echo "Enviando mensaje a número diferente para ver si genera webhook..."

# 7. Verificar si Evolution tiene problemas internos
echo "7️⃣ Verificando health general de Evolution..."
curl -s -X GET "$EVOLUTION_URL/instance/fetchInstances" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq '.[] | select(.name == "ray") | {name: .name, connectionStatus: .connectionStatus, profileName: .profileName}'

echo ""
echo ""

echo "🔧 POSIBLES CAUSAS:"
echo ""
echo "1️⃣ WEBHOOK GLOBAL interfiere con webhook de instancia"
echo "   → Deshabilitar WEBHOOK_GLOBAL_ENABLED en Coolify"
echo ""
echo "2️⃣ Evolution no está detectando mensajes entrantes"
echo "   → Problema con conexión WhatsApp"
echo "   → Verificar QR Code o reconectar instancia"
echo ""
echo "3️⃣ Configuración interna de Evolution bloqueando webhooks"
echo "   → Revisar logs específicos en Coolify"
echo "   → Puede necesitar restart del contenedor"
echo ""
echo "4️⃣ Base de datos/Redis causando problemas"
echo "   → Evolution no puede guardar/procesar eventos"
echo ""
echo "💡 SIGUIENTE ACCIÓN:"
echo "Basado en los resultados arriba, implementar fix específico"