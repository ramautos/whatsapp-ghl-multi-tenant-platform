#!/usr/bin/env node

// 🔥 HERRAMIENTAS DE DESARROLLO - VERSIÓN NODE.JS
// Funciona perfectamente en terminal VS Code

const { exec, spawn } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🚀 WHATSAPP-GHL PLATFORM - HERRAMIENTAS DE DESARROLLO');
console.log('=====================================================\n');

const tools = {
    '1': {
        name: '🚀 Start Server',
        action: () => {
            console.log('🔧 Iniciando servidor...');
            const server = spawn('node', ['server-multitenant.js'], {
                stdio: 'inherit',
                detached: false
            });
            server.on('error', (err) => {
                console.error('❌ Error iniciando servidor:', err.message);
            });
        }
    },
    '2': {
        name: '🧪 Test All APIs',
        action: () => {
            console.log('🧪 Ejecutando tests...');
            exec('./verify-production.sh', (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Error: ${error.message}`);
                    return;
                }
                console.log(stdout);
            });
        }
    },
    '3': {
        name: '📱 Open Local Dashboard',
        action: () => {
            console.log('📱 Abriendo dashboard local...');
            exec('open http://localhost:3000', (error) => {
                if (error) {
                    console.error(`❌ Error: ${error.message}`);
                } else {
                    console.log('✅ Dashboard local abierto');
                }
            });
        }
    },
    '4': {
        name: '🌐 Open Production',
        action: () => {
            console.log('🌐 Abriendo producción...');
            exec('open https://whatsapp.cloude.es', (error) => {
                if (error) {
                    console.error(`❌ Error: ${error.message}`);
                } else {
                    console.log('✅ Dashboard producción abierto');
                }
            });
        }
    },
    '5': {
        name: '📊 Git Status',
        action: () => {
            exec('git status', (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Error: ${error.message}`);
                    return;
                }
                console.log(stdout);
                showMenu();
            });
        }
    },
    '6': {
        name: '🗄️ Check Database',
        action: () => {
            const dbPath = path.join(__dirname, 'database', 'multitenant.db');
            if (fs.existsSync(dbPath)) {
                const stats = fs.statSync(dbPath);
                console.log('✅ Base de datos existe');
                console.log(`📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
                console.log('💡 Usa SQLite Viewer en VS Code para ver tablas');
            } else {
                console.log('⚠️  Base de datos no encontrada');
                console.log('🔧 Se creará automáticamente al usar la app');
            }
            showMenu();
        }
    },
    '7': {
        name: '🚀 Quick Deploy',
        action: () => {
            console.log('🚀 Haciendo deploy rápido...');
            exec('git add . && git commit -m "Quick update" && git push', (error, stdout) => {
                if (error) {
                    console.error(`❌ Error: ${error.message}`);
                } else {
                    console.log('✅ Deploy completado');
                    console.log(stdout);
                }
                showMenu();
            });
        }
    },
    '8': {
        name: '🔥 POWER MODE (Abrir TODO)',
        action: () => {
            console.log('\n🔥 POWER MODE ACTIVADO - Abriendo TODO...\n');
            
            // Start server
            const server = spawn('node', ['server-multitenant.js'], {
                stdio: 'inherit',
                detached: true
            });
            
            setTimeout(() => {
                // Open dashboards
                exec('open http://localhost:3000');
                exec('open https://whatsapp.cloude.es');
                console.log('\n✅ Todas las herramientas activadas:');
                console.log('   • Servidor: http://localhost:3000');
                console.log('   • Producción: https://whatsapp.cloude.es');
                console.log('   • Live Server: Click derecho en HTML → Open with Live Server');
                console.log('   • Thunder Client: Panel lateral VS Code');
                console.log('   • SQLite Viewer: Click en database/multitenant.db\n');
            }, 2000);
        }
    },
    '0': {
        name: '👋 Salir',
        action: () => {
            console.log('👋 ¡Hasta luego!');
            process.exit(0);
        }
    }
};

function showMenu() {
    console.log('\n🎯 HERRAMIENTAS DISPONIBLES:');
    Object.entries(tools).forEach(([key, tool]) => {
        if (key !== '0') {
            console.log(`${key}. ${tool.name}`);
        }
    });
    console.log('0. 👋 Salir\n');
    
    rl.question('Selecciona una opción: ', (answer) => {
        const tool = tools[answer];
        if (tool) {
            tool.action();
        } else {
            console.log('❌ Opción inválida');
            showMenu();
        }
    });
}

// Iniciar menú
showMenu();

// Manejo de salida
process.on('SIGINT', () => {
    console.log('\n👋 ¡Hasta luego!');
    process.exit(0);
});