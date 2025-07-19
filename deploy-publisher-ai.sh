#!/bin/bash

# 🚀 AI Publisher - 一键部署到 publisher.ai
# 完整的 Cloudflare MCP 集成和自动部署

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
    print_header "🚀 AI Publisher - 一键部署到 publisher.ai"
    
    print_info "开始部署 AI Publisher 到 publisher.ai 域名..."
    print_info "集成 Cloudflare MCP Server 的 14 个官方服务器"
    
    # 检查环境
    check_environment
    
    # 设置 GitHub Secrets
    setup_github_secrets
    
    # 提交并推送代码
    commit_and_push
    
    # 监控部署
    monitor_deployment
    
    # 完成
    deployment_complete
}

# 检查环境
check_environment() {
    print_header "🔧 检查部署环境"
    
    # 检查 Git
    if ! command_exists git; then
        print_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    print_success "Git 已安装: $(git --version)"
    
    # 检查 Node.js
    if ! command_exists node; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    print_success "Node.js 已安装: $(node --version)"
    
    # 检查 npm
    if ! command_exists npm; then
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    print_success "npm 已安装: $(npm --version)"
    
    # 检查是否在 Git 仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "当前目录不是 Git 仓库"
        exit 1
    fi
    
    # 检查远程仓库
    if ! git remote get-url origin > /dev/null 2>&1; then
        print_error "没有配置远程仓库"
        print_info "请先运行: ./push-to-github.sh"
        exit 1
    fi
    
    REMOTE_URL=$(git remote get-url origin)
    print_success "远程仓库: $REMOTE_URL"
    
    # 检查 Wrangler
    if ! command_exists npx; then
        print_error "npx 未安装"
        exit 1
    fi
    
    print_success "环境检查完成"
}

# 设置 GitHub Secrets
setup_github_secrets() {
    print_header "🔑 设置 GitHub Secrets"
    
    print_info "为了完成部署，需要设置以下 GitHub Secrets："
    
    echo ""
    print_info "📋 必需的 Secrets："
    echo "1. CLOUDFLARE_API_TOKEN = VQOCi47MrKQCt3b7rfIHsB15FXiuSfB4-SGw7w52"
    echo "2. CLOUDFLARE_ACCOUNT_ID = [您的 Cloudflare Account ID]"
    echo "3. GEMINI_API_KEY = [您的 Gemini API Key]"
    
    echo ""
    print_info "🌐 获取 Cloudflare Account ID："
    print_info "1. 访问: https://dash.cloudflare.com/"
    print_info "2. 在右侧栏找到 'Account ID'"
    print_info "3. 复制该 ID"
    
    echo ""
    print_info "🤖 获取 Gemini API Key："
    print_info "1. 访问: https://makersuite.google.com/app/apikey"
    print_info "2. 创建新的 API Key"
    print_info "3. 复制该 Key"
    
    echo ""
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    print_info "🔧 设置步骤："
    print_info "1. 访问: $REPO_URL/settings/secrets/actions"
    print_info "2. 点击 'New repository secret'"
    print_info "3. 添加上述 3 个必需的 Secrets"
    
    echo ""
    read -p "是否已经设置好所有必需的 GitHub Secrets？(y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "请先设置 GitHub Secrets，然后重新运行此脚本"
        print_info "打开 Secrets 设置页面..."
        
        if command_exists open; then
            open "$REPO_URL/settings/secrets/actions"
        elif command_exists xdg-open; then
            xdg-open "$REPO_URL/settings/secrets/actions"
        else
            print_info "请手动访问: $REPO_URL/settings/secrets/actions"
        fi
        
        exit 1
    fi
    
    print_success "GitHub Secrets 已设置完成"
}

