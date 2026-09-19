// In-memory Mock Database Store for local testing and offline fallback when MySQL is not connected
import { v4 as uuidv4 } from 'uuid';

let mockDevices = [
  {
    id: 'mock-dev-1',
    device_code: 'MRX-00001',
    imei: '352039847593812',
    brand: 'Apple',
    model: 'iPhone 13',
    ram: 4,
    storage: 128,
    colour: 'Midnight Black',
    condition: 'Fresh',
    purchase_amount: 32000,
    paid_by: 'Rohit',
    payment_method: 'UPI',
    intake_date: '2026-09-15',
    status: 'OLD_IN_HAND',
    image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200',
    created_at: new Date('2026-09-15')
  },
  {
    id: 'mock-dev-2',
    device_code: 'MRX-00002',
    imei: '358240951234765',
    brand: 'Samsung',
    model: 'Galaxy S22',
    ram: 8,
    storage: 256,
    colour: 'Phantom Black',
    condition: 'Fresh',
    purchase_amount: 28000,
    paid_by: 'Aadarsh',
    payment_method: 'Cash',
    intake_date: '2026-09-14',
    status: 'OLD_IN_HAND',
    image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200',
    created_at: new Date('2026-09-14')
  },
  {
    id: 'mock-dev-3',
    device_code: 'MRX-00003',
    imei: '351682947651903',
    brand: 'Apple',
    model: 'iPhone 12',
    ram: 4,
    storage: 64,
    colour: 'White',
    condition: 'Fresh',
    purchase_amount: 18000,
    paid_by: 'Neha',
    payment_method: 'UPI',
    intake_date: '2026-09-14',
    status: 'OLD_IN_HAND',
    image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=200',
    created_at: new Date('2026-09-14')
  },
  {
    id: 'mock-dev-4',
    device_code: 'MRX-00004',
    imei: '867985064321098',
    brand: 'OnePlus',
    model: 'OnePlus 10R',
    ram: 8,
    storage: 128,
    colour: 'Sierra Black',
    condition: 'Fresh',
    purchase_amount: 20000,
    paid_by: 'Jeet',
    payment_method: 'Bank Transfer',
    intake_date: '2026-09-13',
    status: 'NEW_IN_HAND',
    image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=200',
    created_at: new Date('2026-09-13')
  },
  {
    id: 'mock-dev-5',
    device_code: 'MRX-00005',
    imei: '864320567981234',
    brand: 'Apple',
    model: 'iPhone 11',
    ram: 4,
    storage: 64,
    colour: 'Green',
    condition: 'Fresh',
    purchase_amount: 14000,
    paid_by: 'Sunal',
    payment_method: 'UPI',
    intake_date: '2026-09-13',
    status: 'NEW_IN_HAND',
    image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200',
    created_at: new Date('2026-09-13')
  },
  {
    id: 'mock-dev-6',
    device_code: 'MRX-00006',
    imei: '357293847561092',
    brand: 'Google',
    model: 'Pixel 6',
    ram: 8,
    storage: 128,
    colour: 'Sorta Seafoam',
    condition: 'Repair',
    purchase_amount: 15000,
    paid_by: 'Rohit',
    payment_method: 'Cash',
    intake_date: '2026-09-12',
    status: 'IN_REPAIR',
    image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200',
    created_at: new Date('2026-09-12')
  },
  {
    id: 'mock-dev-7',
    device_code: 'MRX-00007',
    imei: '864209753642190',
    brand: 'Vivo',
    model: 'V27',
    ram: 8,
    storage: 256,
    colour: 'Noble Black',
    condition: 'Fair',
    purchase_amount: 12000,
    paid_by: 'Aadarsh',
    payment_method: 'UPI',
    intake_date: '2026-09-11',
    status: 'REJECTED',
    image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200',
    created_at: new Date('2026-09-11')
  }
];

let mockTransactions = [
  {
    id: 'tx-1',
    transaction_code: 'TX-INV-001',
    transaction_type: 'INVESTMENT',
    flow_type: 'CREDIT',
    amount: 100000,
    admin_name: 'Jeet',
    payment_method: 'Bank Transfer',
    transaction_date: '2026-09-01',
    description: 'Initial Working Capital Infusion by Jeet'
  },
  {
    id: 'tx-2',
    transaction_code: 'TX-INV-002',
    transaction_type: 'INVESTMENT',
    flow_type: 'CREDIT',
    amount: 100000,
    admin_name: 'Sunal',
    payment_method: 'Bank Transfer',
    transaction_date: '2026-09-01',
    description: 'Initial Working Capital Infusion by Sunal'
  },
  {
    id: 'tx-3',
    transaction_code: 'TX-ACQ-001',
    transaction_type: 'ACQUISITION',
    flow_type: 'DEBIT',
    amount: 32000,
    admin_name: 'Jeet',
    payment_method: 'UPI',
    transaction_date: '2026-09-15',
    description: 'Device Intake: Apple iPhone 13 (Fresh)'
  }
];

