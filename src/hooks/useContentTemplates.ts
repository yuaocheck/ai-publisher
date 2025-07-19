import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { aiService, type ContentTemplate } from '@/lib/supabase/ai-service'
import toast from 'react-hot-toast'

export interface CreateTemplateData {
  name: string
  description?: string
  content: string
  category: string
  platform: string
  variables?: string[]
  isPublic?: boolean
}

export function useContentTemplates(orgId: string) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)

  // 加载模板列表
  const loadTemplates = useCallback(async (category?: string, platform?: string) => {
    if (!orgId) return

    setLoading(true)
    try {
      const data = await aiService.getContentTemplates(orgId, category, platform)
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
      toast.error('加载模板失败')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  // 创建模板
  const createTemplate = useCallback(async (templateData: CreateTemplateData) => {
    if (!user || !orgId) {
      toast.error('请先登录')
      return null
    }

    setCreating(true)
    try {
      const newTemplate = await aiService.createContentTemplate({
        org_id: orgId,
        name: templateData.name,
        description: templateData.description || '',
        content: templateData.content,
        category: templateData.category,
        platform: templateData.platform,
        variables: templateData.variables || [],
        is_public: templateData.isPublic || false,
        usage_count: 0,
        created_by: user.id,
      })

      setTemplates(prev => [newTemplate, ...prev])
      toast.success('模板创建成功！')
      return newTemplate
    } catch (error) {
      console.error('Failed to create template:', error)
      toast.error('创建模板失败')
      return null
    } finally {
      setCreating(false)
    }
  }, [user, orgId])

  // 更新模板
  const updateTemplate = useCallback(async (id: string, updates: Partial<ContentTemplate>) => {
    if (!user) {
      toast.error('请先登录')
      return null
    }

    setUpdating(true)
    try {
      const updatedTemplate = await aiService.updateContentTemplate(id, updates)
      
      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
        )
      )
      
      toast.success('模板更新成功！')
      return updatedTemplate
    } catch (error) {
      console.error('Failed to update template:', error)
      toast.error('更新模板失败')
      return null
    } finally {
      setUpdating(false)
    }
  }, [user])

  // 删除模板
  const deleteTemplate = useCallback(async (id: string) => {
    if (!user) {
      toast.error('请先登录')
      return false
    }

    if (!confirm('确定要删除这个模板吗？此操作不可撤销。')) {
      return false
    }

    try {
      await aiService.deleteContentTemplate(id)
      setTemplates(prev => prev.filter(template => template.id !== id))
      toast.success('模板删除成功！')
      return true
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error('删除模板失败')
      return false
    }
  }, [user])

  // 使用模板（增加使用次数）
  const useTemplate = useCallback(async (template: ContentTemplate, variables?: Record<string, string>) => {
    try {
      // 增加使用次数
      await aiService.incrementTemplateUsage(template.id)
      
      // 更新本地状态
      setTemplates(prev => 
        prev.map(t => 
          t.id === template.id 
            ? { ...t, usage_count: (t.usage_count || 0) + 1 }
            : t
        )
      )

      // 处理模板变量替换
      let content = template.content
      if (variables && template.variables) {
        template.variables.forEach((variable: string) => {
          if (variables[variable]) {
            const regex = new RegExp(`{{${variable}}}`, 'g')
            content = content.replace(regex, variables[variable])
          }
        })
      }

      return content
    } catch (error) {
      console.error('Failed to use template:', error)
      // 即使统计失败，也返回内容
      return template.content
    }
  }, [])

  // 获取热门模板
  const getPopularTemplates = useCallback(async (limit = 10) => {
    if (!orgId) return []

    try {
      const popularTemplates = await aiService.getPopularTemplates(orgId, limit)
      return popularTemplates
    } catch (error) {
      console.error('Failed to get popular templates:', error)
      return []
    }
  }, [orgId])

  // 搜索模板
  const searchTemplates = useCallback((query: string) => {
    if (!query.trim()) return templates

    const lowercaseQuery = query.toLowerCase()
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description?.toLowerCase().includes(lowercaseQuery) ||
      template.category.toLowerCase().includes(lowercaseQuery) ||
      template.content.toLowerCase().includes(lowercaseQuery)
    )
  }, [templates])

  // 按类别分组模板
  const getTemplatesByCategory = useCallback(() => {
    const grouped: Record<string, ContentTemplate[]> = {}
    
    templates.forEach(template => {
      const category = template.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(template)
    })

    return grouped
  }, [templates])

  // 获取模板变量
  const extractVariables = useCallback((content: string): string[] => {
    const variableRegex = /{{(\w+)}}/g
    const variables: string[] = []
    let match

    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    return variables
  }, [])

  // 验证模板内容
  const validateTemplate = useCallback((templateData: CreateTemplateData) => {
    const errors: string[] = []

    if (!templateData.name.trim()) {
      errors.push('模板名称不能为空')
    }

    if (!templateData.content.trim()) {
      errors.push('模板内容不能为空')
    }

    if (!templateData.category.trim()) {
      errors.push('请选择模板类别')
    }

    if (!templateData.platform.trim()) {
      errors.push('请选择适用平台')
    }

    // 检查内容长度
    if (templateData.content.length > 5000) {
      errors.push('模板内容过长（最多5000字符）')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])

  // 初始加载
  useEffect(() => {
    if (orgId) {
      loadTemplates()
    }
  }, [orgId, loadTemplates])

  return {
    // 状态
    templates,
    loading,
    creating,
    updating,

    // 方法
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    getPopularTemplates,
    searchTemplates,
    getTemplatesByCategory,
    extractVariables,
    validateTemplate,
  }
}

// 模板类别配置
export const TEMPLATE_CATEGORIES = [
  { value: 'product', label: '产品发布', icon: '🚀' },
  { value: 'event', label: '活动推广', icon: '🎉' },
  { value: 'blog', label: '博客分享', icon: '📖' },
  { value: 'news', label: '新闻资讯', icon: '📰' },
  { value: 'promotion', label: '促销活动', icon: '🎁' },
  { value: 'education', label: '教育内容', icon: '🎓' },
  { value: 'entertainment', label: '娱乐内容', icon: '🎭' },
  { value: 'lifestyle', label: '生活方式', icon: '🌟' },
  { value: 'business', label: '商务内容', icon: '💼' },
  { value: 'other', label: '其他', icon: '📝' },
]

// 平台配置
export const TEMPLATE_PLATFORMS = [
  { value: 'all', label: '全平台' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
]
