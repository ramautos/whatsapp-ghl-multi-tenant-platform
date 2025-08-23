const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.connected = false;
  }

  async initialize() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.connected = true;
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection error:', error);
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  // Instance management
  async createInstance(instanceData) {
    const query = `
      INSERT INTO instances (name, evolution_instance_id, status, webhook_url, ghl_location_id, settings)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      instanceData.name,
      instanceData.evolution_instance_id,
      instanceData.status,
      instanceData.webhook_url,
      instanceData.ghl_location_id,
      instanceData.settings || {}
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getInstance(instanceName) {
    const query = 'SELECT * FROM instances WHERE name = $1';
    const result = await this.pool.query(query, [instanceName]);
    return result.rows[0];
  }

  async getAllInstances() {
    const query = 'SELECT * FROM instances ORDER BY created_at DESC';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async updateInstance(instanceName, updates) {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const query = `UPDATE instances SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE name = $1 RETURNING *`;
    const values = [instanceName, ...Object.values(updates)];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteInstance(instanceName) {
    const query = 'DELETE FROM instances WHERE name = $1';
    await this.pool.query(query, [instanceName]);
  }

  async updateInstanceStatus(instanceName, status) {
    const query = 'UPDATE instances SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE name = $1';
    await this.pool.query(query, [instanceName, status]);
  }

  // Contact mapping
  async createContactMapping(mappingData) {
    const query = `
      INSERT INTO contact_mappings (whatsapp_number, ghl_contact_id, instance_name, contact_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (whatsapp_number, instance_name) 
      DO UPDATE SET ghl_contact_id = $2, contact_name = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      mappingData.whatsappNumber,
      mappingData.ghlContactId,
      mappingData.instanceName,
      mappingData.contactName
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getContactMapping(ghlContactId) {
    const query = 'SELECT * FROM contact_mappings WHERE ghl_contact_id = $1';
    const result = await this.pool.query(query, [ghlContactId]);
    return result.rows[0];
  }

  async getContactByWhatsApp(whatsappNumber, instanceName) {
    const query = 'SELECT * FROM contact_mappings WHERE whatsapp_number = $1 AND instance_name = $2';
    const result = await this.pool.query(query, [whatsappNumber, instanceName]);
    return result.rows[0];
  }

  // Message storage
  async storeMessage(messageData) {
    const query = `
      INSERT INTO messages (
        instance_name, whatsapp_message_id, ghl_message_id, ghl_conversation_id,
        whatsapp_number, ghl_contact_id, message_text, direction, status,
        media_url, media_type, ai_analysis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      messageData.instanceName,
      messageData.whatsappMessageId,
      messageData.ghlMessageId,
      messageData.ghlConversationId,
      messageData.whatsappNumber,
      messageData.ghlContactId,
      messageData.message,
      messageData.direction,
      messageData.status || 'pending',
      messageData.mediaUrl,
      messageData.mediaType,
      messageData.analysis || null
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateMessageStatus(messageId, status) {
    const query = 'UPDATE messages SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE whatsapp_message_id = $1';
    await this.pool.query(query, [messageId, status]);
  }

  async getRecentMessages(limit = 50) {
    const query = `
      SELECT m.*, cm.contact_name 
      FROM messages m
      LEFT JOIN contact_mappings cm ON m.whatsapp_number = cm.whatsapp_number AND m.instance_name = cm.instance_name
      ORDER BY m.created_at DESC 
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  // Conversation management
  async createOrUpdateConversation(conversationData) {
    const query = `
      INSERT INTO conversations (
        instance_name, whatsapp_number, ghl_conversation_id, ghl_contact_id,
        status, last_message_at, message_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (whatsapp_number, instance_name)
      DO UPDATE SET 
        ghl_conversation_id = $3,
        last_message_at = $6,
        message_count = conversations.message_count + 1,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      conversationData.instanceName,
      conversationData.whatsappNumber,
      conversationData.ghlConversationId,
      conversationData.ghlContactId,
      conversationData.status || 'active',
      new Date(),
      1
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateConversationStatus(conversationId, updates) {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const query = `UPDATE conversations SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ghl_conversation_id = $1`;
    const values = [conversationId, ...Object.values(updates)];
    
    await this.pool.query(query, values);
  }

  // Analytics
  async getMessageStats(instanceName = null, days = 7) {
    let query = `
      SELECT 
        DATE(created_at) as date,
        direction,
        COUNT(*) as count
      FROM messages 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    let values = [];
    
    if (instanceName) {
      query += ' AND instance_name = $1';
      values.push(instanceName);
    }
    
    query += ' GROUP BY DATE(created_at), direction ORDER BY date DESC';
    
    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getSentimentStats(instanceName = null, days = 7) {
    let query = `
      SELECT 
        ai_analysis->>'sentiment' as sentiment,
        COUNT(*) as count
      FROM messages 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND ai_analysis IS NOT NULL
        AND direction = 'inbound'
    `;
    let values = [];
    
    if (instanceName) {
      query += ' AND instance_name = $1';
      values.push(instanceName);
    }
    
    query += ' GROUP BY ai_analysis->\'sentiment\'';
    
    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getDashboardStats() {
    const queries = [
      // Messages today
      `SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = CURRENT_DATE`,
      // Active contacts (contacts with messages in last 24h)
      `SELECT COUNT(DISTINCT whatsapp_number) as count FROM messages WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'`,
      // AI responses today
      `SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = CURRENT_DATE AND direction = 'outbound' AND ai_analysis IS NOT NULL`,
      // Total synced messages
      `SELECT COUNT(*) as count FROM messages WHERE ghl_message_id IS NOT NULL`
    ];

    const results = await Promise.all(
      queries.map(query => this.pool.query(query))
    );

    return {
      messagesToday: parseInt(results[0].rows[0].count),
      activeContacts: parseInt(results[1].rows[0].count),
      aiResponses: parseInt(results[2].rows[0].count),
      syncedMessages: parseInt(results[3].rows[0].count)
    };
  }

  // Webhook logging
  async logWebhook(source, eventType, payload, status = 'pending') {
    const query = `
      INSERT INTO webhook_logs (source, event_type, payload, processing_status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [source, eventType, payload, status];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateWebhookLog(logId, status, errorMessage = null) {
    const query = `
      UPDATE webhook_logs 
      SET processing_status = $2, error_message = $3, processed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.pool.query(query, [logId, status, errorMessage]);
  }

  // AI interactions
  async logAIInteraction(messageId, interactionType, input, output, confidence, processingTime, model) {
    const query = `
      INSERT INTO ai_interactions (
        message_id, interaction_type, input_text, output_text, 
        confidence_score, processing_time_ms, model_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [messageId, interactionType, input, output, confidence, processingTime, model];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Automation rules
  async getAutomationRules(instanceName) {
    const query = `
      SELECT * FROM automation_rules 
      WHERE (instance_name = $1 OR instance_name = 'default') 
        AND is_active = true 
      ORDER BY priority DESC
    `;
    const result = await this.pool.query(query, [instanceName]);
    return result.rows;
  }

  async executeAutomationRule(ruleId) {
    const query = `
      UPDATE automation_rules 
      SET execution_count = execution_count + 1, last_executed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.pool.query(query, [ruleId]);
  }

  // Close pool
  async close() {
    await this.pool.end();
  }
}

module.exports = new DatabaseService();