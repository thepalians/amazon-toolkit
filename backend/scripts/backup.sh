#!/bin/bash
# Amazon Seller Toolkit - Database Backup Script
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/www/palians/amazon-seller-toolkit/backups"
DB_NAME="amazon_tool"
DB_USER="aqidul_amazon"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
if [ $? -ne 0 ]; then
  echo "Error: mysqldump failed. Backup aborted."
  rm -f "$BACKUP_DIR/backup_$TIMESTAMP.sql"
  exit 1
fi
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
