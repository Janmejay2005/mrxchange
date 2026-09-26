import { getPool, initDatabase } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seedInitialData() {
  const pool = getPool();

  // 1. Seed Users (Including requested Staff23 / staff123 and Admin23 / admin123)
  const staffHash = await bcrypt.hash('staff123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  const defaultUsers = [
    { name: 'Staff User', email: 'staff23@mrx.com', identifier: 'Staff23', role: 'STAFF', pass: staffHash },
    { name: 'Super Administrator', email: 'admin23@mrx.com', identifier: 'Admin23', role: 'SUPERADMIN', pass: adminHash },
    { name: 'Jeet (Admin)', email: 'jeet@mrx.com', identifier: 'Jeet', role: 'ADMIN', pass: adminHash },
    { name: 'Sunal (Admin)', email: 'sunal@mrx.com', identifier: 'Sunal', role: 'ADMIN', pass: adminHash },
    { name: 'Aadarsh Sharma', email: 'staff@mrx.com', identifier: 'STAFF-001', role: 'STAFF', pass: staffHash },
    { name: 'System Admin', email: 'admin@mrx.com', identifier: 'ADMIN-001', role: 'SUPERADMIN', pass: adminHash },
  ];

  for (const u of defaultUsers) {
    const [exists] = await pool.query('SELECT id FROM users WHERE email = ? OR auth_identifier = ?', [u.email, u.identifier]);
    if (exists.length === 0) {
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, auth_identifier, role, active)
        VALUES (?, ?, ?, ?, ?, ?, true)
      `, [uuidv4(), u.name, u.email, u.pass, u.identifier, u.role]);
    }
  }
  console.log('✅ Users verified and seeded (Staff23 / staff123, Admin23 / admin123, Jeet, Sunal)');
}
}

if (process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await initDatabase();
      await seedInitialData();
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}
