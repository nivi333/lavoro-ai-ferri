#!/bin/bash

# Database Restore Script for Ayphen Textile
# Supports restoration of global schema, tenant schemas, or full database

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-ayphen_prod}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD}

# S3 configuration (optional)
S3_BUCKET=${S3_BUCKET:-}
S3_PREFIX=${S3_PREFIX:-database-backups}

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/restore.log"
}

error() {
    log "ERROR: $1" >&2
    exit 1
}

warning() {
    log "WARNING: $1" >&2
}

# Check dependencies
check_dependencies() {
    local deps=("psql" "pg_restore" "gunzip")
    
    if [ -n "$S3_BUCKET" ]; then
        deps+=("aws")
    fi
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error "$dep is required but not installed"
        fi
    done
}

# Test database connection
test_connection() {
    log "Testing database connection..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        error "Cannot connect to database $DB_NAME on $DB_HOST:$DB_PORT"
    fi
    
    log "Database connection successful"
}

# Download backup from S3
download_from_s3() {
    local backup_file="$1"
    local local_file="$BACKUP_DIR/$(basename "$backup_file")"
    
    if [ -z "$S3_BUCKET" ]; then
        error "S3 bucket not configured"
    fi
    
    log "Downloading backup from S3: s3://$S3_BUCKET/$S3_PREFIX/$backup_file"
    
    if aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX/$backup_file" "$local_file"; then
        log "Backup downloaded successfully: $local_file"
        echo "$local_file"
    else
        error "Failed to download backup from S3"
    fi
}

# List available backups
list_backups() {
    local source="${1:-local}"
    
    case "$source" in
        "local")
            log "Available local backups:"
            if [ -d "$BACKUP_DIR" ]; then
                find "$BACKUP_DIR" -name "*.sql.gz" -o -name "*.tar.gz" | sort -r | head -20 | while read -r file; do
                    local timestamp=$(stat -c %y "$file" 2>/dev/null || stat -f %Sm "$file" 2>/dev/null)
                    local size=$(du -h "$file" | cut -f1)
                    echo "  $(basename "$file") - $size - $timestamp"
                done
            else
                echo "  No local backup directory found"
            fi
            ;;
        "s3")
            if [ -n "$S3_BUCKET" ]; then
                log "Available S3 backups:"
                aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | sort -r | head -20 | while read -r line; do
                    echo "  $line"
                done
            else
                echo "  S3 not configured"
            fi
            ;;
        *)
            error "Invalid source: $source. Use 'local' or 's3'"
            ;;
    esac
}

# Verify backup file
verify_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        if ! gunzip -t "$backup_file" 2>/dev/null; then
            error "Backup file is corrupted: $backup_file"
        fi
    fi
    
    log "Backup file verified: $backup_file"
}

# Create database backup before restore
create_pre_restore_backup() {
    local backup_name="pre_restore_$(date +%Y%m%d_%H%M%S)"
    
    log "Creating pre-restore backup: $backup_name"
    
    # Use the backup script to create a backup
    if [ -f "$SCRIPT_DIR/backup-database.sh" ]; then
        BACKUP_DIR="$BACKUP_DIR/pre-restore" "$SCRIPT_DIR/backup-database.sh" full
    else
        warning "Backup script not found, skipping pre-restore backup"
    fi
}

# Drop existing tenant schemas (with confirmation)
drop_tenant_schemas() {
    local force="${1:-false}"
    
    if [ "$force" != "true" ]; then
        echo "This will drop all existing tenant schemas. Are you sure? (yes/no)"
        read -r confirmation
        if [ "$confirmation" != "yes" ]; then
            log "Restore cancelled by user"
            exit 0
        fi
    fi
    
    log "Dropping existing tenant schemas..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Get list of tenant schemas
    local tenant_schemas
    tenant_schemas=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';" \
        | grep -v '^$' | tr -d ' ')
    
    if [ -n "$tenant_schemas" ]; then
        while IFS= read -r schema; do
            if [ -n "$schema" ]; then
                log "Dropping schema: $schema"
                psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
                    "DROP SCHEMA IF EXISTS \"$schema\" CASCADE;" > /dev/null
            fi
        done <<< "$tenant_schemas"
    else
        log "No tenant schemas found to drop"
    fi
}

