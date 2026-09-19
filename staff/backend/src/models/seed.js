import { getPool, initDatabase } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seedInitialData() {
  const pool = getPool();

  // 1. Check existing users
  const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
  if (users[0].count === 0) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);

    await pool.query(`
      INSERT INTO users (id, name, email, password_hash, auth_identifier, role, active) VALUES
      (?, 'Aadarsh Sharma', 'staff@mrx.com', ?, 'STAFF-001', 'STAFF', 1),
      (?, 'System Admin', 'admin@mrx.com', ?, 'ADMIN-001', 'ADMIN', 1)
    `, [uuidv4(), staffHash, uuidv4(), adminHash]);
    console.log('✅ Seeded default users (staff@mrx.com / staff123, admin@mrx.com / admin123)');
  }

  // 2. Check existing devices
  const [devices] = await pool.query('SELECT COUNT(*) as count FROM devices');
  if (devices[0].count === 0) {
    console.log('🌱 Seeding sample devices matching PRD screenshots...');
    
    const sampleDevices = [
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
        status: 'IN_HAND',
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
        status: 'IN_HAND',
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
        status: 'IN_HAND',
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
        status: 'IN_HAND',
        intake_date: '2026-09-13',
        image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=150'
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
        status: 'IN_HAND',
        intake_date: '2026-09-12',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=150'
      },
      {
        brand: 'Google',
        model: 'Pixel 6',
        ram: 8,
        storage: 128,
        colour: 'Sorta Seafoam',
        condition: 'Good',
        purchase_amount: 22000,
        paid_by: 'Neha',
        imei: '357293847561092',
        status: 'IN_HAND',
        intake_date: '2026-09-11',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=150'
      },
      {
        brand: 'Vivo',
        model: 'Vivo V27',
        ram: 8,
        storage: 256,
        colour: 'Noble Black',
        condition: 'Good',
        purchase_amount: 18500,
        paid_by: 'Rohit',
        imei: '864209753642190',
        status: 'IN_HAND',
        intake_date: '2026-09-10',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=150'
      },
      // Devices in Old Inventory (Intake)
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
        brand: 'Samsung',
        model: 'Galaxy S21',
        ram: 8,
        storage: 256,
        colour: 'Violet',
        condition: 'Good',
        purchase_amount: 22000,
        paid_by: 'Aadarsh',
        imei: '358749120563421',
        status: 'OLD_INVENTORY',
        intake_date: '2026-09-12',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=150'
      },
      // Devices in Repair Stock
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
        repair_issue: 'Display glass cracked, touch working',
        technician: 'Aman Tech',
        repair_cost: 1500,
        image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=150'
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S22',
        ram: 8,
        storage: 128,
        colour: 'White',
        condition: 'Good',
        purchase_amount: 24500,
        paid_by: 'Aadarsh',
        imei: '358240951999901',
        status: 'IN_REPAIR',
        intake_date: '2026-09-14',
        repair_issue: 'Charging port loose connection',
        technician: 'Vikram',
        repair_cost: 800,
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=150'
      },
      // Devices in Rejected Stock
      {
        brand: 'Apple',
        model: 'iPhone 11',
        ram: 4,
        storage: 64,
        colour: 'Black',
        condition: 'Defective',
        purchase_amount: 18000,
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

      // If in repair, add repair log
      if (item.status === 'IN_REPAIR' && item.repair_issue) {
        await pool.query(`
          INSERT INTO repairs (id, device_id, issue_description, technician_name, repair_cost, status)
          VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS')
        `, [uuidv4(), devId, item.repair_issue, item.technician, item.repair_cost || 0]);
      }

      // If in rejected, add rejection log
      if (item.status === 'REJECTED' && item.rejection_reason) {
        await pool.query(`
          INSERT INTO rejections (id, device_id, description)
          VALUES (?, ?, ?)
        `, [uuidv4(), devId, item.rejection_reason]);
      }

      // Status history entry
      await pool.query(`
        INSERT INTO device_status_history (id, device_id, from_status, to_status, reason)
        VALUES (?, ?, NULL, ?, 'Initial intake')
      `, [uuidv4(), devId, item.status]);
    }

    console.log('✅ Seeded demo inventory devices');
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
