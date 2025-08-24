// 📨 WEBHOOK HANDLER PARA MENSAJES WHATSAPP
// Procesa mensajes entrantes de Evolution API y los envía a GHL

const express = require('express');
const router = express.Router();
const db = require('../config/database-sqlite');
const ghlService = require('../services/ghlService');

// ================================
// WEBHOOK PRINCIPAL EVOLUTION API
// ================================

router.post('/evolution/message', async (req, res) => {
    try {
        console.log('📨 Webhook message received:', JSON.stringify(req.body, null, 2));
        
        const webhookData = req.body;
        
        // Validar estructura básica del webhook
        if (!webhookData.instance || !webhookData.data) {
            console.log('⚠️ Invalid webhook structure');
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid webhook structure' 
            });
        }

        const { instance, data, event } = webhookData;
        
        // Solo procesar mensajes entrantes
        if (event !== 'messages.upsert' || !data.messages) {
            console.log(`ℹ️ Ignoring event: ${event}`);
            return res.json({ success: true, message: 'Event ignored' });
        }

        // Procesar cada mensaje
        for (const message of data.messages) {
            await processIncomingMessage(instance, message);
        }

        res.json({ 
            success: true, 
            message: 'Messages processed successfully',
            processed: data.messages.length 
        });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ================================
// PROCESAMIENTO DE MENSAJES
// ================================

async function processIncomingMessage(instanceName, message) {
    try {
        console.log('🔄 Processing message:', message.key?.id);

        // Extraer información del mensaje
        const messageData = {
            messageId: message.key?.id,
            instanceName: instanceName,
            from: message.key?.remoteJid,
            fromName: message.pushName,
            messageType: getMessageType(message),
            content: getMessageContent(message),
            timestamp: new Date(message.messageTimestamp * 1000),
            isFromMe: message.key?.fromMe || false
        };

        // Solo procesar mensajes entrantes (no enviados por nosotros)
        if (messageData.isFromMe) {
            console.log('↩️ Skipping outgoing message');
            return;
        }

        // Extraer location_id del nombre de instancia
        const locationId = extractLocationId(instanceName);
        if (!locationId) {
            console.log('⚠️ Could not extract location_id from instance:', instanceName);
            return;
        }

        messageData.locationId = locationId;

        // Obtener número registrado de WhatsApp para esta instancia
        const registeredWhatsAppNumber = await getRegisteredWhatsAppNumber(instanceName);
        
        // Agregar datos completos necesarios para N8N
        const completeMessageData = {
            ...messageData,
            registeredWhatsAppNumber, // Número que scaneo el QR
            senderNumber: extractPhoneNumber(messageData.from), // Número limpio que envía
            locationId, // Location ID de GHL
            timestamp: new Date().toISOString()
        };

        // ENVIAR A N8N (flujo principal)
        await forwardToN8N(completeMessageData);

        // Guardar mensaje en base de datos (para tracking)
        await saveMessageLog(completeMessageData);

        // Actualizar estadísticas
        await updateMessageStats(locationId);

        console.log('✅ Message processed successfully:', messageData.messageId);

    } catch (error) {
        console.error('❌ Error processing message:', error);
        throw error;
    }
}

// ================================
// UTILIDADES DE MENSAJES
// ================================

function getMessageType(message) {
    if (message.message?.conversation) return 'text';
    if (message.message?.extendedTextMessage) return 'text';
    if (message.message?.imageMessage) return 'image';
    if (message.message?.audioMessage) return 'audio';
    if (message.message?.videoMessage) return 'video';
    if (message.message?.documentMessage) return 'document';
    if (message.message?.contactMessage) return 'contact';
    if (message.message?.locationMessage) return 'location';
    return 'unknown';
}

function getMessageContent(message) {
    // Texto simple
    if (message.message?.conversation) {
        return message.message.conversation;
    }
    
    // Texto extendido
    if (message.message?.extendedTextMessage?.text) {
        return message.message.extendedTextMessage.text;
    }
    
    // Imagen
    if (message.message?.imageMessage) {
        return message.message.imageMessage.caption || '[Imagen]';
    }
    
    // Audio
    if (message.message?.audioMessage) {
        return '[Mensaje de audio]';
    }
    
    // Video
    if (message.message?.videoMessage) {
        return message.message.videoMessage.caption || '[Video]';
    }
    
    // Documento
    if (message.message?.documentMessage) {
        return `[Documento: ${message.message.documentMessage.fileName || 'archivo'}]`;
    }
    
    // Contacto
    if (message.message?.contactMessage) {
        return `[Contacto: ${message.message.contactMessage.displayName}]`;
    }
    
    // Ubicación
    if (message.message?.locationMessage) {
        return '[Ubicación compartida]';
    }
    
    return '[Mensaje no soportado]';
}

function extractLocationId(instanceName) {
    // Formato esperado: LOCATION_ID_1, LOCATION_ID_2, etc.
    // O: LOCATION_ID_wa_1, LOCATION_ID_wa_2, etc.
    
    const parts = instanceName.split('_');
    if (parts.length >= 2) {
        // Si tiene formato LOCATION_ID_wa_1, tomar hasta "wa"
        const waIndex = parts.findIndex(part => part === 'wa');
        if (waIndex > 0) {
            return parts.slice(0, waIndex).join('_');
        }
        // Si tiene formato LOCATION_ID_1, tomar todo excepto el último
        return parts.slice(0, -1).join('_');
    }
    
    return null;
}

// ================================
// BASE DE DATOS
// ================================

async function saveMessageLog(messageData) {
    try {
        await db.query(`
            INSERT INTO message_logs (
                message_id, location_id, instance_name, from_number, 
                from_name, message_type, content, processed_at, 
                direction, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'inbound', 'received')
        `, [
            messageData.messageId,
            messageData.locationId,
            messageData.instanceName,
            messageData.from,
            messageData.fromName,
            messageData.messageType,
            messageData.content,
            messageData.timestamp.toISOString()
        ]);

        console.log('💾 Message saved to database');
    } catch (error) {
        console.error('❌ Error saving message log:', error);
        // No lanzar error para evitar que falle el webhook
    }
}

async function updateMessageStats(locationId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        await db.query(`
            INSERT OR REPLACE INTO client_statistics (
                location_id, date, messages_received, updated_at
            ) VALUES (
                ?, ?, 
                COALESCE((SELECT messages_received FROM client_statistics WHERE location_id = ? AND date = ?), 0) + 1,
                datetime('now')
            )
        `, [locationId, today, locationId, today]);

        console.log('📊 Statistics updated for:', locationId);
    } catch (error) {
        console.error('❌ Error updating stats:', error);
        // No lanzar error
    }
}

