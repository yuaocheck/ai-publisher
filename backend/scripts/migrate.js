// 数据库迁移脚本
require('dotenv').config();
const { supabaseAdmin } = require('../config/database');

// 迁移脚本列表
const migrations = [
    {
        name: '001_create_users_table',
        sql: `
            -- 创建用户表
            CREATE TABLE IF NOT EXISTS ai_publisher_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                full_name VARCHAR(255),
                avatar_url TEXT,
                password_hash VARCHAR(255) NOT NULL,
                subscription_plan VARCHAR(50) DEFAULT 'free',
                api_usage_count INTEGER DEFAULT 0,
                api_usage_limit INTEGER DEFAULT 1000,
                reset_token VARCHAR(255),
                reset_token_expires TIMESTAMP WITH TIME ZONE,
                last_login_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- 创建更新时间触发器函数
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            -- 创建用户表更新触发器
            CREATE TRIGGER update_ai_publisher_users_updated_at
                BEFORE UPDATE ON ai_publisher_users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `
    },
    {
        name: '002_create_social_accounts_table',
        sql: `
            -- 社交媒体账号表
            CREATE TABLE IF NOT EXISTS social_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES ai_publisher_users(id) ON DELETE CASCADE,
                platform VARCHAR(50) NOT NULL,
                platform_user_id VARCHAR(255) NOT NULL,
                platform_username VARCHAR(255),
                display_name VARCHAR(255),
                avatar_url TEXT,
                access_token TEXT,
                refresh_token TEXT,
                token_expires_at TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT true,
                last_sync_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, platform, platform_user_id)
            );

            CREATE TRIGGER update_social_accounts_updated_at
                BEFORE UPDATE ON social_accounts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- 索引
            CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
            CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
            CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts(is_active);
        `
    },
    {
        name: '003_create_content_posts_table',
        sql: `
            -- 内容发布表
            CREATE TABLE IF NOT EXISTS content_posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES ai_publisher_users(id) ON DELETE CASCADE,
                title VARCHAR(500),
                content TEXT NOT NULL,
                content_type VARCHAR(50) NOT NULL,
                tone VARCHAR(50),
                length VARCHAR(50),
                language VARCHAR(10) DEFAULT 'zh-CN',
                target_platforms TEXT[],
                status VARCHAR(50) DEFAULT 'draft',
                scheduled_at TIMESTAMP WITH TIME ZONE,
                published_at TIMESTAMP WITH TIME ZONE,
                ai_generated BOOLEAN DEFAULT false,
                ai_model VARCHAR(100),
                prompt_used TEXT,
                generation_config JSONB,
                metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TRIGGER update_content_posts_updated_at
                BEFORE UPDATE ON content_posts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- 索引
            CREATE INDEX IF NOT EXISTS idx_content_posts_user_id ON content_posts(user_id);
            CREATE INDEX IF NOT EXISTS idx_content_posts_status ON content_posts(status);
            CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled_at ON content_posts(scheduled_at);
            CREATE INDEX IF NOT EXISTS idx_content_posts_created_at ON content_posts(created_at DESC);
        `
    },
    {
        name: '004_create_platform_posts_table',
        sql: `
            -- 平台发布记录表
            CREATE TABLE IF NOT EXISTS platform_posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                content_post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
                social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
                platform VARCHAR(50) NOT NULL,
                platform_post_id VARCHAR(255),
                platform_url TEXT,
                adapted_content TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                error_message TEXT,
                published_at TIMESTAMP WITH TIME ZONE,
                metrics JSONB,
                last_metrics_update TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TRIGGER update_platform_posts_updated_at
                BEFORE UPDATE ON platform_posts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- 索引
            CREATE INDEX IF NOT EXISTS idx_platform_posts_content_post_id ON platform_posts(content_post_id);
            CREATE INDEX IF NOT EXISTS idx_platform_posts_social_account_id ON platform_posts(social_account_id);
            CREATE INDEX IF NOT EXISTS idx_platform_posts_platform ON platform_posts(platform);
            CREATE INDEX IF NOT EXISTS idx_platform_posts_status ON platform_posts(status);
            CREATE INDEX IF NOT EXISTS idx_platform_posts_published_at ON platform_posts(published_at DESC);
        `
    },
    {
        name: '005_create_ai_generation_history_table',
        sql: `
            -- AI 生成历史表
            CREATE TABLE IF NOT EXISTS ai_generation_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES ai_publisher_users(id) ON DELETE CASCADE,
                content_post_id UUID REFERENCES content_posts(id) ON DELETE SET NULL,
                prompt TEXT NOT NULL,
                ai_model VARCHAR(100) NOT NULL,
                generation_type VARCHAR(50) NOT NULL,
                input_parameters JSONB,
                generated_content TEXT,
                tokens_used INTEGER,
                generation_time_ms INTEGER,
                success BOOLEAN DEFAULT true,
                error_message TEXT,
                api_response JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- 索引
            CREATE INDEX IF NOT EXISTS idx_ai_generation_history_user_id ON ai_generation_history(user_id);
            CREATE INDEX IF NOT EXISTS idx_ai_generation_history_created_at ON ai_generation_history(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_ai_generation_history_success ON ai_generation_history(success);
            CREATE INDEX IF NOT EXISTS idx_ai_generation_history_model ON ai_generation_history(ai_model);
        `
    },
    {
        name: '006_create_user_settings_table',
        sql: `
            -- 用户设置表
            CREATE TABLE IF NOT EXISTS user_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES ai_publisher_users(id) ON DELETE CASCADE UNIQUE,
                default_content_type VARCHAR(50) DEFAULT 'social_post',
                default_tone VARCHAR(50) DEFAULT 'friendly',
                default_length VARCHAR(50) DEFAULT 'medium',
                default_language VARCHAR(10) DEFAULT 'zh-CN',
                preferred_platforms TEXT[] DEFAULT ARRAY['twitter', 'facebook'],
                ai_model_preference VARCHAR(100) DEFAULT 'gemini-pro',
                auto_optimize BOOLEAN DEFAULT false,
                auto_schedule BOOLEAN DEFAULT false,
                notification_settings JSONB DEFAULT '{
                    "email_notifications": true,
                    "push_notifications": true,
                    "post_published": true,
                    "post_failed": true,
                    "weekly_summary": true
                }',
                timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
                theme VARCHAR(20) DEFAULT 'light',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TRIGGER update_user_settings_updated_at
                BEFORE UPDATE ON user_settings
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- 索引
            CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
        `
    },
    {
        name: '007_create_analytics_data_table',
        sql: `
            -- 分析数据表
            CREATE TABLE IF NOT EXISTS analytics_data (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES ai_publisher_users(id) ON DELETE CASCADE,
                platform_post_id UUID REFERENCES platform_posts(id) ON DELETE CASCADE,
                platform VARCHAR(50) NOT NULL,
                metric_type VARCHAR(50) NOT NULL,
                metric_value INTEGER NOT NULL DEFAULT 0,
                recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                date_bucket DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- 创建触发器来自动设置 date_bucket
            CREATE OR REPLACE FUNCTION set_date_bucket()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.date_bucket = DATE(NEW.recorded_at);
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            CREATE TRIGGER set_analytics_date_bucket
                BEFORE INSERT OR UPDATE ON analytics_data
                FOR EACH ROW
                EXECUTE FUNCTION set_date_bucket();

            -- 索引
            CREATE INDEX IF NOT EXISTS idx_analytics_data_user_id ON analytics_data(user_id);
            CREATE INDEX IF NOT EXISTS idx_analytics_data_platform_post_id ON analytics_data(platform_post_id);
            CREATE INDEX IF NOT EXISTS idx_analytics_data_platform ON analytics_data(platform);
            CREATE INDEX IF NOT EXISTS idx_analytics_data_metric_type ON analytics_data(metric_type);
            CREATE INDEX IF NOT EXISTS idx_analytics_data_date_bucket ON analytics_data(date_bucket DESC);
            CREATE INDEX IF NOT EXISTS idx_analytics_data_recorded_at ON analytics_data(recorded_at DESC);

            -- 复合索引用于常用查询
            CREATE INDEX IF NOT EXISTS idx_analytics_user_platform_date ON analytics_data(user_id, platform, date_bucket);
            CREATE INDEX IF NOT EXISTS idx_analytics_user_metric_date ON analytics_data(user_id, metric_type, date_bucket);
        `
    },
    {
        name: '008_create_scheduled_tasks_table',
        sql: `
            -- 定时任务表
            CREATE TABLE IF NOT EXISTS scheduled_tasks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES ai_publisher_users(id) ON DELETE CASCADE,
                content_post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
                task_type VARCHAR(50) NOT NULL,
                scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
                recurring_pattern JSONB,
                target_platforms TEXT[] NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                attempts INTEGER DEFAULT 0,
                max_attempts INTEGER DEFAULT 3,
                last_attempt_at TIMESTAMP WITH TIME ZONE,
                next_run_at TIMESTAMP WITH TIME ZONE,
                error_message TEXT,
                completed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TRIGGER update_scheduled_tasks_updated_at
                BEFORE UPDATE ON scheduled_tasks
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- 索引
            CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_id ON scheduled_tasks(user_id);
            CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_time ON scheduled_tasks(scheduled_time);
            CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run_at ON scheduled_tasks(next_run_at);
            CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
            CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_task_type ON scheduled_tasks(task_type);
        `
    },
    {
        name: '009_create_views',
        sql: `
            -- 用户概览视图
            CREATE OR REPLACE VIEW user_overview AS
            SELECT 
                u.id,
                u.email,
                u.username,
                u.full_name,
                u.subscription_plan,
                u.api_usage_count,
                u.api_usage_limit,
                u.created_at,
                COUNT(DISTINCT sa.id) as connected_accounts,
                COUNT(DISTINCT cp.id) as total_posts,
                COUNT(DISTINCT CASE WHEN cp.status = 'published' THEN cp.id END) as published_posts,
                COUNT(DISTINCT CASE WHEN cp.ai_generated = true THEN cp.id END) as ai_generated_posts
            FROM ai_publisher_users u
            LEFT JOIN social_accounts sa ON u.id = sa.user_id AND sa.is_active = true
            LEFT JOIN content_posts cp ON u.id = cp.user_id
            GROUP BY u.id, u.email, u.username, u.full_name, u.subscription_plan, u.api_usage_count, u.api_usage_limit, u.created_at;

            -- 内容发布详情视图
            CREATE OR REPLACE VIEW content_posts_detail AS
            SELECT 
                cp.*,
                u.username,
                u.full_name,
                COUNT(DISTINCT pp.id) as platform_posts_count,
                COUNT(DISTINCT CASE WHEN pp.status = 'published' THEN pp.id END) as published_count,
                COUNT(DISTINCT CASE WHEN pp.status = 'failed' THEN pp.id END) as failed_count,
                ARRAY_AGG(DISTINCT pp.platform) FILTER (WHERE pp.platform IS NOT NULL) as published_platforms
            FROM content_posts cp
            JOIN ai_publisher_users u ON cp.user_id = u.id
            LEFT JOIN platform_posts pp ON cp.id = pp.content_post_id
            GROUP BY cp.id, u.username, u.full_name;

            -- 平台发布统计视图
            CREATE OR REPLACE VIEW platform_stats AS
            SELECT 
                pp.platform,
                COUNT(*) as total_posts,
                COUNT(CASE WHEN pp.status = 'published' THEN 1 END) as published_posts,
                COUNT(CASE WHEN pp.status = 'failed' THEN 1 END) as failed_posts,
                ROUND(AVG(CASE WHEN pp.status = 'published' THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate,
                COUNT(DISTINCT pp.social_account_id) as active_accounts
            FROM platform_posts pp
            GROUP BY pp.platform;

            -- AI 生成统计视图
            CREATE OR REPLACE VIEW ai_generation_stats AS
            SELECT 
                agh.user_id,
                u.username,
                COUNT(*) as total_generations,
                COUNT(CASE WHEN agh.success = true THEN 1 END) as successful_generations,
                COUNT(CASE WHEN agh.generation_type = 'generate' THEN 1 END) as new_generations,
                COUNT(CASE WHEN agh.generation_type = 'optimize' THEN 1 END) as optimizations,
                COUNT(CASE WHEN agh.generation_type = 'variation' THEN 1 END) as variations,
                SUM(agh.tokens_used) as total_tokens_used,
                AVG(agh.generation_time_ms) as avg_generation_time_ms,
                MAX(agh.created_at) as last_generation_at
            FROM ai_generation_history agh
            JOIN ai_publisher_users u ON agh.user_id = u.id
            GROUP BY agh.user_id, u.username;
        `
    }
];

