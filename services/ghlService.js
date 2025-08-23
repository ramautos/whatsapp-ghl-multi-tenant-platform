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