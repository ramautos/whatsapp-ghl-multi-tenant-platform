#!/usr/bin/env node
// 🌐 TEST DE PRODUCCIÓN - SISTEMA COMPLETO
// Script para probar el sistema en producción después del deploy

require('dotenv').config();
const axios = require('axios');

const PRODUCTION_URL = 'https://whatsapp.cloude.es';
const TEST_LOCATION_ID = 'PROD_JS_FIXED_TEST_' + Date.now();

async function testProduction() {
    try {
        console.log('🌐 PROBANDO SISTEMA EN PRODUCCIÓN');
        console.log(`📍 Location ID: ${TEST_LOCATION_ID}`);
        console.log(`🚀 Production URL: ${PRODUCTION_URL}`);

        // 1. VERIFICAR QUE PRODUCTION ESTÁ ACTIVO
        console.log('\n1️⃣ Verificando que producción está activo...');
        
        try {
            const healthResponse = await axios.get(`${PRODUCTION_URL}/health`, { timeout: 10000 });
            console.log('✅ Production está activo:', healthResponse.data.status);
        } catch (error) {
            console.log('❌ Production no responde:', error.message);
            return;
        }

        // 2. PROBAR INSTALACIÓN EN PRODUCTION
        console.log('\n2️⃣ Probando instalación GHL en producción...');
        
        try {
            const installResponse = await axios.post(`${PRODUCTION_URL}/api/ghl/install`, {
                locationId: TEST_LOCATION_ID,
                companyName: 'PRODUCTION TEST COMPANY',
                email: 'production-test@example.com'
            }, { timeout: 30000 });

            console.log('✅ Instalación en producción exitosa:', installResponse.data);
            
        } catch (error) {
            console.log('❌ Error en instalación production:', error.message);
            if (error.response) {
                console.log('📄 Response error:', error.response.data);
            }
            return;
        }

        // 3. VERIFICAR INSTANCIAS EN PRODUCTION
        console.log('\n3️⃣ Verificando instancias en producción...');
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5s
        
        try {
            const instancesResponse = await axios.get(`${PRODUCTION_URL}/api/instances/${TEST_LOCATION_ID}`);
            
            if (instancesResponse.data.success) {
                console.log(`📊 Total instancias en prod: ${instancesResponse.data.instances.length}`);
                instancesResponse.data.instances.forEach(instance => {
                    console.log(`   ${instance.position}: ${instance.status} - ${instance.hasQrCode ? '✅ Con QR' : '❌ Sin QR'}`);
                });
            } else {
                console.log('⚠️ Error obteniendo instancias:', instancesResponse.data.error);
            }
            
        } catch (error) {
            console.log('❌ Error verificando instancias:', error.message);
        }

        // 4. PROBAR QR GENERATION EN PRODUCTION
        console.log('\n4️⃣ Probando generación QR en producción...');
        
        try {
            const qrResponse = await axios.post(`${PRODUCTION_URL}/api/instances/${TEST_LOCATION_ID}/1/connect`, {}, {
                timeout: 20000
            });
            
            if (qrResponse.data.success) {
                console.log('🎉 ¡QR GENERADO EN PRODUCCIÓN!');
                console.log(`📱 QR Code length: ${qrResponse.data.qrCode?.length || 0}`);
            } else {
                console.log('⚠️ No se pudo generar QR en prod:', qrResponse.data.error);
            }
            
        } catch (error) {
            console.log('❌ Error generando QR en prod:', error.message);
        }

        // 5. URLS FINALES
        console.log('\n5️⃣ URLs de producción para testing:');
        console.log(`📱 Dashboard: ${PRODUCTION_URL}/dashboard/${TEST_LOCATION_ID}`);
        console.log(`🔧 Admin: ${PRODUCTION_URL}/admin-super`);
        console.log(`📊 Health: ${PRODUCTION_URL}/health`);

        console.log('\n🎯 TEST DE PRODUCCIÓN COMPLETADO');
        
    } catch (error) {
        console.error('💥 ERROR CRÍTICO EN PRODUCCIÓN:', error.message);
    }
}

// Ejecutar test de producción
if (require.main === module) {
    testProduction()
        .then(() => {
            console.log('\n✅ Test de producción completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test de producción falló:', error);
            process.exit(1);
        });
}

module.exports = { testProduction, TEST_LOCATION_ID };