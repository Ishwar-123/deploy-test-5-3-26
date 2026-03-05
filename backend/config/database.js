import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ebook_platform',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false
    }
  }
);

// Test connection and sync database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database Connected Successfully');

    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Sync all models 
    // Using sync() instead of sync({ alter: true }) to prevent duplicate index accumulation
    // For schema changes, use dedicated migration scripts in /migrations folder
    await sequelize.sync();

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Database tables synchronized');
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
    console.error('Make sure XAMPP MySQL is running on port 3306');

    // If "too many keys" error, suggest database reset
    if (error.message.includes('Too many keys')) {
      console.error('\n⚠️  FIX: Too many indexes detected!');
      console.error('Run this in MySQL to reset:');
      console.error('   DROP DATABASE ebook_platform;');
      console.error('   CREATE DATABASE ebook_platform;');
      console.error('Then restart the server.\n');
    }

    process.exit(1);
  }
};

export { sequelize, connectDB };
export default connectDB;
