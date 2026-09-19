import { getPool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function createRejection(req, res) {
  try {
    const { device_id, category, description, notes } = req.body;
    if (!device_id || !description) {
      return res.status(400).json({ success: false, message: 'Device ID and rejection description are required' });
    }

    const pool = getPool();
    const rejectionId = uuidv4();

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(`
        INSERT INTO rejections (id, device_id, category, description, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [rejectionId, device_id, category || 'Hardware Defect', description, notes || null, req.user?.id || null]);

      await conn.query(`
        UPDATE devices SET status = 'REJECTED' WHERE id = ?
      `, [device_id]);

      await conn.query(`
        INSERT INTO device_status_history (id, device_id, from_status, to_status, reason, changed_by)
        VALUES (?, ?, 'OLD_INVENTORY', 'REJECTED', ?, ?)
      `, [uuidv4(), device_id, `Rejected: ${description}`, req.user?.name || 'Staff']);

      await conn.commit();
      conn.release();

      res.status(201).json({ success: true, message: 'Device moved to Rejected Stock', rejectionId });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (error) {
    console.error('createRejection error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function resolveRejection(req, res) {
  try {
    const { id } = req.params;
    const { resolution, destination = 'IN_HAND', notes } = req.body;
    const pool = getPool();

    const [rejections] = await pool.query('SELECT * FROM rejections WHERE id = ?', [id]);
    if (rejections.length === 0) {
      return res.status(404).json({ success: false, message: 'Rejection record not found' });
    }
    const rejection = rejections[0];
    const deviceId = rejection.device_id;

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(`
        UPDATE rejections 
        SET resolution = ?, resolved_at = NOW(), notes = COALESCE(?, notes)
        WHERE id = ?
      `, [resolution || 'Resolved by staff', notes, id]);

      const targetStatus = destination === 'IN_REPAIR' ? 'IN_REPAIR' : (destination === 'DISPOSED' ? 'DISPOSED' : 'IN_HAND');
      await conn.query('UPDATE devices SET status = ? WHERE id = ?', [targetStatus, deviceId]);

      await conn.query(`
        INSERT INTO device_status_history (id, device_id, from_status, to_status, reason, changed_by)
        VALUES (?, ?, 'REJECTED', ?, ?, ?)
      `, [uuidv4(), deviceId, targetStatus, `Rejection resolved: ${resolution || destination}`, req.user?.name || 'Staff']);

      await conn.commit();
      conn.release();

      res.json({ success: true, message: `Rejection resolved. Device moved to ${targetStatus}` });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (error) {
    console.error('resolveRejection error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
