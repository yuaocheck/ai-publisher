'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/components/providers'
import toast from 'react-hot-toast'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [organizationData, setOrganizationData] = useState({
    name: '',
    slug: '',
    description: '',
  })
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setOrganizationData({
      ...organizationData,
      name,
      slug: generateSlug(name),
    })
  }

  const validateStep1 = () => {
    if (!organizationData.name.trim()) {
      toast.error('请输入组织名称')
      return false
    }
    if (!organizationData.slug.trim()) {
      toast.error('请输入组织标识符')
      return false
    }
    return true
  }

  const handleCreateOrganization = async () => {
    if (!validateStep1()) return

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('create_organization', {
        org_name: organizationData.name,
        org_slug: organizationData.slug,
        org_description: organizationData.description || null,
      })

      if (error) {
        if (error.message.includes('duplicate key')) {
          toast.error('该组织标识符已被使用，请选择其他标识符')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.success('组织创建成功！')
        setStep(2)
      }
    } catch (error) {
      toast.error('创建组织失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleFinishOnboarding = () => {
    toast.success('欢迎使用 AI Publisher！')
    router.push('/dashboard')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
          <span className="text-2xl font-bold text-blue-600">AI</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          欢迎使用 AI Publisher
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          让我们快速设置您的账户
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>创建组织</span>
              <span>完成设置</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  创建您的组织
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  组织是您管理内容和团队成员的工作空间。
                </p>
              </div>

              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
                  组织名称 *
                </label>
                <input
                  id="orgName"
                  type="text"
                  required
                  className="input mt-1"
                  placeholder="例如：我的公司"
                  value={organizationData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="orgSlug" className="block text-sm font-medium text-gray-700">
                  组织标识符 *
                </label>
                <input
                  id="orgSlug"
                  type="text"
                  required
                  className="input mt-1"
                  placeholder="my-company"
                  value={organizationData.slug}
                  onChange={(e) => setOrganizationData({
                    ...organizationData,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  })}
                />
                <p className="mt-1 text-xs text-gray-500">
                  用于 URL 和 API 访问，只能包含小写字母、数字和连字符
                </p>
              </div>

              <div>
                <label htmlFor="orgDescription" className="block text-sm font-medium text-gray-700">
                  组织描述（可选）
                </label>
                <textarea
                  id="orgDescription"
                  rows={3}
                  className="textarea mt-1"
                  placeholder="简单描述您的组织..."
                  value={organizationData.description}
                  onChange={(e) => setOrganizationData({
                    ...organizationData,
                    description: e.target.value
                  })}
                />
              </div>

              <button
                onClick={handleCreateOrganization}
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? '创建中...' : '创建组织'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  设置完成！
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  您的组织 "{organizationData.name}" 已成功创建。
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  接下来您可以：
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 连接社交媒体账号</li>
                  <li>• 创建您的第一个内容</li>
                  <li>• 邀请团队成员</li>
                  <li>• 配置 API 密钥</li>
                </ul>
              </div>

              <button
                onClick={handleFinishOnboarding}
                className="btn btn-primary w-full"
              >
                进入控制台
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
