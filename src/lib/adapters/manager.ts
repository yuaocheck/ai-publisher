import { BaseSocialAdapter, type OAuthConfig } from './base'
import { TwitterAdapter } from './twitter'
import { FacebookAdapter } from './facebook'
// Import other adapters as they are created

export type SupportedPlatform = 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube'

export interface PlatformConfig {
  name: string
  displayName: string
  icon: string
  color: string
  isActive: boolean
  requiredScopes: string[]
  defaultScopes: string[]
  features: string[]
  limits: {
    maxTextLength: number
    maxMediaCount: number
    supportedMediaTypes: string[]
    maxMediaSize: number
  }
}

export class AdapterManager {
  private adapters: Map<SupportedPlatform, BaseSocialAdapter> = new Map()
  private configs: Map<SupportedPlatform, PlatformConfig> = new Map()

  constructor() {
    this.initializePlatformConfigs()
  }

  private initializePlatformConfigs() {
    this.configs.set('twitter', {
      name: 'twitter',
      displayName: 'Twitter/X',
      icon: 'twitter',
      color: '#1DA1F2',
      isActive: true,
      requiredScopes: ['tweet.read', 'tweet.write', 'users.read'],
      defaultScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      features: ['text', 'images', 'videos', 'gifs', 'polls', 'threads'],
      limits: {
        maxTextLength: 280,
        maxMediaCount: 4,
        supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
        maxMediaSize: 5 * 1024 * 1024, // 5MB
      },
    })

    this.configs.set('facebook', {
      name: 'facebook',
      displayName: 'Facebook',
      icon: 'facebook',
      color: '#1877F2',
      isActive: true,
      requiredScopes: ['pages_manage_posts', 'pages_read_engagement'],
      defaultScopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
      features: ['text', 'images', 'videos', 'albums', 'links'],
      limits: {
        maxTextLength: 63206,
        maxMediaCount: 10,
        supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'video/mov'],
        maxMediaSize: 4 * 1024 * 1024 * 1024, // 4GB
      },
    })

    this.configs.set('instagram', {
      name: 'instagram',
      displayName: 'Instagram',
      icon: 'instagram',
      color: '#E4405F',
      isActive: false, // Will be implemented later
      requiredScopes: ['instagram_basic', 'instagram_content_publish'],
      defaultScopes: ['instagram_basic', 'instagram_content_publish'],
      features: ['images', 'videos', 'stories', 'reels'],
      limits: {
        maxTextLength: 2200,
        maxMediaCount: 10,
        supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
        maxMediaSize: 100 * 1024 * 1024, // 100MB
      },
    })

    this.configs.set('linkedin', {
      name: 'linkedin',
      displayName: 'LinkedIn',
      icon: 'linkedin',
      color: '#0A66C2',
      isActive: false, // Will be implemented later
      requiredScopes: ['w_member_social'],
      defaultScopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
      features: ['text', 'images', 'videos', 'articles'],
      limits: {
        maxTextLength: 3000,
        maxMediaCount: 9,
        supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
        maxMediaSize: 200 * 1024 * 1024, // 200MB
      },
    })

    this.configs.set('tiktok', {
      name: 'tiktok',
      displayName: 'TikTok',
      icon: 'tiktok',
      color: '#000000',
      isActive: false, // Will be implemented later
      requiredScopes: ['video.upload'],
      defaultScopes: ['user.info.basic', 'video.upload'],
      features: ['videos', 'effects'],
      limits: {
        maxTextLength: 2200,
        maxMediaCount: 1,
        supportedMediaTypes: ['video/mp4'],
        maxMediaSize: 287 * 1024 * 1024, // 287MB
      },
    })

