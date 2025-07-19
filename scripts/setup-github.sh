#!/bin/bash

# AI Publisher - GitHub 仓库设置脚本
# 这个脚本将帮助您设置 GitHub 仓库并配置 Cloudflare Workers 部署

set -e

echo "🚀 AI Publisher - GitHub 仓库设置"
echo "=================================="

# 检查是否已经是 Git 仓库
if [ ! -d ".git" ]; then
    echo "📁 初始化 Git 仓库..."
    git init
    echo "✅ Git 仓库初始化完成"
else
    echo "✅ 已存在 Git 仓库"
fi

# 检查是否有远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "🔗 设置远程仓库"
    echo "请输入您的 GitHub 仓库 URL (例如: https://github.com/username/ai-publisher.git):"
    read -r REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo "✅ 远程仓库设置完成: $REPO_URL"
    else
        echo "⚠️  跳过远程仓库设置"
    fi
else
    CURRENT_ORIGIN=$(git remote get-url origin)
    echo "✅ 已存在远程仓库: $CURRENT_ORIGIN"
fi

# 创建 .gitignore 文件
echo ""
echo "📝 创建 .gitignore 文件..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
.next/
out/
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Cloudflare Workers
.wrangler/
wrangler.toml.bak

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
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

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# Supabase
.supabase/

# Temporary files
tmp/
temp/
EOF

echo "✅ .gitignore 文件创建完成"

# 添加所有文件到 Git
echo ""
echo "📦 添加文件到 Git..."
git add .

# 检查是否有提交
if git rev-parse --verify HEAD > /dev/null 2>&1; then
    echo "✅ 已有提交历史"
else
    echo "📝 创建初始提交..."
    git commit -m "feat: initial commit - AI Publisher with Cloudflare Workers support

🚀 Features:
- Multi-platform social media publishing
- AI content generation (text, images, videos)
- OAuth 2.0 integration for social platforms
- Cloudflare Workers deployment
- Real-time content generation and publishing
- Responsive web interface

🔧 Tech Stack:
- Cloudflare Workers for edge computing
- Alpine.js for reactive UI
- Tailwind CSS for styling
- Multiple AI APIs integration
- Social media APIs integration

📱 Supported Platforms:
- Twitter/X
- Facebook
- Instagram
- LinkedIn
- YouTube
- TikTok

🌐 Deployment:
- Cloudflare Workers (global edge network)
- GitHub Actions for CI/CD
- Automatic deployments on push"
    
    echo "✅ 初始提交创建完成"
fi

# 推送到远程仓库
if git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "🚀 推送到远程仓库..."
    
    # 检查是否有上游分支
    if git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
        git push
    else
        # 设置上游分支并推送
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        git push -u origin "$CURRENT_BRANCH"
    fi
    
    echo "✅ 推送完成"
else
    echo "⚠️  没有远程仓库，跳过推送"
fi

echo ""
echo "🎉 GitHub 仓库设置完成！"
echo ""
echo "📋 下一步操作："
echo "1. 访问您的 GitHub 仓库"
echo "2. 在 Settings > Secrets and variables > Actions 中添加以下 Secrets:"
echo "   - CLOUDFLARE_API_TOKEN"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo "   - 各社交平台的 API 密钥"
echo ""
echo "3. 推送代码将自动触发 GitHub Actions 部署到 Cloudflare Workers"
echo ""
echo "🔗 有用的命令:"
echo "   git status                    # 查看仓库状态"
echo "   git log --oneline            # 查看提交历史"
echo "   npm run workers:dev          # 本地开发"
echo "   npm run deploy:cloudflare    # 手动部署"
echo ""
echo "📚 更多信息请查看 README.md 文件"
