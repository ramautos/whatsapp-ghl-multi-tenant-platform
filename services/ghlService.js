const axios = require('axios');
const EventEmitter = require('events');

class GHLService extends EventEmitter {
  constructor() {
    super();
    this.apiUrl = process.env.GHL_API_URL || 'https://services.leadconnectorhq.com';
    this.accessToken = process.env.GHL_ACCESS_TOKEN;
    this.locationId = process.env.GHL_LOCATION_ID;
    this.connected = false;
  }

  async initialize() {
    try {
      // Test API connection
      const response = await this.getContacts(1);
      this.connected = true;
      console.log('GoHighLevel API connected successfully');
    } catch (error) {
      console.error('Failed to connect to GoHighLevel API:', error.message);
      this.connected = false;
    }
  }

  async createConversation(contactId, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/conversations/`,
        {
          locationId: this.locationId,
          contactId: contactId,
          type: 'SMS',
          message: message
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error.message);
      throw error;
    }
  }

  async sendMessage(conversationId, message, attachments = []) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/conversations/messages`,
        {
          type: 'SMS',
          conversationId: conversationId,
          message: message,
          attachments: attachments
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.message);
      throw error;
    }
  }

  // UPSERT CONTACT - Como tu N8N (método principal)
  async upsertContact(locationId, contactData, accessToken = null) {
    try {
      const payload = {
        locationId: locationId,
        phone: contactData.phone,
        firstName: contactData.firstName || 'WhatsApp User'
      };

      console.log(`🔄 GHL Contact Upsert:`, payload);

      const response = await axios.post(
        `${this.apiUrl}/contacts/upsert`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      console.log(`✅ Contact upserted:`, response.data.contact?.id);
      return response.data;

    } catch (error) {
      console.error('❌ Error upserting contact:', error.response?.data || error.message);
      throw error;
    }
  }

  // BUSCAR CONVERSACION - Como tu segundo HTTP request
  async findOrCreateConversation(locationId, contactId, accessToken = null) {
    try {
      console.log(`🔍 Searching conversation for contact:`, contactId);

      // Buscar conversaciones del contacto
      const response = await axios.get(
        `${this.apiUrl}/conversations/search`,
        {
          params: {
            locationId: locationId,
            contactId: contactId
          },
          headers: {
            'Authorization': `Bearer ${accessToken || this.accessToken}`,
            'Version': '2021-04-15' // Como tu N8N
          }
        }
      );

      // Si existe conversación, usar la primera
      if (response.data.conversations && response.data.conversations.length > 0) {
        const conversationId = response.data.conversations[0].id;
        console.log(`✅ Found existing conversation:`, conversationId);
        return { conversationId, isNew: false };
      }

      // Si no existe, crear una nueva conversación
      console.log(`🆕 Creating new conversation for contact:`, contactId);
      const newConversation = await this.createConversation(contactId, "Nueva conversación WhatsApp");
      
      return { 
        conversationId: newConversation.conversation.id, 
        isNew: true 
      };

    } catch (error) {
      console.error('❌ Error finding/creating conversation:', error.response?.data || error.message);
      throw error;
    }
  }

  // ENVIAR MENSAJE INBOUND - Con conversationId automático
  async sendInboundMessage(locationId, messageData, accessToken = null) {
    try {
      // Si no hay conversationId, buscarlo/crearlo
      let conversationId = messageData.conversationId;
      
      console.log(`🔍 Checking conversationId:`, conversationId);
      console.log(`📨 MessageData:`, messageData);
      
      if (!conversationId) {
        console.log(`🚀 No conversationId provided, searching/creating...`);
        const conversationResult = await this.findOrCreateConversation(
          locationId, 
          messageData.contactId, 
          accessToken
        );
        conversationId = conversationResult.conversationId;
        console.log(`🎯 Using conversation:`, conversationId);
      } else {
        console.log(`✅ Using provided conversationId:`, conversationId);
      }

      const payload = {
        type: 'SMS',
        contactId: messageData.contactId,
        conversationId: conversationId,
        locationId: locationId,
        message: messageData.message || 'Mensaje desde WhatsApp'
      };

      // Solo incluir attachments si hay alguno (GHL requiere al menos 1)
      if (messageData.attachments && messageData.attachments.length > 0) {
        payload.attachments = messageData.attachments;
      }

      console.log(`🔄 GHL Inbound Message:`, {
        contactId: payload.contactId,
        conversationId: payload.conversationId,
        messageLength: payload.message.length,
        attachments: payload.attachments ? payload.attachments.length : 0
      });

      const response = await axios.post(
        `${this.apiUrl}/conversations/messages/inbound`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      console.log(`✅ Inbound message sent:`, response.data.conversationId);
      return response.data;

    } catch (error) {
      console.error('❌ Error sending inbound message:', error.response?.data || error.message);
      throw error;
    }
  }

  async getOrCreateContact(phone, additionalInfo = {}) {
    try {
      // First, search for existing contact
      const existingContact = await this.searchContactByPhone(phone);
      
      if (existingContact) {
        return existingContact;
      }

      // Create new contact if not found
      const response = await axios.post(
        `${this.apiUrl}/contacts/`,
        {
          locationId: this.locationId,
          phone: phone,
          ...additionalInfo
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return response.data.contact;
    } catch (error) {
      console.error('Error creating/getting contact:', error.message);
      throw error;
    }
  }

  async searchContactByPhone(phone) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/contacts/search`,
        {
          locationId: this.locationId,
          query: phone
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      if (response.data.contacts && response.data.contacts.length > 0) {
        return response.data.contacts[0];
      }

      return null;
    } catch (error) {
      console.error('Error searching contact:', error.message);
      return null;
    }
  }

  async updateContact(contactId, updates) {
    try {
      const response = await axios.put(
        `${this.apiUrl}/contacts/${contactId}`,
        updates,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return response.data.contact;
    } catch (error) {
      console.error('Error updating contact:', error.message);
      throw error;
    }
  }

  async addContactTag(contactId, tags) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/contacts/${contactId}/tags`,
        { tags: Array.isArray(tags) ? tags : [tags] },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error adding contact tag:', error.message);
      throw error;
    }
  }

  async createNote(contactId, note) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/contacts/${contactId}/notes`,
        { body: note },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating note:', error.message);
      throw error;
    }
  }

  async addToWorkflow(contactId, workflowId) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/contacts/${contactId}/workflow/${workflowId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error adding contact to workflow:', error.message);
      throw error;
    }
  }

  async getContacts(limit = 100) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/contacts/`,
        {
          params: {
            locationId: this.locationId,
            limit: limit
          },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Version': '2021-07-28'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting contacts:', error.message);
      throw error;
    }
  }

  async getConversation(conversationId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/conversations/${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Version': '2021-07-28'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting conversation:', error.message);
      throw error;
    }
  }

  async updateMessageStatus(messageId, status) {
    try {
      const response = await axios.put(
        `${this.apiUrl}/conversations/messages/${messageId}/status`,
        { status: status },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating message status:', error.message);
      throw error;
    }
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = new GHLService();