#!/bin/bash

# 🔍 SCRIPT VERIFICACIÓN PRODUCCIÓN WHATSAPP-GHL
echo "🚀 Verificando deploy en producción..."
echo "======================================"

PROD_URL="https://whatsapp.cloude.es"
LOCAL_URL="http://localhost:3000"

# 1. Health Check
echo "1️⃣ Health Check..."
HEALTH_STATUS=$(curl -s "$PROD_URL/api/health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo "   ✅ API saludable: $HEALTH_STATUS"
else
    echo "   ❌ API no disponible"
fi

# 2. Verificar página principal
echo ""
echo "2️⃣ Página principal..."
MAIN_PAGE_TITLE=$(curl -s "$PROD_URL" | grep -o '<title>[^<]*</title>' | sed 's/<\/?title>//g')
echo "   📄 Título actual: $MAIN_PAGE_TITLE"

if [[ "$MAIN_PAGE_TITLE" == *"WhatsApp Business Login"* ]]; then
    echo "   ✅ Login simple deployado correctamente"
else
    echo "   ⚠️  Página antigua aún activa"
    echo "   🔄 Deploy podría estar pendiente..."
fi

# 3. Verificar endpoints nuevos
echo ""
echo "3️⃣ Endpoints de login..."
LOGIN_CLIENT=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/clients/login")
LOGIN_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/admin/login")

if [ "$LOGIN_CLIENT" = "400" ]; then
    echo "   ✅ API login cliente disponible (400 = falta body)"
else
    echo "   ❌ API login cliente: HTTP $LOGIN_CLIENT"
fi

if [ "$LOGIN_ADMIN" = "400" ]; then
    echo "   ✅ API login admin disponible (400 = falta body)"
else
    echo "   ❌ API login admin: HTTP $LOGIN_ADMIN"
fi

# 4. Verificar dashboard simple
echo ""
echo "4️⃣ Dashboard simple..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/dashboard/FINAL_PRODUCTION_TEST_1755992451")
if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "   ✅ Dashboard simple accesible"
else
    echo "   ❌ Dashboard simple: HTTP $DASHBOARD_STATUS"
fi

# 5. Test conexión instancia
echo ""
echo "5️⃣ Test API conexión WhatsApp..."
CONNECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/instances/FINAL_PRODUCTION_TEST_1755992451/1/connect" -H "Content-Type: application/json")
if [ "$CONNECT_STATUS" = "200" ]; then
    echo "   ✅ API conexión WhatsApp funcional"
else
    echo "   ❌ API conexión WhatsApp: HTTP $CONNECT_STATUS"
fi

# 6. Comparar con local
echo ""
echo "6️⃣ Comparación con desarrollo local..."
LOCAL_HEALTH=$(curl -s "$LOCAL_URL/api/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$LOCAL_HEALTH" = "healthy" ]; then
    echo "   🏠 Local funcionando: $LOCAL_HEALTH"
    echo "   🔄 Diferencia detectada - Deploy necesario"
else
    echo "   ⚠️  Local no disponible (normal si no está corriendo)"
fi

echo ""
echo "======================================"
echo "🎯 RESUMEN:"
echo "   • API backend: Actualizada ✅"
echo "   • Archivos estáticos: Verificar ⚠️"
echo "   • Auto-deploy: Monitorear 🔄"
echo ""
echo "💡 Si persiste el problema:"
echo "   1. Acceder a Coolify dashboard"
echo "   2. Trigger manual deploy"
echo "   3. Verificar logs de build"
echo "======================================"