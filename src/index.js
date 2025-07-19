// AI Publisher - Cloudflare Workers Entry Point
// 这是 Cloudflare Workers 的主入口文件，集成 Cloudflare MCP Server

import { handleRequest } from './handlers/router';
import { corsHeaders } from './utils/cors';
import CloudflareMCPIntegration from '../cloudflare-mcp-integration.js';

// 主要的 fetch 事件处理器
export default {
  async fetch(request, env, ctx) {
    try {
      // 初始化 MCP 集成
      const mcpIntegration = new CloudflareMCPIntegration(env);

      // 将 MCP 集成添加到环境中
      env.mcp = mcpIntegration;

      // 处理 CORS 预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: corsHeaders
        });
      }

      // 路由请求到相应的处理器
      const response = await handleRequest(request, env, ctx);

      // 添加 CORS 头部
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  },

  // 定时任务处理器
  async scheduled(event, env, ctx) {
    try {
      const { cron } = event;
      
      switch (cron) {
        case '0 */6 * * *': // 每6小时刷新令牌
          await handleTokenRefresh(env);
          break;
        case '0 0 * * *': // 每日清理任务
          await handleDailyCleanup(env);
          break;
        case '*/15 * * * *': // 每15分钟处理队列
          await handleQueueProcessing(env);
          break;
      }
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  }
};

// 令牌刷新任务
async function handleTokenRefresh(env) {
  console.log('Running token refresh task...');
  // 实现令牌刷新逻辑
}

// 每日清理任务
async function handleDailyCleanup(env) {
  console.log('Running daily cleanup task...');
  // 实现清理逻辑
}

// 队列处理任务
async function handleQueueProcessing(env) {
  console.log('Processing scheduled posts queue...');
  // 实现队列处理逻辑
}
