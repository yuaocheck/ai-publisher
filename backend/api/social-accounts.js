// 社交账号管理 API
const express = require('express');
const router = express.Router();
const { DatabaseHelper } = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

const db = new DatabaseHelper();

// 支持的平台配置
const PLATFORM_CONFIG = {
    twitter: {
        name: 'Twitter',
        color: '#1DA1F2',
        icon: 'fab fa-twitter',
        auth_url: '/auth/twitter',
        features: ['post', 'schedule', 'analytics']
    },
    facebook: {
        name: 'Facebook',
        color: '#1877F2',
        icon: 'fab fa-facebook',
        auth_url: '/auth/facebook',
        features: ['post', 'schedule', 'analytics']
    },
    instagram: {
        name: 'Instagram',
        color: '#E4405F',
        icon: 'fab fa-instagram',
        auth_url: '/auth/instagram',
        features: ['post', 'schedule']
    },
    linkedin: {
        name: 'LinkedIn',
        color: '#0A66C2',
        icon: 'fab fa-linkedin',
        auth_url: '/auth/linkedin',
        features: ['post', 'schedule', 'analytics']
    },
    tiktok: {
        name: 'TikTok',
        color: '#000000',
        icon: 'fab fa-tiktok',
        auth_url: '/auth/tiktok',
        features: ['post']
    },
    youtube: {
        name: 'YouTube',
        color: '#FF0000',
        icon: 'fab fa-youtube',
        auth_url: '/auth/youtube',
        features: ['post', 'schedule', 'analytics']
    }
};

// 获取支持的平台列表
router.get('/platforms', (req, res) => {
    res.json({
        success: true,
        data: PLATFORM_CONFIG
    });
});

// 获取用户的社交账号列表
router.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { platform = null, active_only = false } = req.query;

        let query = db.admin
            .from('social_accounts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (platform) {
            query = query.eq('platform', platform);
        }

        if (active_only === 'true') {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        // 添加平台配置信息
        const accountsWithConfig = data.map(account => ({
            ...account,
            platform_config: PLATFORM_CONFIG[account.platform] || null
        }));

        res.json({
            success: true,
            data: accountsWithConfig
        });

    } catch (error) {
        console.error('获取社交账号列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取社交账号列表失败',
            error: error.message
        });
    }
});

// 获取单个社交账号详情
router.get('/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;

        const { data, error } = await db.admin
            .from('social_accounts')
            .select(`
                *,
                platform_posts (
                    id,
                    status,
                    published_at,
                    metrics
                )
            `)
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: '社交账号不存在'
            });
        }

        // 添加平台配置和统计信息
        const accountWithStats = {
            ...data,
            platform_config: PLATFORM_CONFIG[data.platform] || null,
            stats: {
                total_posts: data.platform_posts.length,
                published_posts: data.platform_posts.filter(p => p.status === 'published').length,
                failed_posts: data.platform_posts.filter(p => p.status === 'failed').length,
                last_post_at: data.platform_posts
                    .filter(p => p.published_at)
                    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0]?.published_at || null
            }
        };

        res.json({
            success: true,
            data: accountWithStats
        });

    } catch (error) {
        console.error('获取社交账号详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取社交账号详情失败',
            error: error.message
        });
    }
});

// 添加社交账号（OAuth 回调后调用）
router.post('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            platform,
            platform_user_id,
            platform_username,
            display_name,
            avatar_url,
            access_token,
            refresh_token,
            token_expires_at
        } = req.body;

        if (!platform || !platform_user_id || !access_token) {
            return res.status(400).json({
                success: false,
                message: '缺少必需的账号信息'
            });
        }

        if (!PLATFORM_CONFIG[platform]) {
            return res.status(400).json({
                success: false,
                message: '不支持的平台'
            });
        }

        // 检查是否已存在相同的账号
        const { data: existingAccount } = await db.admin
            .from('social_accounts')
            .select('id')
            .eq('user_id', userId)
            .eq('platform', platform)
            .eq('platform_user_id', platform_user_id)
            .single();

        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: '该账号已经连接'
            });
        }

        const accountData = {
            user_id: userId,
            platform,
            platform_user_id,
            platform_username,
            display_name,
            avatar_url,
            access_token, // 在实际应用中应该加密存储
            refresh_token,
            token_expires_at,
            is_active: true,
            last_sync_at: new Date().toISOString()
        };

        const { data, error } = await db.admin
            .from('social_accounts')
            .insert(accountData)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: '社交账号连接成功',
            data: {
                ...data,
                platform_config: PLATFORM_CONFIG[platform]
            }
        });

    } catch (error) {
        console.error('添加社交账号失败:', error);
        res.status(500).json({
            success: false,
            message: '添加社交账号失败',
            error: error.message
        });
    }
});

// 更新社交账号信息
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;
        const {
            platform_username,
            display_name,
            avatar_url,
            is_active
        } = req.body;

        const updateData = {};
        if (platform_username !== undefined) updateData.platform_username = platform_username;
        if (display_name !== undefined) updateData.display_name = display_name;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data, error } = await db.admin
            .from('social_accounts')
            .update(updateData)
            .eq('id', accountId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: '社交账号不存在或无权限修改'
            });
        }

        res.json({
            success: true,
            message: '社交账号更新成功',
            data: data
        });

    } catch (error) {
        console.error('更新社交账号失败:', error);
        res.status(500).json({
            success: false,
            message: '更新社交账号失败',
            error: error.message
        });
    }
});

