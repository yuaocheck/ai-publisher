#!/bin/bash

# 🚀 AI Publisher - GitHub 部署脚本
# 重新创建 GitHub 存储库并部署项目

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

main() {
    print_header "🚀 AI Publisher - GitHub 重新部署"
    
    print_info "开始重新创建 GitHub 存储库并部署项目..."
    
    # 检查必要工具
    check_requirements
    
    # 获取用户信息
    get_user_info
    
    # 重新配置 Git
    reconfigure_git
    
    # 创建 GitHub 存储库
    create_github_repo
    
    # 推送代码
    push_to_github
    
    # 设置 GitHub Pages（可选）
    setup_github_pages
    
    # 完成
    deployment_complete
}

# 检查必要工具
check_requirements() {
    print_header "🔧 检查必要工具"
    
    if ! command_exists git; then
        print_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    print_success "Git 已安装: $(git --version)"
    
    if ! command_exists gh; then
        print_warning "GitHub CLI 未安装，将使用手动方式创建存储库"
        print_info "您可以安装 GitHub CLI 以获得更好的体验:"
        print_info "macOS: brew install gh"
        print_info "Ubuntu: sudo apt install gh"
        USE_GH_CLI=false
    else
        print_success "GitHub CLI 已安装: $(gh --version | head -1)"
        USE_GH_CLI=true
    fi
}

# 获取用户信息
get_user_info() {
    print_header "👤 获取用户信息"
    
    # 获取 GitHub 用户名
    if [ "$USE_GH_CLI" = true ] && gh auth status >/dev/null 2>&1; then
        GITHUB_USERNAME=$(gh api user --jq .login)
        print_success "已登录 GitHub: $GITHUB_USERNAME"
    else
        print_info "请输入您的 GitHub 用户名:"
        read -r GITHUB_USERNAME
        
        if [ -z "$GITHUB_USERNAME" ]; then
            print_error "GitHub 用户名不能为空"
            exit 1
        fi
    fi
    
    # 获取存储库名称
    print_info "请输入存储库名称 (默认: ai-publisher):"
    read -r REPO_NAME
    
    if [ -z "$REPO_NAME" ]; then
        REPO_NAME="ai-publisher"
    fi
    
    # 构建存储库 URL
    REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    
    print_success "存储库信息:"
    print_info "  用户名: $GITHUB_USERNAME"
    print_info "  存储库: $REPO_NAME"
    print_info "  URL: $REPO_URL"
}

# 重新配置 Git
reconfigure_git() {
    print_header "🔄 重新配置 Git"
    
    # 移除现有的远程仓库
    if git remote get-url origin >/dev/null 2>&1; then
        print_info "移除现有的远程仓库..."
        git remote remove origin
        print_success "已移除现有远程仓库"
    fi
    
    # 添加新的远程仓库
    print_info "添加新的远程仓库: $REPO_URL"
    git remote add origin "$REPO_URL"
    print_success "远程仓库配置完成"
    
    # 配置 Git 用户信息（如果未配置）
    if ! git config user.name >/dev/null 2>&1; then
        print_info "请输入您的 Git 用户名:"
        read -r GIT_USERNAME
        git config user.name "$GIT_USERNAME"
    fi
    
    if ! git config user.email >/dev/null 2>&1; then
        print_info "请输入您的 Git 邮箱:"
        read -r GIT_EMAIL
        git config user.email "$GIT_EMAIL"
    fi
    
    print_success "Git 配置完成"
    print_info "  用户名: $(git config user.name)"
    print_info "  邮箱: $(git config user.email)"
}

# 创建 GitHub 存储库
create_github_repo() {
    print_header "📦 创建 GitHub 存储库"
    
    if [ "$USE_GH_CLI" = true ]; then
        create_repo_with_cli
    else
        create_repo_manually
    fi
}

# 使用 GitHub CLI 创建存储库
create_repo_with_cli() {
    print_info "使用 GitHub CLI 创建存储库..."
    
    # 检查是否已登录
    if ! gh auth status >/dev/null 2>&1; then
        print_info "需要登录 GitHub..."
        gh auth login
    fi
    
    # 创建存储库
    print_info "创建存储库: $REPO_NAME"
    
    if gh repo create "$REPO_NAME" --public --description "AI Publisher - 智能内容创作与多平台发布系统" --clone=false; then
        print_success "GitHub 存储库创建成功"
    else
        print_warning "存储库可能已存在，继续推送代码..."
    fi
}

# 手动创建存储库
create_repo_manually() {
    print_warning "需要手动创建 GitHub 存储库"
    print_info "请按照以下步骤操作:"
    echo ""
    print_info "1. 访问 https://github.com/new"
    print_info "2. 存储库名称: $REPO_NAME"
    print_info "3. 描述: AI Publisher - 智能内容创作与多平台发布系统"
    print_info "4. 选择 Public（公开）"
    print_info "5. 不要初始化 README、.gitignore 或 license"
    print_info "6. 点击 'Create repository'"
    echo ""
    
    read -p "完成后按 Enter 继续..." -r
    print_success "假设存储库已创建"
}

