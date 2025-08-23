-- Evolution-GHL Integration Database Schema

-- Create database (if using docker-compose, this will be created automatically)
-- CREATE DATABASE evolution_ghl;

-- Connect to the database
\c evolution_ghl;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create instances table
CREATE TABLE instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    evolution_instance_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'created',
    qr_code TEXT,
    phone_number VARCHAR(20),
    webhook_url TEXT,
    ghl_location_id VARCHAR(100),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contacts mapping table
CREATE TABLE contact_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whatsapp_number VARCHAR(20) NOT NULL,
    ghl_contact_id VARCHAR(100) NOT NULL,
    instance_name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(200),
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_name) REFERENCES instances(name) ON DELETE CASCADE,
    UNIQUE(whatsapp_number, instance_name)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_name VARCHAR(100) NOT NULL,
    whatsapp_message_id VARCHAR(100),
    ghl_message_id VARCHAR(100),
    ghl_conversation_id VARCHAR(100),
    whatsapp_number VARCHAR(20) NOT NULL,
    ghl_contact_id VARCHAR(100) NOT NULL,
    message_text TEXT,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(50) DEFAULT 'pending',
    media_url TEXT,
    media_type VARCHAR(50),
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_name) REFERENCES instances(name) ON DELETE CASCADE
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_name VARCHAR(100) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL,
    ghl_conversation_id VARCHAR(100) NOT NULL,
    ghl_contact_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    last_message_at TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,
    ai_summary TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_name) REFERENCES instances(name) ON DELETE CASCADE,
    UNIQUE(whatsapp_number, instance_name)
);

-- Create webhooks log table
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    processing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Create ai_interactions table
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    input_text TEXT,
    output_text TEXT,
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    model_used VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create automation_rules table
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_name VARCHAR(100) NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_name) REFERENCES instances(name) ON DELETE CASCADE
);

-- Create analytics table
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2),
    dimensions JSONB,
    date_recorded DATE DEFAULT CURRENT_DATE,
    hour_recorded INTEGER DEFAULT EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_name) REFERENCES instances(name) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_messages_instance_number ON messages(instance_name, whatsapp_number);
CREATE INDEX idx_messages_direction_status ON messages(direction, status);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_conversations_instance ON conversations(instance_name);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX idx_contact_mappings_whatsapp ON contact_mappings(whatsapp_number);
CREATE INDEX idx_contact_mappings_ghl ON contact_mappings(ghl_contact_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX idx_analytics_instance_date ON analytics(instance_name, date_recorded);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_mappings_updated_at BEFORE UPDATE ON contact_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default automation rules
INSERT INTO automation_rules (instance_name, rule_name, conditions, actions) VALUES
('default', 'Auto-greet new contacts', 
 '{"message_count": 1, "direction": "inbound"}',
 '{"send_message": "¡Hola! Gracias por contactarnos. En breve te atenderemos.", "add_tag": "nuevo_contacto"}'),
('default', 'High urgency escalation',
 '{"ai_urgency": "high"}',
 '{"add_to_workflow": "high_urgency_workflow", "create_task": "Contacto de alta prioridad"}'),
('default', 'After hours auto-response',
 '{"outside_business_hours": true, "direction": "inbound"}',
 '{"send_message": "Gracias por tu mensaje. Nuestro horario de atención es de 9:00 AM a 6:00 PM. Te responderemos pronto."}'
);

-- Create views for reporting
CREATE VIEW message_stats AS
SELECT 
    instance_name,
    DATE(created_at) as date,
    direction,
    COUNT(*) as message_count,
    COUNT(DISTINCT whatsapp_number) as unique_contacts
FROM messages
GROUP BY instance_name, DATE(created_at), direction;

CREATE VIEW daily_analytics AS
SELECT 
    c.instance_name,
    DATE(m.created_at) as date,
    COUNT(DISTINCT c.whatsapp_number) as total_contacts,
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.direction = 'inbound' THEN 1 END) as inbound_messages,
    COUNT(CASE WHEN m.direction = 'outbound' THEN 1 END) as outbound_messages,
    AVG(CASE WHEN m.ai_analysis->>'sentiment' = 'positive' THEN 1 
             WHEN m.ai_analysis->>'sentiment' = 'negative' THEN -1 
             ELSE 0 END) as avg_sentiment
FROM conversations c
LEFT JOIN messages m ON c.whatsapp_number = m.whatsapp_number AND c.instance_name = m.instance_name
GROUP BY c.instance_name, DATE(m.created_at);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO evolution_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO evolution_user;