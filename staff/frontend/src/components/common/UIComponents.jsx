import React from 'react';

export function StatusBadge({ status }) {
  const getBadgeClass = () => {
    switch (status) {
      case 'IN_HAND': return 'badge badge-in-hand';
      case 'OLD_INVENTORY': return 'badge badge-old-inventory';
      case 'IN_REPAIR': return 'badge badge-in-repair';
      case 'REJECTED': return 'badge badge-rejected';
      case 'SOLD': return 'badge badge-sold';
      default: return 'badge';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'IN_HAND': return 'In-hand';
      case 'OLD_INVENTORY': return 'Intake';
      case 'IN_REPAIR': return 'In Repair';
      case 'REJECTED': return 'Rejected';
      case 'SOLD': return 'Sold';
      default: return status;
    }
  };

  return <span className={getBadgeClass()}>{getLabel()}</span>;
}

export function CurrencyAmount({ amount }) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);

  return <span style={{ fontWeight: 600 }}>{formatted}</span>;
}

export function KPICard({ title, value, subtext, isPositive, icon: Icon, iconBg = '#e0f2fe', iconColor = '#0284c7' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon-wrap" style={{ backgroundColor: iconBg }}>
        {Icon && <Icon size={24} color={iconColor} />}
      </div>
      <div className="kpi-info">
        <span className="kpi-title">{title}</span>
        <span className="kpi-value">{value}</span>
        {subtext && (
          <span className={`kpi-subtext ${isPositive !== undefined ? (isPositive ? 'trend-up' : 'trend-down') : ''}`}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
