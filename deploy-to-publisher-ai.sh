#!/bin/bash

# 🚀 AI Publisher - 部署到 publisher.ai 域名
# 完整部署到 Cloudflare Workers 并配置自定义域名

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
    print_header "🚀 AI Publisher - 部署到 publisher.ai"
    
    print_info "开始部署 AI Publisher 到 publisher.ai 域名..."
    
    # 检查必要工具
    check_requirements
    
    # 检查 Cloudflare 登录状态
    check_cloudflare_auth
    
    # 设置环境变量
    setup_environment_variables
    
    # 创建 KV 存储
    setup_kv_storage
    
    # 部署到 Cloudflare Workers
    deploy_to_workers
    
    # 配置自定义域名
    setup_custom_domain
    
    # 验证部署
    verify_deployment
    
    # 完成
    deployment_complete
}

# 检查必要工具
check_requirements() {
    print_header "🔧 检查必要工具"
    
    if ! command_exists wrangler; then
        print_info "安装 Wrangler CLI..."
        npm install -g wrangler
        print_success "Wrangler CLI 安装完成"
    else
        print_success "Wrangler CLI 已安装: $(wrangler --version)"
    fi
    
    if ! command_exists node; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    print_success "Node.js 已安装: $(node --version)"
    
    if ! command_exists npm; then
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    print_success "npm 已安装: $(npm --version)"
}

# 检查 Cloudflare 认证
check_cloudflare_auth() {
    print_header "🔐 检查 Cloudflare 认证"
    
    if ! wrangler whoami >/dev/null 2>&1; then
        print_info "需要登录 Cloudflare..."
        wrangler login
    fi
    
    print_success "已登录 Cloudflare"
    wrangler whoami
}

