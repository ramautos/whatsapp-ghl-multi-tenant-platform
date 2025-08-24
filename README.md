# 📱 WhatsApp-GHL Multi-Tenant Platform

## 🚀 Plataforma de integración WhatsApp Business con GoHighLevel

### 🌟 **ESTADO: PRODUCCIÓN READY** ✅

---

## 🎯 **URLs DE PRODUCCIÓN**

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Main Platform** | https://whatsapp.cloude.es | Plataforma principal |
| **Dashboard Cliente** | https://whatsapp.cloude.es/dashboard/{locationId} | Panel de control por cliente |
| **Admin Panel** | https://whatsapp.cloude.es/admin | Panel administrativo |
| **Debug Tool** | https://whatsapp.cloude.es/debug-qr.html | Herramienta de debug QR |
| **API Health** | https://whatsapp.cloude.es/api/health | Estado de la API |

---

## 🔧 **ARQUITECTURA TÉCNICA**

### **Stack Tecnológico:**
- **Backend:** Node.js + Express.js
- **Base de Datos:** SQLite (dev) / PostgreSQL (prod)
- **WhatsApp API:** Evolution API v2
- **CRM:** GoHighLevel API
- **Deploy:** Coolify (Auto-deploy)
- **Hosting:** Cloude.es Infrastructure

### **Estructura Multi-Tenant:**
```
├── server-multitenant.js          # Servidor principal
├── routes/multiTenantApi.js        # API + autenticación
├── services/
│   ├── evolutionService.js        # Integración WhatsApp
│   ├── ghlService.js              # Integración GHL
│   └── multiTenantService.js      # Lógica multi-tenant
├── config/database-sqlite.js       # Capa de base de datos
└── public/simple-dashboard.html    # Dashboard principal
```

---

## 🔐 **CREDENCIALES DE PRODUCCIÓN**

```bash
# API Key Platform
API_KEY=cloude-api-key-2024

# Evolution API
EVOLUTION_URL=https://evolutionv2.cloude.es
EVOLUTION_API_KEY=CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg

# GoHighLevel
GHL_CLIENT_ID=[desde GHL Marketplace]
GHL_CLIENT_SECRET=[desde GHL Marketplace]
```

---

## 🧪 **TESTING EN PRODUCCIÓN**

### **1. Crear Instalación de Prueba:**
```bash
node test-production-fixed.js
```

### **2. Verificar APIs:**
```bash
# Health Check
curl https://whatsapp.cloude.es/api/health

# Dashboard API
curl https://whatsapp.cloude.es/api/instances/TEST_LOCATION_ID

# Admin API (requiere API key)
curl -H "X-API-Key: cloude-api-key-2024" \
     https://whatsapp.cloude.es/api/admin/stats
```

### **3. Test QR Code:**
1. Abrir: https://whatsapp.cloude.es/dashboard/TEST_LOCATION_ID
2. Click "🔗 Conectar WhatsApp"
3. Verificar que aparece QR code
4. Escanear con WhatsApp Business

---

## 🛠️ **COMANDOS DE MANTENIMIENTO**

### **Limpiar Instancias Evolution:**
```bash
./delete-all-instances.sh
```

### **Verificar Sistema:**
```bash
./verify-production.sh
```

### **Monitorear Logs:**
```bash
tail -f logs/platform.log
```

---

## 📊 **CARACTERÍSTICAS PRINCIPALES**

### ✅ **Funcionalidades Implementadas:**
- [x] Multi-tenant por `locationId` 
- [x] Generación QR codes WhatsApp
- [x] Integración bidireccional GHL ↔ WhatsApp
- [x] Dashboard responsive por cliente
- [x] API con autenticación por clave
- [x] Base de datos con 35+ índices optimizados
- [x] Auto-deploy con Coolify
- [x] Herramientas de debug integradas

### 🎯 **Casos de Uso:**
1. **Agencias:** Gestionar WhatsApp para múltiples clientes
2. **Empresas:** Conectar WhatsApp Business con CRM
3. **Automatización:** Chatbots y respuestas automáticas
4. **Ventas:** Seguimiento de leads desde WhatsApp

---

## 🚀 **PROCESO DE DEPLOY**

### **Auto-Deploy Configurado:**
1. **Git Push** → GitHub
2. **Webhook** → Coolify detecta cambios
3. **Build** → Coolify construye imagen
4. **Deploy** → Actualización automática
5. **Health Check** → Verificación de servicio

### **Deploy Manual:**
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
# Coolify auto-deploys automáticamente
```

---

## 📈 **MÉTRICAS DE RENDIMIENTO**

- **Instancias Soportadas:** 5 por cliente
- **Clientes Simultáneos:** Sin límite
- **Base de Datos:** 35 índices optimizados
- **Tiempo de Respuesta API:** < 200ms
- **Uptime Target:** 99.9%

---

## 🔍 **DEBUGGING**

### **URLs de Debug:**
- **QR Debug:** https://whatsapp.cloude.es/debug-qr.html
- **Admin Panel:** https://whatsapp.cloude.es/admin
- **API Status:** https://whatsapp.cloude.es/api/health

### **Logs importantes:**
```bash
# Conexiones WhatsApp
grep "Connection update" logs/platform.log

# Errores API
grep "ERROR" logs/platform.log

# QR Codes generados
grep "QR Code updated" logs/platform.log
```

---

## 📞 **SOPORTE**

- **Desarrollador:** RAY ALVARADO
- **GitHub:** https://github.com/ramautos/whatsapp-ghl-multi-tenant-platform
- **Deploy:** https://app.cloude.es

---

## 📝 **CHANGELOG RECIENTE**

### **v1.0.0 - 2025-08-24** 🎉
- ✅ Fix crítico: QR codes ahora aparecen correctamente
- ✅ Sistema de limpieza de instancias Evolution
- ✅ Base de datos optimizada con 35 índices
- ✅ Herramienta de debug QR integrada
- ✅ Auto-deploy configurado en Coolify

---

**🎯 STATUS: 100% PRODUCCIÓN READY ✅**