const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  async initialize() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.connected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis initialization error:', error);
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected && this.client?.isOpen;
  }

  async get(key) {
    if (!this.isConnected()) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, expiration = null) {
    if (!this.isConnected()) return false;
    try {
      if (expiration) {
        await this.client.setEx(key, expiration, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async setex(key, seconds, value) {
    return this.set(key, value, seconds);
  }

  async del(key) {
    if (!this.isConnected()) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected()) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

module.exports = new RedisService();