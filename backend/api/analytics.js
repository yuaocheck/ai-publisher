// 分析数据 API
const express = require('express');
const router = express.Router();
const { DatabaseHelper } = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

const db = new DatabaseHelper();

// 获取用户总体分析数据
router.get('/overview', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            start_date = null, 
            end_date = null, 
            platform = null,
            period = '30' // 默认30天
        } = req.query;

        // 设置日期范围
        let startDate, endDate;
        if (start_date && end_date) {
            startDate = start_date;
            endDate = end_date;
        } else {
            endDate = new Date().toISOString().split('T')[0];
            startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(period));
            startDate = startDate.toISOString().split('T')[0];
        }

        // 获取分析数据
        const analyticsData = await db.getUserAnalytics(userId, startDate, endDate, platform);

        // 聚合数据
        const overview = {
            total_posts: 0,
            total_engagements: 0,
            total_reach: 0,
            total_impressions: 0,
            avg_engagement_rate: 0,
            platform_breakdown: {},
            metric_trends: {},
            top_performing_posts: []
        };

        // 按平台和指标聚合
        const platformMetrics = {};
        const dailyMetrics = {};

        analyticsData.forEach(item => {
            const platform = item.platform_posts.platform;
            const date = item.date_bucket;
            const metricType = item.metric_type;
            const value = item.metric_value;

            // 平台分解
            if (!overview.platform_breakdown[platform]) {
                overview.platform_breakdown[platform] = {
                    posts: 0,
                    engagements: 0,
                    reach: 0,
                    impressions: 0
                };
            }

            if (!platformMetrics[platform]) {
                platformMetrics[platform] = new Set();
            }
            platformMetrics[platform].add(item.platform_post_id);

            // 按指标类型累加
            if (['likes', 'comments', 'shares'].includes(metricType)) {
                overview.total_engagements += value;
                overview.platform_breakdown[platform].engagements += value;
            } else if (metricType === 'reach') {
                overview.total_reach += value;
                overview.platform_breakdown[platform].reach += value;
            } else if (metricType === 'impressions') {
                overview.total_impressions += value;
                overview.platform_breakdown[platform].impressions += value;
            }

            // 日趋势数据
            if (!dailyMetrics[date]) {
                dailyMetrics[date] = {
                    engagements: 0,
                    reach: 0,
                    impressions: 0
                };
            }

            if (['likes', 'comments', 'shares'].includes(metricType)) {
                dailyMetrics[date].engagements += value;
            } else if (metricType === 'reach') {
                dailyMetrics[date].reach += value;
            } else if (metricType === 'impressions') {
                dailyMetrics[date].impressions += value;
            }
        });

        // 计算总发布数
        Object.keys(platformMetrics).forEach(platform => {
            const postCount = platformMetrics[platform].size;
            overview.total_posts += postCount;
            overview.platform_breakdown[platform].posts = postCount;
        });

        // 计算平均互动率
        overview.avg_engagement_rate = overview.total_reach > 0 ? 
            Math.round((overview.total_engagements / overview.total_reach) * 100 * 100) / 100 : 0;

        // 构建趋势数据
        overview.metric_trends = Object.keys(dailyMetrics)
            .sort()
            .map(date => ({
                date,
                ...dailyMetrics[date]
            }));

        res.json({
            success: true,
            data: overview,
            period: {
                start_date: startDate,
                end_date: endDate,
                days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
            }
        });

    } catch (error) {
        console.error('获取分析概览失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分析概览失败',
            error: error.message
        });
    }
});

