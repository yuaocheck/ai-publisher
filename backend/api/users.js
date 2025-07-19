// 用户管理 API
const express = require('express');
const router = express.Router();
const { DatabaseHelper } = require('../config/database');
const { authenticateUser, authorizeUser } = require('../middleware/auth');

const db = new DatabaseHelper();

// 获取用户概览
router.get('/overview', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const overview = await db.getUserOverview(userId);
        
        if (!overview) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: overview
        });
    } catch (error) {
        console.error('获取用户概览失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户概览失败',
            error: error.message
        });
    }
});

// 获取用户详细信息
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data: user, error } = await db.admin
            .from('ai_publisher_users')
            .select(`
                id,
                email,
                username,
                full_name,
                avatar_url,
                subscription_plan,
                api_usage_count,
                api_usage_limit,
                created_at,
                user_settings (*)
            `)
            .eq('id', userId)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败',
            error: error.message
        });
    }
});

// 更新用户信息
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, avatar_url } = req.body;

        const updateData = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

        const { data, error } = await db.admin
            .from('ai_publisher_users')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: '用户信息更新成功',
            data: data
        });
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户信息失败',
            error: error.message
        });
    }
});

// 获取用户设置
router.get('/settings', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data: settings, error } = await db.admin
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('获取用户设置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户设置失败',
            error: error.message
        });
    }
});

// 更新用户设置
router.put('/settings', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            default_content_type,
            default_tone,
            default_length,
            default_language,
            preferred_platforms,
            ai_model_preference,
            auto_optimize,
            auto_schedule,
            notification_settings,
            timezone,
            theme
        } = req.body;

        const updateData = {};
        if (default_content_type !== undefined) updateData.default_content_type = default_content_type;
        if (default_tone !== undefined) updateData.default_tone = default_tone;
        if (default_length !== undefined) updateData.default_length = default_length;
        if (default_language !== undefined) updateData.default_language = default_language;
        if (preferred_platforms !== undefined) updateData.preferred_platforms = preferred_platforms;
        if (ai_model_preference !== undefined) updateData.ai_model_preference = ai_model_preference;
        if (auto_optimize !== undefined) updateData.auto_optimize = auto_optimize;
        if (auto_schedule !== undefined) updateData.auto_schedule = auto_schedule;
        if (notification_settings !== undefined) updateData.notification_settings = notification_settings;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (theme !== undefined) updateData.theme = theme;

        const { data, error } = await db.admin
            .from('user_settings')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: '用户设置更新成功',
            data: data
        });
    } catch (error) {
        console.error('更新用户设置失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户设置失败',
            error: error.message
        });
    }
});

// 获取用户统计信息
router.get('/stats', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取基本统计
        const overview = await db.getUserOverview(userId);
        
        // 获取 AI 生成统计
        const aiStats = await db.getAIGenerationStats(userId);
        
        // 获取最近 30 天的分析数据
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const analyticsData = await db.getUserAnalytics(
            userId,
            thirtyDaysAgo.toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
        );

        // 聚合分析数据
        const analytics = analyticsData.reduce((acc, item) => {
            const platform = item.platform_posts.platform;
            if (!acc[platform]) {
                acc[platform] = {
                    views: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    reach: 0,
                    impressions: 0
                };
            }
            acc[platform][item.metric_type] += item.metric_value;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                overview,
                ai_stats: aiStats,
                analytics,
                period: '30天'
            }
        });
    } catch (error) {
        console.error('获取用户统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户统计失败',
            error: error.message
        });
    }
});

// 检查 API 使用限制
router.get('/api-usage', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data: user, error } = await db.admin
            .from('ai_publisher_users')
            .select('api_usage_count, api_usage_limit, subscription_plan')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const usagePercentage = (user.api_usage_count / user.api_usage_limit) * 100;
        const remainingCalls = user.api_usage_limit - user.api_usage_count;

        res.json({
            success: true,
            data: {
                current_usage: user.api_usage_count,
                usage_limit: user.api_usage_limit,
                remaining_calls: remainingCalls,
                usage_percentage: Math.round(usagePercentage * 100) / 100,
                subscription_plan: user.subscription_plan,
                is_limit_reached: remainingCalls <= 0
            }
        });
    } catch (error) {
        console.error('获取 API 使用情况失败:', error);
        res.status(500).json({
            success: false,
            message: '获取 API 使用情况失败',
            error: error.message
        });
    }
});

// 重置 API 使用计数（管理员功能）
router.post('/reset-api-usage', authenticateUser, authorizeUser(['admin']), async (req, res) => {
    try {
        const { user_id } = req.body;
        
        const { data, error } = await db.admin
            .from('ai_publisher_users')
            .update({ api_usage_count: 0 })
            .eq('id', user_id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'API 使用计数已重置',
            data: data
        });
    } catch (error) {
        console.error('重置 API 使用计数失败:', error);
        res.status(500).json({
            success: false,
            message: '重置 API 使用计数失败',
            error: error.message
        });
    }
});

module.exports = router;
