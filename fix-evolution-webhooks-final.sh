#!/bin/bash

echo "🔧 ARREGLO DEFINITIVO WEBHOOKS EVOLUTION API"
echo "============================================="

EVOLUTION_URL="https://evolutionv2.cloude.es"
WEBHOOK_URL="https://ray.cloude.es/webhook/evolution1"
API_KEY="evolution-api-key-2025"

echo "🎯 Aplicando workarounds basados en GitHub Issues..."
echo ""

# WORKAROUND 1: Limpiar webhooks existentes
echo "1️⃣ Limpiando webhooks conflictivos..."
curl -X DELETE "$EVOLUTION_URL/webhook/remove/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" 2>/dev/null

echo ""

# WORKAROUND 2: Configurar webhook con formato específico que funciona
echo "2️⃣ Configurando webhook con formato que resuelve bug..."
curl -X POST "$EVOLUTION_URL/webhook/set/ray" \
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

# WORKAROUND 3: Forzar reconexión de instancia
echo "3️⃣ Forzando reconexión de instancia (soluciona instance not found)..."
curl -X POST "$EVOLUTION_URL/instance/restart/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json"

echo ""
echo ""

# WORKAROUND 4: Verificar configuración final
echo "4️⃣ Verificando configuración final..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""
echo ""

# WORKAROUND 5: Test del webhook
echo "5️⃣ Test inmediato del webhook..."
curl -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"event": "test", "instance": "ray", "data": {"test": true}}' \
    -w "\nStatus: %{http_code}\n"

echo ""
echo ""

echo "✅ WORKAROUNDS APLICADOS"
echo ""
echo "🧪 AHORA PRUEBA:"
echo "1. Envía mensaje a WhatsApp instancia 'ray'"
echo "2. Webhook debería funcionar con estas configuraciones"
echo ""
echo "💡 SI SIGUE SIN FUNCIONAR:"
echo "- Cambiar imagen a: atendai/evolution-api:dev"
echo "- O usar webhook global forzado en variables de entorno"