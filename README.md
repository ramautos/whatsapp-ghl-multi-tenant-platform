# Evolution API - GoHighLevel Integration

Una integración inteligente entre WhatsApp (via Evolution API) y GoHighLevel CRM con capacidades de IA para automatización de respuestas y análisis de sentimientos.

## 🚀 **Características Principales**

### **💬 Integración WhatsApp - GHL**
- ✅ Conexión automática via QR Code
- ✅ Sincronización bidireccional de mensajes
- ✅ Gestión automática de contactos
- ✅ Múltiples instancias WhatsApp

### **🤖 Inteligencia Artificial**
- ✅ Análisis de sentimientos en tiempo real
- ✅ Clasificación automática de intenciones
- ✅ Respuestas automáticas contextuales
- ✅ Detección de urgencia
- ✅ Traducción automática

### **📊 Analytics & Dashboard**
- ✅ Métricas en tiempo real
- ✅ Gráficos de mensajes y sentimientos
- ✅ Panel de control web
- ✅ Monitoreo de instancias

### **⚡ Automatización**
- ✅ Reglas de automatización personalizables
- ✅ Escalación automática por urgencia
- ✅ Tags automáticos en GHL
- ✅ Workflows personalizados

## 🛠️ **Tecnologías Utilizadas**

- **Backend**: Node.js, Express, Socket.io
- **Base de Datos**: PostgreSQL, Redis
- **IA**: OpenAI GPT-4
- **Frontend**: HTML5, TailwindCSS, Chart.js
- **APIs**: Evolution API, GoHighLevel API
- **Deployment**: Docker, Docker Compose

## 📋 **Requisitos Previos**

1. **Evolution API**: Instancia funcionando en `https://evolution.cloude.es`
2. **GoHighLevel**: Access Token y Location ID configurados
3. **OpenAI**: API Key para funciones de IA
4. **PostgreSQL**: Base de datos (incluida en Docker Compose)
5. **Redis**: Para caché (incluido en Docker Compose)

## 🚀 **Instalación y Configuración**

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/evolution-ghl-integration.git
cd evolution-ghl-integration
```

### **2. Configurar Variables de Entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
# Evolution API Configuration
EVOLUTION_API_URL=https://evolution.cloude.es
EVOLUTION_API_KEY=tu-evolution-api-key

# GoHighLevel Configuration
GHL_ACCESS_TOKEN=pit-fe180478-8160-483d-995e-10e169ce121b
GHL_LOCATION_ID=jtEqGdhkoR6iePmZaCmd

# OpenAI Configuration
OPENAI_API_KEY=tu-openai-api-key

# App Configuration
APP_URL=https://tu-app.coolify.app
PORT=3000
```

### **3. Deployment con Docker**
```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Verificar estado
docker-compose ps
```

### **4. Verificar Instalación**
```bash
# Health check
curl http://localhost:3000/health

# Acceder al dashboard
open http://localhost:3000
```

## 📖 **Uso de la Aplicación**

### **🔗 Conectar WhatsApp**

1. **Acceder al Dashboard**: `http://tu-app.coolify.app`
2. **Crear Instancia**: 
   - Ir a la pestaña "Instancias WhatsApp"
   - Ingresar nombre de instancia (ej: `mi-whatsapp-1`)
   - Hacer clic en "Generar QR Code"
3. **Escanear QR**: 
   - Abrir WhatsApp en tu teléfono
   - Ir a Settings > Linked Devices
   - Escanear el código QR mostrado

### **💬 Gestión de Mensajes**

Una vez conectado:
- **Mensajes entrantes** → Se analizan con IA → Se crean contactos en GHL
- **Respuestas automáticas** → Según configuración y horarios
- **Dashboard** → Monitoreo en tiempo real

### **⚙️ Configuración de IA**

En la pestaña "Configuración":
- **Respuestas Automáticas**: Habilitadas/Solo horario laboral/Deshabilitadas
- **Modelo IA**: GPT-4 o GPT-3.5 Turbo
- **Idioma**: Español o Inglés

## 🔧 **API Endpoints**

### **QR Scanner**
```bash
# Generar QR para instancia
GET /api/qr/instance/:instanceName

# Verificar estado de conexión
GET /api/qr/status/:instanceName

# Listar todas las instancias
GET /api/qr/instances

# Desconectar instancia
POST /api/qr/disconnect/:instanceName

# Eliminar instancia
DELETE /api/qr/instance/:instanceName
```

