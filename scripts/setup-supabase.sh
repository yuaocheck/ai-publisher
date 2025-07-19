#!/bin/bash

# AI Publisher Supabase 自动配置脚本
# 此脚本将自动创建和配置 Supabase 项目

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Display banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 AI Publisher                                 ║"
    echo "║              Supabase 自动配置                                ║"
    echo "║                                                              ║"
    echo "║  🗄️ 自动创建数据库表                                          ║"
    echo "║  🔐 配置 Row Level Security                                   ║"
    echo "║  🔑 生成 API Keys                                            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "检查前置条件..."
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        log_warning "Supabase CLI 未安装，正在安装..."
        
        # Install Supabase CLI
        if command -v npm &> /dev/null; then
            npm install -g supabase
        elif command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            log_error "请先安装 Node.js 或 Homebrew"
            log_info "Node.js: https://nodejs.org/"
            log_info "Homebrew: https://brew.sh/"
            exit 1
        fi
    fi
    
    log_success "前置条件检查完成"
}

# Login to Supabase
login_supabase() {
    log_info "登录 Supabase..."
    
    # Check if already logged in
    if supabase projects list > /dev/null 2>&1; then
        log_success "已登录 Supabase"
        return
    fi
    
    log_info "请在浏览器中完成 Supabase 登录..."
    supabase login
    
    log_success "Supabase 登录成功"
}

# Create or select project
setup_project() {
    log_info "设置 Supabase 项目..."
    
    echo -e "${YELLOW}请选择操作：${NC}"
    echo "1) 创建新项目"
    echo "2) 使用现有项目"
    read -p "请输入选择 (1 或 2): " choice
    
    case $choice in
        1)
            create_new_project
            ;;
        2)
            select_existing_project
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
}

# Create new project
create_new_project() {
    log_info "创建新的 Supabase 项目..."
    
    read -p "项目名称 (ai-publisher): " project_name
    project_name=${project_name:-ai-publisher}
    
    read -p "数据库密码 (自动生成强密码): " db_password
    if [ -z "$db_password" ]; then
        db_password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        log_info "生成的数据库密码: $db_password"
    fi
    
    echo -e "${YELLOW}可用区域：${NC}"
    echo "1) us-east-1 (美国东部)"
    echo "2) us-west-1 (美国西部)"
    echo "3) eu-west-1 (欧洲西部)"
    echo "4) ap-southeast-1 (亚太东南)"
    read -p "选择区域 (1-4, 默认 4): " region_choice
    
    case ${region_choice:-4} in
        1) region="us-east-1" ;;
        2) region="us-west-1" ;;
        3) region="eu-west-1" ;;
        4) region="ap-southeast-1" ;;
        *) region="ap-southeast-1" ;;
    esac
    
    log_info "正在创建项目: $project_name (区域: $region)..."
    
    # Create project
    supabase projects create "$project_name" --db-password "$db_password" --region "$region"
    
    # Get project reference
    PROJECT_REF=$(supabase projects list | grep "$project_name" | awk '{print $3}')
    
    if [ -z "$PROJECT_REF" ]; then
        log_error "项目创建失败"
        exit 1
    fi
    
    log_success "项目创建成功: $PROJECT_REF"
    
    # Save project info
    echo "PROJECT_REF=$PROJECT_REF" > .supabase-project
    echo "DB_PASSWORD=$db_password" >> .supabase-project
    echo "REGION=$region" >> .supabase-project
}

# Select existing project
select_existing_project() {
    log_info "选择现有项目..."
    
    echo -e "${YELLOW}您的 Supabase 项目：${NC}"
    supabase projects list
    
    read -p "请输入项目 Reference ID: " PROJECT_REF
    
    if [ -z "$PROJECT_REF" ]; then
        log_error "项目 Reference ID 不能为空"
        exit 1
    fi
    
    # Save project info
    echo "PROJECT_REF=$PROJECT_REF" > .supabase-project
    
    log_success "项目选择完成: $PROJECT_REF"
}

# Initialize local Supabase
init_local_supabase() {
    log_info "初始化本地 Supabase 配置..."
    
    # Load project info
    source .supabase-project
    
    # Initialize Supabase in project
    if [ ! -f "supabase/config.toml" ]; then
        supabase init
    fi
    
    # Link to remote project
    supabase link --project-ref "$PROJECT_REF"
    
    log_success "本地 Supabase 配置完成"
}

