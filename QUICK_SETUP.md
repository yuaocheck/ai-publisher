# ⚡ AI Publisher 快速设置指南

## 🎯 一键完整设置（推荐）

只需要一个命令，自动完成所有配置：

```bash
./setup-all.sh
```

这个脚本将自动：
- ✅ 检查系统要求
- ✅ 安装项目依赖
- ✅ 配置 Supabase 数据库
- ✅ 设置环境变量
- ✅ 测试应用构建
- ✅ 发布到 GitHub（可选）
- ✅ 准备生产部署

**预计用时：5-10 分钟**

---

## 🔧 分步设置（高级用户）

如果您想要更多控制，可以分步执行：

### 1️⃣ Supabase 配置
```bash
./scripts/setup-supabase.sh
```

### 2️⃣ GitHub 发布
```bash
./scripts/publish-github.sh
```

### 3️⃣ 生产部署
```bash
./deploy.sh production
```

---

## 📋 系统要求

在开始之前，请确保您的系统满足以下要求：

### 必需软件
- **Node.js 18.0.0+** ([下载地址](https://nodejs.org/))
- **Git** ([下载地址](https://git-scm.com/))
- **npm** (随 Node.js 安装)

### 可选软件
- **Docker** (用于生产部署)
- **GitHub CLI** (自动安装)
- **Supabase CLI** (自动安装)

---

## 🚀 立即开始

### 方式 1: 克隆现有项目
```bash
# 克隆项目
git clone https://github.com/your-username/ai-publisher.git
cd ai-publisher

# 一键设置
./setup-all.sh
```

### 方式 2: 从零开始
```bash
# 创建新目录
mkdir my-ai-publisher
cd my-ai-publisher

# 下载项目文件
curl -L https://github.com/your-username/ai-publisher/archive/main.zip -o ai-publisher.zip
unzip ai-publisher.zip
mv ai-publisher-main/* .
rm -rf ai-publisher-main ai-publisher.zip

# 一键设置
./setup-all.sh
```

---

## 🔑 API Keys 配置

### Google Gemini AI（已配置）
```bash
GEMINI_API_KEY=AIzaSyBtNkwPeJGoViemSfzXMjQmytmCMuWEvwY
```
✅ **已为您配置好，可直接使用！**

### Supabase（自动配置）
设置脚本会自动：
1. 创建 Supabase 项目
2. 配置数据库表
3. 生成 API Keys
4. 设置环境变量

### 社交媒体 API（可选）
如需连接社交媒体平台，请配置相应的 API Keys：

#### Twitter/X
1. 访问 [Twitter Developer Portal](https://developer.twitter.com/)
2. 创建应用并获取 API Keys
3. 添加到环境变量：
```bash
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

#### Facebook/Instagram
1. 访问 [Facebook Developers](https://developers.facebook.com/)
2. 创建应用并获取 App ID 和 Secret
3. 添加到环境变量：
```bash
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

#### LinkedIn
1. 访问 [LinkedIn Developers](https://www.linkedin.com/developers/)
2. 创建应用并获取 Client ID 和 Secret
3. 添加到环境变量：
```bash
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

---

## 🎯 设置完成后

### 启动开发服务器
```bash
npm run dev
```

### 访问应用
- **主应用**: http://localhost:3000
- **健康检查**: http://localhost:3000/api/health
- **演示版本**: 打开 `demo/start.html`

### 测试 AI 功能
1. 注册账号并登录
2. 创建组织
3. 进入内容创建页面
4. 点击"AI 生成"按钮
5. 输入提示词测试内容生成

---

## 🚨 常见问题

### Q: Node.js 版本不兼容
**A**: 请升级到 Node.js 18.0.0 或更高版本
```bash
# 使用 nvm 管理 Node.js 版本
nvm install 18
nvm use 18
```

### Q: 权限被拒绝
**A**: 给脚本添加执行权限
```bash
chmod +x setup-all.sh
chmod +x scripts/*.sh
```

### Q: Supabase 连接失败
**A**: 检查网络连接和 API Keys
```bash
# 重新配置 Supabase
./scripts/setup-supabase.sh
```

### Q: GitHub 发布失败
**A**: 确认 GitHub CLI 已登录
```bash
gh auth login
```

### Q: AI 功能不工作
**A**: Gemini API Key 已配置，检查网络连接
```bash
# 测试 API 连接
curl -H "Authorization: Bearer AIzaSyBtNkwPeJGoViemSfzXMjQmytmCMuWEvwY" \
     https://generativelanguage.googleapis.com/v1/models
```

---

## 📞 获取帮助

### 自助解决
1. 查看错误日志
2. 检查环境变量配置
3. 重新运行设置脚本
4. 查看项目文档

### 寻求支持
- 📖 [项目文档](./README.md)
- 🐛 [GitHub Issues](https://github.com/your-username/ai-publisher/issues)
- 💬 [讨论区](https://github.com/your-username/ai-publisher/discussions)
- 📧 邮箱: support@ai-publisher.com

---

## 🎉 设置成功！

设置完成后，您将拥有：

✅ **完整的 AI Publisher 应用**  
✅ **Google Gemini AI 集成**  
✅ **Supabase 数据库配置**  
✅ **GitHub 仓库和 CI/CD**  
✅ **生产部署就绪**  

**开始您的 AI 驱动的内容发布之旅吧！** 🚀

---

<div align="center">

**需要帮助？** [查看完整文档](./README.md) | [提交问题](https://github.com/your-username/ai-publisher/issues)

Made with ❤️ by AI Publisher Team

</div>
