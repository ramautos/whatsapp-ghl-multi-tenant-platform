// 📱 CÓDIGO ACTUALIZADO PARA FORMATO EVOLUTION API
// Reemplaza el código en el nodo "Procesar Mensaje Ray"

const data = $input.all()[0].json;

console.log('📨 Webhook Evolution recibido:', JSON.stringify(data, null, 2));

// Verificar que es el formato correcto de Evolution
if (!data.event || !data.instance || !data.data) {
  throw new Error('❌ Formato de webhook Evolution inválido');
}

// Verificar que es un mensaje y no nuestro mensaje
if (data.data.key.fromMe) {
  throw new Error('⏭️ Mensaje enviado por nosotros, ignorar');
}

// Extraer datos del formato Evolution
const messageData = data.data;
const messageKey = messageData.key;
const messageContent = messageData.message;

// Extraer número de teléfono (remover @s.whatsapp.net)
const fromNumber = messageKey.remoteJid.replace('@s.whatsapp.net', '');

// Extraer texto del mensaje
const messageText = messageContent.conversation || 
                   messageContent.extendedTextMessage?.text || 
                   messageContent.imageMessage?.caption || 
                   'Mensaje multimedia';

// Formatear número telefónico (agregar +1 si no lo tiene)
const cleanPhone = fromNumber.startsWith('1') ? fromNumber : `1${fromNumber}`;
const formattedPhone = `+${cleanPhone}`;

// Datos para crear contacto en GHL
const contactData = {
  locationId: 'jtEqGdhkoR6iePmZaCmd',
  phone: formattedPhone,
  firstName: data.pushName || 'WhatsApp User',
  lastName: '',
  tags: ['whatsapp', 'evolution-api', 'sms-scanner'],
  customField: {
    whatsapp_name: data.pushName || '',
    source: 'Evolution API V2 - Ray Instance',
    last_message_preview: messageText.substring(0, 100),
    instance: data.instance,
    message_timestamp: messageData.messageTimestamp
  }
};

// Datos para el mensaje en GHL
const ghlMessageData = {
  locationId: 'jtEqGdhkoR6iePmZaCmd',
  type: 'SMS',
  message: messageText,
  direction: 'inbound'
};

console.log('✅ Datos procesados para GHL:', { 
  contactData, 
  ghlMessageData,
  originalSender: data.sender 
});

return {
  contactData,
  messageData: ghlMessageData,
  phoneNumber: formattedPhone,
  originalMessage: messageData,
  evolutionData: data,
  timestamp: new Date().toISOString()
};