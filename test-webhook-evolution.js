// 🧪 SCRIPT PARA PROBAR EL WEBHOOK DE EVOLUTION
// Simula exactamente el JSON que enviaste de tu N8N

const axios = require('axios');

const testWebhook = async () => {
    // Datos exactos como tu JSON de ejemplo
    const evolutionPayload = {
        "event": "messages.upsert",
        "instance": "jtEqGdhkoR6iePmZaCmd", // Tu location_id real
        "data": {
            "key": {
                "remoteJid": "971582091834@s.whatsapp.net",
                "fromMe": false,
                "id": "3AEC86F19994C535AA64",
                "senderLid": "82030184386636@lid"
            },
            "pushName": "Bono",
            "status": "DELIVERY_ACK",
            "message": {
                "conversation": "Saludos",
                "messageContextInfo": {
                    "deviceListMetadata": {
                        "senderKeyHash": "iDtxbcay1t88dw==",
                        "senderTimestamp": "1755039190",
                        "recipientKeyHash": "1kYTQ1rWYmRfWQ==",
                        "recipientTimestamp": "1755829774"
                    },
                    "deviceListMetadataVersion": 2,
                    "messageSecret": "KQu3Y1q+0dAwrjyf6ED60w6IEreCTk7ZlkJLJksreuw="
                }
            },
            "messageType": "conversation",
            "messageTimestamp": 1755920987,
            "instanceId": "49e8011d-53ea-48cd-9738-3edda135eec7",
            "source": "ios"
        },
        "destination": "https://tu-dominio.com/api/webhook/messages?location=jtEqGdhkoR6iePmZaCmd",
        "date_time": "2025-08-23T00:49:48.054Z",
        "sender": "18094973030@s.whatsapp.net",
        "server_url": "https://evolutionv2.cloude.es",
        "apikey": "3100574E7DE0-434C-854E-49BC40E921B9"
    };

    try {
        console.log('🧪 Testing Evolution webhook...');
        console.log('📨 Sending payload:', JSON.stringify(evolutionPayload, null, 2));
        
        const response = await axios.post(
            'http://localhost:3000/api/webhook/messages?location=jtEqGdhkoR6iePmZaCmd',
            evolutionPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Evolution-API-Test'
                },
                timeout: 10000
            }
        );

        console.log('✅ Webhook response:', response.status, response.data);
        
    } catch (error) {
        console.error('❌ Webhook test failed:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data || error.message);
    }
};

// Ejecutar el test
testWebhook();