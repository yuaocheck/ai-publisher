# AI Publisher 演示调试指南

本指南将帮助您快速设置和演示 AI Publisher 系统的核心功能。

## 🚀 快速启动

### 1. 环境准备

确保您已安装以下软件：
- Node.js 18+ 
- npm 或 yarn
- Git

### 2. 项目设置

```bash
# 克隆项目
git clone <your-repo-url>
cd ai-publisher

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env.local
```

### 3. 配置环境变量

编辑 `.env.local` 文件：

```env
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI 配置（可选，用于 AI 功能）
OPENAI_API_KEY=your_openai_api_key

# 社交平台 API 密钥（演示时可选配置）
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### 4. 数据库设置

参考 [Supabase 设置指南](./SUPABASE_SETUP.md) 完成数据库配置。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🎯 演示流程

### 阶段 1：用户认证与组织管理

1. **用户注册**
   - 访问 `/auth/register`
   - 填写用户信息并注册
   - 验证邮箱（如果启用）

2. **组织创建**
   - 首次登录会跳转到 `/onboarding`
   - 创建您的第一个组织
   - 设置组织名称和标识符

3. **仪表板概览**
   - 查看控制台首页
   - 了解基本统计信息
   - 探索快速操作

### 阶段 2：社交账号集成

1. **访问账号管理**
   - 导航到 `/dashboard/accounts`
   - 查看支持的平台列表

2. **连接 Twitter 账号**（推荐先演示）
   ```bash
   # 设置 Twitter API 密钥
   TWITTER_CLIENT_ID=your_client_id
   TWITTER_CLIENT_SECRET=your_client_secret
   ```
   - 点击"连接 Twitter"
   - 完成 OAuth 授权流程
   - 验证账号连接状态

3. **连接 Facebook 账号**
   ```bash
   # 设置 Facebook API 密钥
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   ```
   - 点击"连接 Facebook"
   - 完成授权并选择页面
   - 确认连接成功

### 阶段 3：内容创建与发布

1. **创建内容**
   - 访问 `/dashboard/posts/new`
   - 输入文本内容
   - 上传媒体文件（可选）
   - 选择目标平台

2. **内容预览**
   - 查看不同平台的内容预览
   - 验证字符限制和格式适配
   - 检查媒体文件处理

3. **立即发布**
   - 点击"立即发布"
   - 监控发布状态
   - 查看发布结果

4. **定时发布**
   - 设置发布时间
   - 保存为计划任务
   - 在日历中查看计划

### 阶段 4：数据分析与监控

1. **查看发布历史**
   - 访问 `/dashboard/posts`
   - 查看所有内容列表
   - 筛选不同状态的内容

2. **分析数据**
   - 访问 `/dashboard/analytics`
   - 查看互动数据
   - 分析平台表现

3. **任务监控**
   - 查看发布任务状态
   - 处理失败的任务
   - 重试发布

## 🔧 调试功能

### 1. API 测试

使用内置的 API 测试工具：

```bash
# 测试平台连接
curl -X GET "http://localhost:3000/api/platforms" \
  -H "Authorization: Bearer your_api_key"

# 创建内容
curl -X POST "http://localhost:3000/api/v1/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{
    "title": "测试内容",
    "content": "这是一条测试消息",
    "platforms": ["twitter", "facebook"]
  }'
```

### 2. 数据库查询

在 Supabase Dashboard 中执行查询：

```sql
-- 查看组织信息
SELECT * FROM organizations;

-- 查看连接的账号
SELECT * FROM accounts WHERE is_active = true;

-- 查看发布任务
SELECT * FROM tasks ORDER BY created_at DESC LIMIT 10;

-- 查看内容统计
SELECT 
  platform,
  COUNT(*) as total_posts,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_posts
FROM tasks 
GROUP BY platform;
```

### 3. 日志监控

查看应用日志：

```bash
# 开发环境日志
npm run dev

# 查看 Supabase 日志
# 在 Supabase Dashboard > Logs 中查看

# 查看 Vercel 日志（如果部署到 Vercel）
vercel logs
```

## 🎨 演示场景

### 场景 1：营销团队日常发布

1. **角色**：内容编辑
2. **任务**：发布产品更新到多个平台
3. **流程**：
   - 创建包含产品图片的内容
   - 为不同平台定制文案
   - 设置最佳发布时间
   - 监控发布结果

### 场景 2：社交媒体经理

1. **角色**：社交媒体经理
2. **任务**：管理多个品牌账号
3. **流程**：
   - 切换不同组织
   - 批量发布内容
   - 分析各平台表现
   - 优化发布策略

### 场景 3：API 集成开发者

1. **角色**：开发者
2. **任务**：集成第三方系统
3. **流程**：
   - 生成 API 密钥
   - 测试 API 接口
   - 实现自动化发布
   - 处理 Webhook 事件

## 🚨 常见问题

### 1. OAuth 授权失败

**问题**：点击连接平台后出现授权错误

**解决方案**：
- 检查 API 密钥是否正确
- 确认回调 URL 配置
- 验证平台应用设置

### 2. 发布失败

**问题**：内容发布到平台失败

**解决方案**：
- 检查账号 Token 是否过期
- 验证内容是否符合平台规范
- 查看错误日志获取详细信息

### 3. 数据库连接问题

**问题**：无法连接到 Supabase

**解决方案**：
- 检查环境变量配置
- 确认 Supabase 项目状态
- 验证网络连接

### 4. 权限错误

**问题**：用户无法执行某些操作

**解决方案**：
- 检查用户在组织中的角色
- 确认 RLS 策略配置
- 验证 API 密钥权限

## 📊 性能监控

### 关键指标

1. **发布成功率**：> 99%
2. **API 响应时间**：< 200ms
3. **Token 刷新成功率**：> 95%
4. **用户活跃度**：DAU/MAU

### 监控工具

- Supabase Dashboard：数据库性能
- Vercel Analytics：应用性能
- 自定义监控：业务指标

## 🔄 持续改进

### 反馈收集

1. **用户反馈**
   - 应用内反馈表单
   - 用户访谈
   - 使用数据分析

2. **技术指标**
   - 错误率监控
   - 性能指标跟踪
   - 用户行为分析

### 功能迭代

1. **短期目标**（1-2周）
   - 修复关键 Bug
   - 优化用户体验
   - 完善文档

2. **中期目标**（1-2月）
   - 新增平台支持
   - AI 功能增强
   - 高级分析功能

3. **长期目标**（3-6月）
   - 移动端应用
   - 企业级功能
   - 国际化支持

---

## 📞 技术支持

如果在演示过程中遇到问题，请：

1. 查看控制台错误信息
2. 检查网络连接和配置
3. 参考文档和 FAQ
4. 联系技术支持团队

**祝您演示成功！** 🎉
