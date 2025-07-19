// AI Publisher - Cloudflare MCP Server Integration
// 集成 Cloudflare MCP Server 功能到 AI Publisher

// Cloudflare MCP Server 完整配置 - 14 个官方服务器
const MCP_SERVER_CONFIG = {
    docs: {
        name: 'Documentation Server',
        url: 'https://docs.mcp.cloudflare.com/sse',
        description: 'Get up to date reference information on Cloudflare',
        category: 'documentation',
        tools: ['search_docs', 'get_api_reference', 'get_tutorials'],
        permissions: ['Zone:Zone:Read', 'Account:Account Settings:Read']
    },
    bindings: {
        name: 'Workers Bindings Server',
        url: 'https://bindings.mcp.cloudflare.com/sse',
        description: 'Build Workers applications with storage, AI, and compute primitives',
        category: 'development',
        tools: ['create_kv_namespace', 'create_r2_bucket', 'create_d1_database', 'create_durable_object'],
        permissions: ['Zone:Zone:Edit', 'Account:Cloudflare Workers:Edit']
    },
    builds: {
        name: 'Workers Builds Server',
        url: 'https://builds.mcp.cloudflare.com/sse',
        description: 'Get insights and manage your Cloudflare Workers Builds',
        category: 'development',
        tools: ['list_builds', 'get_build_details', 'trigger_build', 'get_build_logs'],
        permissions: ['Account:Cloudflare Workers:Edit']
    },
    observability: {
        name: 'Observability Server',
        url: 'https://observability.mcp.cloudflare.com/sse',
        description: 'Debug and get insight into your application\'s logs and analytics',
        category: 'monitoring',
        tools: ['get_worker_logs', 'get_analytics', 'get_performance_metrics', 'search_logs'],
        permissions: ['Zone:Zone Analytics:Read', 'Account:Cloudflare Workers:Read']
    },
    radar: {
        name: 'Radar Server',
        url: 'https://radar.mcp.cloudflare.com/sse',
        description: 'Get global Internet traffic insights, trends, URL scans, and other utilities',
        category: 'analytics',
        tools: ['get_traffic_insights', 'scan_url', 'get_attack_trends', 'get_ranking_data'],
        permissions: [] // Public API, no special permissions needed
    },
    container: {
        name: 'Container Server',
        url: 'https://containers.mcp.cloudflare.com/sse',
        description: 'Spin up a sandbox development environment',
        category: 'development',
        tools: ['create_container', 'list_containers', 'execute_command', 'get_container_logs'],
        permissions: ['Account:Cloudflare Workers:Edit']
    },
    browser: {
        name: 'Browser Rendering Server',
        url: 'https://browser.mcp.cloudflare.com/sse',
        description: 'Fetch web pages, convert them to markdown and take screenshots',
        category: 'utilities',
        tools: ['render_page', 'take_screenshot', 'convert_to_markdown', 'get_page_content'],
        permissions: ['Account:Browser Rendering API:Edit']
    },
    logpush: {
        name: 'Logpush Server',
        url: 'https://logs.mcp.cloudflare.com/sse',
        description: 'Get quick summaries for Logpush job health',
        category: 'monitoring',
        tools: ['list_logpush_jobs', 'get_job_health', 'create_logpush_job', 'update_job_config'],
        permissions: ['Zone:Logs:Edit', 'Account:Logs:Edit']
    },
    aiGateway: {
        name: 'AI Gateway Server',
        url: 'https://ai-gateway.mcp.cloudflare.com/sse',
        description: 'Search your logs, get details about the prompts and responses',
        category: 'ai',
        tools: ['search_ai_logs', 'get_prompt_details', 'get_response_analytics', 'list_ai_requests'],
        permissions: ['Account:AI Gateway:Read']
    },
    autorag: {
        name: 'AutoRAG Server',
        url: 'https://autorag.mcp.cloudflare.com/sse',
        description: 'List and search documents on your AutoRAGs',
        category: 'ai',
        tools: ['list_documents', 'search_documents', 'upload_document', 'get_rag_analytics'],
        permissions: ['Account:Vectorize:Edit']
    },
    auditLogs: {
        name: 'Audit Logs Server',
        url: 'https://auditlogs.mcp.cloudflare.com/sse',
        description: 'Query audit logs and generate reports for review',
        category: 'security',
        tools: ['query_audit_logs', 'generate_report', 'get_user_activity', 'export_logs'],
        permissions: ['Account:Audit Logs:Read']
    },
    dnsAnalytics: {
        name: 'DNS Analytics Server',
        url: 'https://dns-analytics.mcp.cloudflare.com/sse',
        description: 'Optimize DNS performance and debug issues based on current set up',
        category: 'analytics',
        tools: ['get_dns_analytics', 'analyze_performance', 'get_query_stats', 'debug_dns_issues'],
        permissions: ['Zone:Zone Analytics:Read']
    },
    dex: {
        name: 'Digital Experience Monitoring Server',
        url: 'https://dex.mcp.cloudflare.com/sse',
        description: 'Get quick insight on critical applications for your organization',
        category: 'monitoring',
        tools: ['get_app_performance', 'list_critical_apps', 'get_user_experience', 'analyze_connectivity'],
        permissions: ['Account:Digital Experience Monitoring:Read']
    },
    casb: {
        name: 'Cloudflare One CASB Server',
        url: 'https://casb.mcp.cloudflare.com/sse',
        description: 'Quickly identify any security misconfigurations for SaaS applications to safeguard users & data',
        category: 'security',
        tools: ['scan_saas_apps', 'get_security_findings', 'list_integrations', 'generate_compliance_report'],
        permissions: ['Account:Cloudflare One:Read']
    },
    graphql: {
        name: 'GraphQL Server',
        url: 'https://graphql.mcp.cloudflare.com/sse',
        description: 'Get analytics data using Cloudflare\'s GraphQL API',
        category: 'analytics',
        tools: ['execute_graphql_query', 'get_zone_analytics', 'get_account_analytics', 'get_custom_metrics'],
        permissions: ['Zone:Zone Analytics:Read', 'Account:Account Analytics:Read']
    }
};

export class CloudflareMCPIntegration {
    constructor(env) {
        this.env = env;
        this.mcpServers = MCP_SERVER_CONFIG;
        this.apiToken = env.CLOUDFLARE_API_TOKEN;
        this.accountId = env.CLOUDFLARE_ACCOUNT_ID;

        // 验证必需的环境变量
        if (!this.apiToken) {
            throw new Error('CLOUDFLARE_API_TOKEN is required for MCP integration');
        }
        if (!this.accountId) {
            throw new Error('CLOUDFLARE_ACCOUNT_ID is required for MCP integration');
        }
    }

    // 获取所有可用的 MCP 服务器
    getAvailableServers() {
        return Object.entries(this.mcpServers).map(([key, config]) => ({
            id: key,
            ...config
        }));
    }

    // 按类别获取服务器
    getServersByCategory(category) {
        return Object.entries(this.mcpServers)
            .filter(([_, config]) => config.category === category)
            .map(([key, config]) => ({
                id: key,
                ...config
            }));
    }

    // 获取服务器配置
    getServerConfig(serverId) {
        return this.mcpServers[serverId] || null;
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
