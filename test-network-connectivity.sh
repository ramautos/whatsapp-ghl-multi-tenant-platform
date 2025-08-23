#!/bin/bash

echo "🔍 TEST DE CONECTIVIDAD - EVOLUTION API PUERTOS Y RED"
echo "===================================================="

EVOLUTION_URL="https://evolution.cloude.es"
N8N_WEBHOOK="https://ray.cloude.es/webhook/evolution1"

echo "📋 Verificando conectividad desde tu máquina local..."
echo ""

# 1. Test básico de conectividad
echo "1️⃣ Test conectividad básica..."
echo "Evolution API:"
curl -I -s $EVOLUTION_URL | head -1 || echo "❌ No responde"

echo "N8N Webhook:"
curl -I -s $N8N_WEBHOOK | head -1 || echo "❌ No responde"

echo ""

# 2. Test DNS resolution
echo "2️⃣ Test DNS resolution..."
echo "evolution.cloude.es:"
nslookup evolution.cloude.es | grep "Address" | tail -1

echo "ray.cloude.es:"
nslookup ray.cloude.es | grep "Address" | tail -1

echo ""

# 3. Test puertos específicos
echo "3️⃣ Test conectividad puertos..."
echo "Puerto 443 (HTTPS) - evolution.cloude.es:"
nc -zv evolution.cloude.es 443 2>&1 | grep -E "(succeeded|failed)"

echo "Puerto 443 (HTTPS) - ray.cloude.es:"
nc -zv ray.cloude.es 443 2>&1 | grep -E "(succeeded|failed)"

echo ""

# 4. Test webhook específico
echo "4️⃣ Test webhook directo..."
curl -X POST $N8N_WEBHOOK \
    -H "Content-Type: application/json" \
    -d '{"test": "network_connectivity", "source": "local_test"}' \
    -w "\nStatus: %{http_code} | Time: %{time_total}s\n" 2>/dev/null

echo ""

# 5. Verificar si Evolution puede hacer requests salientes
echo "5️⃣ Simulando request desde Evolution..."
echo "   (Esto simula lo que Evolution haría para enviar webhook)"

# Usar user-agent similar a lo que usaría Evolution
curl -X POST $N8N_WEBHOOK \
    -H "Content-Type: application/json" \
    -H "User-Agent: Evolution-API/2.0" \
    -d '{"event": "MESSAGES_UPSERT", "instance": "ray", "data": {"test": true}}' \
    -w "\nStatus: %{http_code} | Time: %{time_total}s\n" 2>/dev/null

echo ""

echo "🔧 DIAGNÓSTICO:"
echo ""
echo "✅ Si todos los tests pasan:"
echo "   → Problema es configuración interna de Evolution"
echo "   → Necesitamos revisar logs de Coolify"
echo ""
echo "❌ Si fallan tests de conectividad:"
echo "   → Problema de firewall/red en servidor Ubuntu"
echo "   → Evolution no puede conectar con N8N"
echo ""
echo "💡 SIGUIENTE PASO:"
echo "Si los tests fallan, necesitamos verificar:"
echo "- Firewall en servidor Ubuntu donde está Coolify"
echo "- Configuración de red Docker en Coolify"
echo "- Variables de entorno SERVER_URL en Evolution"
echo ""
echo "🔍 Para revisar en el servidor Ubuntu:"
echo "sudo ufw status"
echo "sudo iptables -L"
echo "docker network ls"