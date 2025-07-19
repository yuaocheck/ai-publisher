import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { adapterManager, type SupportedPlatform } from '@/lib/adapters/manager'
import type { Database } from '@/types/database.types'

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform as SupportedPlatform
    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('org_id')

    // Validate platform
    if (!adapterManager.isPlatformSupported(platform)) {
      return NextResponse.json(
        { error: 'Unsupported platform' },
        { status: 400 }
      )
    }

    if (!adapterManager.isPlatformActive(platform)) {
      return NextResponse.json(
        { error: 'Platform is not active' },
        { status: 400 }
      )
    }

    // Validate user authentication
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate organization membership if orgId is provided
    if (orgId) {
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single()

      if (membershipError || !membership) {
        return NextResponse.json(
          { error: 'Access denied to organization' },
          { status: 403 }
        )
      }

      // Check if user has permission to connect accounts
      if (!['owner', 'admin', 'editor'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions to connect accounts' },
          { status: 403 }
        )
      }
    }

    // Create adapter and get OAuth URL
    const adapter = await adapterManager.createAdapter(platform)
    const state = JSON.stringify({
      platform,
      userId: user.id,
      orgId,
      timestamp: Date.now(),
    })

    const authUrl = adapter.getAuthUrl(state)

    return NextResponse.json({
      authUrl,
      platform,
      state,
    })
  } catch (error) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform as SupportedPlatform
    const body = await request.json()
    const { code, state } = body

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      )
    }

    // Parse and validate state
    let stateData
    try {
      stateData = JSON.parse(state)
    } catch {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      )
    }

    const { platform: statePlatform, userId, orgId, timestamp } = stateData

    // Validate state
    if (statePlatform !== platform) {
      return NextResponse.json(
        { error: 'Platform mismatch' },
        { status: 400 }
      )
    }

    // Check if state is not too old (5 minutes)
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: 'State expired' },
        { status: 400 }
      )
    }

    // Validate user authentication
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create adapter and exchange code for token
    const adapter = await adapterManager.createAdapter(platform)
    const tokenData = await adapter.exchangeCodeForToken(code, state)

    // Get user profile from the platform
    const userProfile = await adapter.getUserProfile(tokenData.accessToken)

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('org_id', orgId)
      .eq('platform', platform)
      .eq('platform_user_id', userProfile.id)
      .single()

    if (existingAccount) {
      // Update existing account
      const { data: updatedAccount, error: updateError } = await supabase
        .from('accounts')
        .update({
          username: userProfile.username,
          display_name: userProfile.displayName,
          avatar_url: userProfile.avatarUrl,
          auth_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          expires_at: tokenData.expiresAt?.toISOString(),
          is_active: true,
          metadata: {
            ...userProfile.metadata,
            followerCount: userProfile.followerCount,
            tokenType: tokenData.tokenType,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update account:', updateError)
        return NextResponse.json(
          { error: 'Failed to update account' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        account: updatedAccount,
        message: 'Account updated successfully',
      })
    } else {
      // Create new account
      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          org_id: orgId,
          platform,
          platform_user_id: userProfile.id,
          username: userProfile.username,
          display_name: userProfile.displayName,
          avatar_url: userProfile.avatarUrl,
          auth_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          expires_at: tokenData.expiresAt?.toISOString(),
          is_active: true,
          metadata: {
            ...userProfile.metadata,
            followerCount: userProfile.followerCount,
            tokenType: tokenData.tokenType,
          },
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create account:', createError)
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        account: newAccount,
        message: 'Account connected successfully',
      })
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json(
      { error: 'Failed to complete OAuth flow' },
      { status: 500 }
    )
  }
}
