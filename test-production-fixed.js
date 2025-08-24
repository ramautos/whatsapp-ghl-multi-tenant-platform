#!/usr/bin/env node

// 🧪 CREAR INSTALACIÓN DE PRUEBA EN PRODUCCIÓN DESPUÉS DE CORRECCIONES JAVASCRIPT

const axios = require('axios');

async function createProductionTestInstallation() {
    const testInstallation = {
        locationId: `PROD_JS_FIXED_TEST_${Date.now()}`,
        companyName: 'Production Test Company (JS Fixed)',
        clientData: {
            name: 'Production Test Client JS Fixed',
            email: 'prod-test-js-fixed@example.com',
            phone: '+1234567890'
        }
    };

    try {
        console.log('🌍 Creating production test installation after JavaScript fixes...');
        
        // 1. Registrar instalación GHL en PRODUCCIÓN
        const ghlResponse = await axios.post('https://whatsapp.cloude.es/api/ghl/install', {
            locationId: testInstallation.locationId,
            companyName: testInstallation.companyName,
            accessToken: 'prod_test_access_token_fixed_js',
            refreshToken: 'prod_test_refresh_token_fixed_js',
            scopes: ['conversations.readonly', 'conversations.write']
        });

        console.log('✅ Production GHL Installation registered');
        console.log('✅ Production client setup automatic (part of GHL installation)');

        // 2. URLs del dashboard en PRODUCCIÓN
        const dashboardUrl = `https://whatsapp.cloude.es/dashboard/${testInstallation.locationId}`;
        const simpleDashboardUrl = `https://whatsapp.cloude.es/simple/${testInstallation.locationId}`;

        console.log('\n🎯 PRODUCTION TEST INSTALLATION CREATED SUCCESSFULLY!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📍 Location ID: ${testInstallation.locationId}`);
        console.log(`🏢 Company: ${testInstallation.companyName}`);
        console.log(`👤 Client: ${testInstallation.clientData.name}`);
        console.log('\n🌍 PRODUCTION URLs para probar:');
        console.log(`📱 Dashboard Completo: ${dashboardUrl}`);
        console.log(`📱 Dashboard Simple: ${simpleDashboardUrl}`);
        console.log('\n⚡ Prueba el botón "Conectar" en PRODUCCIÓN para verificar correcciones JavaScript');
        console.log('🔗 Evolution API podrá conectar desde https://evolutionv2.cloude.es');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Abrir automáticamente el dashboard en producción
        const { exec } = require('child_process');
        exec(`open "${dashboardUrl}"`, (error) => {
            if (error) {
                console.log('💡 Abre manualmente:', dashboardUrl);
            }
        });

    } catch (error) {
        console.error('❌ Error creating production test installation:', error.response?.data || error.message);
        
        if (error.response?.status === 502 || error.response?.status === 503) {
            console.log('\n💡 El servidor de producción puede estar actualizándose.');
            console.log('🔄 Espera unos minutos y vuelve a intentarlo.');
            console.log('🌍 O verifica el estado en: https://app.cloude.es');
        }
    }
}

createProductionTestInstallation();