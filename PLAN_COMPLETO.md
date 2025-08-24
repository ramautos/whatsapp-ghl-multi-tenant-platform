# 🚀 PLAN COMPLETO - SISTEMA WHATSAPP-GHL MULTI-TENANT

## 📋 ARQUITECTURA FINAL

### 1️⃣ **FLUJO DE REGISTRO (GHL → SISTEMA)**
```
1. Usuario instala app desde GHL Marketplace
2. GHL envía webhook con location_id, company_name, email
3. Sistema registra usuario en BD
4. Sistema crea 5 instancias en Evolution API automáticamente
5. Sistema genera 5 QR codes listos para escanear
6. Usuario accede a dashboard con sus 5 QR codes
```

### 2️⃣ **ESTRUCTURA DE BASE DE DATOS**
```sql
-- Tabla de usuarios/clientes
users_accounts:
  - id (PK)
  - location_id (unique) 
  - company_name
  - email
  - access_token (GHL)
  - refresh_token (GHL)
  - plan (basic/premium)
  - status (active/inactive)
  - created_at
  - updated_at

-- Tabla de instancias WhatsApp
whatsapp_instances:
  - id (PK)
  - user_id (FK → users_accounts)
  - instance_number (1-5)
  - evolution_instance_name
  - phone_number
  - status (created/qr_pending/connected/disconnected)
  - qr_code (base64)
  - webhook_url
  - connected_at
  - last_activity
```

### 3️⃣ **ENDPOINTS PRINCIPALES**

#### **Para GHL Marketplace:**
- `POST /api/ghl/install` - Recibe instalación
- `POST /api/ghl/uninstall` - Recibe desinstalación
- `GET /api/ghl/callback` - OAuth callback

#### **Para Usuarios:**
- `GET /dashboard/{location_id}` - Dashboard con 5 QR codes
- `GET /api/instances/{location_id}` - Obtener instancias
- `POST /api/instances/{location_id}/{number}/refresh` - Regenerar QR

#### **Para Admin:**
- `GET /admin` - Panel de administración
- `GET /api/admin/users` - Lista todos los usuarios
- `GET /api/admin/instances` - Lista todas las instancias
- `POST /api/admin/users/{location_id}/reset` - Reset usuario

### 4️⃣ **INTEGRACIÓN EVOLUTION API**

#### **Crear Instancia:**
```javascript
POST https://evolutionv2.cloude.es/instance/create
Headers: { apikey: "CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg" }
Body: {
  instanceName: "locationId_wa_1",
  qrcode: true,
  integration: "WHATSAPP-BAILEYS"
}
```

#### **Obtener QR Code:**
```javascript
GET https://evolutionv2.cloude.es/instance/connect/{instanceName}
Headers: { apikey: "CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg" }
Response: { code: "base64_qr_code" }
```

#### **Estado de Conexión:**
```javascript
GET https://evolutionv2.cloude.es/instance/connectionState/{instanceName}
Headers: { apikey: "CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg" }
Response: { state: "open/close/connecting" }
```

### 5️⃣ **FLUJO DE CONEXIÓN WHATSAPP**

1. **Usuario accede a dashboard**
   - Ve 5 slots de WhatsApp
   - Cada uno con QR code o estado

2. **Escanea QR con WhatsApp**
   - Evolution API detecta conexión
   - Envía webhook de conexión exitosa
   - Sistema actualiza BD con número conectado

3. **Estado persistente**
   - Conexión se mantiene en Evolution API
   - Dashboard muestra números conectados
   - Usuario puede desconectar/reconectar

### 6️⃣ **PANEL DE ADMINISTRACIÓN**

#### **Funcionalidades:**
- Ver todos los usuarios registrados
- Ver estado de cada instancia
- Estadísticas generales (usuarios, instancias conectadas)
- Logs de webhooks
- Herramientas de mantenimiento

### 7️⃣ **VARIABLES DE ENTORNO**
```env
# Evolution API
EVOLUTION_API_URL=https://evolutionv2.cloude.es
EVOLUTION_API_KEY=CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg

# GoHighLevel
GHL_CLIENT_ID=tu_client_id
GHL_CLIENT_SECRET=tu_client_secret
GHL_REDIRECT_URI=https://whatsapp.cloude.es/api/ghl/callback

# App
APP_URL=https://whatsapp.cloude.es
PORT=3000

# Database
DATABASE_URL=sqlite:./database/whatsapp_platform.db
```

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### **FASE 1: CORE (Lo que haremos primero)**
✅ Sistema de registro de usuarios desde GHL
✅ Creación automática de 5 instancias en Evolution
✅ Generación de QR codes funcionales
✅ Dashboard básico para ver QR codes
✅ Conexión exitosa con WhatsApp

### **FASE 2: ADMIN (Después)**
- Panel de administración completo
- Gestión de usuarios
- Monitoreo de instancias
- Logs y estadísticas

### **FASE 3: FEATURES (Finalmente)**
- Dashboards avanzados
- Integración completa con GHL
- Envío/recepción de mensajes
- Automatizaciones

## 🔧 TECNOLOGÍAS
- **Backend:** Node.js + Express
- **Base de Datos:** SQLite (dev) / PostgreSQL (prod)
- **Frontend:** HTML + JavaScript vanilla
- **APIs:** Evolution API + GoHighLevel API
- **Deploy:** Coolify + GitHub Actions

---

**ESTE ES EL PLAN COMPLETO Y ORDENADO PARA IMPLEMENTACIÓN EXITOSA**