import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase-server'

export async function POST() {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Logout error:', err)
    return NextResponse.json({ error: err?.message || 'Logout failed' }, { status: 500 })
  }
}

