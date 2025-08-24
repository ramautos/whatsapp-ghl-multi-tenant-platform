# 🚀 EXTENSIONES VS CODE PARA WHATSAPP-GHL PLATFORM

## ⚡ INSTALACIÓN RÁPIDA:

### 1. Abre VS Code
### 2. Ve a Extensions (Ctrl+Shift+X / Cmd+Shift+X)
### 3. Busca e instala estas extensiones:

## 🎯 ESENCIALES PARA NUESTRO PROYECTO:

### Live Server
- **ID**: `ritwickdey.liveserver`
- **Uso**: Ver dashboards HTML en tiempo real
- **Beneficio**: Ver cambios en `simple-dashboard.html` instantáneamente

### Thunder Client  
- **ID**: `rangav.vscode-thunder-client`
- **Uso**: Probar APIs Evolution + GHL sin salir de VS Code
- **Beneficio**: Testing de `/api/instances/:locationId/:position/connect`

### SQLite Viewer
- **ID**: `qwtel.sqlite-viewer` 
- **Uso**: Ver base de datos `database/multitenant.db`
- **Beneficio**: Inspeccionar clientes e instancias WhatsApp

### GitLens
- **ID**: `eamodio.gitlens`
- **Uso**: Ver commits y cambios en línea
- **Beneficio**: Tracking de cambios que hacemos con Claude Code

### REST Client
- **ID**: `humao.rest-client`
- **Uso**: Crear archivos `.http` para probar APIs
- **Beneficio**: Testing documentado de endpoints

## 🎨 MEJORAS DE INTERFAZ:

### Auto Rename Tag
- **ID**: `formulahendry.auto-rename-tag`
- **Uso**: Renombrar tags HTML automáticamente

### Material Icon Theme
- **ID**: `pkief.material-icon-theme`
- **Uso**: Iconos bonitos para archivos

### ES7+ Snippets
- **ID**: `dsznajder.es7-react-js-snippets`
- **Uso**: Snippets para JavaScript moderno

### dotENV
- **ID**: `mikestead.dotenv`
- **Uso**: Syntax highlighting para archivos `.env`

## ✅ DESPUÉS DE INSTALAR:

1. **Reinicia VS Code**
2. **Abre nuestro proyecto**: `/evolution-ghl-integration/`
3. **Click derecho en** `public/simple-dashboard.html` → **"Open with Live Server"**
4. **Ve al panel Thunder Client** para probar APIs
5. **Click en** `database/multitenant.db` para ver datos

## 🔥 TESTING INMEDIATO:

Una vez instalado Thunder Client, crea archivo `api-tests.http`:

```http
### Probar conexión de instancia
POST http://localhost:3000/api/instances/FINAL_PRODUCTION_TEST_1755992451/1/connect
Content-Type: application/json

### Ver instancias del cliente  
GET http://localhost:3000/api/instances/FINAL_PRODUCTION_TEST_1755992451

### Health check
GET http://localhost:3000/health
```

## 🎯 WORKFLOW COMPLETO:
1. Claude Code modifica código
2. Live Server muestra cambios al instante
3. Thunder Client prueba APIs
4. SQLite Viewer verifica datos
5. Git commits automáticos

¡Perfecto para desarrollo colaborativo Claude + Usuario!