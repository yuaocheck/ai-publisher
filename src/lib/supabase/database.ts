import { createClient } from './client'
import type { Database } from '@/types/database.types'
import type { Organization, Post, Task, SocialAccount, PostMetrics } from '@/types'

type Tables = Database['public']['Tables']

export class DatabaseService {
  private supabase = createClient()

  // Organization methods
  async createOrganization(name: string, slug: string, description?: string) {
    const { data, error } = await this.supabase.rpc('create_organization', {
      org_name: name,
      org_slug: slug,
      org_description: description
    })

    if (error) throw error
    return data
  }

  async getOrganizations() {
    const { data, error } = await this.supabase
      .from('organizations')
      .select(`
        *,
        organization_members!inner(role)
      `)

    if (error) throw error
    return data
  }

  async getOrganization(id: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select(`
        *,
        organization_members(
          user_id,
          role,
          joined_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async getOrganizationStats(orgId: string) {
    const { data, error } = await this.supabase.rpc('get_org_stats', {
      org_id: orgId
    })

    if (error) throw error
    return data
  }

  // Account methods
  async getAccounts(orgId: string) {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async createAccount(account: Omit<Tables['accounts']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('accounts')
      .insert(account)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAccount(id: string, updates: Partial<Tables['accounts']['Update']>) {
    const { data, error } = await this.supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAccount(id: string) {
    const { error } = await this.supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Post methods
  async getPosts(orgId: string, options?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase
      .from('posts')
      .select(`
        *,
        tasks(
          id,
          platform,
          status,
          scheduled_at,
          executed_at,
          error_message
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  async getPost(id: string) {
    const { data, error } = await this.supabase
      .from('posts')
      .select(`
        *,
        tasks(
          id,
          platform,
          account_id,
          status,
          scheduled_at,
          executed_at,
          retry_count,
          error_message,
          platform_post_id,
          accounts(username, display_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createPost(post: Omit<Tables['posts']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('posts')
      .insert(post)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updatePost(id: string, updates: Partial<Tables['posts']['Update']>) {
    const { data, error } = await this.supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deletePost(id: string) {
    const { error } = await this.supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async schedulePost(postId: string, scheduleTime: string) {
    const { data, error } = await this.supabase.rpc('schedule_post', {
      post_id: postId,
      schedule_time: scheduleTime
    })

    if (error) throw error
    return data
  }

  // Task methods
  async getTasks(options?: {
    postId?: string
    status?: string
    platform?: string
    limit?: number
  }) {
    let query = this.supabase
      .from('tasks')
      .select(`
        *,
        posts(title, org_id),
        accounts(username, display_name, platform)
      `)
      .order('scheduled_at', { ascending: false })

    if (options?.postId) {
      query = query.eq('post_id', options.postId)
    }

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.platform) {
      query = query.eq('platform', options.platform)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  async updateTask(id: string, updates: Partial<Tables['tasks']['Update']>) {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Metrics methods
  async getPostMetrics(taskId: string) {
    const { data, error } = await this.supabase
      .from('metrics')
      .select('*')
      .eq('task_id', taskId)
      .order('collected_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return data
  }

  async createMetrics(metrics: Omit<Tables['metrics']['Insert'], 'id' | 'created_at'>) {
    const { data, error } = await this.supabase
      .from('metrics')
      .insert(metrics)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getAnalytics(orgId: string, startDate?: string, endDate?: string) {
    const { data, error } = await this.supabase.rpc('get_post_analytics', {
      org_id: orgId,
      start_date: startDate,
      end_date: endDate
    })

    if (error) throw error
    return data
  }

  // Template methods
  async getContentTemplates(orgId?: string) {
    let query = this.supabase
      .from('content_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (orgId) {
      query = query.or(`org_id.eq.${orgId},is_public.eq.true`)
    } else {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  async createContentTemplate(template: Omit<Tables['content_templates']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('content_templates')
      .insert(template)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // API Key methods
  async getApiKeys(orgId: string) {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('id, name, permissions, is_active, last_used_at, expires_at, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async generateApiKey(orgId: string, name: string, permissions: string[], expiresInDays?: number) {
    const { data, error } = await this.supabase.rpc('generate_api_key', {
      org_id: orgId,
      key_name: name,
      key_permissions: permissions,
      expires_in_days: expiresInDays
    })

    if (error) throw error
    return data
  }

  async revokeApiKey(id: string) {
    const { error } = await this.supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }
}

export const db = new DatabaseService()
