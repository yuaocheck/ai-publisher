# 🚀 AI Publisher - 全平台内容发布系统

[![Deploy to Cloudflare Workers](https://github.com/ai-publisher/ai-publisher/actions/workflows/deploy.yml/badge.svg)](https://github.com/ai-publisher/ai-publisher/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Powered%20by-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)

一次编辑，全网智能发布。支持文字、图片、视频自动适配并发布至全球主流社交平台。现已部署在 Cloudflare Workers 上，提供全球边缘计算的高性能体验。

## 🚀 功能特性

- **多平台发布**: 支持 Twitter/X、Facebook、Instagram、LinkedIn、TikTok、YouTube 等主流平台
- **AI 内容生成**: 智能生成文案、图片和视频内容，提升创作效率
- **内容自动适配**: 根据不同平台特性自动调整内容格式和尺寸
- **定时发布**: 支持定时发布和循环发布，灵活安排内容计划
- **API 接口**: 提供完整的 REST API，支持第三方系统集成
- **数据分析**: 实时监控发布状态和互动数据，优化内容策略

## 🛠️ 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **部署**: Cloudflare Workers/Pages (全球边缘计算)
- **AI 服务**: Google Gemini, OpenAI GPT-4, DALL-E 3
- **社交平台 API**: Twitter API v2, Facebook Graph API, LinkedIn API 等
- **边缘计算**: Cloudflare Workers (200+ 数据中心，毫秒级响应)

## 📋 环境要求

在开始之前，请确保您的系统已安装以下软件：

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器
- Git
- Cloudflare 账号 (用于 Workers 部署)
- Supabase 账号
- 各社交平台开发者账号

### macOS 安装指南

```bash
# 安装 Homebrew (如果尚未安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node

# 验证安装
node --version
npm --version
```

### Windows 安装指南

1. 访问 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本
2. 安装 [Git for Windows](https://git-scm.com/download/win)

### Linux 安装指南

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-publisher
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
```

### 3. 环境配置

复制环境变量模板文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入必要的配置信息：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key

# 社交平台 API 密钥
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
# ... 其他平台配置
```

### 4. 数据库设置

参考 [Supabase 设置指南](#supabase-设置) 创建和配置数据库。

### 5. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📊 Supabase 设置

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 记录项目 URL 和 API 密钥

### 2. 数据库表结构

在 Supabase SQL 编辑器中执行以下 SQL 创建必要的表：

```sql
-- 组织表
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 社交账号表
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  auth_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, platform, platform_user_id)
);

-- 内容表
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  platforms TEXT[] NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务表
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  platform_post_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 指标表
CREATE TABLE metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  platform_post_id TEXT NOT NULL,
  impressions INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  clicks INTEGER,
  engagement_rate DECIMAL(5,4),
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API 密钥表
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_accounts_org_platform ON accounts(org_id, platform);
CREATE INDEX idx_posts_org_status ON posts(org_id, status);
CREATE INDEX idx_tasks_scheduled_at ON tasks(scheduled_at);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_metrics_task_id ON metrics(task_id);
```

### 3. 行级安全策略 (RLS)

```sql
-- 启用 RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 组织策略
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- 账号策略
CREATE POLICY "Users can manage accounts in their organizations" ON accounts
  FOR ALL USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- 内容策略
CREATE POLICY "Users can manage posts in their organizations" ON posts
  FOR ALL USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- 任务策略
CREATE POLICY "Users can view tasks for their posts" ON tasks
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM posts WHERE org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );

-- 指标策略
CREATE POLICY "Users can view metrics for their tasks" ON metrics
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE post_id IN (
        SELECT id FROM posts WHERE org_id IN (
          SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
      )
    )
  );
```

## 🔧 开发指南

### 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API 路由
│   ├── auth/           # 认证页面
│   ├── dashboard/      # 仪表板页面
│   └── ...
├── components/         # React 组件
│   ├── ui/            # 基础 UI 组件
│   ├── layout/        # 布局组件
│   ├── forms/         # 表单组件
│   └── ...
├── lib/               # 工具库
│   ├── supabase/      # Supabase 客户端
│   ├── auth/          # 认证逻辑
│   ├── api/           # API 客户端
│   └── ...
├── types/             # TypeScript 类型定义
├── hooks/             # 自定义 React Hooks
├── utils/             # 工具函数
└── store/             # 状态管理
```

### 可用脚本

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 生成数据库类型
npm run db:generate

# 部署到 Cloudflare
npm run deploy
```

## 🚀 部署指南

### Cloudflare Workers 部署

1. 安装 Wrangler CLI：
```bash
npm install -g wrangler
```

2. 登录 Cloudflare：
```bash
wrangler login
```

3. 配置 `wrangler.toml`：
```toml
name = "ai-publisher"
compatibility_date = "2024-01-01"

[env.production]
vars = { NODE_ENV = "production" }
```

4. 创建 KV 命名空间：
```bash
npm run workers:setup
```

5. 设置环境变量：
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

# Supabase 配置
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Cloudflare 配置
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

6. 部署到生产环境：
```bash
npm run deploy:cloudflare
```

7. 查看部署日志：
```bash
npm run workers:logs
```

## 📚 API 文档

### 认证

所有 API 请求都需要在 Header 中包含 API Key：

```
Authorization: Bearer your_api_key
```

### 主要端点

#### 创建内容
```http
POST /api/v1/posts
Content-Type: application/json

{
  "title": "我的第一篇文章",
  "content": "这是文章内容...",
  "platforms": ["twitter", "facebook"],
  "scheduledAt": "2024-01-01T12:00:00Z"
}
```

#### 获取内容列表
```http
GET /api/v1/posts?status=published&limit=10&offset=0
```

#### 获取任务状态
```http
GET /api/v1/tasks/{taskId}
```

详细的 API 文档请访问：`/api/docs`

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到任何问题或需要帮助，请：

1. 查看 [常见问题](docs/FAQ.md)
2. 搜索 [Issues](../../issues)
3. 创建新的 Issue
4. 联系我们：support@ai-publisher.com

## 🗺️ 路线图

- [x] 基础项目架构
- [x] 用户认证系统
- [ ] 社交平台集成
- [ ] AI 内容生成
- [ ] 内容编辑器
- [ ] 发布调度系统
- [ ] 数据分析面板
- [ ] API 网关
- [ ] Cloudflare 部署
- [ ] 移动端适配

---

**AI Publisher** - 让内容创作更智能 🚀
