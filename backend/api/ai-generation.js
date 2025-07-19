// AI 内容生成 API
const express = require('express');
const router = express.Router();
const { DatabaseHelper } = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const db = new DatabaseHelper();

// 初始化 Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 内容类型映射
const CONTENT_TYPE_MAP = {
    social_post: '社交媒体帖子',
    blog_article: '博客文章',
    marketing_copy: '营销文案',
    product_description: '产品描述'
};

// 语调映射
const TONE_MAP = {
    professional: '专业',
    casual: '随意',
    friendly: '友好',
    humorous: '幽默',
    inspiring: '鼓舞人心'
};

// 长度映射
const LENGTH_MAP = {
    short: '简短（50-100字）',
    medium: '中等（100-300字）',
    long: '详细（300-500字）'
};

// 构建提示词
function buildPrompt(params) {
    const {
        prompt,
        content_type = 'social_post',
        tone = 'friendly',
        length = 'medium',
        target_platforms = ['twitter'],
        language = 'zh-CN'
    } = params;

    const platformsText = target_platforms.join('、');
    
    return `请为我创作一个${CONTENT_TYPE_MAP[content_type]}，主题是：${prompt}

要求：
- 语调风格：${TONE_MAP[tone]}
- 内容长度：${LENGTH_MAP[length]}
- 目标平台：${platformsText}
- 语言：${language === 'zh-CN' ? '中文' : '英文'}

请确保内容：
1. 符合目标平台的特点和用户习惯
2. 具有吸引力和互动性
3. 包含适当的表情符号和标签（如果适用）
4. 语言自然流畅，符合指定的语调风格

请直接返回生成的内容，不需要额外的解释。`;
}

// 检查用户 API 使用限制
async function checkApiUsage(userId) {
    const { data: user, error } = await db.admin
        .from('ai_publisher_users')
        .select('api_usage_count, api_usage_limit, subscription_plan')
        .eq('id', userId)
        .single();

    if (error) throw error;

    if (user.api_usage_count >= user.api_usage_limit) {
        throw new Error('API 使用次数已达上限，请升级订阅计划或等待重置');
    }

    return user;
}

// 生成内容
router.post('/generate', authenticateUser, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const userId = req.user.id;
        const {
            prompt,
            content_type = 'social_post',
            tone = 'friendly',
            length = 'medium',
            target_platforms = ['twitter'],
            language = 'zh-CN',
            save_to_posts = false
        } = req.body;

        // 验证必需参数
        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: '请提供内容主题'
            });
        }

        // 检查 API 使用限制
        await checkApiUsage(userId);

        // 构建提示词
        const fullPrompt = buildPrompt({
            prompt,
            content_type,
            tone,
            length,
            target_platforms,
            language
        });

        // 调用 Gemini API
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const generatedContent = response.text();

        const generationTime = Date.now() - startTime;

        // 记录 AI 生成历史
        const generationRecord = await db.recordAIGeneration({
            user_id: userId,
            prompt: prompt,
            ai_model: 'gemini-pro',
            generation_type: 'generate',
            input_parameters: {
                content_type,
                tone,
                length,
                target_platforms,
                language
            },
            generated_content: generatedContent,
            tokens_used: generatedContent.length, // 简单估算
            generation_time_ms: generationTime,
            success: true,
            api_response: {
                model: 'gemini-pro',
                usage: {
                    prompt_tokens: fullPrompt.length,
                    completion_tokens: generatedContent.length,
                    total_tokens: fullPrompt.length + generatedContent.length
                }
            }
        });

        // 更新用户 API 使用计数
        await db.updateApiUsage(userId, 1);

        // 如果需要保存为内容发布
        let contentPost = null;
        if (save_to_posts) {
            contentPost = await db.createContentPost({
                user_id: userId,
                title: prompt.substring(0, 100),
                content: generatedContent,
                content_type,
                tone,
                length,
                language,
                target_platforms,
                status: 'draft',
                ai_generated: true,
                ai_model: 'gemini-pro',
                prompt_used: prompt,
                generation_config: {
                    content_type,
                    tone,
                    length,
                    target_platforms,
                    language
                }
            });
        }

        res.json({
            success: true,
            data: {
                content: generatedContent,
                generation_id: generationRecord.id,
                content_post_id: contentPost?.id,
                generation_time_ms: generationTime,
                tokens_used: generatedContent.length,
                parameters: {
                    content_type,
                    tone,
                    length,
                    target_platforms,
                    language
                }
            }
        });

    } catch (error) {
        const generationTime = Date.now() - startTime;
        
        // 记录失败的生成尝试
        try {
            await db.recordAIGeneration({
                user_id: req.user.id,
                prompt: req.body.prompt || '',
                ai_model: 'gemini-pro',
                generation_type: 'generate',
                input_parameters: req.body,
                generated_content: null,
                tokens_used: 0,
                generation_time_ms: generationTime,
                success: false,
                error_message: error.message
            });
        } catch (recordError) {
            console.error('记录失败生成历史时出错:', recordError);
        }

        console.error('AI 内容生成失败:', error);
        res.status(500).json({
            success: false,
            message: 'AI 内容生成失败',
            error: error.message
        });
    }
});

