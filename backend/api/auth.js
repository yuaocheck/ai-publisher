// 认证 API
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { DatabaseHelper } = require('../config/database');
const { generateToken, authenticateUser } = require('../middleware/auth');

const db = new DatabaseHelper();

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { email, username, password, full_name } = req.body;

        // 验证必需字段
        if (!email || !username || !password) {
            return res.status(400).json({
                success: false,
                message: '邮箱、用户名和密码为必填项'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '邮箱格式不正确'
            });
        }

        // 验证密码强度
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码长度至少为 6 位'
            });
        }

        // 检查邮箱是否已存在
        const { data: existingEmailUser } = await db.admin
            .from('ai_publisher_users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingEmailUser) {
            return res.status(409).json({
                success: false,
                message: '该邮箱已被注册'
            });
        }

        // 检查用户名是否已存在
        const { data: existingUsernameUser } = await db.admin
            .from('ai_publisher_users')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUsernameUser) {
            return res.status(409).json({
                success: false,
                message: '该用户名已被使用'
            });
        }

        // 加密密码
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 创建用户
        const userData = {
            email,
            username,
            password_hash: hashedPassword,
            full_name: full_name || username,
            subscription_plan: 'free',
            api_usage_count: 0,
            api_usage_limit: 1000
        };

        const { data: newUser, error: createError } = await db.admin
            .from('ai_publisher_users')
            .insert(userData)
            .select('id, email, username, full_name, subscription_plan, created_at')
            .single();

        if (createError) throw createError;

        // 创建用户设置
        await db.admin
            .from('user_settings')
            .insert({ user_id: newUser.id });

        // 生成 JWT Token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: newUser,
                token
            }
        });

    } catch (error) {
        console.error('用户注册失败:', error);
        res.status(500).json({
            success: false,
            message: '注册失败',
            error: error.message
        });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证必需字段
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '邮箱和密码为必填项'
            });
        }

        // 查找用户
        const { data: user, error: userError } = await db.admin
            .from('ai_publisher_users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 更新最后登录时间
        await db.admin
            .from('ai_publisher_users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);

        // 生成 JWT Token
        const token = generateToken(user);

        // 返回用户信息（不包含密码）
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: userWithoutPassword,
                token
            }
        });

    } catch (error) {
        console.error('用户登录失败:', error);
        res.status(500).json({
            success: false,
            message: '登录失败',
            error: error.message
        });
    }
});

// 刷新 Token
router.post('/refresh', authenticateUser, async (req, res) => {
    try {
        const user = req.user;

        // 生成新的 Token
        const newToken = generateToken(user);

        res.json({
            success: true,
            message: 'Token 刷新成功',
            data: {
                token: newToken
            }
        });

    } catch (error) {
        console.error('Token 刷新失败:', error);
        res.status(500).json({
            success: false,
            message: 'Token 刷新失败',
            error: error.message
        });
    }
});

// 验证 Token
router.get('/verify', authenticateUser, async (req, res) => {
    try {
        const user = req.user;

        // 返回用户信息（不包含敏感数据）
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Token 有效',
            data: {
                user: userWithoutPassword
            }
        });

    } catch (error) {
        console.error('Token 验证失败:', error);
        res.status(500).json({
            success: false,
            message: 'Token 验证失败',
            error: error.message
        });
    }
});

// 修改密码
router.post('/change-password', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;

        // 验证必需字段
        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: '当前密码和新密码为必填项'
            });
        }

        // 验证新密码强度
        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度至少为 6 位'
            });
        }

        // 获取用户当前密码
        const { data: user, error: userError } = await db.admin
            .from('ai_publisher_users')
            .select('password_hash')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证当前密码
        const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '当前密码错误'
            });
        }

        // 加密新密码
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

        // 更新密码
        const { error: updateError } = await db.admin
            .from('ai_publisher_users')
            .update({ 
                password_hash: hashedNewPassword,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: '密码修改成功'
        });

    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({
            success: false,
            message: '修改密码失败',
            error: error.message
        });
    }
});

// 忘记密码（发送重置邮件）
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: '邮箱为必填项'
            });
        }

        // 查找用户
        const { data: user, error: userError } = await db.admin
            .from('ai_publisher_users')
            .select('id, email, username')
            .eq('email', email)
            .single();

        // 无论用户是否存在，都返回成功消息（安全考虑）
        if (userError || !user) {
            return res.json({
                success: true,
                message: '如果该邮箱已注册，您将收到密码重置邮件'
            });
        }

        // 生成重置令牌（这里简化处理，实际应该生成随机令牌并设置过期时间）
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1小时后过期

        // 保存重置令牌
        await db.admin
            .from('ai_publisher_users')
            .update({
                reset_token: resetToken,
                reset_token_expires: resetExpires.toISOString()
            })
            .eq('id', user.id);

        // 这里应该发送邮件，暂时只返回成功消息
        // await sendPasswordResetEmail(user.email, resetToken);

        res.json({
            success: true,
            message: '密码重置邮件已发送',
            // 开发环境下返回重置令牌（生产环境应该删除）
            ...(process.env.NODE_ENV === 'development' && { reset_token: resetToken })
        });

    } catch (error) {
        console.error('发送密码重置邮件失败:', error);
        res.status(500).json({
            success: false,
            message: '发送密码重置邮件失败',
            error: error.message
        });
    }
});

// 重置密码
router.post('/reset-password', async (req, res) => {
    try {
        const { reset_token, new_password } = req.body;

        if (!reset_token || !new_password) {
            return res.status(400).json({
                success: false,
                message: '重置令牌和新密码为必填项'
            });
        }

        // 验证新密码强度
        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度至少为 6 位'
            });
        }

        // 查找有效的重置令牌
        const { data: user, error: userError } = await db.admin
            .from('ai_publisher_users')
            .select('id, reset_token, reset_token_expires')
            .eq('reset_token', reset_token)
            .single();

        if (userError || !user) {
            return res.status(400).json({
                success: false,
                message: '无效的重置令牌'
            });
        }

        // 检查令牌是否过期
        if (new Date() > new Date(user.reset_token_expires)) {
            return res.status(400).json({
                success: false,
                message: '重置令牌已过期'
            });
        }

        // 加密新密码
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

        // 更新密码并清除重置令牌
        const { error: updateError } = await db.admin
            .from('ai_publisher_users')
            .update({
                password_hash: hashedNewPassword,
                reset_token: null,
                reset_token_expires: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: '密码重置成功'
        });

    } catch (error) {
        console.error('重置密码失败:', error);
        res.status(500).json({
            success: false,
            message: '重置密码失败',
            error: error.message
        });
    }
});

module.exports = router;
