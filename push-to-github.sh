#!/bin/bash

# 🚀 AI Publisher - 推送到 GitHub 脚本
# 在您创建 GitHub 仓库后运行此脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
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
    print_header "🚀 AI Publisher - 推送到 GitHub"
    
    # 获取用户名
    get_github_username
    
    # 配置远程仓库
    configure_remote
    
    # 推送代码
    push_code
    
    # 完成
    deployment_complete
}

get_github_username() {
    print_info "请输入您的 GitHub 用户名:"
    read -r GITHUB_USERNAME
    
    if [ -z "$GITHUB_USERNAME" ]; then
        print_error "GitHub 用户名不能为空"
        exit 1
    fi
    
    print_info "请输入仓库名称 (默认: ai-publisher):"
    read -r REPO_NAME
    
    if [ -z "$REPO_NAME" ]; then
        REPO_NAME="ai-publisher"
    fi
    
    REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    
    print_success "仓库信息:"
    print_info "  用户名: $GITHUB_USERNAME"
    print_info "  仓库名: $REPO_NAME"
    print_info "  URL: $REPO_URL"
}

configure_remote() {
    print_header "🔧 配置远程仓库"
    
    # 移除现有远程仓库
    if git remote get-url origin >/dev/null 2>&1; then
        print_info "移除现有远程仓库..."
        git remote remove origin
    fi
    
    # 添加新的远程仓库
    print_info "添加远程仓库: $REPO_URL"
    git remote add origin "$REPO_URL"
    
    print_success "远程仓库配置完成"
}

push_code() {
    print_header "📤 推送代码"
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        print_info "发现未提交的更改，正在提交..."
        git add .
        git commit -m "feat: update AI Publisher with latest changes"
        print_success "更改已提交"
    fi
    
    # 推送代码
    print_info "推送代码到 GitHub..."
    
    if git push -u origin main; then
        print_success "代码推送成功！"
    else
        print_warning "推送失败，尝试强制推送..."
        if git push -u origin main --force; then
            print_success "强制推送成功！"
        else
            print_error "推送失败！"
            print_info "请检查："
            print_info "1. GitHub 仓库是否已创建"
            print_info "2. 用户名和仓库名是否正确"
            print_info "3. 网络连接是否正常"
            print_info "4. GitHub 账号权限是否足够"
            exit 1
        fi
    fi
}

deployment_complete() {
    print_header "🎉 推送完成！"
    
    print_success "AI Publisher 已成功推送到 GitHub！"
    
    echo ""
    print_info "📋 仓库信息:"
    print_info "  GitHub 地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    print_info "  克隆地址: $REPO_URL"
    
    echo ""
    print_info "🌐 下一步操作:"
    print_info "1. 访问 GitHub 仓库查看代码"
    print_info "2. 启用 GitHub Pages:"
    print_info "   - 进入 Settings > Pages"
    print_info "   - Source: Deploy from a branch"
    print_info "   - Branch: main, Folder: /demo"
    print_info "   - 网站将在 https://$GITHUB_USERNAME.github.io/$REPO_NAME/demo/start.html 可用"
    
    echo ""
    print_info "3. 配置 Cloudflare Workers 部署:"
    print_info "   - 在 Settings > Secrets 中添加:"
    print_info "     * CLOUDFLARE_API_TOKEN"
    print_info "     * CLOUDFLARE_ACCOUNT_ID"
    print_info "   - 推送代码将自动触发部署"
    
    echo ""
    print_info "4. 本地测试:"
    print_info "   - 运行: python3 -m http.server 8000"
    print_info "   - 访问: http://localhost:8000/demo/start.html"
    
    echo ""
    print_info "🚀 Cloudflare Workers 部署:"
    print_info "   - 运行: ./one-click-deploy.sh"
    print_info "   - 或手动: wrangler deploy"
    
    echo ""
    print_success "感谢使用 AI Publisher！"
    print_info "GitHub 地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
}

# 检查是否在 Git 仓库中
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    print_error "当前目录不是 Git 仓库"
    exit 1
fi

# 运行主函数
main "$@"
