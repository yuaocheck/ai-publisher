import { BaseSocialAdapter, type OAuthConfig, type TokenData, type PostContent, type PublishResult, type UserProfile, type PlatformMetrics } from './base'

export class TwitterAdapter extends BaseSocialAdapter {
  private readonly baseUrl = 'https://api.twitter.com/2'
  private readonly authUrl = 'https://twitter.com/i/oauth2/authorize'
  private readonly tokenUrl = 'https://api.twitter.com/2/oauth2/token'

  constructor(config: OAuthConfig) {
    super('twitter', config)
  }

  getAuthUrl(state?: string): string {
    const params = {
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state || this.generateState(),
      code_challenge: 'challenge', // In production, generate proper PKCE
      code_challenge_method: 'plain',
    }

    return this.buildUrl(this.authUrl, params)
  }

  async exchangeCodeForToken(code: string, state?: string): Promise<TokenData> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code,
      code_verifier: 'challenge', // In production, use proper PKCE
    })

    const response = await this.makeRequest(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: response.expires_in 
        ? new Date(Date.now() + response.expires_in * 1000)
        : undefined,
      tokenType: response.token_type,
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
    })

    const response = await this.makeRequest(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token || refreshToken,
      expiresAt: response.expires_in 
        ? new Date(Date.now() + response.expires_in * 1000)
        : undefined,
      tokenType: response.token_type,
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        token: accessToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      })

      await this.makeRequest(`${this.baseUrl}/oauth2/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      return true
    } catch (error) {
      console.error('Failed to revoke Twitter token:', error)
      return false
    }
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await this.makeRequest(`${this.baseUrl}/users/me?user.fields=id,username,name,profile_image_url,public_metrics`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    const user = response.data
    return {
      id: user.id,
      username: user.username,
      displayName: user.name,
      avatarUrl: user.profile_image_url,
      followerCount: user.public_metrics?.followers_count,
      metadata: {
        verified: user.verified,
        publicMetrics: user.public_metrics,
      },
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserProfile(accessToken)
      return true
    } catch (error) {
      return false
    }
  }

  async publishPost(content: PostContent, accessToken: string): Promise<PublishResult> {
    try {
      const adaptedContent = this.adaptContent(content)
      const validation = this.validateContent(adaptedContent)
      
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        }
      }

      let mediaIds: string[] = []
      
      // Upload media if present
      if (adaptedContent.mediaUrls && adaptedContent.mediaUrls.length > 0) {
        for (const mediaUrl of adaptedContent.mediaUrls) {
          const mediaId = await this.uploadMedia(mediaUrl, accessToken, 'https://upload.twitter.com/1.1/media/upload.json')
          mediaIds.push(mediaId)
        }
      }

      const tweetData: any = {
        text: adaptedContent.text,
      }

      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds }
      }

      const response = await this.makeRequest(`${this.baseUrl}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tweetData),
      })

      return {
        success: true,
        platformPostId: response.data.id,
        metadata: {
          text: response.data.text,
          createdAt: response.data.created_at,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async deletePost(platformPostId: string, accessToken: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/tweets/${platformPostId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      return true
    } catch (error) {
      console.error('Failed to delete Twitter post:', error)
      return false
    }
  }

  async getPost(platformPostId: string, accessToken: string): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/tweets/${platformPostId}?tweet.fields=created_at,public_metrics,author_id`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )
    return response.data
  }

  async getPostMetrics(platformPostId: string, accessToken: string): Promise<PlatformMetrics> {
    const post = await this.getPost(platformPostId, accessToken)
    const metrics = post.public_metrics || {}

    return {
      impressions: metrics.impression_count,
      likes: metrics.like_count,
      comments: metrics.reply_count,
      shares: metrics.retweet_count + (metrics.quote_count || 0),
      engagementRate: metrics.impression_count > 0 
        ? ((metrics.like_count + metrics.reply_count + metrics.retweet_count) / metrics.impression_count) * 100
        : 0,
      metadata: {
        quoteCount: metrics.quote_count,
        retweetCount: metrics.retweet_count,
        bookmarkCount: metrics.bookmark_count,
      },
    }
  }

  validateContent(content: PostContent): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const limits = this.getContentLimits()

    if (!content.text || content.text.trim().length === 0) {
      errors.push('Tweet text cannot be empty')
    }

    if (content.text.length > limits.maxTextLength) {
      errors.push(`Tweet text exceeds ${limits.maxTextLength} characters`)
    }

    if (content.mediaUrls && content.mediaUrls.length > limits.maxMediaCount) {
      errors.push(`Too many media files (max: ${limits.maxMediaCount})`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  adaptContent(content: PostContent): PostContent {
    const limits = this.getContentLimits()
    let adaptedText = this.sanitizeText(content.text)

    // Truncate if too long
    if (adaptedText.length > limits.maxTextLength) {
      adaptedText = adaptedText.substring(0, limits.maxTextLength - 3) + '...'
    }

    return {
      ...content,
      text: adaptedText,
      mediaUrls: content.mediaUrls?.slice(0, limits.maxMediaCount),
    }
  }

  getRateLimits(): { requests: number; window: number } {
    return { requests: 300, window: 900 } // 300 requests per 15 minutes
  }

  async checkRateLimit(accessToken: string): Promise<{ remaining: number; resetAt: Date }> {
    // This would typically be implemented by checking response headers from API calls
    // For now, return a mock response
    return {
      remaining: 250,
      resetAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    }
  }

  getSupportedFeatures(): string[] {
    return ['text', 'images', 'videos', 'gifs', 'polls', 'threads']
  }

  getContentLimits() {
    return {
      maxTextLength: 280,
      maxMediaCount: 4,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
      maxMediaSize: 5 * 1024 * 1024, // 5MB
    }
  }
}
