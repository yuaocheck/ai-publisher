import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { geminiAI, type HashtagSuggestionOptions } from '@/lib/ai/gemini'
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
    const { content, platform, industry, count = 10 } = body

    if (!content || !platform) {
      return NextResponse.json(
        { error: 'Content and platform are required' },
        { status: 400 }
      )
    }

    // 生成标签建议
    const hashtags = await geminiAI.suggestHashtags({
      content,
      platform,
      industry,
      count
    } as HashtagSuggestionOptions)

    return NextResponse.json({
      hashtags,
      count: hashtags.length
    })

  } catch (error) {
    console.error('AI hashtag suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate hashtag suggestions' },
      { status: 500 }
    )
  }
}
