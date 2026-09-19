import { getPool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function createRepair(req, res) {
  try {
    const { device_id, issue_description, technician_name, repair_cost = 0, notes } = req.body;
    if (!device_id || !issue_description) {
      return res.status(400).json({ success: false, message: 'Device and issue description required' });
    }

    const pool = getPool();
    const repairId = uuidv4();

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(`
        INSERT INTO repairs (id, device_id, issue_description, technician_name, repair_cost, status, notes, created_by)
        VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS', ?, ?)
      `, [repairId, device_id, issue_description, technician_name || null, parseFloat(repair_cost), notes || null, req.user?.id || null]);

      await conn.query(`
        UPDATE devices SET status = 'IN_REPAIR' WHERE id = ?
      `, [device_id]);

      await conn.query(`
        INSERT INTO device_status_history (id, device_id, from_status, to_status, reason, changed_by)
        VALUES (?, ?, 'IN_HAND', 'IN_REPAIR', ?, ?)
      `, [uuidv4(), device_id, `Repair initiated: ${issue_description}`, req.user?.name || 'Staff']);

      await conn.commit();
      conn.release();

      res.status(201).json({ success: true, message: 'Device sent to repair stock successfully', repairId });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (error) {
    console.error('createRepair error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateRepair(req, res) {
  try {
    const { id } = req.params;
    const { status, destination = 'IN_HAND', repair_cost, notes } = req.body;
    const pool = getPool();

    const [repairs] = await pool.query('SELECT * FROM repairs WHERE id = ?', [id]);
    if (repairs.length === 0) {
      return res.status(404).json({ success: false, message: 'Repair record not found' });
    }
    const repair = repairs[0];
    const deviceId = repair.device_id;

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      const completedAt = status === 'COMPLETED' ? new Date() : null;
      await conn.query(`
        UPDATE repairs 
        SET status = ?, completed_at = ?, repair_cost = COALESCE(?, repair_cost), notes = COALESCE(?, notes)
        WHERE id = ?
      `, [status, completedAt, repair_cost !== undefined ? parseFloat(repair_cost) : null, notes, id]);

      if (status === 'COMPLETED') {
        const nextStatus = destination === 'REJECTED' ? 'REJECTED' : 'IN_HAND';
        await conn.query('UPDATE devices SET status = ? WHERE id = ?', [nextStatus, deviceId]);

        await conn.query(`
          INSERT INTO device_status_history (id, device_id, from_status, to_status, reason, changed_by)
          VALUES (?, ?, 'IN_REPAIR', ?, 'Repair completed', ?)
        `, [uuidv4(), deviceId, nextStatus, req.user?.name || 'Staff']);
      }

      await conn.commit();
      conn.release();

      res.json({ success: true, message: `Repair updated successfully. Status is now ${status}` });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (error) {
    console.error('updateRepair error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
