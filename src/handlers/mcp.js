// AI Publisher - MCP API 处理器
// 处理 Cloudflare MCP Server 相关的 API 请求

export async function handleMCPAPI(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  try {
    // MCP 服务器健康检查
    if (pathname === '/api/mcp/health' && method === 'GET') {
      return handleMCPHealthCheck(request, env);
    }

    // 获取可用的 MCP 服务器列表
    if (pathname === '/api/mcp/servers' && method === 'GET') {
      return handleGetMCPServers(request, env);
    }

    // Cloudflare 文档搜索
    if (pathname === '/api/mcp/docs/search' && method === 'POST') {
      return handleDocsSearch(request, env);
    }

    // 浏览器渲染
    if (pathname === '/api/mcp/browser/render' && method === 'POST') {
      return handleBrowserRender(request, env);
    }

    // 页面截图
    if (pathname === '/api/mcp/browser/screenshot' && method === 'POST') {
      return handleBrowserScreenshot(request, env);
    }

    // 页面转 Markdown
    if (pathname === '/api/mcp/browser/markdown' && method === 'POST') {
      return handlePageToMarkdown(request, env);
    }

    // Radar 数据查询
    if (pathname === '/api/mcp/radar/query' && method === 'POST') {
      return handleRadarQuery(request, env);
    }

    // AI Gateway 查询
    if (pathname === '/api/mcp/ai-gateway/query' && method === 'POST') {
      return handleAIGatewayQuery(request, env);
    }

    // 可观测性数据
    if (pathname === '/api/mcp/observability/logs' && method === 'POST') {
      return handleObservabilityLogs(request, env);
    }

    // GraphQL 查询
    if (pathname === '/api/mcp/graphql/query' && method === 'POST') {
      return handleGraphQLQuery(request, env);
    }

    // Workers 构建信息
    if (pathname === '/api/mcp/builds/info' && method === 'GET') {
      return handleBuildInfo(request, env);
    }

    // 通用 MCP 调用
    if (pathname === '/api/mcp/call' && method === 'POST') {
      return handleGenericMCPCall(request, env);
    }

    return new Response(JSON.stringify({
      error: 'MCP API endpoint not found',
      path: pathname,
      method: method
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('MCP API error:', error);
    return new Response(JSON.stringify({
      error: 'MCP API Error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// MCP 服务器健康检查
async function handleMCPHealthCheck(request, env) {
  try {
    const healthStatus = await env.mcp.healthCheck();
    
    return new Response(JSON.stringify({
      status: 'success',
      timestamp: new Date().toISOString(),
      servers: healthStatus
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Health check failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取可用的 MCP 服务器
async function handleGetMCPServers(request, env) {
  try {
    const servers = env.mcp.getAvailableServers();
    
    return new Response(JSON.stringify({
      status: 'success',
      servers: servers
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to get servers',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cloudflare 文档搜索
async function handleDocsSearch(request, env) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return new Response(JSON.stringify({
        error: 'Query parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.mcp.getDocumentation(query);
    
    return new Response(JSON.stringify({
      status: 'success',
      query: query,
      result: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Documentation search failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 浏览器渲染
async function handleBrowserRender(request, env) {
  try {
    const { url, options = {} } = await request.json();
    
    if (!url) {
      return new Response(JSON.stringify({
        error: 'URL parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.mcp.renderPage(url, options);
    
    return new Response(JSON.stringify({
      status: 'success',
      url: url,
      result: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Browser rendering failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 页面截图
async function handleBrowserScreenshot(request, env) {
  try {
    const { url, options = {} } = await request.json();
    
    if (!url) {
      return new Response(JSON.stringify({
        error: 'URL parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.mcp.takeScreenshot(url, options);
    
    return new Response(JSON.stringify({
      status: 'success',
      url: url,
      screenshot: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Screenshot failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 页面转 Markdown
async function handlePageToMarkdown(request, env) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return new Response(JSON.stringify({
        error: 'URL parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.mcp.pageToMarkdown(url);
    
    return new Response(JSON.stringify({
      status: 'success',
      url: url,
      markdown: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Page to markdown conversion failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Radar 数据查询
async function handleRadarQuery(request, env) {
  try {
    const { type, params } = await request.json();
    
    if (!type) {
      return new Response(JSON.stringify({
        error: 'Type parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.mcp.getRadarData(type, params);
    
    return new Response(JSON.stringify({
      status: 'success',
      type: type,
      result: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Radar query failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// AI Gateway 查询
async function handleAIGatewayQuery(request, env) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return new Response(JSON.stringify({
        error: 'Query parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.mcp.queryAIGateway(query);
    
    return new Response(JSON.stringify({
      status: 'success',
      query: query,
      result: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'AI Gateway query failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 可观测性日志
async function handleObservabilityLogs(request, env) {
  try {
    const filters = await request.json();
    
    const result = await env.mcp.getObservabilityData(filters);
    
    return new Response(JSON.stringify({
      status: 'success',
      filters: filters,
      logs: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Observability logs query failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GraphQL 查询
async function handleGraphQLQuery(request, env) {
  try {
    const { query, variables = {} } = await request.json();
    
    if (!query) {
      return new Response(JSON.stringify({
        error: 'GraphQL query is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.mcp.executeGraphQLQuery(query, variables);
    
    return new Response(JSON.stringify({
      status: 'success',
      query: query,
      variables: variables,
      result: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'GraphQL query failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Workers 构建信息
async function handleBuildInfo(request, env) {
  try {
    const url = new URL(request.url);
    const workerId = url.searchParams.get('worker_id');
    
    if (!workerId) {
      return new Response(JSON.stringify({
        error: 'worker_id parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.mcp.getBuildInfo(workerId);
    
    return new Response(JSON.stringify({
      status: 'success',
      worker_id: workerId,
      build_info: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Build info query failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 通用 MCP 调用
async function handleGenericMCPCall(request, env) {
  try {
    const { server, method, params } = await request.json();
    
    if (!server || !method) {
      return new Response(JSON.stringify({
        error: 'Server and method parameters are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.mcp.callMCPServer(server, {
      method: method,
      params: params || {}
    });
    
    return new Response(JSON.stringify({
      status: 'success',
      server: server,
      method: method,
      result: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'MCP call failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
