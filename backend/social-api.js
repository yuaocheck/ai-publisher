// AI Publisher - 社交媒体 API 集成服务
// 这是一个 Node.js 后端服务，用于处理社交媒体平台的 API 调用

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 平台配置 - 实际使用时应该从环境变量获取
const PLATFORM_CONFIG = {
    twitter: {
        clientId: process.env.TWITTER_CLIENT_ID || 'your_twitter_client_id',
        clientSecret: process.env.TWITTER_CLIENT_SECRET || 'your_twitter_client_secret',
        apiBase: 'https://api.twitter.com/2',
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token'
    },
    facebook: {
        appId: process.env.FACEBOOK_APP_ID || 'your_facebook_app_id',
        appSecret: process.env.FACEBOOK_APP_SECRET || 'your_facebook_app_secret',
        apiBase: 'https://graph.facebook.com/v18.0',
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token'
    },
    instagram: {
        clientId: process.env.INSTAGRAM_CLIENT_ID || 'your_instagram_client_id',
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || 'your_instagram_client_secret',
        apiBase: 'https://graph.facebook.com/v18.0',
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token'
    },
    linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID || 'your_linkedin_client_id',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'your_linkedin_client_secret',
        apiBase: 'https://api.linkedin.com/v2',
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken'
    },
    youtube: {
        clientId: process.env.YOUTUBE_CLIENT_ID || 'your_youtube_client_id',
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || 'your_youtube_client_secret',
        apiBase: 'https://www.googleapis.com/youtube/v3',
        authUrl: 'https://accounts.google.com/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token'
    },
    tiktok: {
        clientKey: process.env.TIKTOK_CLIENT_KEY || 'your_tiktok_client_key',
        clientSecret: process.env.TIKTOK_CLIENT_SECRET || 'your_tiktok_client_secret',
        apiBase: 'https://open-api.tiktok.com',
        authUrl: 'https://www.tiktok.com/auth/authorize/',
        tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/'
    }
};

