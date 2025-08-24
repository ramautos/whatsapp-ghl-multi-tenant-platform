# 🚀 WhatsApp-GoHighLevel Multi-Tenant Platform

Plataforma multi-tenant que conecta WhatsApp Business con GoHighLevel CRM usando Evolution API.

## ✨ Características

- **Multi-Tenant**: Un cliente por Location ID
- **WhatsApp Business**: 5 instancias por cliente
- **QR Code Generation**: Conexión fácil via QR
- **GoHighLevel Integration**: Sincronización automática de contactos y mensajes
- **Real-time Dashboard**: Panel en tiempo real por cliente
- **Admin Center**: Control total de la plataforma

## 🏗️ Arquitectura

```
├── config/              # Configuración BD y servicios
├── database/           # Schema y datos SQLite
├── public/             # Frontend pages
├── routes/             # API endpoints
├── services/           # Lógica de negocio
└── server-multitenant.js  # Servidor principal
```

## 📋 Páginas Disponibles

- `/` - Login simple
- `/dashboard/LOCATION_ID` - Dashboard cliente
- `/control-center` - Panel administrativo
- `/admin-complete` - Admin center completo

## 🚀 Deploy

```bash
npm start
```

**Producción**: https://whatsapp.cloude.es

---
Desarrollado por **RAY ALVARADO** | [GitHub](https://github.com/ramautos)# Deploy Sun Aug 24 04:07:01 AST 2025
