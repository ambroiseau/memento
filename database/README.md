# Database Schema Documentation

## 📋 Overview

This directory contains the current database schema documentation for the Memento app.

## 🗂️ Files

- `current_schema_backup.sql` - Complete current database schema (backup of all migrations)
- `README.md` - This documentation file

## 🗑️ Removed Migration Files

The following migration files were removed on 2025-01-18:

- `001_create_telegram_integration_tables.sql` - Created external data sources tables
- `003_add_telegram_support_to_posts.sql` - Added source_type and metadata to posts
- `004_add_image_url_to_post_images.sql` - Added image_url column to post_images
- `005_add_slack_support_fixed.sql` - Added Slack support to constraints

## 🏗️ Current Database Schema

The current database includes the following tables and modifications:

### Core Tables
- `external_data_sources` - Configuration for external data sources (Telegram, Slack, etc.)
- `external_posts` - Metadata for posts imported from external sources
- `posts` - Enhanced with `source_type` and `metadata` columns
- `post_images` - Enhanced with `source`, `external_post_id`, `family_id`, and `image_url` columns

### Key Features
- **External Data Sources**: Support for Telegram, Slack, WhatsApp, Email
- **Row Level Security**: Proper RLS policies for data access
- **Indexes**: Optimized for performance
- **Constraints**: Data validation and referential integrity
- **Triggers**: Automatic timestamp updates

## 🔄 Recreating the Database

If you need to recreate the database from scratch, use the `current_schema_backup.sql` file:

```sql
-- Run this file to recreate the complete current schema
\i database/current_schema_backup.sql
```

## ⚠️ Important Notes

- **No Migration History**: The migration history has been removed
- **Schema Backup**: The complete current schema is preserved in `current_schema_backup.sql`
- **Production**: Make sure your production database matches this schema
- **Team**: Other developers will need to use the schema backup to set up their local databases

## 🚀 Next Steps

If you want to add new database changes in the future, consider:
1. Creating a new migration system
2. Using Supabase's built-in migration tools
3. Documenting schema changes in this README
