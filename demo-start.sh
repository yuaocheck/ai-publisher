#!/bin/bash

# AI Publisher 演示启动脚本
echo "🚀 启动 AI Publisher 演示..."
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$SCRIPT_DIR/demo"

# 检查演示文件是否存在
if [ ! -f "$DEMO_DIR/start.html" ]; then
    echo "❌ 演示文件不存在"
    echo "请确保在正确的项目目录运行此脚本"
    exit 1
fi

echo "📱 打开 AI Publisher 演示页面..."
echo ""

# 根据操作系统打开浏览器
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🌟 主页面: file://$DEMO_DIR/start.html"
    open "file://$DEMO_DIR/start.html"
    
    sleep 1
    
    echo "🤖 AI 生成页面: file://$DEMO_DIR/simple-ai.html"
    open "file://$DEMO_DIR/simple-ai.html"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🌟 主页面: file://$DEMO_DIR/start.html"
    xdg-open "file://$DEMO_DIR/start.html"
    
    sleep 1
    
    echo "🤖 AI 生成页面: file://$DEMO_DIR/simple-ai.html"
    xdg-open "file://$DEMO_DIR/simple-ai.html"
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    echo "🌟 主页面: file://$DEMO_DIR/start.html"
    start "file://$DEMO_DIR/start.html"
    
    sleep 1
    
    echo "🤖 AI 生成页面: file://$DEMO_DIR/simple-ai.html"
    start "file://$DEMO_DIR/simple-ai.html"
else
    echo "⚠️  无法自动打开浏览器，请手动访问以下链接："
    echo "🌟 主页面: file://$DEMO_DIR/start.html"
    echo "🤖 AI 生成页面: file://$DEMO_DIR/simple-ai.html"
fi

echo ""
echo "✨ 演示功能："
echo "   📋 项目概览和功能介绍"
echo "   🤖 真实的 AI 内容生成（需要 Gemini API Key）"
echo "   📱 多平台内容适配"
echo "   🎨 现代化的用户界面"
echo "   📊 数据分析和统计"
echo ""
echo "🔑 使用说明："
echo "   1. 访问 https://makersuite.google.com/app/apikey 获取免费 Gemini API Key"
echo "   2. 在 AI 生成页面输入 API Key"
echo "   3. 输入内容主题，选择参数"
echo "   4. 点击生成按钮体验 AI 功能"
echo ""
echo "📚 完整功能需要后端服务，请参考 backend/README.md"
echo ""
echo "🎉 享受 AI Publisher 的强大功能！"
