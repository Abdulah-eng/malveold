import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { email, password, data } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: result, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: result.user }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