// OAuth 令牌交换
app.post('/api/oauth/token', async (req, res) => {
    try {
        const { platform, code, redirect_uri } = req.body;
        
        if (!PLATFORM_CONFIG[platform]) {
            return res.status(400).json({ error: 'Unsupported platform' });
        }
        
        const config = PLATFORM_CONFIG[platform];
        const tokenData = await exchangeCodeForToken(platform, code, redirect_uri, config);
        
        res.json(tokenData);
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 发布内容到指定平台
app.post('/api/publish/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        const { content, media, access_token } = req.body;
        
        if (!PLATFORM_CONFIG[platform]) {
            return res.status(400).json({ error: 'Unsupported platform' });
        }
        
        const result = await publishContent(platform, content, media, access_token);
        res.json(result);
    } catch (error) {
        console.error('Publish error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 批量发布到多个平台
app.post('/api/publish/batch', async (req, res) => {
    try {
        const { platforms, content, media, tokens } = req.body;
        const results = [];
        
        for (const platform of platforms) {
            try {
                const result = await publishContent(
                    platform, 
                    content, 
                    media, 
                    tokens[platform]
                );
                results.push({
                    platform,
                    success: true,
                    data: result
                });
            } catch (error) {
                results.push({
                    platform,
                    success: false,
                    error: error.message
                });
            }
        }
        
        res.json({ results });
    } catch (error) {
        console.error('Batch publish error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 获取用户信息
app.get('/api/user/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        const { access_token } = req.query;
        
        const userInfo = await getUserInfo(platform, access_token);
        res.json(userInfo);
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 令牌交换实现
async function exchangeCodeForToken(platform, code, redirectUri, config) {
    const tokenParams = {
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    };
    
    switch (platform) {
        case 'twitter':
            tokenParams.client_id = config.clientId;
            tokenParams.code_verifier = generateCodeVerifier(); // 实际应用中需要存储
            break;
            
        case 'facebook':
        case 'instagram':
            tokenParams.client_id = config.appId || config.clientId;
            tokenParams.client_secret = config.appSecret || config.clientSecret;
            break;
            
        case 'linkedin':
            tokenParams.client_id = config.clientId;
            tokenParams.client_secret = config.clientSecret;
            break;
            
        case 'youtube':
            tokenParams.client_id = config.clientId;
            tokenParams.client_secret = config.clientSecret;
            break;
            
        case 'tiktok':
            tokenParams.client_key = config.clientKey;
            tokenParams.client_secret = config.clientSecret;
            break;
    }
    
    const response = await axios.post(config.tokenUrl, tokenParams, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    
    return response.data;
}

// 发布内容实现
async function publishContent(platform, content, media, accessToken) {
    const config = PLATFORM_CONFIG[platform];
    
    switch (platform) {
        case 'twitter':
            return await publishToTwitter(content, media, accessToken, config);
        case 'facebook':
            return await publishToFacebook(content, media, accessToken, config);
        case 'instagram':
            return await publishToInstagram(content, media, accessToken, config);
        case 'linkedin':
            return await publishToLinkedIn(content, media, accessToken, config);
        case 'youtube':
            return await publishToYouTube(content, media, accessToken, config);
        case 'tiktok':
            return await publishToTikTok(content, media, accessToken, config);
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}

// Twitter 发布
async function publishToTwitter(content, media, accessToken, config) {
    const tweetData = {
        text: content.substring(0, 280)
    };
    
    if (media && media.length > 0) {
        // 首先上传媒体文件
        const mediaIds = await uploadMediaToTwitter(media, accessToken, config);
        tweetData.media = { media_ids: mediaIds };
    }
    
    const response = await axios.post(`${config.apiBase}/tweets`, tweetData, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    return {
        id: response.data.data.id,
        url: `https://twitter.com/user/status/${response.data.data.id}`
    };
}

// Facebook 发布
async function publishToFacebook(content, media, accessToken, config) {
    const postData = {
        message: content,
        access_token: accessToken
    };
    
    if (media && media.length > 0) {
        postData.link = media[0].url;
    }
    
    const response = await axios.post(`${config.apiBase}/me/feed`, postData);
    
    return {
        id: response.data.id,
        url: `https://facebook.com/${response.data.id}`
    };
}

// Instagram 发布
async function publishToInstagram(content, media, accessToken, config) {
    if (!media || media.length === 0) {
        throw new Error('Instagram requires at least one image');
    }
    
    // 创建媒体容器
    const containerData = {
        image_url: media[0].url,
        caption: content.substring(0, 2200),
        access_token: accessToken
    };
    
    const containerResponse = await axios.post(
        `${config.apiBase}/me/media`, 
        containerData
    );
    
    // 发布媒体
    const publishData = {
        creation_id: containerResponse.data.id,
        access_token: accessToken
    };
    
    const publishResponse = await axios.post(
        `${config.apiBase}/me/media_publish`, 
        publishData
    );
    
    return {
        id: publishResponse.data.id,
        url: `https://instagram.com/p/${publishResponse.data.id}`
    };
}

// LinkedIn 发布
async function publishToLinkedIn(content, media, accessToken, config) {
    const postData = {
        author: 'urn:li:person:PERSON_ID', // 需要获取实际的 person ID
        lifecycleState: 'PUBLISHED',
        specificContent: {
            'com.linkedin.ugc.ShareContent': {
                shareCommentary: {
                    text: content.substring(0, 3000)
                },
                shareMediaCategory: 'NONE'
            }
        },
        visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
    };
    
    const response = await axios.post(`${config.apiBase}/ugcPosts`, postData, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    return {
        id: response.data.id,
        url: `https://linkedin.com/feed/update/${response.data.id}`
    };
}

// YouTube 发布（需要视频文件）
async function publishToYouTube(content, media, accessToken, config) {
    if (!media || !media.find(m => m.type === 'video')) {
        throw new Error('YouTube requires a video file');
    }
    
    const videoData = {
        snippet: {
            title: content.substring(0, 100),
            description: content,
            tags: extractHashtags(content),
            categoryId: '22'
        },
        status: {
            privacyStatus: 'public'
        }
    };
    
    // 实际实现需要处理视频文件上传
    const response = await axios.post(`${config.apiBase}/videos`, videoData, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    return {
        id: response.data.id,
        url: `https://youtube.com/watch?v=${response.data.id}`
    };
}

// TikTok 发布
async function publishToTikTok(content, media, accessToken, config) {
    if (!media || !media.find(m => m.type === 'video')) {
        throw new Error('TikTok requires a video file');
    }
    
    const videoData = {
        video: {
            video_url: media.find(m => m.type === 'video').url
        },
        post_info: {
            title: content.substring(0, 150),
            privacy_level: 'SELF_ONLY',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false
        }
    };
    
    const response = await axios.post(`${config.apiBase}/share/video/upload/`, videoData, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    return {
        id: response.data.data.share_id,
        url: `https://tiktok.com/@user/video/${response.data.data.share_id}`
    };
}

// 辅助函数
function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
}

function extractHashtags(text) {
    const hashtags = text.match(/#[\w\u4e00-\u9fff]+/g);
    return hashtags ? hashtags.map(tag => tag.substring(1)) : [];
}

async function uploadMediaToTwitter(media, accessToken, config) {
    // 实际实现需要处理媒体文件上传
    return ['mock_media_id_1', 'mock_media_id_2'];
}

async function getUserInfo(platform, accessToken) {
    const config = PLATFORM_CONFIG[platform];
    
    const endpoints = {
        twitter: `${config.apiBase}/users/me`,
        facebook: `${config.apiBase}/me`,
        instagram: `${config.apiBase}/me`,
        linkedin: `${config.apiBase}/people/~`,
        youtube: `${config.apiBase}/channels?part=snippet&mine=true`,
        tiktok: `${config.apiBase}/user/info/`
    };
    
    const response = await axios.get(endpoints[platform], {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    return response.data;
}

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Social API Server running on port ${PORT}`);
    console.log(`📱 Endpoints available:`);
    console.log(`   POST /api/oauth/token - OAuth token exchange`);
    console.log(`   POST /api/publish/:platform - Publish to single platform`);
    console.log(`   POST /api/publish/batch - Batch publish to multiple platforms`);
    console.log(`   GET /api/user/:platform - Get user information`);
});

module.exports = app;
