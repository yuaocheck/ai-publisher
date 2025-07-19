#!/bin/bash

# AI Publisher 一键设置脚本
# 自动配置 Supabase 并发布到 GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Display banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    AI Publisher                              ║"
    echo "║                  一键完整设置                                 ║"
    echo "║                                                              ║"
    echo "║  🚀 全平台内容发布系统                                        ║"
    echo "║  🤖 Google Gemini AI 集成                                    ║"
    echo "║  🗄️ Supabase 自动配置                                        ║"
    echo "║  📦 GitHub 自动发布                                          ║"
    echo "║  🌐 生产环境部署就绪                                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Show welcome message
show_welcome() {
    echo -e "${GREEN}欢迎使用 AI Publisher 一键设置！${NC}"
    echo ""
    echo "此脚本将帮助您："
    echo "✅ 配置 Supabase 数据库"
    echo "✅ 设置环境变量"
    echo "✅ 创建 GitHub 仓库"
    echo "✅ 推送代码到 GitHub"
    echo "✅ 配置 CI/CD 流水线"
    echo "✅ 准备生产部署"
    echo ""
    echo -e "${YELLOW}预计用时: 5-10 分钟${NC}"
    echo ""
    read -p "按 Enter 键继续，或 Ctrl+C 取消..."
}

