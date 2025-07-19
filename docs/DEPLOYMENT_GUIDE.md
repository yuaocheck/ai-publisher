# Cloudflare Workers 部署指南

本指南将帮助您将 AI Publisher 部署到 Cloudflare Workers 平台。

## 📋 前置要求

- Cloudflare 账号
- 域名（可选，可使用 Cloudflare 提供的子域名）
- Wrangler CLI 工具

## 🚀 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 配置项目

确保 `wrangler.toml` 文件已正确配置：

```toml
name = "ai-publisher"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "ai-publisher-prod"
```

### 4. 设置环境变量

使用 Wrangler 设置敏感信息：

```bash
# Supabase 配置
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# OpenAI 配置
wrangler secret put OPENAI_API_KEY

# 社交平台 API 密钥
wrangler secret put TWITTER_CLIENT_ID
wrangler secret put TWITTER_CLIENT_SECRET
wrangler secret put FACEBOOK_APP_ID
wrangler secret put FACEBOOK_APP_SECRET
wrangler secret put LINKEDIN_CLIENT_ID
wrangler secret put LINKEDIN_CLIENT_SECRET

# 认证配置
wrangler secret put NEXTAUTH_SECRET
```

### 5. 创建 KV 命名空间

```bash
# 创建缓存命名空间
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview

# 更新 wrangler.toml 中的 KV 命名空间 ID
```

### 6. 创建 R2 存储桶

```bash
# 创建媒体存储桶
wrangler r2 bucket create ai-publisher-media
```

### 7. 构建项目

```bash
npm run build
```

### 8. 部署到 Cloudflare Workers

```bash
# 部署到生产环境
wrangler deploy --env production

# 或部署到预览环境
wrangler deploy --env staging
```

## 🔧 高级配置

### 1. 自定义域名

在 `wrangler.toml` 中配置：

```toml
[[routes]]
pattern = "ai-publisher.com/*"
zone_name = "ai-publisher.com"
```

然后部署：

```bash
wrangler deploy --env production
```

### 2. 配置 Cron 触发器

系统会自动设置以下定时任务：

- **Token 刷新**：每 6 小时执行一次
- **清理任务**：每天午夜执行
- **队列处理**：每 15 分钟执行一次

### 3. 监控和日志

```bash
# 查看实时日志
wrangler tail --env production

# 查看分析数据
wrangler analytics --env production
```

## 📊 性能优化

### 1. 缓存策略

利用 Cloudflare 的全球 CDN：

```javascript
// 在 API 路由中设置缓存头
export async function GET(request) {
  const response = new Response(data)
  response.headers.set('Cache-Control', 'public, max-age=300')
  return response
}
```

### 2. 边缘计算

将计算密集型任务移到边缘：

```javascript
// 使用 Durable Objects 处理实时功能
export class SchedulerDurableObject {
  async fetch(request) {
    // 处理调度逻辑
  }
}
```

### 3. 资源优化

- 启用 Brotli 压缩
- 优化图片和静态资源
- 使用 Tree Shaking 减少包大小

## 🔐 安全配置

### 1. WAF 规则

在 Cloudflare Dashboard 中配置：

- 启用 DDoS 防护
- 设置速率限制
- 配置 IP 白名单/黑名单

### 2. SSL/TLS 设置

- 启用 Full (Strict) SSL 模式
- 配置 HSTS
- 启用 Always Use HTTPS

### 3. 访问控制

```bash
# 设置 IP 访问规则
wrangler access policy create --name "Admin Access" \
  --include "email:admin@company.com"
```

## 🚨 故障排除

### 常见问题

1. **部署失败**
   ```bash
   # 检查配置
   wrangler whoami
   wrangler kv:namespace list
   
   # 重新部署
   wrangler deploy --env production --force
   ```

2. **环境变量问题**
   ```bash
   # 列出所有密钥
   wrangler secret list --env production
   
   # 删除错误的密钥
   wrangler secret delete VARIABLE_NAME --env production
   ```

3. **域名解析问题**
   - 检查 DNS 记录
   - 验证 SSL 证书
   - 确认路由配置

### 调试工具

```bash
# 本地开发模式
wrangler dev --env production

# 查看部署状态
wrangler deployments list --env production

# 检查资源使用
wrangler analytics --env production
```

## 📈 监控和维护

### 1. 设置告警

在 Cloudflare Dashboard 中配置：

- CPU 使用率告警
- 错误率告警
- 响应时间告警

### 2. 日志分析

```bash
# 实时日志监控
wrangler tail --env production --format pretty

# 过滤特定日志
wrangler tail --env production --grep "ERROR"
```

### 3. 性能监控

- 使用 Cloudflare Analytics
- 集成第三方监控工具
- 设置自定义指标

## 🔄 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: 'production'
```

## 💰 成本优化

### 1. 资源使用优化

- 监控 CPU 时间使用
- 优化内存占用
- 减少外部 API 调用

### 2. 缓存策略

- 使用 KV 存储缓存数据
- 设置合理的 TTL
- 实现缓存预热

### 3. 流量管理

- 实现智能路由
- 使用负载均衡
- 配置故障转移

## 📞 支持和帮助

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare 社区](https://community.cloudflare.com/)

---

部署完成后，您的 AI Publisher 将在全球 200+ 个数据中心运行，为用户提供极速的访问体验！🚀
