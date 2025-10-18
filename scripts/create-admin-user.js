const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    // First, let's check if admin role exists in the enum
    const { data: enumData, error: enumError } = await supabase
      .rpc('get_enum_values', { enum_name: 'user_role' })
    
    console.log('Current enum values:', enumData)
    
    // Try to update an existing user to admin role
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }
    
    if (users && users.length > 0) {
      const user = users[0]
      console.log('Found user:', user.email, 'Current role:', user.role)
      
      // Try to update the user to admin role
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select()
      
      if (updateError) {
        console.error('Error updating user role:', updateError)
      } else {
        console.log('✅ User updated to admin role:', updateData)
      }
    } else {
      console.log('No users found to update')
    }
    
  } catch (error) {
    console.error('Error creating admin user:', error)
  }
}

createAdminUser()
