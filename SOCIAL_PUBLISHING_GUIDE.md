# 🚀 多平台社交发布功能指南

## 🌟 功能概览

AI Publisher 现在支持真实的多平台社交媒体发布功能，可以连接实际的社交平台 API 并发布内容。

### ✅ 支持的平台

| 平台 | 字符限制 | 媒体支持 | API 状态 |
|------|----------|----------|----------|
| **Twitter/X** | 280字符 | 图片、视频 | ✅ 完全集成 |
| **Facebook** | 63,206字符 | 图片、视频、链接 | ✅ 完全集成 |
| **Instagram** | 2,200字符 | 图片、视频 | ✅ 完全集成 |
| **LinkedIn** | 3,000字符 | 图片、文档 | ✅ 完全集成 |
| **YouTube** | 5,000字符 | 视频 | ✅ 完全集成 |
| **TikTok** | 150字符 | 视频 | ✅ 完全集成 |

### 🎯 核心功能

#### ✅ 平台连接管理
- **OAuth 2.0 授权** - 安全的官方授权流程
- **令牌管理** - 自动刷新和存储访问令牌
- **连接状态监控** - 实时显示连接状态
- **批量连接** - 一次性连接多个平台

#### ✅ 内容发布
- **一键多平台发布** - 同时发布到多个平台
- **智能内容适配** - 根据平台限制自动调整内容
- **媒体文件上传** - 支持图片和视频上传
- **定时发布** - 支持预定时间发布

#### ✅ 发布管理
- **发布历史** - 完整的发布记录
- **状态跟踪** - 实时发布状态监控
- **错误处理** - 智能错误恢复和重试
- **批量操作** - 批量管理发布内容

## 🔧 技术架构

### 前端架构
```
social-publisher.html
├── Alpine.js (响应式数据绑定)
├── Tailwind CSS (现代化样式)
├── OAuth 流程管理
├── 文件上传处理
└── 发布状态监控
```

### 后端架构
```
backend/social-api.js
├── Express.js 服务器
├── OAuth 令牌交换
├── 多平台 API 集成
├── 媒体文件处理
└── 错误处理和日志
```

### API 端点
```
POST /api/oauth/token          - OAuth 令牌交换
POST /api/publish/:platform    - 单平台发布
POST /api/publish/batch        - 批量发布
GET  /api/user/:platform       - 获取用户信息
```

## 🚀 使用指南

### 步骤 1：启动后端服务

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动社交 API 服务
npm run social:dev
```

### 步骤 2：配置平台应用

#### Twitter/X 配置
1. 访问 [Twitter Developer Portal](https://developer.twitter.com/)
2. 创建新应用
3. 获取 Client ID 和 Client Secret
4. 设置回调 URL: `http://localhost:3000/oauth-callback.html`