// 获取平台对比数据
router.get('/platform-comparison', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '30' } = req.query;

        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        const startDateStr = startDate.toISOString().split('T')[0];

        // 获取用户的平台发布数据
        const { data: platformPosts, error } = await db.admin
            .from('platform_posts')
            .select(`
                platform,
                status,
                published_at,
                metrics,
                social_accounts!inner(user_id)
            `)
            .eq('social_accounts.user_id', userId)
            .gte('created_at', startDateStr)
            .lte('created_at', endDate);

        if (error) throw error;

        // 按平台聚合数据
        const platformComparison = {};

        platformPosts.forEach(post => {
            const platform = post.platform;
            
            if (!platformComparison[platform]) {
                platformComparison[platform] = {
                    platform,
                    total_posts: 0,
                    published_posts: 0,
                    failed_posts: 0,
                    total_likes: 0,
                    total_comments: 0,
                    total_shares: 0,
                    total_reach: 0,
                    total_impressions: 0,
                    avg_engagement_rate: 0,
                    success_rate: 0
                };
            }

            const stats = platformComparison[platform];
            stats.total_posts++;

            if (post.status === 'published') {
                stats.published_posts++;
                
                if (post.metrics) {
                    stats.total_likes += post.metrics.likes || 0;
                    stats.total_comments += post.metrics.comments || 0;
                    stats.total_shares += post.metrics.shares || 0;
                    stats.total_reach += post.metrics.reach || 0;
                    stats.total_impressions += post.metrics.impressions || 0;
                }
            } else if (post.status === 'failed') {
                stats.failed_posts++;
            }
        });

        // 计算比率
        Object.values(platformComparison).forEach(stats => {
            stats.success_rate = stats.total_posts > 0 ? 
                Math.round((stats.published_posts / stats.total_posts) * 100 * 100) / 100 : 0;
            
            const totalEngagements = stats.total_likes + stats.total_comments + stats.total_shares;
            stats.avg_engagement_rate = stats.total_reach > 0 ? 
                Math.round((totalEngagements / stats.total_reach) * 100 * 100) / 100 : 0;
        });

        res.json({
            success: true,
            data: Object.values(platformComparison),
            period: `${period}天`
        });

    } catch (error) {
        console.error('获取平台对比数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取平台对比数据失败',
            error: error.message
        });
    }
});

// 获取表现最佳的内容
router.get('/top-content', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            limit = 10, 
            metric = 'engagement', // engagement, reach, impressions
            period = '30',
            platform = null 
        } = req.query;

        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        const startDateStr = startDate.toISOString().split('T')[0];

        // 构建查询
        let query = db.admin
            .from('platform_posts')
            .select(`
                id,
                platform,
                platform_url,
                adapted_content,
                published_at,
                metrics,
                content_posts!inner(
                    id,
                    title,
                    content,
                    content_type,
                    user_id
                )
            `)
            .eq('content_posts.user_id', userId)
            .eq('status', 'published')
            .gte('published_at', startDateStr)
            .lte('published_at', endDate)
            .not('metrics', 'is', null);

        if (platform) {
            query = query.eq('platform', platform);
        }

        const { data: posts, error } = await query;
        if (error) throw error;

        // 计算排序指标
        const postsWithScore = posts.map(post => {
            const metrics = post.metrics || {};
            let score = 0;

            switch (metric) {
                case 'engagement':
                    score = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
                    break;
                case 'reach':
                    score = metrics.reach || 0;
                    break;
                case 'impressions':
                    score = metrics.impressions || 0;
                    break;
                default:
                    score = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
            }

            return {
                ...post,
                score,
                engagement_rate: metrics.reach > 0 ? 
                    Math.round(((metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0)) / metrics.reach * 100 * 100) / 100 : 0
            };
        });

        // 排序并限制数量
        const topContent = postsWithScore
            .sort((a, b) => b.score - a.score)
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: topContent,
            metric_used: metric,
            period: `${period}天`
        });

    } catch (error) {
        console.error('获取表现最佳内容失败:', error);
        res.status(500).json({
            success: false,
            message: '获取表现最佳内容失败',
            error: error.message
        });
    }
});

