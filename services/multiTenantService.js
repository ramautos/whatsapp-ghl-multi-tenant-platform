// 🎯 SERVICIO MULTI-TENANT PARA GESTIÓN DE INSTANCIAS POR LOCATION_ID

const evolutionService = require('./evolutionService');
const ghlService = require('./ghlService');
const db = require('../config/database');

class MultiTenantService {
    constructor() {
        this.instances = new Map(); // Cache en memoria
    }

    // Registrar nuevo cliente desde instalación GHL
    async registerGHLInstallation(data) {
        const { locationId, companyName, accessToken, refreshToken, scopes } = data;
        
        try {
            // Guardar instalación GHL
            await db.query(
                `INSERT INTO ghl_installations 
                (location_id, company_name, access_token, refresh_token, scopes) 
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                access_token = VALUES(access_token),
                refresh_token = VALUES(refresh_token),
                updated_at = NOW()`,
                [locationId, companyName, accessToken, refreshToken, JSON.stringify(scopes)]
            );

            console.log(`✅ GHL Installation registered for ${locationId}`);
            return { success: true, locationId };
        } catch (error) {
            console.error('Error registering GHL installation:', error);
            throw error;
        }
    }

    // Registro de cliente en plataforma
    async registerClient(locationId, clientData) {
        const { name, email, phone } = clientData;
        
        try {
            // Verificar que existe instalación GHL
            const [installation] = await db.query(
                'SELECT * FROM ghl_installations WHERE location_id = ?',
                [locationId]
            );

            if (!installation.length) {
                throw new Error('GHL installation not found. Please install the app first.');
            }

            // Crear cliente
            await db.query(
                `INSERT INTO clients 
                (location_id, name, email, phone) 
                VALUES (?, ?, ?, ?)`,
                [locationId, name, email, phone]
            );

            // Crear configuración por defecto
            await db.query(
                `INSERT INTO client_settings (location_id) VALUES (?)`,
                [locationId]
            );

            // Preparar 5 slots vacíos
            for (let i = 1; i <= 5; i++) {
                await db.query(
                    `INSERT INTO whatsapp_instances 
                    (location_id, instance_name, position, status) 
                    VALUES (?, ?, ?, 'inactive')`,
                    [locationId, `${locationId}_wa_${i}`, i]
                );
            }

            console.log(`✅ Client registered: ${name} (${locationId})`);
            return { success: true, locationId };
        } catch (error) {
            console.error('Error registering client:', error);
            throw error;
        }
    }

    // Activar instancia WhatsApp (generar QR)
    async activateInstance(locationId, position) {
        try {
            const instanceName = `${locationId}_wa_${position}`;
            
            // Verificar que el slot existe y está inactivo
            const [instance] = await db.query(
                `SELECT * FROM whatsapp_instances 
                WHERE location_id = ? AND position = ? AND status IN ('inactive', 'disconnected')`,
                [locationId, position]
            );

            if (!instance.length) {
                throw new Error(`Slot ${position} not available or already active`);
            }

            // Crear instancia en Evolution API
            const webhookUrl = `${process.env.APP_URL}/webhook/messages?location=${locationId}&instance=${position}`;
            
            const evolutionData = await evolutionService.createInstance(instanceName, {
                webhookUrl,
                webhookByEvents: true,
                webhookBase64: false
            });

            // Generar QR
            const qrCode = await evolutionService.connectInstance(instanceName);

            // Actualizar en DB
            await db.query(
                `UPDATE whatsapp_instances 
                SET status = 'qr_pending', 
                    qr_code = ?, 
                    webhook_url = ?,
                    evolution_instance_id = ?
                WHERE location_id = ? AND position = ?`,
                [qrCode, webhookUrl, evolutionData.instance?.instanceName, locationId, position]
            );

            // Cachear en memoria
            this.instances.set(instanceName, {
                locationId,
                position,
                status: 'qr_pending',
                qrCode
            });

            console.log(`✅ Instance activated: ${instanceName}`);
            return { 
                success: true, 
                qrCode,
                instanceName,
                position 
            };
        } catch (error) {
            console.error('Error activating instance:', error);
            throw error;
        }
    }

    // Procesar webhook de Evolution
    async processEvolutionWebhook(locationId, instancePosition, data) {
        try {
            const instanceName = `${locationId}_wa_${instancePosition}`;
            
            // Obtener credenciales GHL del cliente
            const [ghlCreds] = await db.query(
                `SELECT access_token, refresh_token 
                FROM ghl_installations 
                WHERE location_id = ?`,
                [locationId]
            );

            if (!ghlCreds.length) {
                throw new Error(`No GHL credentials found for ${locationId}`);
            }

            // Procesar según tipo de evento
            const { event } = data;

            switch (event) {
                case 'connection.update':
                    await this.handleConnectionUpdate(locationId, instancePosition, data);
                    break;
                    
                case 'messages.upsert':
                    await this.handleIncomingMessage(locationId, instancePosition, data, ghlCreds[0]);
                    break;
                    
                case 'qr.updated':
                    await this.handleQRUpdate(locationId, instancePosition, data);
                    break;
                    
                default:
                    console.log(`Unhandled event: ${event}`);
            }

            // Log webhook
            await db.query(
                `INSERT INTO webhook_logs 
                (location_id, instance_name, event_type, payload, processed) 
                VALUES (?, ?, ?, ?, true)`,
                [locationId, instanceName, event, JSON.stringify(data)]
            );

            return { success: true };
        } catch (error) {
            console.error('Error processing webhook:', error);
            
            // Log error
            await db.query(
                `INSERT INTO webhook_logs 
                (location_id, instance_name, event_type, payload, processed) 
                VALUES (?, ?, ?, ?, false)`,
                [locationId, `${locationId}_wa_${instancePosition}`, data.event, JSON.stringify(data)]
            );
            
            throw error;
        }
    }

    // Manejar actualización de conexión
    async handleConnectionUpdate(locationId, position, data) {
        const { state } = data.data;
        const instanceName = `${locationId}_wa_${position}`;
        
        let status = 'disconnected';
        if (state === 'open') status = 'connected';
        else if (state === 'connecting') status = 'qr_pending';
        
        // Actualizar estado
        await db.query(
            `UPDATE whatsapp_instances 
            SET status = ?, 
                ${status === 'connected' ? 'connected_at = NOW(),' : ''}
                ${status === 'disconnected' ? 'disconnected_at = NOW(),' : ''}
                last_activity = NOW()
            WHERE location_id = ? AND position = ?`,
            [status, locationId, position]
        );

        // Si se conectó, obtener número de teléfono
        if (status === 'connected' && data.data.pushname) {
            const phoneNumber = data.data.legacy?.user || data.data.me?.id;
            await db.query(
                `UPDATE whatsapp_instances 
                SET phone_number = ? 
                WHERE location_id = ? AND position = ?`,
                [phoneNumber, locationId, position]
            );
        }

        console.log(`📱 Instance ${instanceName} status: ${status}`);
    }

    // Manejar mensaje entrante
    async handleIncomingMessage(locationId, position, data, ghlCreds) {
        try {
            const message = data.data?.[0];
            if (!message || message.key.fromMe) return; // Ignorar mensajes propios

            const fromNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
            const messageContent = message.message?.conversation || 
                                 message.message?.extendedTextMessage?.text || '';

            // Configurar GHL con credenciales del cliente
            const clientGHL = Object.create(ghlService);
            clientGHL.accessToken = ghlCreds.access_token;
            clientGHL.locationId = locationId;

            // Crear o buscar contacto en GHL del cliente
            const contact = await clientGHL.getOrCreateContact(fromNumber, {
                firstName: message.pushName || 'WhatsApp',
                lastName: 'Contact',
                source: 'WhatsApp'
            });

            // Crear conversación o mensaje
            const conversation = await clientGHL.createConversation(
                contact.id,
                messageContent
            );

            // Log mensaje procesado
            await db.query(
                `INSERT INTO message_logs 
                (location_id, instance_name, message_id, from_number, message_type, 
                 message_content, direction, ghl_contact_id, ghl_conversation_id, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    locationId,
                    `${locationId}_wa_${position}`,
                    message.key.id,
                    fromNumber,
                    'text',
                    messageContent,
                    'inbound',
                    contact.id,
                    conversation.id,
                    'sent_to_ghl'
                ]
            );

            // Actualizar estadísticas
            await this.updateStatistics(locationId, 'messages_received');

            console.log(`✅ Message processed for ${locationId}: ${fromNumber}`);
        } catch (error) {
            console.error('Error handling message:', error);
            throw error;
        }
    }

    // Obtener instancias de un cliente
    async getClientInstances(locationId) {
        try {
            const instances = await db.query(
                `SELECT * FROM whatsapp_instances 
                WHERE location_id = ? 
                ORDER BY position`,
                [locationId]
            );

            return instances[0];
        } catch (error) {
            console.error('Error getting instances:', error);
            throw error;
        }
    }

    // Desconectar instancia
    async disconnectInstance(locationId, position) {
        try {
            const instanceName = `${locationId}_wa_${position}`;
            
            // Desconectar en Evolution
            await evolutionService.logout(instanceName);
            await evolutionService.deleteInstance(instanceName);

            // Actualizar DB
            await db.query(
                `UPDATE whatsapp_instances 
                SET status = 'inactive', 
                    phone_number = NULL,
                    qr_code = NULL,
                    disconnected_at = NOW()
                WHERE location_id = ? AND position = ?`,
                [locationId, position]
            );

            console.log(`✅ Instance disconnected: ${instanceName}`);
            return { success: true };
        } catch (error) {
            console.error('Error disconnecting instance:', error);
            throw error;
        }
    }

    // Actualizar estadísticas
    async updateStatistics(locationId, metric, value = 1) {
        const today = new Date().toISOString().split('T')[0];
        
        await db.query(
            `INSERT INTO client_statistics 
            (location_id, date, ${metric}) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            ${metric} = ${metric} + ?`,
            [locationId, today, value, value]
        );
    }

    // Obtener estadísticas del cliente
    async getClientStatistics(locationId, days = 30) {
        const stats = await db.query(
            `SELECT * FROM client_statistics 
            WHERE location_id = ? 
            AND date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
            ORDER BY date DESC`,
            [locationId, days]
        );

        return stats[0];
    }
}

module.exports = new MultiTenantService();