#### Facebook 配置
1. 访问 [Facebook Developers](https://developers.facebook.com/)
2. 创建新应用
3. 添加 Facebook Login 产品
4. 获取 App ID 和 App Secret
5. 设置有效的 OAuth 重定向 URI

#### Instagram 配置
1. 使用 Facebook 开发者账号
2. 添加 Instagram Basic Display 产品
3. 配置 Instagram 应用设置
4. 获取客户端 ID 和密钥

#### LinkedIn 配置
1. 访问 [LinkedIn Developers](https://www.linkedin.com/developers/)
2. 创建新应用
3. 添加 Sign In with LinkedIn 产品
4. 获取 Client ID 和 Client Secret

#### YouTube 配置
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 YouTube Data API v3
4. 创建 OAuth 2.0 客户端 ID

#### TikTok 配置
1. 访问 [TikTok Developers](https://developers.tiktok.com/)
2. 创建新应用
3. 获取 Client Key 和 Client Secret
4. 配置回调 URL

### 步骤 3：设置环境变量

创建 `backend/.env` 文件：

```env
# Twitter/X
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# YouTube
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# 服务器配置
PORT=3001
NODE_ENV=development
```

### 步骤 4：连接社交平台

1. 打开社交发布器页面
2. 点击要连接的平台的"连接账号"按钮
3. 在弹出的授权窗口中登录并授权
4. 授权成功后平台状态会显示为已连接

### 步骤 5：发布内容

1. 在内容文本框中输入要发布的内容
2. （可选）上传图片或视频文件
3. 选择要发布的平台
4. 选择发布时间（立即或定时）
5. 点击"发布"按钮

## 🔐 OAuth 授权流程

### 授权流程图
```
用户点击连接 → 打开授权窗口 → 用户登录授权 → 获取授权码 → 交换访问令牌 → 保存令牌 → 连接成功
```

### 安全措施
- **PKCE (Proof Key for Code Exchange)** - 防止授权码拦截
- **State 参数** - 防止 CSRF 攻击
- **令牌加密存储** - 安全存储访问令牌
- **自动令牌刷新** - 保持连接有效性

## 📱 平台特定功能

### Twitter/X
```javascript
// 发布推文
{
  "text": "内容文本",
  "media": {
    "media_ids": ["media_id_1", "media_id_2"]
  }
}
```

### Facebook
```javascript
// 发布帖子
{
  "message": "内容文本",
  "link": "链接URL",
  "published": true
}
```

### Instagram
```javascript
// 发布图片
{
  "image_url": "图片URL",
  "caption": "图片说明",
  "media_type": "IMAGE"
}
```

### LinkedIn
```javascript
// 发布动态
{
  "author": "urn:li:person:PERSON_ID",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "内容文本"
      }
    }
  }
}
```

### YouTube
```javascript
// 上传视频
{
  "snippet": {
    "title": "视频标题",
    "description": "视频描述",
    "tags": ["标签1", "标签2"]
  },
  "status": {
    "privacyStatus": "public"
  }
}
```

### TikTok
```javascript
// 发布视频
{
  "video": {
    "video_url": "视频URL"
  },
  "post_info": {
    "title": "视频标题",
    "privacy_level": "PUBLIC_TO_EVERYONE"
  }
}
```

## 🛠️ 高级功能

### 批量发布
```javascript
// 同时发布到多个平台
const publishData = {
  platforms: ['twitter', 'facebook', 'linkedin'],
  content: '要发布的内容',
  media: [/* 媒体文件 */],
  tokens: {
    twitter: 'twitter_access_token',
    facebook: 'facebook_access_token',
    linkedin: 'linkedin_access_token'
  }
};
```

### 定时发布
```javascript
// 设置定时发布
const scheduleData = {
  content: '定时发布的内容',
  platforms: ['twitter', 'facebook'],
  scheduledTime: '2024-01-01T12:00:00Z'
};
```

### 内容适配
```javascript
// 根据平台自动调整内容长度
function adaptContent(content, platform) {
  const limits = {
    twitter: 280,
    facebook: 63206,
    instagram: 2200,
    linkedin: 3000,
    youtube: 5000,
    tiktok: 150
  };
  
  return content.substring(0, limits[platform]);
}
```

## 📊 监控和分析

### 发布状态监控
- **实时状态** - 发布过程实时反馈
- **成功率统计** - 各平台发布成功率
- **错误日志** - 详细的错误信息记录
- **性能指标** - API 响应时间监控

### 发布历史
- **完整记录** - 所有发布活动记录
- **状态跟踪** - 发布状态变化历史
- **内容备份** - 发布内容自动备份
- **链接追踪** - 发布后的内容链接

## 🔧 故障排除

### 常见问题

#### 1. 授权失败
**症状**: 点击连接后授权窗口报错
**解决方案**:
- 检查应用配置是否正确
- 确认回调 URL 设置正确
- 验证 Client ID 和 Secret

#### 2. 发布失败
**症状**: 内容发布时返回错误
**解决方案**:
- 检查访问令牌是否有效
- 确认内容符合平台规范
- 验证媒体文件格式和大小

#### 3. 令牌过期
**症状**: 之前连接的平台突然无法发布
**解决方案**:
- 重新授权连接平台
- 检查令牌刷新机制
- 更新应用权限设置

### 调试工具
```javascript
// 启用调试模式
localStorage.setItem('debug_mode', 'true');

// 查看详细日志
console.log('Platform connections:', platforms);
console.log('Publish history:', publishHistory);
```

## 🚀 部署指南

### 生产环境部署

#### 1. 环境准备
```bash
# 安装 PM2 进程管理器
npm install -g pm2

# 创建生产环境配置
cp .env.example .env.production
```

#### 2. 启动服务
```bash
# 使用 PM2 启动
pm2 start social-api.js --name "social-api"

# 设置开机自启
pm2 startup
pm2 save
```

#### 3. 反向代理配置 (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎉 立即开始

现在您可以：

1. **启动后端服务** - `npm run social:dev`
2. **打开发布器页面** - 访问 `social-publisher.html`
3. **连接社交平台** - 使用 OAuth 授权
4. **开始发布内容** - 一键多平台发布

**开始您的多平台社交媒体发布之旅！** 🚀
