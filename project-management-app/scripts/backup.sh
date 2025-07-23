#!/bin/bash

# Database Backup Script for Disability Pension Management System
# This script creates compressed backups and optionally uploads to cloud storage

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production.yml"

# Load environment variables
if [ -f "$PROJECT_DIR/.env.production" ]; then
    source "$PROJECT_DIR/.env.production"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# Database backup
backup_database() {
    log_info "Starting database backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/db_backup_${timestamp}.sql"
    local compressed_file="${backup_file}.gz"
    
    # Create database dump
    docker-compose -f "$COMPOSE_FILE" exec -T mysql mysqldump \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --set-gtid-purged=OFF \
        -u"$MYSQL_USER" \
        -p"$MYSQL_PASSWORD" \
        disability_pension_production > "$backup_file"
    
    # Compress the backup
    gzip "$backup_file"
    
    log_success "Database backup created: $compressed_file"
    echo "$compressed_file"
}

# File backup (uploads directory)
backup_uploads() {
    log_info "Starting uploads backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local uploads_backup="$BACKUP_DIR/uploads_backup_${timestamp}.tar.gz"
    local uploads_dir="$PROJECT_DIR/backend/uploads"
    
    if [ -d "$uploads_dir" ]; then
        tar -czf "$uploads_backup" -C "$(dirname "$uploads_dir")" "$(basename "$uploads_dir")"
        log_success "Uploads backup created: $uploads_backup"
        echo "$uploads_backup"
    else
        log_warning "Uploads directory not found: $uploads_dir"
    fi
}

# Application configuration backup
backup_config() {
    log_info "Starting configuration backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local config_backup="$BACKUP_DIR/config_backup_${timestamp}.tar.gz"
    
    # Create temporary directory for configs
    local temp_dir=$(mktemp -d)
    
    # Copy important configuration files
    cp "$PROJECT_DIR/.env.production" "$temp_dir/" 2>/dev/null || true
    cp "$PROJECT_DIR/docker-compose.production.yml" "$temp_dir/" 2>/dev/null || true
    cp "$PROJECT_DIR/ecosystem.config.js" "$temp_dir/" 2>/dev/null || true
    cp -r "$PROJECT_DIR/nginx" "$temp_dir/" 2>/dev/null || true
    cp -r "$PROJECT_DIR/ssl" "$temp_dir/" 2>/dev/null || true
    
    # Create archive
    tar -czf "$config_backup" -C "$temp_dir" .
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "Configuration backup created: $config_backup"
    echo "$config_backup"
}

# Upload to S3 (if configured)
upload_to_s3() {
    local file="$1"
    
    if [ -n "$BACKUP_S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        log_info "Uploading to S3: $(basename "$file")"
        
        # Install AWS CLI if not present
        if ! command -v aws &> /dev/null; then
            log_warning "AWS CLI not found. Installing..."
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            unzip awscliv2.zip
            sudo ./aws/install
            rm -rf aws awscliv2.zip
        fi
        
        # Upload file
        aws s3 cp "$file" "s3://$BACKUP_S3_BUCKET/disability-pension-backups/" \
            --region "$AWS_REGION" \
            --storage-class STANDARD_IA
        
        log_success "File uploaded to S3: $(basename "$file")"
    else
        log_info "S3 configuration not found. Skipping cloud upload."
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    local retention_days=${BACKUP_RETENTION_DAYS:-30}
    
    # Find and delete files older than retention period
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$retention_days -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$retention_days -delete
    
    log_success "Cleaned up backups older than $retention_days days"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup integrity: $(basename "$backup_file")"
    
    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file"; then
            log_success "Backup file integrity verified"
            return 0
        else
            log_error "Backup file is corrupted!"
            return 1
        fi
    fi
    
    return 0
}

# Full backup function
full_backup() {
    log_info "Starting full system backup..."
    
    create_backup_dir
    
    # Backup database
    local db_backup
    db_backup=$(backup_database)
    
    if verify_backup "$db_backup"; then
        upload_to_s3 "$db_backup"
    fi
    
    # Backup uploads
    local uploads_backup
    uploads_backup=$(backup_uploads)
    
    if [ -n "$uploads_backup" ] && verify_backup "$uploads_backup"; then
        upload_to_s3 "$uploads_backup"
    fi
    
    # Backup configuration
    local config_backup
    config_backup=$(backup_config)
    
    if verify_backup "$config_backup"; then
        upload_to_s3 "$config_backup"
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    log_success "Full backup completed successfully!"
}

# Restore function
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warning "This will overwrite the current database. Are you sure? (y/N)"
    read -r confirmation
    
    if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
        log_info "Restore cancelled."
        exit 0
    fi
    
    log_info "Restoring database from: $backup_file"
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        local temp_file=$(mktemp)
        gunzip -c "$backup_file" > "$temp_file"
        backup_file="$temp_file"
    fi
    
    # Restore database
    docker-compose -f "$COMPOSE_FILE" exec -T mysql mysql \
        -u"$MYSQL_USER" \
        -p"$MYSQL_PASSWORD" \
        disability_pension_production < "$backup_file"
    
    # Cleanup temp file if created
    if [ -n "$temp_file" ]; then
        rm -f "$temp_file"
    fi
    
    log_success "Database restore completed successfully!"
}

# List available backups
list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/*.{sql.gz,tar.gz} 2>/dev/null | sort -k6,7 || log_info "No backups found."
    else
        log_info "Backup directory does not exist."
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [action]"
    echo ""
    echo "Actions:"
    echo "  backup       - Create full backup (default)"
    echo "  db-backup    - Backup database only"
    echo "  restore      - Restore from backup file"
    echo "  list         - List available backups"
    echo "  cleanup      - Clean up old backups"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore /path/to/backup.sql.gz"
    echo "  $0 list"
}

# Main execution
case ${1:-backup} in
    backup|full-backup)
        full_backup
        ;;
    db-backup|database)
        create_backup_dir
        backup_file=$(backup_database)
        if verify_backup "$backup_file"; then
            upload_to_s3 "$backup_file"
        fi
        ;;
    restore)
        restore_backup "$2"
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        log_error "Unknown action: $1"
        show_usage
        exit 1
        ;;
esac