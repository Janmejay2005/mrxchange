import { getPool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function createSale(req, res) {
  try {
    const {
      device_id,
      selling_price,
      discount_amount = 0,
      customer_name,
      customer_phone,
      payment_method = 'Cash',
      payment_status = 'PAID',
      remarks
    } = req.body;

    if (!device_id || !selling_price) {
      return res.status(400).json({ success: false, message: 'Device and selling price are required' });
    }

    const pool = getPool();

    // Check device is IN_HAND
    const [devices] = await pool.query('SELECT * FROM devices WHERE id = ?', [device_id]);
    if (devices.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    const device = devices[0];

    if (device.status !== 'IN_HAND') {
      return res.status(400).json({
        success: false,
        message: `Only IN_HAND devices can be sold. Current status: ${device.status}`
      });
    }

    // Check if already sold
    const [existingSales] = await pool.query('SELECT id FROM sales WHERE device_id = ?', [device_id]);
    if (existingSales.length > 0) {
      return res.status(400).json({ success: false, message: 'Device is already sold' });
    }

    const saleId = uuidv4();
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(`
        INSERT INTO sales (
          id, device_id, selling_price, discount_amount, customer_name,
          customer_phone, payment_method, payment_status, remarks, sold_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        saleId, device_id, parseFloat(selling_price), parseFloat(discount_amount || 0),
        customer_name || null, customer_phone || null, payment_method, payment_status,
        remarks || null, req.user?.id || null
      ]);

      await conn.query(`
        UPDATE devices SET status = 'SOLD' WHERE id = ?
      `, [device_id]);

      await conn.query(`
        INSERT INTO device_status_history (id, device_id, from_status, to_status, reason, changed_by)
        VALUES (?, ?, 'IN_HAND', 'SOLD', 'Device sold to customer', ?)
      `, [uuidv4(), device_id, req.user?.name || 'Staff']);

      await conn.commit();
      conn.release();

      res.status(201).json({
        success: true,
        message: 'Sale recorded successfully',
        saleId
      });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (error) {
    console.error('createSale error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getSalesList(req, res) {
  try {
    const pool = getPool();
    const [sales] = await pool.query(`
      SELECT s.*, d.brand, d.model, d.imei, d.purchase_amount,
             (SELECT COALESCE(SUM(repair_cost), 0) FROM repairs WHERE device_id = d.id AND status = 'COMPLETED') as repair_cost
      FROM sales s
      JOIN devices d ON s.device_id = d.id
      ORDER BY s.sold_at DESC
    `);

    const formatted = sales.map(item => {
      const totalCost = parseFloat(item.purchase_amount) + parseFloat(item.repair_cost);
      const profit = parseFloat(item.selling_price) - totalCost;
      return {
        ...item,
        total_cost: totalCost,
        realized_profit: profit
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('getSalesList error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
