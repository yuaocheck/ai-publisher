#!/bin/bash

# 🚀 AI Publisher - 一键启动和部署脚本
# 这个脚本将自动安装依赖、配置环境并部署到 Cloudflare Workers

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
}

print_success() {
    print_message "✅ $1" $GREEN
}

print_error() {
    print_message "❌ $1" $RED
}

print_warning() {
    print_message "⚠️  $1" $YELLOW
}

print_info() {
    print_message "ℹ️  $1" $BLUE
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 主函数
main() {
    print_header "🚀 AI Publisher - 一键部署"
    
    print_info "开始自动化部署流程..."
    echo ""
    
    # 步骤 1: 检查和安装 Node.js
    check_and_install_nodejs
    
    # 步骤 2: 安装项目依赖
    install_dependencies
    
    # 步骤 3: 安装和配置 Wrangler
    setup_wrangler
    
    # 步骤 4: 配置环境变量
    setup_environment_variables
    
    # 步骤 5: 创建 KV 存储
    setup_kv_storage
    
    # 步骤 6: 启动本地开发服务器
    start_local_server
    
    # 步骤 7: 部署到 Cloudflare Workers
    deploy_to_cloudflare
    
    # 完成
    deployment_complete
}

# 检查和安装 Node.js
check_and_install_nodejs() {
    print_header "📦 检查 Node.js 环境"
    
    if command_exists node && command_exists npm; then
        NODE_VERSION=$(node --version)
        NPM_VERSION=$(npm --version)
        print_success "Node.js 已安装: $NODE_VERSION"
        print_success "npm 已安装: $NPM_VERSION"
        
        # 检查 Node.js 版本
        NODE_MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js 版本过低 ($NODE_VERSION)，建议升级到 18.0 或更高版本"
        fi
    else
        print_error "Node.js 未安装"
        print_info "正在安装 Node.js..."
        
        # 检测操作系统并安装 Node.js
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command_exists brew; then
                brew install node
            else
                print_error "请先安装 Homebrew: https://brew.sh/"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            print_error "不支持的操作系统，请手动安装 Node.js: https://nodejs.org/"
            exit 1
        fi
        
        print_success "Node.js 安装完成"
    fi
}

# 安装项目依赖
install_dependencies() {
    print_header "📚 安装项目依赖"
    
    print_info "正在安装项目依赖..."
    npm install
    print_success "项目依赖安装完成"
}

# 设置 Wrangler
setup_wrangler() {
    print_header "☁️  配置 Cloudflare Wrangler"
    
    if ! command_exists wrangler; then
        print_info "正在安装 Wrangler CLI..."
        npm install -g wrangler
        print_success "Wrangler CLI 安装完成"
    else
        print_success "Wrangler CLI 已安装"
    fi
    
    # 检查是否已登录
    if ! wrangler whoami >/dev/null 2>&1; then
        print_info "需要登录 Cloudflare..."
        print_warning "即将打开浏览器进行 OAuth 授权"
        read -p "按 Enter 继续..."
        
        wrangler login
        print_success "Cloudflare 登录成功"
    else
        print_success "已登录 Cloudflare"
        wrangler whoami
    fi
}

# 配置环境变量
setup_environment_variables() {
    print_header "🔑 配置环境变量"
    
    print_info "检查必需的环境变量..."
    
    # 必需的环境变量列表
    REQUIRED_SECRETS=(
        "GEMINI_API_KEY:Google Gemini AI API 密钥"
        "TWITTER_CLIENT_ID:Twitter 客户端 ID"
        "TWITTER_CLIENT_SECRET:Twitter 客户端密钥"
        "FACEBOOK_APP_ID:Facebook 应用 ID"
        "FACEBOOK_APP_SECRET:Facebook 应用密钥"
    )
    
    MISSING_SECRETS=()
    
    # 检查现有的环境变量
    for secret_info in "${REQUIRED_SECRETS[@]}"; do
        secret_name=$(echo "$secret_info" | cut -d':' -f1)
        if ! wrangler secret list 2>/dev/null | grep -q "$secret_name"; then
            MISSING_SECRETS+=("$secret_info")
        fi
    done
    
    if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
        print_warning "缺少以下环境变量:"
        for secret_info in "${MISSING_SECRETS[@]}"; do
            secret_name=$(echo "$secret_info" | cut -d':' -f1)
            secret_desc=$(echo "$secret_info" | cut -d':' -f2)
            echo "   - $secret_name ($secret_desc)"
        done
        
        echo ""
        print_info "您可以选择："
        echo "1) 现在设置这些环境变量"
        echo "2) 稍后手动设置"
        echo "3) 使用演示模式（部分功能可能不可用）"
        
        read -p "请选择 (1-3): " -n 1 -r
        echo ""
        
        case $REPLY in
            1)
                setup_secrets_interactive
                ;;
            2)
                print_info "您可以稍后使用以下命令设置环境变量:"
                for secret_info in "${MISSING_SECRETS[@]}"; do
                    secret_name=$(echo "$secret_info" | cut -d':' -f1)
                    echo "   wrangler secret put $secret_name"
                done
                ;;
            3)
                print_warning "使用演示模式，部分功能可能不可用"
                ;;
        esac
    else
        print_success "所有必需的环境变量已设置"
    fi
}

