import { BaseSocialAdapter, type OAuthConfig, type TokenData, type PostContent, type PublishResult, type UserProfile, type PlatformMetrics } from './base'

export class FacebookAdapter extends BaseSocialAdapter {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0'
  private readonly authUrl = 'https://www.facebook.com/v18.0/dialog/oauth'
  private readonly tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token'

  constructor(config: OAuthConfig) {
    super('facebook', config)
  }

  getAuthUrl(state?: string): string {
    const params = {
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(','),
      response_type: 'code',
      state: state || this.generateState(),
    }

    return this.buildUrl(this.authUrl, params)
  }

  async exchangeCodeForToken(code: string, state?: string): Promise<TokenData> {
    const params = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code,
    }

    const response = await this.makeRequest(this.buildUrl(this.tokenUrl, params))

    // Exchange short-lived token for long-lived token
    const longLivedToken = await this.exchangeForLongLivedToken(response.access_token)

    return longLivedToken
  }

  private async exchangeForLongLivedToken(shortLivedToken: string): Promise<TokenData> {
    const params = {
      grant_type: 'fb_exchange_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      fb_exchange_token: shortLivedToken,
    }

    const response = await this.makeRequest(this.buildUrl(this.tokenUrl, params))

    return {
      accessToken: response.access_token,
      expiresAt: response.expires_in 
        ? new Date(Date.now() + response.expires_in * 1000)
        : undefined,
      tokenType: response.token_type || 'bearer',
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    // Facebook doesn't use refresh tokens in the traditional sense
    // Long-lived tokens are valid for 60 days and need to be renewed before expiry
    throw new Error('Facebook uses long-lived tokens that need manual renewal')
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/me/permissions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      return true
    } catch (error) {
      console.error('Failed to revoke Facebook token:', error)
      return false
    }
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await this.makeRequest(
      `${this.baseUrl}/me?fields=id,name,picture.width(200).height(200),followers_count`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    return {
      id: response.id,
      username: response.id, // Facebook doesn't have usernames like Twitter
      displayName: response.name,
      avatarUrl: response.picture?.data?.url,
      followerCount: response.followers_count,
      metadata: {
        facebookId: response.id,
      },
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
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

      let postData: any = {
        message: adaptedContent.text,
      }

      // Handle media uploads
      if (adaptedContent.mediaUrls && adaptedContent.mediaUrls.length > 0) {
        if (adaptedContent.mediaUrls.length === 1) {
          // Single media post
          const mediaUrl = adaptedContent.mediaUrls[0]
          if (this.isVideoUrl(mediaUrl)) {
            postData.source = mediaUrl
            // Use videos endpoint for video posts
            const response = await this.makeRequest(`${this.baseUrl}/me/videos`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(postData),
            })

            return {
              success: true,
              platformPostId: response.id,
              metadata: response,
            }
          } else {
            postData.url = mediaUrl
            // Use photos endpoint for image posts
            const response = await this.makeRequest(`${this.baseUrl}/me/photos`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(postData),
            })

            return {
              success: true,
              platformPostId: response.id,
              metadata: response,
            }
          }
        } else {
          // Multiple media - create album
          return await this.createPhotoAlbum(adaptedContent, accessToken)
        }
      } else {
        // Text-only post
        const response = await this.makeRequest(`${this.baseUrl}/me/feed`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        })

        return {
          success: true,
          platformPostId: response.id,
          metadata: response,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  private async createPhotoAlbum(content: PostContent, accessToken: string): Promise<PublishResult> {
    // Create album first
    const albumData = {
      name: 'AI Publisher Album',
      message: content.text,
    }

    const albumResponse = await this.makeRequest(`${this.baseUrl}/me/albums`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(albumData),
    })

    // Add photos to album
    const photoPromises = content.mediaUrls!.map(async (mediaUrl) => {
      if (!this.isVideoUrl(mediaUrl)) {
        return this.makeRequest(`${this.baseUrl}/${albumResponse.id}/photos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: mediaUrl }),
        })
      }
    })

    await Promise.all(photoPromises.filter(Boolean))

    return {
      success: true,
      platformPostId: albumResponse.id,
      metadata: { type: 'album', ...albumResponse },
    }
  }

  private isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv']
    return videoExtensions.some(ext => url.toLowerCase().includes(ext))
  }

  async deletePost(platformPostId: string, accessToken: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/${platformPostId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      return true
    } catch (error) {
      console.error('Failed to delete Facebook post:', error)
      return false
    }
  }

  async getPost(platformPostId: string, accessToken: string): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/${platformPostId}?fields=id,message,created_time,insights.metric(post_impressions,post_engaged_users,post_clicks)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )
    return response
  }

  async getPostMetrics(platformPostId: string, accessToken: string): Promise<PlatformMetrics> {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/${platformPostId}/insights?metric=post_impressions,post_engaged_users,post_clicks,post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total,post_reactions_haha_total,post_reactions_sorry_total,post_reactions_anger_total`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const metrics: any = {}
      response.data.forEach((metric: any) => {
        if (metric.values && metric.values.length > 0) {
          metrics[metric.name] = metric.values[0].value
        }
      })

      const impressions = metrics.post_impressions || 0
      const engagedUsers = metrics.post_engaged_users || 0
      const totalReactions = (metrics.post_reactions_like_total || 0) +
                           (metrics.post_reactions_love_total || 0) +
                           (metrics.post_reactions_wow_total || 0) +
                           (metrics.post_reactions_haha_total || 0) +
                           (metrics.post_reactions_sorry_total || 0) +
                           (metrics.post_reactions_anger_total || 0)

      return {
        impressions,
        likes: totalReactions,
        clicks: metrics.post_clicks || 0,
        engagementRate: impressions > 0 ? (engagedUsers / impressions) * 100 : 0,
        metadata: metrics,
      }
    } catch (error) {
      console.error('Failed to get Facebook post metrics:', error)
      return {}
    }
  }

  validateContent(content: PostContent): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const limits = this.getContentLimits()

    if (content.text.length > limits.maxTextLength) {
      errors.push(`Post text exceeds ${limits.maxTextLength} characters`)
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

    // Facebook has a much higher character limit, so truncation is rarely needed
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
    return { requests: 200, window: 3600 } // 200 requests per hour
  }

  async checkRateLimit(accessToken: string): Promise<{ remaining: number; resetAt: Date }> {
    // Facebook rate limits are complex and depend on various factors
    // This is a simplified implementation
    return {
      remaining: 180,
      resetAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    }
  }

  getSupportedFeatures(): string[] {
    return ['text', 'images', 'videos', 'albums', 'links']
  }

  getContentLimits() {
    return {
      maxTextLength: 63206,
      maxMediaCount: 10,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'video/mov'],
      maxMediaSize: 4 * 1024 * 1024 * 1024, // 4GB
    }
  }
}
