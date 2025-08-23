# 🔄 SOLUCIÓN ALTERNATIVA: POLLING

## Problema
Evolution API en Coolify no envía webhooks por problemas técnicos del entorno.

## Solución
Crear un sistema de polling que consulte Evolution API cada X segundos para buscar mensajes nuevos.

## Implementación en N8N

### Workflow de Polling
1. **Cron Trigger**: Ejecutar cada 30 segundos
2. **HTTP Request**: Consultar últimos mensajes de Evolution
3. **Filtrar**: Solo mensajes nuevos (por timestamp)
4. **Procesar**: Mismo flujo actual → GoHighLevel

### Ventajas
✅ No depende de webhooks
✅ Funciona con cualquier configuración de Coolify
✅ Control total sobre la frecuencia
✅ Más confiable en entornos restrictivos

### Desventajas
❌ Consume más recursos
❌ Delay de 30 segundos máximo
❌ Más complejo de configurar

## URL para consultar mensajes
```
GET https://evolution.cloude.es/chat/findMessages/ray?limit=10
```

## ¿Implementamos esta solución?
Si el problema de Coolify no se puede resolver rápidamente, podemos implementar polling como alternativa funcional.