# 交互式设置环境变量
setup_secrets_interactive() {
    print_info "开始交互式环境变量设置..."
    
    for secret_info in "${MISSING_SECRETS[@]}"; do
        secret_name=$(echo "$secret_info" | cut -d':' -f1)
        secret_desc=$(echo "$secret_info" | cut -d':' -f2)
        
        echo ""
        print_info "设置 $secret_name ($secret_desc)"
        echo "请输入值 (输入 'skip' 跳过):"
        read -r secret_value
        
        if [ "$secret_value" != "skip" ] && [ -n "$secret_value" ]; then
            echo "$secret_value" | wrangler secret put "$secret_name"
            print_success "$secret_name 设置完成"
        else
            print_warning "跳过 $secret_name"
        fi
    done
}

# 设置 KV 存储
setup_kv_storage() {
    print_header "🗄️  设置 KV 存储"
    
    print_info "创建 KV 命名空间..."
    
    # 检查是否已存在 KV 命名空间
    if wrangler kv:namespace list | grep -q "AI_PUBLISHER_KV"; then
        print_success "KV 命名空间已存在"
    else
        print_info "创建生产环境 KV 命名空间..."
        wrangler kv:namespace create "AI_PUBLISHER_KV"
        
        print_info "创建预览环境 KV 命名空间..."
        wrangler kv:namespace create "AI_PUBLISHER_KV" --preview
        
        print_success "KV 命名空间创建完成"
        print_warning "请更新 wrangler.toml 文件中的 KV 命名空间 ID"
    fi
}

# 启动本地开发服务器
start_local_server() {
    print_header "🖥️  启动本地开发服务器"
    
    print_info "启动 Cloudflare Workers 开发服务器..."
    print_info "服务器将在 http://localhost:8787 启动"
    print_info "按 Ctrl+C 停止服务器并继续部署"
    
    echo ""
    read -p "是否启动本地开发服务器进行测试？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "启动开发服务器..."
        print_warning "测试完成后请按 Ctrl+C 继续部署流程"
        
        # 启动开发服务器
        wrangler dev --local || true
        
        print_info "开发服务器已停止，继续部署流程..."
    else
        print_info "跳过本地测试，直接进行部署"
    fi
}

# 部署到 Cloudflare Workers
deploy_to_cloudflare() {
    print_header "🚀 部署到 Cloudflare Workers"
    
    print_info "选择部署环境:"
    echo "1) 开发环境 (development)"
    echo "2) 预览环境 (staging)"
    echo "3) 生产环境 (production)"
    
    read -p "请选择 (1-3): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            ENVIRONMENT="development"
            DEPLOY_CMD="wrangler deploy"
            ;;
        2)
            ENVIRONMENT="staging"
            DEPLOY_CMD="wrangler deploy --env staging"
            ;;
        3)
            ENVIRONMENT="production"
            DEPLOY_CMD="wrangler deploy --env production"
            ;;
        *)
            print_warning "无效选择，使用默认环境 (development)"
            ENVIRONMENT="development"
            DEPLOY_CMD="wrangler deploy"
            ;;
    esac
    
    print_info "部署到 $ENVIRONMENT 环境..."
    
    # 执行部署
    if $DEPLOY_CMD; then
        print_success "部署成功！"
        
        # 获取部署 URL
        if [ "$ENVIRONMENT" = "production" ]; then
            DEPLOY_URL="https://ai-publisher.your-domain.com"
        else
            DEPLOY_URL="https://ai-publisher-$ENVIRONMENT.your-subdomain.workers.dev"
        fi
        
        print_info "部署 URL: $DEPLOY_URL"
        
        # 测试部署
        test_deployment "$DEPLOY_URL"
        
    else
        print_error "部署失败！"
        print_info "请检查错误信息并重试"
        exit 1
    fi
}

# 测试部署
test_deployment() {
    local deploy_url=$1
    
    print_info "测试部署..."
    
    # 测试健康检查端点
    if curl -s -f "$deploy_url/api/health" >/dev/null 2>&1; then
        print_success "健康检查通过"
    else
        print_warning "健康检查失败，但部署可能仍然成功"
    fi
    
    # 询问是否打开浏览器
    echo ""
    read -p "是否在浏览器中打开应用？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command_exists open; then
            open "$deploy_url"
        elif command_exists xdg-open; then
            xdg-open "$deploy_url"
        else
            print_info "请手动访问: $deploy_url"
        fi
    fi
}

# 部署完成
deployment_complete() {
    print_header "🎉 部署完成！"
    
    print_success "AI Publisher 已成功部署到 Cloudflare Workers！"
    
    echo ""
    print_info "🌟 功能特性:"
    echo "   ✅ 多平台社交媒体发布"
    echo "   ✅ AI 内容生成 (文本、图片、视频)"
    echo "   ✅ OAuth 2.0 社交平台授权"
    echo "   ✅ 全球边缘计算 (200+ 数据中心)"
    echo "   ✅ 实时发布监控"
    echo "   ✅ 批量操作支持"
    
    echo ""
    print_info "🔗 有用的命令:"
    echo "   wrangler tail                 # 查看实时日志"
    echo "   wrangler dev                  # 本地开发"
    echo "   wrangler deploy               # 重新部署"
    echo "   wrangler secret list          # 查看环境变量"
    
    echo ""
    print_info "📚 文档和帮助:"
    echo "   - README.md                   # 项目文档"
    echo "   - DEPLOYMENT_GUIDE.md         # 部署指南"
    echo "   - SOCIAL_PUBLISHING_GUIDE.md  # 社交发布指南"
    
    echo ""
    print_success "感谢使用 AI Publisher！"
    print_info "如有问题，请查看文档或提交 GitHub Issue"
    
    echo ""
}

# 错误处理
trap 'print_error "脚本执行失败！"; exit 1' ERR

# 运行主函数
main "$@"
