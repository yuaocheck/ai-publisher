#!/bin/bash

# 🚀 AI Publisher - 通过 GitHub Actions 部署到 publisher.ai
# 使用 GitHub Actions 自动部署到 Cloudflare Workers

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

main() {
    print_header "🚀 AI Publisher - GitHub Actions 部署"
    
    print_info "通过 GitHub Actions 自动部署到 publisher.ai..."
    
    # 检查必要工具
    check_requirements
    
    # 检查 Git 状态
    check_git_status
    
    # 设置 GitHub Secrets
    setup_github_secrets
    
    # 推送代码触发部署
    trigger_deployment
    
    # 监控部署状态
    monitor_deployment
    
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
        print_info "安装 GitHub CLI..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command_exists brew; then
                brew install gh
            else
                print_error "请先安装 Homebrew 或手动安装 GitHub CLI"
                exit 1
            fi
        else
            print_error "请手动安装 GitHub CLI: https://cli.github.com/"
            exit 1
        fi
        print_success "GitHub CLI 安装完成"
    else
        print_success "GitHub CLI 已安装: $(gh --version | head -1)"
    fi
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
            git commit -m "feat: prepare for deployment to publisher.ai

- Update configuration for Cloudflare Workers deployment
- Fix build issues and dependencies
- Ready for production deployment"
            print_success "更改已提交"
        else
            print_info "请先提交更改后重新运行此脚本"
            exit 1
        fi
    else
        print_success "工作目录干净"
    fi
}

# 设置 GitHub Secrets
setup_github_secrets() {
    print_header "🔑 设置 GitHub Secrets"
    
    # 检查 GitHub CLI 登录状态
    if ! gh auth status > /dev/null 2>&1; then
        print_info "需要登录 GitHub..."
        gh auth login
    fi
    
    print_success "已登录 GitHub"
    
    # 必需的 Secrets
    REQUIRED_SECRETS=(
        "CLOUDFLARE_API_TOKEN:Cloudflare API 令牌"
        "CLOUDFLARE_ACCOUNT_ID:Cloudflare 账户 ID"
        "GEMINI_API_KEY:Google Gemini AI API 密钥"
    )
    
    # 可选的 Secrets
    OPTIONAL_SECRETS=(
        "TWITTER_CLIENT_ID:Twitter 客户端 ID"
        "TWITTER_CLIENT_SECRET:Twitter 客户端密钥"
        "FACEBOOK_APP_ID:Facebook 应用 ID"
        "FACEBOOK_APP_SECRET:Facebook 应用密钥"
        "INSTAGRAM_CLIENT_ID:Instagram 客户端 ID"
        "INSTAGRAM_CLIENT_SECRET:Instagram 客户端密钥"
        "LINKEDIN_CLIENT_ID:LinkedIn 客户端 ID"
        "LINKEDIN_CLIENT_SECRET:LinkedIn 客户端密钥"
        "YOUTUBE_CLIENT_ID:YouTube 客户端 ID"
        "YOUTUBE_CLIENT_SECRET:YouTube 客户端密钥"
        "TIKTOK_CLIENT_KEY:TikTok 客户端密钥"
        "TIKTOK_CLIENT_SECRET:TikTok 客户端密钥"
        "OPENAI_API_KEY:OpenAI API 密钥"
        "SUPABASE_URL:Supabase 项目 URL"
        "SUPABASE_ANON_KEY:Supabase 匿名密钥"
        "SUPABASE_SERVICE_ROLE_KEY:Supabase 服务角色密钥"
    )
    
    print_info "检查必需的 GitHub Secrets..."
    
    # 设置 Cloudflare API Token
    print_info "设置 CLOUDFLARE_API_TOKEN..."
    echo "VQOCi47MrKQCt3b7rfIHsB15FXiuSfB4-SGw7w52" | gh secret set CLOUDFLARE_API_TOKEN
    print_success "CLOUDFLARE_API_TOKEN 设置完成"
    
    # 获取 Cloudflare Account ID
    print_info "获取 Cloudflare Account ID..."
    print_warning "请访问 https://dash.cloudflare.com/ 获取您的 Account ID"
    print_info "Account ID 位于右侧栏的 'Account ID' 字段"
    
    read -p "请输入 Cloudflare Account ID: " ACCOUNT_ID
    if [ -n "$ACCOUNT_ID" ]; then
        echo "$ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID
        print_success "CLOUDFLARE_ACCOUNT_ID 设置完成"
    else
        print_error "Account ID 是必需的"
        exit 1
    fi
    
    # 设置 Gemini API Key
    print_info "设置 GEMINI_API_KEY..."
    print_info "如果您没有 Gemini API Key，可以从 https://makersuite.google.com/app/apikey 获取"
    
    read -p "请输入 Gemini API Key (按 Enter 跳过): " GEMINI_KEY
    if [ -n "$GEMINI_KEY" ]; then
        echo "$GEMINI_KEY" | gh secret set GEMINI_API_KEY
        print_success "GEMINI_API_KEY 设置完成"
    else
        print_warning "跳过 GEMINI_API_KEY，某些 AI 功能可能不可用"
    fi
    
    # 询问是否设置可选 Secrets
    echo ""
    read -p "是否设置可选的社交媒体 API Keys？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for secret_info in "${OPTIONAL_SECRETS[@]}"; do
            secret_name=$(echo "$secret_info" | cut -d':' -f1)
            secret_desc=$(echo "$secret_info" | cut -d':' -f2)
            
            echo ""
            print_info "设置 $secret_name ($secret_desc)"
            read -p "请输入值 (按 Enter 跳过): " secret_value
            
            if [ -n "$secret_value" ]; then
                echo "$secret_value" | gh secret set "$secret_name"
                print_success "$secret_name 设置完成"
            else
                print_info "跳过 $secret_name"
            fi
        done
    fi
    
    print_success "GitHub Secrets 配置完成"
}

