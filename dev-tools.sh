#!/bin/bash

# 🔥 HERRAMIENTAS DE DESARROLLO WHATSAPP-GHL
# Script para activar TODAS las herramientas de desarrollo

echo "🚀 ACTIVANDO TODAS LAS HERRAMIENTAS DE DESARROLLO"
echo "================================================="

# Función para mostrar menú
show_menu() {
    echo ""
    echo "🎯 HERRAMIENTAS DISPONIBLES:"
    echo "1️⃣  Start Server + Live Server"
    echo "2️⃣  Test All APIs (Thunder Client ready)"
    echo "3️⃣  Open Development Dashboard"
    echo "4️⃣  Open Production Dashboard"
    echo "5️⃣  Check Database (SQLite)"
    echo "6️⃣  Git Status + Quick Commit"
    echo "7️⃣  Full System Check"
    echo "8️⃣  Deploy to Production (Manual)"
    echo "9️⃣  View Logs (Real-time)"
    echo "🔟  Open All Tools (VS Code Power Mode)"
    echo "0️⃣  Exit"
    echo ""
    echo -n "Selecciona una opción: "
}

# Función para iniciar servidor
start_server() {
    echo "🚀 Iniciando servidor de desarrollo..."
    if pgrep -f "node server-multitenant.js" > /dev/null; then
        echo "   ⚠️  Servidor ya está corriendo"
        echo "   🔍 PID: $(pgrep -f "node server-multitenant.js")"
    else
        echo "   🔧 Iniciando nuevo servidor..."
        nohup node server-multitenant.js > server.log 2>&1 &
        sleep 2
        echo "   ✅ Servidor iniciado en background"
        echo "   🌐 Local: http://localhost:3000"
    fi
}

# Función para probar APIs
test_apis() {
    echo "🧪 Ejecutando tests de APIs..."
    ./verify-production.sh
}

# Función para abrir dashboard
open_dev_dashboard() {
    echo "📱 Abriendo dashboard de desarrollo..."
    open http://localhost:3000
    echo "   ✅ Dashboard local abierto"
}

# Función para abrir producción
open_prod_dashboard() {
    echo "🌐 Abriendo dashboard de producción..."
    open https://whatsapp.cloude.es
    echo "   ✅ Dashboard producción abierto"
}

# Función para verificar base de datos
check_database() {
    echo "🗄️  Verificando base de datos..."
    if [ -f "database/multitenant.db" ]; then
        echo "   ✅ Base de datos existe"
        echo "   📊 Tamaño: $(du -h database/multitenant.db | cut -f1)"
        echo "   📝 Usar SQLite Viewer en VS Code para ver tablas"
    else
        echo "   ⚠️  Base de datos no encontrada"
        echo "   🔧 Se creará automáticamente al usar la app"
    fi
}

# Función para git status
git_status() {
    echo "📊 Estado del repositorio Git..."
    git status --porcelain
    echo ""
    echo "📝 ¿Hacer commit rápido? (y/n)"
    read -r answer
    if [ "$answer" = "y" ]; then
        echo -n "💬 Mensaje de commit: "
        read -r message
        git add .
        git commit -m "$message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        git push
        echo "   ✅ Cambios committeados y pusheados"
    fi
}

# Función para sistema completo
full_check() {
    echo "🔍 VERIFICACIÓN COMPLETA DEL SISTEMA"
    echo "===================================="
    
    # Servidor local
    if pgrep -f "node server-multitenant.js" > /dev/null; then
        echo "✅ Servidor local: CORRIENDO"
    else
        echo "❌ Servidor local: PARADO"
    fi
    
    # Archivos críticos
    files=("server-multitenant.js" "routes/multiTenantApi.js" "services/evolutionService.js" "public/login-simple.html")
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo "✅ $file: OK"
        else
            echo "❌ $file: FALTA"
        fi
    done
    
    # Configuración VS Code
    vscode_files=(".vscode/settings.json" ".vscode/tasks.json" ".vscode/launch.json")
    for file in "${vscode_files[@]}"; do
        if [ -f "$file" ]; then
            echo "✅ $file: CONFIGURADO"
        else
            echo "⚠️  $file: NO CONFIGURADO"
        fi
    done
}

# Función para deploy manual
manual_deploy() {
    echo "🚀 DEPLOY MANUAL A PRODUCCIÓN"
    echo "=============================="
    echo "📝 Últimos cambios:"
    git log --oneline -3
    echo ""
    echo "⚠️  RECUERDA:"
    echo "   1. Hacer git push (ya hecho)"
    echo "   2. Entrar a Coolify dashboard"
    echo "   3. Hacer deploy manual del proyecto"
    echo "   4. Verificar logs hasta 'PLATFORM STARTED'"
    echo ""
    echo "🌐 URLs importantes:"
    echo "   • Coolify: https://app.cloude.es"
    echo "   • Producción: https://whatsapp.cloude.es"
    echo "   • GitHub: https://github.com/ramautos/whatsapp-ghl-multi-tenant-platform"
}

# Función para ver logs
view_logs() {
    echo "📋 LOGS EN TIEMPO REAL"
    echo "====================="
    if [ -f "server.log" ]; then
        echo "📊 Presiona Ctrl+C para salir"
        tail -f server.log
    else
        echo "⚠️  No hay logs disponibles"
        echo "💡 Inicia el servidor primero (opción 1)"
    fi
}

# Función para modo power (abrir todo)
power_mode() {
    echo "🔥 MODO POWER - ABRIENDO TODAS LAS HERRAMIENTAS"
    echo "==============================================="
    
    # Iniciar servidor si no está corriendo
    start_server
    
    # Abrir dashboards
    sleep 1
    open_dev_dashboard
    sleep 1
    open_prod_dashboard
    
    # Abrir VS Code con proyecto
    echo "💻 Abriendo VS Code..."
    code .
    
    # Mostrar información útil
    echo ""
    echo "🎯 TODAS LAS HERRAMIENTAS ACTIVAS:"
    echo "   • Servidor: http://localhost:3000"
    echo "   • Live Server: http://localhost:5500 (VS Code)"
    echo "   • Thunder Client: Panel lateral VS Code"
    echo "   • SQLite Viewer: Click en database/multitenant.db"
    echo "   • Git Lens: Integrado en VS Code"
    echo "   • Tasks: Cmd+Shift+P → 'Tasks: Run Task'"
    echo ""
    echo "⌨️  ATAJOS DE TECLADO:"
    echo "   • Cmd+Shift+S: Start Server"
    echo "   • Cmd+Shift+T: Test APIs"
    echo "   • Cmd+Shift+O: Open Local"
    echo "   • Cmd+Shift+P: Open Production"
    echo "   • Cmd+Shift+D: Quick Deploy"
}

# Loop principal
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1) start_server ;;
        2) test_apis ;;
        3) open_dev_dashboard ;;
        4) open_prod_dashboard ;;
        5) check_database ;;
        6) git_status ;;
        7) full_check ;;
        8) manual_deploy ;;
        9) view_logs ;;
        10) power_mode ;;
        0) echo "👋 ¡Hasta luego!"; exit 0 ;;
        *) echo "❌ Opción inválida" ;;
    esac
    
    echo ""
    echo "Presiona Enter para continuar..."
    read -r
done