const express = require('express');
const router = express.Router();
const evolutionService = require('../services/evolutionService');
const db = require('../config/database');

// Get QR code for instance
router.get('/instance/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    // Check if instance exists
    let instance = await db.getInstance(instanceName);
    
    if (!instance) {
      // Create new instance
      const created = await evolutionService.createInstance(instanceName, {
        webhook_by_events: true,
        webhook_url: `${process.env.APP_URL}/api/webhooks/evolution`,
        webhook_base64: false,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED', 
          'MESSAGES_SET',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE'
        ]
      });
      
      // Store in database
      instance = await db.createInstance({
        name: instanceName,
        evolution_instance_id: created.instance.instanceId,
        status: 'created',
        webhook_url: `${process.env.APP_URL}/api/webhooks/evolution`,
        ghl_location_id: process.env.GHL_LOCATION_ID
      });
    }

    // Get connection status
    const status = await evolutionService.getInstanceStatus(instanceName);
    
    if (status.state === 'open') {
      return res.json({
        success: true,
        connected: true,
        status: status.state,
        phoneNumber: instance.phone_number
      });
    }

    // Get QR code if not connected
    const qrCode = await evolutionService.connectInstance(instanceName);
    
    if (qrCode) {
      // Update instance with QR code
      await db.updateInstance(instanceName, { qr_code: qrCode });
      
      res.json({
        success: true,
        connected: false,
        qrCode: qrCode,
        status: status.state
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Could not generate QR code'
      });
    }

  } catch (error) {
    console.error('QR Scanner error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check connection status
router.get('/status/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    const status = await evolutionService.getInstanceStatus(instanceName);
    const instance = await db.getInstance(instanceName);
    
    res.json({
      success: true,
      status: status.state,
      instance: instance,
      lastUpdate: new Date()
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disconnect instance
router.post('/disconnect/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    await evolutionService.logout(instanceName);
    await db.updateInstance(instanceName, { 
      status: 'disconnected',
      phone_number: null,
      qr_code: null
    });
    
    res.json({
      success: true,
      message: 'Instance disconnected successfully'
    });

  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete instance
router.delete('/instance/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    await evolutionService.deleteInstance(instanceName);
    await db.deleteInstance(instanceName);
    
    res.json({
      success: true,
      message: 'Instance deleted successfully'
    });

  } catch (error) {
    console.error('Delete instance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all instances
router.get('/instances', async (req, res) => {
  try {
    const instances = await db.getAllInstances();
    
    // Get current status for each instance
    const instancesWithStatus = await Promise.all(
      instances.map(async (instance) => {
        try {
          const status = await evolutionService.getInstanceStatus(instance.name);
          return {
            ...instance,
            currentStatus: status.state
          };
        } catch (error) {
          return {
            ...instance,
            currentStatus: 'error'
          };
        }
      })
    );
    
    res.json({
      success: true,
      instances: instancesWithStatus
    });

  } catch (error) {
    console.error('Get instances error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update instance settings
router.put('/instance/:instanceName/settings', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { settings } = req.body;
    
    await db.updateInstance(instanceName, { settings });
    
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Set webhook for instance
router.post('/instance/:instanceName/webhook', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { webhookUrl, events } = req.body;
    
    const result = await evolutionService.setWebhook(
      instanceName, 
      webhookUrl || `${process.env.APP_URL}/api/webhooks/evolution`,
      events
    );
    
    await db.updateInstance(instanceName, { 
      webhook_url: webhookUrl || `${process.env.APP_URL}/api/webhooks/evolution`
    });
    
    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    console.error('Set webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;