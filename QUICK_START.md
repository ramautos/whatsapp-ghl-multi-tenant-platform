# ⚡ QUICK START - TODAS LAS HERRAMIENTAS ACTIVADAS

## 🚀 **INICIO RÁPIDO (30 segundos)**

### **1. Ejecutar script de herramientas:**
```bash
./dev-tools.sh
```
**Selecciona opción 🔟 (Power Mode)** → Abre TODAS las herramientas

### **2. O manual paso a paso:**
```bash
# Iniciar servidor
node server-multitenant.js &

# Abrir VS Code
code .

# Abrir dashboards
open http://localhost:3000
open https://whatsapp.cloude.es
```

## ⌨️ **ATAJOS DE TECLADO EN VS CODE:**

| Atajo | Acción |
|-------|--------|
| `Cmd+Shift+S` | 🚀 Start Server |
| `Cmd+Shift+T` | 🧪 Test All APIs |  
| `Cmd+Shift+O` | 📱 Open Local Dashboard |
| `Cmd+Shift+P` | 🌐 Open Production |
| `Cmd+Shift+D` | 🚀 Quick Deploy |
| `Cmd+Shift+G` | 📊 Git Status |

## 🛠️ **HERRAMIENTAS PRINCIPALES:**

### **Live Server** (Desarrollo HTML)
1. **Click derecho** en cualquier `.html`
2. **"Open with Live Server"** 
3. **Ver cambios** instantáneos en http://localhost:5500

### **Thunder Client** (Testing APIs)
1. **Panel lateral** → ⚡ Thunder Client
2. **Import** → `api-tests.http`
3. **Click Send** en cualquier request

### **SQLite Viewer** (Base de datos)
1. **Click** en `database/multitenant.db`
2. **Ver tablas** visualmente
3. **Ejecutar queries** con SQLTools

### **Git Lens** (Control de versiones)
- **Automático** en VS Code
- **Ver cambios** línea por línea
- **History** visual de commits

## 🔥 **SNIPPETS PERSONALIZADOS:**

En VS Code, escribe:
- `wa-test` → Template API WhatsApp
- `login-test` → Template API Login
- `evo-api` → Template Evolution API
- `commit-claude` → Template commit con Claude

## 🎯 **WORKFLOW TÍPICO:**

### **Desarrollo de nueva feature:**
1. `Cmd+Shift+S` → Start server
2. **Live Server** → Ver cambios HTML
3. **Thunder Client** → Probar APIs
4. **SQLite Viewer** → Verificar datos
5. `Cmd+Shift+D` → Deploy rápido

### **Debug de problema:**
1. `./dev-tools.sh` → Opción 7 (Full Check)
2. **Debug mode** → F5 en VS Code
3. **View logs** → `./dev-tools.sh` → Opción 9
4. **SQL queries** → SQLTools panel

### **Testing completo:**
1. `./verify-production.sh` → Verificación automática
2. **Thunder Client** → Tests manuales
3. **Live Server** → UI testing
4. **Production check** → https://whatsapp.cloude.es

## 📱 **URLS IMPORTANTES:**

| Servicio | URL | Uso |
|----------|-----|-----|
| **Local Dev** | http://localhost:3000 | Desarrollo |
| **Live Server** | http://localhost:5500 | HTML preview |
| **Producción** | https://whatsapp.cloude.es | Deploy manual |
| **Coolify** | https://app.cloude.es | Panel deploy |
| **GitHub** | https://github.com/ramautos/whatsapp-ghl-multi-tenant-platform | Código |

## 🔧 **TROUBLESHOOTING:**

### **Server no inicia:**
```bash
./dev-tools.sh → Opción 7 → Full Check
```

### **APIs no responden:**
```bash
./verify-production.sh
```

### **Deploy no funciona:**
```bash
./dev-tools.sh → Opción 8 → Manual Deploy
```

## 💡 **TIPS AVANZADOS:**

1. **Multi-terminal**: Cmd+Shift+` para nuevo terminal
2. **Side by side**: Arrastrar archivos para split view
3. **Zen mode**: Cmd+K Z para focus completo
4. **Command palette**: Cmd+Shift+P para todo
5. **File explorer**: Cmd+Shift+E
6. **Search global**: Cmd+Shift+F
7. **Git panel**: Cmd+Shift+G
8. **Extensions**: Cmd+Shift+X

---

## 🎉 **¡TODAS LAS HERRAMIENTAS LISTAS!**

Con esta configuración tienes **máxima productividad** para desarrollo colaborativo con Claude Code.

**Un solo comando y todo funciona:** `./dev-tools.sh` → Opción 🔟