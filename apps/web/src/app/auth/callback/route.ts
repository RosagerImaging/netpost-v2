import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        console.log('Successfully exchanged code for session')
        // Successful authentication - redirect to dashboard or specified next page
        const redirectUrl = new URL(next, origin)
        return NextResponse.redirect(redirectUrl)
      } else {
        console.error('Error exchanging code for session:', error)
        // Authentication failed - redirect to login with error
        const errorUrl = new URL('/login?error=auth_failed', origin)
        return NextResponse.redirect(errorUrl)
      }
    } catch (error) {
      console.error('Exception during code exchange:', error)
      // Unexpected error - redirect to login with error
      const errorUrl = new URL('/login?error=server_error', origin)
      return NextResponse.redirect(errorUrl)
    }
  }

  // No code provided - redirect to login
  const loginUrl = new URL('/login?error=no_code', origin)
  return NextResponse.redirect(loginUrl)
}