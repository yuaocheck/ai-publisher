import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// 初始化 Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// 安全设置
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

// 生成配置
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
}

export interface ContentGenerationOptions {
  type: 'social_post' | 'blog_article' | 'marketing_copy' | 'product_description'
  platform?: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube'
  tone?: 'professional' | 'casual' | 'friendly' | 'humorous' | 'inspiring' | 'urgent'
  length?: 'short' | 'medium' | 'long'
  keywords?: string[]
  targetAudience?: string
  language?: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
}

export interface ContentOptimizationOptions {
  originalContent: string
  platform: string
  objective: 'engagement' | 'reach' | 'conversion' | 'brand_awareness'
  targetAudience?: string
}

export interface HashtagSuggestionOptions {
  content: string
  platform: string
  industry?: string
  count?: number
}

export class GeminiAIService {
  private model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-pro',
    safetySettings,
    generationConfig
  })

  /**
   * 生成社交媒体内容
   */
  async generateContent(prompt: string, options: ContentGenerationOptions): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(options)
      const fullPrompt = `${systemPrompt}\n\n用户需求：${prompt}`

      const result = await this.model.generateContent(fullPrompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini content generation error:', error)
      throw new Error('内容生成失败，请重试')
    }
  }

  /**
   * 优化现有内容
   */
  async optimizeContent(options: ContentOptimizationOptions): Promise<string> {
    try {
      const prompt = `
请优化以下社交媒体内容，使其更适合${options.platform}平台，目标是提高${options.objective}：

原始内容：
${options.originalContent}

优化要求：
1. 保持原意不变
2. 适配${options.platform}平台特性
3. 提高${options.objective}效果
4. 使用吸引人的语言
${options.targetAudience ? `5. 针对目标受众：${options.targetAudience}` : ''}

请直接返回优化后的内容，不需要解释。
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini content optimization error:', error)
      throw new Error('内容优化失败，请重试')
    }
  }

  /**
   * 生成标签建议
   */
  async suggestHashtags(options: HashtagSuggestionOptions): Promise<string[]> {
    try {
      const prompt = `
请为以下内容推荐适合${options.platform}平台的标签：

内容：
${options.content}

要求：
1. 推荐${options.count || 10}个相关标签
2. 标签要热门且相关
3. 适合${options.platform}平台
${options.industry ? `4. 考虑行业特点：${options.industry}` : ''}
5. 只返回标签列表，每行一个，格式：#标签名

请直接返回标签列表：
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // 解析标签
      const hashtags = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('#'))
        .map(line => line.substring(1))
        .slice(0, options.count || 10)

      return hashtags
    } catch (error) {
      console.error('Gemini hashtag suggestion error:', error)
      throw new Error('标签建议生成失败，请重试')
    }
  }

  /**
   * 分析内容情感和适用性
   */
  async analyzeContent(content: string, platform: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative'
    appropriateness: number // 0-100
    suggestions: string[]
    estimatedEngagement: 'low' | 'medium' | 'high'
  }> {
    try {
      const prompt = `
请分析以下内容在${platform}平台的适用性：

内容：
${content}

请从以下维度分析并返回JSON格式结果：
{
  "sentiment": "positive/neutral/negative",
  "appropriateness": 0-100的数字,
  "suggestions": ["建议1", "建议2", "建议3"],
  "estimatedEngagement": "low/medium/high"
}

分析维度：
1. 情感倾向（positive/neutral/negative）
2. 平台适用性评分（0-100）
3. 改进建议（最多3条）
4. 预估互动效果（low/medium/high）
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        return JSON.parse(text)
      } catch {
        // 如果JSON解析失败，返回默认值
        return {
          sentiment: 'neutral' as const,
          appropriateness: 70,
          suggestions: ['内容分析暂时不可用'],
          estimatedEngagement: 'medium' as const
        }
      }
    } catch (error) {
      console.error('Gemini content analysis error:', error)
      throw new Error('内容分析失败，请重试')
    }
  }

  /**
   * 生成发布时间建议
   */
  async suggestPostingTime(platform: string, targetAudience?: string, timezone = 'Asia/Shanghai'): Promise<{
    bestTimes: string[]
    reasoning: string
  }> {
    try {
      const prompt = `
请为${platform}平台推荐最佳发布时间：

平台：${platform}
${targetAudience ? `目标受众：${targetAudience}` : ''}
时区：${timezone}

请返回JSON格式：
{
  "bestTimes": ["时间1", "时间2", "时间3"],
  "reasoning": "推荐理由"
}

考虑因素：
1. 平台用户活跃时间
2. 目标受众习惯
3. 时区差异
4. 工作日vs周末
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        return JSON.parse(text)
      } catch {
        return {
          bestTimes: ['09:00', '12:00', '18:00'],
          reasoning: '基于一般用户活跃时间推荐'
        }
      }
    } catch (error) {
      console.error('Gemini posting time suggestion error:', error)
      throw new Error('发布时间建议生成失败，请重试')
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(options: ContentGenerationOptions): string {
    const platformSpecs = {
      twitter: '推特平台，字符限制280字，适合简洁有力的内容',
      facebook: 'Facebook平台，适合较长的内容和故事性表达',
      instagram: 'Instagram平台，重视视觉效果，配合图片的文案',
      linkedin: 'LinkedIn专业平台，适合商务和职场内容',
      tiktok: 'TikTok短视频平台，需要吸引年轻用户的创意内容',
      youtube: 'YouTube视频平台，适合详细的描述和介绍'
    }

    const toneSpecs = {
      professional: '专业、正式的语调',
      casual: '轻松、随意的语调',
      friendly: '友好、亲切的语调',
      humorous: '幽默、有趣的语调',
      inspiring: '鼓舞人心、积极向上的语调',
      urgent: '紧迫、行动导向的语调'
    }

    const lengthSpecs = {
      short: '简短精炼（50字以内）',
      medium: '中等长度（50-200字）',
      long: '详细完整（200字以上）'
    }

    let systemPrompt = `你是一个专业的社交媒体内容创作专家。请根据以下要求生成高质量的${options.type}内容：

内容类型：${options.type}
${options.platform ? `目标平台：${options.platform} - ${platformSpecs[options.platform]}` : ''}
${options.tone ? `语调风格：${toneSpecs[options.tone]}` : ''}
${options.length ? `内容长度：${lengthSpecs[options.length]}` : ''}
${options.targetAudience ? `目标受众：${options.targetAudience}` : ''}
${options.keywords?.length ? `关键词：${options.keywords.join(', ')}` : ''}
语言：${options.language || 'zh-CN'}

创作要求：
1. 内容要有吸引力和互动性
2. 符合平台特性和用户习惯
3. 语言自然流畅
4. 包含适当的情感元素
5. 考虑SEO和传播效果
6. 直接返回内容，不需要额外解释`

    return systemPrompt
  }

  /**
   * 批量生成内容变体
   */
  async generateVariations(originalContent: string, count = 3): Promise<string[]> {
    try {
      const prompt = `
请为以下内容生成${count}个不同的变体版本：

原始内容：
${originalContent}

要求：
1. 保持核心信息不变
2. 使用不同的表达方式
3. 每个变体都要有独特性
4. 保持相同的语调和风格
5. 每个变体单独一行

变体内容：
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, count)
    } catch (error) {
      console.error('Gemini content variations error:', error)
      throw new Error('内容变体生成失败，请重试')
    }
  }
}

// 导出单例实例
export const geminiAI = new GeminiAIService()