# 提交并推送代码
commit_and_push() {
    print_header "📤 提交并推送代码"
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        print_info "发现未提交的更改，正在提交..."
        
        git add .
        git commit -m "feat: deploy AI Publisher to publisher.ai with Cloudflare MCP integration

🚀 Features:
- Complete Cloudflare MCP Server integration (14 servers)
- Publisher.ai domain configuration
- Production-ready Cloudflare Workers deployment
- Enhanced GitHub Actions workflow
- Full MCP API endpoints and demo interface

🌐 MCP Servers Integrated:
- Documentation Server - Cloudflare docs search
- Workers Bindings Server - Storage, AI, compute primitives
- Workers Builds Server - Build insights and management
- Observability Server - Logs and analytics debugging
- Radar Server - Global Internet traffic insights
- Container Server - Sandbox development environment
- Browser Rendering Server - Web page rendering and screenshots
- Logpush Server - Log job health summaries
- AI Gateway Server - AI logs and prompt analytics
- AutoRAG Server - Document search and RAG analytics
- Audit Logs Server - Security audit logs and reports
- DNS Analytics Server - DNS performance optimization
- Digital Experience Monitoring - App performance insights
- Cloudflare One CASB Server - SaaS security misconfigurations
- GraphQL Server - Analytics via Cloudflare GraphQL API

🎯 Ready for production deployment to publisher.ai"
        
        print_success "代码已提交"
    else
        print_info "没有未提交的更改"
    fi
    
    print_info "推送代码到 GitHub..."
    git push origin main
    
    print_success "代码已推送到 GitHub"
    print_info "GitHub Actions 将自动开始部署"
}

# 监控部署
monitor_deployment() {
    print_header "📊 监控部署状态"
    
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    
    print_info "GitHub Actions 页面: $REPO_URL/actions"
    print_info "部署通常需要 2-5 分钟完成"
    
    echo ""
    read -p "是否在浏览器中打开 GitHub Actions 页面监控部署？(y/N): " -n 1 -r
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
    
    print_info "等待部署完成..."
    print_info "您可以在 GitHub Actions 页面查看实时部署日志"
}

# 部署完成
deployment_complete() {
    print_header "🎉 部署完成！"
    
    print_success "AI Publisher 已开始部署到 publisher.ai！"
    
    echo ""
    print_info "🌐 部署完成后访问地址："
    echo "- 主域名: https://publisher.ai"
    echo "- 主页: https://publisher.ai/demo/start.html"
    echo "- MCP 集成: https://publisher.ai/demo/mcp-integration.html"
    echo "- 社交发布: https://publisher.ai/demo/social-publisher.html"
    echo "- AI 图片生成: https://publisher.ai/demo/real-image-generator.html"
    echo "- AI 视频生成: https://publisher.ai/demo/real-video-generator.html"
    
    echo ""
    print_info "🔧 Cloudflare MCP API 端点："
    echo "- 健康检查: https://publisher.ai/api/mcp/health"
    echo "- 服务器列表: https://publisher.ai/api/mcp/servers"
    echo "- 文档搜索: POST https://publisher.ai/api/mcp/docs/search"
    echo "- 浏览器渲染: POST https://publisher.ai/api/mcp/browser/render"
    echo "- 页面截图: POST https://publisher.ai/api/mcp/browser/screenshot"
    echo "- Radar 数据: POST https://publisher.ai/api/mcp/radar/query"
    echo "- AI Gateway: POST https://publisher.ai/api/mcp/ai-gateway/query"
    echo "- 可观测性: POST https://publisher.ai/api/mcp/observability/logs"
    echo "- GraphQL 查询: POST https://publisher.ai/api/mcp/graphql/query"
    echo "- 通用 MCP 调用: POST https://publisher.ai/api/mcp/call"
    
    echo ""
    print_info "⏱️  预计时间："
    echo "- GitHub Actions 部署: 2-5 分钟"
    echo "- DNS 传播: 5-15 分钟"
    echo "- 总计: 约 10-20 分钟"
    
    echo ""
    print_info "🎯 核心功能："
    echo "✅ 14 个 Cloudflare MCP 服务器完整集成"
    echo "✅ 全球边缘部署 (200+ 数据中心)"
    echo "✅ 多平台社交媒体发布"
    echo "✅ AI 内容生成 (文本、图片、视频)"
    echo "✅ 企业级安全和性能"
    echo "✅ 实时 MCP API 调用"
    
    echo ""
    print_success "🎊 部署流程完成！"
    print_info "请等待 GitHub Actions 完成部署，然后访问 publisher.ai"
    print_info "您的世界级 AI 内容创作和发布平台即将上线！"
    
    echo ""
    read -p "是否打开 publisher.ai 主页？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "正在打开 publisher.ai..."
        if command_exists open; then
            open "https://publisher.ai/demo/start.html"
        elif command_exists xdg-open; then
            xdg-open "https://publisher.ai/demo/start.html"
        else
            print_info "请手动访问: https://publisher.ai/demo/start.html"
        fi
    fi
}

# 错误处理
trap 'print_error "部署脚本执行失败！"; exit 1' ERR

# 运行主函数
main "$@"
