#!/bin/bash

# AI Publisher 快速启动脚本
# 简化版本，假设环境已配置

echo "🚀 启动 AI Publisher..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "请先安装 Node.js 18+ 版本："
    echo "  macOS: brew install node"
    echo "  或访问: https://nodejs.org/"
    exit 1
fi

# 检查 package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json 不存在"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查环境变量
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local 文件不存在"
    if [ -f ".env.example" ]; then
        echo "📋 创建 .env.local 文件..."
        cp .env.example .env.local
        echo "✅ 已创建 .env.local，请编辑此文件填入您的配置"
    fi
fi

# 启动开发服务器
echo "🌟 启动开发服务器..."
echo "📱 应用将在 http://localhost:3000 启动"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev
