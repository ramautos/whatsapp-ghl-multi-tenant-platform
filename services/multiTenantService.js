// 🎯 SERVICIO MULTI-TENANT PARA GESTIÓN DE INSTANCIAS POR LOCATION_ID

const evolutionService = require('./evolutionService');
const ghlService = require('./ghlService');
const db = require('../config/database-sqlite');

class MultiTenantService {
    constructor() {
        this.instances = new Map(); // Cache en memoria
    }

    // Registrar nuevo cliente desde instalación GHL
    async registerGHLInstallation(data) {
        try {
            const result = await db.registerGHLInstallation(data);
            console.log(`✅ GHL Installation registered for ${data.locationId}`);
            return result;
        } catch (error) {
            console.error('Error registering GHL installation:', error);
            throw error;
        }
    }

    // Registro de cliente en plataforma
    async registerClient(locationId, clientData) {
        try {
            const result = await db.registerClient(locationId, clientData);
            console.log(`✅ Client registered: ${clientData.name} (${locationId})`);
            return result;
        } catch (error) {
            console.error('Error registering client:', error);
            throw error;
        }
    }

    // Activar instancia WhatsApp (generar QR)
    async activateInstance(locationId, position) {
        try {
            const instanceName = `${locationId}_${position}`;
            const evolutionInstanceName = `${locationId}_wa_${position}`;
            
            // Verificar que el slot existe y está inactivo
            const [instance] = await db.query(
                `SELECT * FROM whatsapp_instances 
                WHERE location_id = ? AND position = ? AND status IN ('inactive', 'disconnected')`,
                [locationId, position]
            );

            if (!instance.length) {
                throw new Error(`Slot ${position} not available or already active`);
            }

            // Crear instancia en Evolution API con nombre correcto
            const webhookUrl = `${process.env.APP_URL}/webhook/messages?location=${locationId}&instance=${position}`;
            
            const evolutionData = await evolutionService.createInstance(evolutionInstanceName, {
                webhookUrl,
                webhookByEvents: true,
                webhookBase64: false
            });

            // Generar QR
            const qrCode = await evolutionService.connectInstance(evolutionInstanceName);

            // Actualizar en DB
            await db.query(
                `UPDATE whatsapp_instances 
                SET status = 'qr_pending', 
                    qr_code = ?, 
                    webhook_url = ?,
                    evolution_instance_id = ?
                WHERE location_id = ? AND position = ?`,
                [qrCode, webhookUrl, evolutionInstanceName, locationId, position]
            );

            // Cachear en memoria
            this.instances.set(instanceName, {
                locationId,
                position,
                status: 'qr_pending',
                qrCode,
                evolutionInstanceName
            });

            console.log(`✅ Instance activated: ${instanceName} -> Evolution: ${evolutionInstanceName}`);
            return { 
                success: true, 
                qrCode,
                instanceName,
                evolutionInstanceName,
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
            const instanceName = `${locationId}_${instancePosition}`;
            const evolutionInstanceName = `${locationId}_wa_${instancePosition}`;
            
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
        if (status === 'connected') {
            const phoneNumber = data.data.legacy?.user || 
                               data.data.me?.id || 
                               data.data.pushname || 
                               data.data.number ||
                               data.data.jid?.split('@')[0];
            
            if (phoneNumber) {
                // Limpiar formato del número (remover @s.whatsapp.net, etc)
                const cleanNumber = phoneNumber.replace('@s.whatsapp.net', '').replace('@c.us', '');
                
                await db.query(
                    `UPDATE whatsapp_instances 
                    SET phone_number = ? 
                    WHERE location_id = ? AND position = ?`,
                    [cleanNumber, locationId, position]
                );
                
                console.log(`📱 Phone number saved for ${instanceName}: +${cleanNumber}`);
            }
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

    // Sincronizar QR code desde Evolution API a base de datos
    async syncQRCodeFromEvolution(locationId, position) {
        try {
            const instanceName = `${locationId}_${position}`;
            const evolutionInstanceName = `${locationId}_wa_${position}`;

            console.log(`🔄 Syncing QR code for ${instanceName} from Evolution API...`);

            // Obtener QR code actual de Evolution API
            let qrCode = null;
            try {
                qrCode = await evolutionService.connectInstance(evolutionInstanceName);
                console.log(`✅ QR code obtained for ${instanceName}: ${qrCode ? 'Yes' : 'No'}`);
            } catch (error) {
                console.log(`⚠️ Error getting QR for ${instanceName}:`, error.message);
                if (error.message.includes('already be connected') || error.message.includes('No QR code available')) {
                    // Instancia ya conectada, obtener estado
                    try {
                        const status = await evolutionService.getInstanceStatus(evolutionInstanceName);
                        if (status.state === 'open') {
                            // Instancia conectada, actualizar BD
                            await db.query(
                                `UPDATE whatsapp_instances 
                                SET status = 'connected', qr_code = NULL, connected_at = CURRENT_TIMESTAMP
                                WHERE location_id = ? AND position = ?`,
                                [locationId, position]
                            );
                            console.log(`✅ Instance ${instanceName} marked as connected in DB`);
                            return { success: true, connected: true, qrCode: null };
                        } else if (status.state === 'close') {
                            // Instancia desconectada, intentar obtener QR nuevamente
                            console.log(`🔄 Instance ${instanceName} is disconnected, trying to get QR again...`);
                        }
                    } catch (statusError) {
                        console.warn(`⚠️ Could not get status for ${instanceName}:`, statusError.message);
                    }
                    return { success: false, error: 'Instance not available for QR' };
                } else {
                    throw error;
                }
            }

            if (qrCode) {
                // Actualizar QR code en BD
                const result = await db.query(
                    `UPDATE whatsapp_instances 
                    SET status = 'qr_pending', qr_code = ?, evolution_instance_id = ?
                    WHERE location_id = ? AND position = ?`,
                    [qrCode, evolutionInstanceName, locationId, position]
                );

                console.log(`✅ QR code synced for ${instanceName} - DB rows affected: ${result.affectedRows}`);
                console.log(`📱 QR code length: ${qrCode.length} characters`);
                return { success: true, qrCode };
            }

            return { success: false, error: 'No QR code available' };
        } catch (error) {
            console.error(`❌ Error syncing QR code for ${locationId}_${position}:`, error);
            throw error;
        }
    }

    // Obtener todas las instancias con QR codes actualizados
    async getInstancesWithFreshQR(locationId) {
        try {
            // Obtener instancias de BD
            const [instances] = await db.query(
                `SELECT * FROM whatsapp_instances WHERE location_id = ? ORDER BY position`,
                [locationId]
            );

            if (!instances.length) {
                return { success: false, error: 'No instances found' };
            }

            // Para cada instancia inactiva, intentar sincronizar QR
            for (const instance of instances) {
                if (instance.status === 'inactive' || instance.status === 'disconnected') {
                    try {
                        await this.syncQRCodeFromEvolution(locationId, instance.position);
                    } catch (error) {
                        console.warn(`⚠️ Failed to sync QR for instance ${instance.position}:`, error.message);
                    }
                }
            }

            // Obtener instancias actualizadas
            const [updatedInstances] = await db.query(
                `SELECT * FROM whatsapp_instances WHERE location_id = ? ORDER BY position`,
                [locationId]
            );

            return {
                success: true,
                instances: updatedInstances,
                locationId
            };
        } catch (error) {
            console.error('Error getting instances with fresh QR:', error);
            throw error;
        }
    }

    // Forzar generación de nuevo QR code (eliminar y recrear instancia)
    async forceNewQRCode(locationId, position) {
        try {
            const instanceName = `${locationId}_${position}`;
            const evolutionInstanceName = `${locationId}_wa_${position}`;

            console.log(`🆕 Forcing new QR code for ${instanceName}...`);

            // 1. Eliminar instancia de Evolution API
            try {
                await evolutionService.deleteInstance(evolutionInstanceName);
                console.log(`🗑️ Deleted Evolution instance: ${evolutionInstanceName}`);
            } catch (error) {
                console.warn(`⚠️ Could not delete Evolution instance: ${error.message}`);
            }

            // 2. Esperar un momento
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. Crear nueva instancia
            const webhookUrl = `${process.env.APP_URL}/webhook/messages?location=${locationId}&instance=${position}`;
            
            await evolutionService.createInstance(evolutionInstanceName, {
                webhookUrl,
                webhookByEvents: true,
                webhookBase64: false
            });

            // 4. Obtener QR code
            const qrCode = await evolutionService.connectInstance(evolutionInstanceName);

            if (qrCode) {
                // 5. Actualizar en BD
                await db.query(
                    `UPDATE whatsapp_instances 
                    SET status = 'qr_pending', qr_code = ?, evolution_instance_id = ?, 
                        disconnected_at = NULL, reconnection_attempts = 0
                    WHERE location_id = ? AND position = ?`,
                    [qrCode, evolutionInstanceName, locationId, position]
                );

                console.log(`✅ New QR code generated and saved for ${instanceName}`);
                return { success: true, qrCode, forced: true };
            }

            throw new Error('Could not generate QR code after recreation');
        } catch (error) {
            console.error(`❌ Error forcing new QR code for ${locationId}_${position}:`, error);
            throw error;
        }
    }
}

module.exports = new MultiTenantService();