#!/bin/bash

echo "🔧 CONFIGURANDO WEBHOOK ESPECÍFICO PARA INSTANCIA RAY"
echo "===================================================="

EVOLUTION_URL="https://evolution.cloude.es"
INSTANCE_NAME="ray"
API_KEY="21PJg5GG39P0mvIIm8uSSSKBmk57X3wM"
WEBHOOK_URL="https://ray.cloude.es/webhook/evolution1"

echo "📋 Configurando webhook específico para instancia '$INSTANCE_NAME'..."
echo ""

# 1. Eliminar webhook existente
echo "1️⃣ Limpiando webhook existente..."
curl -X DELETE "$EVOLUTION_URL/webhook/remove/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json"

echo ""
echo ""

# 2. Configurar webhook específico para la instancia
echo "2️⃣ Configurando webhook específico para instancia..."
curl -X POST "$EVOLUTION_URL/webhook/set/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"webhook\": {
            \"url\": \"$WEBHOOK_URL\",
            \"enabled\": true,
            \"byEvents\": true,
            \"base64\": false,
            \"events\": [\"MESSAGES_UPSERT\"]
        }
    }"

echo ""
echo ""

# 3. Verificar configuración
echo "3️⃣ Verificando nueva configuración..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""
echo ""

# 4. Probar envío de mensaje para activar webhook
echo "4️⃣ Enviando mensaje de prueba para activar webhook..."

# Usar endpoint correcto para enviar mensaje
curl -X POST "$EVOLUTION_URL/message/sendText/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"number\": \"18099939042\",
        \"text\": \"🧪 Test webhook $(date +'%H:%M:%S')\"
    }"

echo ""
echo ""

echo "5️⃣ Esperando 5 segundos y verificando resultado..."
sleep 5

# Verificar si llegó a N8N
echo "6️⃣ Ve a N8N ahora: https://ray.cloude.es"
echo "   Debería aparecer una nueva ejecución del workflow"
echo ""

echo "✅ CONFIGURACIÓN COMPLETADA"
echo ""
echo "🧪 AHORA PRUEBA:"
echo "1. Envía un mensaje a WhatsApp (instancia ray) desde otro número"
echo "2. Verifica inmediatamente en N8N si aparece ejecución"
echo ""
echo "💡 Si sigue sin funcionar, implementaremos solución de polling"