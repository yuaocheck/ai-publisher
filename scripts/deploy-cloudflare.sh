#!/bin/bash

# AI Publisher - Cloudflare Workers 部署脚本
# 这个脚本将帮助您部署 AI Publisher 到 Cloudflare Workers

set -e

echo "☁️  AI Publisher - Cloudflare Workers 部署"
echo "=========================================="

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI 未安装"
    echo "📦 正在安装 Wrangler CLI..."
    npm install -g wrangler
    echo "✅ Wrangler CLI 安装完成"
fi

# 检查是否已登录 Cloudflare
echo ""
echo "🔐 检查 Cloudflare 登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ 未登录 Cloudflare"
    echo "🔑 请登录 Cloudflare..."
    wrangler login
else
    echo "✅ 已登录 Cloudflare"
    wrangler whoami
fi

# 检查 wrangler.toml 配置
echo ""
echo "⚙️  检查配置文件..."
if [ ! -f "wrangler.toml" ]; then
    echo "❌ 未找到 wrangler.toml 配置文件"
    exit 1
fi
echo "✅ 配置文件存在"

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install
echo "✅ 依赖安装完成"

# 创建 KV 命名空间（如果不存在）
echo ""
echo "🗄️  设置 KV 存储..."
echo "正在创建 KV 命名空间..."

# 创建生产环境 KV 命名空间
if ! wrangler kv:namespace list | grep -q "AI_PUBLISHER_KV"; then
    echo "📝 创建生产环境 KV 命名空间..."
    wrangler kv:namespace create "AI_PUBLISHER_KV"
else
    echo "✅ 生产环境 KV 命名空间已存在"
fi

# 创建预览环境 KV 命名空间
if ! wrangler kv:namespace list | grep -q "AI_PUBLISHER_KV" | grep -q "preview"; then
    echo "📝 创建预览环境 KV 命名空间..."
    wrangler kv:namespace create "AI_PUBLISHER_KV" --preview
else
    echo "✅ 预览环境 KV 命名空间已存在"
fi

# 检查环境变量
echo ""
echo "🔑 检查环境变量..."
REQUIRED_SECRETS=(
    "TWITTER_CLIENT_ID"
    "TWITTER_CLIENT_SECRET"
    "FACEBOOK_APP_ID"
    "FACEBOOK_APP_SECRET"
    "GEMINI_API_KEY"
)

MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! wrangler secret list | grep -q "$secret"; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo "⚠️  缺少以下环境变量:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   - $secret"
    done
    echo ""
    echo "请使用以下命令设置环境变量:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   wrangler secret put $secret"
    done
    echo ""
    read -p "是否继续部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
else
    echo "✅ 所有必需的环境变量已设置"
fi

# 选择部署环境
echo ""
echo "🎯 选择部署环境:"
echo "1) 开发环境 (development)"
echo "2) 预览环境 (staging)"
echo "3) 生产环境 (production)"
read -p "请选择 (1-3): " -n 1 -r
echo

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
        echo "❌ 无效选择，使用默认环境 (development)"
        ENVIRONMENT="development"
        DEPLOY_CMD="wrangler deploy"
        ;;
esac

echo "🚀 部署到 $ENVIRONMENT 环境..."

# 执行部署
echo ""
echo "📤 正在部署..."
if $DEPLOY_CMD; then
    echo ""
    echo "🎉 部署成功！"
    
    # 获取部署信息
    echo ""
    echo "📋 部署信息:"
    echo "   环境: $ENVIRONMENT"
    echo "   时间: $(date)"
    
    # 显示 Worker 信息
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "   URL: https://ai-publisher.your-domain.com"
    else
        echo "   URL: https://ai-publisher-$ENVIRONMENT.your-subdomain.workers.dev"
    fi
    
    echo ""
    echo "🔗 有用的命令:"
    echo "   wrangler tail                 # 查看实时日志"
    echo "   wrangler tail --env $ENVIRONMENT  # 查看特定环境日志"
    echo "   wrangler kv:key list --binding AI_PUBLISHER_KV  # 查看 KV 数据"
    echo ""
    echo "📚 更多信息:"
    echo "   - Cloudflare Dashboard: https://dash.cloudflare.com"
    echo "   - Workers 文档: https://developers.cloudflare.com/workers/"
    echo "   - 项目文档: README.md"
    
else
    echo ""
    echo "❌ 部署失败！"
    echo ""
    echo "🔍 故障排除:"
    echo "1. 检查 wrangler.toml 配置"
    echo "2. 确认所有环境变量已设置"
    echo "3. 检查 Cloudflare 账户权限"
    echo "4. 查看详细错误信息"
    echo ""
    echo "📞 获取帮助:"
    echo "   - GitHub Issues: https://github.com/ai-publisher/ai-publisher/issues"
    echo "   - Cloudflare Discord: https://discord.gg/cloudflaredev"
    
    exit 1
fi

# 可选：运行部署后测试
echo ""
read -p "是否运行部署后测试？(y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧪 运行部署后测试..."
    
    # 测试健康检查端点
    if [ "$ENVIRONMENT" = "production" ]; then
        TEST_URL="https://ai-publisher.your-domain.com/api/health"
    else
        TEST_URL="https://ai-publisher-$ENVIRONMENT.your-subdomain.workers.dev/api/health"
    fi
    
    echo "📡 测试健康检查端点: $TEST_URL"
    
    if curl -s -f "$TEST_URL" > /dev/null; then
        echo "✅ 健康检查通过"
    else
        echo "⚠️  健康检查失败，但部署可能仍然成功"
    fi
fi

echo ""
echo "🎊 部署流程完成！"
echo "感谢使用 AI Publisher！"