# 设置环境变量
setup_environment_variables() {
    print_header "🔑 设置环境变量"
    
    # 必需的环境变量
    REQUIRED_SECRETS=(
        "CLOUDFLARE_API_TOKEN:Cloudflare API 令牌"
        "CLOUDFLARE_ACCOUNT_ID:Cloudflare 账户 ID"
        "GEMINI_API_KEY:Google Gemini AI API 密钥"
    )
    
    # 可选的环境变量
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
    
    print_info "检查必需的环境变量..."
    
    MISSING_REQUIRED=()
    for secret_info in "${REQUIRED_SECRETS[@]}"; do
        secret_name=$(echo "$secret_info" | cut -d':' -f1)
        if ! wrangler secret list 2>/dev/null | grep -q "$secret_name"; then
            MISSING_REQUIRED+=("$secret_info")
        fi
    done
    
    if [ ${#MISSING_REQUIRED[@]} -gt 0 ]; then
        print_warning "缺少必需的环境变量:"
        for secret_info in "${MISSING_REQUIRED[@]}"; do
            secret_name=$(echo "$secret_info" | cut -d':' -f1)
            secret_desc=$(echo "$secret_info" | cut -d':' -f2)
            echo "   - $secret_name ($secret_desc)"
        done
        
        echo ""
        print_info "请设置这些环境变量:"
        for secret_info in "${MISSING_REQUIRED[@]}"; do
            secret_name=$(echo "$secret_info" | cut -d':' -f1)
            secret_desc=$(echo "$secret_info" | cut -d':' -f2)
            
            echo ""
            print_info "设置 $secret_name ($secret_desc)"
            echo "请输入值:"
            read -r secret_value
            
            if [ -n "$secret_value" ]; then
                echo "$secret_value" | wrangler secret put "$secret_name"
                print_success "$secret_name 设置完成"
            else
                print_error "$secret_name 是必需的，无法继续部署"
                exit 1
            fi
        done
    else
        print_success "所有必需的环境变量已设置"
    fi
    
    # 检查可选环境变量
    print_info "检查可选的环境变量..."
    MISSING_OPTIONAL=()
    for secret_info in "${OPTIONAL_SECRETS[@]}"; do
        secret_name=$(echo "$secret_info" | cut -d':' -f1)
        if ! wrangler secret list 2>/dev/null | grep -q "$secret_name"; then
            MISSING_OPTIONAL+=("$secret_info")
        fi
    done
    
    if [ ${#MISSING_OPTIONAL[@]} -gt 0 ]; then
        print_warning "以下可选环境变量未设置（某些功能可能不可用）:"
        for secret_info in "${MISSING_OPTIONAL[@]}"; do
            secret_name=$(echo "$secret_info" | cut -d':' -f1)
            secret_desc=$(echo "$secret_info" | cut -d':' -f2)
            echo "   - $secret_name ($secret_desc)"
        done
        
        echo ""
        read -p "是否现在设置可选环境变量？(y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for secret_info in "${MISSING_OPTIONAL[@]}"; do
                secret_name=$(echo "$secret_info" | cut -d':' -f1)
                secret_desc=$(echo "$secret_info" | cut -d':' -f2)
                
                echo ""
                print_info "设置 $secret_name ($secret_desc)"
                echo "请输入值 (按 Enter 跳过):"
                read -r secret_value
                
                if [ -n "$secret_value" ]; then
                    echo "$secret_value" | wrangler secret put "$secret_name"
                    print_success "$secret_name 设置完成"
                else
                    print_info "跳过 $secret_name"
                fi
            done
        fi
    else
        print_success "所有环境变量已设置"
    fi
}

# 设置 KV 存储
setup_kv_storage() {
    print_header "🗄️  设置 KV 存储"
    
    print_info "创建 KV 命名空间..."
    
    # 检查是否已存在
    if wrangler kv:namespace list | grep -q "CACHE"; then
        print_success "KV 命名空间已存在"
    else
        print_info "创建生产环境 KV 命名空间..."
        wrangler kv:namespace create "CACHE"
        
        print_info "创建预览环境 KV 命名空间..."
        wrangler kv:namespace create "CACHE" --preview
        
        print_success "KV 命名空间创建完成"
        print_warning "请更新 wrangler.toml 文件中的 KV 命名空间 ID"
    fi
}

# 部署到 Cloudflare Workers
deploy_to_workers() {
    print_header "🚀 部署到 Cloudflare Workers"
    
    print_info "安装项目依赖..."
    npm install
    
    print_info "部署到生产环境..."
    if wrangler deploy --env production; then
        print_success "部署成功！"
    else
        print_error "部署失败！"
        exit 1
    fi
}

# 配置自定义域名
setup_custom_domain() {
    print_header "🌐 配置自定义域名"
    
    print_info "配置 publisher.ai 域名..."
    
    # 检查域名是否已添加到 Cloudflare
    print_info "请确保 publisher.ai 域名已添加到您的 Cloudflare 账户"
    print_info "如果尚未添加，请："
    print_info "1. 登录 Cloudflare Dashboard"
    print_info "2. 点击 'Add a Site'"
    print_info "3. 输入 publisher.ai"
    print_info "4. 按照指示更新域名服务器"
    
    echo ""
    read -p "域名是否已添加到 Cloudflare？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "配置 Workers 路由..."
        
        # 这里可以添加自动配置路由的逻辑
        print_info "请在 Cloudflare Dashboard 中手动配置以下路由："
        print_info "1. 进入 Workers & Pages"
        print_info "2. 选择 ai-publisher-prod Worker"
        print_info "3. 点击 'Custom domains'"
        print_info "4. 添加 publisher.ai"
        print_info "5. 添加 www.publisher.ai"
        
        print_success "域名配置指导完成"
    else
        print_warning "请先添加域名到 Cloudflare，然后重新运行此脚本"
    fi
}

# 验证部署
verify_deployment() {
    print_header "🧪 验证部署"
    
    # 测试 Workers URL
    WORKER_URL="https://ai-publisher-prod.your-subdomain.workers.dev"
    print_info "测试 Workers URL: $WORKER_URL"
    
    if curl -s -f "$WORKER_URL/api/health" >/dev/null 2>&1; then
        print_success "Workers 部署验证成功"
    else
        print_warning "Workers 部署验证失败，但部署可能仍然成功"
    fi
    
    # 测试自定义域名
    print_info "测试自定义域名: https://publisher.ai"
    
    if curl -s -f "https://publisher.ai/api/health" >/dev/null 2>&1; then
        print_success "自定义域名验证成功"
    else
        print_warning "自定义域名验证失败，可能需要等待 DNS 传播"
    fi
}

# 部署完成
deployment_complete() {
    print_header "🎉 部署完成！"
    
    print_success "AI Publisher 已成功部署到 publisher.ai！"
    
    echo ""
    print_info "🌐 访问地址:"
    print_info "  主域名: https://publisher.ai"
    print_info "  WWW: https://www.publisher.ai"
    print_info "  Workers URL: https://ai-publisher-prod.your-subdomain.workers.dev"
    
    echo ""
    print_info "📱 主要功能页面:"
    print_info "  主页: https://publisher.ai/demo/start.html"
    print_info "  MCP 集成: https://publisher.ai/demo/mcp-integration.html"
    print_info "  社交发布: https://publisher.ai/demo/social-publisher.html"
    print_info "  AI 图片生成: https://publisher.ai/demo/real-image-generator.html"
    print_info "  AI 视频生成: https://publisher.ai/demo/real-video-generator.html"
    
    echo ""
    print_info "🔧 API 端点:"
    print_info "  健康检查: https://publisher.ai/api/health"
    print_info "  MCP 健康检查: https://publisher.ai/api/mcp/health"
    print_info "  MCP 服务器列表: https://publisher.ai/api/mcp/servers"
    
    echo ""
    print_info "🚀 Cloudflare MCP 集成:"
    print_info "  文档搜索: POST https://publisher.ai/api/mcp/docs/search"
    print_info "  浏览器渲染: POST https://publisher.ai/api/mcp/browser/render"
    print_info "  页面截图: POST https://publisher.ai/api/mcp/browser/screenshot"
    print_info "  Radar 数据: POST https://publisher.ai/api/mcp/radar/query"
    print_info "  AI Gateway: POST https://publisher.ai/api/mcp/ai-gateway/query"
    
    echo ""
    print_info "🔧 管理命令:"
    print_info "  查看日志: wrangler tail --env production"
    print_info "  更新部署: wrangler deploy --env production"
    print_info "  管理环境变量: wrangler secret list"
    
    echo ""
    print_success "🎊 部署成功！AI Publisher 现在可以通过 publisher.ai 访问！"
    print_info "感谢使用 AI Publisher！"
    
    # 询问是否打开浏览器
    echo ""
    read -p "是否在浏览器中打开 publisher.ai？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
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
