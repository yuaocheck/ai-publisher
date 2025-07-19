import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_callback_error`)
      }

      if (data.user) {
        // Check if user has any organizations
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', data.user.id)
          .limit(1)

        if (!memberships || memberships.length === 0) {
          // New user - redirect to onboarding
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
        } else {
          // Existing user - redirect to dashboard
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        }
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=unexpected_error`)
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}