# Restore global schema
restore_global_schema() {
    local backup_file="$1"
    local force="${2:-false}"
    
    log "Restoring global schema from: $backup_file"
    
    verify_backup "$backup_file"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Decompress if needed
    local sql_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        sql_file="${backup_file%.gz}"
        gunzip -c "$backup_file" > "$sql_file"
    fi
    
    # Drop existing public schema if force is true
    if [ "$force" = "true" ]; then
        log "Dropping existing public schema..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
            "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" > /dev/null
    fi
    
    # Restore schema
    log "Restoring global schema..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file" > /dev/null 2>> "$BACKUP_DIR/restore.log"; then
        log "Global schema restored successfully"
    else
        error "Failed to restore global schema"
    fi
    
    # Clean up decompressed file if it was created
    if [[ "$backup_file" == *.gz ]] && [ -f "$sql_file" ]; then
        rm -f "$sql_file"
    fi
}

# Restore tenant schema
restore_tenant_schema() {
    local backup_file="$1"
    local target_schema="${2:-}"
    
    log "Restoring tenant schema from: $backup_file"
    
    verify_backup "$backup_file"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Decompress if needed
    local sql_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        sql_file="${backup_file%.gz}"
        gunzip -c "$backup_file" > "$sql_file"
    fi
    
    # If target schema is specified, modify the SQL to use it
    if [ -n "$target_schema" ]; then
        # Extract original schema name from backup
        local original_schema
        original_schema=$(grep -m1 "CREATE SCHEMA" "$sql_file" | sed 's/.*CREATE SCHEMA \([^;]*\);.*/\1/' | tr -d '"')
        
        if [ -n "$original_schema" ] && [ "$original_schema" != "$target_schema" ]; then
            log "Renaming schema from $original_schema to $target_schema"
            sed -i.bak "s/$original_schema/$target_schema/g" "$sql_file"
        fi
    fi
    
    # Restore schema
    log "Restoring tenant schema..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file" > /dev/null 2>> "$BACKUP_DIR/restore.log"; then
        log "Tenant schema restored successfully"
    else
        error "Failed to restore tenant schema"
    fi
    
    # Clean up files
    if [[ "$backup_file" == *.gz ]] && [ -f "$sql_file" ]; then
        rm -f "$sql_file"
        [ -f "$sql_file.bak" ] && rm -f "$sql_file.bak"
    fi
}

# Restore all tenants from tar.gz
restore_all_tenants() {
    local backup_file="$1"
    local force="${2:-false}"
    
    log "Restoring all tenant schemas from: $backup_file"
    
    verify_backup "$backup_file"
    
    # Drop existing tenant schemas if force is true
    if [ "$force" = "true" ]; then
        drop_tenant_schemas true
    fi
    
    # Extract tar.gz to temporary directory
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Restore each tenant schema
    for tenant_backup in "$temp_dir"/tenant_*.sql.gz; do
        if [ -f "$tenant_backup" ]; then
            restore_tenant_schema "$tenant_backup"
        fi
    done
    
    # Clean up
    rm -rf "$temp_dir"
    
    log "All tenant schemas restored successfully"
}

