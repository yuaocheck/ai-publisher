#!/bin/bash

# AI Publisher Production Startup Script
# This script provides a quick way to start the production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ai-publisher"
ENVIRONMENT="production"

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
    echo "║                    AI Publisher                              ║"
    echo "║              Production Environment                          ║"
    echo "║                                                              ║"
    echo "║  🚀 全平台内容发布系统                                        ║"
    echo "║  🤖 AI 驱动的智能内容生成                                     ║"
    echo "║  📊 实时数据分析和监控                                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if Docker is running
check_docker() {
    log_info "Checking Docker status..."
    
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "Docker is running"
}

# Check if environment file exists
check_environment() {
    log_info "Checking environment configuration..."
    
    if [ ! -f ".env.production" ]; then
        log_error "Production environment file not found!"
        log_info "Please create .env.production with your configuration."
        log_info "You can copy from .env.example and modify the values."
        exit 1
    fi
    
    # Check for required environment variables
    source .env.production
    
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "GEMINI_API_KEY"
        "NEXTAUTH_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    log_success "Environment configuration is valid"
}

# Start services
start_services() {
    log_info "Starting AI Publisher services..."
    
    # Copy production environment
    cp .env.production .env
    
    # Stop any existing containers
    docker-compose down --remove-orphans > /dev/null 2>&1 || true
    
    # Start services
    docker-compose up -d
    
    log_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Application is ready!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Application failed to start within expected time"
            log_info "Checking logs..."
            docker-compose logs ai-publisher
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# Show service status
show_status() {
    log_info "Service Status:"
    echo ""
    docker-compose ps
    echo ""
    
    # Show health check
    log_info "Health Check:"
    if curl -s http://localhost:3000/api/health | jq . 2>/dev/null; then
        log_success "Health check passed"
    else
        log_warning "Health check endpoint not responding properly"
    fi
}

# Show access information
show_access_info() {
    echo ""
    log_success "🎉 AI Publisher is now running!"
    echo ""
    echo -e "${GREEN}Access Information:${NC}"
    echo "  📱 Main Application: http://localhost:3000"
    echo "  🔍 Health Check:    http://localhost:3000/api/health"
    echo "  📊 Monitoring:      http://localhost:3001 (if enabled)"
    echo ""
    echo -e "${YELLOW}Default Credentials (if monitoring enabled):${NC}"
    echo "  Grafana: admin / admin123"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  📋 View logs:       docker-compose logs -f ai-publisher"
    echo "  🔄 Restart:         docker-compose restart ai-publisher"
    echo "  🛑 Stop:            docker-compose down"
    echo "  📊 Status:          docker-compose ps"
    echo ""
}

# Show logs option
show_logs_option() {
    echo -e "${YELLOW}Would you like to view the application logs? (y/n)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_info "Showing application logs (Press Ctrl+C to exit)..."
        docker-compose logs -f ai-publisher
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Add any cleanup tasks here
}

# Handle script interruption
trap cleanup INT TERM

# Main function
main() {
    show_banner
    
    log_info "Starting AI Publisher Production Environment..."
    echo ""
    
    check_docker
    check_environment
    start_services
    wait_for_services
    show_status
    show_access_info
    show_logs_option
}

# Check if script is run with specific commands
case "${1:-}" in
    "stop")
        log_info "Stopping AI Publisher services..."
        docker-compose down
        log_success "Services stopped"
        exit 0
        ;;
    "restart")
        log_info "Restarting AI Publisher services..."
        docker-compose restart
        log_success "Services restarted"
        exit 0
        ;;
    "logs")
        log_info "Showing application logs..."
        docker-compose logs -f ai-publisher
        exit 0
        ;;
    "status")
        docker-compose ps
        exit 0
        ;;
    "health")
        curl -s http://localhost:3000/api/health | jq . || echo "Health check failed"
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "AI Publisher Production Startup Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no command)  Start the production environment"
        echo "  stop          Stop all services"
        echo "  restart       Restart all services"
        echo "  logs          Show application logs"
        echo "  status        Show service status"
        echo "  health        Check application health"
        echo "  help          Show this help message"
        echo ""
        exit 0
        ;;
esac

# Run main function
main "$@"
