import type { SocialAccount, Post, Task } from '@/types'

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface TokenData {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  tokenType?: string
}

export interface PostContent {
  text: string
  mediaUrls?: string[]
  metadata?: Record<string, any>
}

export interface PublishResult {
  success: boolean
  platformPostId?: string
  error?: string
  metadata?: Record<string, any>
}

export interface UserProfile {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  followerCount?: number
  metadata?: Record<string, any>
}

export interface PlatformMetrics {
  impressions?: number
  likes?: number
  comments?: number
  shares?: number
  clicks?: number
  engagementRate?: number
  metadata?: Record<string, any>
}

export abstract class BaseSocialAdapter {
  protected platform: string
  protected config: OAuthConfig

  constructor(platform: string, config: OAuthConfig) {
    this.platform = platform
    this.config = config
  }

  // OAuth methods
  abstract getAuthUrl(state?: string): string
  abstract exchangeCodeForToken(code: string, state?: string): Promise<TokenData>
  abstract refreshToken(refreshToken: string): Promise<TokenData>
  abstract revokeToken(accessToken: string): Promise<boolean>

  // User profile methods
  abstract getUserProfile(accessToken: string): Promise<UserProfile>
  abstract validateToken(accessToken: string): Promise<boolean>

  // Content publishing methods
  abstract publishPost(content: PostContent, accessToken: string): Promise<PublishResult>
  abstract deletePost(platformPostId: string, accessToken: string): Promise<boolean>
  abstract getPost(platformPostId: string, accessToken: string): Promise<any>

  // Analytics methods
  abstract getPostMetrics(platformPostId: string, accessToken: string): Promise<PlatformMetrics>

  // Content validation methods
  abstract validateContent(content: PostContent): { valid: boolean; errors: string[] }
  abstract adaptContent(content: PostContent): PostContent

  // Rate limiting
  abstract getRateLimits(): { requests: number; window: number } // requests per window (seconds)
  abstract checkRateLimit(accessToken: string): Promise<{ remaining: number; resetAt: Date }>

  // Platform-specific features
  abstract getSupportedFeatures(): string[]
  abstract getContentLimits(): {
    maxTextLength: number
    maxMediaCount: number
    supportedMediaTypes: string[]
    maxMediaSize: number
  }

  // Helper methods
  protected generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  protected isTokenExpired(expiresAt?: Date): boolean {
    if (!expiresAt) return false
    return new Date() >= expiresAt
  }

  protected formatError(error: any): string {
    if (typeof error === 'string') return error
    if (error.message) return error.message
    if (error.error_description) return error.error_description
    if (error.error) return error.error
    return 'Unknown error occurred'
  }

  // URL building helper
  protected buildUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
    return url.toString()
  }

  // HTTP request helper
  protected async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      throw new Error(this.formatError(errorData))
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }
    return response.text()
  }

  // Media upload helper
  protected async uploadMedia(
    mediaUrl: string,
    accessToken: string,
    uploadEndpoint: string
  ): Promise<string> {
    // This is a base implementation - platforms may override
    const mediaResponse = await fetch(mediaUrl)
    const mediaBlob = await mediaResponse.blob()
    
    const formData = new FormData()
    formData.append('media', mediaBlob)

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Media upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.media_id || result.id || result.url
  }

  // Content sanitization
  protected sanitizeText(text: string): string {
    // Remove or replace problematic characters
    return text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim()
  }

  // URL shortening (if needed)
  protected async shortenUrl(url: string): Promise<string> {
    // Base implementation - platforms can override with their preferred service
    return url
  }

  // Hashtag processing
  protected extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w\u4e00-\u9fff]+/g
    return text.match(hashtagRegex) || []
  }

  // Mention processing
  protected extractMentions(text: string): string[] {
    const mentionRegex = /@[\w\u4e00-\u9fff]+/g
    return text.match(mentionRegex) || []
  }

  // Platform name getter
  getPlatform(): string {
    return this.platform
  }

  // Config getter
  getConfig(): OAuthConfig {
    return { ...this.config }
  }
}
