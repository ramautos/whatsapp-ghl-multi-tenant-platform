#!/usr/bin/env node

// 🧪 CREAR INSTALACIÓN DE PRUEBA DESPUÉS DE CORRECCIONES JAVASCRIPT

const axios = require('axios');

async function createTestInstallation() {
    const testInstallation = {
        locationId: `FIXED_JS_ERROR_TEST_${Date.now()}`,
        companyName: 'Test Company (JS Fixed)',
        clientData: {
            name: 'Test Client JS Fixed',
            email: 'test-js-fixed@example.com',
            phone: '+1234567890'
        }
    };

    try {
        console.log('🧪 Creating test installation after JavaScript fixes...');
        
        // 1. Registrar instalación GHL
        const ghlResponse = await axios.post('http://localhost:3000/api/ghl/install', {
            locationId: testInstallation.locationId,
            companyName: testInstallation.companyName,
            accessToken: 'test_access_token_fixed_js',
            refreshToken: 'test_refresh_token_fixed_js',
            scopes: ['conversations.readonly', 'conversations.write']
        });

        console.log('✅ GHL Installation registered');
        console.log('✅ Client setup automatic (part of GHL installation)');

        // 3. URL del dashboard
        const dashboardUrl = `http://localhost:3000/dashboard/${testInstallation.locationId}`;
        const simpleDashboardUrl = `http://localhost:3000/simple/${testInstallation.locationId}`;

        console.log('\n🎯 TEST INSTALLATION CREATED SUCCESSFULLY!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📍 Location ID: ${testInstallation.locationId}`);
        console.log(`🏢 Company: ${testInstallation.companyName}`);
        console.log(`👤 Client: ${testInstallation.clientData.name}`);
        console.log('\n🔗 URLs para probar:');
        console.log(`📱 Dashboard Completo: ${dashboardUrl}`);
        console.log(`📱 Dashboard Simple: ${simpleDashboardUrl}`);
        console.log('\n⚡ Prueba el botón "Conectar" para verificar que el error JavaScript esté corregido');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error creating test installation:', error.response?.data || error.message);
    }
}

createTestInstallation();