import { createClient } from '@supabase/supabase-js'
import { adapterManager } from '@/lib/adapters/manager'
import type { Database } from '@/types/database.types'

// Use service role key for background tasks
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TokenRefreshResult {
  accountId: string
  platform: string
  success: boolean
  error?: string
  newExpiresAt?: string
}

export class TokenRefreshService {
  private static instance: TokenRefreshService
  private refreshInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): TokenRefreshService {
    if (!TokenRefreshService.instance) {
      TokenRefreshService.instance = new TokenRefreshService()
    }
    return TokenRefreshService.instance
  }

  // Start automatic token refresh
  startAutoRefresh(intervalMinutes: number = 60) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    this.refreshInterval = setInterval(async () => {
      await this.refreshExpiredTokens()
    }, intervalMinutes * 60 * 1000)

    console.log(`Token refresh service started with ${intervalMinutes} minute interval`)
  }

  // Stop automatic token refresh
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      console.log('Token refresh service stopped')
    }
  }

  // Get accounts that need token refresh (expiring within 24 hours)
  async getAccountsNeedingRefresh(): Promise<any[]> {
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .not('refresh_token', 'is', null)
      .lt('expires_at', twentyFourHoursFromNow)

    if (error) {
      console.error('Failed to get accounts needing refresh:', error)
      return []
    }

    return data || []
  }

  // Refresh a single account's token
  async refreshAccountToken(account: any): Promise<TokenRefreshResult> {
    const result: TokenRefreshResult = {
      accountId: account.id,
      platform: account.platform,
      success: false,
    }

    try {
      // Create adapter for the platform
      const adapter = await adapterManager.createAdapter(account.platform)
      
      // Refresh the token
      const newTokenData = await adapter.refreshToken(account.refresh_token)

      // Update the account in database
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          auth_token: newTokenData.accessToken,
          refresh_token: newTokenData.refreshToken || account.refresh_token,
          expires_at: newTokenData.expiresAt?.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id)

      if (updateError) {
        throw new Error(`Failed to update account: ${updateError.message}`)
      }

      result.success = true
      result.newExpiresAt = newTokenData.expiresAt?.toISOString()
      
      console.log(`Successfully refreshed token for ${account.platform} account ${account.username}`)
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Failed to refresh token for ${account.platform} account ${account.username}:`, error)

      // If refresh fails, mark account as needing attention
      await this.markAccountAsExpired(account.id, result.error)
    }

    return result
  }

  // Mark account as expired/needing attention
  async markAccountAsExpired(accountId: string, error: string) {
    await supabase
      .from('accounts')
      .update({
        metadata: {
          tokenRefreshError: error,
          lastRefreshAttempt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
  }

  // Refresh all expired tokens
  async refreshExpiredTokens(): Promise<TokenRefreshResult[]> {
    console.log('Starting token refresh cycle...')
    
    const accounts = await this.getAccountsNeedingRefresh()
    
    if (accounts.length === 0) {
      console.log('No accounts need token refresh')
      return []
    }

    console.log(`Found ${accounts.length} accounts needing token refresh`)

    const results: TokenRefreshResult[] = []
    
    // Process accounts in batches to avoid overwhelming APIs
    const batchSize = 5
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize)
      
      const batchPromises = batch.map(account => this.refreshAccountToken(account))
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            accountId: batch[index].id,
            platform: batch[index].platform,
            success: false,
            error: result.reason?.message || 'Promise rejected',
          })
        }
      })

      // Wait between batches to respect rate limits
      if (i + batchSize < accounts.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    console.log(`Token refresh cycle completed: ${successCount} successful, ${failureCount} failed`)

    // Send notification if there are failures
    if (failureCount > 0) {
      await this.notifyTokenRefreshFailures(results.filter(r => !r.success))
    }

    return results
  }

  // Validate all active tokens
  async validateAllTokens(): Promise<{ valid: number; invalid: number; errors: string[] }> {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)

    if (error) {
      throw new Error(`Failed to get accounts: ${error.message}`)
    }

    let validCount = 0
    let invalidCount = 0
    const errors: string[] = []

    for (const account of accounts || []) {
      try {
        const adapter = await adapterManager.createAdapter(account.platform)
        const isValid = await adapter.validateToken(account.auth_token)
        
        if (isValid) {
          validCount++
        } else {
          invalidCount++
          errors.push(`${account.platform}:${account.username} - Invalid token`)
          
          // Mark as needing refresh
          await this.markAccountAsExpired(account.id, 'Token validation failed')
        }
      } catch (error) {
        invalidCount++
        const errorMsg = `${account.platform}:${account.username} - ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        
        await this.markAccountAsExpired(account.id, errorMsg)
      }
    }

    return { valid: validCount, invalid: invalidCount, errors }
  }

  // Send notification about token refresh failures
  private async notifyTokenRefreshFailures(failures: TokenRefreshResult[]) {
    // This could send emails, Slack notifications, etc.
    // For now, just log the failures
    console.warn('Token refresh failures:', failures)
    
    // You could implement webhook notifications here
    // await this.sendWebhookNotification('token_refresh_failures', failures)
  }

  // Manual refresh for a specific account
  async manualRefreshAccount(accountId: string): Promise<TokenRefreshResult> {
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single()

    if (error || !account) {
      return {
        accountId,
        platform: 'unknown',
        success: false,
        error: 'Account not found',
      }
    }

    return this.refreshAccountToken(account)
  }

  // Get refresh statistics
  async getRefreshStats(): Promise<{
    totalAccounts: number
    activeAccounts: number
    expiringSoon: number
    needsRefresh: number
  }> {
    const [totalResult, activeResult, expiringSoonResult, needsRefreshResult] = await Promise.all([
      supabase.from('accounts').select('id', { count: 'exact' }),
      supabase.from('accounts').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('accounts').select('id', { count: 'exact' })
        .eq('is_active', true)
        .lt('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('accounts').select('id', { count: 'exact' })
        .eq('is_active', true)
        .lt('expires_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
    ])

    return {
      totalAccounts: totalResult.count || 0,
      activeAccounts: activeResult.count || 0,
      expiringSoon: expiringSoonResult.count || 0,
      needsRefresh: needsRefreshResult.count || 0,
    }
  }
}

// Export singleton instance
export const tokenRefreshService = TokenRefreshService.getInstance()

// Auto-start the service in production
if (process.env.NODE_ENV === 'production') {
  tokenRefreshService.startAutoRefresh(60) // Check every hour
}
