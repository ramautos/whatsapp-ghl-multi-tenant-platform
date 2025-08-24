// 🎯 SERVIDOR PRINCIPAL MULTI-TENANT WHATSAPP-GHL PLATFORM

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Servicios
const multiTenantService = require('./services/multiTenantService');
const evolutionService = require('./services/evolutionService');

// Rutas
const multiTenantApi = require('./routes/multiTenantApi');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ================================
// CONFIGURACIÓN MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Headers de seguridad
app.use((req, res, next) => {
    res.header('X-Powered-By', 'WhatsApp-GHL Platform');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// RUTAS DE LA API
// ================================

app.use('/api', multiTenantApi);

// ================================
// RUTAS DE PÁGINAS
// ================================

// Página principal - Login/Register
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Dashboard multi-tenant
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard-multitenant.html'));
});

// Dashboard específico por cliente (locationId) - Simple y directo
app.get('/dashboard/:locationId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'simple-dashboard.html'));
});

// Dashboard simple directo (sin cache)
app.get('/simple/:locationId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'simple-dashboard.html'));
});

// Página de registro para nuevos clientes
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Configuración del cliente
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ================================
// WEBSOCKETS PARA TIEMPO REAL
// ================================

io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Cliente se une a su "sala" por location_id
    socket.on('join_location', (locationId) => {
        socket.join(`location_${locationId}`);
        console.log(`👤 Client joined location: ${locationId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// ================================
// EVENTOS DE EVOLUTION API
// ================================

// Escuchar eventos del EvolutionService para notificar en tiempo real
evolutionService.on('qr-code', (data) => {
    console.log('📱 QR Code updated:', data.instanceName);
    
    // Extraer location_id del nombre de instancia
    const locationId = data.instanceName.split('_wa_')[0];
    const position = data.instanceName.split('_wa_')[1];
    
    io.to(`location_${locationId}`).emit('qr_updated', {
        position,
        qrCode: data.qrCode,
        instanceName: data.instanceName
    });
});

// ================================
// FUNCIONES AUXILIARES
// ================================

// Función para notificar cambios de estado a clientes conectados
function notifyStatusChange(locationId, position, status, data = {}) {
    io.to(`location_${locationId}`).emit('connection_update', {
        locationId,
        position,
        status,
        timestamp: new Date().toISOString(),
        ...data
    });
}

// Función para notificar nuevos mensajes
function notifyNewMessage(locationId, messageData) {
    io.to(`location_${locationId}`).emit('new_message', {
        locationId,
        type: 'new_message',
        timestamp: new Date().toISOString(),
        ...messageData
    });
}

// ================================
// HEALTH CHECKS Y MONITORING
// ================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            evolution: evolutionService.isConnected(),
            database: true // TODO: Implementar check real
        }
    });
});

// Endpoint para métricas básicas
app.get('/metrics', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        process: {
            pid: process.pid,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        },
        system: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version
        }
    });
});

// ================================
// MANEJO DE ERRORES
// ================================

// Error handler global
app.use((err, req, res, next) => {
    console.error('🚨 Global error:', err);
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong!' 
            : err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// ================================
// INICIALIZACIÓN Y STARTUP
// ================================

async function startServer() {
    try {
        // Inicializar servicios
        console.log('🔧 Initializing services...');
        
        await evolutionService.initialize();
        console.log('✅ Evolution API service initialized');

        // Verificar conexión a base de datos
        const db = require('./config/database-sqlite');
        await db.initialize();
        console.log('✅ Database connection verified');

        // Iniciar servidor
        const PORT = process.env.PORT || 3000;
        
        server.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════╗
║        🚀 WHATSAPP-GHL PLATFORM STARTED     ║
╠══════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(37)} ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)} ║
║  Evolution API: ${(process.env.EVOLUTION_API_URL || 'Not configured').padEnd(26)} ║
║                                              ║
║  🌐 Dashboard: http://localhost:${PORT}/dashboard   ║
║  📊 Admin: http://localhost:${PORT}/admin        ║
║  📋 API Docs: http://localhost:${PORT}/api/health  ║
╚══════════════════════════════════════════════╝
            `);
        });

        // Manejo de señales de cierre
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

async function gracefulShutdown(signal) {
    console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
    
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.log('⚠️  Forced shutdown');
        process.exit(1);
    }, 10000);
}

// ================================
// EXPORT PARA TESTING
// ================================

module.exports = { app, server, io, notifyStatusChange, notifyNewMessage };

// Iniciar servidor si este archivo se ejecuta directamente
if (require.main === module) {
    startServer();
}