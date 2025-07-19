#!/bin/bash

# AI Publisher GitHub 发布脚本
# 此脚本将自动创建 GitHub 仓库并发布项目

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="ai-publisher"
REPO_DESCRIPTION="🚀 AI Publisher - 全平台内容发布系统，基于 Google Gemini AI 的智能内容生成和多平台发布工具"
DEFAULT_BRANCH="main"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Display banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 AI Publisher                                 ║"
    echo "║               GitHub 自动发布                                 ║"
    echo "║                                                              ║"
    echo "║  📦 创建 GitHub 仓库                                          ║"
    echo "║  🔄 推送代码到远程                                            ║"
    echo "║  📝 生成项目文档                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "检查前置条件..."
    
    # Check if Git is installed
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装，请先安装 Git"
        log_info "访问: https://git-scm.com/"
        exit 1
    fi
    
    # Check if GitHub CLI is installed
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI 未安装，正在安装..."
        
        if command -v brew &> /dev/null; then
            brew install gh
        elif command -v apt-get &> /dev/null; then
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh
        else
            log_error "请手动安装 GitHub CLI"
            log_info "访问: https://cli.github.com/"
            exit 1
        fi
    fi
    
    log_success "前置条件检查完成"
}

# Login to GitHub
login_github() {
    log_info "登录 GitHub..."
    
    # Check if already logged in
    if gh auth status > /dev/null 2>&1; then
        log_success "已登录 GitHub"
        return
    fi
    
    log_info "请在浏览器中完成 GitHub 登录..."
    gh auth login
    
    log_success "GitHub 登录成功"
}

# Initialize Git repository
init_git_repo() {
    log_info "初始化 Git 仓库..."
    
    # Initialize git if not already initialized
    if [ ! -d ".git" ]; then
        git init
        git branch -M $DEFAULT_BRANCH
    fi
    
    # Configure git user if not set
    if [ -z "$(git config user.name)" ]; then
        read -p "请输入您的 Git 用户名: " git_username
        git config user.name "$git_username"
    fi
    
    if [ -z "$(git config user.email)" ]; then
        read -p "请输入您的 Git 邮箱: " git_email
        git config user.email "$git_email"
    fi
    
    log_success "Git 仓库初始化完成"
}

# Create .gitignore
create_gitignore() {
    log_info "创建 .gitignore 文件..."
    
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.supabase

# Supabase
.supabase-project
supabase/.temp/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Docker
docker-compose.override.yml

# SSL certificates
ssl/
*.pem
*.key
*.crt

# Backup files
backups/
*.backup
*.bak

# Temporary files
tmp/
temp/
.tmp/

# Production files
uploads/
media/

# Monitoring
prometheus_data/
grafana_data/
EOF
    
    log_success ".gitignore 文件已创建"
}

