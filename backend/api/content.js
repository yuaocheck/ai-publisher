// 内容发布管理 API
const express = require('express');
const router = express.Router();
const { DatabaseHelper } = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

const db = new DatabaseHelper();

// 获取用户的内容发布列表
router.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            page = 1, 
            limit = 20, 
            status = null, 
            content_type = null,
            search = null 
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let query = db.admin
            .from('content_posts')
            .select(`
                *,
                platform_posts (
                    id,
                    platform,
                    status,
                    platform_url,
                    published_at,
                    metrics
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (content_type) {
            query = query.eq('content_type', content_type);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({
            success: true,
            data: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: data.length
            }
        });

    } catch (error) {
        console.error('获取内容列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取内容列表失败',
            error: error.message
        });
    }
});

// 获取单个内容详情
router.get('/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const contentId = req.params.id;

        const { data, error } = await db.admin
            .from('content_posts')
            .select(`
                *,
                platform_posts (
                    id,
                    platform,
                    status,
                    platform_post_id,
                    platform_url,
                    adapted_content,
                    published_at,
                    metrics,
                    error_message
                ),
                ai_generation_history (
                    id,
                    generation_type,
                    tokens_used,
                    generation_time_ms,
                    created_at
                )
            `)
            .eq('id', contentId)
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: '内容不存在'
            });
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('获取内容详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取内容详情失败',
            error: error.message
        });
    }
});

// 创建新内容
router.post('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            title,
            content,
            content_type = 'social_post',
            tone = 'friendly',
            length = 'medium',
            language = 'zh-CN',
            target_platforms = ['twitter'],
            scheduled_at = null,
            ai_generated = false,
            ai_model = null,
            prompt_used = null,
            generation_config = null
        } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: '内容不能为空'
            });
        }

        const postData = {
            user_id: userId,
            title: title || content.substring(0, 100),
            content,
            content_type,
            tone,
            length,
            language,
            target_platforms,
            status: scheduled_at ? 'scheduled' : 'draft',
            scheduled_at,
            ai_generated,
            ai_model,
            prompt_used,
            generation_config
        };

        const contentPost = await db.createContentPost(postData);

        res.status(201).json({
            success: true,
            message: '内容创建成功',
            data: contentPost
        });

    } catch (error) {
        console.error('创建内容失败:', error);
        res.status(500).json({
            success: false,
            message: '创建内容失败',
            error: error.message
        });
    }
});

// 更新内容
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const contentId = req.params.id;
        const {
            title,
            content,
            content_type,
            tone,
            length,
            language,
            target_platforms,
            scheduled_at,
            status
        } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (content_type !== undefined) updateData.content_type = content_type;
        if (tone !== undefined) updateData.tone = tone;
        if (length !== undefined) updateData.length = length;
        if (language !== undefined) updateData.language = language;
        if (target_platforms !== undefined) updateData.target_platforms = target_platforms;
        if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
        if (status !== undefined) updateData.status = status;

        const { data, error } = await db.admin
            .from('content_posts')
            .update(updateData)
            .eq('id', contentId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: '内容不存在或无权限修改'
            });
        }

        res.json({
            success: true,
            message: '内容更新成功',
            data: data
        });

    } catch (error) {
        console.error('更新内容失败:', error);
        res.status(500).json({
            success: false,
            message: '更新内容失败',
            error: error.message
        });
    }
});

// 删除内容
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const contentId = req.params.id;

        const { data, error } = await db.admin
            .from('content_posts')
            .delete()
            .eq('id', contentId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: '内容不存在或无权限删除'
            });
        }

        res.json({
            success: true,
            message: '内容删除成功'
        });

    } catch (error) {
        console.error('删除内容失败:', error);
        res.status(500).json({
            success: false,
            message: '删除内容失败',
            error: error.message
        });
    }
});

// 发布内容到指定平台
router.post('/:id/publish', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const contentId = req.params.id;
        const { platforms = null, schedule_time = null } = req.body;

        // 获取内容详情
        const { data: contentPost, error: contentError } = await db.admin
            .from('content_posts')
            .select('*')
            .eq('id', contentId)
            .eq('user_id', userId)
            .single();

        if (contentError) throw contentError;

        if (!contentPost) {
            return res.status(404).json({
                success: false,
                message: '内容不存在'
            });
        }

        const targetPlatforms = platforms || contentPost.target_platforms;

        // 获取用户的社交账号
        const { data: socialAccounts, error: accountsError } = await db.admin
            .from('social_accounts')
            .select('*')
            .eq('user_id', userId)
            .in('platform', targetPlatforms)
            .eq('is_active', true);

        if (accountsError) throw accountsError;

        if (socialAccounts.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有找到可用的社交账号'
            });
        }

        const platformPosts = [];

        // 为每个平台创建发布记录
        for (const account of socialAccounts) {
            const platformPostData = {
                content_post_id: contentId,
                social_account_id: account.id,
                platform: account.platform,
                adapted_content: contentPost.content, // 这里可以添加平台适配逻辑
                status: schedule_time ? 'scheduled' : 'pending'
            };

            const platformPost = await db.createPlatformPost(platformPostData);
            platformPosts.push(platformPost);
        }

        // 更新内容状态
        const newStatus = schedule_time ? 'scheduled' : 'published';
        await db.admin
            .from('content_posts')
            .update({ 
                status: newStatus,
                published_at: schedule_time ? null : new Date().toISOString(),
                scheduled_at: schedule_time
            })
            .eq('id', contentId);

        // 如果是定时发布，创建定时任务
        if (schedule_time) {
            await db.createScheduledTask({
                user_id: userId,
                content_post_id: contentId,
                task_type: 'publish_once',
                scheduled_time: schedule_time,
                target_platforms: targetPlatforms,
                next_run_at: schedule_time
            });
        }

        res.json({
            success: true,
            message: schedule_time ? '内容已安排定时发布' : '内容发布请求已提交',
            data: {
                content_post_id: contentId,
                platform_posts: platformPosts,
                scheduled_at: schedule_time,
                target_platforms: targetPlatforms
            }
        });

    } catch (error) {
        console.error('发布内容失败:', error);
        res.status(500).json({
            success: false,
            message: '发布内容失败',
            error: error.message
        });
    }
});

// 获取内容统计
router.get('/stats/overview', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '30' } = req.query; // 天数

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // 获取基本统计
        const { data: stats, error: statsError } = await db.admin
            .from('content_posts')
            .select('status, content_type, ai_generated')
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString());

        if (statsError) throw statsError;

        // 聚合统计数据
        const overview = {
            total_posts: stats.length,
            draft_posts: stats.filter(p => p.status === 'draft').length,
            published_posts: stats.filter(p => p.status === 'published').length,
            scheduled_posts: stats.filter(p => p.status === 'scheduled').length,
            ai_generated_posts: stats.filter(p => p.ai_generated).length,
            content_types: {}
        };

        // 按内容类型统计
        stats.forEach(post => {
            if (!overview.content_types[post.content_type]) {
                overview.content_types[post.content_type] = 0;
            }
            overview.content_types[post.content_type]++;
        });

        res.json({
            success: true,
            data: overview,
            period: `${period}天`
        });

    } catch (error) {
        console.error('获取内容统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取内容统计失败',
            error: error.message
        });
    }
});

module.exports = router;
