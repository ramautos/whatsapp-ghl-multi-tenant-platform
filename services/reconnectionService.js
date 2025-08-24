// 🔄 SERVICIO DE AUTO-RECONEXIÓN WHATSAPP
// Monitorea y reconecta automáticamente instancias desconectadas

const cron = require('node-cron');
const db = require('../config/database-sqlite');
const evolutionService = require('./evolutionService');
const { EventEmitter } = require('events');

class ReconnectionService extends EventEmitter {
    constructor() {
        super();
        this.isRunning = false;
        this.reconnectionAttempts = new Map(); // instanceName -> attempts
        this.lastHealthCheck = new Date();
        this.maxRetries = 3;
        this.retryDelay = 5 * 60 * 1000; // 5 minutos
    }

    initialize() {
        console.log('🔄 Initializing Auto-Reconnection Service...');
        
        // Verificar conexiones cada 2 minutos
        cron.schedule('*/2 * * * *', () => {
            this.checkConnections();
        });

        // Health check completo cada 15 minutos
        cron.schedule('*/15 * * * *', () => {
            this.fullHealthCheck();
        });

        // Reset contadores de reintentos cada hora
        cron.schedule('0 * * * *', () => {
            this.resetRetryCounters();
        });

        this.isRunning = true;
        console.log('✅ Auto-Reconnection Service started');
        
        // Emit evento de inicio
        this.emit('service-started');
    }

    // ================================
    // MONITOREO DE CONEXIONES
    // ================================

    async checkConnections() {
        try {
            if (!this.isRunning) return;

            console.log('🔍 Checking WhatsApp connections...');
            
            // Obtener todas las instancias activas
            const [instances] = await db.query(`
                SELECT instance_name, location_id, status, last_seen, position
                FROM whatsapp_instances 
                WHERE status IN ('connected', 'connecting', 'open')
                OR last_seen >= datetime('now', '-1 hour')
                ORDER BY location_id, position
            `);

            let healthyConnections = 0;
            let disconnectedInstances = [];

            for (const instance of instances) {
                const connectionStatus = await this.checkInstanceHealth(instance);
                
                if (connectionStatus.isHealthy) {
                    healthyConnections++;
                } else {
                    disconnectedInstances.push({
                        ...instance,
                        issue: connectionStatus.issue
                    });
                }
            }

            // Procesar instancias desconectadas
            if (disconnectedInstances.length > 0) {
                console.log(`⚠️ Found ${disconnectedInstances.length} disconnected instances`);
                
                for (const instance of disconnectedInstances) {
                    await this.attemptReconnection(instance);
                }
            }

            // Actualizar métricas
            await this.updateHealthMetrics(healthyConnections, instances.length);

            console.log(`✅ Health check complete: ${healthyConnections}/${instances.length} healthy`);

        } catch (error) {
            console.error('❌ Error in connection check:', error);
            this.emit('check-error', error);
        }
    }

    async checkInstanceHealth(instance) {
        try {
            // 1. Verificar estado en Evolution API
            const evolutionStatus = await evolutionService.getInstanceStatus(instance.instance_name);
            
            if (!evolutionStatus || evolutionStatus.state !== 'open') {
                return {
                    isHealthy: false,
                    issue: 'evolution-disconnected',
                    details: `Evolution state: ${evolutionStatus?.state || 'unknown'}`
                };
            }

            // 2. Verificar última actividad (no más de 30 minutos)
            const lastSeen = new Date(instance.last_seen || instance.updated_at);
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            
            if (lastSeen < thirtyMinutesAgo && instance.status === 'connected') {
                return {
                    isHealthy: false,
                    issue: 'inactive-connection',
                    details: `Last seen: ${lastSeen.toISOString()}`
                };
            }

            return { isHealthy: true };

        } catch (error) {
            console.error(`❌ Error checking health for ${instance.instance_name}:`, error);
            return {
                isHealthy: false,
                issue: 'health-check-error',
                details: error.message
            };
        }
    }

