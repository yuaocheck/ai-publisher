#!/bin/bash

# AI Publisher 一键启动脚本
# 作者: AI Publisher Team
# 版本: 1.0.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 Node.js 版本
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            log_success "Node.js $NODE_VERSION 已安装"
            return 0
        else
            log_warning "Node.js 版本过低 ($NODE_VERSION)，需要 18.0.0 或更高版本"
            return 1
        fi
    else
        log_warning "Node.js 未安装"
        return 1
    fi
}

# 安装 Node.js
install_node() {
    log_info "开始安装 Node.js..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            log_info "使用 Homebrew 安装 Node.js..."
            brew install node
        else
            log_info "安装 Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install node
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            # Ubuntu/Debian
            log_info "使用 apt 安装 Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command_exists yum; then
            # CentOS/RHEL
            log_info "使用 yum 安装 Node.js..."
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        else
            log_error "不支持的 Linux 发行版"
            exit 1
        fi
    else
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
}

# 安装项目依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ -f "package.json" ]; then
        if command_exists yarn; then
            log_info "使用 Yarn 安装依赖..."
            yarn install
        else
            log_info "使用 npm 安装依赖..."
            npm install
        fi
        log_success "依赖安装完成"
    else
        log_error "package.json 文件不存在"
        exit 1
    fi
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            log_success "已创建 .env.local 文件"
            log_warning "请编辑 .env.local 文件，填入您的配置信息"
        else
            log_warning ".env.example 文件不存在，跳过环境变量设置"
        fi
    else
        log_info ".env.local 文件已存在"
    fi
}

# 检查 Supabase CLI
check_supabase() {
    if command_exists supabase; then
        log_success "Supabase CLI 已安装"
    else
        log_info "安装 Supabase CLI..."
        npm install -g supabase
    fi
}

# 启动开发服务器
start_dev_server() {
    log_info "启动开发服务器..."
    
    # 检查端口 3000 是否被占用
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "端口 3000 已被占用，尝试终止占用进程..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    log_info "在浏览器中打开 http://localhost:3000"
    
    if command_exists yarn; then
        yarn dev
    else
        npm run dev
    fi
}

# 主函数
main() {
    echo "=================================="
    echo "🚀 AI Publisher 一键启动脚本"
    echo "=================================="
    echo ""
    
    # 检查 Node.js
    if ! check_node_version; then
        install_node
    fi
    
    # 安装依赖
    install_dependencies
    
    # 设置环境变量
    setup_environment
    
    # 检查 Supabase CLI
    check_supabase
    
    echo ""
    log_success "环境设置完成！"
    echo ""
    
    # 询问是否启动开发服务器
    read -p "是否现在启动开发服务器？(y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_dev_server
    else
        echo ""
        log_info "您可以稍后运行以下命令启动开发服务器："
        echo "  npm run dev"
        echo ""
        log_info "然后在浏览器中访问: http://localhost:3000"
    fi
}

# 错误处理
trap 'log_error "脚本执行失败，请检查错误信息"' ERR

# 运行主函数
main "$@"
