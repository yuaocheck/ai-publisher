#!/bin/bash

# 🚀 AI Publisher - Node.js 自动安装脚本
# 为 macOS 系统自动安装 Node.js 和 npm

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

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

main() {
    print_header "🚀 Node.js 自动安装"
    
    print_info "开始为 macOS 安装 Node.js 和 npm..."
    
    # 检查是否已安装
    check_existing_installation
    
    # 选择安装方式
    choose_installation_method
    
    # 验证安装
    verify_installation
    
    # 完成
    installation_complete
}

# 检查现有安装
check_existing_installation() {
    print_header "🔍 检查现有安装"
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js 已安装: $NODE_VERSION"
        
        if command_exists npm; then
            NPM_VERSION=$(npm --version)
            print_success "npm 已安装: $NPM_VERSION"
            
            print_info "Node.js 和 npm 已经安装，可以直接运行部署脚本"
            exit 0
        fi
    else
        print_info "Node.js 未安装，需要进行安装"
    fi
}

# 选择安装方式
choose_installation_method() {
    print_header "📦 选择安装方式"
    
    echo "请选择 Node.js 安装方式："
    echo "1) 使用 Homebrew (推荐)"
    echo "2) 使用官方安装包"
    echo "3) 使用 Node Version Manager (nvm)"
    
    read -p "请选择 (1-3): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            install_with_homebrew
            ;;
        2)
            install_with_official_installer
            ;;
        3)
            install_with_nvm
            ;;
        *)
            print_warning "无效选择，使用默认方式 (Homebrew)"
            install_with_homebrew
            ;;
    esac
}

# 使用 Homebrew 安装
install_with_homebrew() {
    print_header "🍺 使用 Homebrew 安装"
    
    # 检查 Homebrew 是否已安装
    if ! command_exists brew; then
        print_info "Homebrew 未安装，正在安装 Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # 添加 Homebrew 到 PATH
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
        
        print_success "Homebrew 安装完成"
    else
        print_success "Homebrew 已安装"
    fi
    
    # 安装 Node.js
    print_info "使用 Homebrew 安装 Node.js..."
    brew install node
    
    print_success "Node.js 安装完成"
}

# 使用官方安装包
install_with_official_installer() {
    print_header "📥 使用官方安装包"
    
    print_info "正在下载 Node.js 官方安装包..."
    
    # 获取最新 LTS 版本
    NODEJS_VERSION="v18.19.0"
    INSTALLER_URL="https://nodejs.org/dist/${NODEJS_VERSION}/node-${NODEJS_VERSION}.pkg"
    
    # 下载安装包
    curl -o "/tmp/nodejs-installer.pkg" "$INSTALLER_URL"
    
    print_info "正在安装 Node.js..."
    print_warning "可能需要输入管理员密码"
    
    # 安装
    sudo installer -pkg "/tmp/nodejs-installer.pkg" -target /
    
    # 清理
    rm "/tmp/nodejs-installer.pkg"
    
    print_success "Node.js 安装完成"
}

# 使用 nvm 安装
install_with_nvm() {
    print_header "🔄 使用 NVM 安装"
    
    # 安装 nvm
    print_info "安装 Node Version Manager (nvm)..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # 重新加载 shell 配置
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # 安装最新 LTS Node.js
    print_info "安装最新 LTS 版本的 Node.js..."
    nvm install --lts
    nvm use --lts
    nvm alias default lts/*
    
    print_success "Node.js 安装完成"
}

# 验证安装
verify_installation() {
    print_header "✅ 验证安装"
    
    # 重新加载 shell 环境
    if [ -f ~/.zprofile ]; then
        source ~/.zprofile
    fi
    
    if [ -f ~/.bash_profile ]; then
        source ~/.bash_profile
    fi
    
    # 检查 Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js 验证成功: $NODE_VERSION"
    else
        print_error "Node.js 安装失败"
        print_info "请尝试重新打开终端或手动安装"
        exit 1
    fi
    
    # 检查 npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm 验证成功: $NPM_VERSION"
    else
        print_error "npm 安装失败"
        exit 1
    fi
    
    # 检查版本要求
    NODE_MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
        print_warning "Node.js 版本较低 ($NODE_VERSION)，建议升级到 16.0 或更高版本"
    else
        print_success "Node.js 版本符合要求"
    fi
}

# 安装完成
installation_complete() {
    print_header "🎉 安装完成！"
    
    print_success "Node.js 和 npm 安装成功！"
    
    echo ""
    print_info "📋 安装信息:"
    print_info "  Node.js 版本: $(node --version)"
    print_info "  npm 版本: $(npm --version)"
    print_info "  安装路径: $(which node)"
    
    echo ""
    print_info "🚀 下一步操作:"
    print_info "1. 重新打开终端或运行: source ~/.zprofile"
    print_info "2. 运行部署脚本: ./deploy-to-publisher-ai.sh"
    print_info "3. 或者运行: ./one-click-deploy.sh"
    
    echo ""
    print_info "🔧 常用 npm 命令:"
    print_info "  npm --version          # 查看 npm 版本"
    print_info "  npm install -g wrangler # 安装 Wrangler CLI"
    print_info "  npm list -g            # 查看全局安装的包"
    
    echo ""
    print_success "现在可以运行 AI Publisher 部署脚本了！"
    
    # 询问是否立即运行部署脚本
    echo ""
    read -p "是否立即运行部署脚本？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "启动部署脚本..."
        exec ./deploy-to-publisher-ai.sh
    else
        print_info "您可以稍后手动运行: ./deploy-to-publisher-ai.sh"
    fi
}

# 错误处理
trap 'print_error "安装脚本执行失败！"; exit 1' ERR

# 运行主函数
main "$@"
