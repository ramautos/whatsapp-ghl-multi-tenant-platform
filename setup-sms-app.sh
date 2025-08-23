#!/bin/bash

echo "🚀 SMS SCANNER APP - SETUP AUTOMÁTICO"
echo "=====================================

# 1. LEVANTAR SERVICIOS
echo "📦 Levantando Evolution API + N8N..."
docker-compose -f docker-compose-simple.yml up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 30

# 2. VERIFICAR SERVICIOS
echo "🔍 Verificando servicios..."

# Evolution API
if curl -s http://localhost:8080/instance/fetchInstances -H "apikey: evolution-api-key-2025" > /dev/null; then
    echo "✅ Evolution API está funcionando"
else
    echo "❌ Evolution API no responde"
fi

# N8N
if curl -s http://localhost:5678 > /dev/null; then
    echo "✅ N8N está funcionando"
else
    echo "❌ N8N no responde"
fi

echo "
🎯 SERVICIOS LISTOS:

📱 Evolution API: http://localhost:8080
🔧 N8N:          http://localhost:5678
   Usuario: admin
   Password: admin123

🔑 API Key Evolution: evolution-api-key-2025

📋 PRÓXIMOS PASOS:
1. Crear instancia WhatsApp
2. Configurar workflow N8N  
3. Conectar GoHighLevel
4. Escanear QR WhatsApp
"

# 3. CREAR INSTANCIA WHATSAPP AUTOMÁTICAMENTE
echo "📱 Creando instancia WhatsApp por defecto..."

curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: evolution-api-key-2025" \
  -d '{
    "instanceName": "sms_scanner_main",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "webhookUrl": "http://host.docker.internal:5678/webhook/evolution",
    "webhookByEvents": true,
    "webhookBase64": false,
    "events": [
      "APPLICATION_STARTUP",
      "QRCODE_UPDATED", 
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "CONNECTION_UPDATE"
    ]
  }'

echo "
✅ Instancia 'sms_scanner_main' creada

🔗 Para obtener QR:
curl -H 'apikey: evolution-api-key-2025' http://localhost:8080/instance/connect/sms_scanner_main
"