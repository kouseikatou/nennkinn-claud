-- Production Database Initialization Script

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS disability_pension_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user
CREATE USER IF NOT EXISTS 'pension_user'@'%' IDENTIFIED BY 'placeholder_password';
GRANT ALL PRIVILEGES ON disability_pension_production.* TO 'pension_user'@'%';

-- Create read-only user for reporting
CREATE USER IF NOT EXISTS 'pension_readonly'@'%' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON disability_pension_production.* TO 'pension_readonly'@'%';

-- Create backup user
CREATE USER IF NOT EXISTS 'pension_backup'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES, SHOW VIEW ON disability_pension_production.* TO 'pension_backup'@'localhost';

-- Performance optimization settings
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB
SET GLOBAL max_connections = 100;
SET GLOBAL query_cache_size = 67108864; -- 64MB
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 2;

-- Enable binary logging for replication/backup
SET GLOBAL log_bin = 'mysql-bin';
SET GLOBAL binlog_format = 'ROW';
SET GLOBAL expire_logs_days = 7;

-- Security settings
SET GLOBAL local_infile = 0;

FLUSH PRIVILEGES;