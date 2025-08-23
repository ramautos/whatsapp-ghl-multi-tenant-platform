# 📱 SMS Scanner App - Setup Completo

## 🎯 OBJETIVO
App que escanea QR de WhatsApp y envía todos los mensajes recibidos automáticamente a GoHighLevel.

**Flujo:** WhatsApp → Evolution API → N8N → GoHighLevel

## 🚀 INSTALACIÓN RÁPIDA

### 1. Levantar Servicios
```bash
cd evolution-ghl-integration

# Ejecutar setup automático
./setup-sms-app.sh

# O manualmente:
docker-compose -f docker-compose-simple.yml up -d
```

### 2. Verificar Servicios
- **Evolution API:** http://localhost:8080
- **N8N:** http://localhost:5678 (admin/admin123)  
- **QR Scanner:** `qr-scanner-simple.html`

### 3. Configurar GoHighLevel en N8N

#### A. Crear Credencial GHL:
1. Ir a N8N: http://localhost:5678
2. Login: admin/admin123
3. Settings → Credentials → Add Credential
4. Tipo: "HTTP Header Auth"
5. Nombre: "GoHighLevel API"
6. Header Name: `Authorization`
7. Header Value: `Bearer TU_GHL_ACCESS_TOKEN`

#### B. Configurar Variables:
1. Settings → Variables
2. Agregar: `GHL_LOCATION_ID` = `tu-location-id`

### 4. Importar Workflow N8N
1. En N8N: Templates → Import from File
2. Subir: `n8n-workflow-sms-to-ghl.json`
3. Activar workflow

### 5. Conectar WhatsApp
1. Abrir `qr-scanner-simple.html` en navegador
2. Click "Conectar WhatsApp"
3. Escanear QR con WhatsApp
4. ¡Listo! Los mensajes se enviarán automáticamente a GHL

## 🔧 CONFIGURACIÓN DETALLADA

### Variables de Entorno N8N
```bash
# En docker-compose-simple.yml ya están configuradas:
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin123
WEBHOOK_URL=http://localhost:5678/
```

### GoHighLevel Setup
Necesitas obtener de GHL:
- **Access Token:** API → Create App → Get Token
- **Location ID:** Settings → Business Profile → Location ID

### Evolution API Configuración
```bash
# API Key (ya configurada):
evolution-api-key-2025

# Webhook URL (ya configurada):
http://host.docker.internal:5678/webhook/evolution
```

## 📊 FLUJO DE DATOS

### 1. Mensaje WhatsApp Recibido
```
Contacto envía mensaje → WhatsApp Business → Evolution API
```

### 2. Evolution API Procesa
```
Evolution API → Webhook → N8N (/webhook/evolution)
```

### 3. N8N Workflow
```
Webhook → Filter Mensajes → Procesar Datos → Crear Contacto GHL → Crear Conversación GHL
```

### 4. Resultado en GHL
```
- Contacto creado/actualizado
- Conversación SMS creada
- Mensaje guardado
- Tags automáticos: "whatsapp", "sms-scanner"
```

## 🔍 TESTING

### Test 1: Verificar Servicios
```bash
# Evolution API
curl -H "apikey: evolution-api-key-2025" http://localhost:8080/instance/fetchInstances

# N8N
curl http://localhost:5678

# Webhook N8N
curl -X POST http://localhost:5678/webhook/evolution -d '{"test": true}'
```

### Test 2: Enviar Mensaje Test
```bash
# Simular mensaje de Evolution API
curl -X POST http://localhost:5678/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "sms_scanner_main",
    "data": {
      "messages": [{
        "key": {
          "remoteJid": "5551234567890@s.whatsapp.net",
          "fromMe": false,
          "id": "test123"
        },
        "message": {
          "conversation": "Hola, este es un mensaje de prueba"
        },
        "pushName": "Usuario Test",
        "messageTimestamp": 1640995200
      }]
    }
  }'
```

## 📱 USO DIARIO

### 1. Verificar Conexión
- Abrir `qr-scanner-simple.html`
- Estado debe mostrar "✅ WhatsApp conectado"

### 2. Monitorear N8N
- Ir a N8N → Executions
- Ver ejecuciones del workflow en tiempo real

### 3. Verificar GHL
- Ir a GoHighLevel → Conversations
- Los mensajes aparecen automáticamente

## 🐛 TROUBLESHOOTING

### Error: Evolution API no responde
```bash
# Verificar contenedores
docker ps

# Reiniciar Evolution API
docker-compose -f docker-compose-simple.yml restart evolution-api
```

### Error: N8N Webhook no funciona
```bash
# Verificar logs N8N
docker logs n8n-automation

# Test webhook directo
curl -X POST http://localhost:5678/webhook/evolution -d '{"test":true}'
```

### Error: GHL Authentication
1. Verificar Access Token en N8N Credentials
2. Verificar Location ID en Variables
3. Test API GHL:
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
     -H "Version: 2021-07-28" \
     https://services.leadconnectorhq.com/contacts/
```

### WhatsApp se desconecta
1. Abrir QR Scanner
2. Click "Conectar WhatsApp" 
3. Escanear nuevo QR

## 📊 MONITOREO

### Logs Evolution API
```bash
docker logs evolution-api
```

### Logs N8N
```bash
docker logs n8n-automation
```

### Estadísticas
- **N8N:** Executions → Ver total de mensajes procesados
- **Evolution API:** Instance Status → Ver estado conexión
- **GHL:** Conversations → Ver mensajes recibidos

## 🔄 MANTENIMIENTO

### Backup N8N Workflows
```bash
# Los workflows se guardan en: n8n_data volume
docker cp n8n-automation:/home/node/.n8n ./n8n-backup
```

### Actualizar Servicios
```bash
docker-compose -f docker-compose-simple.yml pull
docker-compose -f docker-compose-simple.yml up -d
```

## 📈 OPTIMIZACIONES

### 1. Auto-Respuestas
Agregar nodo en N8N para responder automáticamente ciertos mensajes

### 2. Filtros Avanzados
Filtrar por palabras clave, horarios, etc.

### 3. Multiple Instancias
Crear múltiples instancias WhatsApp para diferentes números

### 4. Analytics
Agregar nodos para guardar estadísticas de mensajes

---

**🎯 Resultado:** Sistema 100% automático que recibe mensajes de WhatsApp y los envía a GoHighLevel sin intervención manual.

**⚡ Estado:** Listo para producción  
**🔧 Mantenimiento:** Mínimo - Solo verificar conexión WhatsApp