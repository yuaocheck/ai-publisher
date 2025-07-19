// 认证中间件
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');

// JWT 密钥（应该从环境变量获取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// 生成 JWT Token
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            username: user.username,
            subscription_plan: user.subscription_plan
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// 验证 JWT Token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('无效的令牌');
    }
}

// 认证中间件
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '缺少认证令牌'
            });
        }

        const token = authHeader.substring(7); // 移除 "Bearer " 前缀
        const decoded = verifyToken(token);

        // 从数据库获取最新的用户信息
        const { data: user, error } = await supabaseAdmin
            .from('ai_publisher_users')
            .select('*')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 将用户信息添加到请求对象
        req.user = user;
        next();

    } catch (error) {
        console.error('认证失败:', error);
        return res.status(401).json({
            success: false,
            message: '认证失败',
            error: error.message
        });
    }
}

// 授权中间件（检查用户角色）
function authorizeUser(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证的用户'
            });
        }

        // 如果没有指定角色要求，则允许所有认证用户
        if (allowedRoles.length === 0) {
            return next();
        }

        // 检查用户订阅计划是否在允许的角色中
        if (!allowedRoles.includes(req.user.subscription_plan)) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        next();
    };
}

// 检查 API 使用限制中间件
async function checkApiUsage(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证的用户'
            });
        }

        const user = req.user;

        // 检查是否超出使用限制
        if (user.api_usage_count >= user.api_usage_limit) {
            return res.status(429).json({
                success: false,
                message: 'API 使用次数已达上限',
                data: {
                    current_usage: user.api_usage_count,
                    usage_limit: user.api_usage_limit,
                    subscription_plan: user.subscription_plan
                }
            });
        }

        next();

    } catch (error) {
        console.error('检查 API 使用限制失败:', error);
        return res.status(500).json({
            success: false,
            message: '检查 API 使用限制失败',
            error: error.message
        });
    }
}

// 速率限制中间件
const rateLimit = require('express-rate-limit');

// 创建不同级别的速率限制
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: {
            success: false,
            message: message
        },
        standardHeaders: true,
        legacyHeaders: false,
        // 根据用户 ID 进行限制（如果已认证）
        keyGenerator: (req) => {
            return req.user ? req.user.id : req.ip;
        }
    });
};

// 不同的速率限制配置
const rateLimits = {
    // 一般 API 限制：每分钟 60 次请求
    general: createRateLimit(
        60 * 1000, // 1 分钟
        60,
        '请求过于频繁，请稍后再试'
    ),
    
    // AI 生成限制：每分钟 10 次请求
    aiGeneration: createRateLimit(
        60 * 1000, // 1 分钟
        10,
        'AI 生成请求过于频繁，请稍后再试'
    ),
    
    // 登录限制：每 15 分钟 5 次尝试
    auth: createRateLimit(
        15 * 60 * 1000, // 15 分钟
        5,
        '登录尝试过于频繁，请稍后再试'
    ),
    
    // 严格限制：每小时 100 次请求
    strict: createRateLimit(
        60 * 60 * 1000, // 1 小时
        100,
        '请求次数超出限制，请稍后再试'
    )
};

// 错误处理中间件
function errorHandler(err, req, res, next) {
    console.error('API 错误:', err);

    // JWT 错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: '无效的认证令牌'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: '认证令牌已过期'
        });
    }

    // 数据库错误
    if (err.code === '23505') { // PostgreSQL 唯一约束违反
        return res.status(409).json({
            success: false,
            message: '数据已存在'
        });
    }

    if (err.code === '23503') { // PostgreSQL 外键约束违反
        return res.status(400).json({
            success: false,
            message: '关联数据不存在'
        });
    }

    // 默认错误响应
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}

// 请求日志中间件
function requestLogger(req, res, next) {
    const start = Date.now();
    
    // 记录请求开始
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
    
    // 监听响应结束
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
}

// CORS 中间件
function corsHandler(req, res, next) {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateUser,
    authorizeUser,
    checkApiUsage,
    rateLimits,
    errorHandler,
    requestLogger,
    corsHandler
};
