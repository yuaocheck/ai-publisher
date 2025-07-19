# 🚀 AI Publisher 快速启动指南

## 一键启动（推荐）

### macOS/Linux 用户
```bash
# 运行自动安装脚本
./setup.sh
```

### Windows 用户
```cmd
# 运行自动安装脚本
setup.bat
```

## 手动启动

如果自动脚本无法运行，请按照以下步骤手动启动：

### 1. 检查环境要求

确保您的系统已安装：
- **Node.js 18.0+** - [下载地址](https://nodejs.org/)
- **npm** 或 **yarn** - 通常随 Node.js 一起安装
- **Git** - [下载地址](https://git-scm.com/)

验证安装：
```bash
node --version    # 应显示 v18.0.0 或更高
npm --version     # 应显示版本号
git --version     # 应显示版本号
```

### 2. 安装项目依赖

```bash
# 使用 npm
npm install

# 或使用 yarn（如果已安装）
yarn install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑配置文件（使用您喜欢的编辑器）
nano .env.local
# 或
code .env.local
```

**最小配置（仅演示）**：
```env
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth 配置（必需）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here
```

### 4. 启动开发服务器

```bash
# 使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

### 5. 访问应用

打开浏览器访问：[http://localhost:3000](http://localhost:3000)

## 🔧 故障排除

### 常见问题

#### 1. Node.js 版本过低
```bash
# 错误信息：Node.js version 16.x.x is not supported
# 解决方案：升级到 Node.js 18+

# 使用 nvm 升级（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### 2. 端口 3000 被占用
```bash
# 错误信息：Port 3000 is already in use
# 解决方案：终止占用进程或使用其他端口

# 查找占用进程
lsof -ti:3000

# 终止进程
kill -9 $(lsof -ti:3000)

# 或使用其他端口
npm run dev -- -p 3001
```

#### 3. 依赖安装失败
```bash
# 清理缓存并重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 4. 环境变量问题
```bash
# 检查 .env.local 文件是否存在
ls -la .env.local

# 检查文件内容
cat .env.local

# 确保没有多余的空格或特殊字符
```

### 网络问题

如果遇到网络连接问题：

```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com/

# 或使用 yarn 的国内镜像
yarn config set registry https://registry.npmmirror.com/
```

## 📱 快速演示

启动成功后，您可以：

1. **注册账号** - 访问 `/auth/register`
2. **创建组织** - 完成用户引导流程
3. **连接社交账号** - 访问 `/dashboard/accounts`
4. **查看仪表板** - 访问 `/dashboard`

## 🔗 有用的链接

- **项目文档**: [README.md](./README.md)
- **Supabase 设置**: [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)
- **演示指南**: [docs/DEMO_GUIDE.md](./docs/DEMO_GUIDE.md)
- **部署指南**: [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)

## 🆘 获取帮助

如果遇到问题：

1. 查看控制台错误信息
2. 检查 [故障排除](#故障排除) 部分
3. 查看项目文档
4. 提交 Issue 或联系技术支持

## 🎯 下一步

项目启动后，建议您：

1. **配置 Supabase** - 设置数据库和认证
2. **获取 API 密钥** - 配置社交平台集成
3. **探索功能** - 熟悉系统各个模块
4. **自定义配置** - 根据需求调整设置

---

**祝您使用愉快！** 🎉

如果这个快速启动指南对您有帮助，请给项目一个 ⭐️！
