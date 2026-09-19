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
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `, [uuidv4(), u.name, u.email, u.pass, u.identifier, u.role]);
    }
  }
  console.log('✅ Users verified and seeded (Staff23 / staff123, Admin23 / admin123, Jeet, Sunal)');

  // 2. Check existing devices
  const [devices] = await pool.query('SELECT COUNT(*) as count FROM devices');
  if (devices[0].count === 0) {
    console.log('🌱 Seeding sample devices for Old In-hand, New In-hand, Repair, and Rejections...');
    
    const sampleDevices = [
      // Old In-Hand Devices (Sellable - Seen by both Staff and Superadmin)
      {
        brand: 'Apple',
        model: 'iPhone 13',
        ram: 4,
        storage: 128,
        colour: 'Midnight',
        condition: 'Good',
        purchase_amount: 32000,
        paid_by: 'Rohit',
        imei: '352039847593812',
        status: 'OLD_IN_HAND',
        intake_date: '2026-09-15',
        image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=150'
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S22',
        ram: 8,
        storage: 256,
        colour: 'Phantom Black',
        condition: 'Good',
        purchase_amount: 28000,
        paid_by: 'Aadarsh',
        imei: '358240951234765',
        status: 'OLD_IN_HAND',
        intake_date: '2026-09-14',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=150'
      },
      {
        brand: 'Apple',
        model: 'iPhone 12',
        ram: 4,
        storage: 64,
        colour: 'White',
        condition: 'Fair',
        purchase_amount: 18000,
        paid_by: 'Neha',
        imei: '351682947651903',
        status: 'OLD_IN_HAND',
        intake_date: '2026-09-14',
        image: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=150'
      },
      {
        brand: 'OnePlus',
        model: 'OnePlus 10R',
        ram: 8,
        storage: 128,
        colour: 'Sierra Black',
        condition: 'Good',
        purchase_amount: 20000,
        paid_by: 'Rohit',
        imei: '867985064321098',
        status: 'OLD_IN_HAND',
        intake_date: '2026-09-13',
        image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=150'
      },

      // New In-Hand Devices (Fresh intake - Seen by Superadmin)
      {
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        ram: 6,
        storage: 256,
        colour: 'Space Black',
        condition: 'Fresh',
        purchase_amount: 58000,
        paid_by: 'Jeet',
        imei: '359998877665544',
        status: 'NEW_IN_HAND',
        intake_date: '2026-09-18',
        image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=150'
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S23 Ultra',
        ram: 12,
        storage: 512,
        colour: 'Green',
        condition: 'Fresh',
        purchase_amount: 52000,
        paid_by: 'Sunal',
        imei: '358887766554433',
        status: 'NEW_IN_HAND',
        intake_date: '2026-09-17',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=150'
      },
      {
        brand: 'Google',
        model: 'Pixel 7 Pro',
        ram: 12,
        storage: 128,
        colour: 'Obsidian',
        condition: 'Fresh',
        purchase_amount: 34000,
        paid_by: 'Jeet',
        imei: '357776655443322',
        status: 'NEW_IN_HAND',
        intake_date: '2026-09-17',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=150'
      },

      // Old Inventory (Incoming master intake)
      {
        brand: 'Apple',
        model: 'iPhone 11',
        ram: 4,
        storage: 64,
        colour: 'Green',
        condition: 'Fair',
        purchase_amount: 14000,
        paid_by: 'Rohit',
        imei: '352091743812609',
        status: 'OLD_INVENTORY',
        intake_date: '2026-09-13',
        image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=150'
      },
      {
        brand: 'Xiaomi',
        model: 'Redmi Note 11',
        ram: 6,
        storage: 128,
        colour: 'Blue',
        condition: 'Good',
        purchase_amount: 10000,
        paid_by: 'Aadarsh',
        imei: '864320567981234',
        status: 'OLD_INVENTORY',
        intake_date: '2026-09-12',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=150'
      },

      // Under Repair
      {
        brand: 'Apple',
        model: 'iPhone 11',
        ram: 4,
        storage: 64,
        colour: 'Black',
        condition: 'Fair',
        purchase_amount: 18000,
        paid_by: 'Rohit',
        imei: '352948172635489',
        status: 'IN_REPAIR',
        intake_date: '2026-09-15',
        repair_issue: 'Display glass cracked',
        technician: 'Aman Tech',
        repair_cost: 1500,
        image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=150'
      },
      {
        brand: 'Samsung',
        model: 'Galaxy A53',
        ram: 6,
        storage: 128,
        colour: 'Blue',
        condition: 'Fair',
        purchase_amount: 12000,
        paid_by: 'Sunal',
        imei: '358899112233445',
        status: 'IN_REPAIR',
        intake_date: '2026-09-16',
        repair_issue: 'Battery drain problem',
        technician: 'Ramesh Mobile Care',
        repair_cost: 1200,
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=150'
      },

      // Rejected Devices
      {
        brand: 'Apple',
        model: 'iPhone X',
        ram: 3,
        storage: 64,
        colour: 'Silver',
        condition: 'Defective',
        purchase_amount: 15000,
        paid_by: 'Rohit',
        imei: '352099994812601',
        status: 'REJECTED',
        intake_date: '2026-09-15',
        rejection_reason: 'Screen not working & motherboard IC damaged',
        image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=150'
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S22',
        ram: 8,
        storage: 128,
        colour: 'White',
        condition: 'Defective',
        purchase_amount: 24500,
        paid_by: 'Aadarsh',
        imei: '358240951888802',
        status: 'REJECTED',
        intake_date: '2026-09-14',
        rejection_reason: 'Motherboard dead',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=150'
      },
      {
        brand: 'OnePlus',
        model: '9R',
        ram: 8,
        storage: 128,
        colour: 'Blue',
        condition: 'Defective',
        purchase_amount: 16000,
        paid_by: 'Neha',
        imei: '867985064111222',
        status: 'REJECTED',
        intake_date: '2026-09-13',
        rejection_reason: 'Liquid damage',
        image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=150'
      }
    ];

    let counter = 1;
    for (const item of sampleDevices) {
      const devId = uuidv4();
      const code = `MRX-${String(counter++).padStart(5, '0')}`;

      await pool.query(`
        INSERT INTO devices (
          id, device_code, imei, brand, model, ram, storage, colour, \`condition\`,
          purchase_amount, paid_by, intake_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        devId, code, item.imei, item.brand, item.model, item.ram, item.storage,
        item.colour, item.condition, item.purchase_amount, item.paid_by,
        item.intake_date, item.status
      ]);

      if (item.image) {
        await pool.query(`
          INSERT INTO device_images (id, device_id, url) VALUES (?, ?, ?)
        `, [uuidv4(), devId, item.image]);
      }

      if (item.status === 'IN_REPAIR' && item.repair_issue) {
        await pool.query(`
          INSERT INTO repairs (id, device_id, issue_description, technician_name, repair_cost, status)
          VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS')
        `, [uuidv4(), devId, item.repair_issue, item.technician, item.repair_cost || 0]);
      }

      if (item.status === 'REJECTED' && item.rejection_reason) {
        await pool.query(`
          INSERT INTO rejections (id, device_id, description)
          VALUES (?, ?, ?)
        `, [uuidv4(), devId, item.rejection_reason]);
      }

      await pool.query(`
        INSERT INTO device_status_history (id, device_id, from_status, to_status, reason)
        VALUES (?, ?, NULL, ?, 'Initial intake')
      `, [uuidv4(), devId, item.status]);

      // Seed Central Ledger entry for Acquisition
      await pool.query(`
        INSERT INTO transactions (
          id, transaction_code, transaction_type, flow_type, amount,
          device_id, admin_name, payment_method, transaction_date, description
        ) VALUES (?, ?, 'ACQUISITION', 'DEBIT', ?, ?, ?, 'Bank Transfer', ?, ?)
      `, [
        uuidv4(),
        `TX-ACQ-${String(counter).padStart(5, '0')}`,
        item.purchase_amount,
        devId,
        item.paid_by || 'Jeet',
        item.intake_date,
        `Device acquisition: ${item.brand} ${item.model}`
      ]);
    }
  }

  // 3. Seed Central Ledger Transactions (Sales, Repairs, Operating Expenses, Capital Investments)
  const [txCount] = await pool.query('SELECT COUNT(*) as count FROM transactions WHERE transaction_type != "ACQUISITION"');
  if (txCount[0].count === 0) {
    console.log('🌱 Seeding Central Ledger transactions, sales, and capital movements...');

    const demoTransactions = [
      // Sales
      { code: 'TX-SL-001', type: 'SALE', flow: 'CREDIT', amount: 38000, admin: 'Jeet', date: '2026-09-17', desc: 'Sold iPhone 13 128GB Midnight to Amit Verma' },
      { code: 'TX-SL-002', type: 'SALE', flow: 'CREDIT', amount: 33000, admin: 'Sunal', date: '2026-09-16', desc: 'Sold Galaxy S22 256GB to Priya Singh' },
      { code: 'TX-SL-003', type: 'SALE', flow: 'CREDIT', amount: 24500, admin: 'Jeet', date: '2026-09-15', desc: 'Sold OnePlus 10R 128GB to Rajesh Kumar' },
      { code: 'TX-SL-004', type: 'SALE', flow: 'CREDIT', amount: 22000, admin: 'Sunal', date: '2026-09-14', desc: 'Sold iPhone 12 64GB to Vikram Rathore' },
      { code: 'TX-SL-005', type: 'SALE', flow: 'CREDIT', amount: 65000, admin: 'Jeet', date: '2026-09-18', desc: 'Sold iPhone 14 Pro 256GB to Kunal Shah' },

      // Expenses (Salary, Repair, Utilities)
      { code: 'TX-EXP-001', type: 'EXPENSE', flow: 'DEBIT', amount: 25000, admin: 'Jeet', date: '2026-09-10', desc: 'Monthly Technician Salaries - Aman Tech & Staff' },
      { code: 'TX-EXP-002', type: 'EXPENSE', flow: 'DEBIT', amount: 6800, admin: 'Sunal', date: '2026-09-12', desc: 'Display & Battery Replacement Spare Parts' },
      { code: 'TX-EXP-003', type: 'EXPENSE', flow: 'DEBIT', amount: 4500, admin: 'Jeet', date: '2026-09-14', desc: 'Shop Electricity & Fiber Internet Bill' },

      // Capital Investments
      { code: 'TX-INV-001', type: 'INVESTMENT', flow: 'CREDIT', amount: 500000, admin: 'Jeet', date: '2026-09-01', desc: 'Initial Mobile Inventory Capital - Jeet' },
      { code: 'TX-INV-002', type: 'INVESTMENT', flow: 'CREDIT', amount: 150000, admin: 'Sunal', date: '2026-09-05', desc: 'Diagnostic & Repair Equipment Investment - Sunal' },
      { code: 'TX-INV-003', type: 'INVESTMENT', flow: 'CREDIT', amount: 200000, admin: 'Jeet', date: '2026-09-08', desc: 'Working Capital Reserve - Jeet' }
    ];

    for (const tx of demoTransactions) {
      await pool.query(`
        INSERT INTO transactions (
          id, transaction_code, transaction_type, flow_type, amount,
          admin_name, payment_method, transaction_date, description
        ) VALUES (?, ?, ?, ?, ?, ?, 'Bank Transfer', ?, ?)
      `, [uuidv4(), tx.code, tx.type, tx.flow, tx.amount, tx.admin, tx.date, tx.desc]);
    }

    // Seed Expenses Table
    const demoExpenses = [
      { code: 'EXP-001', category: 'SALARY', amount: 25000, admin: 'Jeet', date: '2026-09-10', recipient: 'Technician Staff', remarks: 'Monthly technician salaries' },
      { code: 'EXP-002', category: 'REPAIRING_COST', amount: 6800, admin: 'Sunal', date: '2026-09-12', recipient: 'Sunil Electronics Wholesale', remarks: 'Displays & Batteries batch purchase' },
      { code: 'EXP-003', category: 'OTHER', amount: 4500, admin: 'Jeet', date: '2026-09-14', recipient: 'Power Corporation', remarks: 'Shop electricity & internet' },
      { code: 'EXP-004', category: 'REPAIRING_COST', amount: 2400, admin: 'Sunal', date: '2026-09-16', recipient: 'Aman Tech', remarks: 'Specialized Motherboard IC micro-soldering' },
      { code: 'EXP-005', category: 'OTHER', amount: 1800, admin: 'Jeet', date: '2026-09-17', recipient: 'Packaging Supply Co.', remarks: 'Phone boxes, bubble wraps & tamper tapes' }
    ];

    for (const exp of demoExpenses) {
      await pool.query(`
        INSERT INTO expenses (
          id, expense_code, category, amount, expense_date, admin_name, recipient, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), exp.code, exp.category, exp.amount, exp.date, exp.admin, exp.recipient, exp.remarks]);
    }

    // Seed Investments Table
    const demoInvestments = [
      { code: 'INV-001', type: 'INVENTORY', amount: 500000, investor: 'Jeet', date: '2026-09-01', remarks: 'Mobile inventory bulk purchase capital' },
      { code: 'INV-002', type: 'EQUIPMENT', amount: 150000, investor: 'Sunal', date: '2026-09-05', remarks: 'Screen separators, soldering stations & microscopes' },
      { code: 'INV-003', type: 'WORKING_CAPITAL', amount: 200000, investor: 'Jeet', date: '2026-09-08', remarks: 'Emergency float & daily operational buffer' }
    ];

    for (const inv of demoInvestments) {
      await pool.query(`
        INSERT INTO investments (
          id, investment_code, investment_type, amount, investment_date, investor_name, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), inv.code, inv.type, inv.amount, inv.date, inv.investor, inv.remarks]);
    }

    console.log('✅ Seeded Central Ledger, Expenses, and Capital Investments');
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
