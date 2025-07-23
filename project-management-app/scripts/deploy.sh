#!/bin/bash

# Production Deployment Script for Disability Pension Management System
# Usage: ./scripts/deploy.sh [environment] [action]

set -e

# Configuration
PROJECT_NAME="disability-pension-system"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found. Please create it first."
        exit 1
    fi
    
    log_success "All requirements met."
}

backup_database() {
    log_info "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p backups
    
    # Generate backup filename with timestamp
    BACKUP_FILE="backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create database backup
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T mysql mysqldump \
        -u${MYSQL_USER} -p${MYSQL_PASSWORD} \
        disability_pension_production > $BACKUP_FILE
    
    log_success "Database backup created: $BACKUP_FILE"
}

pull_latest_code() {
    log_info "Pulling latest code from repository..."
    
    # Stash any local changes
    git stash
    
    # Pull latest changes
    git pull origin main
    
    log_success "Latest code pulled successfully."
}

build_images() {
    log_info "Building Docker images..."
    
    # Build images with no cache for production
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    
    log_success "Docker images built successfully."
}

deploy_services() {
    log_info "Deploying services..."
    
    # Stop existing services
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Start services in detached mode
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
    
    log_success "Services deployed successfully."
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    docker-compose -f $DOCKER_COMPOSE_FILE exec backend npm run migrate
    
    log_success "Database migrations completed."
}

check_health() {
    log_info "Checking service health..."
    
    # Check backend health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        log_success "Backend service is healthy."
    else
        log_error "Backend service health check failed."
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost/nginx-health > /dev/null 2>&1; then
        log_success "Frontend service is healthy."
    else
        log_error "Frontend service health check failed."
        return 1
    fi
    
    log_success "All services are healthy."
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Cleanup completed."
}

rollback() {
    log_warning "Rolling back to previous version..."
    
    # Get the last backup file
    LATEST_BACKUP=$(ls -t backups/db_backup_*.sql | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restoring database from $LATEST_BACKUP..."
        
        # Restore database
        docker-compose -f $DOCKER_COMPOSE_FILE exec -T mysql mysql \
            -u${MYSQL_USER} -p${MYSQL_PASSWORD} \
            disability_pension_production < $LATEST_BACKUP
        
        log_success "Database restored from backup."
    else
        log_warning "No backup file found. Skipping database restoration."
    fi
    
    # Restart services
    docker-compose -f $DOCKER_COMPOSE_FILE restart
    
    log_success "Rollback completed."
}

show_status() {
    log_info "Showing service status..."
    
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    
    echo ""
    log_info "Service logs (last 20 lines):"
    docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=20
}

show_usage() {
    echo "Usage: $0 [action]"
    echo ""
    echo "Actions:"
    echo "  deploy    - Full deployment (default)"
    echo "  update    - Update services without rebuilding"
    echo "  restart   - Restart all services"
    echo "  stop      - Stop all services"
    echo "  status    - Show service status"
    echo "  logs      - Show service logs"
    echo "  backup    - Create database backup"
    echo "  rollback  - Rollback to previous version"
    echo "  cleanup   - Clean up old Docker images"
    echo "  health    - Check service health"
    echo ""
}

# Main execution
ACTION=${1:-deploy}

# Source environment variables
if [ -f "$ENV_FILE" ]; then
    source $ENV_FILE
fi

case $ACTION in
    deploy)
        log_info "Starting full deployment..."
        check_requirements
        backup_database
        pull_latest_code
        build_images
        deploy_services
        run_migrations
        cleanup_old_images
        log_success "Deployment completed successfully!"
        ;;
    update)
        log_info "Updating services..."
        pull_latest_code
        docker-compose -f $DOCKER_COMPOSE_FILE up -d --build
        run_migrations
        check_health
        log_success "Update completed successfully!"
        ;;
    restart)
        log_info "Restarting services..."
        docker-compose -f $DOCKER_COMPOSE_FILE restart
        check_health
        log_success "Services restarted successfully!"
        ;;
    stop)
        log_info "Stopping services..."
        docker-compose -f $DOCKER_COMPOSE_FILE down
        log_success "Services stopped successfully!"
        ;;
    status)
        show_status
        ;;
    logs)
        docker-compose -f $DOCKER_COMPOSE_FILE logs -f
        ;;
    backup)
        backup_database
        ;;
    rollback)
        rollback
        ;;
    cleanup)
        cleanup_old_images
        ;;
    health)
        check_health
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        log_error "Unknown action: $ACTION"
        show_usage
        exit 1
        ;;
esac