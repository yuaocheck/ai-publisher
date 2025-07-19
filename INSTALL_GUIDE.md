# 📦 AI Publisher 安装指南

## 🎯 系统要求

- **操作系统**: macOS 10.15+, Windows 10+, Ubuntu 18.04+
- **Node.js**: 18.0.0 或更高版本
- **内存**: 至少 4GB RAM
- **存储**: 至少 1GB 可用空间

## 🚀 一键安装

### 方法一：使用安装脚本（推荐）

#### macOS/Linux:
```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/your-repo/ai-publisher/main/install.sh | bash

# 或者如果您已经克隆了项目
chmod +x setup.sh
./setup.sh
```

#### Windows:
```powershell
# 在 PowerShell 中运行
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-repo/ai-publisher/main/install.ps1" -OutFile "install.ps1"
.\install.ps1

# 或者如果您已经克隆了项目
.\setup.bat
```

## 🔧 手动安装

### 步骤 1: 安装 Node.js

#### macOS:

**方法 A: 使用官方安装包**
1. 访问 [nodejs.org](https://nodejs.org/)
2. 下载 LTS 版本（推荐 18.x）
3. 运行安装包并按照提示完成安装

**方法 B: 使用 Homebrew**
```bash
# 安装 Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node
```

**方法 C: 使用 NVM（推荐）**
```bash
# 安装 NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重启终端或运行
source ~/.bashrc

# 安装并使用 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

#### Windows:

**方法 A: 使用官方安装包**
1. 访问 [nodejs.org](https://nodejs.org/)
2. 下载 Windows Installer (.msi)
3. 运行安装程序，确保勾选 "Add to PATH"

**方法 B: 使用 Chocolatey**
```powershell
# 安装 Chocolatey（如果未安装）
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装 Node.js
choco install nodejs
```

**方法 C: 使用 NVM for Windows**
1. 下载 [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
2. 运行安装程序
3. 在命令提示符中运行：
```cmd
nvm install 18.17.0
nvm use 18.17.0
```

#### Linux (Ubuntu/Debian):

**方法 A: 使用 NodeSource 仓库**
```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs
```

**方法 B: 使用 NVM**
```bash
# 安装 NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重启终端或运行
source ~/.bashrc

# 安装 Node.js
nvm install 18
nvm use 18
```

### 步骤 2: 验证安装

```bash
# 检查 Node.js 版本
node --version
# 应该显示 v18.x.x 或更高

# 检查 npm 版本
npm --version
# 应该显示版本号
```

### 步骤 3: 克隆项目

```bash
# 克隆项目（替换为实际的仓库地址）
git clone https://github.com/your-username/ai-publisher.git

# 进入项目目录
cd ai-publisher
```

### 步骤 4: 安装项目依赖

```bash
# 使用 npm
npm install

# 或使用 yarn（如果您喜欢）
npm install -g yarn
yarn install
```

### 步骤 5: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑配置文件
# macOS/Linux
nano .env.local

# Windows
notepad .env.local

# 或使用 VS Code
code .env.local
```

**基本配置示例**:
```env
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth 配置（必需）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# 可选：社交平台 API 密钥
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
```

### 步骤 6: 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 或使用 yarn
yarn dev
```

### 步骤 7: 访问应用

打开浏览器访问: [http://localhost:3000](http://localhost:3000)

## 🔍 验证安装

安装完成后，您应该能够：

1. ✅ 看到 AI Publisher 首页
2. ✅ 注册新用户账号
3. ✅ 创建组织
4. ✅ 访问仪表板

## 🚨 常见问题

### 1. Node.js 安装失败

**问题**: 无法安装 Node.js
**解决方案**:
- 确保有管理员权限
- 检查网络连接
- 尝试使用不同的安装方法
- 清理之前的安装残留

### 2. npm install 失败

**问题**: 依赖安装失败
**解决方案**:
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 如果仍然失败，尝试使用 yarn
npm install -g yarn
yarn install
```

### 3. 端口冲突

**问题**: 端口 3000 被占用
**解决方案**:
```bash
# 查找占用进程
# macOS/Linux
lsof -ti:3000

# Windows
netstat -ano | findstr :3000

# 终止进程或使用其他端口
npm run dev -- -p 3001
```

### 4. 权限问题

**问题**: 权限被拒绝
**解决方案**:
```bash
# macOS/Linux: 修复 npm 权限
sudo chown -R $(whoami) ~/.npm

# 或使用 nvm 避免权限问题
```

### 5. 网络问题

**问题**: 下载速度慢或失败
**解决方案**:
```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com/

# 或使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com/
cnpm install
```

## 🔧 开发工具推荐

- **代码编辑器**: [VS Code](https://code.visualstudio.com/)
- **终端**: [iTerm2](https://iterm2.com/) (macOS), [Windows Terminal](https://github.com/microsoft/terminal) (Windows)
- **Git 客户端**: [GitHub Desktop](https://desktop.github.com/)
- **API 测试**: [Postman](https://www.postman.com/)

## 📚 下一步

安装完成后，建议您：

1. 📖 阅读 [README.md](./README.md) 了解项目概述
2. 🗄️ 按照 [Supabase 设置指南](./docs/SUPABASE_SETUP.md) 配置数据库
3. 🎯 查看 [演示指南](./docs/DEMO_GUIDE.md) 学习如何使用
4. 🚀 参考 [部署指南](./docs/DEPLOYMENT_GUIDE.md) 部署到生产环境

## 🆘 获取帮助

如果您在安装过程中遇到问题：

1. 查看 [故障排除](#常见问题) 部分
2. 搜索 [GitHub Issues](https://github.com/your-repo/ai-publisher/issues)
3. 创建新的 Issue 描述您的问题
4. 联系技术支持: support@ai-publisher.com

---

**安装成功后，欢迎体验 AI Publisher！** 🎉
