-- 🎯 SCHEMA MULTI-TENANT PARA PLATAFORMA WHATSAPP-GHL
-- Diseñado para soportar múltiples clientes con location_id único

-- Tabla de instalaciones GHL (cuando instalan tu app)
CREATE TABLE ghl_installations (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    scopes TEXT,
    webhook_url VARCHAR(500),
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    INDEX idx_location_id (location_id),
    INDEX idx_status (status)
);

-- Tabla de clientes (registro en tu plataforma)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    plan_type VARCHAR(50) DEFAULT 'basic', -- basic (5 slots), premium (10 slots)
    max_instances INT DEFAULT 5,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (location_id) REFERENCES ghl_installations(location_id),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- Tabla de instancias WhatsApp
CREATE TABLE whatsapp_instances (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255) NOT NULL,
    instance_name VARCHAR(255) UNIQUE NOT NULL, -- formato: {location_id}_wa_{position}
    position INT NOT NULL, -- 1, 2, 3, 4, 5
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'inactive', -- inactive, qr_pending, connected, disconnected
    qr_code TEXT,
    evolution_instance_id VARCHAR(255),
    webhook_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    connected_at TIMESTAMP,
    disconnected_at TIMESTAMP,
    last_activity TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES clients(location_id),
    UNIQUE KEY unique_location_position (location_id, position),
    INDEX idx_location_instances (location_id),
    INDEX idx_status (status)
);

-- Tabla de mensajes procesados (logs)
CREATE TABLE message_logs (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255) NOT NULL,
    instance_name VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) UNIQUE,
    from_number VARCHAR(50),
    to_number VARCHAR(50),
    message_type VARCHAR(50), -- text, image, audio, video, document
    message_content TEXT,
    direction VARCHAR(20), -- inbound, outbound
    ghl_contact_id VARCHAR(255),
    ghl_conversation_id VARCHAR(255),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50), -- received, processed, sent_to_ghl, failed
    error_message TEXT,
    FOREIGN KEY (location_id) REFERENCES clients(location_id),
    INDEX idx_location_messages (location_id),
    INDEX idx_message_id (message_id),
    INDEX idx_processed_at (processed_at)
);

-- Tabla de webhooks recibidos (para debugging)
CREATE TABLE webhook_logs (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255),
    instance_name VARCHAR(255),
    event_type VARCHAR(100),
    payload JSON,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_processed (processed)
);

-- Tabla de configuraciones por cliente
CREATE TABLE client_settings (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255) UNIQUE NOT NULL,
    auto_response_enabled BOOLEAN DEFAULT false,
    ai_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    language VARCHAR(10) DEFAULT 'es',
    business_hours JSON,
    welcome_message TEXT,
    custom_prompt TEXT,
    tags_to_apply JSON,
    workflow_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES clients(location_id)
);

-- Tabla de estadísticas
CREATE TABLE client_statistics (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    messages_received INT DEFAULT 0,
    messages_sent INT DEFAULT 0,
    contacts_created INT DEFAULT 0,
    ai_responses INT DEFAULT 0,
    failed_messages INT DEFAULT 0,
    FOREIGN KEY (location_id) REFERENCES clients(location_id),
    UNIQUE KEY unique_location_date (location_id, date),
    INDEX idx_date (date)
);

-- Tabla de planes y facturación (para futuro)
CREATE TABLE billing (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50),
    amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    period_start DATE,
    period_end DATE,
    status VARCHAR(50), -- pending, paid, failed, cancelled
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES clients(location_id),
    INDEX idx_status (status),
    INDEX idx_period (period_start, period_end)
);

-- Vistas útiles
CREATE VIEW active_instances AS
SELECT 
    c.location_id,
    c.name as client_name,
    c.email as client_email,
    wi.instance_name,
    wi.position,
    wi.phone_number,
    wi.status,
    wi.connected_at,
    wi.last_activity
FROM clients c
JOIN whatsapp_instances wi ON c.location_id = wi.location_id
WHERE c.is_active = true AND wi.status = 'connected';

CREATE VIEW daily_statistics AS
SELECT 
    cs.location_id,
    c.name as client_name,
    cs.date,
    cs.messages_received,
    cs.messages_sent,
    cs.contacts_created,
    cs.ai_responses
FROM client_statistics cs
JOIN clients c ON cs.location_id = c.location_id
WHERE cs.date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
ORDER BY cs.date DESC;

-- Triggers para updated_at
DELIMITER $$
CREATE TRIGGER update_ghl_installations_updated_at 
BEFORE UPDATE ON ghl_installations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER update_client_settings_updated_at 
BEFORE UPDATE ON client_settings
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;