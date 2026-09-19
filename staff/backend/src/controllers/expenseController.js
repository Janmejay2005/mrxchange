import { getPool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function getExpenses(req, res) {
  try {
    const pool = getPool();
    const { category, from, to, admin, page = 1, limit = 50 } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (category && category !== 'ALL') {
      conditions.push('e.category = ?');
      params.push(category);
    }

    if (from && to) {
      conditions.push('e.expense_date BETWEEN ? AND ?');
      params.push(from, to);
    } else if (from) {
      conditions.push('e.expense_date = ?');
      params.push(from);
    }

    if (admin && admin !== 'All Admins' && admin !== 'ALL') {
      conditions.push('e.admin_name = ?');
      params.push(admin);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await pool.query(
      `SELECT e.* FROM expenses e WHERE ${whereClause} ORDER BY e.expense_date DESC, e.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM expenses e WHERE ${whereClause}`,
      params
    );

    // Breakdown by category
    const [breakdown] = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) as amount, COUNT(*) as count
       FROM expenses e
       WHERE ${whereClause}
       GROUP BY category`,
      params
    );

    res.json({
      success: true,
      data: rows,
      total_expenses: parseFloat(countResult[0]?.total_amount || 0),
      breakdown: breakdown.map(b => ({
        category: b.category,
        amount: parseFloat(b.amount),
        count: b.count
      })),
      pagination: {
        total: countResult[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('getExpenses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createExpense(req, res) {
  try {
    const pool = getPool();
    const { category, amount, expense_date, admin_name = 'Admin23', recipient, remarks } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ success: false, message: 'Category and amount are required' });
    }

    const validCategories = ['SALARY', 'REPAIRING_COST', 'OTHER'];
    if (!validCategories.includes(category.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Category must be SALARY, REPAIRING_COST, or OTHER' });
    }

    const expenseId = uuidv4();
    const date = expense_date || new Date().toISOString().split('T')[0];
    const code = `EXP-${Date.now().toString().slice(-6)}`;

    // Insert into expenses table
    await pool.query(`
      INSERT INTO expenses (id, expense_code, category, amount, expense_date, admin_name, recipient, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [expenseId, code, category.toUpperCase(), parseFloat(amount), date, admin_name, recipient || null, remarks || null]);

    // Insert into central ledger transactions
    await pool.query(`
      INSERT INTO transactions (
        id, transaction_code, transaction_type, flow_type, amount,
        reference_id, admin_name, payment_method, transaction_date, description
      ) VALUES (?, ?, 'EXPENSE', 'DEBIT', ?, ?, ?, 'Bank Transfer', ?, ?)
    `, [
      uuidv4(),
      `TX-${code}`,
      parseFloat(amount),
      code,
      admin_name,
      date,
      `Expense (${category}): ${remarks || recipient || 'Operational expense'}`
    ]);

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      id: expenseId,
      expense_code: code
    });
  } catch (error) {
    console.error('createExpense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
