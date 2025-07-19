// AI Publisher - OAuth 处理器

export async function handleOAuth(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;

  // OAuth 回调处理
  if (pathname.startsWith('/oauth/callback/')) {
    const platform = pathname.split('/').pop();
    return handleOAuthCallback(request, env, platform);
  }

  // OAuth 授权 URL 生成
  if (pathname.startsWith('/oauth/authorize/')) {
    const platform = pathname.split('/').pop();
    return handleOAuthAuthorize(request, env, platform);
  }

  return new Response('OAuth endpoint not found', { status: 404 });
}

// 处理 OAuth 回调
async function handleOAuthCallback(request, env, platform) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get('state');

  // 生成回调页面 HTML
  const callbackHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>授权回调 - AI Publisher</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
    <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div class="text-center">
            <div id="loading" class="mb-6" ${error ? 'style="display:none"' : ''}>
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
                </div>
                <h2 class="text-xl font-semibold text-gray-900 mb-2">正在处理授权...</h2>
                <p class="text-gray-600">请稍候，正在完成账号连接</p>
            </div>
            
            <div id="success" class="mb-6" ${!error && code ? '' : 'style="display:none"'}>
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-green-600 text-2xl"></i>
                </div>
                <h2 class="text-xl font-semibold text-gray-900 mb-2">授权成功！</h2>
                <p class="text-gray-600">账号已成功连接，窗口将自动关闭</p>
            </div>
            
            <div id="error" class="mb-6" ${error ? '' : 'style="display:none"'}>
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-times text-red-600 text-2xl"></i>
                </div>
                <h2 class="text-xl font-semibold text-gray-900 mb-2">授权失败</h2>
                <p class="text-gray-600" id="error-message">${error ? getErrorMessage(error) : '授权过程中出现错误，请重试'}</p>
            </div>
            
            <button 
                id="close-btn" 
                onclick="window.close()" 
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200"
                ${!error && !code ? 'style="display:none"' : ''}
            >
                关闭窗口
            </button>
        </div>
    </div>

    <script>
        // 处理授权结果
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');
        
        if (code && !error) {
            // 授权成功，传递数据给父窗口
            if (window.opener) {
                try {
                    window.opener.postMessage({
                        type: 'oauth_callback',
                        platform: '${platform}',
                        code: code,
                        state: state,
                        success: true
                    }, window.location.origin);
                    
                    // 3秒后自动关闭
                    setTimeout(() => {
                        window.close();
                    }, 3000);
                } catch (error) {
                    console.error('传递授权信息失败:', error);
                    document.getElementById('success').style.display = 'none';
                    document.getElementById('error').style.display = 'block';
                    document.getElementById('error-message').textContent = '授权信息传递失败';
                    document.getElementById('close-btn').style.display = 'block';
                }
            } else {
                // 通过 localStorage 传递信息
                try {
                    const authData = {
                        platform: '${platform}',
                        code: code,
                        state: state,
                        timestamp: Date.now(),
                        success: true
                    };
                    localStorage.setItem('oauth_callback_data', JSON.stringify(authData));
                    
                    setTimeout(() => {
                        window.close();
                    }, 3000);
                } catch (error) {
                    console.error('保存授权信息失败:', error);
                    document.getElementById('success').style.display = 'none';
                    document.getElementById('error').style.display = 'block';
                    document.getElementById('error-message').textContent = '授权信息保存失败';
                    document.getElementById('close-btn').style.display = 'block';
                }
            }
        } else if (error) {
            // 授权失败
            document.getElementById('close-btn').style.display = 'block';
        }
        
        function getErrorMessage(error) {
            const errorMessages = {
                'access_denied': '用户拒绝了授权请求',
                'invalid_request': '授权请求无效',
                'unauthorized_client': '客户端未授权',
                'unsupported_response_type': '不支持的响应类型',
                'invalid_scope': '请求的权限范围无效',
                'server_error': '服务器错误',
                'temporarily_unavailable': '服务暂时不可用'
            };
            
            return errorMessages[error] || \`授权错误: \${error}\`;
        }
    </script>
</body>
</html>`;

  return new Response(callbackHTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

// 处理 OAuth 授权 URL 生成
async function handleOAuthAuthorize(request, env, platform) {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/oauth/callback/${platform}`;
  const state = url.searchParams.get('state') || generateState();

  const authUrls = {
    twitter: buildTwitterAuthUrl(env.TWITTER_CLIENT_ID, redirectUri, state),
    facebook: buildFacebookAuthUrl(env.FACEBOOK_APP_ID, redirectUri, state),
    instagram: buildInstagramAuthUrl(env.INSTAGRAM_CLIENT_ID, redirectUri, state),
    linkedin: buildLinkedInAuthUrl(env.LINKEDIN_CLIENT_ID, redirectUri, state),
    youtube: buildYouTubeAuthUrl(env.YOUTUBE_CLIENT_ID, redirectUri, state),
    tiktok: buildTikTokAuthUrl(env.TIKTOK_CLIENT_KEY, redirectUri, state)
  };

  const authUrl = authUrls[platform];
  if (!authUrl) {
    return new Response(JSON.stringify({
      error: `Unsupported platform: ${platform}`
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return Response.redirect(authUrl, 302);
}

// 构建各平台授权 URL
function buildTwitterAuthUrl(clientId, redirectUri, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read tweet.write users.read',
    state: state,
    code_challenge_method: 'S256',
    code_challenge: generateCodeChallenge()
  });
  
  return `https://twitter.com/i/oauth2/authorize?${params}`;
}

function buildFacebookAuthUrl(appId, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'pages_manage_posts,pages_read_engagement',
    response_type: 'code',
    state: state
  });
  
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
}

function buildInstagramAuthUrl(clientId, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user_profile,user_media',
    response_type: 'code',
    state: state
  });
  
  return `https://api.instagram.com/oauth/authorize?${params}`;
}

function buildLinkedInAuthUrl(clientId, redirectUri, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'w_member_social',
    state: state
  });
  
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

function buildYouTubeAuthUrl(clientId, redirectUri, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'https://www.googleapis.com/auth/youtube.upload',
    state: state,
    access_type: 'offline'
  });
  
  return `https://accounts.google.com/oauth2/v2/auth?${params}`;
}

function buildTikTokAuthUrl(clientKey, redirectUri, state) {
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    scope: 'user.info.basic,video.upload',
    response_type: 'code',
    state: state
  });
  
  return `https://www.tiktok.com/auth/authorize/?${params}`;
}

// 辅助函数
function generateState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function generateCodeChallenge() {
  // 简化的 PKCE code challenge 生成
  const codeVerifier = generateState() + generateState();
  return btoa(codeVerifier).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function getErrorMessage(error) {
  const errorMessages = {
    'access_denied': '用户拒绝了授权请求',
    'invalid_request': '授权请求无效',
    'unauthorized_client': '客户端未授权',
    'unsupported_response_type': '不支持的响应类型',
    'invalid_scope': '请求的权限范围无效',
    'server_error': '服务器错误',
    'temporarily_unavailable': '服务暂时不可用'
  };
  
  return errorMessages[error] || `授权错误: ${error}`;
}
