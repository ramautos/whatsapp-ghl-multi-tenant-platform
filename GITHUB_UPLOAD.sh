#!/bin/bash

# 🚀 Script para subir el proyecto a GitHub
# Creado por Claude Code

echo "🎯 CONFIGURACIÓN AUTOMÁTICA DE GITHUB"
echo "====================================="
echo ""

# 1. Autenticar GitHub CLI
echo "📋 PASO 1: Autenticar GitHub CLI"
echo "Por favor, sigue estos pasos:"
echo ""
gh auth login

echo ""
echo "✅ Autenticación completada"
echo ""

# 2. Crear repositorio
echo "📋 PASO 2: Creando repositorio en GitHub..."
gh repo create whatsapp-ghl-multi-tenant-platform \
  --description "🚀 Complete Multi-Tenant WhatsApp-GoHighLevel Integration Platform - Superior alternative to Wazzap.mx" \
  --public \
  --source=. \
  --remote=origin \
  --push

echo ""
echo "✅ ¡REPOSITORIO CREADO Y CÓDIGO SUBIDO!"
echo ""
echo "🎉 Tu proyecto está ahora en GitHub"
echo "📍 URL: https://github.com/$(gh api user -q .login)/whatsapp-ghl-multi-tenant-platform"
echo ""
echo "====================================="
echo "✨ Proceso completado exitosamente"