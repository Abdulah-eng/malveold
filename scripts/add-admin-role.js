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

async function addAdminRole() {
  try {
    console.log('Adding admin role to database...')
    
    // First, add the admin value to the enum
    const { error: enumError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';"
    })
    
    if (enumError) {
      console.log('Enum already exists or error:', enumError.message)
    } else {
      console.log('✅ Admin role added to enum')
    }

    // Add admin policies
    const policies = [
      {
        name: "Admins can view all profiles",
        table: "profiles",
        operation: "SELECT",
        policy: "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
      },
      {
        name: "Admins can update all profiles", 
        table: "profiles",
        operation: "UPDATE",
        policy: "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
      },
      {
        name: "Admins can view all products",
        table: "products", 
        operation: "SELECT",
        policy: "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
      },
      {
        name: "Admins can update all products",
        table: "products",
        operation: "UPDATE", 
        policy: "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
      },
      {
        name: "Admins can delete all products",
        table: "products",
        operation: "DELETE",
        policy: "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
      },
      {
        name: "Admins can view all orders",
        table: "orders",
        operation: "SELECT", 
        policy: "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
      },
      {
        name: "Admins can update all orders",
        table: "orders",
        operation: "UPDATE",
        policy: "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
      },
      {
        name: "Admins can view all order items",
        table: "order_items",
        operation: "SELECT",
        policy: "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
      },
      {
        name: "Admins can view all cart items", 
        table: "cart_items",
        operation: "SELECT",
        policy: "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
      }
    ]

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "${policy.name}" ON ${policy.table} FOR ${policy.operation} USING (${policy.policy});`
      })
      
      if (error) {
        console.log(`Policy ${policy.name} already exists or error:`, error.message)
      } else {
        console.log(`✅ Policy ${policy.name} created`)
      }
    }

    console.log('✅ Admin role setup completed!')
    
  } catch (error) {
    console.error('Error setting up admin role:', error)
  }
}

addAdminRole()
