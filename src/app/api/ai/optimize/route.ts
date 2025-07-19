import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { geminiAI, type ContentOptimizationOptions } from '@/lib/ai/gemini'
import type { Database } from '@/types/database.types'

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { originalContent, platform, objective, targetAudience } = body

    if (!originalContent || !platform || !objective) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 检查使用配额
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()

    const dailyLimit = 10
    if (usage && usage.requests_count >= dailyLimit) {
      return NextResponse.json(
        { error: 'Daily AI optimization limit exceeded' },
        { status: 429 }
      )
    }

    // 优化内容
    const optimizedContent = await geminiAI.optimizeContent({
      originalContent,
      platform,
      objective,
      targetAudience
    } as ContentOptimizationOptions)

    // 更新使用统计
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('ai_usage')
      .upsert({
        user_id: user.id,
        date: today,
        requests_count: (usage?.requests_count || 0) + 1,
        tokens_used: (usage?.tokens_used || 0) + optimizedContent.length,
      })

    return NextResponse.json({
      optimizedContent,
      usage: {
        requests_today: (usage?.requests_count || 0) + 1,
        limit: dailyLimit
      }
    })

  } catch (error) {
    console.error('AI optimization error:', error)
    return NextResponse.json(
      { error: 'Failed to optimize content' },
      { status: 500 }
    )
  }
}
