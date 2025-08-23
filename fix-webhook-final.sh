#!/bin/bash

echo "🔧 ARREGLANDO WEBHOOK - CONFIGURACIÓN FINAL"
echo "==========================================="

EVOLUTION_URL="https://evolution.cloude.es"
INSTANCE_NAME="ray"
API_KEY="21PJg5GG39P0mvIIm8uSSSKBmk57X3wM"

# Primero obtenemos la URL exacta del webhook de N8N
echo "1️⃣ Verificando la URL exacta del webhook de N8N..."
echo "   Vas a necesitar ir a N8N y copiar la URL exacta del webhook"
echo "   Ve a: https://ray.cloude.es"
echo "   Abre tu workflow 'SMS Scanner - Ray Instance'"
echo "   Haz clic en el nodo 'Evolution Webhook'"
echo "   Copia la Production URL que aparece ahí"
echo ""

# Mientras tanto, vamos a resetear el webhook
echo "2️⃣ Reseteando configuración del webhook..."
curl -X DELETE "$EVOLUTION_URL/webhook/remove/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json"

echo ""
echo ""

echo "3️⃣ Configurando webhook con estructura completa..."
curl -X POST "$EVOLUTION_URL/webhook/set/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "webhook": {
            "url": "https://ray.cloude.es/webhook/evolution1",
            "enabled": true,
            "byEvents": true,
            "base64": false,
            "events": ["MESSAGES_UPSERT"]
        }
    }'

echo ""
echo ""

echo "4️⃣ Verificando nueva configuración..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""
echo ""

echo "🎯 PASOS SIGUIENTES:"
echo "1. Ve a N8N: https://ray.cloude.es"
echo "2. Asegúrate que el workflow 'SMS Scanner - Ray Instance' esté ACTIVO (toggle verde)"
echo "3. Copia la Production URL exacta del nodo webhook"
echo "4. Si la URL es diferente a 'evolution1', dime cuál es para reconfigurar Evolution"
echo ""
echo "💡 TIP: El webhook debe estar activo Y la URL debe coincidir exactamente"