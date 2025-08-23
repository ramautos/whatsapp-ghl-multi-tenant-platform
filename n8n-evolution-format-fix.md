# 🔧 ARREGLAR FORMATO WEBHOOK N8N → EVOLUTION

## Problema
Evolution envía webhooks pero N8N no los reconoce debido a diferencias de formato.

## Solución en N8N

### 1. Modificar nodo Webhook
En el nodo "Evolution Webhook":
- **Authentication**: None
- **HTTP Method**: POST  
- **Path**: evolution1
- **Response Mode**: Using 'Respond to Webhook' Node
- **Options → Response Headers**: Agregar
  - Name: `Content-Type`
  - Value: `application/json`

### 2. Agregar validación flexible
En el nodo "Filter: Instancia Ray", cambiar condiciones:

```javascript
// En lugar de verificar evento exacto, usar includes
$json.event && $json.event.includes('messages')

// Y verificar instancia de forma flexible  
$json.instance === 'ray' || $json.instanceName === 'ray'
```

### 3. Modificar procesamiento de mensaje
En "Procesar Mensaje Ray":

```javascript
// Manejo flexible de estructura de datos
const data = $input.all()[0].json;

// Verificar múltiples formatos posibles
let messages = [];
if (data.data && data.data.messages) {
    messages = data.data.messages;
} else if (data.messages) {
    messages = data.messages;
} else if (data.message) {
    messages = [data.message];
}

if (!messages || messages.length === 0) {
    throw new Error('No se encontraron mensajes en el webhook');
}

// Resto del procesamiento igual...
```

### 4. Configurar webhook para aceptar cualquier contenido
En Options del webhook:
- **Raw Body**: true
- **Binary Data**: false
- **Response Code**: 200