-- Reset E-Book Database
-- Run this in phpMyAdmin or MySQL Workbench

-- Drop existing database
DROP DATABASE IF EXISTS ebook_platform;

-- Create fresh database
CREATE DATABASE ebook_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE ebook_platform;

-- Database is now ready for Sequelize sync
SELECT 'Database reset successful! Restart your Node.js server.' AS message;
