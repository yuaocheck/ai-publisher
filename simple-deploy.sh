#!/bin/bash

# 🚀 AI Publisher - 简化部署到 publisher.ai
# 直接推送到 GitHub 触发自动部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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

main() {
    print_header "🚀 AI Publisher - 简化部署"
    
    print_info "准备部署 AI Publisher 到 publisher.ai..."
    
    # 检查 Git 状态
    check_git_status
    
    # 推送代码
    push_code
    
    # 设置 GitHub Secrets 指南
    setup_secrets_guide
    
    # 完成
    deployment_guide
}

# 检查 Git 状态
check_git_status() {
    print_header "📋 检查 Git 状态"
    
    # 检查是否在 Git 仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "当前目录不是 Git 仓库"
        exit 1
    fi
    
    # 检查是否有远程仓库
    if ! git remote get-url origin > /dev/null 2>&1; then
        print_error "没有配置远程仓库"
        print_info "请先运行: ./push-to-github.sh"
        exit 1
    fi
    
    REMOTE_URL=$(git remote get-url origin)
    print_success "远程仓库: $REMOTE_URL"
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        print_warning "有未提交的更改"
        echo ""
        read -p "是否提交所有更改并继续部署？(y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "提交所有更改..."
            git add .
            git commit -m "feat: prepare for publisher.ai deployment

- Ready for production deployment to publisher.ai
- All configurations updated for Cloudflare Workers
- GitHub Actions workflow configured"
            print_success "更改已提交"
        else
            print_info "请先提交更改后重新运行此脚本"
            exit 1
        fi
    else
        print_success "工作目录干净"
    fi
}

# 推送代码
push_code() {
    print_header "🚀 推送代码"
    
    print_info "推送代码到 GitHub..."
    
    # 推送到 main 分支
    git push origin main
    
    print_success "代码已推送到 GitHub"
    
    # 获取仓库信息
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//')
    if [[ $REPO_URL == git@github.com:* ]]; then
        REPO_URL=$(echo $REPO_URL | sed 's/git@github.com:/https:\/\/github.com\//')
    fi
    
    print_success "GitHub Actions 将自动开始部署"
    print_info "GitHub Actions 页面: $REPO_URL/actions"
}

# 设置 GitHub Secrets 指南
setup_secrets_guide() {
    print_header "🔑 设置 GitHub Secrets"
    
    print_info "为了完成部署，您需要在 GitHub 仓库中设置以下 Secrets："
    
    echo ""
    print_info "📋 必需的 Secrets："
    echo "1. CLOUDFLARE_API_TOKEN = VQOCi47MrKQCt3b7rfIHsB15FXiuSfB4-SGw7w52"
    echo "2. CLOUDFLARE_ACCOUNT_ID = [您的 Cloudflare Account ID]"
    echo "3. GEMINI_API_KEY = [您的 Gemini API Key]"
    
    echo ""
    print_info "📋 可选的 Secrets（用于社交媒体功能）："
    echo "- TWITTER_CLIENT_ID"
    echo "- TWITTER_CLIENT_SECRET"
    echo "- FACEBOOK_APP_ID"
    echo "- FACEBOOK_APP_SECRET"
    echo "- INSTAGRAM_CLIENT_ID"
    echo "- INSTAGRAM_CLIENT_SECRET"
    echo "- LINKEDIN_CLIENT_ID"
    echo "- LINKEDIN_CLIENT_SECRET"
    echo "- YOUTUBE_CLIENT_ID"
    echo "- YOUTUBE_CLIENT_SECRET"
    echo "- TIKTOK_CLIENT_KEY"
    echo "- TIKTOK_CLIENT_SECRET"
    echo "- OPENAI_API_KEY"
    echo "- SUPABASE_URL"
    echo "- SUPABASE_ANON_KEY"
    echo "- SUPABASE_SERVICE_ROLE_KEY"
    
    echo ""
    print_info "🔧 设置步骤："
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    echo "1. 访问: $REPO_URL/settings/secrets/actions"
    echo "2. 点击 'New repository secret'"
    echo "3. 添加上述 Secrets"
    
    echo ""
    print_info "🌐 获取 Cloudflare Account ID："
    echo "1. 访问: https://dash.cloudflare.com/"
    echo "2. 在右侧栏找到 'Account ID'"
    echo "3. 复制该 ID 并设置为 CLOUDFLARE_ACCOUNT_ID"
    
    echo ""
    print_info "🤖 获取 Gemini API Key："
    echo "1. 访问: https://makersuite.google.com/app/apikey"
    echo "2. 创建新的 API Key"
    echo "3. 复制并设置为 GEMINI_API_KEY"
}

# 部署指南
deployment_guide() {
    print_header "🎉 部署指南"
    
    print_success "代码已推送到 GitHub！"
    
    echo ""
    print_info "📋 下一步操作："
    echo "1. 设置 GitHub Secrets（见上方指南）"
    echo "2. GitHub Actions 将自动部署到 Cloudflare Workers"
    echo "3. 部署完成后，您的网站将在 publisher.ai 上线"
    
    echo ""
    print_info "🔗 重要链接："
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    echo "- GitHub 仓库: $REPO_URL"
    echo "- GitHub Actions: $REPO_URL/actions"
    echo "- Secrets 设置: $REPO_URL/settings/secrets/actions"
    echo "- Cloudflare Dashboard: https://dash.cloudflare.com/"
    
    echo ""
    print_info "🌐 部署完成后访问地址："
    echo "- 主域名: https://publisher.ai"
    echo "- 主页: https://publisher.ai/demo/start.html"
    echo "- MCP 集成: https://publisher.ai/demo/mcp-integration.html"
    echo "- 社交发布: https://publisher.ai/demo/social-publisher.html"
    echo "- AI 图片生成: https://publisher.ai/demo/real-image-generator.html"
    echo "- AI 视频生成: https://publisher.ai/demo/real-video-generator.html"
    
    echo ""
    print_info "⏱️  部署时间："
    echo "- 设置 Secrets: 2-5 分钟"
    echo "- GitHub Actions 部署: 2-5 分钟"
    echo "- DNS 传播: 5-15 分钟"
    echo "- 总计: 约 10-25 分钟"
    
    echo ""
    print_info "🔧 监控部署："
    echo "- 查看 GitHub Actions 日志了解部署进度"
    echo "- 部署成功后会显示绿色的 ✅"
    echo "- 如有错误，检查 Secrets 设置是否正确"
    
    echo ""
    print_success "🎊 准备工作完成！"
    print_info "请按照上述指南设置 GitHub Secrets，然后等待自动部署完成。"
    
    # 询问是否打开相关页面
    echo ""
    read -p "是否在浏览器中打开 GitHub 仓库页面？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open >/dev/null 2>&1; then
            open "$REPO_URL"
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open "$REPO_URL"
        else
            print_info "请手动访问: $REPO_URL"
        fi
    fi
    
    echo ""
    read -p "是否打开 GitHub Actions 页面？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open >/dev/null 2>&1; then
            open "$REPO_URL/actions"
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open "$REPO_URL/actions"
        else
            print_info "请手动访问: $REPO_URL/actions"
        fi
    fi
    
    echo ""
    read -p "是否打开 Secrets 设置页面？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open >/dev/null 2>&1; then
            open "$REPO_URL/settings/secrets/actions"
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open "$REPO_URL/settings/secrets/actions"
        else
            print_info "请手动访问: $REPO_URL/settings/secrets/actions"
        fi
    fi
}

# 错误处理
trap 'print_error "部署脚本执行失败！"; exit 1' ERR

# 运行主函数
main "$@"
