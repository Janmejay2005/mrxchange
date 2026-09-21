import React from 'react';
import { FileText, Download, X } from 'lucide-react';
import { exportToPdf } from '../../utils/pdfGenerator';

export default function PdfExportModal({
  isOpen,
  onClose,
  title = 'Export PDF Report',
  headers = [],
  rows = [],
  filename = 'report.pdf',
  summaryInfo = []
}) {
  if (!isOpen) return null;

  const handleConfirmExport = () => {
    exportToPdf(title, headers, rows, filename);
    onClose();
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '750px',
          width: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                PDF Export Dialogue & Preview
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, marginTop: '2px' }}>
                Review report parameters and data scope before downloading PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          className="modal-body"
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: '#f8fafc'
          }}
        >
          {/* Metadata Summary Box */}
          <div
            style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Report Title
              </span>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {title}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Items
                </span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                  {rows.length} {rows.length === 1 ? 'Record' : 'Records'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Export Date
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                  {currentDate}
                </div>
              </div>

              {summaryInfo.map((item, idx) => (
                <div key={idx}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.label}
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: item.color || '#059669', marginTop: '2px' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview Table */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Document Content Preview ({rows.length} rows)
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {headers.map((h, i) => (
                      <th key={i} style={{ padding: '10px 12px', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length || 1} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No records available to export in this view.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: '8px 12px', color: cIdx === 0 ? '#0f172a' : '#475569', fontWeight: cIdx === 0 ? 600 : 400 }}>
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            background: '#ffffff',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px'
          }}
        >
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 18px', borderRadius: '8px' }}>
            Cancel
          </button>
          <button
            onClick={handleConfirmExport}
            disabled={rows.length === 0}
            className="btn-primary"
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              opacity: rows.length === 0 ? 0.6 : 1,
              cursor: rows.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Download size={16} /> Confirm & Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
