#!/bin/bash

# 🧪 AI Publisher - 测试部署状态
# 检查 publisher.ai 部署是否成功

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

# 测试网站连接
test_website() {
    print_header "🌐 测试 publisher.ai 连接"
    
    local url="https://publisher.ai"
    print_info "测试主域名: $url"
    
    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null || echo "000")
        
        case $response in
            200)
                print_success "网站正常运行 (HTTP $response)"
                return 0
                ;;
            404)
                print_warning "网站返回 404，可能还在部署中"
                return 1
                ;;
            000)
                print_error "无法连接到网站，可能还未部署完成"
                return 1
                ;;
            *)
                print_warning "网站返回 HTTP $response"
                return 1
                ;;
        esac
    else
        print_warning "curl 未安装，无法测试网站连接"
        return 1
    fi
}

# 测试 API 端点
test_api_endpoints() {
    print_header "🔧 测试 API 端点"
    
    local base_url="https://publisher.ai"
    local endpoints=(
        "/api/health"
        "/api/mcp/health"
        "/api/mcp/servers"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="$base_url$endpoint"
        print_info "测试: $url"
        
        if command -v curl >/dev/null 2>&1; then
            local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo "000")
            
            case $response in
                200)
                    print_success "API 端点正常 (HTTP $response)"
                    ;;
                404)
                    print_warning "API 端点未找到 (HTTP $response)"
                    ;;
                000)
                    print_error "无法连接到 API 端点"
                    ;;
                *)
                    print_warning "API 端点返回 HTTP $response"
                    ;;
            esac
        else
            print_warning "curl 未安装，跳过 API 测试"
        fi
    done
}

# 检查 GitHub Actions 状态
check_github_actions() {
    print_header "📊 GitHub Actions 状态"
    
    print_info "GitHub Actions 页面: https://github.com/yuaocheck/ai-publisher/actions"
    print_info "请在浏览器中检查最新的工作流运行状态"
    
    echo ""
    print_info "🔍 查看要点："
    echo "- 最新的工作流是否成功完成 (绿色 ✅)"
    echo "- 如果失败 (红色 ❌)，点击查看错误日志"
    echo "- 部署通常需要 2-5 分钟完成"
}

# 检查必需的 Secrets
check_secrets() {
    print_header "🔑 GitHub Secrets 检查"
    
    print_info "请确保以下 Secrets 已在 GitHub 中设置："
    echo ""
    echo "1. CLOUDFLARE_API_TOKEN = VQOCi47MrKQCt3b7rfIHsB15FXiuSfB4-SGw7w52"
    echo "2. CLOUDFLARE_ACCOUNT_ID = [从 Cloudflare Dashboard 获取]"
    echo "3. GEMINI_API_KEY = [可选，用于 AI 功能]"
    
    echo ""
    print_info "设置页面: https://github.com/yuaocheck/ai-publisher/settings/secrets/actions"
    print_info "Cloudflare Dashboard: https://dash.cloudflare.com/"
}

# 主函数
main() {
    print_header "🧪 AI Publisher - 部署状态测试"
    
    print_info "检查 publisher.ai 部署状态..."
    
    # 检查 Secrets
    check_secrets
    
    # 检查 GitHub Actions
    check_github_actions
    
    # 测试网站
    if test_website; then
        # 如果网站可访问，测试 API
        test_api_endpoints
        
        print_header "🎉 测试完成"
        print_success "publisher.ai 部署成功！"
        
        echo ""
        print_info "🌐 访问地址："
        echo "- 主页: https://publisher.ai/demo/start.html"
        echo "- MCP 集成: https://publisher.ai/demo/mcp-integration.html"
        echo "- 社交发布: https://publisher.ai/demo/social-publisher.html"
        echo "- AI 图片生成: https://publisher.ai/demo/real-image-generator.html"
        echo "- AI 视频生成: https://publisher.ai/demo/real-video-generator.html"
        
        echo ""
        print_success "🎊 恭喜！您的 AI Publisher 已成功部署到 publisher.ai！"
        
    else
        print_header "⏳ 部署进行中"
        print_warning "publisher.ai 暂时无法访问"
        
        echo ""
        print_info "可能的原因："
        echo "1. 部署仍在进行中 (等待 2-5 分钟)"
        echo "2. GitHub Secrets 未正确设置"
        echo "3. DNS 传播需要时间 (5-15 分钟)"
        
        echo ""
        print_info "建议操作："
        echo "1. 检查 GitHub Actions 是否成功完成"
        echo "2. 确认所有 GitHub Secrets 已设置"
        echo "3. 等待几分钟后重新运行此测试"
        
        echo ""
        print_info "重新测试命令: ./test-deployment.sh"
    fi
    
    echo ""
    read -p "是否打开 publisher.ai 主页？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open >/dev/null 2>&1; then
            open "https://publisher.ai/demo/start.html"
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open "https://publisher.ai/demo/start.html"
        else
            print_info "请手动访问: https://publisher.ai/demo/start.html"
        fi
    fi
}

# 运行主函数
main "$@"
