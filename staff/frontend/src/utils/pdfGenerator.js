import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export Dataset to PDF
export function exportToPdf(title, headers, rows, filename = 'report.pdf') {
  const doc = new jsPDF('p', 'pt', 'a4');

  // Title & Header Branding
  doc.setFillColor(11, 19, 43); // #0b132b
  doc.rect(0, 0, 595.28, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MR.X.CHANGE', 40, 36);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(title || 'Inventory & Financial Report', 400, 36, { align: 'right' });

  // Subtitle / Date
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Report: ${title}`, 40, 85);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, 98);

  // AutoTable
  autoTable(doc, {
    startY: 115,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [2, 132, 199], // #0284c7
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [15, 23, 42]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 40, right: 40 }
  });

  doc.save(filename);
}

// Print Dataset via PDF View Window
export function printPdf(title, headers, rows) {
  const doc = new jsPDF('p', 'pt', 'a4');

  doc.setFillColor(11, 19, 43);
  doc.rect(0, 0, 595.28, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MR.X.CHANGE', 40, 36);

  doc.setFontSize(12);
  doc.text(`Report: ${title}`, 40, 85);

  autoTable(doc, {
    startY: 105,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255] },
    margin: { left: 40, right: 40 }
  });

  // Open PDF in print window
  const string = doc.output('datauristring');
  const iframe = `<iframe width='100%' height='100%' src='${string}'></iframe>`;
  const x = window.open();
  x.document.open();
  x.document.write(iframe);
  x.document.close();
}

// Direct XLS Excel Blob Download
export function exportToXls(title, headers, rows, filename = 'report.xls') {
  const cleanHeaders = headers || (rows.length > 0 ? Object.keys(rows[0]) : []);
  
  const titleRow = title 
    ? `<tr><th colspan="${cleanHeaders.length}" style="background-color: #0b132b; color: #ffffff; font-size: 16px; font-weight: bold; padding: 12px; text-align: center;">${title}</th></tr>`
    : '';

  const headerCols = cleanHeaders
    .map(h => `<th style="background-color: #0284c7; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1;">${h}</th>`)
    .join('');
  const headerRow = `<tr>${headerCols}</tr>`;

  const bodyRows = rows.map((row, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const rowValues = Array.isArray(row) ? row : Object.values(row);
    const cols = rowValues.map(cell => {
      const val = (cell === null || cell === undefined) ? '' : String(cell);
      return `<td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${val.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
    }).join('');
    return `<tr style="background-color: ${bg};">${cols}</tr>`;
  }).join('');

  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${(title || 'Sheet1').replace(/[\\/?*\[\]]/g, '').slice(0, 31)}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px;">
          ${titleRow}
          ${headerRow}
          ${bodyRows}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const finalFilename = filename.toLowerCase().endsWith('.xls') ? filename : `${filename.replace(/\.csv$/, '')}.xls`;
  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Alias exportToCsv to exportToXls for legacy callers
export const exportToCsv = exportToXls;

