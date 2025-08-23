# 🚀 WhatsApp Business Manager Pro

**Plataforma SaaS Multi-tenant superior a Wazzap.mx**

Permite a múltiples clientes conectar hasta 5 instancias WhatsApp Business a sus cuentas GoHighLevel usando Evolution API oficial (sin riesgo de baneos).

## ✨ Características Principales

- 🏢 **Multi-tenant**: Cada cliente maneja sus propias instancias
- 📱 **5 WhatsApp por cliente**: Plan básico con 5 conexiones simultáneas
- 🔗 **Integración GHL Automática**: OAuth cuando instalan tu app
- ⚡ **QR Dinámicos**: Generación automática de códigos QR
- 🔄 **Tiempo Real**: WebSockets para actualizaciones instantáneas
- 📊 **Dashboard Profesional**: UI superior a la competencia
- 🛡️ **API Oficial**: Evolution API sin riesgo de baneos

## 🆚 Ventajas vs Wazzap.mx

| Característica | **Nuestra Plataforma** | Wazzap.mx |
|---|---|---|
| **API Oficial** | ✅ Evolution API | ❌ No oficial |
| **Riesgo Baneos** | ✅ Sin riesgo | ❌ Alto riesgo |
| **Multi-tenant** | ✅ Cada cliente su GHL | ❌ 1 sub-cuenta |
| **Tiempo Real** | ✅ WebSockets | ❌ Básico |
| **UI/UX** | ✅ Dashboard profesional | ❌ Interfaz básica |
| **Escalabilidad** | ✅ Miles de clientes | ❌ Limitada |

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GHL Client    │───▶│  Tu Plataforma   │───▶│  Evolution API  │
│   Instala App   │    │   Multi-tenant   │    │  (API Oficial)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Multi-tenant  │
                       └─────────────────┘
```

## 🚀 Instalación Rápida

### 1. Clonar repositorio

```bash
git clone https://github.com/tu-usuario/whatsapp-business-manager-pro.git
cd whatsapp-business-manager-pro
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp env-example.txt .env
# Editar .env con tus credenciales
```

### 4. Configurar base de datos

```bash
# MySQL/PostgreSQL
mysql -u root -p -e "CREATE DATABASE whatsapp_ghl_platform;"
mysql -u root -p whatsapp_ghl_platform < database/schema.sql
```

### 5. Iniciar servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📱 URLs Principales

- **Dashboard**: `http://localhost:3000/dashboard`
- **Login**: `http://localhost:3000/`
- **Admin**: `http://localhost:3000/admin`
- **API Health**: `http://localhost:3000/health`

## 🔧 Configuración GoHighLevel

### Crear App en GHL Marketplace

1. Registrarse en: https://marketplace.gohighlevel.com/
2. Crear nueva app
3. Configurar OAuth:
   - **Redirect URI**: `https://tu-dominio.com/api/ghl/callback`
   - **Scopes**: `contacts.write`, `conversations.write`, `locations.read`

### Webhook de Instalación

```javascript
POST https://tu-dominio.com/api/ghl/install
{
  "locationId": "abc123",
  "companyName": "Mi Empresa", 
  "accessToken": "token...",
  "refreshToken": "refresh..."
}
```

## 📊 API Endpoints

### Autenticación
- `POST /api/ghl/install` - Webhook instalación GHL
- `POST /api/clients/register` - Registro cliente
- `POST /api/clients/login` - Login por location_id

### Instancias WhatsApp  
- `GET /api/instances/:locationId` - Obtener instancias
- `POST /api/instances/:locationId/activate` - Activar (generar QR)
- `POST /api/instances/:locationId/disconnect` - Desconectar

### Webhook Evolution
- `POST /api/webhook/messages?location=ABC&instance=1` - Webhook único

### Estadísticas
- `GET /api/statistics/:locationId/today` - Stats del día
- `GET /api/statistics/:locationId/history/:days` - Histórico

## 🔄 Flujo del Usuario

1. **Cliente instala tu App GHL** → Webhook automático a tu servidor
2. **Cliente se registra** → Dashboard con 5 slots WhatsApp  
3. **Activa instancias** → Genera QR dinámico
4. **Escanea QR** → WhatsApp conectado automáticamente
5. **Mensajes fluyen** → WhatsApp → Evolution → Tu plataforma → GHL del cliente

## 📱 Dashboard Preview

```
╔══════════════════════════════════════════════╗
║            Mi Empresa Pro                    ║
║         Location: ABC123456789               ║
╠══════════════════════════════════════════════╣
║ asesor1 (1)    [+18099939042    ] ✅ Activo  ║
║ asesor2 (2)    [Escaneando...   ] 🟡 QR     ║  
║ asesor3 (3)    [Not Connected   ] ❌ Inactivo║
║ asesor4 (4)    [Not Connected   ] ❌ Inactivo║
║ asesor5 (5)    [Not Connected   ] ❌ Inactivo║
╠══════════════════════════════════════════════╣
║              [⚙️ Settings]                    ║
╚══════════════════════════════════════════════╝
```

## 🔐 Variables de Entorno

```env
# Servidor
NODE_ENV=production
PORT=3000
APP_URL=https://tu-dominio.com

# Evolution API  
EVOLUTION_API_URL=https://evolutionv2.cloude.es
EVOLUTION_API_KEY=tu-api-key

# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/whatsapp_ghl

# GoHighLevel App
GHL_CLIENT_ID=tu-client-id
GHL_CLIENT_SECRET=tu-client-secret
```

## 🚦 Estados de Instancia

- `inactive` - Slot vacío, listo para activar
- `qr_pending` - QR generado, esperando escaneo
- `connected` - WhatsApp conectado y funcionando  
- `disconnected` - Desconectado (puede reactivarse)

## 📈 Modelo de Negocio

### Plan Básico ($97/mes por cliente)
- ✅ 5 instancias WhatsApp incluidas
- ✅ Dashboard completo
- ✅ Estadísticas básicas
- ✅ Soporte por email

### Plan Premium ($197/mes por cliente)  
- ✅ 10 instancias WhatsApp
- ✅ API avanzada
- ✅ Webhooks personalizados
- ✅ Soporte prioritario

## 🐛 Troubleshooting

### QR no se genera
```bash
# Verificar Evolution API
curl https://evolutionv2.cloude.es/health

# Ver logs
tail -f logs/app.log | grep "createInstance"
```

### Mensajes no llegan a GHL
```bash  
# Verificar webhook
grep "processEvolutionWebhook" logs/app.log

# Verificar tokens GHL
curl -H "Authorization: Bearer $GHL_TOKEN" \
  https://services.leadconnectorhq.com/contacts/
```

## 📞 Soporte

- **Email**: soporte@tu-dominio.com
- **GitHub Issues**: [Reportar problema](https://github.com/tu-usuario/repo/issues)
- **Documentación**: [Wiki completa](https://github.com/tu-usuario/repo/wiki)

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

## 🏆 Créditos

Desarrollado por **Tu Empresa** - La mejor alternativa a Wazzap.mx

---

**⚡ ¡Migra hoy de Wazzap.mx y obtén una plataforma superior sin riesgo de baneos!**