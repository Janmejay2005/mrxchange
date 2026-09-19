import { getPool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function getDevices(req, res) {
  try {
    const pool = getPool();
    const {
      status,
      q,
      brand,
      colour,
      from,
      to,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = ['1=1'];
    let params = [];

    const userRole = req.user?.role;
    let targetStatus = status;

    // Staff constraint: Staff only gets OLD_IN_HAND for in-hand requests
    if (userRole === 'STAFF' && (status === 'IN_HAND' || status === 'NEW_IN_HAND')) {
      targetStatus = 'OLD_IN_HAND';
    }

    if (targetStatus && targetStatus !== 'ALL') {
      if (targetStatus === 'IN_HAND') {
        conditions.push('(d.status = "OLD_IN_HAND" OR d.status = "NEW_IN_HAND" OR d.status = "IN_HAND")');
      } else {
        conditions.push('d.status = ?');
        params.push(targetStatus);
      }
    }

    if (q) {
      conditions.push('(d.model LIKE ? OR d.brand LIKE ? OR d.imei LIKE ? OR d.device_code LIKE ? OR d.colour LIKE ?)');
      const searchParam = `%${q}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (brand && brand !== 'All Brands') {
      conditions.push('d.brand = ?');
      params.push(brand);
    }

    if (colour && colour !== 'All Colors') {
      conditions.push('d.colour = ?');
      params.push(colour);
    }

    if (from && to) {
      conditions.push('d.intake_date BETWEEN ? AND ?');
      params.push(from, to);
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['intake_date', 'created_at', 'purchase_amount', 'model', 'brand'];
    const sortBy = allowedSort.includes(sort) ? `d.${sort}` : 'd.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM devices d WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Items query with image join
    const [rows] = await pool.query(
      `SELECT d.*, 
              (SELECT url FROM device_images di WHERE di.device_id = d.id ORDER BY sort_order ASC, created_at ASC LIMIT 1) as image_url,
              (SELECT GROUP_CONCAT(url ORDER BY sort_order ASC SEPARATOR '|||') FROM device_images di WHERE di.device_id = d.id) as all_images_concat,
              (SELECT description FROM rejections rj WHERE rj.device_id = d.id ORDER BY created_at DESC LIMIT 1) as last_rejection_reason,
              (SELECT issue_description FROM repairs rp WHERE rp.device_id = d.id AND rp.status = 'IN_PROGRESS' ORDER BY created_at DESC LIMIT 1) as active_repair_issue,
              (SELECT technician_name FROM repairs rp WHERE rp.device_id = d.id ORDER BY created_at DESC LIMIT 1) as active_technician
       FROM devices d
       WHERE ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const formattedData = rows.map(r => ({
      ...r,
      images: r.all_images_concat 
        ? r.all_images_concat.split('|||').filter(Boolean) 
        : (r.image_url ? [r.image_url] : [])
    }));

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('getDevices error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDeviceById(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [devices] = await pool.query('SELECT * FROM devices WHERE id = ?', [id]);
    if (devices.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    const device = devices[0];

    const [images] = await pool.query('SELECT * FROM device_images WHERE device_id = ? ORDER BY sort_order ASC', [id]);
    const [repairs] = await pool.query('SELECT * FROM repairs WHERE device_id = ? ORDER BY created_at DESC', [id]);
    const [rejections] = await pool.query('SELECT * FROM rejections WHERE device_id = ? ORDER BY created_at DESC', [id]);
    const [sales] = await pool.query('SELECT * FROM sales WHERE device_id = ?', [id]);
    const [history] = await pool.query('SELECT * FROM device_status_history WHERE device_id = ? ORDER BY created_at DESC', [id]);

    const completedRepairsCost = repairs
      .filter(r => r.status === 'COMPLETED')
      .reduce((acc, curr) => acc + parseFloat(curr.repair_cost || 0), 0);

    const totalCost = parseFloat(device.purchase_amount || 0) + completedRepairsCost;

    res.json({
      success: true,
      data: {
        ...device,
        images,
        repairs,
        rejections,
        sale: sales[0] || null,
        history,
        total_cost: totalCost
      }
    });
  } catch (error) {
    console.error('getDeviceById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createDevice(req, res) {
  try {
    const pool = getPool();
    const {
      brand,
      model,
      ram = 4,
      storage = 64,
      colour = 'Black',
      condition = 'Good',
      purchase_amount,
      paid_by = 'Rohit',
      payment_method = 'UPI',
      supplier_name,
      imei,
      remarks,
      image_data, // base64 or url
    } = req.body;

    if (!brand || !model || !purchase_amount) {
      return res.status(400).json({ success: false, message: 'Brand, Model and Purchase Amount are required' });
    }

    // Check duplicate IMEI
    if (imei && imei.trim() !== '') {
      const [existing] = await pool.query('SELECT id FROM devices WHERE imei = ?', [imei.trim()]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: `Device with IMEI ${imei} already exists` });
      }
    }

    // Condition Routing according to PRD
    let initialStatus = 'OLD_INVENTORY';
    if (condition && condition.toLowerCase() === 'fresh') {
      initialStatus = 'NEW_IN_HAND';
    } else if (condition && condition.toLowerCase() === 'repair') {
      initialStatus = 'IN_REPAIR';
    }

    const deviceId = uuidv4();
    const [countResult] = await pool.query('SELECT COUNT(*) as count FROM devices');
    const deviceCode = `MRX-${String(countResult[0].count + 1).padStart(5, '0')}`;
    const today = req.body.date || new Date().toISOString().split('T')[0];

    await pool.query(`
      INSERT INTO devices (
        id, device_code, imei, brand, model, ram, storage, colour, \`condition\`,
        purchase_amount, paid_by, payment_method, supplier_name, intake_date, remarks,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deviceId, deviceCode, imei ? imei.trim() : null, brand, model, parseInt(ram),
      parseInt(storage), colour, condition, parseFloat(purchase_amount), paid_by,
      payment_method, supplier_name || null, today, remarks || null, initialStatus, req.user?.id || null
    ]);

    // Record Central Ledger Transaction
    await pool.query(`
      INSERT INTO transactions (
        id, transaction_code, transaction_type, flow_type, amount,
        device_id, admin_name, payment_method, transaction_date, description
      ) VALUES (?, ?, 'ACQUISITION', 'DEBIT', ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      `TX-ACQ-${String(countResult[0].count + 1).padStart(5, '0')}`,
      parseFloat(purchase_amount),
      deviceId,
      paid_by || req.user?.name || 'Staff',
      payment_method,
      today,
      `Device Intake: ${brand} ${model} (${condition})`
    ]);

    // Handle Multiple Images (At least 2 images supported per PRD)
    const imagesToInsert = [];
    if (Array.isArray(req.body.images) && req.body.images.length > 0) {
      req.body.images.forEach(img => {
        if (img && typeof img === 'string' && img.trim()) {
          imagesToInsert.push(img.trim());
        }
      });
    } else if (image_data) {
      imagesToInsert.push(image_data);
    } else if (req.file) {
      imagesToInsert.push(`/uploads/${req.file.filename}`);
    }

    for (let i = 0; i < imagesToInsert.length; i++) {
      await pool.query(`
        INSERT INTO device_images (id, device_id, url, sort_order) VALUES (?, ?, ?, ?)
      `, [uuidv4(), deviceId, imagesToInsert[i], i]);
    }

    // Status history
    await pool.query(`
      INSERT INTO device_status_history (id, device_id, from_status, to_status, reason, changed_by)
      VALUES (?, ?, NULL, ?, 'Device intake entry', ?)
    `, [uuidv4(), deviceId, initialStatus, req.user?.name || 'Staff']);


    res.status(201).json({
      success: true,
      message: `Mobile device added successfully (${initialStatus})`,
      deviceId,
      deviceCode,
      status: initialStatus
    });
  } catch (error) {
    console.error('createDevice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateDeviceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason, repair_issue, technician, repair_cost, rejection_reason } = req.body;
    const pool = getPool();

    const [devices] = await pool.query('SELECT * FROM devices WHERE id = ?', [id]);
    if (devices.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    const device = devices[0];
    const fromStatus = device.status;

    // Allowed transition checks per PRD
    const allowedTransitions = {
      'OLD_INVENTORY': ['OLD_IN_HAND', 'NEW_IN_HAND', 'IN_HAND', 'IN_REPAIR', 'REJECTED'],
      'OLD_IN_HAND': ['IN_REPAIR', 'REJECTED', 'SOLD'],
      'NEW_IN_HAND': ['IN_REPAIR', 'REJECTED', 'SOLD'],
      'IN_HAND': ['OLD_IN_HAND', 'NEW_IN_HAND', 'IN_REPAIR', 'REJECTED', 'SOLD'],
      'IN_REPAIR': ['OLD_IN_HAND', 'NEW_IN_HAND', 'IN_HAND', 'REJECTED'],
      'REJECTED': ['IN_REPAIR', 'OLD_IN_HAND', 'NEW_IN_HAND', 'IN_HAND', 'DISPOSED'],
      'SOLD': [],
      'DISPOSED': []
    };

    if (!allowedTransitions[fromStatus] || !allowedTransitions[fromStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition status from ${fromStatus} to ${status}`
      });
    }

    if (status === 'REJECTED' && (!rejection_reason || rejection_reason.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is strictly mandatory before rejecting device'
      });
    }

    // Begin Transaction
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query('UPDATE devices SET status = ? WHERE id = ?', [status, id]);

      if (status === 'IN_REPAIR' && repair_issue) {
        await conn.query(`
          INSERT INTO repairs (id, device_id, issue_description, technician_name, repair_cost, status, created_by)
          VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS', ?)
        `, [uuidv4(), id, repair_issue, technician || null, parseFloat(repair_cost || 0), req.user?.id || null]);
      }

      if (status === 'REJECTED') {
        await conn.query(`
          INSERT INTO rejections (id, device_id, description, created_by)
          VALUES (?, ?, ?, ?)
        `, [uuidv4(), id, rejection_reason, req.user?.id || null]);

        await conn.query(`
          INSERT INTO transactions (
            id, transaction_code, transaction_type, flow_type, amount,
            device_id, admin_name, transaction_date, description
          ) VALUES (?, ?, 'REJECTION', 'DEBIT', 0, ?, ?, CURDATE(), ?)
        `, [
          uuidv4(),
          `TX-REJ-${Date.now().toString().slice(-6)}`,
          id,
          req.user?.name || 'Staff',
          `Device Rejected: ${rejection_reason}`
        ]);
      }

      // If completing repair and moving to In-hand
      if (fromStatus === 'IN_REPAIR' && (status === 'OLD_IN_HAND' || status === 'NEW_IN_HAND' || status === 'IN_HAND')) {
        await conn.query(`UPDATE repairs SET status = 'COMPLETED', completed_at = NOW() WHERE device_id = ? AND status = 'IN_PROGRESS'`, [id]);
      }

      await conn.query(`
        INSERT INTO device_status_history (id, device_id, from_status, to_status, reason, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [uuidv4(), id, fromStatus, status, reason || `Moved to ${status}`, req.user?.name || 'Staff']);

      await conn.commit();
      conn.release();

      res.json({
        success: true,
        message: `Device status successfully updated to ${status}`
      });
    } catch (txErr) {
      await conn.rollback();
      conn.release();
      throw txErr;
    }
  } catch (error) {
    console.error('updateDeviceStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
