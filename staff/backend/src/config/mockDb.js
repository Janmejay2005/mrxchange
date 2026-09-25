// File-Persistent Central Database Engine for Server Deployments (Render / Local)
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'db_store.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStore() {
  ensureDataDir();
  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        mockDevices: Array.isArray(parsed.mockDevices) ? parsed.mockDevices : [],
        mockRepairs: Array.isArray(parsed.mockRepairs) ? parsed.mockRepairs : [],
        mockRejections: Array.isArray(parsed.mockRejections) ? parsed.mockRejections : [],
        mockSales: Array.isArray(parsed.mockSales) ? parsed.mockSales : [],
        mockExpenses: Array.isArray(parsed.mockExpenses) ? parsed.mockExpenses : [],
        mockInvestments: Array.isArray(parsed.mockInvestments) ? parsed.mockInvestments : [],
        mockTransactions: Array.isArray(parsed.mockTransactions) ? parsed.mockTransactions : [],
        mockImages: Array.isArray(parsed.mockImages) ? parsed.mockImages : []
      };
    } catch (e) {
      console.warn('⚠️ Could not parse db_store.json, using clean store:', e.message);
    }
  }
  return {
    mockDevices: [],
    mockRepairs: [],
    mockRejections: [],
    mockSales: [],
    mockExpenses: [],
    mockInvestments: [],
    mockTransactions: [],
    mockImages: []
  };
}

let store = loadStore();

function saveStore() {
  try {
    ensureDataDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('❌ Failed to write db_store.json:', e.message);
  }
}

export function cleanMockStore() {
  store = {
    mockDevices: [],
    mockRepairs: [],
    mockRejections: [],
    mockSales: [],
    mockExpenses: [],
    mockInvestments: [],
    mockTransactions: [],
    mockImages: []
  };
  saveStore();
}

export function createMockPool() {
  console.log('⚡ File-Persistent Database initialized at:', STORE_FILE);

  const mockPool = {
    isMockPool: true,
    cleanMockStore() {
      cleanMockStore();
    },
    async getConnection() {
      return {
        async query(sql, params) {
          return mockPool.query(sql, params);
        },
        async beginTransaction() {},
        async commit() {},
        async rollback() {},
        release() {}
      };
    },
    async query(sql, params = []) {
      const s = sql.toLowerCase().trim();

      // TRUNCATE or DELETE ALL
      if ((s.includes('delete from') || s.includes('truncate')) && !s.includes('where')) {
        cleanMockStore();
        return [{ affectedRows: 1 }, []];
      }

      // DELETE single device
      if (s.includes('delete from devices') && s.includes('where')) {
        const targetId = params[0];
        store.mockDevices = store.mockDevices.filter(d => 
          String(d.id) !== String(targetId) && String(d.device_code) !== String(targetId)
        );
        saveStore();
        return [{ affectedRows: 1 }, []];
      }

      // UPDATE device status or fields
      if (s.includes('update devices set')) {
        let statusVal = null;
        if (s.includes('status = ?')) {
          statusVal = params[0];
        }

        const targetId = params[params.length - 1]; // usually WHERE id = ? at the end
        store.mockDevices = store.mockDevices.map(d => {
          if (String(d.id) === String(targetId) || String(d.device_code) === String(targetId)) {
            return {
              ...d,
              ...(statusVal ? { status: statusVal } : {})
            };
          }
          return d;
        });
        saveStore();
        return [{ affectedRows: 1 }, []];
      }

      // COUNT queries
      if (s.includes('select count(*)')) {
        let count = store.mockDevices.length;
        if (s.includes('devices')) count = store.mockDevices.length;
        if (s.includes('transactions')) count = store.mockTransactions.length;
        if (s.includes('expenses')) count = store.mockExpenses.length;
        if (s.includes('investments')) count = store.mockInvestments.length;
        return [[{ count, total: count }], []];
      }

      // SELECT users
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

      // SELECT devices
      if (s.includes('from devices')) {
        let filtered = [...store.mockDevices];

        // Specific ID check
        if (s.includes('where id = ?') || s.includes('where id = ? or device_code = ?')) {
          const checkId = params[0];
          filtered = filtered.filter(d => String(d.id) === String(checkId) || String(d.device_code) === String(checkId));
          return [filtered, []];
        }

        if (s.includes('d.status = ?') || s.includes('status = ?')) {
          const statusParam = params.find(p => typeof p === 'string' && ['OLD_IN_HAND', 'NEW_IN_HAND', 'IN_REPAIR', 'REJECTED', 'OLD_INVENTORY', 'SOLD', 'BOOKED'].includes(p));
          if (statusParam) {
            filtered = filtered.filter(d => d.status === statusParam);
          }
        }

        return [filtered, []];
      }

      // SELECT transactions
      if (s.includes('from transactions')) {
        let rows = [...store.mockTransactions];
        return [rows, []];
      }

      // SELECT expenses
      if (s.includes('from expenses')) {
        return [store.mockExpenses, []];
      }

      // SELECT investments
      if (s.includes('from investments')) {
        return [store.mockInvestments, []];
      }

      // INSERT INTO devices
      if (s.includes('insert into devices')) {
        const deviceId = params[0] || uuidv4();
        const deviceCode = params[1] || `MRX-${String(store.mockDevices.length + 10).padStart(5, '0')}`;
        const newDevice = {
          id: deviceId,
          device_code: deviceCode,
          imei: params[2] || null,
          brand: params[3] || 'Apple',
          model: params[4] || 'iPhone',
          ram: params[5] || 6,
          storage: params[6] || 128,
          colour: params[7] || 'Black',
          condition: params[8] || 'Good',
          purchase_amount: parseFloat(params[9] || 0),
          paid_by: params[10] || 'Staff',
          payment_method: params[11] || 'UPI',
          supplier_name: params[12] || null,
          intake_date: params[13] || new Date().toISOString().split('T')[0],
          remarks: params[14] || null,
          status: params[15] || 'OLD_INVENTORY',
          image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200'
        };
        store.mockDevices.unshift(newDevice);
        saveStore();
        return [{ insertId: store.mockDevices.length, id: deviceId, device_code: deviceCode }, []];
      }

      // INSERT INTO transactions
      if (s.includes('insert into transactions')) {
        const newTx = {
          id: params[0] || uuidv4(),
          transaction_code: params[1] || `TX-00${store.mockTransactions.length + 1}`,
          transaction_type: params[2] || 'ACQUISITION',
          flow_type: params[3] || 'DEBIT',
          amount: parseFloat(params[4] || 0),
          device_id: params[5] || null,
          admin_name: params[6] || 'Staff',
          payment_method: params[7] || 'UPI',
          transaction_date: params[8] || new Date().toISOString().split('T')[0],
          description: params[9] || 'Transaction entry'
        };
        store.mockTransactions.unshift(newTx);
        saveStore();
        return [{ insertId: store.mockTransactions.length }, []];
      }

      // INSERT INTO device_images
      if (s.includes('insert into device_images')) {
        const imgObj = {
          id: params[0] || uuidv4(),
          device_id: params[1],
          url: params[2],
          sort_order: params[3] || 0
        };
        store.mockImages.push(imgObj);
        // attach image_url to matching device
        store.mockDevices = store.mockDevices.map(d => 
          String(d.id) === String(params[1]) ? { ...d, image_url: params[2], images: [...(d.images || []), params[2]] } : d
        );
        saveStore();
        return [{ insertId: store.mockImages.length }, []];
      }

      // Default safe empty return
      return [[], []];
    }
  };

  return mockPool;
}
