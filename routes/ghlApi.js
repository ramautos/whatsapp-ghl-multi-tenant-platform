// 🚀 API ENDPOINTS PARA INTEGRACIÓN GHL MARKETPLACE
const express = require('express');
const router = express.Router();
const UserInstanceService = require('../services/userInstanceService');

// ================================
// INSTALACIÓN DESDE GHL MARKETPLACE
// ================================
router.post('/install', async (req, res) => {
    try {
        console.log('📦 Nueva instalación desde GHL:', req.body);
        
        const { locationId, companyName, email, accessToken, refreshToken } = req.body;
        
        if (!locationId || !companyName) {
            return res.status(400).json({
                success: false,
                error: 'locationId y companyName son requeridos'
            });
        }
        
        // Registrar usuario y crear instancias automáticamente
        const result = await UserInstanceService.registerUserFromGHL({
            locationId,
            companyName,
            email: email || `${locationId}@ghl.user`,
            accessToken,
            refreshToken
        });
        
        console.log('✅ Usuario registrado desde GHL:', result);
        
        res.json({
            success: true,
            message: 'Usuario registrado y 5 instancias WhatsApp creadas',
            data: result,
            dashboardUrl: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/${locationId}`
        });
        
    } catch (error) {
        console.error('❌ Error en instalación GHL:', error);
        res.status(500).json({
            success: false,
            error: 'Error registrando usuario desde GHL',
            details: error.message
        });
    }
});

// ================================
// DESINSTALACIÓN DESDE GHL
// ================================
router.post('/uninstall', async (req, res) => {
    try {
        console.log('🗑️ Desinstalación desde GHL:', req.body);
        
        const { locationId } = req.body;
        
        if (!locationId) {
            return res.status(400).json({
                success: false,
                error: 'locationId es requerido'
            });
        }
        
        // TODO: Implementar lógica de desinstalación
        // - Marcar usuario como inactivo
        // - Desconectar instancias de WhatsApp
        // - Opcional: Eliminar instancias de Evolution API
        
        console.log(`⚠️ Usuario ${locationId} desinstalado (marcado como inactivo)`);
        
        res.json({
            success: true,
            message: 'Desinstalación procesada correctamente'
        });
        
    } catch (error) {
        console.error('❌ Error en desinstalación GHL:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando desinstalación',
            details: error.message
        });
    }
});

// ================================
// CALLBACK OAUTH GHL
// ================================
router.get('/callback', async (req, res) => {
    try {
        console.log('🔄 OAuth callback desde GHL:', req.query);
        
        const { code, state, location_id } = req.query;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Código OAuth requerido'
            });
        }
        
        // TODO: Intercambiar código por tokens usando GHL OAuth
        // const tokens = await exchangeCodeForTokens(code);
        
        // Por ahora, redirigir al dashboard
        if (location_id) {
            return res.redirect(`/dashboard/${location_id}`);
        }
        
        res.json({
            success: true,
            message: 'OAuth callback procesado',
            code: code.substring(0, 10) + '...'
        });
        
    } catch (error) {
        console.error('❌ Error en OAuth callback:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando OAuth callback',
            details: error.message
        });
    }
});

// ================================
// VERIFICAR INSTALACIÓN
// ================================
router.get('/verify/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        
        // Obtener instancias del usuario
        const instances = await UserInstanceService.getUserInstances(locationId);
        
        res.json({
            success: true,
            installed: instances.length > 0,
            instanceCount: instances.length,
            connectedInstances: instances.filter(i => i.status === 'connected').length
        });
        
    } catch (error) {
        console.error('❌ Error verificando instalación:', error);
        res.status(500).json({
            success: false,
            error: 'Error verificando instalación'
        });
    }
});

module.exports = router;