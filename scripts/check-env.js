#!/usr/bin/env node

/**
 * Script to verify environment variables are properly configured
 * Run: node scripts/check-env.js
 */

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const optionalVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'API_BASE_URL',
];

console.log('🔍 Verificando configuración de variables de entorno...\n');

let hasErrors = false;

// Check required variables
console.log('📋 Variables REQUERIDAS:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ❌ ${varName}: NO CONFIGURADA`);
    hasErrors = true;
  } else if (value.includes('your_') || value.includes('tu_') || value.includes('your-project')) {
    console.log(`  ⚠️  ${varName}: Usando valor de ejemplo (necesitas configurar tu valor real)`);
    hasErrors = true;
  } else {
    console.log(`  ✅ ${varName}: Configurada`);
  }
});

// Check optional variables
console.log('\n📋 Variables OPCIONALES:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ℹ️  ${varName}: No configurada (opcional)`);
  } else if (value.includes('your_') || value.includes('tu_')) {
    console.log(`  ⚠️  ${varName}: Usando valor de ejemplo`);
  } else {
    console.log(`  ✅ ${varName}: Configurada`);
  }
});

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('\n❌ ERROR: Faltan variables de entorno requeridas\n');
  console.log('📖 Lee la guía de configuración:');
  console.log('   cat CONFIGURATION_GUIDE.md\n');
  console.log('🔧 Pasos para solucionar:');
  console.log('   1. Ve a https://supabase.com/dashboard/project/_/settings/api');
  console.log('   2. Copia tu Project URL y anon key');
  console.log('   3. Edita el archivo .env.local');
  console.log('   4. Reemplaza los valores de ejemplo con tus credenciales reales');
  console.log('   5. Reinicia el servidor de desarrollo\n');
  process.exit(1);
} else {
  console.log('\n✅ ¡Todas las variables requeridas están configuradas!\n');
  console.log('🚀 Puedes ejecutar el servidor con: npm run dev\n');
  process.exit(0);
}
