#!/bin/bash

echo "🔍 VERIFICANDO CONFIGURACIÓN AUTO-DEPLOY"
echo "======================================="

# Verificar último commit
echo "📝 Último commit:"
git log --oneline -1
echo ""

# Verificar remote GitHub
echo "🔗 Repository remoto:"
git remote -v | grep origin
echo ""

# Verificar si hay webhook configurado (aproximado)
echo "📡 Verificando webhooks GitHub..."
echo "   Ve a: https://github.com/ramautos/whatsapp-ghl-multi-tenant-platform/settings/hooks"
echo "   Debe existir webhook apuntando a tu Coolify"
echo ""

# Test push simulado
echo "🧪 Para probar auto-deploy:"
echo "   1. Haz cambio pequeño (ej: README)"
echo "   2. git add . && git commit -m 'test auto-deploy'"
echo "   3. git push"
echo "   4. Monitorear Coolify logs (debería empezar deploy automático)"
echo ""

echo "⚙️  CONFIGURACIÓN CORRECTA EN COOLIFY:"
echo "   • Auto Deploy: ✅ ON"
echo "   • Branch: main"  
echo "   • Repository: GitHub conectado"
echo "   • Webhook: Configurado y funcionando"
echo ""

echo "🎯 UNA VEZ CONFIGURADO:"
echo "   git push = deploy automático ✅"
echo "   Sin intervención manual ✅"
echo "   Coolify maneja todo ✅"