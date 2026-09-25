// In-memory Mock Database Store for local testing and offline fallback when MySQL/Postgres is not connected
import { v4 as uuidv4 } from 'uuid';

let mockDevices = [];
let mockRepairs = [];
let mockRejections = [];
let mockSales = [];
let mockExpenses = [];
let mockInvestments = [];
let mockTransactions = [];

export function cleanMockStore() {
  mockDevices = [];
  mockRepairs = [];
  mockRejections = [];
  mockSales = [];
  mockExpenses = [];
  mockInvestments = [];
  mockTransactions = [];
}

export function createMockPool() {
  console.log('⚡ Mock In-Memory Database initialized (resilient offline fallback)');

  return {
    isMockPool: true,
    cleanMockStore() {
      cleanMockStore();
    },
    async query(sql, params = []) {
      const s = sql.toLowerCase().trim();

      if (s.includes('delete from') || s.includes('truncate table')) {
        cleanMockStore();
        return [{ affectedRows: 1 }, []];
      }

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
