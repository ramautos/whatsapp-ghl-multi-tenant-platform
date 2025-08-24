#!/usr/bin/env node
// 🔥 SCRIPT RADICAL: FORZAR CREACIÓN DE INSTANCIAS
// Este script crea instancias directamente sin depender de otros servicios

require('dotenv').config();
const axios = require('axios');
const db = require('./config/database-sqlite');

const LOCATION_ID = 'jtEqGdhkoR6iePmZaCmd';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

console.log('🔥 INICIANDO CREACIÓN FORZADA DE INSTANCIAS');
console.log(`📍 Location ID: ${LOCATION_ID}`);
console.log(`⚡ Evolution API: ${EVOLUTION_API_URL}`);
console.log(`🔑 API Key: ${EVOLUTION_API_KEY ? 'Configurado' : 'NO CONFIGURADO'}`);

async function forceCreateInstances() {
    try {
        // 1. REGISTRAR CLIENTE EN BD
        console.log('\n1️⃣ Registrando cliente en base de datos...');
        
        try {
            await db.query(`
                INSERT OR REPLACE INTO ghl_installations 
                (location_id, company_name, email, access_token, refresh_token, created_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                LOCATION_ID,
                'RAY ALVARADO - FORCED CREATION', 
                'ray@cloude.es',
                'forced-token',
                'forced-refresh'
            ]);
            console.log('✅ Cliente registrado en BD');
        } catch (dbError) {
            console.log('⚠️ Cliente ya existe o error BD:', dbError.message);
        }

        // 2. CREAR 5 INSTANCIAS EN BD
        console.log('\n2️⃣ Creando 5 instancias en base de datos...');
        
        for (let position = 1; position <= 5; position++) {
            try {
                await db.query(`
                    INSERT OR REPLACE INTO whatsapp_instances 
                    (location_id, position, status, webhook_url, created_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                `, [
                    LOCATION_ID,
                    position,
                    'inactive',
                    `${APP_URL}/webhook/messages?location=${LOCATION_ID}&instance=${position}`
                ]);
                console.log(`   ✅ Instancia ${position} creada en BD`);
            } catch (error) {
                console.log(`   ⚠️ Error instancia ${position}:`, error.message);
            }
        }

        // 3. CREAR INSTANCIAS EN EVOLUTION API
        console.log('\n3️⃣ Creando instancias en Evolution API...');
        
        for (let position = 1; position <= 5; position++) {
            const instanceName = `${LOCATION_ID}_wa_${position}`;
            
            try {
                console.log(`   🔄 Creando ${instanceName} en Evolution API...`);
                
                // Crear instancia
                const response = await axios.post(
                    `${EVOLUTION_API_URL}/instance/create`,
                    {
                        instanceName: instanceName,
                        qrcode: true,
                        integration: 'WHATSAPP-BAILEYS',
                        webhookUrl: `${APP_URL}/webhook/messages?location=${LOCATION_ID}&instance=${position}`,
                        webhookByEvents: true,
                        webhookBase64: false
                    },
                    {
                        headers: {
                            'apikey': EVOLUTION_API_KEY,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000 // 30 segundos timeout
                    }
                );

                console.log(`   ✅ ${instanceName} creada en Evolution API`);
                
                // Actualizar BD con ID de Evolution
                await db.query(`
                    UPDATE whatsapp_instances 
                    SET evolution_instance_id = ?, status = 'created'
                    WHERE location_id = ? AND position = ?
                `, [instanceName, LOCATION_ID, position]);

            } catch (evolutionError) {
                console.log(`   ❌ Error creando ${instanceName}:`, evolutionError.message);
                if (evolutionError.response) {
                    console.log(`   📄 Response:`, evolutionError.response.data);
                }
            }

            // Esperar entre creaciones
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // 4. VERIFICAR INSTANCIAS CREADAS
        console.log('\n4️⃣ Verificando instancias creadas...');
        
        const [instances] = await db.query(
            'SELECT * FROM whatsapp_instances WHERE location_id = ? ORDER BY position',
            [LOCATION_ID]
        );

        console.log(`📊 Total instancias en BD: ${instances.length}`);
        instances.forEach(instance => {
            console.log(`   ${instance.position}: ${instance.status} - ${instance.evolution_instance_id || 'Sin Evolution ID'}`);
        });

        // 5. PROBAR GENERACIÓN QR DE LA PRIMERA INSTANCIA
        console.log('\n5️⃣ Probando generación QR de la primera instancia...');
        
        try {
            const firstInstanceName = `${LOCATION_ID}_wa_1`;
            const qrResponse = await axios.get(
                `${EVOLUTION_API_URL}/instance/connect/${firstInstanceName}`,
                {
                    headers: { 'apikey': EVOLUTION_API_KEY },
                    timeout: 15000
                }
            );

            if (qrResponse.data && qrResponse.data.code) {
                console.log('🎉 ¡QR CODE GENERADO EXITOSAMENTE!');
                console.log(`📱 QR Code length: ${qrResponse.data.code.length} characters`);
                
                // Guardar QR en BD
                const qrCodeData = `data:image/png;base64,${qrResponse.data.code}`;
                await db.query(`
                    UPDATE whatsapp_instances 
                    SET qr_code = ?, status = 'qr_pending'
                    WHERE location_id = ? AND position = ?
                `, [qrCodeData, LOCATION_ID, 1]);

                console.log('✅ QR code guardado en BD');
            } else {
                console.log('❌ No se pudo generar QR code');
                console.log('📄 Response:', qrResponse.data);
            }
        } catch (qrError) {
            console.log('❌ Error generando QR:', qrError.message);
            if (qrError.response) {
                console.log('📄 QR Response:', qrError.response.data);
            }
        }

        console.log('\n🎯 PROCESO COMPLETADO');
        console.log(`📍 Dashboard: ${APP_URL}/dashboard/${LOCATION_ID}`);
        console.log(`🔧 Admin: ${APP_URL}/admin-super`);

    } catch (error) {
        console.error('💥 ERROR CRÍTICO:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    forceCreateInstances()
        .then(() => {
            console.log('\n✅ SCRIPT COMPLETADO EXITOSAMENTE');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 SCRIPT FALLÓ:', error);
            process.exit(1);
        });
}

module.exports = { forceCreateInstances };