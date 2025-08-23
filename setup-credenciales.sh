#!/bin/bash

echo "🔑 CONFIGURANDO CREDENCIALES GHL EN N8N"
echo "======================================"

# Esperar que N8N esté listo
echo "⏳ Esperando que N8N esté disponible..."
until curl -s http://localhost:5678 > /dev/null; do
  sleep 2
  echo "Esperando N8N..."
done

echo "✅ N8N está funcionando"

# Configurar credenciales automáticamente via API de N8N
echo "🔧 Configurando credenciales GoHighLevel..."

# Crear credencial HTTP Header Auth para GHL
curl -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -u admin:admin123 \
  -d '{
    "name": "GoHighLevel API",
    "type": "httpHeaderAuth",
    "data": {
      "name": "Authorization",
      "value": "Bearer pit-fe180478-8160-483d-995e-10e169ce121b"
    }
  }' || echo "Credencial ya existe o se configurará manualmente"

echo "
🎯 CREDENCIALES CONFIGURADAS:

📊 GoHighLevel:
   Access Token: pit-fe180478-8160-483d-995e-10e169ce121b
   Location ID:  jtEqGdhkoR6iePmZaCmd

🔧 Para configurar manualmente en N8N:
1. Ir a: http://localhost:5678
2. Login: admin / admin123
3. Settings → Credentials → Add Credential
4. Tipo: HTTP Header Auth
5. Header Name: Authorization
6. Header Value: Bearer pit-fe180478-8160-483d-995e-10e169ce121b

📝 Variables a agregar:
- GHL_LOCATION_ID = jtEqGdhkoR6iePmZaCmd
"