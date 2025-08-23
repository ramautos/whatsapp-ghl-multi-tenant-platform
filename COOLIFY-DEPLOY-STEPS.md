# 🚀 COOLIFY DEPLOY - PASOS EXACTOS

## 📋 LISTA DE VERIFICACIÓN COMPLETA

### **PASO 1: ACCEDER A COOLIFY**
- [ ] Abrir navegador: `https://tu-coolify-url.com`
- [ ] Iniciar sesión con usuario/contraseña

### **PASO 2: CREAR NUEVA APLICACIÓN**
- [ ] Hacer clic en **"+ New"** (botón verde/azul)
- [ ] Seleccionar **"Application"**
- [ ] Elegir **"Public Repository"** o **"Git Repository"**

### **PASO 3: CONFIGURACIÓN DE REPOSITORIO**
- [ ] **Git Source**: GitHub
- [ ] **Repository URL**: `https://github.com/ramautos/whatsapp-ghl-multi-tenant-platform`
- [ ] **Branch**: `main`
- [ ] **Auto-deploy**: ✅ Activado

### **PASO 4: CONFIGURACIÓN BÁSICA**
- [ ] **Name**: `whatsapp-ghl-platform`
- [ ] **Description**: `Multi-Tenant WhatsApp-GHL Integration Platform`
- [ ] **Build Pack**: Node.js (auto-detectado)
- [ ] **Port**: `3000`

### **PASO 5: DOMINIO**
- [ ] **Domain/Subdomain**: `whatsapp.tu-dominio.com`
- [ ] **SSL**: ✅ Habilitado (Let's Encrypt)

### **PASO 6: VARIABLES DE ENTORNO**
Copiar y pegar cada línea en Environment Variables:

```env
NODE_ENV=production
```
```env
PORT=3000
```
```env
APP_URL=https://whatsapp.CAMBIA-POR-TU-DOMINIO.com
```
```env
EVOLUTION_API_URL=https://evolutionv2.cloude.es
```
```env
EVOLUTION_API_KEY=CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg
```
```env
DATABASE_URL=sqlite:./database/whatsapp_ghl_platform.db
```
```env
GHL_CLIENT_ID=CAMBIAR-POR-TU-CLIENT-ID-REAL
```
```env
GHL_CLIENT_SECRET=CAMBIAR-POR-TU-CLIENT-SECRET-REAL
```
```env
GHL_LOCATION_ID=jtEqGdhkoR6iePmZaCmd
```
```env
GHL_API_URL=https://services.leadconnectorhq.com
```
```env
MARKETPLACE_INSTALL_WEBHOOK_URL=https://whatsapp.CAMBIA-POR-TU-DOMINIO.com/api/ghl/install
```
```env
JWT_SECRET=tu-jwt-secret-super-seguro-aqui-32-caracteres-minimo
```
```env
PLATFORM_NAME=WhatsApp Business Manager
```
```env
DEFAULT_MAX_INSTANCES=5
```

### **PASO 7: BUILD SETTINGS**
- [ ] **Install Command**: `npm install` (auto-detectado)
- [ ] **Build Command**: (dejar vacío)
- [ ] **Start Command**: `node server-multitenant.js`
- [ ] **Root Directory**: `/` (raíz)

### **PASO 8: DEPLOY**
- [ ] Hacer clic en **"Deploy"** o **"Save & Deploy"**
- [ ] Esperar que aparezcan los logs
- [ ] Verificar que no hay errores

### **PASO 9: LOGS A BUSCAR**
En los logs deberías ver:
```
✅ Evolution API service initialized
✅ SQLite Database connected successfully
🚀 WHATSAPP-GHL PLATFORM STARTED
Port: 3000
```

### **PASO 10: VERIFICACIÓN**
- [ ] Probar: `https://whatsapp.tu-dominio.com/api/health`
- [ ] Debe responder: `{"status":"healthy"}`
- [ ] Probar: `https://whatsapp.tu-dominio.com/admin`
- [ ] Debe cargar el dashboard

## ⚠️ **SI HAY ERRORES COMUNES:**

### **Error: "Port already in use"**
- Cambiar PORT a 3001 o 8080

### **Error: "Cannot find module"**
- Verificar que `npm install` se ejecutó
- Revisar que package.json esté en raíz

### **Error: "Database permission"**
- Agregar variable: `DATABASE_PERMISSIONS=755`

### **Error: "Evolution API connection"**
- Verificar que EVOLUTION_API_KEY es correcta
- Revisar que EVOLUTION_API_URL es accesible

## 📝 **DATOS QUE NECESITAS CAMBIAR:**

1. **TU-DOMINIO.com** - Por tu dominio real
2. **GHL_CLIENT_ID** - Tu Client ID de GoHighLevel
3. **GHL_CLIENT_SECRET** - Tu Client Secret de GoHighLevel  
4. **JWT_SECRET** - Crear un string aleatorio de 32 caracteres

## 🎉 **UNA VEZ DESPLEGADO:**

Tu plataforma estará disponible en:
- **Admin Panel**: `https://whatsapp.tu-dominio.com/admin`
- **API Health**: `https://whatsapp.tu-dominio.com/api/health`
- **Client Dashboard**: `https://whatsapp.tu-dominio.com/dashboard/jtEqGdhkoR6iePmZaCmd`

## 🔄 **AUTO-DEPLOY CONFIGURADO:**

Cada vez que hagas `git push` a GitHub, Coolify automáticamente:
1. Detecta el cambio
2. Re-despliega la aplicación
3. Mantiene todo funcionando

---

**¿Necesitas ayuda?** Comparte un screenshot del paso donde te atores.