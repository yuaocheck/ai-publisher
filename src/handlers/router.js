// AI Publisher - Cloudflare Workers 路由处理器

import { handleStaticAssets } from './static';
import { handleAPI } from './api';
import { handleOAuth } from './oauth';
import { handleWebhooks } from './webhooks';
import { handleMCPAPI } from './mcp';

export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;

  // 静态资源处理
  if (pathname.startsWith('/demo/') || 
      pathname.endsWith('.html') || 
      pathname.endsWith('.css') || 
      pathname.endsWith('.js') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.ico')) {
    return handleStaticAssets(request, env);
  }

  // MCP API 路由处理
  if (pathname.startsWith('/api/mcp/')) {
    return handleMCPAPI(request, env, ctx);
  }

  // API 路由处理
  if (pathname.startsWith('/api/')) {
    return handleAPI(request, env, ctx);
  }

  // OAuth 回调处理
  if (pathname.startsWith('/oauth/')) {
    return handleOAuth(request, env, ctx);
  }

  // Webhook 处理
  if (pathname.startsWith('/webhooks/')) {
    return handleWebhooks(request, env, ctx);
  }

  // 根路径重定向到演示页面
  if (pathname === '/') {
    return Response.redirect(new URL('/demo/start.html', request.url), 302);
  }

  // 404 处理
  return new Response('Not Found', { 
    status: 404,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}
