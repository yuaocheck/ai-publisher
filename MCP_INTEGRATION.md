# 🚀 AI Publisher - Cloudflare MCP Server Integration

AI Publisher 现已完全集成 Cloudflare 的 Model Context Protocol (MCP) 服务器，为您提供强大的 AI 内容创作和多平台发布能力。

## 🌟 Cloudflare MCP 服务器集成

我们集成了 **14 个官方 Cloudflare MCP 服务器**，涵盖文档、开发、监控、分析、安全等各个方面：

### 📚 文档和开发
- **Documentation Server** - 实时搜索 Cloudflare 官方文档
- **Workers Bindings Server** - 管理存储、AI 和计算资源
- **Workers Builds Server** - 构建洞察和管理
- **Container Server** - 沙盒开发环境

### 📊 监控和分析
- **Observability Server** - 应用日志和分析调试
- **Radar Server** - 全球互联网流量洞察
- **Logpush Server** - 日志作业健康摘要
- **DNS Analytics Server** - DNS 性能优化
- **Digital Experience Monitoring** - 应用性能洞察
- **GraphQL Server** - 通过 GraphQL API 获取分析数据

### 🤖 AI 和智能
- **AI Gateway Server** - AI 日志和提示分析
- **AutoRAG Server** - 文档搜索和 RAG 分析

### 🔒 安全
- **Audit Logs Server** - 安全审计日志和报告
- **Cloudflare One CASB Server** - SaaS 安全配置检查

### 🌐 实用工具
- **Browser Rendering Server** - 网页渲染和截图

## 🔗 访问地址

### 主要页面
- **主域名**: https://publisher.ai
- **主页**: https://publisher.ai/demo/start.html
- **MCP 集成演示**: https://publisher.ai/demo/mcp-integration.html
- **社交发布器**: https://publisher.ai/demo/social-publisher.html
- **AI 图片生成**: https://publisher.ai/demo/real-image-generator.html
- **AI 视频生成**: https://publisher.ai/demo/real-video-generator.html

### API 端点
- **健康检查**: https://publisher.ai/api/health
- **MCP 健康检查**: https://publisher.ai/api/mcp/health
- **MCP 服务器列表**: https://publisher.ai/api/mcp/servers
- **文档搜索**: POST https://publisher.ai/api/mcp/docs/search
- **浏览器渲染**: POST https://publisher.ai/api/mcp/browser/render
- **页面截图**: POST https://publisher.ai/api/mcp/browser/screenshot
- **Radar 数据**: POST https://publisher.ai/api/mcp/radar/query
- **AI Gateway**: POST https://publisher.ai/api/mcp/ai-gateway/query
- **可观测性**: POST https://publisher.ai/api/mcp/observability/logs
- **GraphQL 查询**: POST https://publisher.ai/api/mcp/graphql/query
- **通用 MCP 调用**: POST https://publisher.ai/api/mcp/call

## 🛠️ 使用 MCP 客户端

### Claude Desktop 配置

将以下配置添加到您的 Claude Desktop 配置文件中：

```json
{
  "mcpServers": {
    "ai-publisher-docs": {
      "command": "npx",
      "args": ["mcp-remote", "https://docs.mcp.cloudflare.com/sse"]
    },
    "ai-publisher-browser": {
      "command": "npx",
      "args": ["mcp-remote", "https://browser.mcp.cloudflare.com/sse"]
    },
    "ai-publisher-radar": {
      "command": "npx",
      "args": ["mcp-remote", "https://radar.mcp.cloudflare.com/sse"]
    }
  }
}
```

### Cursor 配置

在 Cursor 中，您可以直接使用 MCP 服务器 URL：
- `https://docs.mcp.cloudflare.com/sse`
- `https://browser.mcp.cloudflare.com/sse`
- `https://radar.mcp.cloudflare.com/sse`

### OpenAI Responses API

要在 OpenAI Responses API 中使用，您需要提供具有适当权限的 Cloudflare API 令牌。

## 🔑 API 权限要求

不同的 MCP 服务器需要不同的 Cloudflare API 权限：

### 基础权限
- `Zone:Zone:Read` - 读取区域信息
- `Account:Account Settings:Read` - 读取账户设置

### 开发权限
- `Zone:Zone:Edit` - 编辑区域设置
- `Account:Cloudflare Workers:Edit` - 管理 Workers

### 监控权限
- `Zone:Zone Analytics:Read` - 读取区域分析
- `Account:Account Analytics:Read` - 读取账户分析

### 安全权限
- `Account:Audit Logs:Read` - 读取审计日志
- `Account:Cloudflare One:Read` - 读取 Cloudflare One 数据

## 📝 API 使用示例

### 搜索 Cloudflare 文档

```javascript
const response = await fetch('https://publisher.ai/api/mcp/docs/search', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_TOKEN'
    },
    body: JSON.stringify({
        query: 'Workers KV storage'
    })
});

const result = await response.json();
console.log(result);
```

### 渲染网页并截图

```javascript
const response = await fetch('https://publisher.ai/api/mcp/browser/screenshot', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_TOKEN'
    },
    body: JSON.stringify({
        url: 'https://example.com',
        options: {
            width: 1920,
            height: 1080,
            format: 'png'
        }
    })
});

const screenshot = await response.blob();
```

### 获取全球流量数据

```javascript
const response = await fetch('https://publisher.ai/api/mcp/radar/query', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_TOKEN'
    },
    body: JSON.stringify({
        type: 'traffic',
        params: {
            location: 'global',
            timeframe: '24h'
        }
    })
});

const trafficData = await response.json();
```

## 🚀 部署

### 一键部署到 publisher.ai

```bash
# 运行一键部署脚本
./deploy-publisher-ai.sh
```

### 手动部署

1. 设置 GitHub Secrets：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `GEMINI_API_KEY`

2. 推送代码到 GitHub：
   ```bash
   git push origin main
   ```

3. GitHub Actions 将自动部署到 Cloudflare Workers

## 🌍 全球部署

AI Publisher 通过 Cloudflare Workers 部署到全球 200+ 数据中心，确保：

- **毫秒级响应** - 就近访问
- **99.9% 可用性** - 企业级稳定性
- **自动扩缩容** - 无服务器架构
- **DDoS 防护** - Cloudflare 安全防护

## 🎯 核心功能

- ✅ **14 个 Cloudflare MCP 服务器** - 完整集成
- ✅ **多平台社交发布** - 6 大社交媒体平台
- ✅ **AI 内容生成** - 文本、图片、视频
- ✅ **全球边缘部署** - 200+ 数据中心
- ✅ **企业级安全** - OAuth 2.0 + 环境变量加密
- ✅ **实时 API 调用** - 毫秒级响应

## 📞 支持

如果您在使用过程中遇到任何问题，请：

1. 查看 [GitHub Issues](https://github.com/yuaocheck/ai-publisher/issues)
2. 访问 [Cloudflare MCP 文档](https://github.com/cloudflare/mcp-server-cloudflare)
3. 检查 API 权限设置

---

**AI Publisher 现已准备好为您提供世界级的 AI 内容创作和发布服务！** 🌟