// ================================
// INTEGRACIÓN GOHIGHLEVEL
// ================================

async function forwardToGHL(messageData) {
    try {
        console.log('🚀 Forwarding to GoHighLevel...');

        // Obtener configuración del cliente
        const [clientConfig] = await db.query(`
            SELECT gi.access_token, c.name as client_name
            FROM ghl_installations gi
            JOIN clients c ON gi.location_id = c.location_id
            WHERE gi.location_id = ?
        `, [messageData.locationId]);

        if (!clientConfig.length) {
            console.log('⚠️ No GHL config found for location:', messageData.locationId);
            return;
        }

        const accessToken = clientConfig[0].access_token;

        // Preparar payload para GHL
        const ghlPayload = {
            type: 'SMS', // GHL trata WhatsApp como SMS
            contactId: await getOrCreateContact(messageData, accessToken),
            locationId: messageData.locationId,
            message: messageData.content,
            direction: 'inbound',
            status: 'delivered',
            dateAdded: messageData.timestamp.toISOString(),
            meta: {
                source: 'whatsapp',
                instanceName: messageData.instanceName,
                messageType: messageData.messageType,
                platform: 'whatsapp-ghl-platform'
            }
        };

        // Enviar a GHL
        const response = await ghlService.createConversation(ghlPayload, accessToken);
        
        if (response.success) {
            console.log('✅ Message forwarded to GHL successfully');
            
            // Actualizar log con GHL conversation ID
            await db.query(`
                UPDATE message_logs 
                SET ghl_conversation_id = ?, status = 'forwarded'
                WHERE message_id = ?
            `, [response.conversationId, messageData.messageId]);
        } else {
            console.log('⚠️ Failed to forward to GHL:', response.error);
        }

    } catch (error) {
        console.error('❌ Error forwarding to GHL:', error);
        // No lanzar error para mantener el webhook funcionando
    }
}

async function getOrCreateContact(messageData, accessToken) {
    try {
        // Extraer número limpio (sin @s.whatsapp.net)
        const phoneNumber = messageData.from.split('@')[0];
        
        // Buscar contacto existente en GHL
        let contact = await ghlService.findContactByPhone(phoneNumber, accessToken);
        
        if (!contact) {
            // Crear nuevo contacto
            contact = await ghlService.createContact({
                phone: phoneNumber,
                name: messageData.fromName || 'WhatsApp Contact',
                source: 'whatsapp',
                tags: ['whatsapp-lead']
            }, accessToken);
        }
        
        return contact.id;
    } catch (error) {
        console.error('❌ Error managing GHL contact:', error);
        return null;
    }
}

// ================================
// WEBHOOK STATUS Y HEALTH
// ================================

router.get('/evolution/status', (req, res) => {
    res.json({
        success: true,
        service: 'WhatsApp Webhook Handler',
        timestamp: new Date().toISOString(),
        endpoints: {
            messages: '/webhook/evolution/message',
            status: '/webhook/evolution/status'
        },
        stats: {
            // Aquí se pueden agregar estadísticas del webhook
            uptime: process.uptime(),
            processedToday: 0 // TODO: implementar contador
        }
    });
});

