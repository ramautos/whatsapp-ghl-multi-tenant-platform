#!/bin/bash

echo "🔍 DIAGNÓSTICO PROFUNDO: EVOLUTION API → N8N"
echo "=============================================="

EVOLUTION_URL="https://evolutionv2.cloude.es"
N8N_WEBHOOK="https://ray.cloude.es/webhook/evolution1"
API_KEY="CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg"

echo "📋 Sistema:"
echo "- Evolution: $EVOLUTION_URL"
echo "- N8N Webhook: $N8N_WEBHOOK"
echo "- API Key: $API_KEY"
echo ""

# Test 1: Verificar que Evolution puede hacer requests HTTP salientes
echo "1️⃣ Test: ¿Evolution puede hacer requests HTTP?"
curl -s -X POST "$EVOLUTION_URL/instance/sendText/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"number": "18099939042", "text": "test conectividad"}' | jq .

echo ""

# Test 2: Verificar configuración actual del webhook
echo "2️⃣ Configuración actual del webhook:"
WEBHOOK_CONFIG=$(curl -s -X GET "$EVOLUTION_URL/webhook/find/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json")
echo "$WEBHOOK_CONFIG" | jq .

echo ""

# Test 3: Verificar si Evolution puede conectar con N8N
echo "3️⃣ Test: ¿Evolution puede conectar con N8N?"
# Simular request desde el servidor de Evolution
curl -s -X POST "$N8N_WEBHOOK" \
    -H "Content-Type: application/json" \
    -H "User-Agent: node-fetch/1.0" \
    -H "X-Forwarded-For: $(curl -s ifconfig.me)" \
    -d '{"test": "from_evolution_server", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
    -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"

echo ""

# Test 4: Verificar si hay filtros/proxies bloqueando
echo "4️⃣ Test: Headers específicos de Evolution"
curl -s -X POST "$N8N_WEBHOOK" \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "Accept: */*" \
    -H "Accept-Encoding: gzip, deflate" \
    -H "Connection: close" \
    -d '{"event": "messages.upsert", "instance": "ray", "test": true}' \
    -w "\nHTTP Status: %{http_code}\n"

echo ""

# Test 5: Verificar logs de Evolution (si están disponibles)
echo "5️⃣ Estado detallado de Evolution:"
curl -s -X GET "$EVOLUTION_URL/instance/fetchInstances" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" | jq '.[] | select(.name == "ray") | {name: .name, status: .connectionStatus, webhook: "configurado"}'

echo ""

# Test 6: Forzar un evento que debería activar webhook
echo "6️⃣ Forzar evento para activar webhook:"
echo "   Enviando mensaje desde Evolution..."

curl -X POST "$EVOLUTION_URL/message/sendText/ray" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "number": "18099939042",
        "text": "🧪 Test webhook forzado - '$(date +%H:%M:%S)'"
    }'

echo ""
echo ""

echo "💡 POSIBLES PROBLEMAS:"
echo ""
echo "🔥 Si Test 1 falla: Evolution API no puede hacer requests salientes"
echo "🔥 Si Test 3 falla: Problema de conectividad servidor → N8N"
echo "🔥 Si Test 4 falla: N8N rechaza headers específicos de Evolution"
echo "🔥 Si Test 6 no genera webhook: Evolution no procesa eventos internos"
echo ""
echo "🔧 SOLUCIONES SEGÚN RESULTADO:"
echo "- Problema conectividad: Verificar firewall/proxy en Coolify"
echo "- Headers rechazados: Configurar N8N para aceptar cualquier Content-Type"
echo "- Eventos no procesados: Bug interno de Evolution API"