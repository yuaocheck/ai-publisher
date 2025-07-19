export interface Platform {
  id: string
  name: string
  displayName: string
  icon: string
  color: string
  isActive: boolean
  maxTextLength?: number
  supportedMediaTypes: string[]
  requirements: {
    imageSize?: {
      min: { width: number; height: number }
      max: { width: number; height: number }
      recommended: { width: number; height: number }
    }
    videoSize?: {
      maxDuration: number // seconds
      maxFileSize: number // bytes
      supportedFormats: string[]
    }
  }
}

export interface SocialAccount {
  id: string
  platform: string
  username: string
  displayName?: string
  avatarUrl?: string
  isConnected: boolean
  lastSync?: string
  followerCount?: number
  metadata?: Record<string, any>
}

export interface Post {
  id: string
  title: string
  content: string
  mediaUrls?: string[]
  platforms: string[]
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledAt?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  tasks?: Task[]
  metrics?: PostMetrics
}

export interface Task {
  id: string
  postId: string
  platform: string
  accountId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  scheduledAt: string
  executedAt?: string
  retryCount: number
  errorMessage?: string
  platformPostId?: string
  metadata?: Record<string, any>
}

export interface PostMetrics {
  impressions?: number
  likes?: number
  comments?: number
  shares?: number
  clicks?: number
  engagementRate?: number
  collectedAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  ownerId: string
  settings?: {
    timezone?: string
    defaultPlatforms?: string[]
    aiSettings?: {
      model?: string
      temperature?: number
      maxTokens?: number
    }
  }
}

export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  organizations: Organization[]
  currentOrgId?: string
}

export interface APIKey {
  id: string
  name: string
  keyPreview: string // Only first 8 chars + ...
  permissions: string[]
  isActive: boolean
  lastUsedAt?: string
  expiresAt?: string
  createdAt: string
}

export interface WebhookEvent {
  id: string
  type: 'post.published' | 'post.failed' | 'metrics.updated' | 'account.connected' | 'account.disconnected'
  data: Record<string, any>
  timestamp: string
  organizationId: string
}

export interface AIGenerationRequest {
  type: 'text' | 'image' | 'video'
  prompt: string
  options?: {
    style?: string
    tone?: string
    length?: number
    temperature?: number
    platforms?: string[]
  }
}

export interface AIGenerationResponse {
  id: string
  type: 'text' | 'image' | 'video'
  content: string | string[] // text content or media URLs
  metadata?: {
    model?: string
    tokens?: number
    processingTime?: number
  }
}

export interface ContentTemplate {
  id: string
  name: string
  description?: string
  content: string
  variables: string[]
  platforms: string[]
  category?: string
  isPublic: boolean
  createdBy: string
  createdAt: string
}

export interface ScheduleRule {
  type: 'once' | 'daily' | 'weekly' | 'monthly'
  startDate: string
  endDate?: string
  time: string
  timezone: string
  daysOfWeek?: number[] // 0-6, Sunday = 0
  dayOfMonth?: number // 1-31
}

export interface Analytics {
  period: {
    start: string
    end: string
  }
  totalPosts: number
  totalImpressions: number
  totalEngagements: number
  averageEngagementRate: number
  platformBreakdown: {
    platform: string
    posts: number
    impressions: number
    engagements: number
    engagementRate: number
  }[]
  topPosts: {
    id: string
    title: string
    platform: string
    impressions: number
    engagements: number
    engagementRate: number
  }[]
}
