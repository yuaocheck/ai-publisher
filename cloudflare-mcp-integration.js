// AI Publisher - Cloudflare MCP Server Integration
// 集成 Cloudflare MCP Server 功能到 AI Publisher

export class CloudflareMCPIntegration {
    constructor(env) {
        this.env = env;
        this.mcpServers = {
            docs: 'https://docs.mcp.cloudflare.com/sse',
            bindings: 'https://bindings.mcp.cloudflare.com/sse',
            builds: 'https://builds.mcp.cloudflare.com/sse',
            observability: 'https://observability.mcp.cloudflare.com/sse',
            radar: 'https://radar.mcp.cloudflare.com/sse',
            container: 'https://containers.mcp.cloudflare.com/sse',
            browser: 'https://browser.mcp.cloudflare.com/sse',
            logpush: 'https://logs.mcp.cloudflare.com/sse',
            aiGateway: 'https://ai-gateway.mcp.cloudflare.com/sse',
            autorag: 'https://autorag.mcp.cloudflare.com/sse',
            auditLogs: 'https://auditlogs.mcp.cloudflare.com/sse',
            dnsAnalytics: 'https://dns-analytics.mcp.cloudflare.com/sse',
            dex: 'https://dex.mcp.cloudflare.com/sse',
            casb: 'https://casb.mcp.cloudflare.com/sse',
            graphql: 'https://graphql.mcp.cloudflare.com/sse'
        };
    }

    // 获取 Cloudflare 文档
    async getDocumentation(query) {
        try {
            const response = await this.callMCPServer('docs', {
                method: 'search_docs',
                params: { query }
            });
            return response;
        } catch (error) {
            console.error('Documentation search error:', error);
            throw error;
        }
    }

    // 管理 Workers 绑定
    async manageWorkerBindings(action, config) {
        try {
            const response = await this.callMCPServer('bindings', {
                method: action,
                params: config
            });
            return response;
        } catch (error) {
            console.error('Worker bindings error:', error);
            throw error;
        }
    }

    // 获取构建信息
    async getBuildInfo(workerId) {
        try {
            const response = await this.callMCPServer('builds', {
                method: 'get_build_info',
                params: { worker_id: workerId }
            });
            return response;
        } catch (error) {
            console.error('Build info error:', error);
            throw error;
        }
    }

    // 获取可观测性数据
    async getObservabilityData(filters) {
        try {
            const response = await this.callMCPServer('observability', {
                method: 'get_logs',
                params: filters
            });
            return response;
        } catch (error) {
            console.error('Observability error:', error);
            throw error;
        }
    }

    // 获取 Radar 数据
    async getRadarData(type, params) {
        try {
            const response = await this.callMCPServer('radar', {
                method: type,
                params: params
            });
            return response;
        } catch (error) {
            console.error('Radar data error:', error);
            throw error;
        }
    }

    // 浏览器渲染
    async renderPage(url, options = {}) {
        try {
            const response = await this.callMCPServer('browser', {
                method: 'render_page',
                params: { url, ...options }
            });
            return response;
        } catch (error) {
            console.error('Browser rendering error:', error);
            throw error;
        }
    }

    // 获取页面截图
    async takeScreenshot(url, options = {}) {
        try {
            const response = await this.callMCPServer('browser', {
                method: 'take_screenshot',
                params: { url, ...options }
            });
            return response;
        } catch (error) {
            console.error('Screenshot error:', error);
            throw error;
        }
    }

    // 转换页面为 Markdown
    async pageToMarkdown(url) {
        try {
            const response = await this.callMCPServer('browser', {
                method: 'page_to_markdown',
                params: { url }
            });
            return response;
        } catch (error) {
            console.error('Page to markdown error:', error);
            throw error;
        }
    }

    // AI Gateway 查询
    async queryAIGateway(query) {
        try {
            const response = await this.callMCPServer('aiGateway', {
                method: 'search_logs',
                params: { query }
            });
            return response;
        } catch (error) {
            console.error('AI Gateway query error:', error);
            throw error;
        }
    }

    // GraphQL 查询
    async executeGraphQLQuery(query, variables = {}) {
        try {
            const response = await this.callMCPServer('graphql', {
                method: 'execute_query',
                params: { query, variables }
            });
            return response;
        } catch (error) {
            console.error('GraphQL query error:', error);
            throw error;
        }
    }

    // 调用 MCP 服务器的通用方法
    async callMCPServer(serverName, payload) {
        const serverUrl = this.mcpServers[serverName];
        if (!serverUrl) {
            throw new Error(`Unknown MCP server: ${serverName}`);
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
            'X-CF-Account-ID': this.env.CLOUDFLARE_ACCOUNT_ID
        };

        const response = await fetch(serverUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`MCP Server error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    // 获取所有可用的 MCP 服务器
    getAvailableServers() {
        return Object.keys(this.mcpServers).map(name => ({
            name,
            url: this.mcpServers[name],
            description: this.getServerDescription(name)
        }));
    }

    // 获取服务器描述
    getServerDescription(serverName) {
        const descriptions = {
            docs: 'Get up to date reference information on Cloudflare',
            bindings: 'Build Workers applications with storage, AI, and compute primitives',
            builds: 'Get insights and manage your Cloudflare Workers Builds',
            observability: 'Debug and get insight into your application\'s logs and analytics',
            radar: 'Get global Internet traffic insights, trends, URL scans, and other utilities',
            container: 'Spin up a sandbox development environment',
            browser: 'Fetch web pages, convert them to markdown and take screenshots',
            logpush: 'Get quick summaries for Logpush job health',
            aiGateway: 'Search your logs, get details about the prompts and responses',
            autorag: 'List and search documents on your AutoRAGs',
            auditLogs: 'Query audit logs and generate reports for review',
            dnsAnalytics: 'Optimize DNS performance and debug issues based on current set up',
            dex: 'Get quick insight on critical applications for your organization',
            casb: 'Quickly identify any security misconfigurations for SaaS applications',
            graphql: 'Get analytics data using Cloudflare\'s GraphQL API'
        };
        return descriptions[serverName] || 'Cloudflare MCP Server';
    }

    // 健康检查所有 MCP 服务器
    async healthCheck() {
        const results = {};
        
        for (const [name, url] of Object.entries(this.mcpServers)) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`
                    }
                });
                results[name] = {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    statusCode: response.status,
                    url
                };
            } catch (error) {
                results[name] = {
                    status: 'error',
                    error: error.message,
                    url
                };
            }
        }
        
        return results;
    }
}

// 导出集成类
export default CloudflareMCPIntegration;
