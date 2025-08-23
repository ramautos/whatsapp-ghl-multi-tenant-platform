// 🎯 API ROUTES PARA SISTEMA MULTI-TENANT

const express = require('express');
const router = express.Router();
const multiTenantService = require('../services/multiTenantService');
const db = require('../config/database-sqlite');
const evolutionService = require('../services/evolutionService');

// ================================
// RUTAS DE REGISTRO Y AUTENTICACIÓN
// ================================

// Webhook para instalación GHL App - MARKETPLACE AUTOMATION
router.post('/ghl/install', async (req, res) => {
    try {
        console.log('📦 GHL App Installation received:', req.body);
        
        const { 
            locationId, 
            companyName, 
            accessToken, 
            refreshToken, 
            scopes,
            userType,
            userId
        } = req.body;

        // STEP 1: Registrar instalación en base de datos
        const installation = await multiTenantService.registerGHLInstallation({
            locationId,
            companyName,
            accessToken,
            refreshToken,
            scopes,
            userType,
            userId
        });

        console.log('✅ Installation registered:', installation.locationId);

        // STEP 2: Crear automáticamente 5 instancias WhatsApp para el cliente
        const evolutionService = require('../services/evolutionService');
        console.log('🚀 Creating WhatsApp instances for new client...');
        
        const instancesResult = await evolutionService.createClientInstances(locationId, 5);
        
        // STEP 3: Registrar instancias en base de datos
        const db = require('../config/database-sqlite');
        for (const instance of instancesResult.instances) {
            await db.query(
                `INSERT OR REPLACE INTO whatsapp_instances 
                (location_id, instance_name, position, status, webhook_url, created_at) 
                VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                [
                    locationId,
                    instance.instanceName,
                    instance.position,
                    'inactive',
                    instance.webhookUrl
                ]
            );
        }

        console.log(`🎯 Marketplace installation complete for ${locationId}:`);
        console.log(`   - Company: ${companyName}`);
        console.log(`   - Instances created: ${instancesResult.totalCreated}/5`);
        console.log(`   - Database: Updated`);
        console.log(`   - Ready for client setup!`);

        res.json({ 
            success: true, 
            message: 'GHL App installed successfully - WhatsApp instances ready!',
            locationId: installation.locationId,
            instances: {
                total: instancesResult.totalCreated,
                created: instancesResult.instances.length,
                ready: true
            },
            nextSteps: {
                dashboard: `${process.env.APP_URL}/dashboard/${locationId}`,
                setup: 'Client can now scan QR codes to connect WhatsApp'
            }
        });

    } catch (error) {
        console.error('❌ Error during marketplace installation:', error);
        
        // Log error for debugging
        console.error('Installation failed for:', {
            locationId: req.body?.locationId,
            company: req.body?.companyName,
            error: error.message
        });

        res.status(500).json({ 
            success: false,
            error: error.message,
            message: 'Installation failed - please contact support',
            locationId: req.body?.locationId
        });
    }
});

// Registro de cliente en plataforma
router.post('/clients/register', async (req, res) => {
    try {
        const { locationId, name, email, phone } = req.body;

        if (!locationId || !name || !email) {
            return res.status(400).json({ 
                error: 'Location ID, name and email are required' 
            });
        }

        const result = await multiTenantService.registerClient(locationId, {
            name,
            email,
            phone
        });

        res.json({ 
            success: true, 
            message: 'Client registered successfully',
            locationId: result.locationId
        });
    } catch (error) {
        console.error('Error registering client:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login (verificar si existe cliente)
router.post('/clients/login', async (req, res) => {
    try {
        const { locationId } = req.body;

        const client = await db.loginClient(locationId);

        res.json({
            success: true,
            client
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// GESTIÓN DE INSTANCIAS WHATSAPP
// ================================

// Obtener instancias de un cliente
router.get('/instances/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;

        const instances = await multiTenantService.getClientInstances(locationId);

        res.json({
            success: true,
            instances,
            locationId
        });
    } catch (error) {
        console.error('Error getting instances:', error);
        res.status(500).json({ error: error.message });
    }
});

// Activar instancia (generar QR)
router.post('/instances/:locationId/activate', async (req, res) => {
    try {
        const { locationId } = req.params;
        const { position } = req.body;

        if (!position || position < 1 || position > 5) {
            return res.status(400).json({ 
                error: 'Position must be between 1 and 5' 
            });
        }

        const result = await multiTenantService.activateInstance(locationId, position);

        res.json(result);
    } catch (error) {
        console.error('Error activating instance:', error);
        res.status(500).json({ error: error.message });
    }
});

// Desconectar instancia
router.post('/instances/:locationId/disconnect', async (req, res) => {
    try {
        const { locationId } = req.params;
        const { position } = req.body;

        const result = await multiTenantService.disconnectInstance(locationId, position);

        res.json(result);
    } catch (error) {
        console.error('Error disconnecting instance:', error);
        res.status(500).json({ error: error.message });
    }
});

// Estado de una instancia específica
router.get('/instances/:locationId/:position/status', async (req, res) => {
    try {
        const { locationId, position } = req.params;

        const [instance] = await db.query(
            `SELECT * FROM whatsapp_instances 
            WHERE location_id = ? AND position = ?`,
            [locationId, position]
        );

        if (!instance.length) {
            return res.status(404).json({ error: 'Instance not found' });
        }

        res.json({
            success: true,
            instance: instance[0]
        });
    } catch (error) {
        console.error('Error getting instance status:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// NOTA: WEBHOOK FLOW MANEJADO POR N8N
// ================================
// 
// Evolution API → N8N (https://ray.cloude.es/webhook/evolution1) → GHL
// 
// Este flujo se mantiene en N8N como estaba configurado originalmente.
// Mi plataforma solo maneja la creación y gestión de instancias WhatsApp.

// ================================
// ESTADÍSTICAS Y REPORTES
// ================================

// Estadísticas del día actual
router.get('/statistics/:locationId/today', async (req, res) => {
    try {
        const { locationId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const [stats] = await db.query(
            `SELECT * FROM client_statistics 
            WHERE location_id = ? AND date = ?`,
            [locationId, today]
        );

        const todayStats = stats.length ? stats[0] : {
            messages_received: 0,
            messages_sent: 0,
            contacts_created: 0,
            ai_responses: 0
        };

        res.json(todayStats);
    } catch (error) {
        console.error('Error getting today statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Estadísticas de los últimos N días
router.get('/statistics/:locationId/history/:days?', async (req, res) => {
    try {
        const { locationId, days = 30 } = req.params;

        const stats = await multiTenantService.getClientStatistics(locationId, days);

        res.json({
            success: true,
            statistics: stats,
            period: `${days} days`
        });
    } catch (error) {
        console.error('Error getting statistics history:', error);
        res.status(500).json({ error: error.message });
    }
});

// Logs de mensajes del cliente
router.get('/messages/:locationId/history', async (req, res) => {
    try {
        const { locationId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const messages = await db.query(
            `SELECT * FROM message_logs 
            WHERE location_id = ? 
            ORDER BY processed_at DESC 
            LIMIT ? OFFSET ?`,
            [locationId, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            messages: messages[0]
        });
    } catch (error) {
        console.error('Error getting message history:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// CONFIGURACIÓN DEL CLIENTE
// ================================

// Obtener configuración del cliente
router.get('/settings/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;

        const [settings] = await db.query(
            'SELECT * FROM client_settings WHERE location_id = ?',
            [locationId]
        );

        res.json({
            success: true,
            settings: settings.length ? settings[0] : {}
        });
    } catch (error) {
        console.error('Error getting client settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar configuración del cliente
router.put('/settings/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const settings = req.body;

        await db.query(
            `UPDATE client_settings 
            SET auto_response_enabled = ?, 
                ai_model = ?, 
                language = ?,
                welcome_message = ?,
                custom_prompt = ?,
                updated_at = NOW()
            WHERE location_id = ?`,
            [
                settings.auto_response_enabled,
                settings.ai_model,
                settings.language,
                settings.welcome_message,
                settings.custom_prompt,
                locationId
            ]
        );

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating client settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// RUTAS DE ADMINISTRACIÓN
// ================================

// Obtener todos los clientes (para admin)
router.get('/admin/clients', async (req, res) => {
    try {
        const clients = await db.query(
            `SELECT c.*, g.company_name, g.installed_at,
                    COUNT(wi.id) as total_instances,
                    COUNT(CASE WHEN wi.status = 'connected' THEN 1 END) as connected_instances
            FROM clients c
            JOIN ghl_installations g ON c.location_id = g.location_id
            LEFT JOIN whatsapp_instances wi ON c.location_id = wi.location_id
            GROUP BY c.location_id
            ORDER BY c.registered_at DESC`
        );

        res.json({
            success: true,
            clients: clients[0]
        });
    } catch (error) {
        console.error('Error getting admin clients:', error);
        res.status(500).json({ error: error.message });
    }
});

// Estadísticas globales del sistema
router.get('/admin/stats', async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                COUNT(DISTINCT c.location_id) as total_clients,
                COUNT(wi.id) as total_instances,
                COUNT(CASE WHEN wi.status = 'connected' THEN 1 END) as connected_instances,
                COUNT(CASE WHEN DATE(ml.processed_at) = DATE('now') THEN 1 END) as messages_today
            FROM clients c
            LEFT JOIN whatsapp_instances wi ON c.location_id = wi.location_id
            LEFT JOIN message_logs ml ON c.location_id = ml.location_id
        `);

        res.json({
            success: true,
            stats: stats[0]
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// TESTING Y DEVELOPMENT
// ================================

// Endpoint para probar instalación completa (DEVELOPMENT ONLY)
router.post('/test/install', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Test endpoints disabled in production' });
    }

    try {
        const testLocationId = `TEST_${Date.now()}`;
        const testInstallation = {
            locationId: testLocationId,
            companyName: 'Test Company Ltd',
            accessToken: 'test_access_token_' + Date.now(),
            refreshToken: 'test_refresh_token_' + Date.now(),
            scopes: ['contacts.write', 'conversations.write'],
            userType: 'location',
            userId: 'test_user_' + Date.now()
        };

        console.log('🧪 Testing marketplace installation flow...');

        // Simular instalación completa
        const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/ghl/install`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testInstallation)
        });

        const result = await response.json();

        res.json({
            success: true,
            message: 'Test installation completed',
            testData: testInstallation,
            result: result,
            dashboardUrl: `http://localhost:${process.env.PORT || 3000}/dashboard/${testLocationId}`
        });

    } catch (error) {
        console.error('❌ Test installation failed:', error);
        res.status(500).json({ 
            success: false,
            error: error.message,
            message: 'Test installation failed'
        });
    }
});

// Status completo del sistema
router.get('/system/status', async (req, res) => {
    try {
        const evolutionService = require('../services/evolutionService');
        const db = require('../config/database-sqlite');

        // Verificar conexiones
        const evolutionStatus = evolutionService.isConnected();
        
        // Contar clientes y instancias
        const [clientsCount] = await db.query('SELECT COUNT(*) as count FROM clients');
        const [instancesCount] = await db.query('SELECT COUNT(*) as count FROM whatsapp_instances');
        const [connectionsCount] = await db.query("SELECT COUNT(*) as count FROM whatsapp_instances WHERE status = 'connected'");

        res.json({
            system: {
                status: 'operational',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            },
            services: {
                evolution_api: {
                    connected: evolutionStatus,
                    url: process.env.EVOLUTION_API_URL
                },
                database: {
                    connected: true,
                    clients: clientsCount[0].count,
                    instances: instancesCount[0].count,
                    active_connections: connectionsCount[0].count
                }
            },
            environment: {
                node_env: process.env.NODE_ENV || 'development',
                port: process.env.PORT || 3000,
                app_url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`
            }
        });

    } catch (error) {
        console.error('❌ System status error:', error);
        res.status(500).json({
            system: {
                status: 'error',
                error: error.message
            }
        });
    }
});

// ================================
// HEALTH CHECK
// ================================

// TEST ENDPOINT - Simple instance creation
router.post('/test/simple-create', async (req, res) => {
    try {
        const { instanceName = 'simple_test_123' } = req.body;
        
        console.log('🧪 Testing simple instance creation:', instanceName);
        const result = await evolutionService.createInstance(instanceName);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('❌ Test creation failed:', error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'multi-tenant-api',
        version: '1.0.0'
    });
});

module.exports = router;