import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mr_x_change_staff',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool = null;

export async function initDatabase() {
  try {
    // 1. Connect without database to ensure it exists
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await tempConnection.end();

    // 2. Create connection pool
    pool = mysql.createPool(dbConfig);

    // 3. Create tables if not exist
    await createTables();

    console.log('✅ MySQL Database initialized successfully');
    return pool;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error.message);
    throw error;
  }
}

async function createTables() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      auth_identifier VARCHAR(100),
      role ENUM('ADMIN', 'STAFF') DEFAULT 'STAFF',
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const devicesTable = `
    CREATE TABLE IF NOT EXISTS devices (
      id VARCHAR(36) PRIMARY KEY,
      device_code VARCHAR(50) UNIQUE NOT NULL,
      imei VARCHAR(50) UNIQUE NULL,
      brand VARCHAR(100) NOT NULL,
      model VARCHAR(150) NOT NULL,
      ram INT NOT NULL,
      storage INT NOT NULL,
      colour VARCHAR(50) NOT NULL,
      variant VARCHAR(100) NULL,
      \`condition\` VARCHAR(50) DEFAULT 'Good',
      purchase_amount DECIMAL(12, 2) NOT NULL,
      target_selling_price DECIMAL(12, 2) NULL,
      paid_by VARCHAR(100) DEFAULT 'Rohit',
      payment_method VARCHAR(50) DEFAULT 'UPI',
      supplier_name VARCHAR(150) NULL,
      intake_date DATE NOT NULL,
      remarks TEXT NULL,
      status ENUM('OLD_INVENTORY', 'IN_HAND', 'IN_REPAIR', 'REJECTED', 'SOLD', 'DISPOSED') DEFAULT 'OLD_INVENTORY',
      created_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_model (model),
      INDEX idx_imei (imei),
      INDEX idx_brand (brand),
      INDEX idx_intake_date (intake_date)
    );
  `;

  const deviceImagesTable = `
    CREATE TABLE IF NOT EXISTS device_images (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) NOT NULL,
      url TEXT NOT NULL,
      storage_key VARCHAR(255) NULL,
      caption VARCHAR(255) NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );
  `;

  const repairsTable = `
    CREATE TABLE IF NOT EXISTS repairs (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) NOT NULL,
      issue_description TEXT NOT NULL,
      technician_name VARCHAR(150) NULL,
      repair_cost DECIMAL(10, 2) DEFAULT 0.00,
      status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'IN_PROGRESS',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME NULL,
      notes TEXT NULL,
      created_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
      INDEX idx_repair_status (status)
    );
  `;

  const rejectionsTable = `
    CREATE TABLE IF NOT EXISTS rejections (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) NOT NULL,
      category VARCHAR(100) NULL,
      description TEXT NOT NULL,
      resolution VARCHAR(100) NULL,
      resolved_at DATETIME NULL,
      notes TEXT NULL,
      created_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );
  `;

  const salesTable = `
    CREATE TABLE IF NOT EXISTS sales (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) UNIQUE NOT NULL,
      selling_price DECIMAL(12, 2) NOT NULL,
      discount_amount DECIMAL(10, 2) DEFAULT 0.00,
      customer_name VARCHAR(150) NULL,
      customer_phone VARCHAR(50) NULL,
      payment_method VARCHAR(50) DEFAULT 'Cash',
      payment_status ENUM('PAID', 'PARTIAL', 'PENDING') DEFAULT 'PAID',
      sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      remarks TEXT NULL,
      sold_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
      INDEX idx_sold_at (sold_at)
    );
  `;

  const deviceStatusHistoryTable = `
    CREATE TABLE IF NOT EXISTS device_status_history (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) NOT NULL,
      from_status VARCHAR(50) NULL,
      to_status VARCHAR(50) NOT NULL,
      reason TEXT NULL,
      changed_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
      INDEX idx_history_device (device_id)
    );
  `;

  const activityLogsTable = `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(36) PRIMARY KEY,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(36) NOT NULL,
      action VARCHAR(100) NOT NULL,
      before_data JSON NULL,
      after_data JSON NULL,
      actor_id VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(usersTable);
  await pool.query(devicesTable);
  await pool.query(deviceImagesTable);
  await pool.query(repairsTable);
  await pool.query(rejectionsTable);
  await pool.query(salesTable);
  await pool.query(deviceStatusHistoryTable);
  await pool.query(activityLogsTable);
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initDatabase() first.');
  }
  return pool;
}
