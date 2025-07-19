import { useState, useCallback } from 'react'
import { useAuth } from '@/components/providers'
import { aiService } from '@/lib/supabase/ai-service'
import toast from 'react-hot-toast'

export interface AIGenerationOptions {
  type: 'social_post' | 'blog_article' | 'marketing_copy' | 'product_description'
  platform?: string
  tone?: 'professional' | 'casual' | 'friendly' | 'humorous' | 'inspiring' | 'urgent'
  length?: 'short' | 'medium' | 'long'
  keywords?: string[]
  targetAudience?: string
  language?: string
}

export interface AIOptimizationOptions {
  originalContent: string
  platform: string
  objective: 'engagement' | 'reach' | 'conversion' | 'brand_awareness'
  targetAudience?: string
}

export interface AIUsageStats {
  today: { requests: number; tokens: number }
  thisMonth: { requests: number; tokens: number }
  total: { requests: number; tokens: number }
  dailyLimit: number
  canUseAI: boolean
}

export function useAI() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null)

  // 生成内容
  const generateContent = useCallback(async (prompt: string, options: AIGenerationOptions) => {
    if (!user) {
      toast.error('请先登录')
      return null
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, options }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('今日 AI 生成次数已用完，请明天再试')
        } else {
          toast.error(data.error || '生成失败')
        }
        return null
      }

      toast.success('内容生成成功！')
      
      // 更新使用统计
      if (data.usage) {
        await refreshUsageStats()
      }

      return data.content
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error('生成失败，请重试')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // 优化内容
  const optimizeContent = useCallback(async (options: AIOptimizationOptions) => {
    if (!user) {
      toast.error('请先登录')
      return null
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('今日 AI 优化次数已用完，请明天再试')
        } else {
          toast.error(data.error || '优化失败')
        }
        return null
      }

      toast.success('内容优化成功！')
      
      // 更新使用统计
      if (data.usage) {
        await refreshUsageStats()
      }

      return data.optimizedContent
    } catch (error) {
      console.error('AI optimization error:', error)
      toast.error('优化失败，请重试')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // 生成标签建议
  const suggestHashtags = useCallback(async (content: string, platform: string, industry?: string, count = 10) => {
    if (!user) {
      toast.error('请先登录')
      return []
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, platform, industry, count }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || '标签生成失败')
        return []
      }

      return data.hashtags || []
    } catch (error) {
      console.error('AI hashtag suggestion error:', error)
      toast.error('标签生成失败，请重试')
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // 分析内容
  const analyzeContent = useCallback(async (content: string, platform: string) => {
    if (!user) {
      toast.error('请先登录')
      return null
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, platform }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || '内容分析失败')
        return null
      }

      return data
    } catch (error) {
      console.error('AI content analysis error:', error)
      toast.error('内容分析失败，请重试')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // 获取使用统计
  const refreshUsageStats = useCallback(async () => {
    if (!user) return

    try {
      const stats = await aiService.getAIUsageStats(user.id)
      const dailyLimit = 10 // 可以根据用户订阅计划调整
      
      setUsageStats({
        ...stats,
        dailyLimit,
        canUseAI: stats.today.requests < dailyLimit
      })
    } catch (error) {
      console.error('Failed to get AI usage stats:', error)
    }
  }, [user])

  // 生成内容变体
  const generateVariations = useCallback(async (originalContent: string, count = 3) => {
    if (!user) {
      toast.error('请先登录')
      return []
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalContent, count }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || '变体生成失败')
        return []
      }

      toast.success('内容变体生成成功！')
      return data.variations || []
    } catch (error) {
      console.error('AI variations error:', error)
      toast.error('变体生成失败，请重试')
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // 获取发布时间建议
  const suggestPostingTime = useCallback(async (platform: string, targetAudience?: string) => {
    if (!user) {
      toast.error('请先登录')
      return null
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/posting-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform, targetAudience }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || '时间建议生成失败')
        return null
      }

      return data
    } catch (error) {
      console.error('AI posting time suggestion error:', error)
      toast.error('时间建议生成失败，请重试')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    // 状态
    loading,
    usageStats,
    
    // 方法
    generateContent,
    optimizeContent,
    suggestHashtags,
    analyzeContent,
    generateVariations,
    suggestPostingTime,
    refreshUsageStats,
  }
}

// AI 偏好设置 Hook
export function useAIPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadPreferences = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const prefs = await aiService.getAIPreferences(user.id)
      setPreferences(prefs)
    } catch (error) {
      console.error('Failed to load AI preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const updatePreferences = useCallback(async (updates: any) => {
    if (!user) return

    setLoading(true)
    try {
      const updatedPrefs = await aiService.updateAIPreferences(user.id, updates)
      setPreferences(updatedPrefs)
      toast.success('AI 偏好设置已更新')
    } catch (error) {
      console.error('Failed to update AI preferences:', error)
      toast.error('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    preferences,
    loading,
    loadPreferences,
    updatePreferences,
  }
}
