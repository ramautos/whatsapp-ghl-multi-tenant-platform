const express = require('express');
const router = express.Router();

// Test endpoint for Chrome extension
router.post('/extension-webhook', async (req, res) => {
  try {
    console.log('🔍 TEST WEBHOOK - Chrome Extension Request:', {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    const { accion, url_completa, datos } = req.body;

    // Simulate different responses based on action
    let response;

    if (typeof datos === 'string' && datos.startsWith('resumir')) {
      // Handle "resumir [URL]" format
      response = [{
        html: `---

# 🎯 **ANÁLISIS ELITE - TEST**

## ⚡ **VERIFICACIÓN ESTRATÉGICA**
- [✅] **Conexión:** Backend conectado correctamente
- [✅] **Webhook:** Funcionando perfectamente

## 📊 **DATOS RECIBIDOS**
**URL:** ${url_completa || 'No especificada'}
**Acción:** ${accion || 'resumir'}
**Timestamp:** ${new Date().toISOString()}

## 🚨 **ESTADO DEL SISTEMA**
- 🟢 **API Evolution:** Configurada
- 🟢 **GoHighLevel:** Configurado
- 🟢 **Base de datos:** Lista
- 🟢 **Webhooks:** Activos

## 🎯 **RESULTADO**
✅ **La integración está funcionando correctamente!**

---
**🤖 Test generado:** ${new Date().toLocaleDateString()} | **📊 Versión:** Evolution v1.0`
      }];
    } else if (accion === 'crear_nota') {
      response = {
        success: true,
        message: 'Nota creada exitosamente en GoHighLevel',
        noteId: 'test_note_' + Date.now()
      };
    } else if (accion === 'crear_tarea') {
      response = {
        success: true,
        message: 'Tarea creada exitosamente en GoHighLevel',
        taskId: 'test_task_' + Date.now()
      };
    } else {
      response = [{
        html: `---

# 🎯 **SPEECH DE VENTA - TEST**

## 🚀 **PROPUESTA COMERCIAL**
Estimado cliente, basándome en el análisis de su conversación, he preparado esta propuesta personalizada.

## 💡 **PUNTOS CLAVE**
- ✅ Solución adaptada a sus necesidades
- ✅ ROI comprobado del 300%
- ✅ Implementación en 24 horas

## 📞 **SIGUIENTE PASO**
¿Cuándo podemos agendar una llamada para cerrar los detalles?

---
**🤖 Speech generado:** ${new Date().toLocaleDateString()}`
      }];
    }

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in test webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for extension
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Evolution-GHL Integration',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/api/test/extension-webhook',
      evolution: '/api/webhooks/evolution',
      ghl: '/api/webhooks/ghl'
    }
  });
});

// Test Evolution API connection
router.get('/evolution-status', async (req, res) => {
  try {
    const evolutionService = require('../services/evolutionService');
    const status = {
      connected: evolutionService.isConnected(),
      instances: evolutionService.getInstances().length
    };
    
    res.json({
      success: true,
      evolution: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test GHL connection
router.get('/ghl-status', async (req, res) => {
  try {
    const ghlService = require('../services/ghlService');
    const status = {
      connected: ghlService.isConnected()
    };
    
    res.json({
      success: true,
      ghl: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;