// AI Publisher Configuration
const AI_CONFIG = {
    // Gemini API Configuration
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    
    // Default generation parameters
    DEFAULT_GENERATION_CONFIG: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
    },
    
    // Content type templates
    CONTENT_TEMPLATES: {
        social_post: {
            name: '社交媒体帖子',
            description: '适合 Twitter、Facebook、Instagram 等平台的短文内容',
            maxLength: 280,
            features: ['表情符号', '话题标签', '互动性强']
        },
        blog_article: {
            name: '博客文章',
            description: '结构化的长文内容，适合博客和专业平台',
            maxLength: 2000,
            features: ['标题结构', '段落分明', '专业性强']
        },
        marketing_copy: {
            name: '营销文案',
            description: '具有销售导向的推广内容',
            maxLength: 500,
            features: ['行动号召', '优惠信息', '紧迫感']
        },
        product_description: {
            name: '产品描述',
            description: '详细的产品特性和优势介绍',
            maxLength: 800,
            features: ['功能特点', '使用场景', '技术规格']
        }
    },
    
    // Tone styles
    TONE_STYLES: {
        professional: {
            name: '专业',
            description: '正式、权威、可信赖的语调',
            keywords: ['专业', '可靠', '权威', '精确']
        },
        casual: {
            name: '随意',
            description: '轻松、自然、亲近的语调',
            keywords: ['轻松', '自然', '亲切', '随性']
        },
        friendly: {
            name: '友好',
            description: '温暖、亲切、易于接近的语调',
            keywords: ['友好', '温暖', '亲切', '贴心']
        },
        humorous: {
            name: '幽默',
            description: '有趣、轻松、娱乐性的语调',
            keywords: ['有趣', '幽默', '轻松', '娱乐']
        },
        inspiring: {
            name: '鼓舞',
            description: '积极、激励、充满正能量的语调',
            keywords: ['激励', '正能量', '鼓舞', '积极']
        }
    },
    
    // Platform specific settings
    PLATFORM_SETTINGS: {
        twitter: {
            name: 'Twitter',
            maxLength: 280,
            features: ['话题标签', '提及用户', '线程发布'],
            style: '简洁、及时、互动性强'
        },
        facebook: {
            name: 'Facebook',
            maxLength: 2000,
            features: ['长文支持', '图文并茂', '社群互动'],
            style: '详细、社交、分享导向'
        },
        instagram: {
            name: 'Instagram',
            maxLength: 2200,
            features: ['视觉优先', '故事性', '标签丰富'],
            style: '视觉化、生活化、美学导向'
        },
        linkedin: {
            name: 'LinkedIn',
            maxLength: 3000,
            features: ['专业内容', '行业洞察', 'B2B导向'],
            style: '专业、深度、商务导向'
        },
        tiktok: {
            name: 'TikTok',
            maxLength: 150,
            features: ['短视频', '年轻化', '创意性'],
            style: '年轻、创意、娱乐导向'
        },
        youtube: {
            name: 'YouTube',
            maxLength: 5000,
            features: ['视频描述', 'SEO优化', '长内容'],
            style: '详细、SEO友好、教育导向'
        }
    },
    
    // Sample prompts for different scenarios
    SAMPLE_PROMPTS: {
        product_launch: [
            '我们即将发布一款革命性的智能手表，具有健康监测和AI助手功能',
            '新推出的在线学习平台，为职场人士提供技能提升课程',
            '环保材料制作的时尚背包，适合都市通勤和户外探险'
        ],
        event_promotion: [
            '举办线上技术分享会，邀请行业专家分享最新趋势',
            '公司年度客户答谢晚宴，感谢合作伙伴的支持',
            '产品体验日活动，用户可以免费试用我们的新功能'
        ],
        brand_story: [
            '分享公司创始人的创业故事和初心',
            '介绍团队成员的工作日常和专业背景',
            '展示公司的企业文化和价值观'
        ],
        industry_insights: [
            '分析人工智能在教育行业的应用前景',
            '探讨远程工作对企业管理的影响',
            '解读最新的数字营销趋势和策略'
        ]
    },
    
    // Error messages
    ERROR_MESSAGES: {
        NO_API_KEY: '请先设置 Gemini API Key',
        INVALID_API_KEY: 'API Key 无效，请检查后重试',
        NETWORK_ERROR: '网络连接失败，请检查网络后重试',
        RATE_LIMIT: 'API 调用频率过高，请稍后重试',
        CONTENT_FILTERED: '生成的内容被过滤，请尝试修改提示词',
        UNKNOWN_ERROR: '未知错误，请稍后重试'
    },
    
    // Success messages
    SUCCESS_MESSAGES: {
        CONTENT_GENERATED: '内容生成成功！',
        CONTENT_OPTIMIZED: '内容优化完成！',
        VARIATIONS_GENERATED: '变体生成成功！',
        CONTENT_COPIED: '内容已复制到剪贴板！',
        API_KEY_SAVED: 'API Key 已保存'
    }
};

// Utility functions
const AIUtils = {
    // Format error messages
    formatError(error) {
        if (error.message.includes('API_KEY_INVALID')) {
            return AI_CONFIG.ERROR_MESSAGES.INVALID_API_KEY;
        } else if (error.message.includes('RATE_LIMIT')) {
            return AI_CONFIG.ERROR_MESSAGES.RATE_LIMIT;
        } else if (error.message.includes('CONTENT_FILTERED')) {
            return AI_CONFIG.ERROR_MESSAGES.CONTENT_FILTERED;
        } else if (error.message.includes('NetworkError')) {
            return AI_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
        } else {
            return AI_CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR;
        }
    },
    
    // Validate API key format
    validateApiKey(apiKey) {
        return apiKey && apiKey.trim().length > 20 && apiKey.startsWith('AIza');
    },
    
    // Get platform specific prompt additions
    getPlatformPromptAddition(platforms) {
        const platformNames = platforms.map(p => AI_CONFIG.PLATFORM_SETTINGS[p]?.name).filter(Boolean);
        if (platformNames.length === 0) return '';
        
        const platformStyles = platforms.map(p => AI_CONFIG.PLATFORM_SETTINGS[p]?.style).filter(Boolean);
        
        return `\n\n针对平台特性：
- 目标平台：${platformNames.join('、')}
- 平台风格：${platformStyles.join('；')}`;
    },
    
    // Get content type specific requirements
    getContentTypeRequirements(contentType) {
        const template = AI_CONFIG.CONTENT_TEMPLATES[contentType];
        if (!template) return '';
        
        return `\n\n内容要求：
- 类型：${template.name}
- 特点：${template.features.join('、')}
- 建议长度：不超过${template.maxLength}字符`;
    },
    
    // Generate random sample prompt
    getRandomSamplePrompt() {
        const categories = Object.keys(AI_CONFIG.SAMPLE_PROMPTS);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const prompts = AI_CONFIG.SAMPLE_PROMPTS[randomCategory];
        return prompts[Math.floor(Math.random() * prompts.length)];
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AI_CONFIG, AIUtils };
}