    // ================================
    // RECONEXIÓN AUTOMÁTICA
    // ================================

    async attemptReconnection(instance) {
        try {
            const instanceName = instance.instance_name;
            const currentAttempts = this.reconnectionAttempts.get(instanceName) || 0;

            // Verificar límite de reintentos
            if (currentAttempts >= this.maxRetries) {
                console.log(`⚠️ Max retries reached for ${instanceName}, skipping`);
                await this.markInstanceAsFailed(instance);
                return;
            }

            console.log(`🔄 Attempting reconnection ${currentAttempts + 1}/${this.maxRetries} for ${instanceName}`);
            
            // Emit evento pre-reconexión
            this.emit('reconnection-attempt', {
                instance: instanceName,
                attempt: currentAttempts + 1,
                maxRetries: this.maxRetries
            });

            // Incrementar contador
            this.reconnectionAttempts.set(instanceName, currentAttempts + 1);

            // Intentar reconexión según el tipo de problema
            let reconnectionResult;
            
            switch (instance.issue) {
                case 'evolution-disconnected':
                    reconnectionResult = await this.reconnectEvolutionInstance(instance);
                    break;
                case 'inactive-connection':
                    reconnectionResult = await this.restartInstance(instance);
                    break;
                default:
                    reconnectionResult = await this.fullInstanceReconnection(instance);
            }

            if (reconnectionResult.success) {
                console.log(`✅ Reconnection successful for ${instanceName}`);
                
                // Reset contador de reintentos
                this.reconnectionAttempts.delete(instanceName);
                
                // Actualizar estado en BD
                await this.markInstanceAsReconnected(instance);
                
                // Emit evento de éxito
                this.emit('reconnection-success', {
                    instance: instanceName,
                    locationId: instance.location_id
                });
            } else {
                console.log(`❌ Reconnection failed for ${instanceName}: ${reconnectionResult.error}`);
                
                // Si es el último intento, marcar como fallida
                if (currentAttempts + 1 >= this.maxRetries) {
                    await this.markInstanceAsFailed(instance);
                }
            }

        } catch (error) {
            console.error(`❌ Error in reconnection attempt for ${instance.instance_name}:`, error);
        }
    }

