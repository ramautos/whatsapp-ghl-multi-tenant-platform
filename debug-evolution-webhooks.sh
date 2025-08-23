#!/bin/bash

echo "🔍 DIAGNÓSTICO ESPECÍFICO - ¿POR QUÉ EVOLUTION NO ENVÍA WEBHOOKS?"
echo "=================================================================="

EVOLUTION_URL="https://evolution.cloude.es"
INSTANCE_NAME="ray"
API_KEY="21PJg5GG39P0mvIIm8uSSSKBmk57X3wM"

echo "📋 Diagnóstico del problema..."
echo ""

# 1. Verificar configuración actual del webhook
echo "1️⃣ Configuración actual del webhook..."
WEBHOOK_CONFIG=$(curl -s -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json")
echo "$WEBHOOK_CONFIG" | jq .
echo ""

# 2. Verificar configuración de la instancia (settings específicos)
echo "2️⃣ Settings de la instancia ray..."
curl -s -X GET "$EVOLUTION_URL/settings/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .
echo ""

# 3. Verificar eventos específicos habilitados en la instancia
echo "3️⃣ Verificando si MESSAGES_UPSERT está habilitado..."
ENABLED_EVENTS=$(echo "$WEBHOOK_CONFIG" | jq -r '.events[]')
echo "Eventos habilitados: $ENABLED_EVENTS"
echo ""

# 4. Forzar reconfiguración con TODOS los eventos necesarios
echo "4️⃣ Reconfiguración FORZADA con todos los eventos..."
curl -X POST "$EVOLUTION_URL/webhook/set/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "webhook": {
            "url": "https://ray.cloude.es/webhook/evolution1",
            "enabled": true,
            "byEvents": true,
            "base64": false,
            "events": [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE", 
                "SEND_MESSAGE",
                "CONNECTION_UPDATE",
                "CONTACTS_UPSERT"
            ]
        }
    }'

echo ""
echo ""

# 5. Verificar nueva configuración
echo "5️⃣ Verificando nueva configuración..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""
echo ""

# 6. Verificar si hay problemas con los settings de la instancia
echo "6️⃣ Actualizando settings de la instancia para asegurar webhook..."
curl -X POST "$EVOLUTION_URL/settings/set/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "rejectCall": false,
        "msgCall": "",
        "groupsIgnore": false,
        "alwaysOnline": false,
        "readMessages": false,
        "readStatus": false,
        "syncFullHistory": false
    }'

echo ""
echo ""

echo "✅ RECONFIGURACIÓN COMPLETADA"
echo ""
echo "🧪 PRUEBA AHORA:"
echo "1. Envía un mensaje a WhatsApp (instancia ray)"
echo "2. Verifica inmediatamente en N8N si llega"
echo ""
echo "💡 Si sigue sin funcionar, puede ser:"
echo "- Problema de red entre Evolution y N8N"
echo "- Evolution API tiene logs de error internos"
echo "- Necesitamos revisar logs de Evolution directamente"