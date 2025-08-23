#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  console.log('🗄️ EJECUTANDO MIGRACIONES DE BASE DE DATOS\n');

  // Configuración de la base de datos
  const dbConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'evolution_ghl',
    user: process.env.POSTGRES_USER || 'evolution_user',
    password: process.env.POSTGRES_PASSWORD || 'evolution_pass'
  };

  console.log('📋 Configuración de la base de datos:');
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}\n`);

  const pool = new Pool(dbConfig);

  try {
    // Probar conexión
    console.log('🔍 Probando conexión...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa!\n');

    // Leer archivo SQL
    const sqlPath = path.join(__dirname, '../database/init.sql');
    console.log('📖 Leyendo archivo de migración...');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Archivo de migración no encontrado: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ Archivo de migración cargado\n');

    // Ejecutar migración
    console.log('🚀 Ejecutando migraciones...');
    await client.query(sqlContent);
    console.log('✅ Migraciones ejecutadas exitosamente!\n');

    // Verificar tablas creadas
    console.log('🔍 Verificando tablas creadas...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Tablas creadas:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Verificar vistas creadas
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (viewsResult.rows.length > 0) {
      console.log('\n📈 Vistas creadas:');
      viewsResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }

    // Verificar reglas de automatización por defecto
    const rulesResult = await client.query('SELECT COUNT(*) as count FROM automation_rules');
    console.log(`\n🤖 Reglas de automatización: ${rulesResult.rows[0].count} insertadas`);

    client.release();
    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    
    console.log('\n📝 Próximos pasos:');
    console.log('1. Verificar que Evolution API esté ejecutándose');
    console.log('2. Configurar las credenciales de GoHighLevel');
    console.log('3. Ejecutar: npm run dev');
    console.log('4. Abrir: http://localhost:3000/qr-scanner.html');

  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solución:');
      console.log('1. Asegúrate de que PostgreSQL esté ejecutándose');
      console.log('2. O ejecuta: docker-compose up -d postgres');
    } else if (error.code === '28P01') {
      console.log('\n💡 Solución:');
      console.log('1. Verifica las credenciales de la base de datos en .env');
      console.log('2. Asegúrate de que el usuario tenga permisos');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Función para crear la base de datos si no existe
async function createDatabaseIfNotExists() {
  const adminConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: 'postgres', // Base de datos por defecto
    user: process.env.POSTGRES_USER || 'evolution_user',
    password: process.env.POSTGRES_PASSWORD || 'evolution_pass'
  };

  const pool = new Pool(adminConfig);

  try {
    const client = await pool.connect();
    
    // Verificar si la base de datos existe
    const dbName = process.env.POSTGRES_DB || 'evolution_ghl';
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`🏗️ Creando base de datos: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Base de datos creada exitosamente!\n');
    } else {
      console.log(`✅ Base de datos ${dbName} ya existe\n`);
    }

    client.release();
  } catch (error) {
    console.log('⚠️ No se pudo crear la base de datos automáticamente');
    console.log('Continuando con las migraciones...\n');
  } finally {
    await pool.end();
  }
}

// Ejecutar script
async function main() {
  try {
    await createDatabaseIfNotExists();
    await runMigrations();
  } catch (error) {
    console.error('❌ Error en el script:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runMigrations, createDatabaseIfNotExists };