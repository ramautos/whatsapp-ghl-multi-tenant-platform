#!/bin/bash

echo "🚀 CONFIGURACIÓN FINAL EVOLUTION API - SISTEMA COMPLETO"
echo "======================================================="

EVOLUTION_URL="https://evolutionv2.cloude.es"
API_KEY="CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg"

# Esta URL la obtendrás del nuevo workflow en N8N
NEW_WEBHOOK_URL="https://ray.cloude.es/webhook/evolution-webhook-fixed"

echo "🔧 Configurando webhook final para instancia 'ray'..."
echo "Evolution: $EVOLUTION_URL"
echo "Webhook: $NEW_WEBHOOK_URL"
echo ""

# 1. Limpiar configuración anterior
echo "1️⃣ Limpiando configuración anterior..."
curl -X DELETE "$EVOLUTION_URL/webhook/remove/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json"

echo ""

# 2. Configurar webhook final
echo "2️⃣ Configurando webhook final..."
curl -X POST "$EVOLUTION_URL/webhook/set/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"webhook\": {
            \"url\": \"$NEW_WEBHOOK_URL\",
            \"enabled\": true,
            \"byEvents\": true,
            \"base64\": false,
            \"events\": [\"MESSAGES_UPSERT\"]
        }
    }"

echo ""
echo ""

# 3. Verificar configuración
echo "3️⃣ Verificando configuración final..."
curl -s -X GET "$EVOLUTION_URL/webhook/find/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""
echo ""

# 4. Verificar instancia
echo "4️⃣ Verificando instancia 'ray'..."
curl -s -X GET "$EVOLUTION_URL/instance/connectionState/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq .

echo ""
echo ""

echo "✅ CONFIGURACIÓN FINAL COMPLETADA"
echo ""
echo "🧪 PRUEBA FINAL:"
echo "1. Envía mensaje a WhatsApp (instancia ray)"
echo "2. Verifica ejecución en N8N"
echo "3. Verifica contacto en GoHighLevel"
echo ""
echo "🎯 FLUJO COMPLETO:"
echo "📱 WhatsApp → 🔄 Evolution API → 🎯 N8N → 🏢 GoHighLevel"