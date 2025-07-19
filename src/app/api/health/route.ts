import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Basic health check response
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: 'unknown',
        ai_service: 'unknown',
        memory: 'unknown',
      }
    }

    // Check database connection
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
      
      // Simple query to test database connection
      const { error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()
      
      health.checks.database = error && error.code !== 'PGRST116' ? 'unhealthy' : 'healthy'
    } catch (error) {
      health.checks.database = 'unhealthy'
    }

    // Check AI service (Gemini)
    try {
      if (process.env.GEMINI_API_KEY) {
        // Simple check - just verify API key exists
        health.checks.ai_service = 'healthy'
      } else {
        health.checks.ai_service = 'unhealthy'
      }
    } catch (error) {
      health.checks.ai_service = 'unhealthy'
    }

    // Check memory usage
    try {
      const memUsage = process.memoryUsage()
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      }
      
      // Consider unhealthy if heap usage is over 500MB
      health.checks.memory = memUsageMB.heapUsed > 500 ? 'warning' : 'healthy'
      
      // Add memory info to response
      ;(health as any).memory = memUsageMB
    } catch (error) {
      health.checks.memory = 'unknown'
    }

    // Calculate response time
    const responseTime = Date.now() - startTime
    ;(health as any).responseTime = `${responseTime}ms`

    // Determine overall status
    const hasUnhealthy = Object.values(health.checks).includes('unhealthy')
    const hasWarning = Object.values(health.checks).includes('warning')
    
    if (hasUnhealthy) {
      health.status = 'unhealthy'
    } else if (hasWarning) {
      health.status = 'warning'
    }

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 })
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check without detailed information
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Test database connection
    await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single()
    
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}
