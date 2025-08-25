// 🚀 API ENDPOINTS PARA ADMIN SUPER CONTROL
const express = require('express');
const router = express.Router();
const multiTenantService = require('../services/multiTenantService');
const evolutionService = require('../services/evolutionService');
const db = require('../config/database-sqlite');

// ================================
// ADMIN LOGIN
// ================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Verificar credenciales simples (en producción usar hash)
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin2024';
        
        console.log('🔍 Login attempt:', { 
            username, 
            envUsername: adminUsername, 
            envPassword: adminPassword,
            hasEnvVars: !!process.env.ADMIN_USERNAME 
        });
        
        // Credenciales de emergencia hardcodeadas
        const validCredentials = [
            { user: 'admin', pass: 'admin2024' },
            { user: adminUsername, pass: adminPassword }
        ];
        
        const isValidLogin = validCredentials.some(cred => 
            username === cred.user && password === cred.pass
        );
        
        if (isValidLogin) {
            // Generar token simple (en producción usar JWT)
            const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
            
            res.json({
                success: true,
                message: 'Login exitoso',
                token: token,
                user: { username: username, role: 'admin' }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Credenciales incorrectas'
            });
        }
    } catch (error) {
        console.error('❌ Error en login admin:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Middleware de autenticación para rutas admin
function requireAdminAuth(req, res, next) {
    const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-admin-token'];
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Token requerido' });
    }
    
    // Validación simple del token (en producción usar JWT)
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [username, timestamp] = decoded.split(':');
        
        // Token válido por 24 horas
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge > 24 * 60 * 60 * 1000) {
            return res.status(401).json({ success: false, error: 'Token expirado' });
        }
        
        req.adminUser = { username };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Token inválido' });
    }
}

// ================================
// ESTADÍSTICAS GENERALES
// ================================

