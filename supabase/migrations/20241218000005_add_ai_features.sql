-- AI 使用统计表
CREATE TABLE ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    requests_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- AI 生成历史表
CREATE TABLE ai_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    options JSONB,
    model VARCHAR(50) DEFAULT 'gemini-1.5-pro',
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 内容模板表
CREATE TABLE content_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category VARCHAR(100),
    platform VARCHAR(50),
    variables JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 配置表（用于存储用户的 AI 偏好设置）
CREATE TABLE ai_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    default_tone VARCHAR(50) DEFAULT 'professional',
    default_language VARCHAR(10) DEFAULT 'zh-CN',
    preferred_platforms TEXT[] DEFAULT ARRAY['twitter', 'facebook'],
    auto_optimize BOOLEAN DEFAULT TRUE,
    auto_hashtags BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, date);
CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at);
CREATE INDEX idx_content_templates_org_id ON content_templates(org_id);
CREATE INDEX idx_content_templates_category ON content_templates(category);
CREATE INDEX idx_content_templates_platform ON content_templates(platform);

-- 启用 RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;

-- AI 使用统计 RLS 策略
CREATE POLICY "Users can view their own AI usage" ON ai_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage" ON ai_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage stats" ON ai_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- AI 生成历史 RLS 策略
CREATE POLICY "Users can view their own AI generations" ON ai_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI generations" ON ai_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 内容模板 RLS 策略
CREATE POLICY "Users can view templates in their organizations" ON content_templates
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM organization_members 
            WHERE user_id = auth.uid()
        ) OR is_public = TRUE
    );

CREATE POLICY "Users can create templates in their organizations" ON content_templates
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'editor')
        ) AND auth.uid() = created_by
    );

CREATE POLICY "Users can update templates they created" ON content_templates
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        (org_id IN (
            SELECT org_id FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        ))
    );

CREATE POLICY "Users can delete templates they created" ON content_templates
    FOR DELETE USING (
        auth.uid() = created_by OR 
        (org_id IN (
            SELECT org_id FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        ))
    );

-- AI 偏好设置 RLS 策略
CREATE POLICY "Users can manage their own AI preferences" ON ai_preferences
    FOR ALL USING (auth.uid() = user_id);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 添加更新时间触发器
CREATE TRIGGER update_ai_usage_updated_at BEFORE UPDATE ON ai_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_templates_updated_at BEFORE UPDATE ON content_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_preferences_updated_at BEFORE UPDATE ON ai_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认内容模板
INSERT INTO content_templates (org_id, name, description, content, category, platform, variables, is_public, created_by) VALUES
-- 使用第一个组织的 ID 和第一个用户的 ID（这些需要在实际部署时调整）
(
    (SELECT id FROM organizations LIMIT 1),
    '产品发布公告',
    '新产品发布时使用的标准模板',
    '🚀 激动地宣布我们的{{product_name}}正式发布！

经过团队的不懈努力，我们为大家带来了{{key_features}}。

✨ 主要特点：
{{feature_list}}

现在就来体验吧：{{product_url}}

#产品发布 #{{product_category}} #创新',
    'product',
    'all',
    '["product_name", "key_features", "feature_list", "product_url", "product_category"]',
    TRUE,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    (SELECT id FROM organizations LIMIT 1),
    '活动推广',
    '活动宣传推广的通用模板',
    '🎉 {{event_name}} 即将开始！

📅 时间：{{event_date}}
📍 地点：{{event_location}}
🎯 亮点：{{event_highlights}}

{{event_description}}

立即报名：{{registration_url}}

#活动推广 #{{event_type}} #报名',
    'event',
    'all',
    '["event_name", "event_date", "event_location", "event_highlights", "event_description", "registration_url", "event_type"]',
    TRUE,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    (SELECT id FROM organizations LIMIT 1),
    '博客文章分享',
    '分享博客文章时使用的模板',
    '📖 新文章发布：{{article_title}}

{{article_summary}}

在这篇文章中，我们探讨了：
{{key_points}}

阅读全文：{{article_url}}

你怎么看？欢迎在评论区分享你的想法！

#博客 #{{article_category}} #分享',
    'blog',
    'all',
    '["article_title", "article_summary", "key_points", "article_url", "article_category"]',
    TRUE,
    (SELECT id FROM auth.users LIMIT 1)
);

-- 创建获取 AI 使用统计的函数
CREATE OR REPLACE FUNCTION get_ai_usage_stats(user_uuid UUID)
RETURNS TABLE (
    today_requests INTEGER,
    today_tokens INTEGER,
    month_requests INTEGER,
    month_tokens INTEGER,
    total_requests INTEGER,
    total_tokens INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT requests_count FROM ai_usage WHERE user_id = user_uuid AND date = CURRENT_DATE), 0) as today_requests,
        COALESCE((SELECT tokens_used FROM ai_usage WHERE user_id = user_uuid AND date = CURRENT_DATE), 0) as today_tokens,
        COALESCE(SUM(requests_count), 0)::INTEGER as month_requests,
        COALESCE(SUM(tokens_used), 0)::INTEGER as month_tokens,
        COALESCE((SELECT COUNT(*) FROM ai_generations WHERE user_id = user_uuid), 0)::INTEGER as total_requests,
        COALESCE((SELECT SUM(tokens_used) FROM ai_generations WHERE user_id = user_uuid), 0)::INTEGER as total_tokens
    FROM ai_usage 
    WHERE user_id = user_uuid 
    AND date >= DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
