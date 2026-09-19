import { getPool } from '../config/db.js';

export async function getDashboardStats(req, res) {
  try {
    const pool = getPool();

    // 1. Status Counts
    const [counts] = await pool.query(`
      SELECT 
        COUNT(*) as total_mobiles,
        SUM(CASE WHEN status = 'OLD_INVENTORY' THEN 1 ELSE 0 END) as old_inventory_count,
        SUM(CASE WHEN status = 'IN_HAND' THEN 1 ELSE 0 END) as in_hand_count,
        SUM(CASE WHEN status = 'IN_REPAIR' THEN 1 ELSE 0 END) as repair_count,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) as sold_count
      FROM devices
    `);

    const stats = counts[0];
    const total = stats.total_mobiles || 0;

    // Percentages
    const distribution = {
      old_inventory: {
        count: stats.old_inventory_count || 0,
        percentage: total > 0 ? Math.round(((stats.old_inventory_count || 0) / total) * 100) : 0
      },
      in_hand: {
        count: stats.in_hand_count || 0,
        percentage: total > 0 ? Math.round(((stats.in_hand_count || 0) / total) * 100) : 0
      },
      repair: {
        count: stats.repair_count || 0,
        percentage: total > 0 ? Math.round(((stats.repair_count || 0) / total) * 100) : 0
      },
      rejected: {
        count: stats.rejected_count || 0,
        percentage: total > 0 ? Math.round(((stats.rejected_count || 0) / total) * 100) : 0
      }
    };

    // 2. Trend (Last 7 Days)
    const [trendRows] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM devices
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // 3. Recently Added (Top 5)
    const [recentDevices] = await pool.query(`
      SELECT d.*, 
             (SELECT url FROM device_images di WHERE di.device_id = d.id ORDER BY sort_order ASC, created_at ASC LIMIT 1) as image_url
      FROM devices d
      ORDER BY d.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        kpis: {
          total_mobiles: total,
          old_inventory: stats.old_inventory_count || 0,
          in_hand: stats.in_hand_count || 0,
          repair_stock: stats.repair_count || 0,
          rejected_stock: stats.rejected_count || 0,
        },
        distribution,
        trend: trendRows,
        recently_added: recentDevices
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInHandStats(req, res) {
  try {
    const pool = getPool();
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_in_hand,
        COUNT(DISTINCT model) as unique_models,
        COALESCE(SUM(storage), 0) as total_storage,
        COALESCE(SUM(ram), 0) as total_ram
      FROM devices
      WHERE status = 'IN_HAND'
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('getInHandStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getReportsData(req, res) {
  try {
    const pool = getPool();
    const { from, to, brand, status } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (from && to) {
      conditions.push('d.intake_date BETWEEN ? AND ?');
      params.push(from, to);
    }
    if (brand && brand !== 'All Brands') {
      conditions.push('d.brand = ?');
      params.push(brand);
    }
    if (status && status !== 'All Status') {
      conditions.push('d.status = ?');
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // 1. KPI Counts and Total Purchase Valuation
    const [kpiRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_mobiles,
        SUM(CASE WHEN status = 'IN_HAND' THEN 1 ELSE 0 END) as in_hand_count,
        SUM(CASE WHEN status = 'IN_REPAIR' THEN 1 ELSE 0 END) as repair_count,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'OLD_INVENTORY' THEN 1 ELSE 0 END) as old_inventory_count,
        COALESCE(SUM(purchase_amount), 0) as total_valuation
      FROM devices d
      WHERE ${whereClause}
    `, params);

    // 2. Brand-wise breakdown for Bar chart
    const [brandRows] = await pool.query(`
      SELECT brand, COUNT(*) as count
      FROM devices d
      WHERE ${whereClause}
      GROUP BY brand
      ORDER BY count DESC
      LIMIT 10
    `, params);

    res.json({
      success: true,
      data: {
        kpis: kpiRows[0],
        brand_distribution: brandRows
      }
    });
  } catch (error) {
    console.error('getReportsData error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function exportInventory(req, res) {
  try {
    const { format = 'csv', scopes = 'ALL' } = req.query;
    const pool = getPool();

    let scopeList = scopes.split(',');
    let statusFilter = '';
    if (!scopeList.includes('ALL') && !scopeList.includes('All Inventories')) {
      const mapped = scopeList.map(s => {
        if (s.toLowerCase().includes('old')) return "'OLD_INVENTORY'";
        if (s.toLowerCase().includes('in-hand') || s.toLowerCase().includes('in hand')) return "'IN_HAND'";
        if (s.toLowerCase().includes('repair')) return "'IN_REPAIR'";
        if (s.toLowerCase().includes('reject')) return "'REJECTED'";
        return null;
      }).filter(Boolean);

      if (mapped.length > 0) {
        statusFilter = `WHERE status IN (${mapped.join(',')})`;
      }
    }

    const [rows] = await pool.query(`
      SELECT id, device_code, brand, model, ram, storage, colour, \`condition\`,
             purchase_amount, paid_by, status, intake_date
      FROM devices
      ${statusFilter}
      ORDER BY intake_date DESC
    `);

    if (format === 'csv') {
      let csv = 'Device Code,Brand,Model,RAM (GB),Storage (GB),Color,Condition,Purchase Price (INR),Paid By,Status,Intake Date\n';
      rows.forEach(r => {
        csv += `"${r.device_code}","${r.brand}","${r.model}","${r.ram}","${r.storage}","${r.colour}","${r.condition}","${r.purchase_amount}","${r.paid_by}","${r.status}","${r.intake_date}"\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.attachment(`mr_x_change_inventory_${Date.now()}.csv`);
      return res.send(csv);
    } else if (format === 'xml') {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<inventory>\n';
      rows.forEach(r => {
        xml += `  <device>\n    <device_code>${r.device_code}</device_code>\n    <brand>${r.brand}</brand>\n    <model>${r.model}</model>\n    <price>${r.purchase_amount}</price>\n    <status>${r.status}</status>\n  </device>\n`;
      });
      xml += '</inventory>';
      res.header('Content-Type', 'application/xml');
      res.attachment(`mr_x_change_inventory_${Date.now()}.xml`);
      return res.send(xml);
    } else {
      // PDF or PPT or default JSON payload
      res.json({
        success: true,
        message: `Report generated for format: ${format}`,
        total_records: rows.length,
        data: rows
      });
    }
  } catch (error) {
    console.error('exportInventory error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