// 优化内容
router.post('/optimize', authenticateUser, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const userId = req.user.id;
        const { content, target_platforms = ['twitter'] } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: '请提供要优化的内容'
            });
        }

        // 检查 API 使用限制
        await checkApiUsage(userId);

        const optimizePrompt = `请优化以下内容，使其更加吸引人和有效：

原内容：
${content}

优化要求：
1. 提高内容的吸引力和互动性
2. 优化结构和表达方式
3. 添加更有效的调用行动（CTA）
4. 保持原有的核心信息和语调
5. 适合平台：${target_platforms.join('、')}

请直接返回优化后的内容：`;

        // 调用 Gemini API
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(optimizePrompt);
        const response = await result.response;
        const optimizedContent = response.text();

        const generationTime = Date.now() - startTime;

        // 记录优化历史
        const generationRecord = await db.recordAIGeneration({
            user_id: userId,
            prompt: content,
            ai_model: 'gemini-pro',
            generation_type: 'optimize',
            input_parameters: {
                original_content: content,
                target_platforms
            },
            generated_content: optimizedContent,
            tokens_used: optimizedContent.length,
            generation_time_ms: generationTime,
            success: true
        });

        // 更新用户 API 使用计数
        await db.updateApiUsage(userId, 1);

        res.json({
            success: true,
            data: {
                original_content: content,
                optimized_content: optimizedContent,
                generation_id: generationRecord.id,
                generation_time_ms: generationTime,
                improvement_suggestions: [
                    '增强了互动性',
                    '优化了表达方式',
                    '添加了行动号召'
                ]
            }
        });

    } catch (error) {
        console.error('内容优化失败:', error);
        res.status(500).json({
            success: false,
            message: '内容优化失败',
            error: error.message
        });
    }
});

// 生成内容变体
router.post('/variations', authenticateUser, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const userId = req.user.id;
        const { content, count = 3, target_platforms = ['twitter'] } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: '请提供原始内容'
            });
        }

        // 检查 API 使用限制
        await checkApiUsage(userId);

        const variations = [];
        const generationRecords = [];

        // 生成多个变体
        for (let i = 0; i < Math.min(count, 5); i++) {
            const variationPrompt = `请基于以下内容创作一个变体版本，保持核心信息不变，但改变表达方式和结构：

原内容：
${content}

要求：
- 保持相同的核心信息
- 创新表达方式，但不改变主要意思
- 适合平台：${target_platforms.join('、')}
- 变体 ${i + 1}

请直接返回变体内容：`;

            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
                const result = await model.generateContent(variationPrompt);
                const response = await result.response;
                const variation = response.text();

                variations.push({
                    index: i + 1,
                    content: variation,
                    length: variation.length
                });

                // 记录变体生成历史
                const record = await db.recordAIGeneration({
                    user_id: userId,
                    prompt: content,
                    ai_model: 'gemini-pro',
                    generation_type: 'variation',
                    input_parameters: {
                        original_content: content,
                        variation_index: i + 1,
                        target_platforms
                    },
                    generated_content: variation,
                    tokens_used: variation.length,
                    generation_time_ms: Date.now() - startTime,
                    success: true
                });

                generationRecords.push(record.id);

            } catch (variationError) {
                console.error(`生成变体 ${i + 1} 失败:`, variationError);
                // 继续生成其他变体
            }
        }

        // 更新用户 API 使用计数
        await db.updateApiUsage(userId, variations.length);

        const totalGenerationTime = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                original_content: content,
                variations: variations,
                generation_ids: generationRecords,
                total_variations: variations.length,
                generation_time_ms: totalGenerationTime
            }
        });

    } catch (error) {
        console.error('生成内容变体失败:', error);
        res.status(500).json({
            success: false,
            message: '生成内容变体失败',
            error: error.message
        });
    }
});

// 获取 AI 生成历史
router.get('/history', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type = null } = req.query;
        
        const offset = (page - 1) * limit;
        
        let query = db.admin
            .from('ai_generation_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (type) {
            query = query.eq('generation_type', type);
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
        console.error('获取 AI 生成历史失败:', error);
        res.status(500).json({
            success: false,
            message: '获取 AI 生成历史失败',
            error: error.message
        });
    }
});

module.exports = router;