# 触发部署
trigger_deployment() {
    print_header "🚀 触发部署"
    
    print_info "推送代码到 GitHub 触发自动部署..."
    
    # 推送到 main 分支
    git push origin main
    
    print_success "代码已推送，GitHub Actions 部署已触发"
    
    # 获取仓库信息
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//')
    if [[ $REPO_URL == git@github.com:* ]]; then
        REPO_URL=$(echo $REPO_URL | sed 's/git@github.com:/https:\/\/github.com\//')
    fi
    
    print_info "GitHub Actions 页面: $REPO_URL/actions"
}

# 监控部署状态
monitor_deployment() {
    print_header "📊 监控部署状态"
    
    print_info "监控 GitHub Actions 部署状态..."
    
    # 等待一段时间让 Actions 启动
    print_info "等待 GitHub Actions 启动..."
    sleep 10
    
    # 检查最新的 workflow run
    print_info "检查部署状态..."
    
    # 使用 gh 命令检查 workflow 状态
    if command_exists gh; then
        print_info "最新的 workflow runs:"
        gh run list --limit 3
        
        echo ""
        print_info "查看实时日志:"
        print_info "运行: gh run watch"
        
        echo ""
        read -p "是否现在查看实时部署日志？(y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gh run watch
        fi
    else
        print_info "请访问 GitHub Actions 页面查看部署状态"
    fi
}

# 部署完成
deployment_complete() {
    print_header "🎉 部署完成！"
    
    print_success "AI Publisher 部署流程已启动！"
    
    echo ""
    print_info "📋 部署信息:"
    print_info "  部署方式: GitHub Actions 自动部署"
    print_info "  目标域名: publisher.ai"
    print_info "  环境: Production"
    
    echo ""
    print_info "🔗 相关链接:"
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    print_info "  GitHub 仓库: $REPO_URL"
    print_info "  Actions 页面: $REPO_URL/actions"
    print_info "  部署状态: gh run list"
    
    echo ""
    print_info "🌐 部署完成后访问地址:"
    print_info "  主域名: https://publisher.ai"
    print_info "  WWW: https://www.publisher.ai"
    print_info "  主页: https://publisher.ai/demo/start.html"
    print_info "  MCP 集成: https://publisher.ai/demo/mcp-integration.html"
    
    echo ""
    print_info "🔧 管理命令:"
    print_info "  查看部署状态: gh run list"
    print_info "  查看实时日志: gh run watch"
    print_info "  重新触发部署: gh workflow run deploy.yml"
    
    echo ""
    print_success "🎊 部署流程完成！请等待 GitHub Actions 完成部署。"
    print_info "部署通常需要 2-5 分钟完成。"
    
    # 询问是否打开相关页面
    echo ""
    read -p "是否在浏览器中打开 GitHub Actions 页面？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command_exists open; then
            open "$REPO_URL/actions"
        elif command_exists xdg-open; then
            xdg-open "$REPO_URL/actions"
        else
            print_info "请手动访问: $REPO_URL/actions"
        fi
    fi
}

# 错误处理
trap 'print_error "部署脚本执行失败！"; exit 1' ERR

# 运行主函数
main "$@"