// 删除社交账号
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;

        const { data, error } = await db.admin
            .from('social_accounts')
            .delete()
            .eq('id', accountId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: '社交账号不存在或无权限删除'
            });
        }

        res.json({
            success: true,
            message: '社交账号删除成功'
        });

    } catch (error) {
        console.error('删除社交账号失败:', error);
        res.status(500).json({
            success: false,
            message: '删除社交账号失败',
            error: error.message
        });
    }
});

// 刷新账号令牌
router.post('/:id/refresh-token', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;

        // 获取账号信息
        const { data: account, error: accountError } = await db.admin
            .from('social_accounts')
            .select('*')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (accountError) throw accountError;

        if (!account) {
            return res.status(404).json({
                success: false,
                message: '社交账号不存在'
            });
        }

        // 这里应该调用对应平台的令牌刷新 API
        // 示例代码，实际需要根据平台实现
        let newTokenData = {};
        
        switch (account.platform) {
            case 'twitter':
                // newTokenData = await refreshTwitterToken(account.refresh_token);
                break;
            case 'facebook':
                // newTokenData = await refreshFacebookToken(account.refresh_token);
                break;
            // 其他平台...
            default:
                throw new Error('不支持的平台令牌刷新');
        }

        // 更新令牌信息
        const { data, error } = await db.admin
            .from('social_accounts')
            .update({
                access_token: newTokenData.access_token,
                refresh_token: newTokenData.refresh_token || account.refresh_token,
                token_expires_at: newTokenData.expires_at,
                last_sync_at: new Date().toISOString()
            })
            .eq('id', accountId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: '令牌刷新成功',
            data: {
                id: data.id,
                platform: data.platform,
                expires_at: data.token_expires_at
            }
        });

    } catch (error) {
        console.error('刷新令牌失败:', error);
        res.status(500).json({
            success: false,
            message: '刷新令牌失败',
            error: error.message
        });
    }
});

// 测试账号连接
router.post('/:id/test-connection', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;

        // 获取账号信息
        const { data: account, error: accountError } = await db.admin
            .from('social_accounts')
            .select('*')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (accountError) throw accountError;

        if (!account) {
            return res.status(404).json({
                success: false,
                message: '社交账号不存在'
            });
        }

        // 这里应该调用对应平台的 API 测试连接
        // 示例代码，实际需要根据平台实现
        let connectionTest = { success: true, message: '连接正常' };
        
        try {
            switch (account.platform) {
                case 'twitter':
                    // connectionTest = await testTwitterConnection(account.access_token);
                    break;
                case 'facebook':
                    // connectionTest = await testFacebookConnection(account.access_token);
                    break;
                // 其他平台...
                default:
                    connectionTest = { success: true, message: '平台连接测试暂未实现' };
            }
        } catch (testError) {
            connectionTest = { success: false, message: testError.message };
        }

        // 更新账号状态
        await db.admin
            .from('social_accounts')
            .update({
                is_active: connectionTest.success,
                last_sync_at: new Date().toISOString()
            })
            .eq('id', accountId);

        res.json({
            success: true,
            data: {
                account_id: accountId,
                platform: account.platform,
                connection_status: connectionTest.success ? 'connected' : 'disconnected',
                message: connectionTest.message,
                tested_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('测试连接失败:', error);
        res.status(500).json({
            success: false,
            message: '测试连接失败',
            error: error.message
        });
    }
});

// 获取账号统计信息
router.get('/:id/stats', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;
        const { period = '30' } = req.query; // 天数

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // 获取发布统计
        const { data: posts, error: postsError } = await db.admin
            .from('platform_posts')
            .select('status, published_at, metrics')
            .eq('social_account_id', accountId)
            .gte('created_at', startDate.toISOString());

        if (postsError) throw postsError;

        // 聚合统计数据
        const stats = {
            total_posts: posts.length,
            published_posts: posts.filter(p => p.status === 'published').length,
            failed_posts: posts.filter(p => p.status === 'failed').length,
            pending_posts: posts.filter(p => p.status === 'pending').length,
            total_engagement: 0,
            total_reach: 0,
            avg_engagement_rate: 0
        };

        // 计算互动数据
        let totalEngagement = 0;
        let totalReach = 0;
        let postsWithMetrics = 0;

        posts.forEach(post => {
            if (post.metrics) {
                const metrics = post.metrics;
                if (metrics.likes) totalEngagement += metrics.likes;
                if (metrics.comments) totalEngagement += metrics.comments;
                if (metrics.shares) totalEngagement += metrics.shares;
                if (metrics.reach) totalReach += metrics.reach;
                postsWithMetrics++;
            }
        });

        stats.total_engagement = totalEngagement;
        stats.total_reach = totalReach;
        stats.avg_engagement_rate = postsWithMetrics > 0 ? 
            Math.round((totalEngagement / totalReach) * 100 * 100) / 100 : 0;

        res.json({
            success: true,
            data: stats,
            period: `${period}天`
        });

    } catch (error) {
        console.error('获取账号统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取账号统计失败',
            error: error.message
        });
    }
});

module.exports = router;
