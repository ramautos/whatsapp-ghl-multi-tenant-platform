-- 🚀 SCHEMA V2 - SISTEMA WHATSAPP-GHL MULTI-TENANT
-- Base de datos simplificada y funcional

-- Eliminar tablas existentes si existen
DROP TABLE IF EXISTS webhook_logs;
DROP TABLE IF EXISTS message_logs;
DROP TABLE IF EXISTS whatsapp_instances;
DROP TABLE IF EXISTS users_accounts;

-- ================================
-- TABLA DE USUARIOS/CLIENTES
-- ================================
CREATE TABLE users_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    plan VARCHAR(50) DEFAULT 'basic',
    max_instances INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- TABLA DE INSTANCIAS WHATSAPP
-- ================================
CREATE TABLE whatsapp_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    location_id VARCHAR(255) NOT NULL,
    instance_number INTEGER NOT NULL,
    evolution_instance_name VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50),
    display_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'created',
    qr_code TEXT,
    webhook_url TEXT,
    connected_at TIMESTAMP,
    disconnected_at TIMESTAMP,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_accounts(id) ON DELETE CASCADE,
    UNIQUE(location_id, instance_number)
);

-- ================================
-- TABLA DE LOGS DE WEBHOOKS
-- ================================
CREATE TABLE webhook_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER,
    event_type VARCHAR(100),
    payload TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES whatsapp_instances(id) ON DELETE CASCADE
);

-- ================================
-- TABLA DE LOGS DE MENSAJES
-- ================================
CREATE TABLE message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER,
    message_id VARCHAR(255),
    from_number VARCHAR(50),
    to_number VARCHAR(50),
    message_type VARCHAR(50),
    content TEXT,
    direction VARCHAR(20),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES whatsapp_instances(id) ON DELETE CASCADE
);

-- ================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================
CREATE INDEX idx_users_location ON users_accounts(location_id);
CREATE INDEX idx_users_status ON users_accounts(status);
CREATE INDEX idx_instances_user ON whatsapp_instances(user_id);
CREATE INDEX idx_instances_location ON whatsapp_instances(location_id);
CREATE INDEX idx_instances_status ON whatsapp_instances(status);
CREATE INDEX idx_webhooks_instance ON webhook_logs(instance_id);
CREATE INDEX idx_messages_instance ON message_logs(instance_id);

-- ================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ================================
-- INSERT INTO users_accounts (location_id, company_name, email) 
-- VALUES ('TEST_LOCATION_123', 'Test Company', 'test@example.com');