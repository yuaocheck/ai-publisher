// Supabase 数据库配置
const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const supabaseUrl = 'https://sclxktmudzfagwegiyjq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 服务端密钥
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // 匿名密钥

// 创建 Supabase 客户端（服务端使用）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// 创建 Supabase 客户端（客户端使用）
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表名常量
const TABLES = {
    USERS: 'ai_publisher_users',
    SOCIAL_ACCOUNTS: 'social_accounts',
    CONTENT_POSTS: 'content_posts',
    PLATFORM_POSTS: 'platform_posts',
    AI_GENERATION_HISTORY: 'ai_generation_history',
    USER_SETTINGS: 'user_settings',
    ANALYTICS_DATA: 'analytics_data',
    SCHEDULED_TASKS: 'scheduled_tasks'
};

// 数据库视图名常量
const VIEWS = {
    USER_OVERVIEW: 'user_overview',
    CONTENT_POSTS_DETAIL: 'content_posts_detail',
    PLATFORM_STATS: 'platform_stats',
    AI_GENERATION_STATS: 'ai_generation_stats'
};

// 数据库操作辅助函数
class DatabaseHelper {
    constructor() {
        this.admin = supabaseAdmin;
        this.client = supabaseClient;
    }

    // 执行原始 SQL 查询
    async executeQuery(query, params = []) {
        try {
            const { data, error } = await this.admin.rpc('execute_sql', {
                query: query,
                params: params
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    // 获取用户概览
    async getUserOverview(userId = null) {
        let query = this.admin.from(VIEWS.USER_OVERVIEW).select('*');
        
        if (userId) {
            query = query.eq('id', userId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return userId ? data[0] : data;
    }

    // 获取内容发布详情
    async getContentPostsDetail(userId, limit = 50, offset = 0) {
        const { data, error } = await this.admin
            .from(VIEWS.CONTENT_POSTS_DETAIL)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) throw error;
        return data;
    }

    // 获取平台统计
    async getPlatformStats() {
        const { data, error } = await this.admin
            .from(VIEWS.PLATFORM_STATS)
            .select('*')
            .order('total_posts', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    // 获取 AI 生成统计
    async getAIGenerationStats(userId = null) {
        let query = this.admin.from(VIEWS.AI_GENERATION_STATS).select('*');
        
        if (userId) {
            query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query.order('total_generations', { ascending: false });
        if (error) throw error;
        
        return userId ? data[0] : data;
    }

    // 创建用户
    async createUser(userData) {
        const { data, error } = await this.admin
            .from(TABLES.USERS)
            .insert(userData)
            .select()
            .single();
        
        if (error) throw error;
        
        // 同时创建用户设置
        await this.admin
            .from(TABLES.USER_SETTINGS)
            .insert({ user_id: data.id });
        
        return data;
    }

    // 更新用户 API 使用量
    async updateApiUsage(userId, increment = 1) {
        const { data, error } = await this.admin
            .from(TABLES.USERS)
            .update({ 
                api_usage_count: this.admin.raw('api_usage_count + ?', [increment])
            })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // 记录 AI 生成历史
    async recordAIGeneration(generationData) {
        const { data, error } = await this.admin
            .from(TABLES.AI_GENERATION_HISTORY)
            .insert(generationData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // 创建内容发布
    async createContentPost(postData) {
        const { data, error } = await this.admin
            .from(TABLES.CONTENT_POSTS)
            .insert(postData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // 创建平台发布记录
    async createPlatformPost(platformPostData) {
        const { data, error } = await this.admin
            .from(TABLES.PLATFORM_POSTS)
            .insert(platformPostData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // 更新平台发布状态
    async updatePlatformPostStatus(platformPostId, status, additionalData = {}) {
        const updateData = {
            status,
            updated_at: new Date().toISOString(),
            ...additionalData
        };

        const { data, error } = await this.admin
            .from(TABLES.PLATFORM_POSTS)
            .update(updateData)
            .eq('id', platformPostId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // 记录分析数据
    async recordAnalyticsData(analyticsData) {
        const { data, error } = await this.admin
            .from(TABLES.ANALYTICS_DATA)
            .insert(analyticsData)
            .select();
        
        if (error) throw error;
        return data;
    }

    // 获取用户分析数据
    async getUserAnalytics(userId, startDate, endDate, platform = null) {
        let query = this.admin
            .from(TABLES.ANALYTICS_DATA)
            .select(`
                *,
                platform_posts!inner(
                    platform,
                    content_posts!inner(
                        user_id
                    )
                )
            `)
            .eq('platform_posts.content_posts.user_id', userId)
            .gte('date_bucket', startDate)
            .lte('date_bucket', endDate);

        if (platform) {
            query = query.eq('platform', platform);
        }

        const { data, error } = await query.order('recorded_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    // 创建定时任务
    async createScheduledTask(taskData) {
        const { data, error } = await this.admin
            .from(TABLES.SCHEDULED_TASKS)
            .insert(taskData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // 获取待执行的定时任务
    async getPendingTasks(limit = 100) {
        const { data, error } = await this.admin
            .from(TABLES.SCHEDULED_TASKS)
            .select('*')
            .in('status', ['pending', 'processing'])
            .lte('next_run_at', new Date().toISOString())
            .order('next_run_at', { ascending: true })
            .limit(limit);
        
        if (error) throw error;
        return data;
    }
}

module.exports = {
    supabaseAdmin,
    supabaseClient,
    DatabaseHelper,
    TABLES,
    VIEWS
};
