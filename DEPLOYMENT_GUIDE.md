# 🚀 AI Publisher 部署指南

本指南将帮助您将 AI Publisher 部署到 GitHub 和 Cloudflare Workers。

## 📋 部署概览

AI Publisher 使用现代化的部署架构：

- **源码管理**: GitHub
- **CI/CD**: GitHub Actions
- **边缘计算**: Cloudflare Workers
- **全球 CDN**: Cloudflare 网络 (200+ 数据中心)
- **存储**: Cloudflare KV (键值存储)
- **域名**: Cloudflare DNS

## 🔧 前置要求

### 必需账号
- [GitHub](https://github.com) 账号
- [Cloudflare](https://cloudflare.com) 账号
- 各社交平台开发者账号

### 本地环境
- Node.js 18+ 
- npm 或 yarn
- Git
- Wrangler CLI

## 📦 第一步：GitHub 仓库设置

### 自动设置（推荐）

运行我们提供的自动化脚本：

```bash
# 运行 GitHub 设置脚本
./scripts/setup-github.sh
```

这个脚本将：
- 初始化 Git 仓库
- 设置远程仓库
- 创建 .gitignore 文件
- 创建初始提交
- 推送到 GitHub

### 手动设置

如果您喜欢手动设置：

1. **初始化 Git 仓库**
```bash
git init
```

2. **添加远程仓库**
```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-publisher.git
```

3. **添加文件并提交**
```bash
git add .
git commit -m "feat: initial commit - AI Publisher with Cloudflare Workers"
git push -u origin main
```

## ☁️ 第二步：Cloudflare Workers 设置

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

这将打开浏览器进行 OAuth 授权。

### 3. 创建 KV 命名空间

```bash
# 创建生产环境 KV 存储
wrangler kv:namespace create "AI_PUBLISHER_KV"

# 创建预览环境 KV 存储
wrangler kv:namespace create "AI_PUBLISHER_KV" --preview
```

记录返回的命名空间 ID，并更新 `wrangler.toml` 文件。

### 4. 设置环境变量

设置所有必需的环境变量：

```bash
# 社交媒体 API 密钥
wrangler secret put TWITTER_CLIENT_ID
wrangler secret put TWITTER_CLIENT_SECRET
wrangler secret put FACEBOOK_APP_ID
wrangler secret put FACEBOOK_APP_SECRET
wrangler secret put INSTAGRAM_CLIENT_ID
wrangler secret put INSTAGRAM_CLIENT_SECRET
wrangler secret put LINKEDIN_CLIENT_ID
wrangler secret put LINKEDIN_CLIENT_SECRET
wrangler secret put YOUTUBE_CLIENT_ID
wrangler secret put YOUTUBE_CLIENT_SECRET
wrangler secret put TIKTOK_CLIENT_KEY
wrangler secret put TIKTOK_CLIENT_SECRET

# AI 服务密钥
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENAI_API_KEY

# Cloudflare 配置
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put CLOUDFLARE_ACCOUNT_ID

# 可选：通知服务
wrangler secret put SLACK_WEBHOOK_URL
wrangler secret put GITHUB_WEBHOOK_SECRET
```

### 5. 部署到 Cloudflare Workers

#### 自动部署（推荐）

```bash
# 运行部署脚本
./scripts/deploy-cloudflare.sh
```

#### 手动部署

```bash
# 开发环境
wrangler deploy

# 预览环境
wrangler deploy --env staging

# 生产环境
wrangler deploy --env production
```

## 🔄 第三步：GitHub Actions 自动化

### 1. 设置 GitHub Secrets

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加：

| Secret 名称 | 描述 | 获取方式 |
|------------|------|----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌 | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | Cloudflare Dashboard 右侧栏 |
| `TWITTER_CLIENT_ID` | Twitter 客户端 ID | [Twitter Developer Portal](https://developer.twitter.com/) |
| `TWITTER_CLIENT_SECRET` | Twitter 客户端密钥 | Twitter Developer Portal |
| `FACEBOOK_APP_ID` | Facebook 应用 ID | [Facebook Developers](https://developers.facebook.com/) |
| `FACEBOOK_APP_SECRET` | Facebook 应用密钥 | Facebook Developers |
| `INSTAGRAM_CLIENT_ID` | Instagram 客户端 ID | Facebook Developers |
| `INSTAGRAM_CLIENT_SECRET` | Instagram 客户端密钥 | Facebook Developers |
| `LINKEDIN_CLIENT_ID` | LinkedIn 客户端 ID | [LinkedIn Developers](https://www.linkedin.com/developers/) |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn 客户端密钥 | LinkedIn Developers |
| `YOUTUBE_CLIENT_ID` | YouTube 客户端 ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `YOUTUBE_CLIENT_SECRET` | YouTube 客户端密钥 | Google Cloud Console |
| `TIKTOK_CLIENT_KEY` | TikTok 客户端密钥 | [TikTok Developers](https://developers.tiktok.com/) |
| `TIKTOK_CLIENT_SECRET` | TikTok 客户端密钥 | TikTok Developers |
| `GEMINI_API_KEY` | Gemini AI API 密钥 | [Google AI Studio](https://makersuite.google.com/app/apikey) |

### 2. 触发自动部署

推送代码到 `main` 分支将自动触发部署：

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

GitHub Actions 将：
- 运行测试
- 构建项目
- 部署到 Cloudflare Workers
- 创建 GitHub Release

## 🌐 第四步：域名配置（可选）

### 1. 添加自定义域名

在 Cloudflare Dashboard 中：

1. 进入 Workers & Pages
2. 选择您的 Worker
3. 点击 "Custom domains"
4. 添加您的域名

### 2. 更新 DNS 记录

确保您的域名指向 Cloudflare：

```
Type: CNAME
Name: ai-publisher (或您的子域名)
Target: your-worker.your-subdomain.workers.dev
```

### 3. 启用 SSL

Cloudflare 会自动为您的域名提供 SSL 证书。

## 📊 第五步：监控和维护

### 查看实时日志

```bash
# 查看生产环境日志
wrangler tail --env production

# 查看开发环境日志
wrangler tail
```

### 查看部署状态

```bash
# 查看 Worker 信息
wrangler whoami

# 查看 KV 存储
wrangler kv:namespace list
```

### 更新环境变量

```bash
# 更新现有密钥
wrangler secret put TWITTER_CLIENT_ID

# 查看所有密钥
wrangler secret list
```

## 🔧 故障排除

### 常见问题

#### 1. 部署失败
**症状**: `wrangler deploy` 命令失败
**解决方案**:
- 检查 `wrangler.toml` 配置
- 确认已登录 Cloudflare
- 验证账户权限

#### 2. 环境变量未生效
**症状**: API 调用返回认证错误
**解决方案**:
- 使用 `wrangler secret list` 检查密钥
- 重新设置环境变量
- 重新部署 Worker

#### 3. KV 存储错误
**症状**: 数据存储/读取失败
**解决方案**:
- 检查 KV 命名空间配置
- 验证绑定名称
- 检查权限设置

#### 4. GitHub Actions 失败
**症状**: 自动部署失败
**解决方案**:
- 检查 GitHub Secrets 设置
- 验证 Cloudflare API 令牌权限
- 查看 Actions 日志

### 调试命令

```bash
# 检查 Worker 状态
wrangler dev --local

# 测试 API 端点
curl https://your-worker.workers.dev/api/health

# 查看详细日志
wrangler tail --format pretty

# 检查 KV 数据
wrangler kv:key list --binding AI_PUBLISHER_KV
```

## 📈 性能优化

### 1. 缓存策略

```javascript
// 在 Worker 中设置缓存
const cache = caches.default;
const cacheKey = new Request(url.toString(), request);
const cachedResponse = await cache.match(cacheKey);

if (cachedResponse) {
  return cachedResponse;
}
```

### 2. 请求优化

- 使用 `fetch` 的 `cf` 选项优化请求
- 实现请求去重
- 设置合适的超时时间

### 3. 监控指标

- 响应时间
- 错误率
- 请求量
- CPU 使用率

## 🔒 安全最佳实践

### 1. API 密钥管理
- 使用 Wrangler Secrets 存储敏感信息
- 定期轮换 API 密钥
- 限制 API 密钥权限

### 2. CORS 配置
- 设置适当的 CORS 头部
- 限制允许的域名
- 验证请求来源

### 3. 速率限制
- 实现 API 速率限制
- 防止滥用和攻击
- 监控异常流量

## 🎉 部署完成

恭喜！您已成功将 AI Publisher 部署到 Cloudflare Workers。

### 验证部署

1. **访问您的网站**
   - 生产环境: `https://your-domain.com`
   - 开发环境: `https://your-worker.workers.dev`

2. **测试功能**
   - 社交媒体连接
   - AI 内容生成
   - 多平台发布

3. **查看监控**
   - Cloudflare Analytics
   - GitHub Actions 状态
   - Worker 日志

### 下一步

- 配置自定义域名
- 设置监控告警
- 优化性能
- 添加新功能

## 📞 获取帮助

如果您遇到问题：

- 📖 查看 [README.md](README.md)
- 🐛 提交 [GitHub Issue](https://github.com/ai-publisher/ai-publisher/issues)
- 💬 加入 [Cloudflare Discord](https://discord.gg/cloudflaredev)
- 📧 联系技术支持

---

**祝您使用愉快！** 🚀
