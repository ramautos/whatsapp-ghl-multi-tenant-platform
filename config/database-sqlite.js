// 🎯 ADAPTADOR SQLITE PARA DESARROLLO RÁPIDO

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteDatabaseService {
    constructor() {
        // Ensure database directory exists
        const fs = require('fs');
        const dbDir = path.join(__dirname, '..', 'database');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            console.log('📁 Created database directory');
        }
        
        const dbPath = path.join(dbDir, 'whatsapp_ghl_platform.db');
        this.db = new sqlite3.Database(dbPath);
        this.connected = false;
        this.initializeSchema();
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT 1 as test', (err) => {
                if (err) {
                    console.error('Database connection error:', err);
                    this.connected = false;
                    reject(err);
                } else {
                    this.connected = true;
                    console.log('✅ SQLite Database connected successfully');
                    resolve();
                }
            });
        });
    }

    initializeSchema() {
        // Crear tablas básicas para multi-tenant
        const schemas = [
            // Instalaciones GHL
            `CREATE TABLE IF NOT EXISTS ghl_installations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT UNIQUE NOT NULL,
                company_name TEXT,
                access_token TEXT,
                refresh_token TEXT,
                scopes TEXT,
                webhook_url TEXT,
                installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )`,

            // Clientes registrados
            `CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                plan_type TEXT DEFAULT 'basic',
                max_instances INTEGER DEFAULT 5,
                registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (location_id) REFERENCES ghl_installations(location_id)
            )`,

            // Instancias WhatsApp
            `CREATE TABLE IF NOT EXISTS whatsapp_instances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT NOT NULL,
                instance_name TEXT UNIQUE NOT NULL,
                position INTEGER NOT NULL,
                phone_number TEXT,
                status TEXT DEFAULT 'inactive',
                qr_code TEXT,
                evolution_instance_id TEXT,
                webhook_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                connected_at DATETIME,
                disconnected_at DATETIME,
                last_activity DATETIME,
                last_seen DATETIME,
                reconnection_attempts INTEGER DEFAULT 0,
                last_reconnection DATETIME,
                failure_reason TEXT,
                FOREIGN KEY (location_id) REFERENCES clients(location_id),
                UNIQUE(location_id, position)
            )`,

            // Logs de mensajes
            `CREATE TABLE IF NOT EXISTS message_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT NOT NULL,
                instance_name TEXT NOT NULL,
                message_id TEXT UNIQUE,
                from_number TEXT,
                to_number TEXT,
                message_type TEXT,
                message_content TEXT,
                direction TEXT,
                ghl_contact_id TEXT,
                ghl_conversation_id TEXT,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'received',
                error_message TEXT,
                FOREIGN KEY (location_id) REFERENCES clients(location_id)
            )`,

            // Configuraciones por cliente
            `CREATE TABLE IF NOT EXISTS client_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT UNIQUE NOT NULL,
                webhook_enabled BOOLEAN DEFAULT 1,
                language TEXT DEFAULT 'es',
                welcome_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (location_id) REFERENCES clients(location_id)
            )`,

            // Estadísticas por cliente
            `CREATE TABLE IF NOT EXISTS client_statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT NOT NULL,
                date DATE NOT NULL,
                messages_received INTEGER DEFAULT 0,
                messages_sent INTEGER DEFAULT 0,
                contacts_created INTEGER DEFAULT 0,
                failed_messages INTEGER DEFAULT 0,
                FOREIGN KEY (location_id) REFERENCES clients(location_id),
                UNIQUE(location_id, date)
            )`
        ];

        schemas.forEach(schema => {
            this.db.run(schema, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                }
            });
        });

        // Ejecutar migraciones para columnas faltantes
        this.runMigrations();
        
        // Crear índices para performance
        this.createIndexes();
    }

    runMigrations() {
        // Migraciones para columnas faltantes
        const migrations = [
            // Agregar columnas faltantes a whatsapp_instances
            'ALTER TABLE whatsapp_instances ADD COLUMN last_seen DATETIME',
            'ALTER TABLE whatsapp_instances ADD COLUMN reconnection_attempts INTEGER DEFAULT 0',
            'ALTER TABLE whatsapp_instances ADD COLUMN last_reconnection DATETIME',
            'ALTER TABLE whatsapp_instances ADD COLUMN failure_reason TEXT',
            
            // Agregar columnas faltantes a message_logs
            'ALTER TABLE message_logs ADD COLUMN from_name TEXT',
            'ALTER TABLE message_logs ADD COLUMN content TEXT',
            'ALTER TABLE message_logs ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP',
            
            // Crear tabla system_metrics si no existe
            `CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT UNIQUE NOT NULL,
                metric_value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Crear tabla webhook_logs si no existe
            `CREATE TABLE IF NOT EXISTS webhook_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT,
                instance_name TEXT,
                event_type TEXT,
                payload TEXT,
                processed BOOLEAN DEFAULT 0,
                error_message TEXT,
                target_system TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Agregar columnas para información de WhatsApp conectado
            `ALTER TABLE whatsapp_instances ADD COLUMN whatsapp_number TEXT`,
            `ALTER TABLE whatsapp_instances ADD COLUMN display_name TEXT`
        ];

        migrations.forEach(migration => {
            this.db.run(migration, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    // Ignorar errores de columnas duplicadas
                    console.log('Migration note:', err.message);
                }
            });
        });
    }

    createIndexes() {
        console.log('🔍 Creating database indexes for performance optimization...');
        
        const indexes = [
            // Indexes for ghl_installations table
            'CREATE INDEX IF NOT EXISTS idx_ghl_location_id ON ghl_installations(location_id)',
            'CREATE INDEX IF NOT EXISTS idx_ghl_status ON ghl_installations(status)',
            'CREATE INDEX IF NOT EXISTS idx_ghl_installed_at ON ghl_installations(installed_at)',
            
            // Indexes for clients table
            'CREATE INDEX IF NOT EXISTS idx_clients_location_id ON clients(location_id)',
            'CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email)',
            'CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active)',
            'CREATE INDEX IF NOT EXISTS idx_clients_registered_at ON clients(registered_at)',
            'CREATE INDEX IF NOT EXISTS idx_clients_last_login ON clients(last_login)',
            
            // Indexes for whatsapp_instances table
            'CREATE INDEX IF NOT EXISTS idx_instances_location_id ON whatsapp_instances(location_id)',
            'CREATE INDEX IF NOT EXISTS idx_instances_status ON whatsapp_instances(status)',
            'CREATE INDEX IF NOT EXISTS idx_instances_position ON whatsapp_instances(position)',
            'CREATE INDEX IF NOT EXISTS idx_instances_created_at ON whatsapp_instances(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_instances_last_activity ON whatsapp_instances(last_activity)',
            'CREATE INDEX IF NOT EXISTS idx_instances_last_seen ON whatsapp_instances(last_seen)',
            'CREATE INDEX IF NOT EXISTS idx_instances_connected_at ON whatsapp_instances(connected_at)',
            'CREATE INDEX IF NOT EXISTS idx_instances_location_position ON whatsapp_instances(location_id, position)',
            'CREATE INDEX IF NOT EXISTS idx_instances_status_location ON whatsapp_instances(status, location_id)',
            
            // Indexes for message_logs table
            'CREATE INDEX IF NOT EXISTS idx_messages_location_id ON message_logs(location_id)',
            'CREATE INDEX IF NOT EXISTS idx_messages_instance_name ON message_logs(instance_name)',
            'CREATE INDEX IF NOT EXISTS idx_messages_processed_at ON message_logs(processed_at)',
            'CREATE INDEX IF NOT EXISTS idx_messages_direction ON message_logs(direction)',
            'CREATE INDEX IF NOT EXISTS idx_messages_status ON message_logs(status)',
            'CREATE INDEX IF NOT EXISTS idx_messages_from_number ON message_logs(from_number)',
            'CREATE INDEX IF NOT EXISTS idx_messages_location_processed ON message_logs(location_id, processed_at)',
            
            // Indexes for client_statistics table
            'CREATE INDEX IF NOT EXISTS idx_stats_location_id ON client_statistics(location_id)',
            'CREATE INDEX IF NOT EXISTS idx_stats_date ON client_statistics(date)',
            'CREATE INDEX IF NOT EXISTS idx_stats_location_date ON client_statistics(location_id, date)',
            
            // Indexes for client_settings table
            'CREATE INDEX IF NOT EXISTS idx_settings_location_id ON client_settings(location_id)',
            'CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON client_settings(updated_at)',
            
            // Indexes for system_metrics table
            'CREATE INDEX IF NOT EXISTS idx_metrics_name ON system_metrics(metric_name)',
            'CREATE INDEX IF NOT EXISTS idx_metrics_updated_at ON system_metrics(updated_at)',
            
            // Indexes for webhook_logs table
            'CREATE INDEX IF NOT EXISTS idx_webhook_location_id ON webhook_logs(location_id)',
            'CREATE INDEX IF NOT EXISTS idx_webhook_created_at ON webhook_logs(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_webhook_processed ON webhook_logs(processed)',
            'CREATE INDEX IF NOT EXISTS idx_webhook_event_type ON webhook_logs(event_type)',
            'CREATE INDEX IF NOT EXISTS idx_webhook_instance_name ON webhook_logs(instance_name)'
        ];

        let indexesCreated = 0;
        indexes.forEach((indexSql, i) => {
            this.db.run(indexSql, (err) => {
                if (err && !err.message.includes('already exists')) {
                    console.error('Error creating index:', err.message);
                } else {
                    indexesCreated++;
                    
                    // Log completion when all indexes are processed
                    if (i === indexes.length - 1) {
                        console.log(`✅ Database indexes created/verified: ${indexesCreated}/${indexes.length}`);
                    }
                }
            });
        });
    }

    // Wrapper para promisificar queries
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve([rows]); // Emular formato PostgreSQL
                }
            });
        });
    }

    // Wrapper para INSERT/UPDATE
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    isConnected() {
        return this.connected;
    }

    // Métodos específicos para multi-tenant

    // Registrar instalación GHL
    async registerGHLInstallation(data) {
        const { locationId, companyName, accessToken, refreshToken, scopes } = data;
        
        const sql = `
            INSERT OR REPLACE INTO ghl_installations 
            (location_id, company_name, access_token, refresh_token, scopes, updated_at) 
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        await this.run(sql, [locationId, companyName, accessToken, refreshToken, JSON.stringify(scopes)]);
        return { success: true, locationId };
    }

    // Registrar cliente
    async registerClient(locationId, clientData) {
        const { name, email, phone } = clientData;
        
        // Verificar instalación GHL existe
        const installation = await this.query(
            'SELECT * FROM ghl_installations WHERE location_id = ?',
            [locationId]
        );

        if (!installation[0].length) {
            throw new Error('GHL installation not found');
        }

        // Crear cliente
        await this.run(
            'INSERT INTO clients (location_id, name, email, phone) VALUES (?, ?, ?, ?)',
            [locationId, name, email, phone]
        );

        // Crear configuración por defecto
        await this.run(
            'INSERT INTO client_settings (location_id) VALUES (?)',
            [locationId]
        );

        // Crear 1 instancia principal con location_id como nombre
        await this.run(
            'INSERT INTO whatsapp_instances (location_id, instance_name, position, status) VALUES (?, ?, ?, ?)',
            [locationId, locationId, 1, 'inactive']
        );

        return { success: true, locationId };
    }

    // Obtener instancias de cliente
    async getClientInstances(locationId) {
        const instances = await this.query(
            'SELECT * FROM whatsapp_instances WHERE location_id = ? ORDER BY position',
            [locationId]
        );
        return instances[0];
    }

    // Login cliente
    async loginClient(locationId) {
        const client = await this.query(`
            SELECT c.*, g.company_name 
            FROM clients c 
            JOIN ghl_installations g ON c.location_id = g.location_id
            WHERE c.location_id = ? AND c.is_active = 1
        `, [locationId]);

        if (!client[0].length) {
            throw new Error('Client not found');
        }

        // Actualizar último login
        await this.run(
            'UPDATE clients SET last_login = datetime("now") WHERE location_id = ?',
            [locationId]
        );

        return client[0][0];
    }

    // Activar instancia
    async activateInstance(locationId, position, webhookUrl, qrCode) {
        await this.run(`
            UPDATE whatsapp_instances 
            SET status = 'qr_pending', 
                qr_code = ?, 
                webhook_url = ?
            WHERE location_id = ? AND position = ?
        `, [qrCode, webhookUrl, locationId, position]);

        return { success: true };
    }

    // Desconectar instancia
    async disconnectInstance(locationId, position) {
        await this.run(`
            UPDATE whatsapp_instances 
            SET status = 'inactive', 
                phone_number = NULL,
                qr_code = NULL,
                disconnected_at = CURRENT_TIMESTAMP
            WHERE location_id = ? AND position = ?
        `, [locationId, position]);

        return { success: true };
    }

    // Actualizar estado conexión
    async updateInstanceStatus(locationId, position, status, phoneNumber = null) {
        let sql = `
            UPDATE whatsapp_instances 
            SET status = ?, last_activity = CURRENT_TIMESTAMP
        `;
        let params = [status];

        if (status === 'connected' && phoneNumber) {
            sql += `, phone_number = ?, connected_at = CURRENT_TIMESTAMP`;
            params.push(phoneNumber);
        }

        if (status === 'disconnected') {
            sql += `, disconnected_at = CURRENT_TIMESTAMP`;
        }

        sql += ' WHERE location_id = ? AND position = ?';
        params.push(locationId, position);

        await this.run(sql, params);
    }

    // Log mensaje
    async logMessage(locationId, instanceName, messageData) {
        const {
            messageId,
            fromNumber,
            messageContent,
            direction,
            ghlContactId,
            ghlConversationId
        } = messageData;

        await this.run(`
            INSERT INTO message_logs 
            (location_id, instance_name, message_id, from_number, message_content, 
             direction, ghl_contact_id, ghl_conversation_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'processed')
        `, [locationId, instanceName, messageId, fromNumber, messageContent, 
            direction, ghlContactId, ghlConversationId]);
    }

    // Estadísticas del día
    async getTodayStatistics(locationId) {
        const today = new Date().toISOString().split('T')[0];
        
        const stats = await this.query(`
            SELECT * FROM client_statistics 
            WHERE location_id = ? AND date = ?
        `, [locationId, today]);

        if (stats[0].length) {
            return stats[0][0];
        }

        // Crear registro del día si no existe
        await this.run(`
            INSERT INTO client_statistics (location_id, date) VALUES (?, ?)
        `, [locationId, today]);

        return {
            messages_received: 0,
            messages_sent: 0,
            contacts_created: 0,
            ai_responses: 0
        };
    }

    // Incrementar estadística
    async incrementStatistic(locationId, metric, value = 1) {
        const today = new Date().toISOString().split('T')[0];
        
        await this.run(`
            INSERT OR IGNORE INTO client_statistics (location_id, date) VALUES (?, ?)
        `, [locationId, today]);

        await this.run(`
            UPDATE client_statistics 
            SET ${metric} = ${metric} + ? 
            WHERE location_id = ? AND date = ?
        `, [value, locationId, today]);
    }

    async close() {
        return new Promise((resolve) => {
            this.db.close(resolve);
        });
    }
}

module.exports = new SQLiteDatabaseService();