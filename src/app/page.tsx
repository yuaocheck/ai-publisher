import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline'
import { 
  SocialIcon, 
  TwitterIcon, 
  FacebookIcon, 
  InstagramIcon, 
  LinkedInIcon,
  TikTokIcon,
  YouTubeIcon 
} from '@/components/ui/social-icons'

export const metadata: Metadata = {
  title: 'AI Publisher - 全平台内容发布系统',
  description: '一次编辑，全网智能发布。支持文字、图片、视频自动适配并发布至全球主流社交平台。',
}

const features = [
  {
    name: '多平台发布',
    description: '支持 Twitter、Facebook、Instagram、LinkedIn、TikTok、YouTube 等主流平台',
    icon: SocialIcon,
  },
  {
    name: 'AI 内容生成',
    description: '智能生成文案、图片和视频内容，提升创作效率',
    icon: '🤖',
  },
  {
    name: '内容自动适配',
    description: '根据不同平台特性自动调整内容格式和尺寸',
    icon: '⚡',
  },
  {
    name: '定时发布',
    description: '支持定时发布和循环发布，灵活安排内容计划',
    icon: '⏰',
  },
  {
    name: 'API 接口',
    description: '提供完整的 REST API，支持第三方系统集成',
    icon: '🔗',
  },
  {
    name: '数据分析',
    description: '实时监控发布状态和互动数据，优化内容策略',
    icon: '📊',
  },
]

const platforms = [
  { name: 'Twitter/X', icon: TwitterIcon, color: 'text-blue-500' },
  { name: 'Facebook', icon: FacebookIcon, color: 'text-blue-600' },
  { name: 'Instagram', icon: InstagramIcon, color: 'text-pink-500' },
  { name: 'LinkedIn', icon: LinkedInIcon, color: 'text-blue-700' },
  { name: 'TikTok', icon: TikTokIcon, color: 'text-black' },
  { name: 'YouTube', icon: YouTubeIcon, color: 'text-red-500' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">AI Publisher</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                登录
              </Link>
              <Link
                href="/auth/register"
                className="btn btn-primary btn-md"
              >
                免费试用
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              一次编辑，
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                全网智能发布
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              支持文字、图片、视频自动适配并发布至全球主流社交平台。
              AI 驱动的内容创作，让您的品牌声音传播得更远。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="btn btn-primary btn-lg inline-flex items-center"
              >
                开始免费试用
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/demo"
                className="btn btn-outline btn-lg"
              >
                查看演示
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">支持的平台</h2>
            <p className="text-lg text-gray-600">一键发布到所有主流社交媒体平台</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {platforms.map((platform) => (
              <div key={platform.name} className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 ${platform.color}`}>
                  <platform.icon className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium text-gray-900">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">强大的功能特性</h2>
            <p className="text-lg text-gray-600">为现代内容创作者和营销团队量身定制</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="card">
                <div className="card-content">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                      {typeof feature.icon === 'string' ? (
                        <span className="text-2xl">{feature.icon}</span>
                      ) : (
                        <feature.icon className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            立即注册，体验 AI 驱动的全平台内容发布
          </p>
          <Link
            href="/auth/register"
            className="btn bg-white text-blue-600 hover:bg-gray-100 btn-lg inline-flex items-center"
          >
            免费开始使用
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">AI Publisher</h3>
            <p className="text-gray-400 mb-6">
              全平台内容发布系统 - 让内容创作更智能
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white">
                隐私政策
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                服务条款
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">
                联系我们
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                © 2024 AI Publisher. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