# Create comprehensive README
create_readme() {
    log_info "创建项目 README..."
    
    cat > README.md << 'EOF'
# 🚀 AI Publisher

<div align="center">

![AI Publisher Logo](https://via.placeholder.com/200x200/667eea/ffffff?text=AI+Publisher)

**全平台内容发布系统 | AI 驱动的智能内容生成**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_AI-orange)](https://ai.google.dev/)

[演示地址](https://ai-publisher-demo.vercel.app) • [文档](./docs) • [部署指南](./PRODUCTION_DEPLOYMENT.md)

</div>

## 📖 项目简介

AI Publisher 是一个基于 Google Gemini AI 的全平台内容发布系统，支持智能内容生成、多平台适配和自动化发布。让内容创作更智能，让品牌传播更高效。

### ✨ 核心特性

- 🤖 **AI 智能生成** - 基于 Google Gemini 的内容创作
- 📱 **多平台发布** - 支持 Twitter、Facebook、Instagram、LinkedIn 等
- 🎯 **内容优化** - 根据平台特性自动优化内容
- 📊 **数据分析** - 实时监控发布效果和互动数据
- 👥 **团队协作** - 多用户和组织管理
- 🔒 **安全可靠** - 企业级安全和隐私保护

## 🎯 功能特色

### 🤖 AI 功能
- **智能内容生成**: 根据提示生成高质量社交媒体内容
- **平台自动适配**: 自动调整内容格式以适应不同平台
- **语调控制**: 支持专业、随意、友好等多种语调
- **多语言支持**: 支持中文、英文等多种语言
- **标签推荐**: 智能推荐热门和相关标签
- **内容分析**: 分析内容情感和预估互动效果

### 📱 平台支持
- **Twitter/X**: 280字符限制，话题标签优化
- **Facebook**: 长文本支持，图文并茂
- **Instagram**: 视觉优先，标签丰富
- **LinkedIn**: 专业内容，商务导向
- **TikTok**: 短视频文案，年轻化表达
- **YouTube**: 视频描述，SEO 优化

### 🎯 内容管理
- **模板系统**: 可复用的内容模板
- **批量发布**: 一次创建，多平台发布
- **定时发布**: 最佳时间自动发布
- **草稿管理**: 保存和管理未完成内容
- **历史记录**: 查看和复用历史内容

## 🚀 快速开始

### 📋 系统要求

- Node.js 18.0.0+
- npm 或 yarn
- Git

### 🛠️ 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/ai-publisher.git
cd ai-publisher
```

2. **安装依赖**
```bash
npm install
```

3. **配置 Supabase**
```bash
# 运行自动配置脚本
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh
```

4. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🔧 环境配置

### 必需的环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI 配置
GEMINI_API_KEY=your_gemini_api_key

# 应用配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 可选的社交媒体 API

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

## 🏗️ 技术架构

### 前端技术栈
- **Next.js 14** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Headless UI** - 无头组件库

### 后端技术栈
- **Supabase** - 数据库和认证
- **Google Gemini AI** - AI 内容生成
- **Next.js API Routes** - API 接口

### 部署方案
- **Docker** - 容器化部署
- **Vercel** - 静态部署
- **Cloudflare Pages** - 边缘部署

## 📚 项目结构

```
ai-publisher/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   └── types/              # TypeScript 类型
├── supabase/
│   ├── migrations/         # 数据库迁移
│   └── config.toml         # Supabase 配置
├── scripts/                # 自动化脚本
├── demo/                   # HTML 演示版本
├── docs/                   # 项目文档
└── docker-compose.yml      # Docker 配置
```

## 🚀 部署指南

### 开发环境
```bash
npm run dev
```

### 生产环境

#### Docker 部署
```bash
# 一键部署
./deploy.sh production

# 或手动部署
docker-compose up -d
```

#### Vercel 部署
```bash
npm install -g vercel
vercel --prod
```

#### Cloudflare Pages 部署
```bash
npm run build
npm run deploy
```

详细部署指南请查看 [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

## 📊 演示

### 在线演示
- [完整应用演示](https://ai-publisher-demo.vercel.app)
- [HTML 静态演示](./demo/start.html)

### 功能截图

<details>
<summary>点击查看截图</summary>

#### 控制台
![Dashboard](https://via.placeholder.com/800x400/667eea/ffffff?text=Dashboard+Screenshot)

#### 内容创建
![Content Creation](https://via.placeholder.com/800x400/667eea/ffffff?text=Content+Creation+Screenshot)

#### 社交账号管理
![Social Accounts](https://via.placeholder.com/800x400/667eea/ffffff?text=Social+Accounts+Screenshot)

</details>

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 编写测试用例
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 开源 Firebase 替代方案
- [Google Gemini](https://ai.google.dev/) - AI 模型服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Headless UI](https://headlessui.com/) - 无头组件库

## 📞 支持

- 📧 邮箱: support@ai-publisher.com
- 💬 讨论: [GitHub Discussions](https://github.com/your-username/ai-publisher/discussions)
- 🐛 问题: [GitHub Issues](https://github.com/your-username/ai-publisher/issues)
- 📖 文档: [项目文档](./docs)

## 🗺️ 路线图

- [ ] 支持更多 AI 模型 (OpenAI, Claude)
- [ ] 移动端应用
- [ ] 更多社交平台集成
- [ ] 高级数据分析
- [ ] 团队协作功能增强
- [ ] API 开放平台

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐️**

Made with ❤️ by [AI Publisher Team](https://github.com/your-username)

</div>
EOF
    
    log_success "README.md 已创建"
}

# Create LICENSE file
create_license() {
    log_info "创建 LICENSE 文件..."
    
    cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 AI Publisher

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
    
    log_success "LICENSE 文件已创建"
}

# Create GitHub repository
create_github_repo() {
    log_info "创建 GitHub 仓库..."
    
    # Get GitHub username
    GITHUB_USERNAME=$(gh api user --jq .login)
    
    echo -e "${YELLOW}仓库配置：${NC}"
    read -p "仓库名称 ($REPO_NAME): " repo_name
    repo_name=${repo_name:-$REPO_NAME}
    
    read -p "仓库描述: " repo_desc
    repo_desc=${repo_desc:-$REPO_DESCRIPTION}
    
    echo -e "${YELLOW}仓库可见性：${NC}"
    echo "1) 公开 (public)"
    echo "2) 私有 (private)"
    read -p "选择 (1 或 2, 默认 1): " visibility_choice
    
    case ${visibility_choice:-1} in
        1) visibility="public" ;;
        2) visibility="private" ;;
        *) visibility="public" ;;
    esac
    
    # Create repository
    gh repo create "$repo_name" \
        --description "$repo_desc" \
        --$visibility \
        --clone=false
    
    # Add remote
    git remote add origin "https://github.com/$GITHUB_USERNAME/$repo_name.git" || \
    git remote set-url origin "https://github.com/$GITHUB_USERNAME/$repo_name.git"
    
    log_success "GitHub 仓库创建成功: https://github.com/$GITHUB_USERNAME/$repo_name"
    
    # Save repo info
    echo "GITHUB_USERNAME=$GITHUB_USERNAME" > .github-repo
    echo "REPO_NAME=$repo_name" >> .github-repo
    echo "REPO_URL=https://github.com/$GITHUB_USERNAME/$repo_name" >> .github-repo
}

# Commit and push code
commit_and_push() {
    log_info "提交并推送代码..."
    
    # Add all files
    git add .
    
    # Create initial commit
    git commit -m "🎉 Initial commit: AI Publisher

✨ Features:
- 🤖 Google Gemini AI integration
- 📱 Multi-platform content publishing
- 🎯 Intelligent content optimization
- 📊 Real-time analytics
- 👥 Team collaboration
- 🔒 Enterprise-grade security

🚀 Ready for production deployment!"
    
    # Push to GitHub
    git push -u origin $DEFAULT_BRANCH
    
    log_success "代码推送成功"
}

# Setup GitHub Pages (for demo)
setup_github_pages() {
    log_info "设置 GitHub Pages..."
    
    source .github-repo
    
    # Enable GitHub Pages
    gh api repos/$GITHUB_USERNAME/$REPO_NAME/pages \
        --method POST \
        --field source.branch=$DEFAULT_BRANCH \
        --field source.path="/demo" || true
    
    log_success "GitHub Pages 已设置: https://$GITHUB_USERNAME.github.io/$REPO_NAME"
}

# Create GitHub Actions workflow
create_github_actions() {
    log_info "创建 GitHub Actions 工作流..."
    
    mkdir -p .github/workflows
    
    cat > .github/workflows/ci.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run linter
      run: npm run lint
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for production
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
        GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
EOF
    
    log_success "GitHub Actions 工作流已创建"
}

# Main function
main() {
    show_banner
    
    log_info "开始 GitHub 发布流程..."
    echo ""
    
    check_prerequisites
    login_github
    init_git_repo
    create_gitignore
    create_readme
    create_license
    create_github_actions
    create_github_repo
    commit_and_push
    setup_github_pages
    
    echo ""
    log_success "🎉 GitHub 发布完成！"
    echo ""
    
    source .github-repo
    
    echo -e "${GREEN}项目信息：${NC}"
    echo "📦 仓库地址: $REPO_URL"
    echo "🌐 GitHub Pages: https://$GITHUB_USERNAME.github.io/$REPO_NAME"
    echo "🚀 Actions: $REPO_URL/actions"
    echo ""
    echo -e "${YELLOW}下一步：${NC}"
    echo "1. 在 GitHub 仓库设置中配置 Secrets"
    echo "2. 设置 Vercel 部署 (可选)"
    echo "3. 配置自定义域名 (可选)"
    echo "4. 邀请团队成员协作"
    echo ""
}

# Handle script interruption
trap 'log_error "发布中断"; exit 1' INT TERM

# Run main function
main "$@"
