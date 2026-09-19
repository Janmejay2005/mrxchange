import { getPool } from '../config/db.js';

export async function exportCsv(req, res) {
  try {
    const pool = getPool();
    const { scope = 'inventory', status, admin, from, to } = req.query;

    let filename = `MRX_${scope}_${new Date().toISOString().split('T')[0]}.csv`;
    let csvData = '';

    if (scope === 'ledger') {
      let conditions = ['1=1'];
      let params = [];
      if (admin && admin !== 'All Admins' && admin !== 'ALL') {
        conditions.push('admin_name = ?');
        params.push(admin);
      }
      if (from && to) {
        conditions.push('transaction_date BETWEEN ? AND ?');
        params.push(from, to);
      }

      const [rows] = await pool.query(
        `SELECT transaction_code, transaction_type, flow_type, amount, admin_name, payment_method, transaction_date, description
         FROM transactions
         WHERE ${conditions.join(' AND ')}
         ORDER BY transaction_date DESC`,
        params
      );

      const headers = ['Transaction Code', 'Type', 'Flow', 'Amount (INR)', 'Admin', 'Payment Method', 'Date', 'Description'];
      const lines = [headers.join(',')];

      for (const r of rows) {
        lines.push([
          `"${r.transaction_code || ''}"`,
          `"${r.transaction_type || ''}"`,
          `"${r.flow_type || ''}"`,
          r.amount,
          `"${r.admin_name || ''}"`,
          `"${r.payment_method || ''}"`,
          `"${r.transaction_date ? String(r.transaction_date).slice(0, 10) : ''}"`,
          `"${(r.description || '').replace(/"/g, '""')}"`
        ].join(','));
      }
      csvData = lines.join('\n');
    } else if (scope === 'expenses') {
      let conditions = ['1=1'];
      let params = [];
      if (admin && admin !== 'All Admins' && admin !== 'ALL') {
        conditions.push('admin_name = ?');
        params.push(admin);
      }

      const [rows] = await pool.query(
        `SELECT expense_code, category, amount, admin_name, recipient, expense_date, remarks
         FROM expenses
         WHERE ${conditions.join(' AND ')}
         ORDER BY expense_date DESC`,
        params
      );

      const headers = ['Expense Code', 'Category', 'Amount (INR)', 'Admin', 'Recipient', 'Date', 'Remarks'];
      const lines = [headers.join(',')];

      for (const r of rows) {
        lines.push([
          `"${r.expense_code || ''}"`,
          `"${r.category || ''}"`,
          r.amount,
          `"${r.admin_name || ''}"`,
          `"${(r.recipient || '').replace(/"/g, '""')}"`,
          `"${r.expense_date ? String(r.expense_date).slice(0, 10) : ''}"`,
          `"${(r.remarks || '').replace(/"/g, '""')}"`
        ].join(','));
      }
      csvData = lines.join('\n');
    } else {
      // Default: Inventory Devices
      let conditions = ['1=1'];
      let params = [];
      if (status && status !== 'ALL') {
        conditions.push('status = ?');
        params.push(status);
      }
      if (from && to) {
        conditions.push('intake_date BETWEEN ? AND ?');
        params.push(from, to);
      }

      const [rows] = await pool.query(
        `SELECT device_code, brand, model, ram, storage, colour, \`condition\`, purchase_amount, paid_by, intake_date, status, remarks
         FROM devices
         WHERE ${conditions.join(' AND ')}
         ORDER BY intake_date DESC`,
        params
      );

      // Notice IMEI is excluded from export per PRD requirements
      const headers = ['Device Code', 'Brand', 'Model', 'RAM (GB)', 'Storage (GB)', 'Color', 'Condition', 'Purchase Amount (INR)', 'Paid By', 'Intake Date', 'Status', 'Remarks'];
      const lines = [headers.join(',')];

      for (const r of rows) {
        lines.push([
          `"${r.device_code || ''}"`,
          `"${r.brand || ''}"`,
          `"${r.model || ''}"`,
          r.ram,
          r.storage,
          `"${r.colour || ''}"`,
          `"${r.condition || ''}"`,
          r.purchase_amount,
          `"${r.paid_by || ''}"`,
          `"${r.intake_date ? String(r.intake_date).slice(0, 10) : ''}"`,
          `"${r.status || ''}"`,
          `"${(r.remarks || '').replace(/"/g, '""')}"`
        ].join(','));
      }
      csvData = lines.join('\n');
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    console.error('exportCsv error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function exportPdf(req, res) {
  try {
    const pool = getPool();
    const { scope = 'inventory', status, admin, from, to } = req.query;

    let title = 'MR.X.Change System Report';
    let rowsHtml = '';
    let summaryHtml = '';

    if (scope === 'ledger') {
      title = `Central Ledger Report ${admin ? `(${admin})` : ''}`;
      let conditions = ['1=1'];
      let params = [];
      if (admin && admin !== 'All Admins' && admin !== 'ALL') {
        conditions.push('admin_name = ?');
        params.push(admin);
      }
      const [rows] = await pool.query(`SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY transaction_date DESC LIMIT 100`, params);

      rowsHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px;">
          <thead>
            <tr style="background: #0b132b; color: #ffffff;">
              <th style="padding: 10px; text-align: left;">Code</th>
              <th style="padding: 10px; text-align: left;">Type</th>
              <th style="padding: 10px; text-align: left;">Flow</th>
              <th style="padding: 10px; text-align: right;">Amount</th>
              <th style="padding: 10px; text-align: left;">Admin</th>
              <th style="padding: 10px; text-align: left;">Date</th>
              <th style="padding: 10px; text-align: left;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr style="background: ${i % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 10px;">${r.transaction_code}</td>
                <td style="padding: 8px 10px;">${r.transaction_type}</td>
                <td style="padding: 8px 10px; font-weight: bold; color: ${r.flow_type === 'CREDIT' ? '#059669' : '#dc2626'}">${r.flow_type}</td>
                <td style="padding: 8px 10px; text-align: right;">₹${parseFloat(r.amount).toLocaleString('en-IN')}</td>
                <td style="padding: 8px 10px;">${r.admin_name}</td>
                <td style="padding: 8px 10px;">${r.transaction_date ? String(r.transaction_date).slice(0, 10) : ''}</td>
                <td style="padding: 8px 10px;">${r.description || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      title = `MR.X.Change Inventory Report (${status || 'All Stock'})`;
      let conditions = ['1=1'];
      let params = [];
      if (status && status !== 'ALL') {
        conditions.push('status = ?');
        params.push(status);
      }
      const [rows] = await pool.query(`SELECT * FROM devices WHERE ${conditions.join(' AND ')} ORDER BY intake_date DESC LIMIT 100`, params);

      rowsHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px;">
          <thead>
            <tr style="background: #0b132b; color: #ffffff;">
              <th style="padding: 10px; text-align: left;">Code</th>
              <th style="padding: 10px; text-align: left;">Brand & Model</th>
              <th style="padding: 10px; text-align: left;">Specs</th>
              <th style="padding: 10px; text-align: left;">Color</th>
              <th style="padding: 10px; text-align: right;">Paid Amount</th>
              <th style="padding: 10px; text-align: left;">Paid By</th>
              <th style="padding: 10px; text-align: left;">Date</th>
              <th style="padding: 10px; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr style="background: ${i % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 10px;">${r.device_code}</td>
                <td style="padding: 8px 10px; font-weight: bold;">${r.brand} ${r.model}</td>
                <td style="padding: 8px 10px;">${r.ram}GB / ${r.storage}GB</td>
                <td style="padding: 8px 10px;">${r.colour}</td>
                <td style="padding: 8px 10px; text-align: right;">₹${parseFloat(r.purchase_amount).toLocaleString('en-IN')}</td>
                <td style="padding: 8px 10px;">${r.paid_by || ''}</td>
                <td style="padding: 8px 10px;">${r.intake_date ? String(r.intake_date).slice(0, 10) : ''}</td>
                <td style="padding: 8px 10px;"><span style="background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${r.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 800; color: #0b132b; }
          .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          .meta { text-align: right; font-size: 12px; color: #64748b; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: flex-end; gap: 10px;">
          <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>
        <div class="header">
          <div>
            <div class="brand">MR.X.CHANGE</div>
            <div class="sub">Mobile Exchange & Inventory Management System</div>
          </div>
          <div class="meta">
            <div><strong>Report:</strong> ${title}</div>
            <div><strong>Generated On:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            ${admin ? `<div><strong>Scope:</strong> Admin ${admin}</div>` : ''}
          </div>
        </div>
        ${summaryHtml}
        ${rowsHtml}
        <div style="margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          MR.X.Change Confidential Audit & Management Report • Generated automatically
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error('exportPdf error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