# Check system requirements
check_requirements() {
    log_step "检查系统要求..."
    
    local missing_tools=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js (https://nodejs.org/)")
    else
        local node_version=$(node -v | cut -d'v' -f2)
        local major_version=$(echo $node_version | cut -d'.' -f1)
        if [ "$major_version" -lt 18 ]; then
            missing_tools+=("Node.js 18+ (当前版本: $node_version)")
        fi
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_tools+=("Git (https://git-scm.com/)")
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "缺少必需工具："
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        log_info "请安装缺少的工具后重新运行此脚本"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

# Install dependencies
install_dependencies() {
    log_step "安装项目依赖..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 文件不存在"
        exit 1
    fi
    
    npm install
    
    log_success "依赖安装完成"
}

# Setup Supabase
setup_supabase() {
    log_step "配置 Supabase..."
    
    # Make script executable
    chmod +x scripts/setup-supabase.sh
    
    # Run Supabase setup
    ./scripts/setup-supabase.sh
    
    log_success "Supabase 配置完成"
}

# Setup environment
setup_environment() {
    log_step "配置环境变量..."
    
    # Check if .env.supabase exists
    if [ -f ".env.supabase" ]; then
        log_info "发现 Supabase 环境配置，正在合并..."
        
        # Create comprehensive .env.local
        cat > .env.local << EOF
# ===========================================
# AI Publisher - 开发环境配置
# ===========================================

# 应用配置
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

EOF
        
        # Append Supabase config
        cat .env.supabase >> .env.local
        
        # Add AI configuration
        cat >> .env.local << EOF

# ===========================================
# AI 配置
# ===========================================
# Google Gemini API Key (已配置)
GEMINI_API_KEY=AIzaSyBtNkwPeJGoViemSfzXMjQmytmCMuWEvwY

# OpenAI 配置 (可选备用)
# OPENAI_API_KEY=your_openai_api_key

# ===========================================
# 社交媒体平台 API Keys (可选)
# ===========================================

# Twitter/X
# TWITTER_CLIENT_ID=your_twitter_client_id
# TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Facebook/Instagram
# FACEBOOK_APP_ID=your_facebook_app_id
# FACEBOOK_APP_SECRET=your_facebook_app_secret

# LinkedIn
# LINKEDIN_CLIENT_ID=your_linkedin_client_id
# LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# ===========================================
# 其他配置
# ===========================================
# Webhook Secret
WEBHOOK_SECRET=$(openssl rand -base64 32)

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
EOF
        
        log_success "环境变量配置完成"
    else
        log_warning "未找到 Supabase 配置，请先运行 Supabase 设置"
        return 1
    fi
}

# Test application
test_application() {
    log_step "测试应用..."
    
    # Run type check
    log_info "运行类型检查..."
    npm run type-check
    
    # Run linter
    log_info "运行代码检查..."
    npm run lint || log_warning "代码检查发现问题，但不影响继续"
    
    # Build application
    log_info "构建应用..."
    npm run build
    
    log_success "应用测试通过"
}

# Publish to GitHub
publish_github() {
    log_step "发布到 GitHub..."
    
    # Make script executable
    chmod +x scripts/publish-github.sh
    
    # Run GitHub publish
    ./scripts/publish-github.sh
    
    log_success "GitHub 发布完成"
}

# Show completion summary
show_completion() {
    echo ""
    echo -e "${GREEN}🎉 AI Publisher 设置完成！${NC}"
    echo ""
    
    # Load project info
    if [ -f ".github-repo" ]; then
        source .github-repo
        echo -e "${CYAN}项目信息：${NC}"
        echo "📦 GitHub 仓库: $REPO_URL"
        echo "🌐 演示地址: https://$GITHUB_USERNAME.github.io/$REPO_NAME"
        echo ""
    fi
    
    if [ -f ".supabase-project" ]; then
        source .supabase-project
        echo -e "${CYAN}Supabase 信息：${NC}"
        echo "🗄️ 项目 ID: $PROJECT_REF"
        echo "🔗 Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
        echo ""
    fi
    
    echo -e "${YELLOW}下一步操作：${NC}"
    echo ""
    echo "🚀 ${GREEN}立即启动开发服务器：${NC}"
    echo "   npm run dev"
    echo ""
    echo "🌐 ${GREEN}访问应用：${NC}"
    echo "   http://localhost:3000"
    echo ""
    echo "📊 ${GREEN}查看演示：${NC}"
    echo "   open demo/start.html"
    echo ""
    echo "🔧 ${GREEN}生产部署：${NC}"
    echo "   ./deploy.sh production"
    echo ""
    echo "📚 ${GREEN}查看文档：${NC}"
    echo "   - README.md - 项目介绍"
    echo "   - PRODUCTION_DEPLOYMENT.md - 部署指南"
    echo "   - PRODUCTION_READY.md - 生产配置"
    echo ""
    
    echo -e "${BLUE}功能特性：${NC}"
    echo "✅ Google Gemini AI 智能内容生成"
    echo "✅ 多平台内容发布 (Twitter, Facebook, Instagram, LinkedIn)"
    echo "✅ 内容自动优化和标签推荐"
    echo "✅ 团队协作和组织管理"
    echo "✅ 实时数据分析和监控"
    echo "✅ 生产级安全和性能优化"
    echo ""
    
    echo -e "${PURPLE}需要帮助？${NC}"
    echo "📧 GitHub Issues: $REPO_URL/issues"
    echo "📖 项目文档: $REPO_URL/blob/main/README.md"
    echo ""
    
    echo -e "${GREEN}感谢使用 AI Publisher！🚀${NC}"
}

# Handle errors
handle_error() {
    log_error "设置过程中出现错误"
    echo ""
    echo -e "${YELLOW}故障排除建议：${NC}"
    echo "1. 检查网络连接"
    echo "2. 确认所有必需工具已安装"
    echo "3. 检查权限设置"
    echo "4. 查看错误日志"
    echo ""
    echo "如需帮助，请访问："
    echo "📖 https://github.com/your-username/ai-publisher/issues"
    exit 1
}

# Main function
main() {
    # Set error handler
    trap handle_error ERR
    
    show_banner
    show_welcome
    
    log_info "开始 AI Publisher 完整设置流程..."
    echo ""
    
    # Step 1: Check requirements
    check_requirements
    
    # Step 2: Install dependencies
    install_dependencies
    
    # Step 3: Setup Supabase
    setup_supabase
    
    # Step 4: Setup environment
    setup_environment
    
    # Step 5: Test application
    test_application
    
    # Step 6: Publish to GitHub
    echo ""
    echo -e "${YELLOW}是否要发布到 GitHub？(y/n)${NC}"
    read -r publish_choice
    
    if [[ "$publish_choice" =~ ^[Yy]$ ]]; then
        publish_github
    else
        log_info "跳过 GitHub 发布"
    fi
    
    # Show completion summary
    show_completion
}

# Handle script interruption
trap 'log_error "设置被中断"; exit 1' INT TERM

# Run main function
main "$@"
