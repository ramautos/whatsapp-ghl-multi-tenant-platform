#!/bin/bash

# 🗑️ Script para eliminar todas las instancias de Evolution API
# Creado para limpiar el sistema completo

EVOLUTION_URL="https://evolutionv2.cloude.es"
API_KEY="CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg"

echo "🔍 Obteniendo lista de instancias..."

# Obtener todas las instancias
INSTANCES=$(curl -s -H "apikey: $API_KEY" "$EVOLUTION_URL/instance/fetchInstances" | jq -r '.[].name')

if [ -z "$INSTANCES" ]; then
    echo "❌ No se pudieron obtener las instancias"
    exit 1
fi

TOTAL_INSTANCES=$(echo "$INSTANCES" | wc -l)
echo "📊 Total de instancias encontradas: $TOTAL_INSTANCES"

DELETED_COUNT=0
FAILED_COUNT=0

echo "🗑️ Eliminando todas las instancias..."
echo "----------------------------------------"

while IFS= read -r instance_name; do
    if [ -n "$instance_name" ]; then
        echo "Eliminando: $instance_name"
        
        # Primero intentar logout
        curl -s -X DELETE \
             -H "apikey: $API_KEY" \
             "$EVOLUTION_URL/instance/logout/$instance_name" > /dev/null 2>&1
        
        # Luego eliminar la instancia
        RESPONSE=$(curl -s -w "%{http_code}" -X DELETE \
                       -H "apikey: $API_KEY" \
                       "$EVOLUTION_URL/instance/delete/$instance_name")
        
        HTTP_CODE="${RESPONSE: -3}"
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
            echo "✅ Eliminado: $instance_name"
            ((DELETED_COUNT++))
        else
            echo "❌ Error eliminando: $instance_name (HTTP: $HTTP_CODE)"
            ((FAILED_COUNT++))
        fi
        
        # Pequeña pausa para evitar rate limiting
        sleep 0.5
    fi
done <<< "$INSTANCES"

echo "----------------------------------------"
echo "🎯 RESUMEN FINAL:"
echo "✅ Eliminadas exitosamente: $DELETED_COUNT"
echo "❌ Errores: $FAILED_COUNT"
echo "📊 Total procesadas: $((DELETED_COUNT + FAILED_COUNT))"

if [ $FAILED_COUNT -eq 0 ]; then
    echo "🎉 Todas las instancias fueron eliminadas correctamente!"
else
    echo "⚠️ Algunas instancias no pudieron ser eliminadas."
fi

echo ""
echo "🔍 Verificando instancias restantes..."
REMAINING=$(curl -s -H "apikey: $API_KEY" "$EVOLUTION_URL/instance/fetchInstances" | jq -r '. | length')
echo "📊 Instancias restantes: $REMAINING"

if [ "$REMAINING" = "0" ]; then
    echo "✅ Sistema limpio - No quedan instancias"
else
    echo "⚠️ Aún quedan $REMAINING instancias"
fi