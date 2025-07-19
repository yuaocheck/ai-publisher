// AI Publisher API 客户端
class AIPublisherAPI {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('ai_publisher_token');
    }

    // 设置认证令牌
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('ai_publisher_token', token);
        } else {
            localStorage.removeItem('ai_publisher_token');
        }
    }

    // 获取认证头
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API 请求失败:', error);
            throw error;
        }
    }

    // GET 请求
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    // POST 请求
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT 请求
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE 请求
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ==================== 认证 API ====================

    // 用户注册
    async register(userData) {
        const response = await this.post('/auth/register', userData);
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    // 用户登录
    async login(credentials) {
        const response = await this.post('/auth/login', credentials);
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    // 登出
    logout() {
        this.setToken(null);
    }

    // 验证令牌
    async verifyToken() {
        try {
            return await this.get('/auth/verify');
        } catch (error) {
            this.setToken(null);
            throw error;
        }
    }

    // 刷新令牌
    async refreshToken() {
        const response = await this.post('/auth/refresh');
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    // ==================== 用户 API ====================

    // 获取用户概览
    async getUserOverview() {
        return this.get('/users/overview');
    }

    // 获取用户信息
    async getUserProfile() {
        return this.get('/users/profile');
    }

    // 更新用户信息
    async updateUserProfile(profileData) {
        return this.put('/users/profile', profileData);
    }

    // 获取用户设置
    async getUserSettings() {
        return this.get('/users/settings');
    }

    // 更新用户设置
    async updateUserSettings(settingsData) {
        return this.put('/users/settings', settingsData);
    }

    // 获取用户统计
    async getUserStats() {
        return this.get('/users/stats');
    }

    // 获取 API 使用情况
    async getApiUsage() {
        return this.get('/users/api-usage');
    }

    // ==================== AI 生成 API ====================

    // 生成内容
    async generateContent(params) {
        return this.post('/ai-generation/generate', params);
    }

    // 优化内容
    async optimizeContent(params) {
        return this.post('/ai-generation/optimize', params);
    }

    // 生成内容变体
    async generateVariations(params) {
        return this.post('/ai-generation/variations', params);
    }

    // 获取 AI 生成历史
    async getGenerationHistory(params = {}) {
        return this.get('/ai-generation/history', params);
    }

    // ==================== 内容管理 API ====================

    // 获取内容列表
    async getContentPosts(params = {}) {
        return this.get('/content', params);
    }

    // 创建内容
    async createContentPost(postData) {
        return this.post('/content', postData);
    }

    // 获取内容详情
    async getContentPost(id) {
        return this.get(`/content/${id}`);
    }

    // 更新内容
    async updateContentPost(id, postData) {
        return this.put(`/content/${id}`, postData);
    }

    // 删除内容
    async deleteContentPost(id) {
        return this.delete(`/content/${id}`);
    }

    // 发布内容
    async publishContent(id, publishData) {
        return this.post(`/content/${id}/publish`, publishData);
    }

    // 获取内容统计
    async getContentStats(params = {}) {
        return this.get('/content/stats/overview', params);
    }

    // ==================== 社交账号 API ====================

    // 获取支持的平台
    async getSupportedPlatforms() {
        return this.get('/social-accounts/platforms');
    }

    // 获取社交账号列表
    async getSocialAccounts(params = {}) {
        return this.get('/social-accounts', params);
    }

    // 添加社交账号
    async addSocialAccount(accountData) {
        return this.post('/social-accounts', accountData);
    }

    // 获取社交账号详情
    async getSocialAccount(id) {
        return this.get(`/social-accounts/${id}`);
    }

    // 更新社交账号
    async updateSocialAccount(id, accountData) {
        return this.put(`/social-accounts/${id}`, accountData);
    }

    // 删除社交账号
    async deleteSocialAccount(id) {
        return this.delete(`/social-accounts/${id}`);
    }

    // 测试账号连接
    async testSocialAccountConnection(id) {
        return this.post(`/social-accounts/${id}/test-connection`);
    }

    // 刷新账号令牌
    async refreshSocialAccountToken(id) {
        return this.post(`/social-accounts/${id}/refresh-token`);
    }

    // 获取账号统计
    async getSocialAccountStats(id, params = {}) {
        return this.get(`/social-accounts/${id}/stats`, params);
    }

    // ==================== 分析数据 API ====================

    // 获取分析概览
    async getAnalyticsOverview(params = {}) {
        return this.get('/analytics/overview', params);
    }

    // 获取平台对比数据
    async getPlatformComparison(params = {}) {
        return this.get('/analytics/platform-comparison', params);
    }

    // 获取热门内容
    async getTopContent(params = {}) {
        return this.get('/analytics/top-content', params);
    }

    // 获取发布时间分析
    async getPostingTimesAnalysis(params = {}) {
        return this.get('/analytics/posting-times', params);
    }

    // 记录分析数据
    async recordAnalyticsData(analyticsData) {
        return this.post('/analytics/record', analyticsData);
    }

    // ==================== 工具方法 ====================

    // 检查是否已登录
    isAuthenticated() {
        return !!this.token;
    }

    // 获取当前用户信息（从令牌解析）
    getCurrentUser() {
        if (!this.token) return null;
        
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return {
                id: payload.id,
                email: payload.email,
                username: payload.username,
                subscription_plan: payload.subscription_plan
            };
        } catch (error) {
            console.error('解析令牌失败:', error);
            return null;
        }
    }

    // 检查令牌是否即将过期
    isTokenExpiringSoon(thresholdMinutes = 30) {
        if (!this.token) return true;
        
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const expirationTime = payload.exp * 1000;
            const currentTime = Date.now();
            const thresholdTime = thresholdMinutes * 60 * 1000;
            
            return (expirationTime - currentTime) < thresholdTime;
        } catch (error) {
            console.error('检查令牌过期时间失败:', error);
            return true;
        }
    }

    // 自动刷新令牌
    async autoRefreshToken() {
        if (this.isTokenExpiringSoon()) {
            try {
                await this.refreshToken();
                console.log('令牌自动刷新成功');
            } catch (error) {
                console.error('令牌自动刷新失败:', error);
                this.logout();
            }
        }
    }
}

// 创建全局 API 客户端实例
const apiClient = new AIPublisherAPI();

// 自动令牌刷新（每 5 分钟检查一次）
setInterval(() => {
    if (apiClient.isAuthenticated()) {
        apiClient.autoRefreshToken();
    }
}, 5 * 60 * 1000);

// 导出 API 客户端
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIPublisherAPI, apiClient };
} else {
    window.AIPublisherAPI = AIPublisherAPI;
    window.apiClient = apiClient;
}
