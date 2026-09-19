import { getPool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function getInvestments(req, res) {
  try {
    const pool = getPool();
    const { type, investor, from, to, page = 1, limit = 50 } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (type && type !== 'ALL') {
      conditions.push('i.investment_type = ?');
      params.push(type);
    }

    if (investor && investor !== 'All Admins' && investor !== 'ALL') {
      conditions.push('i.investor_name = ?');
      params.push(investor);
    }

    if (from && to) {
      conditions.push('i.investment_date BETWEEN ? AND ?');
      params.push(from, to);
    } else if (from) {
      conditions.push('i.investment_date = ?');
      params.push(from);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await pool.query(
      `SELECT i.* FROM investments i WHERE ${whereClause} ORDER BY i.investment_date DESC, i.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM investments i WHERE ${whereClause}`,
      params
    );

    // Calculate total net profit for ROI
    const [salesSum] = await pool.query(`SELECT COALESCE(SUM(selling_price), 0) as total_sales FROM sales`);
    const [purchaseSum] = await pool.query(`SELECT COALESCE(SUM(purchase_amount), 0) as total_purchase FROM devices WHERE status = 'SOLD'`);
    const [expenseSum] = await pool.query(`SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses`);

    const totalSales = parseFloat(salesSum[0]?.total_sales || 0);
    const totalPurchase = parseFloat(purchaseSum[0]?.total_purchase || 0);
    const totalExpenses = parseFloat(expenseSum[0]?.total_expenses || 0);
    const netProfit = totalSales - totalPurchase - totalExpenses;

    const totalInvestment = parseFloat(countResult[0]?.total_amount || 0);
    const roi = totalInvestment > 0 ? ((netProfit / totalInvestment) * 100).toFixed(2) : 0;

    // Breakdown by type
    const [breakdown] = await pool.query(
      `SELECT investment_type, COALESCE(SUM(amount), 0) as amount, COUNT(*) as count
       FROM investments i
       WHERE ${whereClause}
       GROUP BY investment_type`,
      params
    );

    res.json({
      success: true,
      data: rows,
      total_investment: totalInvestment,
      net_profit: netProfit,
      roi: parseFloat(roi),
      breakdown: breakdown.map(b => ({
        type: b.investment_type,
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
    console.error('getInvestments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createInvestment(req, res) {
  try {
    const pool = getPool();
    const { investment_type, amount, investment_date, investor_name = 'Jeet', remarks } = req.body;

    if (!investment_type || !amount) {
      return res.status(400).json({ success: false, message: 'Investment type and amount are required' });
    }

    const validTypes = ['INVENTORY', 'EQUIPMENT', 'WORKING_CAPITAL', 'OTHER'];
    if (!validTypes.includes(investment_type.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Investment type must be INVENTORY, EQUIPMENT, WORKING_CAPITAL, or OTHER' });
    }

    const investmentId = uuidv4();
    const date = investment_date || new Date().toISOString().split('T')[0];
    const code = `INV-${Date.now().toString().slice(-6)}`;

    // Insert into investments table
    await pool.query(`
      INSERT INTO investments (id, investment_code, investment_type, amount, investment_date, investor_name, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [investmentId, code, investment_type.toUpperCase(), parseFloat(amount), date, investor_name, remarks || null]);

    // Insert into central ledger transactions
    await pool.query(`
      INSERT INTO transactions (
        id, transaction_code, transaction_type, flow_type, amount,
        reference_id, admin_name, payment_method, transaction_date, description
      ) VALUES (?, ?, 'INVESTMENT', 'CREDIT', ?, ?, ?, 'Bank Transfer', ?, ?)
    `, [
      uuidv4(),
      `TX-${code}`,
      parseFloat(amount),
      code,
      investor_name,
      date,
      `Capital Investment (${investment_type}): ${remarks || 'Capital contribution'}`
    ]);

    res.status(201).json({
      success: true,
      message: 'Investment recorded successfully',
      id: investmentId,
      investment_code: code
    });
  } catch (error) {
    console.error('createInvestment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
