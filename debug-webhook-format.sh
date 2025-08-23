#!/bin/bash

echo "🔍 DEBUGGING FORMATO WEBHOOK - EVOLUTION VS N8N"
echo "==============================================="

N8N_WEBHOOK="https://ray.cloude.es/webhook/evolution1"

echo "🧪 Test 1: Formato Postman (que funciona)"
curl -X POST "$N8N_WEBHOOK" \
    -H "Content-Type: application/json" \
    -H "User-Agent: PostmanRuntime/7.32.3" \
    -d '{"test": "postman_format", "event": "MESSAGES_UPSERT", "data": {"test": true}}' \
    -v

echo ""
echo ""

echo "🧪 Test 2: Formato Evolution API (simulado)"
curl -X POST "$N8N_WEBHOOK" \
    -H "Content-Type: application/json" \
    -H "User-Agent: Evolution-API/2.0" \
    -d '{
        "event": "messages.upsert",
        "instance": "ray", 
        "data": {
            "messages": [{
                "key": {
                    "remoteJid": "5511999999999@s.whatsapp.net",
                    "fromMe": false,
                    "id": "TEST123"
                },
                "message": {
                    "conversation": "Test message"
                },
                "messageTimestamp": 1640995200
            }]
        }
    }' \
    -v

echo ""
echo ""

echo "🧪 Test 3: Formato con headers específicos de Evolution"
curl -X POST "$N8N_WEBHOOK" \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "User-Agent: node-fetch/1.0 (+https://github.com/bitinn/node-fetch)" \
    -H "Accept: */*" \
    -H "Accept-Encoding: gzip,deflate" \
    -d '{"event": "messages.upsert", "instance": "ray"}' \
    -v

echo ""
echo ""

echo "💡 COMPARAR LOS RESULTADOS:"
echo "- Si Test 1 funciona = N8N está bien"
echo "- Si Test 2 falla = Problema de formato de datos"
echo "- Si Test 3 falla = Problema de headers HTTP"