// AI Publisher - 静态资源处理器

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

export async function handleStaticAssets(request, env) {
  const url = new URL(request.url);
  let { pathname } = url;

  try {
    // 如果是目录请求，默认返回 index.html
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }

    // 尝试从 KV 存储获取资源
    if (env.__STATIC_CONTENT) {
      try {
        return await getAssetFromKV(
          {
            request: new Request(url.toString(), request),
            waitUntil: () => {},
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          }
        );
      } catch (e) {
        // 如果 KV 中没有找到，继续使用内置资源
      }
    }

    // 内置的静态资源处理
    const response = await handleBuiltinAssets(pathname, env);
    if (response) {
      return response;
    }

    // 如果找不到资源，返回 404
    return new Response('Asset not found', { 
      status: 404,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    console.error('Static asset error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

async function handleBuiltinAssets(pathname, env) {
  // 获取文件扩展名
  const ext = pathname.substring(pathname.lastIndexOf('.'));
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // 处理演示页面
  if (pathname.startsWith('/demo/')) {
    const filename = pathname.substring(6); // 移除 '/demo/' 前缀
    
    // 主要演示页面
    const demoPages = {
      'start.html': await generateStartPage(),
      'social-publisher.html': await generateSocialPublisherPage(),
      'real-image-generator.html': await generateImageGeneratorPage(),
      'real-video-generator.html': await generateVideoGeneratorPage(),
      'gemini-test.html': await generateGeminiTestPage(),
      'oauth-callback.html': await generateOAuthCallbackPage()
    };

    if (demoPages[filename]) {
      return new Response(demoPages[filename], {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
  }

  // 处理根目录文件
  if (pathname === '/index.html' || pathname === '/') {
    return new Response(await generateStartPage(), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  return null;
}

// 生成主页面
async function generateStartPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Publisher - 智能内容发布平台</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <div class="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-sm">AI</span>
                    </div>
                    <span class="ml-2 text-xl font-bold text-gray-900">Publisher</span>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-500">Powered by Cloudflare Workers</span>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="text-5xl font-bold text-white mb-6">AI Publisher</h1>
            <p class="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                智能内容创作与多平台发布系统，现已部署在 Cloudflare Workers 上
            </p>
            <div class="flex justify-center space-x-4">
                <a href="/demo/social-publisher.html" class="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
                    开始发布
                </a>
                <a href="/demo/real-image-generator.html" class="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
                    生成图片
                </a>
            </div>
        </div>
    </div>

    <!-- Features Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">强大功能</h2>
            <p class="text-xl text-gray-600">基于 Cloudflare Workers 的高性能部署</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Social Publisher -->
            <a href="/demo/social-publisher.html" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-200">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <i class="fas fa-share-alt text-blue-600 text-xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">多平台发布</h3>
                <p class="text-gray-600">连接真实社交平台，一键发布内容</p>
            </a>

            <!-- Image Generator -->
            <a href="/demo/real-image-generator.html" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-200">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <i class="fas fa-image text-green-600 text-xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">AI 图片生成</h3>
                <p class="text-gray-600">生成高质量、可下载的图片</p>
            </a>

            <!-- Video Generator -->
            <a href="/demo/real-video-generator.html" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-200">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <i class="fas fa-video text-purple-600 text-xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">AI 视频生成</h3>
                <p class="text-gray-600">生成高质量、可播放的视频</p>
            </a>

            <!-- AI Text -->
            <a href="/demo/simple-ai.html" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-200">
                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                    <i class="fas fa-robot text-yellow-600 text-xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">AI 文本生成</h3>
                <p class="text-gray-600">使用 Gemini AI 生成高质量文本</p>
            </a>

            <!-- API Testing -->
            <a href="/demo/gemini-test.html" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-200">
                <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <i class="fas fa-flask text-orange-600 text-xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">API 测试工具</h3>
                <p class="text-gray-600">测试和调试 AI API 调用</p>
            </a>

            <!-- OAuth Callback -->
            <a href="/demo/oauth-callback.html" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-200">
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <i class="fas fa-key text-red-600 text-xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">OAuth 授权</h3>
                <p class="text-gray-600">社交平台授权回调处理</p>
            </a>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div class="flex justify-center items-center mb-4">
                <div class="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <span class="text-white font-bold text-sm">AI</span>
                </div>
                <span class="text-xl font-bold">Publisher</span>
            </div>
            <p class="text-gray-400 mb-4">智能内容创作与多平台发布系统</p>
            <div class="flex justify-center space-x-6">
                <span class="text-sm text-gray-500">Powered by Cloudflare Workers</span>
                <span class="text-sm text-gray-500">•</span>
                <span class="text-sm text-gray-500">AI-Driven Content Creation</span>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

// 其他页面生成函数将在后续添加
async function generateSocialPublisherPage() {
  // 返回社交发布器页面内容
  return '<!-- Social Publisher Page will be loaded from demo directory -->';
}

async function generateImageGeneratorPage() {
  // 返回图片生成器页面内容
  return '<!-- Image Generator Page will be loaded from demo directory -->';
}

async function generateVideoGeneratorPage() {
  // 返回视频生成器页面内容
  return '<!-- Video Generator Page will be loaded from demo directory -->';
}

async function generateGeminiTestPage() {
  // 返回 Gemini 测试页面内容
  return '<!-- Gemini Test Page will be loaded from demo directory -->';
}

async function generateOAuthCallbackPage() {
  // 返回 OAuth 回调页面内容
  return '<!-- OAuth Callback Page will be loaded from demo directory -->';
}
