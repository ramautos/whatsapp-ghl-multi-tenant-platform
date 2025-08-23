const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get recent messages
router.get('/messages', async (req, res) => {
  try {
    const { limit = 50, instance } = req.query;
    
    let messages;
    if (instance) {
      const query = `
        SELECT m.*, cm.contact_name 
        FROM messages m
        LEFT JOIN contact_mappings cm ON m.whatsapp_number = cm.whatsapp_number AND m.instance_name = cm.instance_name
        WHERE m.instance_name = $1
        ORDER BY m.created_at DESC 
        LIMIT $2
      `;
      const result = await db.pool.query(query, [instance, parseInt(limit)]);
      messages = result.rows;
    } else {
      messages = await db.getRecentMessages(parseInt(limit));
    }
    
    res.json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { instance, days = 7 } = req.query;
    
    // Get message statistics
    const messageStats = await db.getMessageStats(instance, parseInt(days));
    
    // Get sentiment statistics
    const sentimentStats = await db.getSentimentStats(instance, parseInt(days));
    
    // Process data for charts
    const messageCounts = {};
    const dates = [];
    
    // Generate date range
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      messageCounts[dateStr] = { inbound: 0, outbound: 0 };
    }
    
    // Fill in actual data
    messageStats.forEach(stat => {
      const dateStr = stat.date.toISOString().split('T')[0];
      if (messageCounts[dateStr]) {
        messageCounts[dateStr][stat.direction] = parseInt(stat.count);
      }
    });
    
    // Prepare chart data
    const messagesChartData = {
      labels: dates.map(date => new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
      data: dates.map(date => messageCounts[date].inbound + messageCounts[date].outbound)
    };
    
    // Process sentiment data
    const sentimentData = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    sentimentStats.forEach(stat => {
      if (stat.sentiment && sentimentData.hasOwnProperty(stat.sentiment)) {
        sentimentData[stat.sentiment] = parseInt(stat.count);
      }
    });
    
    res.json({
      success: true,
      analytics: {
        messages: messagesChartData,
        sentiment: sentimentData,
        messageStats: messageStats,
        sentimentStats: sentimentStats
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save settings
router.post('/settings', async (req, res) => {
  try {
    const { autoResponses, aiModel, language, instanceName } = req.body;
    
    if (instanceName) {
      // Save instance-specific settings
      await db.updateInstance(instanceName, {
        settings: {
          autoResponses,
          aiModel,
          language
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Settings saved successfully'
    });

  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get conversation history
router.get('/conversations/:whatsappNumber', async (req, res) => {
  try {
    const { whatsappNumber } = req.params;
    const { instanceName, limit = 100 } = req.query;
    
    const query = `
      SELECT * FROM messages 
      WHERE whatsapp_number = $1 AND instance_name = $2
      ORDER BY created_at ASC 
      LIMIT $3
    `;
    const result = await db.pool.query(query, [whatsappNumber, instanceName, parseInt(limit)]);
    
    res.json({
      success: true,
      messages: result.rows
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active conversations
router.get('/conversations', async (req, res) => {
  try {
    const { instanceName } = req.query;
    
    let query = `
      SELECT 
        c.*,
        cm.contact_name,
        (SELECT COUNT(*) FROM messages m WHERE m.whatsapp_number = c.whatsapp_number AND m.instance_name = c.instance_name) as total_messages,
        (SELECT message_text FROM messages m WHERE m.whatsapp_number = c.whatsapp_number AND m.instance_name = c.instance_name ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations c
      LEFT JOIN contact_mappings cm ON c.whatsapp_number = cm.whatsapp_number AND c.instance_name = cm.instance_name
    `;
    
    let values = [];
    
    if (instanceName) {
      query += ' WHERE c.instance_name = $1';
      values.push(instanceName);
    }
    
    query += ' ORDER BY c.last_message_at DESC';
    
    const result = await db.pool.query(query, values);
    
    res.json({
      success: true,
      conversations: result.rows
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get automation rules
router.get('/automation-rules', async (req, res) => {
  try {
    const { instanceName = 'default' } = req.query;
    
    const rules = await db.getAutomationRules(instanceName);
    
    res.json({
      success: true,
      rules: rules
    });

  } catch (error) {
    console.error('Get automation rules error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create automation rule
router.post('/automation-rules', async (req, res) => {
  try {
    const { instanceName, ruleName, conditions, actions, priority = 0 } = req.body;
    
    const query = `
      INSERT INTO automation_rules (instance_name, rule_name, conditions, actions, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [instanceName, ruleName, JSON.stringify(conditions), JSON.stringify(actions), priority];
    
    const result = await db.pool.query(query, values);
    
    res.json({
      success: true,
      rule: result.rows[0]
    });

  } catch (error) {
    console.error('Create automation rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update automation rule
router.put('/automation-rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { ruleName, conditions, actions, isActive, priority } = req.body;
    
    const updates = {};
    if (ruleName !== undefined) updates.rule_name = ruleName;
    if (conditions !== undefined) updates.conditions = JSON.stringify(conditions);
    if (actions !== undefined) updates.actions = JSON.stringify(actions);
    if (isActive !== undefined) updates.is_active = isActive;
    if (priority !== undefined) updates.priority = priority;
    
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const query = `UPDATE automation_rules SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    const values = [ruleId, ...Object.values(updates)];
    
    const result = await db.pool.query(query, values);
    
    res.json({
      success: true,
      rule: result.rows[0]
    });

  } catch (error) {
    console.error('Update automation rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete automation rule
router.delete('/automation-rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    
    const query = 'DELETE FROM automation_rules WHERE id = $1';
    await db.pool.query(query, [ruleId]);
    
    res.json({
      success: true,
      message: 'Automation rule deleted successfully'
    });

  } catch (error) {
    console.error('Delete automation rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system health
router.get('/health', async (req, res) => {
  try {
    const health = {
      database: db.isConnected(),
      redis: require('../config/redis').isConnected(),
      evolution: require('../services/evolutionService').isConnected(),
      ghl: require('../services/ghlService').isConnected(),
      timestamp: new Date().toISOString()
    };
    
    const allHealthy = Object.values(health).every(status => 
      typeof status === 'boolean' ? status : true
    );
    
    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      health: health
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;