'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { db } from '@/lib/supabase/database'
import { adapterManager, type SupportedPlatform } from '@/lib/adapters/manager'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  PlusIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { 
  TwitterIcon, 
  FacebookIcon, 
  InstagramIcon, 
  LinkedInIcon,
  TikTokIcon,
  YouTubeIcon 
} from '@/components/ui/social-icons'
import toast from 'react-hot-toast'

interface Account {
  id: string
  platform: string
  username: string
  display_name: string
  avatar_url?: string
  is_active: boolean
  expires_at?: string
  created_at: string
  metadata?: any
}

const platformIcons = {
  twitter: TwitterIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const orgId = searchParams.get('org') || ''
  const { permissions } = usePermissions(orgId)

  useEffect(() => {
    if (orgId) {
      loadAccounts()
    }
  }, [orgId])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const data = await db.getAccounts(orgId)
      setAccounts(data)
    } catch (error) {
      console.error('Failed to load accounts:', error)
      toast.error('加载账号失败')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectAccount = async (platform: SupportedPlatform) => {
    if (!permissions.canConnectAccounts) {
      toast.error('您没有权限连接账号')
      return
    }

    try {
      setConnecting(platform)
      
      // Get OAuth URL from API
      const response = await fetch(`/api/auth/connect/${platform}?org_id=${orgId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate OAuth')
      }

      // Redirect to OAuth URL
      window.location.href = data.authUrl
    } catch (error) {
      console.error('Failed to connect account:', error)
      toast.error('连接账号失败')
      setConnecting(null)
    }
  }

  const handleDisconnectAccount = async (accountId: string, platform: string) => {
    if (!permissions.canDisconnectAccounts) {
      toast.error('您没有权限断开账号')
      return
    }

    if (!confirm(`确定要断开 ${platform} 账号吗？`)) {
      return
    }

    try {
      await db.updateAccount(accountId, { is_active: false })
      toast.success('账号已断开')
      loadAccounts()
    } catch (error) {
      console.error('Failed to disconnect account:', error)
      toast.error('断开账号失败')
    }
  }

  const handleDeleteAccount = async (accountId: string, platform: string) => {
    if (!permissions.canDisconnectAccounts) {
      toast.error('您没有权限删除账号')
      return
    }

    if (!confirm(`确定要删除 ${platform} 账号吗？此操作不可撤销。`)) {
      return
    }

    try {
      await db.deleteAccount(accountId)
      toast.success('账号已删除')
      loadAccounts()
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('删除账号失败')
    }
  }

  const isTokenExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) <= new Date()
  }

  const getAccountStatus = (account: Account) => {
    if (!account.is_active) {
      return { status: 'inactive', label: '已断开', color: 'text-gray-500' }
    }
    if (isTokenExpired(account.expires_at)) {
      return { status: 'expired', label: '已过期', color: 'text-red-500' }
    }
    return { status: 'active', label: '已连接', color: 'text-green-500' }
  }

  const activePlatforms = adapterManager.getActivePlatforms()
  const platformConfigs = adapterManager.getAllPlatformConfigs()

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">社交账号管理</h1>
        <p className="text-gray-600 mt-2">
          连接您的社交媒体账号以开始发布内容
        </p>
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">已连接账号</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => {
              const IconComponent = platformIcons[account.platform as keyof typeof platformIcons]
              const config = platformConfigs.get(account.platform as SupportedPlatform)
              const status = getAccountStatus(account)

              return (
                <div key={account.id} className="card">
                  <div className="card-content">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {IconComponent && (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                               style={{ backgroundColor: config?.color + '20' }}>
                            <IconComponent className="w-6 h-6" style={{ color: config?.color }} />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {account.display_name || account.username}
                          </h3>
                          <p className="text-sm text-gray-500">@{account.username}</p>
                        </div>
                      </div>
                      {account.avatar_url && (
                        <img
                          src={account.avatar_url}
                          alt={account.username}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {status.status === 'active' && (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        )}
                        {status.status === 'expired' && (
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                        )}
                        {status.status === 'inactive' && (
                          <XCircleIcon className="w-4 h-4 text-gray-500" />
                        )}
                        <span className={`text-sm ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {status.status === 'expired' && (
                          <button
                            onClick={() => handleConnectAccount(account.platform as SupportedPlatform)}
                            className="text-sm text-blue-600 hover:text-blue-500"
                          >
                            重新连接
                          </button>
                        )}
                        {permissions.canDisconnectAccounts && (
                          <button
                            onClick={() => handleDeleteAccount(account.id, account.platform)}
                            className="text-red-600 hover:text-red-500"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {account.metadata?.followerCount && (
                      <div className="mt-2 text-xs text-gray-500">
                        {account.metadata.followerCount.toLocaleString()} 关注者
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">可连接平台</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlatforms.map((platform) => {
            const config = platformConfigs.get(platform)!
            const IconComponent = platformIcons[platform as keyof typeof platformIcons]
            const isConnected = accounts.some(acc => acc.platform === platform && acc.is_active)
            const isConnecting = connecting === platform

            return (
              <div key={platform} className="card">
                <div className="card-content">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {IconComponent && (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                             style={{ backgroundColor: config.color + '20' }}>
                          <IconComponent className="w-6 h-6" style={{ color: config.color }} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{config.displayName}</h3>
                        <p className="text-sm text-gray-500">
                          {config.features.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {isConnected ? '已连接' : '未连接'}
                    </div>
                    
                    {permissions.canConnectAccounts && (
                      <button
                        onClick={() => handleConnectAccount(platform)}
                        disabled={isConnecting}
                        className="btn btn-primary btn-sm"
                      >
                        {isConnecting ? (
                          '连接中...'
                        ) : (
                          <>
                            <PlusIcon className="w-4 h-4 mr-1" />
                            {isConnected ? '重新连接' : '连接'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {!permissions.canConnectAccounts && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              您没有权限连接社交账号。请联系管理员获取权限。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
