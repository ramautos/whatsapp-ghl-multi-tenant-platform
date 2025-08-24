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
      const response = await axios.get(`${this.apiUrl}`);
      this.connected = response.status === 200;
      console.log('Evolution API connected successfully');
    } catch (error) {
      console.error('Failed to connect to Evolution API:', error.message);
      this.connected = false;
    }
  }

  async createInstance(instanceName, options = {}) {
    try {
      console.log('🔧 Creating instance with:');
      console.log('- URL:', `${this.apiUrl}/instance/create`);
      console.log('- API Key:', this.apiKey);
      console.log('- Instance Name:', instanceName);
      
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
      console.error('❌ Error creating instance:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${this.apiUrl}/instance/create`
      });
      // Return null instead of throwing to continue with other instances
      return null;
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

  // ================================
  // MARKETPLACE AUTOMATION METHODS
  // ================================

  // Crear múltiples instancias para un cliente nuevo
  async createClientInstances(locationId, count = 5) {
    const instances = [];
    const results = [];

    console.log(`🚀 Creating ${count} instances for client: ${locationId}`);

    for (let i = 1; i <= count; i++) {
      const instanceName = `${locationId}_${i}`;
      
      try {
        console.log(`🔄 Creating instance ${i}/${count} for client ${locationId}`);
        
        const result = await this.createInstance(instanceName);
        console.log(`📊 Instance creation result for ${instanceName}:`, result ? 'SUCCESS' : 'FAILED');
        
        if (result) {
          // Configurar webhook para N8N (mantener flujo existente del usuario)
          const webhookUrl = `https://ray.cloude.es/webhook/evolution1?location=${locationId}&instance=${i}`;
          
          // Esperar 2 segundos para que la instancia esté completamente lista
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Configurar webhook
          try {
            await this.setWebhook(instanceName, webhookUrl);
            console.log(`✅ Webhook configured for ${instanceName}`);
          } catch (webhookError) {
            console.warn(`⚠️ Webhook config failed for ${instanceName}:`, webhookError.message);
            console.warn(`📋 Webhook will be configured later for ${instanceName}`);
          }
          
          instances.push({
            position: i,
            instanceName: instanceName,
            status: 'created',
            webhookUrl: webhookUrl,
            qrCode: null,
            connectionState: 'disconnected'
          });

          console.log(`✅ Instance ${instanceName} created successfully`);
        }
        
        results.push(result);
        
        // Espera entre creaciones para evitar rate limiting
        if (i < count) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Error creating instance ${instanceName}:`, error);
        results.push({
          success: false,
          error: error.message,
          instanceName
        });
      }
    }

    const totalCreated = instances.length;
    console.log(`🎯 Created ${totalCreated}/${count} instances for ${locationId}`);

    return {
      success: instances.length > 0,
      instances,
      results,
      totalCreated,
      totalRequested: count,
      locationId
    };
  }

  // Obtener estado de todas las instancias de un cliente
  async getClientInstancesStatus(locationId) {
    const instances = [];
    
    for (let i = 1; i <= 5; i++) {
      const instanceName = `${locationId}_${i}`;
      
      try {
        const status = await this.getInstanceInfo(instanceName);
        instances.push({
          position: i,
          instanceName,
          status: status.success ? status.data : { state: 'error' },
          connected: status.success && status.data?.state === 'open'
        });
      } catch (error) {
        instances.push({
          position: i,
          instanceName,
          status: { state: 'error', error: error.message },
          connected: false
        });
      }
    }

    return {
      locationId,
      instances,
      totalInstances: instances.length,
      connectedInstances: instances.filter(i => i.connected).length
    };
  }

  // Eliminar todas las instancias de un cliente
  async deleteClientInstances(locationId) {
    const results = [];
    
    for (let i = 1; i <= 5; i++) {
      const instanceName = `${locationId}_${i}`;
      
      try {
        const result = await this.deleteInstance(instanceName);
        results.push({ instanceName, result });
        console.log(`🗑️ Deleted instance ${instanceName}`);
      } catch (error) {
        console.error(`❌ Error deleting ${instanceName}:`, error);
        results.push({ instanceName, error: error.message });
      }
    }

    return {
      success: true,
      results,
      locationId
    };
  }

  // ================================
  // HEALTH CHECK AND MONITORING
  // ================================

  async healthCheck() {
    try {
      const response = await axios.get(`${this.apiUrl}/manager/health`, {
        headers: { 'apikey': this.apiKey },
        timeout: 5000 // 5 second timeout
      });

      return {
        status: 'healthy',
        connected: true,
        response: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Evolution API health check failed:', error.message);
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async restartInstance(instanceName) {
    try {
      const response = await axios.put(
        `${this.apiUrl}/instance/restart/${instanceName}`,
        {},
        {
          headers: { 'apikey': this.apiKey }
        }
      );

      // Update local instance status
      const instance = this.instances.get(instanceName) || {};
      instance.status = 'restarting';
      this.instances.set(instanceName, instance);

      return response.data;
    } catch (error) {
      console.error('Error restarting instance:', error.message);
      throw error;
    }
  }

  async getInstanceInfo(instanceName) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/instance/info/${instanceName}`,
        {
          headers: { 'apikey': this.apiKey }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting instance info:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EvolutionService();