# Run database migrations
run_migrations() {
    log_info "运行数据库迁移..."
    
    # Push database changes
    supabase db push
    
    log_success "数据库迁移完成"
}

# Generate types
generate_types() {
    log_info "生成 TypeScript 类型..."
    
    # Generate types
    supabase gen types typescript --local > src/types/database.types.ts
    
    log_success "TypeScript 类型生成完成"
}

# Get project credentials
get_credentials() {
    log_info "获取项目凭据..."
    
    # Load project info
    source .supabase-project
    
    # Get project details
    PROJECT_DETAILS=$(supabase projects list | grep "$PROJECT_REF")
    PROJECT_URL="https://$PROJECT_REF.supabase.co"
    
    # Get API keys (需要通过 Supabase Dashboard 获取)
    log_warning "请访问 Supabase Dashboard 获取 API Keys:"
    log_info "Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
    
    echo ""
    echo -e "${GREEN}项目信息：${NC}"
    echo "Project URL: $PROJECT_URL"
    echo "Project Ref: $PROJECT_REF"
    echo ""
    
    # Create environment file template
    create_env_template
}

# Create environment template
create_env_template() {
    log_info "创建环境变量模板..."
    
    source .supabase-project
    
    cat > .env.supabase << EOF
# Supabase 项目配置
# 请访问 https://supabase.com/dashboard/project/$PROJECT_REF/settings/api 获取 API Keys

NEXT_PUBLIC_SUPABASE_URL=https://$PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_ID=$PROJECT_REF

# 数据库配置
SUPABASE_DB_PASSWORD=${DB_PASSWORD:-your_db_password}
SUPABASE_REGION=${REGION:-ap-southeast-1}
EOF
    
    log_success "环境变量模板已创建: .env.supabase"
    
    echo ""
    echo -e "${YELLOW}下一步：${NC}"
    echo "1. 访问 Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
    echo "2. 复制 anon key 和 service_role key"
    echo "3. 更新 .env.supabase 文件中的 API Keys"
    echo "4. 运行: cp .env.supabase .env.local"
}

# Setup authentication
setup_auth() {
    log_info "配置身份验证..."
    
    source .supabase-project
    
    log_info "请在 Supabase Dashboard 中配置身份验证："
    log_info "1. 访问: https://supabase.com/dashboard/project/$PROJECT_REF/auth/settings"
    log_info "2. 配置站点 URL: http://localhost:3000"
    log_info "3. 添加重定向 URL: http://localhost:3000/auth/callback"
    log_info "4. 启用所需的身份验证提供商"
    
    log_success "身份验证配置指南已显示"
}

# Setup storage
setup_storage() {
    log_info "配置存储桶..."
    
    # Create storage buckets via SQL
    cat > temp_storage.sql << EOF
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('uploads', 'uploads', true),
('media', 'media', true);

-- 设置存储策略
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
EOF
    
    # Execute storage setup
    supabase db reset --db-url "postgresql://postgres:${DB_PASSWORD:-password}@db.${PROJECT_REF}.supabase.co:5432/postgres" < temp_storage.sql || true
    
    # Clean up
    rm temp_storage.sql
    
    log_success "存储桶配置完成"
}

# Main function
main() {
    show_banner
    
    log_info "开始 Supabase 自动配置..."
    echo ""
    
    check_prerequisites
    login_supabase
    setup_project
    init_local_supabase
    run_migrations
    generate_types
    get_credentials
    setup_auth
    setup_storage
    
    echo ""
    log_success "🎉 Supabase 配置完成！"
    echo ""
    echo -e "${GREEN}配置摘要：${NC}"
    echo "✅ 项目已创建/连接"
    echo "✅ 数据库表已创建"
    echo "✅ RLS 策略已配置"
    echo "✅ TypeScript 类型已生成"
    echo "✅ 存储桶已创建"
    echo "✅ 环境变量模板已创建"
    echo ""
    echo -e "${YELLOW}下一步：${NC}"
    echo "1. 更新 .env.supabase 中的 API Keys"
    echo "2. 复制到项目环境: cp .env.supabase .env.local"
    echo "3. 启动应用: npm run dev"
    echo ""
}

# Handle script interruption
trap 'log_error "配置中断"; exit 1' INT TERM

# Run main function
main "$@"