// 迁移状态表
const createMigrationTable = `
    CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
`;

// 执行迁移
async function runMigrations() {
    try {
        console.log('🚀 开始数据库迁移...');

        // 创建迁移状态表
        console.log('📋 创建迁移状态表...');
        const { error: tableError } = await supabaseAdmin.rpc('execute_sql', {
            query: createMigrationTable
        });

        if (tableError) {
            console.error('创建迁移状态表失败:', tableError);
            return;
        }

        // 获取已执行的迁移
        const { data: executedMigrations, error: fetchError } = await supabaseAdmin
            .from('migrations')
            .select('name');

        if (fetchError) {
            console.error('获取已执行迁移失败:', fetchError);
            return;
        }

        const executedNames = executedMigrations.map(m => m.name);

        // 执行未执行的迁移
        for (const migration of migrations) {
            if (executedNames.includes(migration.name)) {
                console.log(`⏭️  跳过已执行的迁移: ${migration.name}`);
                continue;
            }

            console.log(`🔄 执行迁移: ${migration.name}`);

            // 执行迁移 SQL
            const { error: migrationError } = await supabaseAdmin.rpc('execute_sql', {
                query: migration.sql
            });

            if (migrationError) {
                console.error(`❌ 迁移失败: ${migration.name}`, migrationError);
                throw migrationError;
            }

            // 记录迁移状态
            const { error: recordError } = await supabaseAdmin
                .from('migrations')
                .insert({ name: migration.name });

            if (recordError) {
                console.error(`❌ 记录迁移状态失败: ${migration.name}`, recordError);
                throw recordError;
            }

            console.log(`✅ 迁移完成: ${migration.name}`);
        }

        console.log('🎉 所有迁移执行完成！');

    } catch (error) {
        console.error('❌ 迁移过程中发生错误:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations, migrations };
