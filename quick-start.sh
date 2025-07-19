#!/bin/bash

# 🚀 AI Publisher - 快速启动脚本
# 用于快速启动演示环境

set -e

# 颜色定义
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

main() {
    print_header "🚀 AI Publisher - 快速启动"
    
    print_info "正在启动 AI Publisher 演示环境..."
    
    # 检查 Node.js
    if ! command_exists node; then
        print_warning "Node.js 未安装，请先安装 Node.js"
        echo "macOS: brew install node"
        echo "Ubuntu: sudo apt install nodejs npm"
        echo "或访问: https://nodejs.org/"
        exit 1
    fi
    
    print_success "Node.js 已安装: $(node --version)"
    
    # 启动演示服务器
    start_demo_server
}

start_demo_server() {
    print_header "🖥️  启动演示服务器"
    
    # 检查是否有 Python
    if command_exists python3; then
        PYTHON_CMD="python3"
    elif command_exists python; then
        PYTHON_CMD="python"
    else
        print_warning "Python 未安装，尝试使用 Node.js 服务器..."
        start_node_server
        return
    fi
    
    print_info "使用 Python 启动 HTTP 服务器..."
    print_info "服务器地址: http://localhost:8000"
    print_info "主页面: http://localhost:8000/demo/start.html"
    print_info "社交发布器: http://localhost:8000/demo/social-publisher.html"
    print_info "AI 图片生成: http://localhost:8000/demo/real-image-generator.html"
    print_info "AI 视频生成: http://localhost:8000/demo/real-video-generator.html"
    
    echo ""
    print_success "服务器启动中... 按 Ctrl+C 停止"
    echo ""
    
    # 启动 Python HTTP 服务器
    $PYTHON_CMD -m http.server 8000
}

start_node_server() {
    print_info "创建简单的 Node.js 服务器..."
    
    # 创建临时的 Node.js 服务器
    cat > temp_server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // 默认页面
    if (pathname === '/') {
        pathname = '/demo/start.html';
    }
    
    const filePath = path.join(__dirname, pathname);
    
    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                <head><title>404 - File Not Found</title></head>
                <body>
                    <h1>404 - File Not Found</h1>
                    <p>File: ${pathname}</p>
                    <p><a href="/demo/start.html">Go to Main Page</a></p>
                </body>
                </html>
            `);
            return;
        }
        
        // 读取文件
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
            
            // 设置 Content-Type
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml'
            };
            
            const contentType = contentTypes[ext] || 'text/plain';
            
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end(data);
        });
    });
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`🚀 AI Publisher 演示服务器启动成功！`);
    console.log(`📱 访问地址:`);
    console.log(`   主页: http://localhost:${PORT}/demo/start.html`);
    console.log(`   社交发布器: http://localhost:${PORT}/demo/social-publisher.html`);
    console.log(`   AI 图片生成: http://localhost:${PORT}/demo/real-image-generator.html`);
    console.log(`   AI 视频生成: http://localhost:${PORT}/demo/real-video-generator.html`);
    console.log(`   API 测试: http://localhost:${PORT}/demo/gemini-test.html`);
    console.log(``);
    console.log(`⚠️  注意: 这是演示环境，某些功能需要配置 API 密钥才能正常工作`);
    console.log(`📚 查看 README.md 了解完整部署指南`);
    console.log(``);
    console.log(`按 Ctrl+C 停止服务器`);
});
EOF
    
    print_info "启动 Node.js 服务器..."
    node temp_server.js
    
    # 清理临时文件
    rm -f temp_server.js
}

# 运行主函数
main "$@"
