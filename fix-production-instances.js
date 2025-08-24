#!/usr/bin/env node
// 🎯 FIX INSTANCIAS EN PRODUCCIÓN
// Script para conectar instancias existentes en Evolution API con la BD de producción

require('dotenv').config();
const axios = require('axios');

const LOCATION_ID = 'jtEqGdhkoR6iePmZaCmd';
const PRODUCTION_URL = 'https://whatsapp.cloude.es';

async function fixProductionInstances() {
    try {
        console.log('🔥 SOLUCIONANDO INSTANCIAS EN PRODUCCIÓN');
        console.log(`📍 Location ID: ${LOCATION_ID}`);
        console.log(`🌐 Production URL: ${PRODUCTION_URL}`);

        // 1. CREAR CLIENTE EN PRODUCCIÓN
        console.log('\n1️⃣ Registrando cliente en producción...');
        
        try {
            const response = await axios.post(`${PRODUCTION_URL}/api/ghl/install`, {
                locationId: LOCATION_ID,
                companyName: 'RAY ALVARADO - PRODUCTION FIX',
                email: 'ray@cloude.es'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            console.log('✅ Respuesta producción:', response.data);
        } catch (error) {
            console.log('⚠️ Error o cliente ya existe:', error.message);
        }

        // 2. GENERAR QR CODES DIRECTAMENTE
        console.log('\n2️⃣ Generando QR codes para todas las instancias...');
        
        for (let position = 1; position <= 5; position++) {
            try {
                console.log(`   🔄 Generando QR para instancia ${position}...`);
                
                const response = await axios.post(
                    `${PRODUCTION_URL}/api/instances/${LOCATION_ID}/${position}/connect`, 
                    {},
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 20000
                    }
                );

                if (response.data.success) {
                    console.log(`   ✅ QR generado para instancia ${position}`);
                } else {
                    console.log(`   ⚠️ Error generando QR ${position}:`, response.data.error);
                }
            } catch (error) {
                console.log(`   ❌ Error instancia ${position}:`, error.message);
            }

            // Esperar entre requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 3. VERIFICAR ESTADO FINAL
        console.log('\n3️⃣ Verificando estado final...');
        
        try {
            const response = await axios.get(`${PRODUCTION_URL}/api/instances/${LOCATION_ID}`);
            
            if (response.data.success) {
                console.log(`📊 Total instancias: ${response.data.instances.length}`);
                response.data.instances.forEach(instance => {
                    const hasQR = instance.qr_code ? '✅ Con QR' : '❌ Sin QR';
                    console.log(`   ${instance.position}: ${instance.status} - ${hasQR}`);
                });
            } else {
                console.log('❌ Error verificando instancias:', response.data.error);
            }
        } catch (error) {
            console.log('❌ Error en verificación:', error.message);
        }

        console.log('\n🎯 FIX COMPLETADO');
        console.log(`📱 Dashboard: ${PRODUCTION_URL}/dashboard/${LOCATION_ID}`);
        console.log(`🔧 Admin: ${PRODUCTION_URL}/admin-super`);

    } catch (error) {
        console.error('💥 ERROR CRÍTICO:', error);
        process.exit(1);
    }
}

// Ejecutar
if (require.main === module) {
    fixProductionInstances()
        .then(() => {
            console.log('\n✅ FIX DE PRODUCCIÓN COMPLETADO');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 FIX FALLÓ:', error);
            process.exit(1);
        });
}