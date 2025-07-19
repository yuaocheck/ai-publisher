# 🚀 AI Publisher - 立即开始

## 🎯 一键启动（3 种方式）

### 方式 1: 自动安装脚本（推荐）

```bash
# macOS/Linux 用户
./setup.sh

# Windows 用户
setup.bat
```

### 方式 2: 快速启动（环境已配置）

```bash
# 如果您已经安装了 Node.js
./start.sh
```

### 方式 3: 手动启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件

# 3. 启动服务器
npm run dev
```

## 📋 启动前检查清单

- [ ] **Node.js 18+** 已安装 ([下载地址](https://nodejs.org/))
- [ ] **Git** 已安装 ([下载地址](https://git-scm.com/))
- [ ] 项目文件已下载到本地
- [ ] 网络连接正常

## 🔧 如果遇到问题

### 1. Node.js 未安装

**macOS 用户**:
```bash
# 使用 Homebrew
brew install node

# 或下载安装包
open https://nodejs.org/
```

**Windows 用户**:
1. 访问 [nodejs.org](https://nodejs.org/)
2. 下载 Windows Installer
3. 运行安装程序

### 2. 权限问题

```bash
# macOS/Linux
sudo chown -R $(whoami) ~/.npm

# 或使用 sudo
sudo npm install
```

### 3. 网络问题

```bash
# 使用国内镜像
npm config set registry https://registry.npmmirror.com/
npm install
```

### 4. 端口被占用

```bash
# 使用其他端口
npm run dev -- -p 3001
```

## ✅ 启动成功标志

当您看到以下信息时，说明启动成功：

```
✓ Ready in 2.3s
✓ Local:    http://localhost:3000
✓ Network:  http://192.168.1.100:3000
```

## 🎯 下一步操作

1. **打开浏览器** 访问 [http://localhost:3000](http://localhost:3000)
2. **注册账号** 创建您的第一个用户
3. **创建组织** 设置您的工作空间
4. **连接社交账号** 开始发布内容

## 📚 更多帮助

- 📖 [完整安装指南](./INSTALL_GUIDE.md)
- 🚀 [快速启动指南](./QUICK_START.md)
- 🎯 [演示指南](./docs/DEMO_GUIDE.md)
- 🗄️ [数据库设置](./docs/SUPABASE_SETUP.md)

## 🆘 获取支持

如果您仍然遇到问题：

1. 查看错误信息并搜索解决方案
2. 查看项目文档和 FAQ
3. 提交 Issue 或联系技术支持

---

**准备好了吗？让我们开始吧！** 🎉

```bash
# 运行这个命令开始
./setup.sh
```
