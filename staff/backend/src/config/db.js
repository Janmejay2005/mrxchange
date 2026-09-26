import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { createMockPool } from './mockDb.js';
dotenv.config();

const isCloudDb = !!process.env.DATABASE_URL || process.env.NODE_ENV === 'production';

let pool = null;

async function createPgPool(connectionString) {
  const { default: pg } = await import('pg');
  const pgPool = new pg.Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
  });

  const queryPg = async (executor, sql, params = []) => {
    let paramIdx = 1;
    let pgSql = sql
      .replace(/`condition`/gi, '"condition"')
      .replace(/`/g, '')
      .replace(/CURDATE\(\)/gi, 'CURRENT_DATE')
      .replace(/DATE_SUB\(CURRENT_DATE,\s*INTERVAL\s*7\s*DAY\)/gi, "(CURRENT_DATE - INTERVAL '7 days')")
      .replace(/DATE_SUB\(CURDATE\(\),\s*INTERVAL\s*7\s*DAY\)/gi, "(CURRENT_DATE - INTERVAL '7 days')")
      .replace(/GROUP_CONCAT\((.*?)\s+ORDER\s+BY\s+(.*?)\s+SEPARATOR\s+('\|\|\|'|"[|]{3}")\)/gi, "STRING_AGG($1, $3 ORDER BY $2)")
      .replace(/GROUP_CONCAT\((.*?)\s+SEPARATOR\s+('\|\|\|'|"[|]{3}")\)/gi, "STRING_AGG($1, $2)")
      .replace(/GROUP_CONCAT\((.*?)\)/gi, "STRING_AGG($1, ',')");

    pgSql = pgSql.replace(/\?/g, () => `$${paramIdx++}`);
    const res = await executor.query(pgSql, params);

    const rows = (res.rows || []).map(row => {
      if (row && typeof row === 'object') {
        const normalized = {};
        for (const k of Object.keys(row)) {
          normalized[k] = row[k];
        }
        if (normalized.total !== undefined) normalized.total = Number(normalized.total);
        if (normalized.count !== undefined) normalized.count = Number(normalized.count);
        return normalized;
      }
      return row;
    });

    return [rows, []];
  };

  return {
    isPg: true,
    async getConnection() {
      const client = await pgPool.connect();
      return {
        async query(sql, params = []) {
          return queryPg(client, sql, params);
        },
        async beginTransaction() { await client.query('BEGIN'); },
        async commit() { await client.query('COMMIT'); },
        async rollback() { await client.query('ROLLBACK'); },
        release() { client.release(); }
      };
    },
    async query(sql, params = []) {
      return queryPg(pgPool, sql, params);
    }
  };
}

export async function initDatabase() {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
      pool = await createPgPool(dbUrl);
      console.log('✅ Render PostgreSQL Database connected successfully');
    } else if (dbUrl) {
      pool = mysql.createPool({
        uri: dbUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
      });
      console.log('✅ MySQL Cloud Database connected successfully');
    } else {
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mr_x_change_staff',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      };

      // In local dev, ensure database exists
      if (!isCloudDb) {
        try {
          const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
          });
          await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
          await tempConnection.end();
        } catch (dbCreateErr) {
          console.warn('⚠️ Auto-create database skipped:', dbCreateErr.message);
        }
      }

      pool = mysql.createPool(dbConfig);
    }

    // Ping test
    await pool.query('SELECT 1');

    // Create tables if not exist
    await createTables();

    console.log('✅ Central Database initialized successfully');
    return pool;
  } catch (error) {
    console.warn('⚠️ Database connection falling back to persistent file store:', error.message);
    pool = createMockPool();
    return pool;
  }
}

async function createPgTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      auth_identifier VARCHAR(100),
      role VARCHAR(50) DEFAULT 'STAFF',
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS devices (
      id VARCHAR(36) PRIMARY KEY,
      device_code VARCHAR(50) UNIQUE NOT NULL,
      imei VARCHAR(50) UNIQUE NULL,
      brand VARCHAR(100) NOT NULL,
      model VARCHAR(150) NOT NULL,
      ram INT NOT NULL,
      storage INT NOT NULL,
      colour VARCHAR(50) NOT NULL,
      variant VARCHAR(100) NULL,
      "condition" VARCHAR(50) DEFAULT 'Good',
      purchase_amount DECIMAL(12, 2) NOT NULL,
      target_selling_price DECIMAL(12, 2) NULL,
      paid_by VARCHAR(100) DEFAULT 'Rohit',
      payment_method VARCHAR(50) DEFAULT 'UPI',
      supplier_name VARCHAR(150) NULL,
      intake_date DATE NOT NULL,
      remarks TEXT NULL,
      status VARCHAR(50) DEFAULT 'OLD_INVENTORY',
      created_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);`,
    `CREATE INDEX IF NOT EXISTS idx_devices_model ON devices(model);`,
    `CREATE INDEX IF NOT EXISTS idx_devices_imei ON devices(imei);`,
    `CREATE INDEX IF NOT EXISTS idx_devices_brand ON devices(brand);`,
    `CREATE INDEX IF NOT EXISTS idx_devices_intake_date ON devices(intake_date);`,

    `CREATE TABLE IF NOT EXISTS device_images (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) NOT NULL,
      url TEXT NOT NULL,
      storage_key VARCHAR(255) NULL,
      caption VARCHAR(255) NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS repairs (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) NOT NULL,
      issue_description TEXT NOT NULL,
      technician_name VARCHAR(150) NULL,
      repair_cost DECIMAL(10, 2) DEFAULT 0.00,
      status VARCHAR(50) DEFAULT 'IN_PROGRESS',
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      notes TEXT NULL,
      created_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);`,

    `CREATE TABLE IF NOT EXISTS rejections (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) NOT NULL,
      category VARCHAR(100) NULL,
      description TEXT NOT NULL,
      resolution VARCHAR(100) NULL,
      resolved_at TIMESTAMP NULL,
      notes TEXT NULL,
      created_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS sales (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) UNIQUE NOT NULL,
      selling_price DECIMAL(12, 2) NOT NULL,
      discount_amount DECIMAL(10, 2) DEFAULT 0.00,
      customer_name VARCHAR(150) NULL,
      customer_phone VARCHAR(50) NULL,
      payment_method VARCHAR(50) DEFAULT 'Cash',
      payment_type VARCHAR(50) DEFAULT 'COMPLETE',
      payment_status VARCHAR(50) DEFAULT 'PAID',
      sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      remarks TEXT NULL,
      sold_by VARCHAR(100) DEFAULT 'Rohit',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at);`,

    `CREATE TABLE IF NOT EXISTS device_status_history (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(36) NOT NULL,
      from_status VARCHAR(50) NULL,
      to_status VARCHAR(50) NOT NULL,
      reason TEXT NULL,
      changed_by VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_hist_device ON device_status_history(device_id);`,

    `CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY,
      transaction_code VARCHAR(50) UNIQUE NOT NULL,
      transaction_type VARCHAR(50) NOT NULL,
      flow_type VARCHAR(50) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      device_id VARCHAR(36) NULL,
      reference_id VARCHAR(50) NULL,
      admin_name VARCHAR(100) DEFAULT 'Admin23',
      payment_method VARCHAR(50) DEFAULT 'Cash',
      transaction_date DATE NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(transaction_date);`,
    `CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(transaction_type);`,
    `CREATE INDEX IF NOT EXISTS idx_tx_admin ON transactions(admin_name);`,

    `CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(36) PRIMARY KEY,
      expense_code VARCHAR(50) UNIQUE NOT NULL,
      category VARCHAR(50) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      expense_date DATE NOT NULL,
      admin_name VARCHAR(100) DEFAULT 'Admin23',
      recipient VARCHAR(150) NULL,
      remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_exp_date ON expenses(expense_date);`,
    `CREATE INDEX IF NOT EXISTS idx_exp_cat ON expenses(category);`,
    `CREATE INDEX IF NOT EXISTS idx_exp_admin ON expenses(admin_name);`,

    `CREATE TABLE IF NOT EXISTS investments (
      id VARCHAR(36) PRIMARY KEY,
      investment_code VARCHAR(50) UNIQUE NOT NULL,
      investment_type VARCHAR(50) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      investment_date DATE NOT NULL,
      investor_name VARCHAR(100) DEFAULT 'Jeet',
      remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_inv_date ON investments(investment_date);`,
    `CREATE INDEX IF NOT EXISTS idx_inv_type ON investments(investment_type);`,
    `CREATE INDEX IF NOT EXISTS idx_inv_name ON investments(investor_name);`,

    `CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(36) PRIMARY KEY,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(36) NOT NULL,
      action VARCHAR(100) NOT NULL,
      before_data TEXT NULL,
      after_data TEXT NULL,
      actor_id VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const q of queries) {
    await pool.query(q);
  }
}

async function createTables() {
  if (pool && pool.isPg) {
    await createPgTables();
    return;
  }
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      auth_identifier VARCHAR(100),
      role ENUM('SUPERADMIN', 'ADMIN', 'STAFF') DEFAULT 'STAFF',
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
      status ENUM('OLD_INVENTORY', 'OLD_IN_HAND', 'NEW_IN_HAND', 'IN_HAND', 'IN_REPAIR', 'REJECTED', 'SOLD', 'DISPOSED') DEFAULT 'OLD_INVENTORY',
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
      payment_type ENUM('COMPLETE', 'INSTALLMENT') DEFAULT 'COMPLETE',
      payment_status ENUM('PAID', 'PARTIAL', 'PENDING') DEFAULT 'PAID',
      sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      remarks TEXT NULL,
      sold_by VARCHAR(100) DEFAULT 'Rohit',
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

  const transactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY,
      transaction_code VARCHAR(50) UNIQUE NOT NULL,
      transaction_type ENUM('ACQUISITION', 'REPAIR', 'REJECTION', 'SALE', 'EXPENSE', 'INVESTMENT') NOT NULL,
      flow_type ENUM('DEBIT', 'CREDIT') NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      device_id VARCHAR(36) NULL,
      reference_id VARCHAR(50) NULL,
      admin_name VARCHAR(100) DEFAULT 'Admin23',
      payment_method VARCHAR(50) DEFAULT 'Cash',
      transaction_date DATE NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tx_date (transaction_date),
      INDEX idx_tx_type (transaction_type),
      INDEX idx_tx_admin (admin_name)
    );
  `;

  const expensesTable = `
    CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(36) PRIMARY KEY,
      expense_code VARCHAR(50) UNIQUE NOT NULL,
      category ENUM('SALARY', 'REPAIRING_COST', 'OTHER') NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      expense_date DATE NOT NULL,
      admin_name VARCHAR(100) DEFAULT 'Admin23',
      recipient VARCHAR(150) NULL,
      remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_exp_date (expense_date),
      INDEX idx_exp_cat (category),
      INDEX idx_exp_admin (admin_name)
    );
  `;

  const investmentsTable = `
    CREATE TABLE IF NOT EXISTS investments (
      id VARCHAR(36) PRIMARY KEY,
      investment_code VARCHAR(50) UNIQUE NOT NULL,
      investment_type ENUM('INVENTORY', 'EQUIPMENT', 'WORKING_CAPITAL', 'OTHER') NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      investment_date DATE NOT NULL,
      investor_name VARCHAR(100) DEFAULT 'Jeet',
      remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_inv_date (investment_date),
      INDEX idx_inv_type (investment_type),
      INDEX idx_inv_name (investor_name)
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
  await pool.query(transactionsTable);
  await pool.query(expensesTable);
  await pool.query(investmentsTable);
  await pool.query(activityLogsTable);
}

export function getPool() {
  if (!pool) {
    pool = createMockPool();
  }
  return pool;
}

