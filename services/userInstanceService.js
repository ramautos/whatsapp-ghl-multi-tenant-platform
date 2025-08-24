// 🚀 SERVICIO PRINCIPAL - GESTIÓN DE USUARIOS E INSTANCIAS
const axios = require('axios');
const db = require('../config/database-sqlite');

class UserInstanceService {
    constructor() {
        this.evolutionApiUrl = process.env.EVOLUTION_API_URL || 'https://evolutionv2.cloude.es';
        this.evolutionApiKey = process.env.EVOLUTION_API_KEY || 'CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg';
        this.appUrl = process.env.APP_URL || 'http://localhost:3000';
    }

    // ================================
    // REGISTRO DE USUARIO DESDE GHL
    // ================================
    async registerUserFromGHL(data) {
        const { locationId, companyName, email } = data;
        
        try {
            console.log(`📝 Registrando nuevo usuario: ${locationId}`);
            
            // 1. Crear o actualizar usuario
            const [existingUser] = await db.query(
                'SELECT id FROM users_accounts WHERE location_id = ?',
                [locationId]
            );

            let userId;
            
            if (existingUser && existingUser.length > 0) {
                // Usuario existe, actualizar
                userId = existingUser[0].id;
                await db.query(
                    `UPDATE users_accounts 
                     SET company_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [companyName, email, userId]
                );
                console.log(`✅ Usuario actualizado: ${locationId}`);
            } else {
                // Crear nuevo usuario
                const result = await db.query(
                    `INSERT INTO users_accounts (location_id, company_name, email)
                     VALUES (?, ?, ?)`,
                    [locationId, companyName, email]
                );
                userId = result.lastID || result.insertId;
                console.log(`✅ Usuario creado: ${locationId} (ID: ${userId})`);
            }

            // 2. Crear 5 instancias automáticamente
            const instances = await this.createUserInstances(userId, locationId);
            
            return {
                success: true,
                userId,
                locationId,
                instances: instances.length,
                message: 'Usuario registrado y instancias creadas exitosamente'
            };
            
        } catch (error) {
            console.error('❌ Error registrando usuario:', error);
            throw error;
        }
    }

    // ================================
    // CREAR INSTANCIAS PARA USUARIO
    // ================================
    async createUserInstances(userId, locationId) {
        const instances = [];
        const MAX_INSTANCES = 5;
        
        console.log(`🔄 Creando ${MAX_INSTANCES} instancias para ${locationId}`);
        
        for (let i = 1; i <= MAX_INSTANCES; i++) {
            try {
                // Verificar si la instancia ya existe
                const [existing] = await db.query(
                    `SELECT id FROM whatsapp_instances 
                     WHERE user_id = ? AND instance_number = ?`,
                    [userId, i]
                );

                if (existing && existing.length > 0) {
                    console.log(`⚠️ Instancia ${i} ya existe para usuario ${userId}`);
                    continue;
                }

                // Nombre único para Evolution API
                const evolutionInstanceName = `${locationId}_wa_${i}`;
                
                // Crear instancia en Evolution API
                const evolutionInstance = await this.createEvolutionInstance(evolutionInstanceName);
                
                if (evolutionInstance) {
                    // Guardar en BD
                    const result = await db.query(
                        `INSERT INTO whatsapp_instances 
                         (user_id, location_id, instance_number, evolution_instance_name, status, webhook_url)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            userId,
                            locationId,
                            i,
                            evolutionInstanceName,
                            'created',
                            `${this.appUrl}/webhook/evolution?location=${locationId}&instance=${i}`
                        ]
                    );
                    
                    instances.push({
                        instanceNumber: i,
                        evolutionInstanceName,
                        status: 'created'
                    });
                    
                    console.log(`✅ Instancia ${i} creada: ${evolutionInstanceName}`);
                }
                
                // Pequeña pausa entre creaciones
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Error creando instancia ${i}:`, error.message);
            }
        }
        
        return instances;
    }

    // ================================
    // CREAR INSTANCIA EN EVOLUTION API
    // ================================
    async createEvolutionInstance(instanceName) {
        try {
            console.log(`📡 Creando instancia en Evolution API: ${instanceName}`);
            
            const response = await axios.post(
                `${this.evolutionApiUrl}/instance/create`,
                {
                    instanceName: instanceName,
                    qrcode: true,
                    integration: 'WHATSAPP-BAILEYS'
                },
                {
                    headers: {
                        'apikey': this.evolutionApiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            console.log(`✅ Instancia creada en Evolution: ${instanceName}`);
            return response.data;
            
        } catch (error) {
            if (error.response?.status === 403) {
                console.log(`⚠️ Instancia ya existe en Evolution: ${instanceName}`);
                return { existing: true };
            }
            console.error(`❌ Error Evolution API:`, error.response?.data || error.message);
            throw error;
        }
    }

    // ================================
    // OBTENER QR CODE DE INSTANCIA
    // ================================
    async getInstanceQRCode(locationId, instanceNumber) {
        try {
            const evolutionInstanceName = `${locationId}_wa_${instanceNumber}`;
            console.log(`📱 Obteniendo QR code para: ${evolutionInstanceName}`);
            
            // Obtener QR de Evolution API
            const response = await axios.get(
                `${this.evolutionApiUrl}/instance/connect/${evolutionInstanceName}`,
                {
                    headers: {
                        'apikey': this.evolutionApiKey
                    },
                    timeout: 15000
                }
            );
            
            if (response.data && response.data.code) {
                const qrCodeData = `data:image/png;base64,${response.data.code}`;
                
                // Actualizar QR en BD
                await db.query(
                    `UPDATE whatsapp_instances 
                     SET qr_code = ?, status = 'qr_pending'
                     WHERE location_id = ? AND instance_number = ?`,
                    [qrCodeData, locationId, instanceNumber]
                );
                
                console.log(`✅ QR code generado para ${evolutionInstanceName}`);
                return {
                    success: true,
                    qrCode: qrCodeData,
                    instanceName: evolutionInstanceName
                };
            }
            
            throw new Error('No QR code in response');
            
        } catch (error) {
            console.error(`❌ Error obteniendo QR:`, error.message);
            
            // Si la instancia ya está conectada
            if (error.response?.data?.message?.includes('already connected')) {
                await this.checkInstanceStatus(locationId, instanceNumber);
                return {
                    success: false,
                    error: 'Instance already connected',
                    connected: true
                };
            }
            
            throw error;
        }
    }

    // ================================
    // VERIFICAR ESTADO DE INSTANCIA
    // ================================
    async checkInstanceStatus(locationId, instanceNumber) {
        try {
            const evolutionInstanceName = `${locationId}_wa_${instanceNumber}`;
            
            const response = await axios.get(
                `${this.evolutionApiUrl}/instance/connectionState/${evolutionInstanceName}`,
                {
                    headers: {
                        'apikey': this.evolutionApiKey
                    }
                }
            );
            
            const state = response.data?.state || 'unknown';
            let dbStatus = 'disconnected';
            
            if (state === 'open') {
                dbStatus = 'connected';
            } else if (state === 'connecting') {
                dbStatus = 'qr_pending';
            }
            
            // Actualizar estado en BD
            await db.query(
                `UPDATE whatsapp_instances 
                 SET status = ?
                 WHERE location_id = ? AND instance_number = ?`,
                [dbStatus, locationId, instanceNumber]
            );
            
            return {
                state,
                status: dbStatus,
                instanceName: evolutionInstanceName
            };
            
        } catch (error) {
            console.error('Error checking status:', error.message);
            return { state: 'error', status: 'disconnected' };
        }
    }

    // ================================
    // OBTENER INSTANCIAS DE USUARIO
    // ================================
    async getUserInstances(locationId) {
        try {
            const [instances] = await db.query(
                `SELECT 
                    wi.*, 
                    ua.company_name 
                 FROM whatsapp_instances wi
                 JOIN users_accounts ua ON wi.user_id = ua.id
                 WHERE wi.location_id = ?
                 ORDER BY wi.instance_number`,
                [locationId]
            );
            
            // Para cada instancia, verificar si necesita QR
            for (const instance of instances || []) {
                if (instance.status === 'created' || !instance.qr_code) {
                    try {
                        await this.getInstanceQRCode(locationId, instance.instance_number);
                    } catch (error) {
                        console.log(`No se pudo generar QR para instancia ${instance.instance_number}`);
                    }
                }
            }
            
            // Obtener instancias actualizadas
            const [updatedInstances] = await db.query(
                `SELECT * FROM whatsapp_instances 
                 WHERE location_id = ?
                 ORDER BY instance_number`,
                [locationId]
            );
            
            return updatedInstances || [];
            
        } catch (error) {
            console.error('Error obteniendo instancias:', error);
            return [];
        }
    }

    // ================================
    // PROCESAR WEBHOOK DE EVOLUTION
    // ================================
    async processEvolutionWebhook(data) {
        try {
            const { instance, event } = data;
            
            // Extraer location_id del nombre de instancia
            const parts = instance?.split('_wa_');
            if (!parts || parts.length !== 2) return;
            
            const locationId = parts[0];
            const instanceNumber = parseInt(parts[1]);
            
            console.log(`📨 Webhook recibido: ${event} para ${instance}`);
            
            switch (event) {
                case 'connection.update':
                    await this.handleConnectionUpdate(locationId, instanceNumber, data);
                    break;
                    
                case 'messages.upsert':
                    await this.handleIncomingMessage(locationId, instanceNumber, data);
                    break;
                    
                default:
                    console.log(`Evento no manejado: ${event}`);
            }
            
            // Guardar log del webhook
            const [instanceData] = await db.query(
                'SELECT id FROM whatsapp_instances WHERE location_id = ? AND instance_number = ?',
                [locationId, instanceNumber]
            );
            
            if (instanceData && instanceData[0]) {
                await db.query(
                    'INSERT INTO webhook_logs (instance_id, event_type, payload) VALUES (?, ?, ?)',
                    [instanceData[0].id, event, JSON.stringify(data)]
                );
            }
            
        } catch (error) {
            console.error('Error procesando webhook:', error);
        }
    }

    // ================================
    // MANEJAR ACTUALIZACIÓN DE CONEXIÓN
    // ================================
    async handleConnectionUpdate(locationId, instanceNumber, data) {
        const state = data.data?.state;
        let status = 'disconnected';
        
        if (state === 'open') {
            status = 'connected';
            const phoneNumber = data.data?.pushname || data.data?.me || '';
            
            await db.query(
                `UPDATE whatsapp_instances 
                 SET status = ?, phone_number = ?, connected_at = CURRENT_TIMESTAMP
                 WHERE location_id = ? AND instance_number = ?`,
                [status, phoneNumber, locationId, instanceNumber]
            );
            
            console.log(`✅ Instancia conectada: ${locationId}_wa_${instanceNumber}`);
            
        } else if (state === 'close') {
            await db.query(
                `UPDATE whatsapp_instances 
                 SET status = 'disconnected', disconnected_at = CURRENT_TIMESTAMP
                 WHERE location_id = ? AND instance_number = ?`,
                [locationId, instanceNumber]
            );
            
            console.log(`❌ Instancia desconectada: ${locationId}_wa_${instanceNumber}`);
        }
    }

    // ================================
    // MANEJAR MENSAJE ENTRANTE
    // ================================
    async handleIncomingMessage(locationId, instanceNumber, data) {
        // Por ahora solo log, después integraremos con GHL
        console.log(`📩 Mensaje recibido en ${locationId}_wa_${instanceNumber}`);
        
        await db.query(
            `UPDATE whatsapp_instances 
             SET last_activity = CURRENT_TIMESTAMP
             WHERE location_id = ? AND instance_number = ?`,
            [locationId, instanceNumber]
        );
    }

    // ================================
    // OBTENER TODOS LOS USUARIOS (ADMIN)
    // ================================
    async getAllUsers() {
        try {
            const [users] = await db.query(
                `SELECT 
                    ua.*,
                    COUNT(wi.id) as total_instances,
                    SUM(CASE WHEN wi.status = 'connected' THEN 1 ELSE 0 END) as connected_instances
                 FROM users_accounts ua
                 LEFT JOIN whatsapp_instances wi ON ua.id = wi.user_id
                 GROUP BY ua.id
                 ORDER BY ua.created_at DESC`
            );
            
            return users || [];
        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            return [];
        }
    }
}

module.exports = new UserInstanceService();