// ================================
// WEBHOOK EVENTS ADICIONALES
// ================================

// Webhook para eventos de conexión
router.post('/evolution/connection', async (req, res) => {
    try {
        const { instance, data, event } = req.body;
        
        console.log(`🔌 Connection event: ${event} for ${instance}`);
        
        // Actualizar estado de instancia en BD
        if (event === 'connection.update') {
            const status = data.state === 'open' ? 'connected' : 'disconnected';
            
            await db.query(`
                UPDATE whatsapp_instances 
                SET status = ?, last_seen = datetime('now')
                WHERE instance_name = ?
            `, [status, instance]);
            
            console.log(`📱 Instance ${instance} status updated to: ${status}`);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Connection webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// FUNCIONES PARA N8N Y NÚMEROS REGISTRADOS
// ================================

async function getRegisteredWhatsAppNumber(instanceName) {
    try {
        // Obtener el número de WhatsApp registrado para esta instancia
        const [instance] = await db.query(`
            SELECT phone_number 
            FROM whatsapp_instances 
            WHERE instance_name = ? AND phone_number IS NOT NULL
        `, [instanceName]);

        if (instance.length > 0 && instance[0].phone_number) {
            return instance[0].phone_number;
        }

        // Si no hay número guardado, intentar obtenerlo de Evolution API
        const evolutionService = require('../services/evolutionService');
        const instanceInfo = await evolutionService.getInstanceStatus(instanceName);
        
        if (instanceInfo && instanceInfo.instance && instanceInfo.instance.owner) {
            const phoneNumber = instanceInfo.instance.owner.replace('@s.whatsapp.net', '');
            
            // Guardar el número en la base de datos para futuras referencias
            await db.query(`
                UPDATE whatsapp_instances 
                SET phone_number = ? 
                WHERE instance_name = ?
            `, [phoneNumber, instanceName]);
            
            return phoneNumber;
        }

        console.warn(`⚠️ No registered WhatsApp number found for instance: ${instanceName}`);
        return null;
    } catch (error) {
        console.error('❌ Error getting registered WhatsApp number:', error);
        return null;
    }
}

function extractPhoneNumber(whatsappJid) {
    // Extraer número limpio de formatos como: 521234567890@s.whatsapp.net
    if (!whatsappJid) return null;
    return whatsappJid.split('@')[0];
}

async function forwardToN8N(messageData) {
    try {
        console.log('🚀 Forwarding message to N8N...');

        // Preparar payload completo para N8N
        const n8nPayload = {
            // Número que scaneo el QR (registrado en nuestra plataforma)
            registered_whatsapp_number: messageData.registeredWhatsAppNumber,
            
            // Número que envía el mensaje (remitente)
            sender_number: messageData.senderNumber,
            sender_name: messageData.fromName,
            
            // Contenido del mensaje
            message_content: messageData.content,
            message_type: messageData.messageType,
            
            // Location ID de GHL
            location_id: messageData.locationId,
            
            // Metadatos adicionales
            timestamp: messageData.timestamp,
            instance_name: messageData.instanceName,
            message_id: messageData.messageId,
            
            // Información del sistema
            platform: 'whatsapp-ghl-platform',
            webhook_version: '1.0',
            processed_at: new Date().toISOString()
        };

        console.log('📤 N8N Payload:', JSON.stringify(n8nPayload, null, 2));

        // URL de N8N (ajustar según tu configuración)
        const n8nWebhookUrl = `https://ray.cloude.es/webhook/evolution1?location=${messageData.locationId}&instance=${messageData.instanceName.split('_').pop()}`;
        
        // Enviar a N8N usando axios
        const axios = require('axios');
        const response = await axios.post(n8nWebhookUrl, n8nPayload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WhatsApp-GHL-Platform/1.0'
            },
            timeout: 10000 // 10 segundos timeout
        });

        if (response.status === 200) {
            console.log('✅ Message forwarded to N8N successfully');
            
            // Log exitoso en base de datos
            await db.query(`
                INSERT INTO webhook_logs (
                    location_id, instance_name, event_type, 
                    payload, processed, target_system
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                messageData.locationId, 
                messageData.instanceName, 
                'message_to_n8n',
                JSON.stringify(n8nPayload), 
                true, 
                'n8n'
            ]);
            
        } else {
            console.warn('⚠️ N8N webhook returned non-200 status:', response.status);
        }

    } catch (error) {
        console.error('❌ Error forwarding to N8N:', error.message);
        
        // Log error en base de datos
        try {
            await db.query(`
                INSERT INTO webhook_logs (
                    location_id, instance_name, event_type, 
                    payload, processed, error_message, target_system
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                messageData.locationId || 'unknown', 
                messageData.instanceName || 'unknown', 
                'message_to_n8n_error',
                JSON.stringify(messageData), 
                false, 
                error.message,
                'n8n'
            ]);
        } catch (logError) {
            console.error('❌ Error logging N8N error:', logError);
        }
    }
}

module.exports = router;