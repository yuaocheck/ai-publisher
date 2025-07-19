#!/bin/bash

# AI Publisher Production Deployment Script
# Usage: ./deploy.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="ai-publisher"
DOCKER_REGISTRY="your-registry.com"
VERSION=$(git rev-parse --short HEAD)

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        log_error "Environment file .env.${ENVIRONMENT} not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log_info "Loading environment variables for ${ENVIRONMENT}..."
    
    # Copy environment file
    cp ".env.${ENVIRONMENT}" .env
    
    # Source environment variables
    set -a
    source .env
    set +a
    
    log_success "Environment variables loaded"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build the main application image
    docker build -t "${PROJECT_NAME}:${VERSION}" .
    docker tag "${PROJECT_NAME}:${VERSION}" "${PROJECT_NAME}:latest"
    
    log_success "Docker images built successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if Supabase CLI is available
    if command -v supabase &> /dev/null; then
        # Run migrations using Supabase CLI
        supabase db push --project-ref "${SUPABASE_PROJECT_ID}"
        log_success "Database migrations completed"
    else
        log_warning "Supabase CLI not found, skipping migrations"
        log_warning "Please run migrations manually"
    fi
}

# Deploy with Docker Compose
deploy_application() {
    log_info "Deploying application..."
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Pull latest images (if using registry)
    # docker-compose pull
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Application deployed successfully"
    else
        log_error "Application health check failed"
        docker-compose logs ai-publisher
        exit 1
    fi
}

# Setup SSL certificates (Let's Encrypt)
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    if [ ! -d "ssl" ]; then
        mkdir -p ssl
    fi
    
    # Check if certificates already exist
    if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
        log_info "SSL certificates already exist"
        return
    fi
    
    # Generate self-signed certificates for development
    if [ "${ENVIRONMENT}" = "development" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        log_success "Self-signed SSL certificates generated"
    else
        log_warning "Please setup proper SSL certificates for production"
        log_warning "Consider using Let's Encrypt or your certificate provider"
    fi
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    # Create backup directory
    mkdir -p backups
    
    # Generate backup filename
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Note: This is a placeholder for Supabase backup
    # In production, you would use Supabase's backup features
    log_warning "Database backup not implemented for Supabase"
    log_warning "Please use Supabase dashboard for backups"
}

# Monitoring setup
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Start monitoring services if profile is enabled
    if [ "${ENABLE_MONITORING:-false}" = "true" ]; then
        docker-compose --profile monitoring up -d prometheus grafana
        log_success "Monitoring services started"
        log_info "Grafana available at http://localhost:3001 (admin/admin123)"
        log_info "Prometheus available at http://localhost:9090"
    else
        log_info "Monitoring disabled"
    fi
}

# Cleanup old images and containers
cleanup() {
    log_info "Cleaning up old Docker images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this in production)
    if [ "${ENVIRONMENT}" = "development" ]; then
        docker volume prune -f
    fi
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting deployment for environment: ${ENVIRONMENT}"
    log_info "Version: ${VERSION}"
    
    check_prerequisites
    load_environment
    
    # Create backup before deployment (production only)
    if [ "${ENVIRONMENT}" = "production" ]; then
        backup_database
    fi
    
    build_images
    setup_ssl
    run_migrations
    deploy_application
    setup_monitoring
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Application is available at: ${NEXTAUTH_URL:-http://localhost:3000}"
    
    # Show service status
    echo ""
    log_info "Service status:"
    docker-compose ps
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
