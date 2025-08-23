# 🚀 Deployment en Coolify - SMS Scanner App

## 📋 PASOS EN COOLIFY

### 1. **Crear Nuevo Proyecto**
1. Ir a https://app.cloude.es/
2. Click **"+ New"** → **"Project"**
3. Nombre: `sms-scanner-evolution`
4. Descripción: `Evolution API para SMS Scanner WhatsApp → GHL`

### 2. **Agregar Servicio Docker Compose**
1. En el proyecto creado → **"+ New Resource"**
2. Seleccionar **"Docker Compose"**
3. **Source:** Upload
4. **Subir archivo:** `docker-compose.yml`

### 3. **Configurar Variables de Entorno**
En la sección **Environment Variables**:

```env
EVOLUTION_API_KEY=evolution-api-key-2025
POSTGRES_PASSWORD=evolution123
EVOLUTION_PUBLIC_URL=https://evolution-sms.cloude.es
N8N_WEBHOOK_URL=https://n8n.cloude.es/webhook/evolution
```

**⚠️ IMPORTANTE:** Reemplaza las URLs por las reales que te asigne Coolify

### 4. **Configurar Dominios**
1. En **"Domains"** del servicio `evolution-api`
2. **Domain:** `evolution-sms.cloude.es` (o el que prefieras)
3. **Port:** `8080`
4. ✅ **Enable HTTPS**

### 5. **Deploy**
1. Click **"Deploy"**
2. Esperar ~2-3 minutos
3. Verificar logs que no hay errores

### 6. **Verificar Deployment**
```bash
# Test API
curl -H "apikey: evolution-api-key-2025" https://evolution-sms.cloude.es/instance/fetchInstances

# Respuesta esperada: []
```

## 🔧 CONFIGURACIÓN POST-DEPLOYMENT

### 1. **Obtener URL final de Evolution API**
Después del deploy, Coolify te dará una URL como:
- `https://evolution-sms.cloude.es`

### 2. **Actualizar N8N Webhook**
Esta URL se usará en N8N para configurar el webhook.

### 3. **Crear Instancia WhatsApp**
```bash
curl -X POST https://evolution-sms.cloude.es/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: evolution-api-key-2025" \
  -d '{
    "instanceName": "sms_scanner_main",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "webhookUrl": "https://n8n.cloude.es/webhook/evolution",
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
```

## 📊 MONITOREO

### En Coolify:
- **Logs:** Ver logs en tiempo real
- **Metrics:** CPU, Memory, Network
- **Health:** Status de servicios

### Health Check:
```bash
curl https://evolution-sms.cloude.es/instance/fetchInstances \
  -H "apikey: evolution-api-key-2025"
```

## 🔄 PRÓXIMOS PASOS

1. ✅ **Evolution API desplegada**
2. 🔄 **Configurar N8N workflow**
3. 🔄 **Conectar WhatsApp via QR**
4. 🔄 **Test completo WhatsApp → N8N → GHL**

---

**🎯 URL Evolution API:** `https://evolution-sms.cloude.es`  
**🔑 API Key:** `evolution-api-key-2025`  
**📱 Instancia:** `sms_scanner_main`