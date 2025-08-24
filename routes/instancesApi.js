// 🔌 API ENDPOINTS PARA GESTIÓN DE INSTANCIAS WHATSAPP
const express = require('express');
const router = express.Router();
const UserInstanceService = require('../services/userInstanceService');

// ================================
// OBTENER INSTANCIAS DE USUARIO
// ================================
router.get('/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        
        console.log(`📱 Obteniendo instancias para: ${locationId}`);
        
        const instances = await UserInstanceService.getUserInstances(locationId);
        
        res.json({
            success: true,
            locationId,
            instances: instances.map(instance => ({
                id: instance.id,
                position: instance.instance_number,
                evolutionName: instance.evolution_instance_name,
                phoneNumber: instance.phone_number,
                displayName: instance.display_name,
                status: instance.status,
                hasQrCode: !!instance.qr_code,
                qrCode: instance.qr_code,
                connectedAt: instance.connected_at,
                lastActivity: instance.last_activity
            }))
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo instancias:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo instancias de WhatsApp'
        });
    }
});

// ================================
// CONECTAR INSTANCIA (GENERAR QR)
// ================================
router.post('/:locationId/:instanceNumber/connect', async (req, res) => {
    try {
        const { locationId, instanceNumber } = req.params;
        const instanceNum = parseInt(instanceNumber);
        
        console.log(`🔄 Generando QR para: ${locationId}_wa_${instanceNum}`);
        
        const result = await UserInstanceService.getInstanceQRCode(locationId, instanceNum);
        
        if (result.success) {
            res.json({
                success: true,
                qrCode: result.qrCode,
                instanceName: result.instanceName,
                message: 'QR code generado correctamente'
            });
        } else if (result.connected) {
            res.json({
                success: false,
                connected: true,
                error: 'La instancia ya está conectada',
                message: 'WhatsApp ya está conectado en esta instancia'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'No se pudo generar QR code'
            });
        }
        
    } catch (error) {
        console.error('❌ Error conectando instancia:', error);
        res.status(500).json({
            success: false,
            error: 'Error generando QR code',
            details: error.message
        });
    }
});

// ================================
// VERIFICAR ESTADO DE INSTANCIA
// ================================
router.get('/:locationId/:instanceNumber/status', async (req, res) => {
    try {
        const { locationId, instanceNumber } = req.params;
        const instanceNum = parseInt(instanceNumber);
        
        console.log(`🔍 Verificando estado: ${locationId}_wa_${instanceNum}`);
        
        const result = await UserInstanceService.checkInstanceStatus(locationId, instanceNum);
        
        res.json({
            success: true,
            instanceName: result.instanceName,
            evolutionState: result.state,
            dbStatus: result.status,
            connected: result.state === 'open'
        });
        
    } catch (error) {
        console.error('❌ Error verificando estado:', error);
        res.status(500).json({
            success: false,
            error: 'Error verificando estado de instancia'
        });
    }
});

// ================================
// DESCONECTAR INSTANCIA
// ================================
router.post('/:locationId/:instanceNumber/disconnect', async (req, res) => {
    try {
        const { locationId, instanceNumber } = req.params;
        const instanceNum = parseInt(instanceNumber);
        const evolutionInstanceName = `${locationId}_wa_${instanceNum}`;
        
        console.log(`🔌 Desconectando: ${evolutionInstanceName}`);
        
        // TODO: Implementar desconexión en Evolution API
        // const result = await evolutionService.disconnectInstance(evolutionInstanceName);
        
        res.json({
            success: true,
            message: 'Instancia desconectada (funcionalidad pendiente)',
            instanceName: evolutionInstanceName
        });
        
    } catch (error) {
        console.error('❌ Error desconectando instancia:', error);
        res.status(500).json({
            success: false,
            error: 'Error desconectando instancia'
        });
    }
});

// ================================
// REINICIAR INSTANCIA
// ================================
router.post('/:locationId/:instanceNumber/restart', async (req, res) => {
    try {
        const { locationId, instanceNumber } = req.params;
        const instanceNum = parseInt(instanceNumber);
        
        console.log(`🔄 Reiniciando instancia: ${locationId}_wa_${instanceNum}`);
        
        // 1. Verificar estado actual
        await UserInstanceService.checkInstanceStatus(locationId, instanceNum);
        
        // 2. Generar nuevo QR
        const qrResult = await UserInstanceService.getInstanceQRCode(locationId, instanceNum);
        
        res.json({
            success: true,
            message: 'Instancia reiniciada',
            qrCode: qrResult.success ? qrResult.qrCode : null,
            hasNewQr: qrResult.success
        });
        
    } catch (error) {
        console.error('❌ Error reiniciando instancia:', error);
        res.status(500).json({
            success: false,
            error: 'Error reiniciando instancia'
        });
    }
});

// ================================
// OBTENER INFORMACIÓN DETALLADA
// ================================
router.get('/:locationId/:instanceNumber/info', async (req, res) => {
    try {
        const { locationId, instanceNumber } = req.params;
        const instanceNum = parseInt(instanceNumber);
        
        // Obtener datos de BD
        const instances = await UserInstanceService.getUserInstances(locationId);
        const instance = instances.find(i => i.instance_number === instanceNum);
        
        if (!instance) {
            return res.status(404).json({
                success: false,
                error: 'Instancia no encontrada'
            });
        }
        
        // Obtener estado de Evolution API
        const evolutionStatus = await UserInstanceService.checkInstanceStatus(locationId, instanceNum);
        
        res.json({
            success: true,
            instance: {
                id: instance.id,
                locationId: instance.location_id,
                instanceNumber: instance.instance_number,
                evolutionName: instance.evolution_instance_name,
                phoneNumber: instance.phone_number,
                displayName: instance.display_name,
                status: instance.status,
                webhookUrl: instance.webhook_url,
                connectedAt: instance.connected_at,
                disconnectedAt: instance.disconnected_at,
                lastActivity: instance.last_activity,
                createdAt: instance.created_at,
                evolutionState: evolutionStatus.state,
                hasQrCode: !!instance.qr_code
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo info de instancia:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo información de instancia'
        });
    }
});

module.exports = router;