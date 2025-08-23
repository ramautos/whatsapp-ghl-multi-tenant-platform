// 🚀 CÓDIGO MEJORADO EVOLUTION API → GHL
const inputData = $input.all()[0];
const data = inputData.body || inputData.json;

console.log('📨 Webhook Evolution recibido (MEJORADO):', JSON.stringify(data, null, 2));
console.log('📋 Headers:', inputData.headers);

// ✅ VALIDACIONES MEJORADAS
if (!data || !data.event || !data.instance || !data.data) {
  console.log('❌ Formato de webhook Evolution inválido');
  return { 
    status: 'error', 
    reason: 'invalid_format',
    received: data 
  };
}

// ✅ FILTRAR EVENTOS NO DESEADOS
if (data.event !== 'messages.upsert') {
  console.log('⏭️ Evento no es message.upsert, ignorar:', data.event);
  return { 
    status: 'ignored', 
    reason: 'not_message_event',
    event: data.event 
  };
}

// ✅ FILTRAR MENSAJES PROPIOS
if (data.data.key && data.data.key.fromMe) {
  console.log('⏭️ Mensaje enviado por nosotros, ignorar');
  return { 
    status: 'ignored', 
    reason: 'from_me',
    messageId: data.data.key.id 
  };
}

// ✅ FILTRAR INSTANCIA CORRECTA
if (data.instance !== 'ray') {
  console.log('⏭️ Instancia no es "ray", ignorar:', data.instance);
  return { 
    status: 'ignored', 
    reason: 'wrong_instance',
    instance: data.instance 
  };
}

// 📱 EXTRAER DATOS DEL MENSAJE
const messageData = data.data;
const messageKey = messageData.key;
const messageContent = messageData.message;

// 📞 EXTRAER Y LIMPIAR NÚMERO DE TELÉFONO
const rawNumber = messageKey.remoteJid.replace('@s.whatsapp.net', '');
const senderNumber = data.sender ? data.sender.replace('@s.whatsapp.net', '') : rawNumber;

// 💬 EXTRAER TEXTO DEL MENSAJE (MEJORADO)
let messageText = '';
if (messageContent.conversation) {
  messageText = messageContent.conversation;
} else if (messageContent.extendedTextMessage?.text) {
  messageText = messageContent.extendedTextMessage.text;
} else if (messageContent.imageMessage?.caption) {
  messageText = `[Imagen] ${messageContent.imageMessage.caption}`;
} else if (messageContent.videoMessage?.caption) {
  messageText = `[Video] ${messageContent.videoMessage.caption}`;
} else if (messageContent.audioMessage) {
  messageText = '[Mensaje de voz]';
} else if (messageContent.documentMessage) {
  messageText = `[Documento] ${messageContent.documentMessage.fileName || 'archivo'}`;
} else if (messageContent.stickerMessage) {
  messageText = '[Sticker]';
} else {
  messageText = '[Mensaje multimedia]';
}

// 🔢 FORMATEAR NÚMERO TELEFÓNICO
let formattedPhone = senderNumber;

// Agregar código de país si no lo tiene
if (!formattedPhone.startsWith('+')) {
  if (formattedPhone.startsWith('1')) {
    formattedPhone = `+${formattedPhone}`;
  } else if (formattedPhone.startsWith('971')) {
    // Número de UAE
    formattedPhone = `+${formattedPhone}`;
  } else {
    // Asumir USA si no está claro
    formattedPhone = `+1${formattedPhone}`;
  }
}

// 👤 EXTRAER NOMBRE DEL CONTACTO
const contactName = messageData.pushName || data.pushName || 'WhatsApp User';
const nameParts = contactName.split(' ');
const firstName = nameParts[0] || 'WhatsApp';
const lastName = nameParts.slice(1).join(' ') || 'User';

// 🏢 DATOS PARA CREAR CONTACTO EN GHL
const contactData = {
  locationId: 'jtEqGdhkoR6iePmZaCmd',
  phone: formattedPhone,
  firstName: firstName,
  lastName: lastName,
  tags: ['whatsapp', 'evolution-api', 'auto-import'],
  customFields: {
    whatsapp_name: contactName,
    source: 'Evolution API V2 - Ray Instance',
    last_message_preview: messageText.substring(0, 100),
    instance_name: data.instance,
    message_timestamp: messageData.messageTimestamp,
    whatsapp_jid: messageKey.remoteJid,
    device_source: messageData.source || 'unknown',
    import_date: new Date().toISOString()
  }
};

// 💬 DATOS PARA EL MENSAJE EN GHL
const ghlMessageData = {
  locationId: 'jtEqGdhkoR6iePmZaCmd',
  type: 'SMS',
  message: messageText,
  direction: 'inbound',
  source: 'whatsapp-evolution'
};

// 📊 LOG MEJORADO
console.log('✅ DATOS PROCESADOS EXITOSAMENTE:');
console.log('📞 Teléfono:', formattedPhone);
console.log('👤 Contacto:', contactName);
console.log('💬 Mensaje:', messageText.substring(0, 50) + '...');
console.log('⏰ Timestamp:', new Date(messageData.messageTimestamp * 1000).toISOString());

// 🎯 RESULTADO FINAL
return {
  status: 'success',
  contactData,
  messageData: ghlMessageData,
  phoneNumber: formattedPhone,
  contactName: contactName,
  messageText: messageText,
  messageType: messageData.messageType,
  originalMessage: messageData,
  evolutionData: data,
  timestamp: new Date().toISOString(),
  processedAt: new Date().toISOString()
};