    this.configs.set('youtube', {
      name: 'youtube',
      displayName: 'YouTube',
      icon: 'youtube',
      color: '#FF0000',
      isActive: false, // Will be implemented later
      requiredScopes: ['https://www.googleapis.com/auth/youtube.upload'],
      defaultScopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'],
      features: ['videos', 'shorts', 'playlists'],
      limits: {
        maxTextLength: 5000,
        maxMediaCount: 1,
        supportedMediaTypes: ['video/mp4', 'video/mov', 'video/avi'],
        maxMediaSize: 128 * 1024 * 1024 * 1024, // 128GB
      },
    })
  }

  initializeAdapter(platform: SupportedPlatform, oauthConfig: OAuthConfig): BaseSocialAdapter {
    let adapter: BaseSocialAdapter

    switch (platform) {
      case 'twitter':
        adapter = new TwitterAdapter(oauthConfig)
        break
      case 'facebook':
        adapter = new FacebookAdapter(oauthConfig)
        break
      // Add other platforms as they are implemented
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    this.adapters.set(platform, adapter)
    return adapter
  }

  getAdapter(platform: SupportedPlatform): BaseSocialAdapter | undefined {
    return this.adapters.get(platform)
  }

  getPlatformConfig(platform: SupportedPlatform): PlatformConfig | undefined {
    return this.configs.get(platform)
  }

  getAllPlatformConfigs(): Map<SupportedPlatform, PlatformConfig> {
    return new Map(this.configs)
  }

  getActivePlatforms(): SupportedPlatform[] {
    return Array.from(this.configs.entries())
      .filter(([_, config]) => config.isActive)
      .map(([platform, _]) => platform)
  }

  isPlatformSupported(platform: string): platform is SupportedPlatform {
    return this.configs.has(platform as SupportedPlatform)
  }

  isPlatformActive(platform: SupportedPlatform): boolean {
    const config = this.configs.get(platform)
    return config?.isActive ?? false
  }

  getOAuthConfig(platform: SupportedPlatform): OAuthConfig {
    const config = this.getPlatformConfig(platform)
    if (!config) {
      throw new Error(`Platform ${platform} not found`)
    }

    // Get OAuth credentials from environment variables
    const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`]
    const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`]
    const redirectUri = process.env[`${platform.toUpperCase()}_REDIRECT_URI`] || 
                       `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/${platform}`

    if (!clientId || !clientSecret) {
      throw new Error(`Missing OAuth credentials for ${platform}`)
    }

    return {
      clientId,
      clientSecret,
      redirectUri,
      scopes: config.defaultScopes,
    }
  }

  async createAdapter(platform: SupportedPlatform): Promise<BaseSocialAdapter> {
    if (!this.isPlatformActive(platform)) {
      throw new Error(`Platform ${platform} is not active`)
    }

    const existingAdapter = this.getAdapter(platform)
    if (existingAdapter) {
      return existingAdapter
    }

    const oauthConfig = this.getOAuthConfig(platform)
    return this.initializeAdapter(platform, oauthConfig)
  }

  async validateAllAdapters(): Promise<{ [key in SupportedPlatform]?: boolean }> {
    const results: { [key in SupportedPlatform]?: boolean } = {}
    
    for (const platform of this.getActivePlatforms()) {
      try {
        const oauthConfig = this.getOAuthConfig(platform)
        results[platform] = !!(oauthConfig.clientId && oauthConfig.clientSecret)
      } catch (error) {
        results[platform] = false
      }
    }

    return results
  }

  // Utility methods for content adaptation
  adaptContentForPlatform(platform: SupportedPlatform, content: any): any {
    const adapter = this.getAdapter(platform)
    if (!adapter) {
      throw new Error(`No adapter found for platform: ${platform}`)
    }
    return adapter.adaptContent(content)
  }

  validateContentForPlatform(platform: SupportedPlatform, content: any): { valid: boolean; errors: string[] } {
    const adapter = this.getAdapter(platform)
    if (!adapter) {
      throw new Error(`No adapter found for platform: ${platform}`)
    }
    return adapter.validateContent(content)
  }

  // Batch operations
  async publishToMultiplePlatforms(
    platforms: SupportedPlatform[],
    content: any,
    tokens: { [key in SupportedPlatform]?: string }
  ): Promise<{ [key in SupportedPlatform]?: any }> {
    const results: { [key in SupportedPlatform]?: any } = {}

    const publishPromises = platforms.map(async (platform) => {
      const adapter = this.getAdapter(platform)
      const token = tokens[platform]

      if (!adapter || !token) {
        results[platform] = { success: false, error: 'Missing adapter or token' }
        return
      }

      try {
        const adaptedContent = adapter.adaptContent(content)
        const result = await adapter.publishPost(adaptedContent, token)
        results[platform] = result
      } catch (error) {
        results[platform] = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    await Promise.allSettled(publishPromises)
    return results
  }
}

// Singleton instance
export const adapterManager = new AdapterManager()