router.get('/stats', async (req, res) => {
    try {
        // Estadísticas por defecto para cuando la BD no esté lista
        let stats = {
            totalClients: 0,
            totalInstances: 0,
            connectedInstances: 0,
            todayMessages: 0
        };
        
        try {
            // Intentar obtener estadísticas reales si la BD existe
            const [clients] = await db.query('SELECT COUNT(*) as count FROM users_accounts');
            const [instances] = await db.query('SELECT COUNT(*) as count FROM whatsapp_instances');
            const [connected] = await db.query(`SELECT COUNT(*) as count FROM whatsapp_instances WHERE status = 'connected'`);
            
            stats = {
                totalClients: clients[0]?.count || 0,
                totalInstances: instances[0]?.count || 0,
                connectedInstances: connected[0]?.count || 0,
                todayMessages: 0 // Por ahora 0
            };
        } catch (dbError) {
            console.log('📊 Using default stats - DB not ready yet');
        }

        res.json({
            success: true,
            ...stats
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.json({
            success: true,
            totalClients: 0,
            totalInstances: 0,
            connectedInstances: 0,
            todayMessages: 0
        });
    }
});

// ================================
// GESTIÓN DE CLIENTES
// ================================

router.get('/clients', async (req, res) => {
    try {
        const [clients] = await db.query(`
            SELECT 
                location_id, 
                company_name, 
                email, 
                created_at,
                (SELECT COUNT(*) FROM whatsapp_instances WHERE location_id = ghl_installations.location_id) as instances_count
            FROM ghl_installations 
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            clients: clients || []
        });
    } catch (error) {
        console.error('Error getting clients:', error);
        res.json({
            success: false,
            error: error.message,
            clients: []
        });
    }
});

router.delete('/clients/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;

        // Eliminar todas las instancias del cliente primero
        const [instances] = await db.query(
            'SELECT position FROM whatsapp_instances WHERE location_id = ?',
            [locationId]
        );

        for (const instance of instances) {
            try {
                const instanceName = `${locationId}_wa_${instance.position}`;
                await evolutionService.deleteInstance(instanceName);
            } catch (evolutionError) {
                console.warn(`Error deleting Evolution instance: ${evolutionError.message}`);
            }
        }

        // Eliminar de la base de datos
        await db.query('DELETE FROM whatsapp_instances WHERE location_id = ?', [locationId]);
        await db.query('DELETE FROM message_logs WHERE location_id = ?', [locationId]);
        await db.query('DELETE FROM webhook_logs WHERE location_id = ?', [locationId]);
        await db.query('DELETE FROM client_statistics WHERE location_id = ?', [locationId]);
        await db.query('DELETE FROM ghl_installations WHERE location_id = ?', [locationId]);

        res.json({
            success: true,
            message: `Cliente ${locationId} eliminado completamente`
        });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// ================================
// GESTIÓN DE INSTANCIAS
// ================================

router.get('/instances', async (req, res) => {
    try {
        const [instances] = await db.query(`
            SELECT 
                location_id,
                position,
                status,
                phone_number,
                qr_code,
                evolution_instance_id,
                connected_at,
                disconnected_at,
                last_activity
            FROM whatsapp_instances 
            ORDER BY location_id, position
        `);

        res.json({
            success: true,
            instances: instances || []
        });
    } catch (error) {
        console.error('Error getting instances:', error);
        res.json({
            success: false,
            error: error.message,
            instances: []
        });
    }
});

router.post('/instances/:locationId/:position/create', async (req, res) => {
    try {
        const { locationId, position } = req.params;
        
        // Crear instancia individual
        const result = await multiTenantService.activateInstance(locationId, parseInt(position));
        
        res.json({
            success: true,
            message: `Instancia ${locationId}_${position} creada`,
            result
        });
    } catch (error) {
        console.error('Error creating instance:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/instances/:locationId/:position', async (req, res) => {
    try {
        const { locationId, position } = req.params;
        
        // Eliminar instancia individual
        const result = await multiTenantService.disconnectInstance(locationId, parseInt(position));
        
        res.json({
            success: true,
            message: `Instancia ${locationId}_${position} eliminada`,
            result
        });
    } catch (error) {
        console.error('Error deleting instance:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

router.post('/instances/cleanup', async (req, res) => {
    try {
        // Limpiar instancias desconectadas
        const [disconnectedInstances] = await db.query(`
            SELECT location_id, position, evolution_instance_id 
            FROM whatsapp_instances 
            WHERE status IN ('disconnected', 'inactive')
        `);

        let cleaned = 0;
        for (const instance of disconnectedInstances) {
            try {
                if (instance.evolution_instance_id) {
                    await evolutionService.deleteInstance(instance.evolution_instance_id);
                }
                
                await db.query(`
                    UPDATE whatsapp_instances 
                    SET status = 'inactive', phone_number = NULL, qr_code = NULL
                    WHERE location_id = ? AND position = ?
                `, [instance.location_id, instance.position]);
                
                cleaned++;
            } catch (error) {
                console.warn(`Error cleaning instance ${instance.location_id}_${instance.position}:`, error.message);
            }
        }

        res.json({
            success: true,
            message: `${cleaned} instancias limpiadas`,
            cleaned
        });
    } catch (error) {
        console.error('Error cleaning instances:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// ================================
// EVOLUTION API MANAGEMENT
// ================================

router.get('/evolution/health', async (req, res) => {
    try {
        const health = await evolutionService.healthCheck();
        res.json(health);
    } catch (error) {
        console.error('Error checking Evolution health:', error);
        res.json({
            status: 'unhealthy',
            connected: false,
            error: error.message
        });
    }
});

router.get('/evolution/instances', async (req, res) => {
    try {
        const instances = evolutionService.getInstances();
        res.json({
            success: true,
            instances: instances.map(instance => ({
                name: instance.name,
                status: instance.status,
                createdAt: instance.createdAt
            }))
        });
    } catch (error) {
        console.error('Error getting Evolution instances:', error);
        res.json({
            success: false,
            error: error.message,
            instances: []
        });
    }
});

router.post('/evolution/instances/:instanceName/restart', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const result = await evolutionService.restartInstance(instanceName);
        
        res.json({
            success: true,
            message: `Instance ${instanceName} restarted`,
            result
        });
    } catch (error) {
        console.error('Error restarting instance:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/evolution/instances/:instanceName', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const result = await evolutionService.deleteInstance(instanceName);
        
        res.json({
            success: true,
            message: `Instance ${instanceName} deleted from Evolution API`,
            result
        });
    } catch (error) {
        console.error('Error deleting Evolution instance:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// ================================
// WEBHOOK MANAGEMENT
// ================================

router.get('/webhooks', async (req, res) => {
    try {
        const [webhooks] = await db.query(`
            SELECT 
                location_id,
                instance_name,
                event_type,
                processed,
                created_at,
                payload
            FROM webhook_logs 
            ORDER BY created_at DESC 
            LIMIT 100
        `);

        res.json({
            success: true,
            webhooks: webhooks || []
        });
    } catch (error) {
        console.error('Error getting webhooks:', error);
        res.json({
            success: false,
            error: error.message,
            webhooks: []
        });
    }
});

router.post('/webhooks/test/:locationId/:position', async (req, res) => {
    try {
        const { locationId, position } = req.params;
        const instanceName = `${locationId}_wa_${position}`;
        
        // Configurar webhook para instancia específica
        const webhookUrl = `${process.env.APP_URL}/webhook/messages?location=${locationId}&instance=${position}`;
        
        const result = await evolutionService.setWebhook(instanceName, webhookUrl);
        
        res.json({
            success: true,
            message: `Webhook configurado para ${instanceName}`,
            webhookUrl,
            result
        });
    } catch (error) {
        console.error('Error setting webhook:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/webhooks/logs', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        
        await db.query(`
            DELETE FROM webhook_logs 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [days]);

        res.json({
            success: true,
            message: `Webhook logs older than ${days} days deleted`
        });
    } catch (error) {
        console.error('Error cleaning webhook logs:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// ================================
// SYSTEM MANAGEMENT
// ================================

router.post('/system/reset', async (req, res) => {
    try {
        const { confirmReset } = req.body;
        
        if (confirmReset !== 'YES_DELETE_EVERYTHING') {
            return res.json({
                success: false,
                error: 'Reset not confirmed'
            });
        }

        // PELIGROSO: Eliminar todo
        await db.query('DELETE FROM webhook_logs');
        await db.query('DELETE FROM message_logs');
        await db.query('DELETE FROM client_statistics');
        await db.query('DELETE FROM whatsapp_instances');
        await db.query('DELETE FROM ghl_installations');

        res.json({
            success: true,
            message: 'System completely reset'
        });
    } catch (error) {
        console.error('Error resetting system:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

router.get('/logs', async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        
        const [logs] = await db.query(`
            (SELECT CONCAT('[WEBHOOK] ', event_type, ' - ', location_id) as log, created_at FROM webhook_logs ORDER BY created_at DESC LIMIT ?)
            UNION ALL
            (SELECT CONCAT('[MESSAGE] ', direction, ' - ', from_number) as log, created_at FROM message_logs ORDER BY created_at DESC LIMIT ?)
            ORDER BY created_at DESC
            LIMIT ?
        `, [limit/2, limit/2, limit]);

        const formattedLogs = logs.map(log => 
            `${log.created_at} - ${log.log}`
        );

        res.json({
            success: true,
            logs: formattedLogs
        });
    } catch (error) {
        console.error('Error getting logs:', error);
        res.json({
            success: false,
            error: error.message,
            logs: ['Error loading logs: ' + error.message]
        });
    }
});

router.get('/report', async (req, res) => {
    try {
        // Generar reporte completo del sistema
        const [clients] = await db.query('SELECT COUNT(*) as count FROM ghl_installations');
        const [instances] = await db.query('SELECT COUNT(*) as count FROM whatsapp_instances');
        const [messages] = await db.query('SELECT COUNT(*) as count FROM message_logs');
        const [webhooks] = await db.query('SELECT COUNT(*) as count FROM webhook_logs');

        const report = {
            generated_at: new Date().toISOString(),
            system: {
                total_clients: clients[0]?.count || 0,
                total_instances: instances[0]?.count || 0,
                total_messages: messages[0]?.count || 0,
                total_webhooks: webhooks[0]?.count || 0
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=whatsapp-platform-report.json');
        res.json(report);
    } catch (error) {
        console.error('Error generating report:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// ================================
// BULK OPERATIONS
// ================================

router.post('/bulk/create-instances', async (req, res) => {
    try {
        const { locationIds } = req.body;
        
        if (!Array.isArray(locationIds)) {
            return res.json({
                success: false,
                error: 'locationIds must be an array'
            });
        }

        const results = [];
        
        for (const locationId of locationIds) {
            try {
                // Registrar cliente si no existe
                await db.registerGHLInstallation({
                    locationId,
                    companyName: `Admin Bulk - ${locationId}`,
                    email: 'admin@bulk.com'
                });

                // Crear instancias
                const instanceResults = await evolutionService.createClientInstances(locationId, 5);
                results.push({
                    locationId,
                    success: true,
                    instances: instanceResults
                });
            } catch (error) {
                results.push({
                    locationId,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Bulk operation completed for ${locationIds.length} clients`,
            results
        });
    } catch (error) {
        console.error('Error in bulk create:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;