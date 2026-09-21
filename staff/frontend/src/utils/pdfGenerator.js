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

// Direct CSV Blob Download (solves popup blocker issues)
export function exportToCsv(title, headers, rows, filename = 'report.csv') {
  const lines = [headers.join(',')];

  rows.forEach(row => {
    const formatted = row.map(cell => {
      const val = (cell === null || cell === undefined) ? '' : String(cell);
      return `"${val.replace(/"/g, '""')}"`;
    });
    lines.push(formatted.join(','));
  });

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
