const { OpenAI } = require('openai');
const redis = require('../config/redis');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.AI_MODEL || 'gpt-4';
    this.conversationCache = new Map();
  }

  async analyzeMessage(message, context = {}) {
    try {
      // Check for cached analysis
      const cacheKey = `analysis:${message}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an intelligent WhatsApp-GHL integration assistant. Analyze incoming messages and provide:
            1. Intent classification (inquiry, support, sales, complaint, etc.)
            2. Sentiment analysis (positive, neutral, negative)
            3. Urgency level (low, medium, high)
            4. Suggested response
            5. Recommended GHL actions (tags, workflows, etc.)
            
            Context: ${JSON.stringify(context)}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Cache the analysis for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(analysis));

      return analysis;
    } catch (error) {
      console.error('Error analyzing message:', error.message);
      return {
        intent: 'unknown',
        sentiment: 'neutral',
        urgency: 'medium',
        suggestedResponse: null,
        recommendedActions: []
      };
    }
  }

  async generateResponse(message, context = {}, tone = 'professional') {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful customer service assistant. Generate appropriate WhatsApp responses.
            Tone: ${tone}
            Business Context: ${JSON.stringify(context.business || {})}
            Customer History: ${JSON.stringify(context.history || [])}
            Keep responses concise and friendly.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error.message);
      return null;
    }
  }

  async classifyIntent(message) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `Classify the intent of the following message into one of these categories:
            - greeting
            - inquiry
            - support
            - complaint
            - sales
            - appointment
            - feedback
            - other
            
            Respond with only the category name.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      });

      return response.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      console.error('Error classifying intent:', error.message);
      return 'other';
    }
  }

  async extractEntities(message) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `Extract relevant entities from the message. Return a JSON object with:
            - name: person's name if mentioned
            - email: email address if mentioned
            - phone: phone number if mentioned
            - date: any date/time mentioned
            - product: any product/service mentioned
            - location: any location mentioned
            
            Return empty object {} if no entities found.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error extracting entities:', error.message);
      return {};
    }
  }

  async shouldAutoRespond(message, context = {}) {
    try {
      // Check business hours
      const now = new Date();
      const hour = now.getHours();
      const isBusinessHours = hour >= 9 && hour < 18; // 9 AM to 6 PM

      // Check message intent
      const intent = await this.classifyIntent(message);
      
      // Auto-respond rules
      const autoRespondIntents = ['greeting', 'inquiry', 'appointment'];
      const shouldRespond = !isBusinessHours || autoRespondIntents.includes(intent);

      return {
        shouldRespond,
        reason: !isBusinessHours ? 'outside_business_hours' : `intent_${intent}`,
        intent
      };
    } catch (error) {
      console.error('Error checking auto-respond:', error.message);
      return { shouldRespond: false, reason: 'error' };
    }
  }

  async summarizeConversation(messages) {
    try {
      const conversationText = messages.map(m => 
        `${m.fromMe ? 'Agent' : 'Customer'}: ${m.message}`
      ).join('\n');

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Summarize the following conversation in 2-3 sentences, highlighting key points and any action items.'
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        temperature: 0.5,
        max_tokens: 150
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error summarizing conversation:', error.message);
      return 'Unable to generate summary';
    }
  }

  async detectLanguage(message) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Detect the language of the message. Return only the ISO 639-1 language code (e.g., "en" for English, "es" for Spanish).'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      return response.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      console.error('Error detecting language:', error.message);
      return 'en';
    }
  }

  async translateMessage(message, targetLanguage = 'en') {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `Translate the following message to ${targetLanguage}. Return only the translation.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error translating message:', error.message);
      return message;
    }
  }
}

module.exports = new AIService();