    async reconnectEvolutionInstance(instance) {
        try {
            // Intentar reconectar usando Evolution API
            const result = await evolutionService.connectInstance(instance.instance_name);
            
            if (result) {
                return { success: true, qrCode: result };
            } else {
                return { success: false, error: 'Failed to generate QR code' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async restartInstance(instance) {
        try {
            // Reiniciar instancia completamente
            await evolutionService.restartInstance(instance.instance_name);
            
            // Esperar un poco y verificar
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const status = await evolutionService.getInstanceStatus(instance.instance_name);
            
            return { 
                success: status && (status.state === 'open' || status.state === 'connecting'),
                status: status?.state
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async fullInstanceReconnection(instance) {
        try {
            // 1. Eliminar instancia
            await evolutionService.deleteInstance(instance.instance_name);
            
            // 2. Esperar un poco
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 3. Recrear instancia
            const createResult = await evolutionService.createInstance(instance.instance_name);
            
            if (createResult) {
                // 4. Conectar instancia
                const connectResult = await evolutionService.connectInstance(instance.instance_name);
                return { 
                    success: !!connectResult, 
                    qrCode: connectResult
                };
            }
            
            return { success: false, error: 'Failed to recreate instance' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ================================
    // ACTUALIZACIÓN DE ESTADOS
    // ================================

    async markInstanceAsReconnected(instance) {
        try {
            await db.query(`
                UPDATE whatsapp_instances 
                SET status = 'connecting', 
                    last_seen = datetime('now'),
                    reconnection_attempts = COALESCE(reconnection_attempts, 0) + 1,
                    last_reconnection = datetime('now')
                WHERE instance_name = ?
            `, [instance.instance_name]);

            console.log(`📱 Instance ${instance.instance_name} marked as reconnecting`);
        } catch (error) {
            console.error('❌ Error updating instance status:', error);
        }
    }

    async markInstanceAsFailed(instance) {
        try {
            await db.query(`
                UPDATE whatsapp_instances 
                SET status = 'failed', 
                    last_seen = datetime('now'),
                    failure_reason = 'max_reconnection_attempts_exceeded'
                WHERE instance_name = ?
            `, [instance.instance_name]);

            console.log(`❌ Instance ${instance.instance_name} marked as failed`);
            
            // Emit evento de falla crítica
            this.emit('instance-failed', {
                instance: instance.instance_name,
                locationId: instance.location_id,
                reason: 'max_reconnection_attempts_exceeded'
            });
        } catch (error) {
            console.error('❌ Error marking instance as failed:', error);
        }
    }

    async updateHealthMetrics(healthyCount, totalCount) {
        try {
            const healthRate = totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0;
            
            // Insert metrics individually to avoid column count mismatch
            await db.query(`INSERT OR REPLACE INTO system_metrics (metric_name, metric_value, updated_at) VALUES ('healthy_instances', ?, datetime('now'))`, [healthyCount]);
            await db.query(`INSERT OR REPLACE INTO system_metrics (metric_name, metric_value, updated_at) VALUES ('total_instances', ?, datetime('now'))`, [totalCount]);
            await db.query(`INSERT OR REPLACE INTO system_metrics (metric_name, metric_value, updated_at) VALUES ('health_rate', ?, datetime('now'))`, [healthRate]);
            await db.query(`INSERT OR REPLACE INTO system_metrics (metric_name, metric_value, updated_at) VALUES ('last_health_check', ?, datetime('now'))`, [new Date().toISOString()]);

            this.lastHealthCheck = new Date();
        } catch (error) {
            console.error('❌ Error updating health metrics:', error);
        }
    }

    // ================================
    // HEALTH CHECK COMPLETO
    // ================================

    async fullHealthCheck() {
        try {
            console.log('🔍 Running full health check...');
            
            // Verificar servicio Evolution API
            const evolutionHealth = await evolutionService.healthCheck();
            
            // Verificar base de datos
            const dbHealth = await this.checkDatabaseHealth();
            
            // Verificar métricas del sistema
            const systemHealth = await this.checkSystemHealth();
            
            const overallHealth = {
                evolution: evolutionHealth,
                database: dbHealth,
                system: systemHealth,
                timestamp: new Date().toISOString()
            };

            console.log('🏥 Full health check results:', overallHealth);
            
            // Emit evento de health check
            this.emit('full-health-check', overallHealth);
            
            return overallHealth;
        } catch (error) {
            console.error('❌ Error in full health check:', error);
            return { error: error.message };
        }
    }

    async checkDatabaseHealth() {
        try {
            const [result] = await db.query('SELECT 1 as test');
            return { status: 'healthy', responsive: true };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    async checkSystemHealth() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            status: 'healthy'
        };
    }

    // ================================
    // UTILIDADES
    // ================================

    resetRetryCounters() {
        const countersCleared = this.reconnectionAttempts.size;
        this.reconnectionAttempts.clear();
        
        if (countersCleared > 0) {
            console.log(`🔄 Reset ${countersCleared} retry counters`);
        }
    }

    getServiceStats() {
        return {
            isRunning: this.isRunning,
            lastHealthCheck: this.lastHealthCheck,
            activeRetries: this.reconnectionAttempts.size,
            retryAttempts: Array.from(this.reconnectionAttempts.entries()),
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay
        };
    }

    stop() {
        this.isRunning = false;
        console.log('🛑 Auto-Reconnection Service stopped');
        this.emit('service-stopped');
    }
}

module.exports = new ReconnectionService();