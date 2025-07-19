# Supabase 设置指南

本指南将帮助您设置 Supabase 数据库，为 AI Publisher 项目做好准备。

## 📋 前置要求

- Supabase 账号（免费）
- 已安装 Supabase CLI

## 🚀 快速设置

### 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 选择组织并填写项目信息：
   - **Name**: `ai-publisher`
   - **Database Password**: 生成强密码并保存
   - **Region**: 选择离您最近的区域
4. 等待项目创建完成（约2分钟）

### 2. 获取项目配置信息

项目创建完成后，在项目设置页面获取以下信息：

1. 进入 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...`
   - **service_role secret key**: `eyJ...`

### 3. 配置环境变量

将获取的信息填入 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_ID=your-project-id
```

## 🗄️ 数据库设置

### 方法一：使用 Supabase CLI（推荐）

1. **安装 Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **登录 Supabase**
   ```bash
   supabase login
   ```

3. **链接到您的项目**
   ```bash
   supabase link --project-ref your-project-id
   ```

4. **运行数据库迁移**
   ```bash
   supabase db push
   ```

5. **运行种子数据**
   ```bash
   supabase db seed
   ```

### 方法二：手动执行 SQL

如果您无法使用 CLI，可以手动在 Supabase Dashboard 中执行 SQL：

1. 进入 **SQL Editor**
2. 按顺序执行以下文件中的 SQL：
   - `supabase/migrations/20240101000001_initial_schema.sql`
   - `supabase/migrations/20240101000002_rls_policies.sql`
   - `supabase/migrations/20240101000003_functions.sql`
   - `supabase/seed.sql`

## 🔐 认证设置

### 1. 配置认证提供商

在 **Authentication** → **Providers** 中启用以下提供商：

#### Email
- ✅ Enable email provider
- ✅ Confirm email
- ✅ Enable email confirmations

#### Google OAuth（可选）
1. 创建 [Google OAuth 应用](https://console.developers.google.com/)
2. 在 Supabase 中配置：
   - **Client ID**: 您的 Google Client ID
   - **Client Secret**: 您的 Google Client Secret

#### GitHub OAuth（可选）
1. 创建 [GitHub OAuth 应用](https://github.com/settings/applications/new)
2. 在 Supabase 中配置：
   - **Client ID**: 您的 GitHub Client ID
   - **Client Secret**: 您的 GitHub Client Secret

### 2. 配置重定向 URL

在 **Authentication** → **URL Configuration** 中添加：

```
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

## 📁 存储设置

### 1. 创建存储桶

在 **Storage** 中创建以下桶：

1. **media** - 存储用户上传的图片和视频
   - Public: ✅
   - File size limit: 50MB
   - Allowed MIME types: `image/*,video/*`

2. **avatars** - 存储用户头像
   - Public: ✅
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

### 2. 配置存储策略

为 `media` 桶添加策略：

```sql
-- 允许认证用户上传文件
CREATE POLICY "Users can upload media files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND 
    auth.role() = 'authenticated'
  );

-- 允许所有人查看文件
CREATE POLICY "Anyone can view media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own media files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 🔧 实时功能设置

### 1. 启用实时功能

在 **Database** → **Replication** 中为以下表启用实时功能：

- ✅ `posts`
- ✅ `tasks`
- ✅ `metrics`

### 2. 配置实时策略

```sql
-- 允许用户订阅自己组织的数据
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE metrics;
```

## 🧪 测试数据库连接

创建一个简单的测试脚本来验证连接：

```typescript
// test-db.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error)
    } else {
      console.log('✅ Database connection successful!')
    }
  } catch (err) {
    console.error('❌ Connection error:', err)
  }
}

testConnection()
```

运行测试：
```bash
npx tsx test-db.ts
```

## 📊 监控和维护

### 1. 监控数据库性能

在 **Reports** 中监控：
- API 请求数量
- 数据库连接数
- 存储使用量
- 认证活动

### 2. 备份策略

Supabase 自动提供：
- 每日自动备份（保留7天）
- 时间点恢复（PITR）

### 3. 扩展建议

当项目增长时，考虑：
- 升级到 Pro 计划获得更多资源
- 启用连接池
- 优化查询性能
- 设置自定义域名

## 🚨 故障排除

### 常见问题

1. **连接超时**
   - 检查网络连接
   - 验证 URL 和密钥是否正确

2. **RLS 策略错误**
   - 确保用户已认证
   - 检查策略是否正确配置

3. **存储上传失败**
   - 检查文件大小限制
   - 验证 MIME 类型
   - 确保存储策略正确

4. **实时功能不工作**
   - 检查表是否启用了复制
   - 验证 RLS 策略
   - 确保客户端正确订阅

### 获取帮助

- [Supabase 文档](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

完成以上设置后，您的 Supabase 数据库就可以与 AI Publisher 应用完美配合了！🎉
