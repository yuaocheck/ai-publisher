import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { geminiAI, type ContentGenerationOptions } from '@/lib/ai/gemini'
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
    const { prompt, options } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // 验证用户的 AI 使用配额
    const { data: usage, error: usageError } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Failed to check AI usage:', usageError)
      return NextResponse.json(
        { error: 'Failed to check usage limits' },
        { status: 500 }
      )
    }

    // 检查每日限制（免费用户每天10次，付费用户无限制）
    const dailyLimit = 10 // 可以根据用户订阅计划调整
    if (usage && usage.requests_count >= dailyLimit) {
      return NextResponse.json(
        { error: 'Daily AI generation limit exceeded' },
        { status: 429 }
      )
    }

    // 生成内容
    const generatedContent = await geminiAI.generateContent(prompt, options as ContentGenerationOptions)

    // 记录使用情况
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('ai_usage')
      .upsert({
        user_id: user.id,
        date: today,
        requests_count: (usage?.requests_count || 0) + 1,
        tokens_used: (usage?.tokens_used || 0) + generatedContent.length,
      })

    // 保存生成历史
    await supabase
      .from('ai_generations')
      .insert({
        user_id: user.id,
        prompt,
        generated_content: generatedContent,
        options,
        model: 'gemini-1.5-pro',
      })

    return NextResponse.json({
      content: generatedContent,
      usage: {
        requests_today: (usage?.requests_count || 0) + 1,
        limit: dailyLimit
      }
    })

  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
