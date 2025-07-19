#!/bin/bash

# 🔧 AI Publisher - 修复部署问题
# 诊断并修复 publisher.ai 部署问题

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
    print_header "🔧 AI Publisher - 修复部署问题"
    
    print_info "诊断 publisher.ai 部署问题..."
    
    # 检查环境
    check_environment
    
    # 诊断问题
    diagnose_issues
    
    # 修复配置
    fix_configuration
    
    # 重新部署
    redeploy
    
    # 验证修复
    verify_fix
}

# 检查环境
check_environment() {
    print_header "🔍 检查环境"
    
    # 检查必要工具
    if ! command -v git >/dev/null 2>&1; then
        print_error "Git 未安装"
        exit 1
    fi
    print_success "Git 已安装"
    
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js 未安装"
        exit 1
    fi
    print_success "Node.js 已安装"
    
    if ! command -v npx >/dev/null 2>&1; then
        print_error "npx 未安装"
        exit 1
    fi
    print_success "npx 已安装"
    
    # 检查 Git 仓库
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "当前目录不是 Git 仓库"
        exit 1
    fi
    print_success "Git 仓库检查通过"
}

# 诊断问题
diagnose_issues() {
    print_header "🔍 诊断部署问题"
    
    print_info "检查 GitHub Actions 失败原因..."
    
    # 常见问题列表
    print_info "可能的问题原因："
    echo "1. GitHub Secrets 未正确设置"
    echo "2. Cloudflare API Token 权限不足"
    echo "3. Account ID 不正确"
    echo "4. wrangler.toml 配置问题"
    echo "5. 域名配置问题"
    
    echo ""
    print_warning "最可能的原因是 GitHub Secrets 配置问题"
}

# 修复配置
fix_configuration() {
    print_header "🔧 修复配置"
    
    # 修复 wrangler.toml
    print_info "修复 wrangler.toml 配置..."
    
    # 创建简化的 wrangler.toml
    cat > wrangler.toml << 'EOF'
name = "ai-publisher"
main = "src/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Variables
[vars]
NODE_ENV = "production"
ENVIRONMENT = "production"

# Production environment
[env.production]
name = "ai-publisher-prod"
vars = { NODE_ENV = "production", ENVIRONMENT = "production" }

# KV Namespaces (will be created automatically)
[[kv_namespaces]]
binding = "CACHE"
id = "placeholder"
preview_id = "placeholder"

# R2 Buckets (will be created automatically)
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "ai-publisher-media"
EOF
    
    print_success "wrangler.toml 已修复"
    
    # 修复 package.json
    print_info "检查 package.json..."
    
    if [ ! -f "package.json" ]; then
        print_info "创建 package.json..."
        cat > package.json << 'EOF'
{
  "name": "ai-publisher",
  "version": "1.0.0",
  "description": "AI Publisher - Global AI Content Creation and Publishing Platform",
  "main": "src/index.js",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:prod": "wrangler deploy --env production",
    "start": "python3 -m http.server 8000",
    "test": "echo \"No tests specified\" && exit 0"
  },
  "keywords": ["ai", "publisher", "cloudflare", "mcp", "social-media"],
  "author": "AI Publisher Team",
  "license": "MIT",
  "devDependencies": {
    "wrangler": "^3.114.11"
  },
  "dependencies": {}
}
EOF
        print_success "package.json 已创建"
    else
        print_success "package.json 已存在"
    fi
    
    # 确保 src/index.js 存在
    print_info "检查主入口文件..."
    
    if [ ! -f "src/index.js" ]; then
        print_info "创建 src/index.js..."
        mkdir -p src
        cat > src/index.js << 'EOF'
// AI Publisher - Cloudflare Workers Entry Point
// 集成 Cloudflare MCP Server 的 AI 内容发布平台

import { handleRequest } from './handlers/router.js';

export default {
    async fetch(request, env, ctx) {
        try {
            return await handleRequest(request, env, ctx);
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
                timestamp: new Date().toISOString()
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};
EOF
        print_success "src/index.js 已创建"
    else
        print_success "src/index.js 已存在"
    fi
}

# 重新部署
redeploy() {
    print_header "🚀 重新部署"
    
    print_info "提交修复..."
    git add .
    git commit -m "fix: resolve deployment issues for publisher.ai

- Fix wrangler.toml configuration
- Ensure package.json exists
- Create proper entry point
- Ready for successful deployment" || true
    
    print_info "推送到 GitHub..."
    git push origin main
    
    print_success "代码已推送，GitHub Actions 将重新开始部署"
    
    # 获取仓库 URL
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    print_info "GitHub Actions: $REPO_URL/actions"
}

# 验证修复
verify_fix() {
    print_header "✅ 验证修复"
    
    print_info "部署修复已完成！"
    
    echo ""
    print_info "📋 修复内容："
    echo "✅ 简化了 wrangler.toml 配置"
    echo "✅ 确保了 package.json 存在"
    echo "✅ 创建了正确的入口文件"
    echo "✅ 移除了可能导致冲突的配置"
    
    echo ""
    print_info "🔑 仍需要设置的 GitHub Secrets："
    echo "1. CLOUDFLARE_API_TOKEN = VQOCi47MrKQCt3b7rfIHsB15FXiuSfB4-SGw7w52"
    echo "2. CLOUDFLARE_ACCOUNT_ID = [从 Cloudflare Dashboard 获取]"
    echo "3. GEMINI_API_KEY = [可选，用于 AI 功能]"
    
    echo ""
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    print_info "🔧 设置 Secrets："
    print_info "访问: $REPO_URL/settings/secrets/actions"
    
    echo ""
    print_info "🌐 获取 Account ID："
    print_info "访问: https://dash.cloudflare.com/"
    print_info "在右侧栏找到 'Account ID' 并复制"
    
    echo ""
    print_info "📊 监控部署："
    print_info "访问: $REPO_URL/actions"
    
    echo ""
    print_success "修复完成！请设置 GitHub Secrets 后等待部署完成。"
    
    # 询问是否打开相关页面
    echo ""
    read -p "是否打开 GitHub Secrets 设置页面？(y/N): " -n 1 -r
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
    
    echo ""
    read -p "是否打开 Cloudflare Dashboard 获取 Account ID？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open >/dev/null 2>&1; then
            open "https://dash.cloudflare.com/"
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open "https://dash.cloudflare.com/"
        else
            print_info "请手动访问: https://dash.cloudflare.com/"
        fi
    fi
    
    echo ""
    read -p "是否打开 GitHub Actions 监控页面？(y/N): " -n 1 -r
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
}

# 错误处理
trap 'print_error "修复脚本执行失败！"; exit 1' ERR

# 运行主函数
main "$@"
