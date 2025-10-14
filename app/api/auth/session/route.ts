import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '../../../../lib/supabase-server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ user: null, profile: null }, { status: 200 })
    }

    // Use admin client to fetch profile (bypasses RLS)
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    return NextResponse.json({ 
      user: session.user,
      profile: profile || null
    }, { status: 200 })
  } catch (err: any) {
    console.error('Session route error:', err)
    return NextResponse.json({ user: null, profile: null }, { status: 200 })
  }
}

