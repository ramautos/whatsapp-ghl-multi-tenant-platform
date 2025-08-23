const axios = require('axios');
const QRCode = require('qrcode');
const EventEmitter = require('events');

class EvolutionService extends EventEmitter {
  constructor() {
    super();
    this.apiUrl = process.env.EVOLUTION_API_URL;
    this.apiKey = process.env.EVOLUTION_API_KEY;
    this.instances = new Map();
    this.connected = false;
  }

  async initialize() {
    try {
      // Check Evolution API health
      const response = await axios.get(`${this.apiUrl}/health`);
      this.connected = response.status === 200;
      console.log('Evolution API connected successfully');
    } catch (error) {
      console.error('Failed to connect to Evolution API:', error.message);
      this.connected = false;
    }
  }

  async createInstance(instanceName, options = {}) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/instance/create`,
        {
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          webhookUrl: `${process.env.APP_URL}/api/webhooks/evolution`,
          webhookByEvents: true,
          webhookBase64: false,
          ...options
        },
        {
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      this.instances.set(instanceName, {
        ...response.data,
        status: 'created',
        createdAt: new Date()
      });

      return response.data;
    } catch (error) {
      console.error('Error creating instance:', error.message);
      throw error;
    }
  }

  async connectInstance(instanceName) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/instance/connect/${instanceName}`,
        {
          headers: { 'apikey': this.apiKey }
        }
      );

      if (response.data.base64) {
        // Generate QR code
        const qrCodeData = await QRCode.toDataURL(response.data.code);
        
        // Update instance status
        const instance = this.instances.get(instanceName) || {};
        instance.status = 'connecting';
        instance.qrCode = qrCodeData;
        this.instances.set(instanceName, instance);

        // Emit QR code event
        this.emit('qr-code', { instanceName, qrCode: qrCodeData });

        return qrCodeData;
      }

      return null;
    } catch (error) {
      console.error('Error connecting instance:', error.message);
      throw error;
    }
  }

  async getInstanceStatus(instanceName) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/instance/connectionState/${instanceName}`,
        {
          headers: { 'apikey': this.apiKey }
        }
      );

      const instance = this.instances.get(instanceName) || {};
      instance.status = response.data.state;
      this.instances.set(instanceName, instance);

      return response.data;
    } catch (error) {
      console.error('Error getting instance status:', error.message);
      throw error;
    }
  }

  async sendTextMessage(instanceName, to, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/message/sendText/${instanceName}`,
        {
          number: to.replace('@s.whatsapp.net', ''),
          text: message,
          delay: 1000
        },
        {
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.message);
      throw error;
    }
  }

  async sendMediaMessage(instanceName, to, media, caption = '') {
    try {
      const response = await axios.post(
        `${this.apiUrl}/message/sendMedia/${instanceName}`,
        {
          number: to,
          mediatype: media.type || 'image',
          media: media.url,
          caption: caption
        },
        {
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending media message:', error.message);
      throw error;
    }
  }

  async setWebhook(instanceName, webhookUrl, events = []) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/webhook/set/${instanceName}`,
        {
          url: webhookUrl,
          webhook_by_events: true,
          events: events.length > 0 ? events : [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED',
            'MESSAGES_SET',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'MESSAGES_DELETE',
            'SEND_MESSAGE',
            'CONNECTION_UPDATE'
          ]
        },
        {
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error setting webhook:', error.message);
      throw error;
    }
  }

  async getMessages(instanceName, remoteJid, limit = 100) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/chat/findMessages/${instanceName}`,
        {
          params: { remoteJid, limit },
          headers: { 'apikey': this.apiKey }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting messages:', error.message);
      throw error;
    }
  }

  async logout(instanceName) {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/instance/logout/${instanceName}`,
        {
          headers: { 'apikey': this.apiKey }
        }
      );

      // Update instance status
      const instance = this.instances.get(instanceName) || {};
      instance.status = 'disconnected';
      this.instances.set(instanceName, instance);

      return response.data;
    } catch (error) {
      console.error('Error logging out instance:', error.message);
      throw error;
    }
  }

  async deleteInstance(instanceName) {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/instance/delete/${instanceName}`,
        {
          headers: { 'apikey': this.apiKey }
        }
      );

      // Remove from instances map
      this.instances.delete(instanceName);

      return response.data;
    } catch (error) {
      console.error('Error deleting instance:', error.message);
      throw error;
    }
  }

  isConnected() {
    return this.connected;
  }

  getInstances() {
    return Array.from(this.instances.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }
}

module.exports = new EvolutionService();