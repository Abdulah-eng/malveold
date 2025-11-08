/**
 * Script to create test users using Supabase Admin API
 * Run with: node scripts/create-test-users.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  // Buyers
  { email: 'buyer1@test.com', password: 'password123', name: 'Buyer One', role: 'buyer' },
  { email: 'buyer2@test.com', password: 'password123', name: 'Buyer Two', role: 'buyer' },
  { email: 'buyer3@test.com', password: 'password123', name: 'Buyer Three', role: 'buyer' },
  { email: 'buyer4@test.com', password: 'password123', name: 'Buyer Four', role: 'buyer' },
  // Sellers
  { email: 'seller1@test.com', password: 'password123', name: 'Seller One', role: 'seller' },
  { email: 'seller2@test.com', password: 'password123', name: 'Seller Two', role: 'seller' },
  { email: 'seller3@test.com', password: 'password123', name: 'Seller Three', role: 'seller' },
  { email: 'seller4@test.com', password: 'password123', name: 'Seller Four', role: 'seller' },
  // Drivers
  { email: 'driver1@test.com', password: 'password123', name: 'Driver One', role: 'driver' },
  { email: 'driver2@test.com', password: 'password123', name: 'Driver Two', role: 'driver' },
  { email: 'driver3@test.com', password: 'password123', name: 'Driver Three', role: 'driver' },
  { email: 'driver4@test.com', password: 'password123', name: 'Driver Four', role: 'driver' },
  // Admins
  { email: 'admin1@test.com', password: 'password123', name: 'Admin One', role: 'admin' },
  { email: 'admin2@test.com', password: 'password123', name: 'Admin Two', role: 'admin' },
  { email: 'admin3@test.com', password: 'password123', name: 'Admin Three', role: 'admin' },
  { email: 'admin4@test.com', password: 'password123', name: 'Admin Four', role: 'admin' },
]

async function deleteExistingUsers() {
  console.log('Deleting existing test users...')
  for (const user of testUsers) {
    try {
      // First delete from profiles
      await supabase.from('profiles').delete().eq('email', user.email)
      // Then delete from auth.users using admin API
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users?.find(u => u.email === user.email)
      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id)
        console.log(`Deleted: ${user.email}`)
      }
    } catch (error) {
      // Ignore errors if user doesn't exist
    }
  }
}

async function createUsers() {
  console.log('\nCreating test users...')
  const results = []

  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      })

      if (error) {
        console.error(`Error creating ${user.email}:`, error.message)
        results.push({ email: user.email, status: 'error', error: error.message })
      } else {
        console.log(`✓ Created: ${user.email} (${user.role})`)
        results.push({ email: user.email, status: 'success', role: user.role })
      }
    } catch (error) {
      console.error(`Error creating ${user.email}:`, error.message)
      results.push({ email: user.email, status: 'error', error: error.message })
    }
  }

  return results
}

async function main() {
  console.log('Starting test user creation...\n')
  
  await deleteExistingUsers()
  await new Promise(resolve => setTimeout(resolve, 1000)) // Wait a bit
  
  const results = await createUsers()
  
  console.log('\n=== Summary ===')
  const success = results.filter(r => r.status === 'success').length
  const errors = results.filter(r => r.status === 'error').length
  console.log(`Success: ${success}`)
  console.log(`Errors: ${errors}`)
  
  if (errors > 0) {
    console.log('\nErrors:')
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`  - ${r.email}: ${r.error}`)
    })
  }
  
  console.log('\nDone! You can now login with any test account.')
  console.log('All accounts use password: password123')
}

main().catch(console.error)

