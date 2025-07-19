'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/supabase/database'
import { 
  PlusIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  ChartBarIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface DashboardStats {
  total_posts: number
  published_posts: number
  scheduled_posts: number
  draft_posts: number
  connected_accounts: number
  total_members: number
  total_tasks: number
  completed_tasks: number
  failed_tasks: number
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [currentOrg, setCurrentOrg] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      loadDashboardData()
    }
  }, [user, authLoading, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load user's organizations
      const orgs = await db.getOrganizations()
      setOrganizations(orgs)
      
      if (orgs.length > 0) {
        const firstOrg = orgs[0]
        setCurrentOrg(firstOrg)
        
        // Load stats for the first organization
        const orgStats = await db.getOrganizationStats(firstOrg.id)
        setStats(orgStats)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            欢迎使用 AI Publisher
          </h2>
          <p className="text-gray-600 mb-8">
            您还没有加入任何组织，请先创建一个组织。
          </p>
          <Link
            href="/onboarding"
            className="btn btn-primary"
          >
            创建组织
          </Link>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      name: '创建内容',
      description: '创建新的社交媒体内容',
      href: '/dashboard/posts/new',
      icon: PlusIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      name: '查看内容',
      description: '管理您的所有内容',
      href: '/dashboard/posts',
      icon: DocumentTextIcon,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      name: '发布计划',
      description: '查看和管理发布计划',
      href: '/dashboard/schedule',
      icon: CalendarIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      name: '数据分析',
      description: '查看内容表现数据',
      href: '/dashboard/analytics',
      icon: ChartBarIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ]

  const statCards = [
    {
      name: '总内容数',
      value: stats?.total_posts || 0,
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: '已发布',
      value: stats?.published_posts || 0,
      change: '+8%',
      changeType: 'positive',
    },
    {
      name: '待发布',
      value: stats?.scheduled_posts || 0,
      change: '+3%',
      changeType: 'positive',
    },
    {
      name: '连接账号',
      value: stats?.connected_accounts || 0,
      change: '0%',
      changeType: 'neutral',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                控制台
              </h1>
              <p className="text-sm text-gray-600">
                {currentOrg?.name} • 欢迎回来，{user.user_metadata?.full_name || user.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/settings"
                className="btn btn-outline"
              >
                <CogIcon className="h-5 w-5 mr-2" />
                设置
              </Link>
              <Link
                href="/dashboard/posts/new"
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                创建内容
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div key={stat.name} className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="group relative bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex p-3 rounded-lg text-white ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Posts */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">最近内容</h3>
              <Link
                href="/dashboard/posts"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                查看全部
              </Link>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        示例内容标题 {i}
                      </p>
                      <p className="text-sm text-gray-500">
                        2 小时前 • 草稿
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">团队动态</h3>
              <Link
                href="/dashboard/team"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                查看全部
              </Link>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">用户 {i}</span> 创建了新内容
                      </p>
                      <p className="text-sm text-gray-500">
                        {i} 小时前
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
