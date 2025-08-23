#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function setupConfiguration() {
  console.log('🚀 CONFIGURACIÓN EVOLUTION API + GHL INTEGRATION\n');
  
  try {
    // Leer archivo .env actual
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    console.log('📋 Configura las siguientes credenciales:\n');
    
    // Evolution API
    console.log('🔗 EVOLUTION API:');
    const evolutionUrl = await question('URL de Evolution API: ');
    const evolutionKey = await question('API Key de Evolution: ');
    
    // GoHighLevel
    console.log('\n📊 GOHIGHLEVEL:');
    const ghlToken = await question('Access Token de GHL: ');
    const ghlLocationId = await question('Location ID de GHL: ');
    
    // Database
    console.log('\n🗄️ BASE DE DATOS:');
    const dbPassword = await question('Password de PostgreSQL (o Enter para default): ') || 'evolution_pass';
    
    // OpenAI
    console.log('\n🤖 OPENAI:');
    const openaiKey = await question('API Key de OpenAI: ');
    
    // Actualizar archivo .env
    envContent = envContent
      .replace(/EVOLUTION_API_URL=.*/, `EVOLUTION_API_URL=${evolutionUrl}`)
      .replace(/EVOLUTION_API_KEY=.*/, `EVOLUTION_API_KEY=${evolutionKey}`)
      .replace(/GHL_ACCESS_TOKEN=.*/, `GHL_ACCESS_TOKEN=${ghlToken}`)
      .replace(/GHL_LOCATION_ID=.*/, `GHL_LOCATION_ID=${ghlLocationId}`)
      .replace(/POSTGRES_PASSWORD=.*/, `POSTGRES_PASSWORD=${dbPassword}`)
      .replace(/OPENAI_API_KEY=.*/, `OPENAI_API_KEY=${openaiKey}`);
    
    // Guardar archivo actualizado
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Configuración guardada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. npm install');
    console.log('2. docker-compose up -d postgres redis');
    console.log('3. npm run dev');
    console.log('\n🔍 Verifica tu configuración en: http://localhost:3000/health');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

setupConfiguration();