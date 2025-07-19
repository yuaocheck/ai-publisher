import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export type AIUsage = Database['public']['Tables']['ai_usage']['Row']
export type AIGeneration = Database['public']['Tables']['ai_generations']['Row']
export type ContentTemplate = Database['public']['Tables']['content_templates']['Row']
export type AIPreferences = Database['public']['Tables']['ai_preferences']['Row']

export class AIService {
  private supabase

  constructor(isServer = false) {
    if (isServer) {
      this.supabase = createServerComponentClient<Database>({ cookies })
    } else {
      this.supabase = createClientComponentClient<Database>()
    }
  }

  // AI 使用统计相关方法
  async getAIUsage(userId: string, date?: string): Promise<AIUsage | null> {
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    const { data, error } = await this.supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get AI usage: ${error.message}`)
    }

    return data
  }

  async updateAIUsage(userId: string, requestsCount: number, tokensUsed: number): Promise<AIUsage> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await this.supabase
      .from('ai_usage')
      .upsert({
        user_id: userId,
        date: today,
        requests_count: requestsCount,
        tokens_used: tokensUsed,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update AI usage: ${error.message}`)
    }

    return data
  }

  async getAIUsageStats(userId: string): Promise<{
    today: { requests: number; tokens: number }
    thisMonth: { requests: number; tokens: number }
    total: { requests: number; tokens: number }
  }> {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    // 今日使用量
    const { data: todayUsage } = await this.supabase
      .from('ai_usage')
      .select('requests_count, tokens_used')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    // 本月使用量
    const { data: monthUsage } = await this.supabase
      .from('ai_usage')
      .select('requests_count, tokens_used')
      .eq('user_id', userId)
      .gte('date', monthStart)

    // 总使用量
    const { data: totalGenerations } = await this.supabase
      .from('ai_generations')
      .select('tokens_used')
      .eq('user_id', userId)

    const monthRequests = monthUsage?.reduce((sum, item) => sum + (item.requests_count || 0), 0) || 0
    const monthTokens = monthUsage?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0
    const totalTokens = totalGenerations?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0

    return {
      today: {
        requests: todayUsage?.requests_count || 0,
        tokens: todayUsage?.tokens_used || 0
      },
      thisMonth: {
        requests: monthRequests,
        tokens: monthTokens
      },
      total: {
        requests: totalGenerations?.length || 0,
        tokens: totalTokens
      }
    }
  }

  // AI 生成历史相关方法
  async saveAIGeneration(
    userId: string,
    prompt: string,
    generatedContent: string,
    options: any,
    model = 'gemini-1.5-pro',
    tokensUsed = 0
  ): Promise<AIGeneration> {
    const { data, error } = await this.supabase
      .from('ai_generations')
      .insert({
        user_id: userId,
        prompt,
        generated_content: generatedContent,
        options,
        model,
        tokens_used: tokensUsed,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save AI generation: ${error.message}`)
    }

    return data
  }

  async getAIGenerations(userId: string, limit = 50, offset = 0): Promise<AIGeneration[]> {
    const { data, error } = await this.supabase
      .from('ai_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to get AI generations: ${error.message}`)
    }

    return data || []
  }

  async deleteAIGeneration(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_generations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete AI generation: ${error.message}`)
    }
  }

  // 内容模板相关方法
  async getContentTemplates(orgId: string, category?: string, platform?: string): Promise<ContentTemplate[]> {
    let query = this.supabase
      .from('content_templates')
      .select('*')
      .or(`org_id.eq.${orgId},is_public.eq.true`)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (platform && platform !== 'all') {
      query = query.or(`platform.eq.${platform},platform.eq.all`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get content templates: ${error.message}`)
    }

    return data || []
  }

  async createContentTemplate(template: Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ContentTemplate> {
    const { data, error } = await this.supabase
      .from('content_templates')
      .insert(template)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create content template: ${error.message}`)
    }

    return data
  }

  async updateContentTemplate(id: string, updates: Partial<ContentTemplate>): Promise<ContentTemplate> {
    const { data, error } = await this.supabase
      .from('content_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update content template: ${error.message}`)
    }

    return data
  }

  async deleteContentTemplate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('content_templates')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete content template: ${error.message}`)
    }
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    const { error } = await this.supabase
      .rpc('increment_template_usage', { template_id: id })

    if (error) {
      console.error('Failed to increment template usage:', error)
    }
  }

  // AI 偏好设置相关方法
  async getAIPreferences(userId: string): Promise<AIPreferences | null> {
    const { data, error } = await this.supabase
      .from('ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get AI preferences: ${error.message}`)
    }

    return data
  }

  async updateAIPreferences(userId: string, preferences: Partial<AIPreferences>): Promise<AIPreferences> {
    const { data, error } = await this.supabase
      .from('ai_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update AI preferences: ${error.message}`)
    }

    return data
  }

  // 统计和分析方法
  async getPopularTemplates(orgId: string, limit = 10): Promise<ContentTemplate[]> {
    const { data, error } = await this.supabase
      .from('content_templates')
      .select('*')
      .or(`org_id.eq.${orgId},is_public.eq.true`)
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get popular templates: ${error.message}`)
    }

    return data || []
  }

  async getAIGenerationTrends(userId: string, days = 30): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('ai_generations')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to get AI generation trends: ${error.message}`)
    }

    // 按日期分组统计
    const trends: { [key: string]: number } = {}
    data?.forEach(item => {
      const date = item.created_at.split('T')[0]
      trends[date] = (trends[date] || 0) + 1
    })

    return Object.entries(trends).map(([date, count]) => ({ date, count }))
  }
}

// 导出单例实例
export const aiService = new AIService()
export const aiServiceServer = new AIService(true)
