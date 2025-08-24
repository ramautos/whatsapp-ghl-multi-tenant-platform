#!/usr/bin/env node
// 🧪 TEST DEL NUEVO SISTEMA GHL-EVOLUTION
// Script para probar el sistema completo de registro automático

require('dotenv').config();
const axios = require('axios');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const TEST_LOCATION_ID = 'FINAL_PRODUCTION_TEST_' + Date.now();

async function testNewSystem() {
    try {
        console.log('🚀 PROBANDO NUEVO SISTEMA GHL-EVOLUTION');
        console.log(`📍 Location ID de prueba: ${TEST_LOCATION_ID}`);
        console.log(`🌐 App URL: ${APP_URL}`);

        // 1. SIMULAR INSTALACIÓN DESDE GHL MARKETPLACE
        console.log('\n1️⃣ Simulando instalación desde GHL Marketplace...');
        
        try {
            const installResponse = await axios.post(`${APP_URL}/api/ghl/install`, {
                locationId: TEST_LOCATION_ID,
                companyName: 'TEST COMPANY - NEW SYSTEM',
                email: 'test@newsystem.com',
                accessToken: 'test-access-token-123',
                refreshToken: 'test-refresh-token-456'
            });

            console.log('✅ Respuesta de instalación:', installResponse.data);
            
            if (!installResponse.data.success) {
                console.log('❌ Error en instalación:', installResponse.data.error);
                return;
            }
            
        } catch (error) {
            console.log('❌ Error instalando:', error.message);
            return;
        }

        // 2. VERIFICAR INSTANCIAS CREADAS
        console.log('\n2️⃣ Verificando instancias creadas...');
        
        try {
            const instancesResponse = await axios.get(`${APP_URL}/api/instances/${TEST_LOCATION_ID}`);
            
            console.log('📊 Respuesta de instancias:', instancesResponse.data);
            
            if (instancesResponse.data.success) {
                console.log(`✅ Total instancias: ${instancesResponse.data.instances.length}`);
                instancesResponse.data.instances.forEach(instance => {
                    console.log(`   Instancia ${instance.position}: ${instance.status} - ${instance.hasQrCode ? 'Con QR' : 'Sin QR'}`);
                });
            }
            
        } catch (error) {
            console.log('❌ Error obteniendo instancias:', error.message);
        }

        // 3. PROBAR GENERACIÓN QR PARA PRIMERA INSTANCIA
        console.log('\n3️⃣ Probando generación QR para instancia 1...');
        
        try {
            const qrResponse = await axios.post(`${APP_URL}/api/instances/${TEST_LOCATION_ID}/1/connect`);
            
            if (qrResponse.data.success) {
                console.log('🎉 ¡QR CODE GENERADO EXITOSAMENTE!');
                console.log(`📱 QR Code length: ${qrResponse.data.qrCode?.length || 0} characters`);
            } else {
                console.log('⚠️ No se pudo generar QR:', qrResponse.data.error);
            }
            
        } catch (error) {
            console.log('❌ Error generando QR:', error.message);
        }

        // 4. PROBAR DASHBOARD
        console.log('\n4️⃣ URLs para probar manualmente:');
        console.log(`📱 Dashboard: ${APP_URL}/dashboard/${TEST_LOCATION_ID}`);
        console.log(`📊 Admin: ${APP_URL}/admin-super`);
        console.log(`🔍 Instancias API: ${APP_URL}/api/instances/${TEST_LOCATION_ID}`);

        console.log('\n✅ TEST COMPLETADO');
        
    } catch (error) {
        console.error('💥 ERROR CRÍTICO EN TEST:', error);
    }
}

// Ejecutar test
if (require.main === module) {
    testNewSystem()
        .then(() => {
            console.log('\n🎯 Test del nuevo sistema completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test falló:', error);
            process.exit(1);
        });
}

module.exports = { testNewSystem, TEST_LOCATION_ID };