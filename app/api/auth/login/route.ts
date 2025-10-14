import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '../../../../lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Auth error:', error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.log('Auth successful, user ID:', data.user.id)

    // Use admin client to fetch profile (bypasses RLS)
    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    console.log('Profile query result:', { profile, profileError })

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError)
    }

    return NextResponse.json({ 
      user: data.user,
      profile: profile || null,
      session: data.session
    }, { status: 200 })
  } catch (err: any) {
    console.error('Login route error:', err)
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


