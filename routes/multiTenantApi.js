// 🎯 API ROUTES PARA SISTEMA MULTI-TENANT

const express = require('express');
const router = express.Router();
const multiTenantService = require('../services/multiTenantService');
const db = require('../config/database');

// ================================
// RUTAS DE REGISTRO Y AUTENTICACIÓN
// ================================

// Webhook para instalación GHL App
router.post('/ghl/install', async (req, res) => {
    try {
        console.log('📦 GHL App Installation received:', req.body);
        
        const { 
            locationId, 
            companyName, 
            accessToken, 
            refreshToken, 
            scopes 
        } = req.body;

        const result = await multiTenantService.registerGHLInstallation({
            locationId,
            companyName,
            accessToken,
            refreshToken,
            scopes
        });

        res.json({ 
            success: true, 
            message: 'GHL App installed successfully',
            locationId: result.locationId
        });
    } catch (error) {
        console.error('Error installing GHL app:', error);
        res.status(500).json({ error: error.message });
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

        const [client] = await db.query(
            `SELECT c.*, g.company_name 
            FROM clients c 
            JOIN ghl_installations g ON c.location_id = g.location_id
            WHERE c.location_id = ? AND c.is_active = true`,
            [locationId]
        );

        if (!client.length) {
            return res.status(404).json({ 
                error: 'Client not found. Please register first.' 
            });
        }

        // Actualizar último login
        await db.query(
            'UPDATE clients SET last_login = NOW() WHERE location_id = ?',
            [locationId]
        );

        res.json({
            success: true,
            client: client[0]
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
// WEBHOOK ÚNICO PARA EVOLUTION API
// ================================

// Webhook único con variables de identificación
router.post('/webhook/messages', async (req, res) => {
    try {
        const { location, instance } = req.query;
        
        if (!location || !instance) {
            return res.status(400).json({ 
                error: 'Location and instance parameters required' 
            });
        }

        console.log(`📨 Webhook received for ${location}_wa_${instance}:`, {
            event: req.body.event,
            timestamp: new Date().toISOString()
        });

        // Procesar webhook asincrónicamente
        multiTenantService.processEvolutionWebhook(location, instance, req.body)
            .catch(error => {
                console.error('Error processing webhook async:', error);
            });

        // Responder inmediatamente para no bloquear Evolution
        res.json({ success: true, received: true });
    } catch (error) {
        console.error('Error in webhook handler:', error);
        res.status(500).json({ error: error.message });
    }
});

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
                COUNT(CASE WHEN DATE(ml.processed_at) = CURDATE() THEN 1 END) as messages_today
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
// HEALTH CHECK
// ================================

router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'multi-tenant-api'
    });
});

module.exports = router;