# 推送代码到 GitHub
push_to_github() {
    print_header "📤 推送代码到 GitHub"
    
    # 检查是否有提交
    if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
        print_info "创建初始提交..."
        git add .
        git commit -m "feat: initial commit - AI Publisher with Cloudflare Workers support

🚀 Features:
- Multi-platform social media publishing (Twitter, Facebook, Instagram, LinkedIn, YouTube, TikTok)
- AI content generation (text, images, videos) with Gemini AI
- OAuth 2.0 integration for social platforms
- Cloudflare Workers deployment for global edge computing
- Real-time content generation and publishing
- Responsive web interface with Alpine.js and Tailwind CSS

🔧 Tech Stack:
- Cloudflare Workers for serverless edge computing
- Alpine.js for reactive UI components
- Tailwind CSS for modern styling
- Multiple AI APIs integration (Gemini, OpenAI)
- Social media APIs integration (Twitter API v2, Facebook Graph API, etc.)
- OAuth 2.0 for secure authentication

📱 Supported Platforms:
- Twitter/X - Complete API integration with OAuth 2.0
- Facebook - Page and personal profile publishing
- Instagram - Image and video publishing
- LinkedIn - Professional content publishing
- YouTube - Video upload and publishing
- TikTok - Short video content publishing

🌐 Deployment Options:
- Cloudflare Workers (global edge network with 200+ data centers)
- GitHub Actions for CI/CD automation
- Local development server for testing
- Multiple deployment scripts for easy setup

🎯 Key Features:
- One-click multi-platform publishing
- AI-powered content generation and optimization
- Real-time publishing status monitoring
- Batch operations for efficient content management
- Responsive design for all devices
- Comprehensive documentation and guides

🔒 Security:
- OAuth 2.0 standard authentication
- Environment variables encryption with Wrangler Secrets
- CORS protection for API security
- Rate limiting for API abuse prevention

📚 Documentation:
- Complete deployment guides
- API documentation
- Social publishing guides
- Troubleshooting guides

Ready for production deployment to Cloudflare Workers global network!"
        
        print_success "初始提交创建完成"
    fi
    
    # 推送到 GitHub
    print_info "推送代码到 GitHub..."
    
    # 设置上游分支并推送
    if git push -u origin main; then
        print_success "代码推送成功！"
    else
        print_warning "推送失败，尝试强制推送..."
        if git push -u origin main --force; then
            print_success "强制推送成功！"
        else
            print_error "推送失败，请检查网络连接和存储库权限"
            exit 1
        fi
    fi
    
    print_success "GitHub 存储库地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
}

# 设置 GitHub Pages
setup_github_pages() {
    print_header "🌐 设置 GitHub Pages"
    
    read -p "是否启用 GitHub Pages？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$USE_GH_CLI" = true ]; then
            print_info "使用 GitHub CLI 启用 Pages..."
            if gh api repos/"$GITHUB_USERNAME"/"$REPO_NAME"/pages -X POST -f source.branch=main -f source.path=/demo; then
                print_success "GitHub Pages 已启用"
                print_info "网站地址: https://$GITHUB_USERNAME.github.io/$REPO_NAME/demo/start.html"
            else
                print_warning "GitHub Pages 启用失败，请手动设置"
            fi
        else
            print_info "请手动启用 GitHub Pages:"
            print_info "1. 访问 https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
            print_info "2. Source: Deploy from a branch"
            print_info "3. Branch: main"
            print_info "4. Folder: /demo"
            print_info "5. 点击 Save"
            print_info "6. 网站将在 https://$GITHUB_USERNAME.github.io/$REPO_NAME/demo/start.html 可用"
        fi
    else
        print_info "跳过 GitHub Pages 设置"
    fi
}

# 部署完成
deployment_complete() {
    print_header "🎉 部署完成！"
    
    print_success "AI Publisher 已成功部署到 GitHub！"
    
    echo ""
    print_info "📋 存储库信息:"
    print_info "  GitHub 地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    print_info "  克隆地址: $REPO_URL"
    
    echo ""
    print_info "🌐 访问地址:"
    print_info "  GitHub Pages: https://$GITHUB_USERNAME.github.io/$REPO_NAME/demo/start.html"
    print_info "  原始文件: https://github.com/$GITHUB_USERNAME/$REPO_NAME/blob/main/demo/start.html"
    
    echo ""
    print_info "🚀 下一步操作:"
    print_info "1. 访问 GitHub 存储库查看代码"
    print_info "2. 在 Settings > Pages 中启用 GitHub Pages（如果未启用）"
    print_info "3. 在 Settings > Secrets 中添加 Cloudflare API 密钥"
    print_info "4. 推送代码将自动触发 GitHub Actions 部署"
    
    echo ""
    print_info "🔧 Cloudflare Workers 部署:"
    print_info "  运行: ./one-click-deploy.sh"
    print_info "  或手动: wrangler deploy"
    
    echo ""
    print_info "📚 文档:"
    print_info "  README.md - 项目概览"
    print_info "  DEPLOYMENT_GUIDE.md - 部署指南"
    print_info "  START_NOW.md - 快速启动指南"
    
    echo ""
    print_success "感谢使用 AI Publisher！"
    print_info "如有问题，请在 GitHub 上提交 Issue"
}

# 错误处理
trap 'print_error "脚本执行失败！"; exit 1' ERR

# 运行主函数
main "$@"