### **Dashboard**
```bash
# Estadísticas del dashboard
GET /api/dashboard/stats

# Mensajes recientes
GET /api/dashboard/messages

# Datos de analytics
GET /api/dashboard/analytics

# Guardar configuración
POST /api/dashboard/settings
```

### **Webhooks**
```bash
# Webhook de Evolution API
POST /api/webhooks/evolution

# Webhook de GoHighLevel
POST /api/webhooks/ghl
```

## 🔄 **Flujo de Trabajo**

### **Mensaje Entrante (WhatsApp → GHL)**
1. Usuario envía mensaje en WhatsApp
2. Evolution API envía webhook a nuestra aplicación
3. IA analiza el mensaje (sentimiento, intención, urgencia)
4. Se crea/actualiza contacto en GoHighLevel
5. Se crea conversación en GHL con el mensaje
6. Si es necesario, se envía respuesta automática

### **Mensaje Saliente (GHL → WhatsApp)**
1. Usuario responde en GoHighLevel
2. GHL envía webhook a nuestra aplicación
3. Enviamos mensaje via Evolution API a WhatsApp
4. Actualizamos estado del mensaje en GHL

## 📊 **Base de Datos**

### **Tablas Principales**
- `instances` - Instancias de WhatsApp
- `contact_mappings` - Mapeo WhatsApp ↔ GHL
- `messages` - Historial de mensajes
- `conversations` - Conversaciones activas
- `ai_interactions` - Interacciones con IA
- `automation_rules` - Reglas de automatización
- `webhook_logs` - Logs de webhooks

## 🤖 **Funciones de IA**

### **Análisis de Mensajes**
```javascript
{
  "intent": "inquiry|support|sales|complaint|greeting",
  "sentiment": "positive|neutral|negative", 
  "urgency": "low|medium|high",
  "suggestedResponse": "Respuesta sugerida...",
  "recommendedActions": ["add_tag", "add_to_workflow"]
}
```

### **Automatización Inteligente**
- **Horarios laborales**: Respuestas automáticas fuera de horario
- **Alta urgencia**: Escalación automática a workflows
- **Nuevos contactos**: Mensaje de bienvenida automático
- **Idioma**: Detección y traducción automática

## 🔒 **Seguridad**

- ✅ Tokens JWT seguros
- ✅ Rate limiting configurado
- ✅ Headers de seguridad (Helmet)
- ✅ Validación de inputs
- ✅ Logs de auditoría
- ✅ Health checks automáticos

## 📈 **Monitoreo**

### **Health Check**
```bash
curl http://localhost:3000/health
```

### **Logs**
```bash
# Ver logs de la aplicación
docker-compose logs -f app

# Ver logs de base de datos
docker-compose logs -f postgres

# Ver logs de Redis
docker-compose logs -f redis
```

### **Métricas**
- Mensajes por día
- Contactos activos
- Respuestas de IA
- Sentimientos de mensajes
- Estado de instancias

## 🐛 **Troubleshooting**

### **Problemas Comunes**

1. **QR Code no se genera**
   - Verificar API Key de Evolution API
   - Revisar conectividad con evolution.cloude.es

2. **Mensajes no se sincronizan**
   - Verificar webhooks configurados
   - Revisar Access Token de GHL

3. **IA no responde**
   - Verificar API Key de OpenAI
   - Revisar configuración de respuestas automáticas

### **Logs de Debug**
```bash
# Habilitar logs debug
NODE_ENV=development docker-compose up

# Ver logs específicos
docker-compose logs -f app | grep "ERROR"
```

## 🤝 **Contribución**

1. Fork el repositorio
2. Crear branch para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 **Soporte**

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/evolution-ghl-integration/issues)
- **Documentación**: [Wiki del Proyecto](https://github.com/tu-usuario/evolution-ghl-integration/wiki)
- **Email**: soporte@tu-dominio.com

## 🔗 **Enlaces Útiles**

- [Evolution API Documentation](https://github.com/EvolutionAPI/evolution-api)
- [GoHighLevel API Docs](https://marketplace.gohighlevel.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Docker Documentation](https://docs.docker.com)

---

**⚡ Hecho con ❤️ para automatizar y optimizar la comunicación con clientes via WhatsApp y GoHighLevel**