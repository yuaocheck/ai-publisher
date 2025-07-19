// AI Publisher - API 处理器

// 简化的 API 处理器，移除复杂的服务依赖

export async function handleAPI(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  try {
    // 健康检查 API
    if (pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: env.NODE_ENV || 'production'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 社交媒体 API - 简化版本
    if (pathname.startsWith('/api/social/')) {
      return new Response(JSON.stringify({
        message: 'Social API endpoint',
        available_platforms: ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'tiktok']
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // AI 生成 API - 简化版本
    if (pathname.startsWith('/api/ai/')) {
      return new Response(JSON.stringify({
        message: 'AI API endpoint',
        available_services: ['text-generation', 'image-generation', 'video-generation']
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 媒体处理 API - 简化版本
    if (pathname.startsWith('/api/media/')) {
      return new Response(JSON.stringify({
        message: 'Media API endpoint',
        supported_formats: ['jpg', 'png', 'gif', 'mp4', 'webm']
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // OAuth 令牌交换
    if (pathname === '/api/oauth/token' && method === 'POST') {
      return handleTokenExchange(request, env);
    }

    // 发布内容到单个平台
    if (pathname.match(/^\/api\/publish\/\w+$/) && method === 'POST') {
      const platform = pathname.split('/').pop();
      return handleSinglePlatformPublish(request, env, platform);
    }

    // 批量发布到多个平台
    if (pathname === '/api/publish/batch' && method === 'POST') {
      return handleBatchPublish(request, env);
    }

    // 获取用户信息
    if (pathname.match(/^\/api\/user\/\w+$/) && method === 'GET') {
      const platform = pathname.split('/').pop();
      return handleGetUserInfo(request, env, platform);
    }

    // 健康检查
    if (pathname === '/api/health' && method === 'GET') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: env.NODE_ENV || 'development'
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // API 不存在
    return new Response(JSON.stringify({
      error: 'API endpoint not found',
      path: pathname,
      method: method
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// OAuth 令牌交换
async function handleTokenExchange(request, env) {
  try {
    const { platform, code, redirect_uri } = await request.json();
    
    if (!platform || !code) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 根据平台交换令牌
    const tokenData = await exchangeCodeForToken(platform, code, redirect_uri, env);
    
    return new Response(JSON.stringify(tokenData), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return new Response(JSON.stringify({
      error: 'Token exchange failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 单平台发布
async function handleSinglePlatformPublish(request, env, platform) {
  try {
    const { content, media, access_token } = await request.json();
    
    if (!content || !access_token) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await publishToPlatform(platform, content, media, access_token, env);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Publish error:', error);
    return new Response(JSON.stringify({
      error: 'Publish failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 批量发布
async function handleBatchPublish(request, env) {
  try {
    const { platforms, content, media, tokens } = await request.json();
    
    if (!platforms || !content || !tokens) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results = [];
    
    for (const platform of platforms) {
      try {
        const result = await publishToPlatform(
          platform, 
          content, 
          media, 
          tokens[platform], 
          env
        );
        results.push({
          platform,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error.message
        });
      }
    }
    
    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Batch publish error:', error);
    return new Response(JSON.stringify({
      error: 'Batch publish failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取用户信息
async function handleGetUserInfo(request, env, platform) {
  try {
    const url = new URL(request.url);
    const access_token = url.searchParams.get('access_token');
    
    if (!access_token) {
      return new Response(JSON.stringify({
        error: 'Missing access token'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userInfo = await getUserInfo(platform, access_token, env);
    
    return new Response(JSON.stringify(userInfo), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get user info',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 辅助函数 - 令牌交换
async function exchangeCodeForToken(platform, code, redirectUri, env) {
  const platformConfigs = {
    twitter: {
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      clientId: env.TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET
    },
    facebook: {
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientId: env.FACEBOOK_APP_ID,
      clientSecret: env.FACEBOOK_APP_SECRET
    },
    instagram: {
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      clientId: env.INSTAGRAM_CLIENT_ID,
      clientSecret: env.INSTAGRAM_CLIENT_SECRET
    },
    linkedin: {
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientId: env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET
    },
    youtube: {
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: env.YOUTUBE_CLIENT_ID,
      clientSecret: env.YOUTUBE_CLIENT_SECRET
    },
    tiktok: {
      tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
      clientId: env.TIKTOK_CLIENT_KEY,
      clientSecret: env.TIKTOK_CLIENT_SECRET
    }
  };

  const config = platformConfigs[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: tokenParams
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token exchange failed: ${errorData}`);
  }

  return await response.json();
}

// 辅助函数 - 发布到平台
async function publishToPlatform(platform, content, media, accessToken, env) {
  // 这里实现具体的平台发布逻辑
  // 为了简化，返回模拟结果
  return {
    id: `${platform}_${Date.now()}`,
    url: `https://${platform}.com/post/${Date.now()}`,
    platform: platform,
    timestamp: new Date().toISOString()
  };
}

// 辅助函数 - 获取用户信息
async function getUserInfo(platform, accessToken, env) {
  // 这里实现具体的用户信息获取逻辑
  // 为了简化，返回模拟结果
  return {
    id: `user_${Date.now()}`,
    name: `Demo User`,
    platform: platform,
    verified: true
  };
}
