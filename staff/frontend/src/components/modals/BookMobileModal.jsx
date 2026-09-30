import React, { useState, useEffect } from 'react';
import { X, Smartphone, User, Phone, DollarSign, Calendar, CreditCard, CheckCircle, Tag, AlertCircle } from 'lucide-react';
import { CurrencyAmount } from '../common/UIComponents';

export default function BookMobileModal({ isOpen, onClose, device, onBookingSuccess }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    totalSellingPrice: '',
    advanceAmount: '',
    paymentMode: 'UPI',
    bookingDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (device) {
      setFormData({
        customerName: '',
        customerPhone: '',
        totalSellingPrice: device.purchase_amount ? String(Math.round(device.purchase_amount * 1.15)) : '',
        advanceAmount: '2000',
        paymentMode: 'UPI',
        bookingDate: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      setError('');
    }
  }, [device]);

  if (!isOpen || !device) return null;

  const sellingPrice = parseFloat(formData.totalSellingPrice) || 0;
  const advancePaid = parseFloat(formData.advanceAmount) || 0;
  const pendingBalance = Math.max(0, sellingPrice - advancePaid);
  const purchaseAmount = parseFloat(device.purchase_amount || device.amount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      setError('Please enter Customer Name.');
      return;
    }
    if (sellingPrice <= 0) {
      setError('Please enter a valid Total Selling Price.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingId = `BK-${Date.now().toString().slice(-6)}`;
      const bookedDate = formData.bookingDate || new Date().toISOString().split('T')[0];
      const adminPayer = device.paid_by || device.purchasedBy || 'Jeet Khubchandani';

      // 1. Create Exchange / Booking object for mrx_exchanges & mrx_booked
      const bookingRecord = {
        id: device.id || bookingId,
        exchangeId: bookingId,
        bookingId: bookingId,
        date: bookedDate,
        newBrand: device.brand || 'Device',
        newModel: device.model || 'Mobile',
        newStorage: device.storage || 128,
        newRam: device.ram || 6,
        newColor: device.colour || device.color || '-',
        newAmount: sellingPrice,
        oldBrand: device.brand || 'Device',
        oldModel: device.model || 'Mobile',
        oldAmount: purchaseAmount,
        purchasedAmount: purchaseAmount,
        exchangeValue: purchaseAmount,
        newPurchasedBy: adminPayer,
        oldPurchasedBy: adminPayer,
        bookedBy: adminPayer,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim() || '-',
        status: 'Booked',
        via: formData.paymentMode,
        viaMode: formData.paymentMode,
        paidAmount: advancePaid,
        pendingAmount: pendingBalance,
        totalAmount: sellingPrice,
        remarks: formData.remarks || `Booked from Add Inventory`
      };

      // 2. Save into mrx_exchanges
      const existingExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
      const filteredExchanges = existingExchanges.filter(e => String(e.id || e.exchangeId) !== String(bookingRecord.id));
      localStorage.setItem('mrx_exchanges', JSON.stringify([bookingRecord, ...filteredExchanges]));

      // 3. Save into mrx_pending_payments (Customer Receivable)
      const existingPending = JSON.parse(localStorage.getItem('mrx_pending_payments') || '[]');
      const pendingRecord = {
        id: `REC-${bookingId}`,
        date: bookedDate,
        customerName: formData.customerName.trim(),
        brand: device.brand || 'Device',
        model: device.model || 'Mobile',
        totalAmount: sellingPrice,
        paidAmount: advancePaid,
        pendingAmount: pendingBalance,
        status: pendingBalance > 0 ? 'Pending' : 'Received',
        mode: formData.paymentMode,
        type: 'CUSTOMER_RECEIVABLE',
        recordCategory: 'SELL_NEW'
      };
      const filteredPending = existingPending.filter(p => String(p.id) !== String(pendingRecord.id));
      localStorage.setItem('mrx_pending_payments', JSON.stringify([pendingRecord, ...filteredPending]));

      // 4. Update status of target device in mrx_old_inventory & mrx_devices to 'Booked'
      ['mrx_old_inventory', 'mrx_devices'].forEach(key => {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = list.map(item => {
            if (String(item.id) === String(device.id) || String(item.device_code) === String(device.device_code || device.id)) {
              return { ...item, status: 'Booked', isExchanged: true };
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {}
      });

      // 5. Dispatch sync events
      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('mrx_exchanges_updated'));
      window.dispatchEvent(new Event('mrx_pending_payments_updated'));
      window.dispatchEvent(new Event('storage'));

      alert(`✅ Mobile "${device.brand} ${device.model}" successfully Booked for ${formData.customerName}! Saved to Booked Inventory.`);
      
      if (onBookingSuccess) onBookingSuccess();
      onClose();
    } catch (err) {
      console.error('Error booking device:', err);
      setError('Failed to book device. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="modal-content" style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to right, #0284c7, #0369a1)',
          color: '#ffffff',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Book Mobile</h3>
              <span style={{ fontSize: '12px', opacity: 0.9 }}>Convert Add Inventory intake into a Customer Booking</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.8 }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Selected Device Preview Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <img 
              src={device.image_url || (Array.isArray(device.images) && device.images[0]) || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
              alt={device.model} 
              style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {device.brand} {device.model}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span>📦 {device.storage || 128} GB Storage</span>
                <span>•</span>
                <span>⚡ {device.ram || 6} GB RAM</span>
                <span>•</span>
                <span>🎨 {device.colour || device.color || 'Standard'}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, marginTop: '4px' }}>
                Paid Amount: ₹{(purchaseAmount).toLocaleString('en-IN')} (By {device.paid_by || 'Staff'})
              </div>
            </div>
          </div>

          {/* Booking Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                👤 Customer Name *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Rahul Sharma"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                required
                style={{ width: '100%', padding: '9px 12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                📞 Customer Contact Phone
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={formData.customerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                💰 Total Selling Price (₹) *
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 25000"
                value={formData.totalSellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, totalSellingPrice: e.target.value }))}
                required
                style={{ width: '100%', padding: '9px 12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                💵 Advance Amount Received (₹)
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 5000"
                value={formData.advanceAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, advanceAmount: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                💳 Payment Mode
              </label>
              <select
                className="form-control"
                value={formData.paymentMode}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px' }}
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="NetBanking">Net Banking</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                📅 Booking Date
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.bookingDate}
                onChange={(e) => setFormData(prev => ({ ...prev, bookingDate: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px' }}
              />
            </div>
          </div>

          {/* Balance Calculation Box */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1' }}>
              Pending Balance to Collect:
            </span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: pendingBalance > 0 ? '#ea580c' : '#16a34a' }}>
              ₹{pendingBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              📝 Notes / Booking Remarks
            </label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="e.g. Customer will collect on Sunday"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
              style={{ padding: '9px 18px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                padding: '9px 22px',
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle size={18} />
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
