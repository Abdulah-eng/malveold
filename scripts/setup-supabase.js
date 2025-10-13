#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase Setup Script for DeliverEase');
console.log('==========================================\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create a .env.local file with your Supabase credentials.\n');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('- SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

// Read and validate .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let missingVars = [];
requiredVars.forEach(varName => {
  if (!envContent.includes(varName) || envContent.includes(`${varName}=your_`)) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ Missing or incomplete environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nPlease update your .env.local file with actual Supabase credentials.\n');
  process.exit(1);
}

console.log('✅ Environment variables configured correctly!');

// Check if Supabase CLI is available
const { execSync } = require('child_process');
try {
  execSync('npx supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is available');
} catch (error) {
  console.log('⚠️  Supabase CLI not found, but this is optional for local development');
}

console.log('\n📋 Next Steps:');
console.log('1. Create a Supabase project at https://supabase.com/dashboard');
console.log('2. Copy your project URL and API keys to .env.local');
console.log('3. Run the database migrations in your Supabase SQL Editor:');
console.log('   - Copy contents of supabase/migrations/001_initial_schema.sql');
console.log('   - Copy contents of supabase/migrations/002_sample_data.sql');
console.log('4. Start your development server: npm run dev');
console.log('5. Test the application at http://localhost:3000');

console.log('\n🎉 Setup complete! Your DeliverEase app is ready for Supabase integration.');
