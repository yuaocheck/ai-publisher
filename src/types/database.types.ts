export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
          updated_at: string
          owner_id: string
          settings: Json | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
          updated_at?: string
          owner_id: string
          settings?: Json | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          owner_id?: string
          settings?: Json | null
        }
      }
      accounts: {
        Row: {
          id: string
          org_id: string
          platform: string
          platform_user_id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          auth_token: string
          refresh_token: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          org_id: string
          platform: string
          platform_user_id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          auth_token: string
          refresh_token?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          org_id?: string
          platform?: string
          platform_user_id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          auth_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
      }
      posts: {
        Row: {
          id: string
          org_id: string
          title: string
          content: string
          media_urls: string[] | null
          platforms: string[]
          status: 'draft' | 'scheduled' | 'published' | 'failed'
          scheduled_at: string | null
          published_at: string | null
          created_at: string
          updated_at: string
          created_by: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          content: string
          media_urls?: string[] | null
          platforms: string[]
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          scheduled_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          content?: string
          media_urls?: string[] | null
          platforms?: string[]
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          scheduled_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          metadata?: Json | null
        }
      }
      tasks: {
        Row: {
          id: string
          post_id: string
          platform: string
          account_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          scheduled_at: string
          executed_at: string | null
          retry_count: number
          error_message: string | null
          platform_post_id: string | null
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          post_id: string
          platform: string
          account_id: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          scheduled_at: string
          executed_at?: string | null
          retry_count?: number
          error_message?: string | null
          platform_post_id?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          post_id?: string
          platform?: string
          account_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          scheduled_at?: string
          executed_at?: string | null
          retry_count?: number
          error_message?: string | null
          platform_post_id?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
      }
      metrics: {
        Row: {
          id: string
          task_id: string
          platform_post_id: string
          impressions: number | null
          likes: number | null
          comments: number | null
          shares: number | null
          clicks: number | null
          engagement_rate: number | null
          collected_at: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          task_id: string
          platform_post_id: string
          impressions?: number | null
          likes?: number | null
          comments?: number | null
          shares?: number | null
          clicks?: number | null
          engagement_rate?: number | null
          collected_at: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          task_id?: string
          platform_post_id?: string
          impressions?: number | null
          likes?: number | null
          comments?: number | null
          shares?: number | null
          clicks?: number | null
          engagement_rate?: number | null
          collected_at?: string
          created_at?: string
          metadata?: Json | null
        }
      }
      api_keys: {
        Row: {
          id: string
          org_id: string
          name: string
          key_hash: string
          permissions: string[]
          is_active: boolean
          last_used_at: string | null
          expires_at: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          key_hash: string
          permissions: string[]
          is_active?: boolean
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          key_hash?: string
          permissions?: string[]
          is_active?: boolean
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
          created_by?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
