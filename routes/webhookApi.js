// 📨 API ENDPOINTS PARA WEBHOOKS DE EVOLUTION API
const express = require('express');
const router = express.Router();
const UserInstanceService = require('../services/userInstanceService');

// ================================
// WEBHOOK PRINCIPAL DE EVOLUTION API
// ================================
router.post('/evolution', async (req, res) => {
    try {
        console.log('📨 Webhook Evolution recibido:', {
            query: req.query,
            headers: {
                'content-type': req.headers['content-type'],
                'user-agent': req.headers['user-agent']
            },
            bodyKeys: Object.keys(req.body || {})
        });
        
        // Validar que viene de Evolution API
        const apiKey = req.headers['x-api-key'] || req.headers['apikey'];
        if (!apiKey && process.env.NODE_ENV === 'production') {
            console.log('⚠️ Webhook sin API key');
        }
        
        // Procesar webhook con el servicio
        await UserInstanceService.processEvolutionWebhook(req.body);
        
        res.status(200).json({
            success: true,
            message: 'Webhook procesado correctamente'
        });
        
    } catch (error) {
        console.error('❌ Error procesando webhook Evolution:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando webhook'
        });
    }
});

// ================================
// WEBHOOK ESPECÍFICO POR INSTANCIA
// ================================
router.post('/messages', async (req, res) => {
    try {
        const { location, instance } = req.query;
        
        console.log(`📩 Webhook mensaje para ${location}_wa_${instance}:`, {
            event: req.body?.event,
            hasData: !!req.body?.data
        });
        
        if (!location || !instance) {
            return res.status(400).json({
                success: false,
                error: 'location e instance son requeridos en query params'
            });
        }
        
        // Agregar información de contexto al webhook
        const webhookData = {
            ...req.body,
            context: {
                locationId: location,
                instanceNumber: parseInt(instance),
                receivedAt: new Date().toISOString()
            }
        };
        
        // Procesar con el servicio
        await UserInstanceService.processEvolutionWebhook(webhookData);
        
        res.status(200).json({
            success: true,
            message: 'Webhook de mensaje procesado'
        });
        
    } catch (error) {
        console.error('❌ Error procesando webhook mensaje:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando webhook de mensaje'
        });
    }
});

// ================================
// WEBHOOK DE CONEXIÓN
// ================================
router.post('/connection', async (req, res) => {
    try {
        const { instance } = req.query;
        
        console.log(`🔌 Webhook conexión para ${instance}:`, req.body);
        
        if (!instance) {
            return res.status(400).json({
                success: false,
                error: 'instance es requerido en query params'
            });
        }
        
        // Procesar cambio de estado de conexión
        await UserInstanceService.processEvolutionWebhook({
            ...req.body,
            instance: instance,
            event: 'connection.update'
        });
        
        res.status(200).json({
            success: true,
            message: 'Webhook de conexión procesado'
        });
        
    } catch (error) {
        console.error('❌ Error procesando webhook conexión:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando webhook de conexión'
        });
    }
});

// ================================
// ENDPOINT DE PRUEBA WEBHOOK
// ================================
router.post('/test', (req, res) => {
    console.log('🧪 Test webhook recibido:', {
        headers: req.headers,
        query: req.query,
        body: req.body
    });
    
    res.json({
        success: true,
        message: 'Test webhook recibido correctamente',
        timestamp: new Date().toISOString(),
        receivedData: {
            headers: Object.keys(req.headers),
            query: req.query,
            bodySize: JSON.stringify(req.body || {}).length
        }
    });
});

// ================================
// OBTENER LOGS DE WEBHOOKS
// ================================
router.get('/logs/:locationId?', async (req, res) => {
    try {
        const { locationId } = req.params;
        const { limit = 50 } = req.query;
        
        console.log(`📋 Obteniendo logs de webhooks${locationId ? ` para ${locationId}` : ''}`);
        
        // TODO: Implementar consulta a webhook_logs
        // Por ahora retornar estructura básica
        
        res.json({
            success: true,
            logs: [],
            total: 0,
            locationId: locationId || 'all',
            limit: parseInt(limit)
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo logs:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo logs de webhooks'
        });
    }
});

module.exports = router;