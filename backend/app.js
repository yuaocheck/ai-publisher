// AI Publisher 后端应用
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// 导入中间件
const {
    rateLimits,
    errorHandler,
    requestLogger,
    corsHandler
} = require('./middleware/auth');

// 导入 API 路由
const usersRouter = require('./api/users');
const aiGenerationRouter = require('./api/ai-generation');
const contentRouter = require('./api/content');
const socialAccountsRouter = require('./api/social-accounts');
const analyticsRouter = require('./api/analytics');

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(helmet()); // 安全头
app.use(compression()); // 响应压缩
app.use(corsHandler); // CORS 处理
app.use(express.json({ limit: '10mb' })); // JSON 解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL 编码解析
app.use(requestLogger); // 请求日志

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'AI Publisher API 服务正常运行',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API 根路径
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: '欢迎使用 AI Publisher API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            ai_generation: '/api/ai-generation',
            content: '/api/content',
            social_accounts: '/api/social-accounts',
            analytics: '/api/analytics'
        },
        documentation: 'https://docs.aipublisher.com'
    });
});

// API 路由（应用速率限制）
app.use('/api/users', rateLimits.general, usersRouter);
app.use('/api/ai-generation', rateLimits.aiGeneration, aiGenerationRouter);
app.use('/api/content', rateLimits.general, contentRouter);
app.use('/api/social-accounts', rateLimits.general, socialAccountsRouter);
app.use('/api/analytics', rateLimits.general, analyticsRouter);

// 认证相关路由（特殊速率限制）
app.use('/api/auth', rateLimits.auth, require('./api/auth'));

// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在',
        path: req.originalUrl
    });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 AI Publisher API 服务器启动成功`);
        console.log(`📡 端口: ${PORT}`);
        console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📚 API 文档: http://localhost:${PORT}/api`);
        console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
    });
}

module.exports = app;
