# 🤖 AI Publisher 后端 API

AI Publisher 的后端 API 服务，提供完整的内容生成、发布管理和数据分析功能。

## 🚀 功能特性

### 核心功能
- **🤖 AI 内容生成**: 集成 Google Gemini AI，支持多种内容类型和风格
- **📱 多平台发布**: 支持 Twitter、Facebook、Instagram、LinkedIn 等主流平台
- **📊 数据分析**: 详细的发布统计和互动数据分析
- **⏰ 定时发布**: 支持内容定时发布和循环发布
- **👥 用户管理**: 完整的用户认证、授权和订阅管理

### 技术特性
- **🔐 安全认证**: JWT 令牌认证，密码加密存储
- **🚦 速率限制**: 多级别的 API 速率限制
- **📈 可扩展**: 模块化设计，易于扩展新功能
- **🗄️ 数据库**: 基于 Supabase PostgreSQL 的完整数据模型
- **📝 日志记录**: 详细的操作日志和错误追踪

## 📋 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Supabase 账号
- Google Gemini API Key

## 🛠️ 安装和配置

### 1. 克隆项目
```bash
git clone https://github.com/ai-publisher/backend.git
cd backend
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑环境变量
nano .env
```

### 4. 数据库迁移
```bash
# 运行数据库迁移
npm run db:migrate

# 可选：插入示例数据
npm run db:seed
```

### 5. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 🔧 环境变量配置

### 必需配置
```env
# 应用基础配置
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key

# Supabase 配置
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

### 可选配置
```env
# 社交媒体 API
TWITTER_API_KEY=your-twitter-api-key
FACEBOOK_APP_ID=your-facebook-app-id
LINKEDIN_CLIENT_ID=your-linkedin-client-id

# 邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
```

## 📚 API 文档

### 认证端点
```
POST /api/auth/register     # 用户注册
POST /api/auth/login        # 用户登录
POST /api/auth/refresh      # 刷新令牌
GET  /api/auth/verify       # 验证令牌
```

### 用户管理
```
GET  /api/users/profile     # 获取用户信息
PUT  /api/users/profile     # 更新用户信息
GET  /api/users/settings    # 获取用户设置
PUT  /api/users/settings    # 更新用户设置
GET  /api/users/stats       # 获取用户统计
```

### AI 内容生成
```
POST /api/ai-generation/generate     # 生成内容
POST /api/ai-generation/optimize     # 优化内容
POST /api/ai-generation/variations   # 生成变体
GET  /api/ai-generation/history      # 生成历史
```

### 内容管理
```
GET    /api/content           # 获取内容列表
POST   /api/content           # 创建内容
GET    /api/content/:id       # 获取内容详情
PUT    /api/content/:id       # 更新内容
DELETE /api/content/:id       # 删除内容
POST   /api/content/:id/publish  # 发布内容
```

### 社交账号
```
GET    /api/social-accounts           # 获取账号列表
POST   /api/social-accounts           # 添加账号
GET    /api/social-accounts/:id       # 获取账号详情
PUT    /api/social-accounts/:id       # 更新账号
DELETE /api/social-accounts/:id       # 删除账号
POST   /api/social-accounts/:id/test  # 测试连接
```

### 数据分析
```
GET /api/analytics/overview           # 总体分析
GET /api/analytics/platform-comparison  # 平台对比
GET /api/analytics/top-content        # 热门内容
GET /api/analytics/posting-times      # 发布时间分析
```

## 🗄️ 数据库架构

### 核心表结构
- **ai_publisher_users**: 用户信息
- **social_accounts**: 社交媒体账号
- **content_posts**: 内容发布
- **platform_posts**: 平台发布记录
- **ai_generation_history**: AI 生成历史
- **user_settings**: 用户设置
- **analytics_data**: 分析数据
- **scheduled_tasks**: 定时任务

### 视图
- **user_overview**: 用户概览统计
- **content_posts_detail**: 内容发布详情
- **platform_stats**: 平台统计
- **ai_generation_stats**: AI 生成统计

## 🔐 安全特性

### 认证和授权
- JWT 令牌认证
- 密码 bcrypt 加密
- 角色基础的访问控制
- API 使用限制检查

### 安全中间件
- Helmet 安全头
- CORS 跨域保护
- 速率限制
- 请求大小限制

### 数据保护
- 敏感数据加密存储
- SQL 注入防护
- XSS 攻击防护
- 输入验证和清理

## 📊 监控和日志

### 日志记录
- 请求/响应日志
- 错误日志
- 性能监控
- 用户行为追踪

### 健康检查
```bash
# 检查服务状态
curl http://localhost:3000/health

# 检查 API 可用性
curl http://localhost:3000/api
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监视模式运行测试
npm run test:watch

# 代码质量检查
npm run lint
npm run lint:fix
```

## 📦 部署

### Docker 部署
```bash
# 构建镜像
docker build -t ai-publisher-backend .

# 运行容器
docker run -p 3000:3000 --env-file .env ai-publisher-backend
```

### 云平台部署
支持部署到：
- Vercel
- Heroku
- AWS Lambda
- Google Cloud Run
- Railway

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

- 📧 邮箱: support@aipublisher.com
- 💬 Discord: [AI Publisher Community](https://discord.gg/aipublisher)
- 📖 文档: [docs.aipublisher.com](https://docs.aipublisher.com)
- 🐛 问题反馈: [GitHub Issues](https://github.com/ai-publisher/backend/issues)

## 🙏 致谢

感谢以下开源项目：
- [Express.js](https://expressjs.com/)
- [Supabase](https://supabase.com/)
- [Google Generative AI](https://ai.google.dev/)
- [JWT](https://jwt.io/)

---

**AI Publisher** - 让内容创作更智能 🚀