let mockExpenses = [
  {
    id: 'exp-1',
    expense_code: 'EXP-001',
    category: 'SALARY',
    amount: 18000,
    admin_name: 'Jeet',
    recipient: 'Rohit Sharma (Store Tech)',
    expense_date: '2026-09-05',
    remarks: 'Staff Monthly Salary'
  },
  {
    id: 'exp-2',
    expense_code: 'EXP-002',
    category: 'REPAIRING_COST',
    amount: 4500,
    admin_name: 'Sunal',
    recipient: 'QuickFix Parts Hub',
    expense_date: '2026-09-08',
    remarks: 'Display & Battery Replacement parts'
  }
];

let mockInvestments = [
  {
    id: 'inv-1',
    investment_code: 'INV-001',
    investment_type: 'WORKING_CAPITAL',
    amount: 100000,
    investor_name: 'Jeet',
    investment_date: '2026-09-01',
    remarks: 'Partner Capital Infusion'
  },
  {
    id: 'inv-2',
    investment_code: 'INV-002',
    investment_type: 'WORKING_CAPITAL',
    amount: 100000,
    investor_name: 'Sunal',
    investment_date: '2026-09-01',
    remarks: 'Partner Capital Infusion'
  }
];

export function createMockPool() {
  console.log('⚡ Mock In-Memory Database initialized (resilient offline fallback)');

  return {
    async query(sql, params = []) {
      const s = sql.toLowerCase().trim();

      // COUNT queries
      if (s.includes('select count(*)')) {
        let count = mockDevices.length;
        if (s.includes('devices')) count = mockDevices.length;
        if (s.includes('transactions')) count = mockTransactions.length;
        if (s.includes('expenses')) count = mockExpenses.length;
        if (s.includes('investments')) count = mockInvestments.length;
        return [[{ count, total: count }], []];
      }

      // SELECT from users
      if (s.includes('from users')) {
        return [[
          {
            id: 'admin-1',
            name: 'System Superadmin',
            email: 'admin23@mrx.com',
            auth_identifier: 'Admin23',
            role: 'SUPERADMIN',
            password_hash: '$2a$10$wE8wJqQ9r1qS2vB7P7gU0eR8qL.Jm1H2h4g5f6e7d8c9b0a1b2c3d'
          },
          {
            id: 'staff-1',
            name: 'Staff User',
            email: 'staff23@mrx.com',
            auth_identifier: 'Staff23',
            role: 'STAFF',
            password_hash: '$2a$10$wE8wJqQ9r1qS2vB7P7gU0eR8qL.Jm1H2h4g5f6e7d8c9b0a1b2c3d'
          }
        ], []];
      }

      // SELECT from devices
      if (s.includes('from devices')) {
        let filtered = [...mockDevices];

        if (s.includes('d.status = ?') || s.includes('status = ?')) {
          const statusParam = params.find(p => typeof p === 'string' && ['OLD_IN_HAND', 'NEW_IN_HAND', 'IN_REPAIR', 'REJECTED', 'OLD_INVENTORY'].includes(p));
          if (statusParam) {
            filtered = filtered.filter(d => d.status === statusParam);
          }
        }

        return [filtered, []];
      }

      // SELECT from transactions / Central Ledger
      if (s.includes('from transactions')) {
        let rows = [...mockTransactions];
        const adminParam = params.find(p => ['Jeet', 'Sunal', 'Admin23'].includes(p));
        if (adminParam) {
          rows = rows.filter(r => r.admin_name === adminParam);
        }
        return [rows, []];
      }

      // SELECT from expenses
      if (s.includes('from expenses')) {
        return [mockExpenses, []];
      }

      // SELECT from investments
      if (s.includes('from investments')) {
        return [mockInvestments, []];
      }

      // INSERT INTO devices
      if (s.includes('insert into devices')) {
        const newDevice = {
          id: params[0] || uuidv4(),
          device_code: params[1] || `MRX-000${mockDevices.length + 1}`,
          imei: params[2],
          brand: params[3],
          model: params[4],
          ram: params[5],
          storage: params[6],
          colour: params[7],
          condition: params[8],
          purchase_amount: params[9],
          paid_by: params[10],
          payment_method: params[11],
          intake_date: params[13] || new Date().toISOString().split('T')[0],
          status: params[15] || 'OLD_INVENTORY',
          image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200'
        };
        mockDevices.unshift(newDevice);
        return [{ insertId: mockDevices.length }, []];
      }

      // INSERT INTO transactions
      if (s.includes('insert into transactions')) {
        const newTx = {
          id: params[0] || uuidv4(),
          transaction_code: params[1] || `TX-00${mockTransactions.length + 1}`,
          transaction_type: params[2] || 'ACQUISITION',
          flow_type: params[3] || 'DEBIT',
          amount: params[4] || 0,
          admin_name: params[6] || 'Jeet',
          payment_method: params[7] || 'UPI',
          transaction_date: params[8] || new Date().toISOString().split('T')[0],
          description: params[9] || 'Transaction entry'
        };
        mockTransactions.unshift(newTx);
        return [{ insertId: mockTransactions.length }, []];
      }

      // Default safe empty return
      return [[], []];
    }
  };
}