# Restore full database
restore_full_database() {
    local backup_file="$1"
    local force="${2:-false}"
    
    log "Restoring full database from: $backup_file"
    
    verify_backup "$backup_file"
    
    if [ "$force" != "true" ]; then
        echo "This will replace the entire database. Are you sure? (yes/no)"
        read -r confirmation
        if [ "$confirmation" != "yes" ]; then
            log "Restore cancelled by user"
            exit 0
        fi
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Decompress if needed
    local sql_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        sql_file="${backup_file%.gz}"
        gunzip -c "$backup_file" > "$sql_file"
    fi
    
    # Drop and recreate database
    log "Dropping and recreating database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
        "DROP DATABASE IF EXISTS \"$DB_NAME\";" > /dev/null
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
        "CREATE DATABASE \"$DB_NAME\";" > /dev/null
    
    # Restore database
    log "Restoring database..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file" > /dev/null 2>> "$BACKUP_DIR/restore.log"; then
        log "Database restored successfully"
    else
        error "Failed to restore database"
    fi
    
    # Clean up decompressed file if it was created
    if [[ "$backup_file" == *.gz ]] && [ -f "$sql_file" ]; then
        rm -f "$sql_file"
    fi
}

# Run post-restore tasks
post_restore_tasks() {
    log "Running post-restore tasks..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Generate Prisma client
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        log "Generating Prisma client..."
        cd "$PROJECT_ROOT"
        npm run db:generate > /dev/null 2>&1 || warning "Failed to generate Prisma client"
    fi
    
    # Validate database schema
    log "Validating database schema..."
    if command -v npx &> /dev/null && [ -f "$PROJECT_ROOT/prisma/schema.prisma" ]; then
        cd "$PROJECT_ROOT"
        npx prisma db pull --force > /dev/null 2>&1 || warning "Schema validation failed"
    fi
    
    log "Post-restore tasks completed"
}

# Main restore function
main() {
    local restore_type="$1"
    local backup_file="$2"
    local force="${3:-false}"
    
    log "Starting database restore (type: $restore_type)"
    
    check_dependencies
    test_connection
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Handle S3 downloads
    if [[ "$backup_file" == s3://* ]]; then
        backup_file=$(download_from_s3 "$(basename "$backup_file")")
    elif [[ "$backup_file" == */* ]] && [ ! -f "$backup_file" ]; then
        # Try to find file in backup directory
        local local_backup="$BACKUP_DIR/$backup_file"
        if [ -f "$local_backup" ]; then
            backup_file="$local_backup"
        else
            error "Backup file not found: $backup_file"
        fi
    fi
    
    # Create pre-restore backup unless force is true
    if [ "$force" != "true" ]; then
        create_pre_restore_backup
    fi
    
    case "$restore_type" in
        "global")
            restore_global_schema "$backup_file" "$force"
            ;;
        "tenant")
            restore_tenant_schema "$backup_file"
            ;;
        "tenants")
            restore_all_tenants "$backup_file" "$force"
            ;;
        "full")
            restore_full_database "$backup_file" "$force"
            ;;
        *)
            error "Invalid restore type: $restore_type. Use: global, tenant, tenants, or full"
            ;;
    esac
    
    # Run post-restore tasks
    post_restore_tasks
    
    log "Database restore completed successfully"
}

# Script usage
usage() {
    cat << EOF
Usage: $0 <restore_type> <backup_file> [force]

Restore types:
    global    - Restore only global schema (public)
    tenant    - Restore single tenant schema
    tenants   - Restore all tenant schemas from tar.gz
    full      - Restore entire database

Arguments:
    backup_file   - Path to backup file or S3 URL
    force         - Skip confirmations (optional)

Commands:
    list-local    - List available local backups
    list-s3       - List available S3 backups

Examples:
    $0 full /path/to/backup.sql.gz
    $0 global global_schema_20231201_120000.sql.gz force
    $0 tenants all_tenants_20231201_120000.tar.gz
    $0 tenant tenant_uuid_20231201_120000.sql.gz
    
    # From S3
    $0 full s3://my-bucket/backups/full_database_20231201_120000.sql.gz
    
    # List backups
    $0 list-local
    $0 list-s3
EOF
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    list-local)
        list_backups "local"
        exit 0
        ;;
    list-s3)
        list_backups "s3"
        exit 0
        ;;
    global|tenant|tenants|full)
        if [ -z "${2:-}" ]; then
            error "Backup file is required"
        fi
        main "$1" "$2" "${3:-false}"
        ;;
    *)
        usage
        exit 1
        ;;
esac
