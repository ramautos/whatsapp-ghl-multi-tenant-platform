const express = require('express');
const router = express.Router();
const evolutionService = require('../services/evolutionService');
const ghlService = require('../services/ghlService');
const aiService = require('../services/aiService');
const db = require('../config/database');

// Webhook from Evolution API - Receives WhatsApp messages
router.post('/evolution', async (req, res) => {
  try {
    const { event, instance, data } = req.body;
    const io = req.app.get('io');

    console.log(`Evolution webhook received: ${event} for instance: ${instance}`);

    switch (event) {
      case 'messages.upsert':
        await handleIncomingMessage(data, instance, io);
        break;
      
      case 'messages.update':
        await handleMessageUpdate(data, instance, io);
        break;
      
      case 'connection.update':
        await handleConnectionUpdate(data, instance, io);
        break;
      
      case 'qrcode.updated':
        await handleQRCodeUpdate(data, instance, io);
        break;
      
      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Evolution webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook from GoHighLevel - Receives GHL events
router.post('/ghl', async (req, res) => {
  try {
    const { type, locationId, contactId, conversationId, message } = req.body;
    
    console.log(`GHL webhook received: ${type}`);

    switch (type) {
      case 'OutboundMessage':
        await handleOutboundMessage(req.body);
        break;
      
      case 'ConversationUnreadUpdate':
        await handleConversationUpdate(req.body);
        break;
      
      default:
        console.log(`Unhandled GHL event: ${type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('GHL webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle incoming WhatsApp message
async function handleIncomingMessage(data, instanceName, io) {
  try {
    const { key, message, pushName } = data;
    const fromNumber = key.remoteJid.replace('@s.whatsapp.net', '');
    
    // Skip if message is from us
    if (key.fromMe) return;

    // Extract message content
    const messageText = message.conversation || 
                       message.extendedTextMessage?.text || 
                       message.imageMessage?.caption || 
                       message.videoMessage?.caption || '';

    if (!messageText) return;

    // AI Analysis
    const analysis = await aiService.analyzeMessage(messageText, {
      sender: pushName,
      number: fromNumber
    });

    // Get or create GHL contact
    const contact = await ghlService.getOrCreateContact(fromNumber, {
      firstName: pushName || 'WhatsApp User',
      tags: ['whatsapp', analysis.intent],
      customField: {
        whatsapp_name: pushName,
        last_intent: analysis.intent,
        sentiment: analysis.sentiment
      }
    });

    // Create or update conversation in GHL
    const conversation = await ghlService.createConversation(contact.id, messageText);

    // Store in database
    await db.storeMessage({
      instanceName,
      whatsappNumber: fromNumber,
      ghlContactId: contact.id,
      ghlConversationId: conversation.id,
      message: messageText,
      direction: 'inbound',
      analysis: analysis,
      timestamp: new Date()
    });

    // Add contact to workflow if high urgency
    if (analysis.urgency === 'high') {
      await ghlService.addToWorkflow(contact.id, process.env.HIGH_URGENCY_WORKFLOW_ID);
    }

    // Auto-respond if configured
    const autoRespond = await aiService.shouldAutoRespond(messageText);
    if (autoRespond.shouldRespond) {
      const response = analysis.suggestedResponse || 
                      await aiService.generateResponse(messageText, { 
                        contactName: pushName 
                      });
      
      if (response) {
        await evolutionService.sendTextMessage(instanceName, key.remoteJid, response);
        await ghlService.sendMessage(conversation.id, response);
      }
    }

    // Emit to dashboard
    io.to(`instance-${instanceName}`).emit('new-message', {
      from: fromNumber,
      message: messageText,
      analysis,
      contact,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

// Handle outbound message from GHL
async function handleOutboundMessage(data) {
  try {
    const { contactId, message, conversationId } = data;
    
    // Get contact details
    const contact = await db.getContactMapping(contactId);
    if (!contact || !contact.whatsappNumber) {
      console.log('No WhatsApp number found for contact:', contactId);
      return;
    }

    // Send via Evolution API
    const whatsappNumber = contact.whatsappNumber + '@s.whatsapp.net';
    const result = await evolutionService.sendTextMessage(
      contact.instanceName, 
      whatsappNumber, 
      message.body
    );

    // Store in database
    await db.storeMessage({
      instanceName: contact.instanceName,
      whatsappNumber: contact.whatsappNumber,
      ghlContactId: contactId,
      ghlConversationId: conversationId,
      message: message.body,
      direction: 'outbound',
      evolutionMessageId: result.key.id,
      timestamp: new Date()
    });

    // Update message status in GHL
    if (message.id) {
      await ghlService.updateMessageStatus(message.id, 'delivered');
    }

  } catch (error) {
    console.error('Error handling outbound message:', error);
  }
}

// Handle message status update
async function handleMessageUpdate(data, instanceName, io) {
  try {
    const { key, update } = data;
    
    // Update message status in database
    await db.updateMessageStatus(key.id, update.status);

    // Emit to dashboard
    io.to(`instance-${instanceName}`).emit('message-update', {
      messageId: key.id,
      status: update.status,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error handling message update:', error);
  }
}

// Handle connection update
async function handleConnectionUpdate(data, instanceName, io) {
  try {
    const { state } = data;
    
    // Update instance status
    await db.updateInstanceStatus(instanceName, state);

    // Emit to dashboard
    io.to(`instance-${instanceName}`).emit('connection-update', {
      instance: instanceName,
      state: state,
      timestamp: new Date()
    });

    // Send notification to GHL if disconnected
    if (state === 'close') {
      // Create task or notification in GHL
      console.log(`WhatsApp instance ${instanceName} disconnected`);
    }

  } catch (error) {
    console.error('Error handling connection update:', error);
  }
}

// Handle QR code update
async function handleQRCodeUpdate(data, instanceName, io) {
  try {
    const { qrcode } = data;
    
    // Emit to dashboard for display
    io.to(`instance-${instanceName}`).emit('qrcode-update', {
      instance: instanceName,
      qrcode: qrcode,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error handling QR code update:', error);
  }
}

// Handle conversation update from GHL
async function handleConversationUpdate(data) {
  try {
    const { conversationId, unreadCount } = data;
    
    // Update conversation status in database
    await db.updateConversationStatus(conversationId, {
      unreadCount,
      lastUpdate: new Date()
    });

  } catch (error) {
    console.error('Error handling conversation update:', error);
  }
}

module.exports = router;