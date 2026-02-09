#!/bin/bash

# Database Backup Script for Ayphen Textile
# Supports both single database and multi-tenant schema backups

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=${RETENTION_DAYS:-30}

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
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

error() {
    log "ERROR: $1" >&2
    exit 1
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check dependencies
check_dependencies() {
    local deps=("pg_dump" "gzip")
    
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

# Backup global schema (users, tenants, sessions)
backup_global_schema() {
    local backup_file="$BACKUP_DIR/global_schema_$TIMESTAMP.sql"
    
    log "Starting global schema backup..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --schema=public \
        --no-owner \
        --no-privileges \
        --verbose \
        > "$backup_file" 2>> "$BACKUP_DIR/backup.log"
    
    # Compress backup
    gzip "$backup_file"
    backup_file="${backup_file}.gz"
    
    local file_size=$(du -h "$backup_file" | cut -f1)
    log "Global schema backup completed: $backup_file ($file_size)"
    
    echo "$backup_file"
}

# Get list of tenant schemas
get_tenant_schemas() {
    export PGPASSWORD="$DB_PASSWORD"
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';" \
        | grep -v '^$' | tr -d ' '
}

# Backup individual tenant schema
backup_tenant_schema() {
    local schema_name="$1"
    local backup_file="$BACKUP_DIR/${schema_name}_$TIMESTAMP.sql"
    
    log "Backing up tenant schema: $schema_name"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --schema="$schema_name" \
        --no-owner \
        --no-privileges \
        --verbose \
        > "$backup_file" 2>> "$BACKUP_DIR/backup.log"
    
    # Compress backup
    gzip "$backup_file"
    backup_file="${backup_file}.gz"
    
    local file_size=$(du -h "$backup_file" | cut -f1)
    log "Tenant schema backup completed: $backup_file ($file_size)"
    
    echo "$backup_file"
}

# Backup all tenant schemas
backup_all_tenants() {
    log "Starting tenant schemas backup..."
    
    local tenant_schemas
    tenant_schemas=$(get_tenant_schemas)
    
    if [ -z "$tenant_schemas" ]; then
        log "No tenant schemas found"
        return
    fi
    
    local backup_files=()
    
    while IFS= read -r schema; do
        if [ -n "$schema" ]; then
            local backup_file
            backup_file=$(backup_tenant_schema "$schema")
            backup_files+=("$backup_file")
        fi
    done <<< "$tenant_schemas"
    
    # Create combined tenant backup
    if [ ${#backup_files[@]} -gt 0 ]; then
        local combined_backup="$BACKUP_DIR/all_tenants_$TIMESTAMP.tar.gz"
        tar -czf "$combined_backup" -C "$BACKUP_DIR" $(basename -a "${backup_files[@]}")
        
        local file_size=$(du -h "$combined_backup" | cut -f1)
        log "Combined tenant backup created: $combined_backup ($file_size)"
        
        echo "$combined_backup"
    fi
}

# Full database backup (alternative approach)
backup_full_database() {
    local backup_file="$BACKUP_DIR/full_database_$TIMESTAMP.sql"
    
    log "Starting full database backup..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-privileges \
        --verbose \
        > "$backup_file" 2>> "$BACKUP_DIR/backup.log"
    
    # Compress backup
    gzip "$backup_file"
    backup_file="${backup_file}.gz"
    
    local file_size=$(du -h "$backup_file" | cut -f1)
    log "Full database backup completed: $backup_file ($file_size)"
    
    echo "$backup_file"
}

# Upload backup to S3
upload_to_s3() {
    local backup_file="$1"
    
    if [ -z "$S3_BUCKET" ]; then
        log "S3 bucket not configured, skipping upload"
        return
    fi
    
    log "Uploading backup to S3: s3://$S3_BUCKET/$S3_PREFIX/"
    
    local s3_key="$S3_PREFIX/$(basename "$backup_file")"
    
    if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key" --storage-class STANDARD_IA; then
        log "Backup uploaded successfully to s3://$S3_BUCKET/$s3_key"
    else
        error "Failed to upload backup to S3"
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Local cleanup
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # S3 cleanup (if configured)
    if [ -n "$S3_BUCKET" ]; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | \
            awk '$1 < "'$cutoff_date'" {print $4}' | \
            while read -r key; do
                if [ -n "$key" ]; then
                    aws s3 rm "s3://$S3_BUCKET/$key"
                    log "Deleted old S3 backup: $key"
                fi
            done
    fi
    
    log "Cleanup completed"
}

# Generate backup metadata
generate_metadata() {
    local backup_files=("$@")
    local metadata_file="$BACKUP_DIR/backup_metadata_$TIMESTAMP.json"
    
    cat > "$metadata_file" << EOF
{
    "timestamp": "$TIMESTAMP",
    "database": {
        "host": "$DB_HOST",
        "port": $DB_PORT,
        "name": "$DB_NAME",
        "user": "$DB_USER"
    },
    "backups": [
EOF

    local first=true
    for backup_file in "${backup_files[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$metadata_file"
        fi
        
        local file_size=$(stat -c%s "$backup_file" 2>/dev/null || stat -f%z "$backup_file" 2>/dev/null || echo "0")
        local checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)
        
        cat >> "$metadata_file" << EOF
        {
            "file": "$(basename "$backup_file")",
            "path": "$backup_file",
            "size": $file_size,
            "checksum": "$checksum"
        }
EOF
    done
    
    cat >> "$metadata_file" << EOF
    ],
    "retention_days": $RETENTION_DAYS,
    "s3_bucket": "$S3_BUCKET"
}
EOF
    
    log "Backup metadata generated: $metadata_file"
}

# Main backup function
main() {
    local backup_type="${1:-full}"
    
    log "Starting database backup (type: $backup_type)"
    
    check_dependencies
    test_connection
    
    local backup_files=()
    
    case "$backup_type" in
        "global")
            backup_files+=($(backup_global_schema))
            ;;
        "tenants")
            backup_files+=($(backup_all_tenants))
            ;;
        "full")
            backup_files+=($(backup_full_database))
            ;;
        "separate")
            backup_files+=($(backup_global_schema))
            backup_files+=($(backup_all_tenants))
            ;;
        *)
            error "Invalid backup type: $backup_type. Use: global, tenants, full, or separate"
            ;;
    esac
    
    # Generate metadata
    generate_metadata "${backup_files[@]}"
    
    # Upload to S3 if configured
    for backup_file in "${backup_files[@]}"; do
        upload_to_s3 "$backup_file"
    done
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "Database backup completed successfully"
    
    # Print summary
    echo
    echo "Backup Summary:"
    echo "==============="
    for backup_file in "${backup_files[@]}"; do
        local file_size=$(du -h "$backup_file" | cut -f1)
        echo "  $(basename "$backup_file"): $file_size"
    done
}

# Script usage
usage() {
    cat << EOF
Usage: $0 [backup_type]

Backup types:
    global    - Backup only global schema (public)
    tenants   - Backup only tenant schemas
    full      - Backup entire database (default)
    separate  - Backup global and tenants separately

Environment variables:
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
    S3_BUCKET, S3_PREFIX
    BACKUP_DIR, RETENTION_DAYS

Examples:
    $0                    # Full database backup
    $0 separate          # Separate global and tenant backups
    $0 tenants           # Only tenant schemas
    
    # With custom settings
    RETENTION_DAYS=7 S3_BUCKET=my-backups $0 full
EOF
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    *)
        main "${1:-full}"
        ;;
esac
