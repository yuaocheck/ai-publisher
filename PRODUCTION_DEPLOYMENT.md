# 🚀 AI Publisher 生产部署指南

## 📋 概述

本指南将帮助您将 AI Publisher 部署到生产环境，包括 Docker 容器化部署、数据库配置、AI 服务集成等。

## 🛠️ 系统要求

### 硬件要求
- **CPU**: 2 核心以上
- **内存**: 4GB 以上（推荐 8GB）
- **存储**: 20GB 以上可用空间
- **网络**: 稳定的互联网连接

### 软件要求
- **Docker**: 20.10.0+
- **Docker Compose**: 2.0.0+
- **Node.js**: 18.0.0+ (用于本地开发)
- **Git**: 2.30.0+

## 🔧 部署前准备

### 1. 克隆项目
```bash
git clone https://github.com/your-username/ai-publisher.git
cd ai-publisher
```

### 2. 配置环境变量
```bash
# 复制生产环境配置模板
cp .env.production .env.production.local

# 编辑配置文件
nano .env.production.local
```

### 3. 必需的环境变量配置

#### Supabase 配置
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PROJECT_ID=your_supabase_project_id
```

#### AI 服务配置
```bash
# Google Gemini API Key (已配置)
GEMINI_API_KEY=AIzaSyBtNkwPeJGoViemSfzXMjQmytmCMuWEvwY

# OpenAI API Key (可选，作为备用)
OPENAI_API_KEY=your_openai_api_key
```

#### 社交媒体平台 API
```bash
# Twitter/X
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Facebook/Instagram
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

## 🚀 部署方式

### 方式 1: 一键部署脚本（推荐）

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 部署到生产环境
./deploy.sh production
```

### 方式 2: 手动 Docker 部署

```bash
# 1. 构建镜像
docker build -t ai-publisher:latest .

# 2. 启动服务
docker-compose -f docker-compose.yml --env-file .env.production up -d

# 3. 检查服务状态
docker-compose ps
```

### 方式 3: 云平台部署

#### Cloudflare Pages (静态部署)
```bash
# 构建静态版本
npm run build

# 部署到 Cloudflare Pages
npm run deploy
```

#### Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### Railway 部署
```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录并部署
railway login
railway deploy
```

## 🗄️ 数据库设置

### 1. Supabase 项目创建
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取项目 URL 和 API Keys
4. 配置环境变量

### 2. 运行数据库迁移
```bash
# 使用 Supabase CLI
supabase db push --project-ref your-project-id

# 或手动执行 SQL 文件
# 在 Supabase Dashboard 的 SQL Editor 中执行 supabase/migrations/ 下的文件
```

### 3. 设置 Row Level Security (RLS)
数据库迁移会自动设置 RLS 策略，确保数据安全。

## 🔐 安全配置

### 1. SSL 证书
```bash
# 开发环境 - 自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# 生产环境 - Let's Encrypt
certbot --nginx -d your-domain.com
```

### 2. 防火墙配置
```bash
# 开放必要端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### 3. 环境变量安全
- 使用强密码和随机密钥
- 定期轮换 API 密钥
- 不要在代码中硬编码敏感信息

## 📊 监控和日志

### 1. 健康检查
```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 检查服务状态
docker-compose ps
```

### 2. 日志查看
```bash
# 查看应用日志
docker-compose logs ai-publisher

# 实时日志
docker-compose logs -f ai-publisher

# 查看特定服务日志
docker-compose logs nginx
docker-compose logs redis
```

### 3. 监控服务（可选）
```bash
# 启用监控
ENABLE_MONITORING=true ./deploy.sh production

# 访问监控面板
# Grafana: http://localhost:3001 (admin/admin123)
# Prometheus: http://localhost:9090
```

## 🔧 维护和更新

### 1. 应用更新
```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh production
```

### 2. 数据库备份
```bash
# 使用 Supabase Dashboard 进行备份
# 或使用 pg_dump (如果有直接数据库访问权限)
```

### 3. 日志轮转
```bash
# 配置 logrotate
sudo nano /etc/logrotate.d/ai-publisher
```

## 🚨 故障排除

### 常见问题

#### 1. 应用无法启动
```bash
# 检查日志
docker-compose logs ai-publisher

# 检查环境变量
docker-compose config

# 重启服务
docker-compose restart ai-publisher
```

#### 2. 数据库连接失败
- 检查 Supabase URL 和 API Keys
- 确认网络连接
- 检查 RLS 策略

#### 3. AI 功能不工作
- 验证 Gemini API Key
- 检查 API 配额
- 查看错误日志

#### 4. 社交媒体连接失败
- 确认 OAuth 应用配置
- 检查回调 URL 设置
- 验证 API 密钥

### 性能优化

#### 1. 数据库优化
- 添加适当的索引
- 优化查询语句
- 使用连接池

#### 2. 缓存配置
- 启用 Redis 缓存
- 配置 CDN
- 优化静态资源

#### 3. 负载均衡
```bash
# 扩展应用实例
docker-compose up -d --scale ai-publisher=3
```

## 📞 技术支持

### 获取帮助
1. 查看应用日志
2. 检查健康状态端点
3. 查阅文档和 FAQ
4. 提交 GitHub Issue

### 联系方式
- GitHub Issues: [项目地址]/issues
- 邮箱: support@your-domain.com
- 文档: [文档地址]

## 📝 部署检查清单

- [ ] 环境变量配置完成
- [ ] Supabase 项目创建并配置
- [ ] 数据库迁移执行成功
- [ ] AI API 密钥配置正确
- [ ] 社交媒体 OAuth 应用创建
- [ ] SSL 证书配置
- [ ] 防火墙规则设置
- [ ] 健康检查通过
- [ ] 监控服务启动（可选）
- [ ] 备份策略制定
- [ ] 域名和 DNS 配置

## 🎉 部署完成

恭喜！您已成功部署 AI Publisher 到生产环境。

访问您的应用：
- 主应用: https://your-domain.com
- 健康检查: https://your-domain.com/api/health
- 监控面板: https://your-domain.com:3001 (如果启用)

享受您的 AI 驱动的社交媒体发布平台！
