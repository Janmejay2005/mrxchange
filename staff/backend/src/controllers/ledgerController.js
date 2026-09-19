import { getPool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function getLedger(req, res) {
  try {
    const pool = getPool();
    const { from, to, type, admin, q, page = 1, limit = 50 } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (from && to) {
      conditions.push('t.transaction_date BETWEEN ? AND ?');
      params.push(from, to);
    } else if (from) {
      conditions.push('t.transaction_date = ?');
      params.push(from);
    }

    if (type && type !== 'ALL') {
      conditions.push('t.transaction_type = ?');
      params.push(type);
    }

    if (admin && admin !== 'All Admins' && admin !== 'ALL') {
      conditions.push('t.admin_name = ?');
      params.push(admin);
    }

    if (q) {
      conditions.push('(t.transaction_code LIKE ? OR t.description LIKE ? OR t.admin_name LIKE ?)');
      const s = `%${q}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Total Count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM transactions t WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Fetch transactions
    const [rows] = await pool.query(
      `SELECT t.*, d.brand, d.model, d.device_code
       FROM transactions t
       LEFT JOIN devices d ON t.device_id = d.id
       WHERE ${whereClause}
       ORDER BY t.transaction_date DESC, t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Summary calculation
    const [summaryResult] = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN flow_type = 'CREDIT' THEN amount ELSE 0 END), 0) as total_credits,
         COALESCE(SUM(CASE WHEN flow_type = 'DEBIT' THEN amount ELSE 0 END), 0) as total_debits
       FROM transactions t
       WHERE ${whereClause}`,
      params
    );

    const totalCredits = parseFloat(summaryResult[0]?.total_credits || 0);
    const totalDebits = parseFloat(summaryResult[0]?.total_debits || 0);
    const netBalance = totalCredits - totalDebits;

    res.json({
      success: true,
      data: rows,
      summary: {
        totalCredits,
        totalDebits,
        netBalance
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('getLedger error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createLedgerEntry(req, res) {
  try {
    const pool = getPool();
    const {
      transaction_type,
      flow_type,
      amount,
      admin_name = 'Admin23',
      payment_method = 'Cash',
      transaction_date,
      description,
      device_id
    } = req.body;

    if (!transaction_type || !flow_type || !amount) {
      return res.status(400).json({ success: false, message: 'Type, flow type, and amount are required' });
    }

    const txId = uuidv4();
    const date = transaction_date || new Date().toISOString().split('T')[0];
    const code = `TX-MAN-${Date.now().toString().slice(-6)}`;

    await pool.query(`
      INSERT INTO transactions (
        id, transaction_code, transaction_type, flow_type, amount,
        device_id, admin_name, payment_method, transaction_date, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      txId, code, transaction_type, flow_type, parseFloat(amount),
      device_id || null, admin_name, payment_method, date, description || 'Manual ledger entry'
    ]);

    res.status(201).json({
      success: true,
      message: 'Ledger transaction recorded successfully',
      id: txId,
      transaction_code: code
    });
  } catch (error) {
    console.error('createLedgerEntry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