// 获取发布时间分析
router.get('/posting-times', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '30', platform = null } = req.query;

        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        const startDateStr = startDate.toISOString().split('T')[0];

        let query = db.admin
            .from('platform_posts')
            .select(`
                platform,
                published_at,
                metrics,
                social_accounts!inner(user_id)
            `)
            .eq('social_accounts.user_id', userId)
            .eq('status', 'published')
            .gte('published_at', startDateStr)
            .lte('published_at', endDate)
            .not('published_at', 'is', null);

        if (platform) {
            query = query.eq('platform', platform);
        }

        const { data: posts, error } = await query;
        if (error) throw error;

        // 按小时和星期几分析
        const hourlyStats = Array(24).fill(0).map((_, hour) => ({
            hour,
            posts: 0,
            total_engagement: 0,
            avg_engagement: 0
        }));

        const weeklyStats = Array(7).fill(0).map((_, day) => ({
            day_of_week: day, // 0=Sunday, 1=Monday, etc.
            day_name: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day],
            posts: 0,
            total_engagement: 0,
            avg_engagement: 0
        }));

        posts.forEach(post => {
            const publishedAt = new Date(post.published_at);
            const hour = publishedAt.getHours();
            const dayOfWeek = publishedAt.getDay();
            
            const engagement = post.metrics ? 
                (post.metrics.likes || 0) + (post.metrics.comments || 0) + (post.metrics.shares || 0) : 0;

            // 小时统计
            hourlyStats[hour].posts++;
            hourlyStats[hour].total_engagement += engagement;

            // 星期统计
            weeklyStats[dayOfWeek].posts++;
            weeklyStats[dayOfWeek].total_engagement += engagement;
        });

        // 计算平均值
        hourlyStats.forEach(stat => {
            stat.avg_engagement = stat.posts > 0 ? 
                Math.round(stat.total_engagement / stat.posts * 100) / 100 : 0;
        });

        weeklyStats.forEach(stat => {
            stat.avg_engagement = stat.posts > 0 ? 
                Math.round(stat.total_engagement / stat.posts * 100) / 100 : 0;
        });

        // 找出最佳发布时间
        const bestHour = hourlyStats.reduce((best, current) => 
            current.avg_engagement > best.avg_engagement ? current : best
        );

        const bestDay = weeklyStats.reduce((best, current) => 
            current.avg_engagement > best.avg_engagement ? current : best
        );

        res.json({
            success: true,
            data: {
                hourly_stats: hourlyStats,
                weekly_stats: weeklyStats,
                recommendations: {
                    best_hour: bestHour.hour,
                    best_day: bestDay.day_name,
                    best_hour_engagement: bestHour.avg_engagement,
                    best_day_engagement: bestDay.avg_engagement
                }
            },
            period: `${period}天`
        });

    } catch (error) {
        console.error('获取发布时间分析失败:', error);
        res.status(500).json({
            success: false,
            message: '获取发布时间分析失败',
            error: error.message
        });
    }
});

// 记录分析数据（用于外部数据同步）
router.post('/record', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { platform_post_id, metrics } = req.body;

        if (!platform_post_id || !metrics) {
            return res.status(400).json({
                success: false,
                message: '缺少必需的参数'
            });
        }

        // 验证平台发布记录是否属于当前用户
        const { data: platformPost, error: postError } = await db.admin
            .from('platform_posts')
            .select(`
                id,
                platform,
                social_accounts!inner(user_id)
            `)
            .eq('id', platform_post_id)
            .eq('social_accounts.user_id', userId)
            .single();

        if (postError) throw postError;

        if (!platformPost) {
            return res.status(404).json({
                success: false,
                message: '平台发布记录不存在'
            });
        }

        // 准备分析数据记录
        const analyticsRecords = [];
        const recordedAt = new Date().toISOString();

        Object.entries(metrics).forEach(([metricType, value]) => {
            if (typeof value === 'number' && value >= 0) {
                analyticsRecords.push({
                    user_id: userId,
                    platform_post_id: platform_post_id,
                    platform: platformPost.platform,
                    metric_type: metricType,
                    metric_value: value,
                    recorded_at: recordedAt
                });
            }
        });

        if (analyticsRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有有效的指标数据'
            });
        }

        // 批量插入分析数据
        const insertedData = await db.recordAnalyticsData(analyticsRecords);

        // 更新平台发布记录的指标
        await db.admin
            .from('platform_posts')
            .update({
                metrics: metrics,
                last_metrics_update: recordedAt
            })
            .eq('id', platform_post_id);

        res.json({
            success: true,
            message: '分析数据记录成功',
            data: {
                platform_post_id,
                metrics_recorded: analyticsRecords.length,
                recorded_at: recordedAt
            }
        });

    } catch (error) {
        console.error('记录分析数据失败:', error);
        res.status(500).json({
            success: false,
            message: '记录分析数据失败',
            error: error.message
        });
    }
});

module.exports = router;
