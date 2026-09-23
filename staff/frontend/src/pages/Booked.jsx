import React, { useState } from 'react';
import { BookmarkCheck, Plus, Home, Search, FileText, X, CheckCircle, XCircle, Calendar, Filter } from 'lucide-react';
import { CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext, useNavigate } from 'react-router-dom';
import PdfExportModal from '../components/common/PdfExportModal';

export default function Booked() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [bookedByFilter, setBookedByFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [calendarFilter, setCalendarFilter] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Modal Form matching exact handwritten diagram layout [Book mob.]
  // (dd) = Dropdown, (R) = Remarks / Typeable field
  const [bookForm, setBookForm] = useState({
    brand: 'Apple', // Mob name (dd)
    model: '', // Mob model (R)
    storage: '128', // Storage (dd)
    ram: '6', // RAM (dd)
    bookedBy: 'Jeet Patel', // Booked by (dd)
    bookedAmount: '', // Booked Amt (R)
    bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`, // Booking I-d (R)
    platform: 'Store', // Platform (ddR)
    date: new Date().toISOString().split('T')[0], // Date = (R) (Calendar)
    viaMode: 'UPI', // VIA (dd)
    viaId: '', // VIA Card/UPI ID (R)
    customerName: '',
    customerPhone: ''
  });

  const [bookedList, setBookedList] = useState([
    { id: 1, bookingId: 'BK-1001', date: '2026-09-15', bookedBy: 'Jeet Patel', customerName: 'Rajesh Mehta', customerPhone: '+91 98250 12345', brand: 'Apple', model: 'iPhone 15 Pro Max', storage: 256, ram: 8, color: 'Natural Titanium', bookedAmount: 125000, viaMode: 'UPI', viaId: 'rajesh@upi', platform: 'Store', status: 'Booked' },
    { id: 2, bookingId: 'BK-1002', date: '2026-09-14', bookedBy: 'Sonal Sharma', customerName: 'Anita Shah', customerPhone: '+91 98980 67890', brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: 512, ram: 12, color: 'Titanium Gray', bookedAmount: 118000, viaMode: 'Card', viaId: 'HDFC-4821', platform: 'Online', status: 'Booked' },
    { id: 3, bookingId: 'BK-1003', date: '2026-09-13', bookedBy: 'Jeet Patel', customerName: 'Vikas Sharma', customerPhone: '+91 97123 45678', brand: 'Google Pixel', model: 'Pixel 8 Pro', storage: 256, ram: 12, color: 'Obsidian', bookedAmount: 92000, viaMode: 'Cash', viaId: '-', platform: 'Store', status: 'Booked' },
    { id: 4, bookingId: 'BK-1004', date: '2026-09-12', bookedBy: 'Rohit Kumar', customerName: 'Kunal Patel', customerPhone: '+91 99090 11223', brand: 'OnePlus', model: 'OnePlus 12', storage: 512, ram: 16, color: 'Flowy Emerald', bookedAmount: 64999, viaMode: 'UPI', viaId: 'kunal@okhdfcbank', platform: 'Store', status: 'Booked' },
    { id: 5, bookingId: 'BK-1005', date: '2026-09-11', bookedBy: 'Sonal Sharma', customerName: 'Priya Joshi', customerPhone: '+91 98799 44556', brand: 'Vivo', model: 'X100 Pro', storage: 512, ram: 16, color: 'Sunset Orange', bookedAmount: 89999, viaMode: 'Card', viaId: 'ICICI-9012', platform: 'Online', status: 'Booked' }
  ]);

  const toYMD = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const filteredBookings = bookedList.filter(item => {
    // Booked By filter
    if (bookedByFilter !== 'All' && !item.bookedBy.toLowerCase().includes(bookedByFilter.toLowerCase())) {
      return false;
    }
    // Mobile Brand filter
    if (brandFilter !== 'All' && item.brand !== brandFilter) {
      return false;
    }
    // Calendar Date filter (local + global toolbar)
    const activeDateFilter = calendarFilter || (selectedDate ? toYMD(selectedDate) : '');
    if (activeDateFilter) {
      const itemYMD = toYMD(item.date);
      if (itemYMD && itemYMD !== activeDateFilter) return false;
    }
    // Search query filter
    const q = (searchTerm || globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchText = `${item.bookingId} ${item.customerName} ${item.brand} ${item.model} ${item.bookedBy} ${item.viaMode} ${item.platform}`.toLowerCase().includes(q);
      if (!matchText) return false;
    }
    return true;
  });

  const totalBookingValue = filteredBookings.reduce((sum, item) => sum + (Number(item.bookedAmount) || 0), 0);
  const bookedByJeet = filteredBookings.filter(i => i.bookedBy.toLowerCase().includes('jeet'));
  const bookedBySonal = filteredBookings.filter(i => i.bookedBy.toLowerCase().includes('sonal'));
  const bookedByOthers = filteredBookings.filter(i => !bookedByJeet.includes(i) && !bookedBySonal.includes(i));

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!bookForm.model || !bookForm.bookedAmount) {
      alert('Please fill Mobile Model and Booked Amount');
      return;
    }

    const newBooking = {
      id: Date.now(),
      bookingId: bookForm.bookingId || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      date: bookForm.date || new Date().toISOString().split('T')[0],
      bookedBy: bookForm.bookedBy || 'Jeet Patel',
      customerName: bookForm.customerName || 'Walk-in Customer',
      customerPhone: bookForm.customerPhone || '-',
      brand: bookForm.brand,
      model: bookForm.model,
      storage: Number(bookForm.storage) || 128,
      ram: Number(bookForm.ram) || 6,
      bookedAmount: Number(bookForm.bookedAmount) || 0,
      viaMode: bookForm.viaMode,
      viaId: bookForm.viaId || '-',
      platform: bookForm.platform || 'Store',
      status: 'Booked'
    };

    setBookedList([newBooking, ...bookedList]);
    setIsBookModalOpen(false);
    setBookForm({
      brand: 'Apple',
      model: '',
      storage: '128',
      ram: '6',
      bookedBy: 'Jeet Patel',
      bookedAmount: '',
      bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      platform: 'Store',
      date: new Date().toISOString().split('T')[0],
      viaMode: 'UPI',
      viaId: '',
      customerName: '',
      customerPhone: ''
    });
    alert(`Booking "${newBooking.bookingId}" for ${newBooking.brand} ${newBooking.model} created successfully!`);
  };

  const handleBookAction = (id) => {
    const item = bookedList.find(b => b.id === id);
    if (item) {
      // Mark as Booked in local state
      setBookedList(prev => prev.map(b => b.id === id ? { ...b, isBooked: true, status: 'Booked' } : b));

      // Transfer data of new mobile to Exchange
      const exchangeItem = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        newBrand: item.brand,
        newModel: item.model,
        newStorage: item.storage,
        newRam: item.ram,
        newColor: item.color || 'Standard',
        newPurchasedBy: item.bookedBy || 'Staff',
        newAmount: item.bookedAmount || 0,
        oldBrand: 'Pending Trade-in',
        oldModel: 'TBD',
        oldStorage: 128,
        oldRam: 6,
        oldColor: 'Default',
        oldPurchasedBy: 'Customer',
        oldAmount: 0,
        status: 'Booked'
      };

      try {
        const existingExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
        localStorage.setItem('mrx_exchanges', JSON.stringify([exchangeItem, ...existingExchanges]));
      } catch (e) {
        console.error(e);
      }

      alert(`Booking "${item.bookingId}" (${item.brand} ${item.model}) confirmed! Data transferred to Exchange.`);
    }
  };

  const handleCancelBooking = (id) => {
    const item = bookedList.find(b => b.id === id);
    if (item) {
      if (window.confirm(`Cancel booking ${item.bookingId}? Item will be removed.`)) {
        setBookedList(prev => prev.filter(b => b.id !== id));
      }
    }
  };

  const handleExportPdf = () => {
    const headers = ['Sno', 'Booked By', 'Booking_Id', 'Mob Brandname', 'Mob Model', 'Storage', 'RAM', 'Booked Amount', 'VIA', 'Platform'];
    const rows = filteredBookings.map((b, idx) => [
      idx + 1,
      b.bookedBy,
      b.bookingId,
      b.brand,
      b.model,
      `${b.storage} GB`,
      `${b.ram} GB`,
      `Rs. ${b.bookedAmount.toLocaleString()}`,
      `${b.viaMode} (${b.viaId || '-'})`,
      b.platform
    ]);

    setExportModalConfig({
      isOpen: true,
      title: 'Booked Devices Register Report',
      headers,
      rows,
      filename: `Booked_Devices_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Bookings', value: `${filteredBookings.length} Devices`, color: '#0284c7' },
        { label: 'Total Booked Valuation', value: `Rs. ${totalBookingValue.toLocaleString()}`, color: '#16a34a' }
      ]
    });
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Booked</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Register pre-order bookings, track payment VIA modes, and manage customer stock allocations.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Booked</span>
          </div>
          <button onClick={handleExportPdf} className="btn-secondary" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={() => setIsBookModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 800, gap: '8px' }}>
            <Plus size={18} /> Book
          </button>
        </div>
      </div>

      {/* KPI Cards Summary Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Booked Devices</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
            {filteredBookings.length} Devices
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            <CurrencyAmount amount={totalBookingValue} /> total booked value
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booked by Jeet</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb', marginTop: '6px' }}>
            {bookedByJeet.length} Bookings
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            <CurrencyAmount amount={bookedByJeet.reduce((s, b) => s + b.bookedAmount, 0)} /> total
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #d946ef' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booked by Sonal</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#d946ef', marginTop: '6px' }}>
            {bookedBySonal.length} Bookings
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            <CurrencyAmount amount={bookedBySonal.reduce((s, b) => s + b.bookedAmount, 0)} /> total
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booked by Others</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
            {bookedByOthers.length} Bookings
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            <CurrencyAmount amount={bookedByOthers.reduce((s, b) => s + b.bookedAmount, 0)} /> total
          </div>
        </div>
      </div>

      {/* Search & Comprehensive Filters Bar (Calendar + Mobile Brand Filter + Booked By Filter) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search booking ID, model, VIA, platform..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Calendar Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} color="#0284c7" />
            <input 
              type="date" 
              value={calendarFilter}
              onChange={(e) => setCalendarFilter(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', cursor: 'pointer' }}
              title="Filter by booking date"
            />
            {calendarFilter && (
              <button 
                type="button" 
                onClick={() => setCalendarFilter('')} 
                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                Clear Date
              </button>
            )}
          </div>

          {/* Mobile Brand Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} color="#0284c7" />
            <select 
              value={brandFilter} 
              onChange={(e) => setBrandFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, background: '#ffffff' }}
            >
              <option value="All">All Mobile Brands</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Google Pixel">Google Pixel</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Vivo">Vivo</option>
              <option value="Xiaomi">Xiaomi</option>
            </select>
          </div>

          {/* Booked By Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Booked By:</label>
            <select 
              value={bookedByFilter} 
              onChange={(e) => setBookedByFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, background: '#ffffff' }}
            >
              <option value="All">All Staff / Admin</option>
              <option value="Jeet">Jeet Patel</option>
              <option value="Sonal">Sonal Sharma</option>
              <option value="Rohit">Rohit Kumar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Booked Items Table (EXACT COLUMNS FROM HANDWRITTEN DIAGRAM - Status Removed) */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Sno</th>
              <th>Booked By</th>
              <th>Booking_Id</th>
              <th>Mob Brandname</th>
              <th>Mob Model</th>
              <th>Storage</th>
              <th>RAM</th>
              <th>Booked Amount</th>
              <th>VIA</th>
              <th>Platform</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No active bookings match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b, idx) => (
                <tr key={b.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '10px', 
                      fontSize: '11px', 
                      fontWeight: 700,
                      background: b.bookedBy.includes('Jeet') ? '#e0f2fe' : b.bookedBy.includes('Sonal') ? '#f3e8ff' : '#f1f5f9',
                      color: b.bookedBy.includes('Jeet') ? '#0369a1' : b.bookedBy.includes('Sonal') ? '#7c3aed' : '#475569'
                    }}>
                      {b.bookedBy}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: '#0284c7' }}>{b.bookingId}</td>
                  <td style={{ fontWeight: 700 }}>{b.brand}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{b.model}</td>
                  <td>{b.storage} GB</td>
                  <td>{b.ram} GB</td>
                  <td style={{ fontWeight: 800, color: '#16a34a' }}><CurrencyAmount amount={b.bookedAmount} /></td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#334155' }}>{b.viaMode}</div>
                    {b.viaId && b.viaId !== '-' && (
                      <div style={{ fontSize: '10px', color: '#64748b' }}>({b.viaId})</div>
                    )}
                  </td>
                  <td>
                    <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                      {b.platform}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      {b.isBooked ? (
                        <span style={{ 
                          background: '#dcfce7', 
                          color: '#15803d', 
                          border: '1px solid #bbf7d0', 
                          padding: '6px 14px', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          fontWeight: 800, 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px' 
                        }}>
                          Booked ✔️
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleBookAction(b.id)}
                          className="btn-primary" 
                          style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', fontWeight: 800 }}
                          title="Confirm Booking & Transfer to Exchange"
                        >
                          Book
                        </button>
                      )}

                      <button 
                        onClick={() => handleCancelBooking(b.id)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Cancel & Remove Booking"
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Book Mobile Modal [Book mob.]
          EXACT 5-ROW HANDWRITTEN LAYOUT:
          Row 1: Mob name (dd) | Mob model (R)
          Row 2: Storage (dd)  | RAM (dd)
          Row 3: Booked by (dd)| Booked Amt (R)
          Row 4: Booking I-d (R)| Platform (ddR)
          Row 5: Date = (R) (Calendar) | VIA (dd + R)
      */}
      {isBookModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookmarkCheck size={22} color="#0284c7" />
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Book mob.</h2>
              </div>
              <button onClick={() => setIsBookModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleBookSubmit}>
              {/* Row 1: Mob name (dd) | Mob model (R) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                    Mob name <span style={{ fontSize: '10px', color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>dd (Dropdown)</span>
                  </label>
                  <select 
                    className="form-control"
                    value={bookForm.brand}
                    onChange={(e) => setBookForm({ ...bookForm, brand: e.target.value })}
                  >
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Google Pixel">Google Pixel</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Xiaomi">Xiaomi</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Mob model <span style={{ fontSize: '10px', color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>R (Remarks / Write)</span>
                  </label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="e.g. iPhone 15 Pro Max"
                    value={bookForm.model}
                    onChange={(e) => setBookForm({ ...bookForm, model: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Storage (dd) | RAM (dd) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Storage <span style={{ fontSize: '10px', color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>dd (Dropdown)</span>
                  </label>
                  <select className="form-control" value={bookForm.storage} onChange={(e) => setBookForm({ ...bookForm, storage: e.target.value })}>
                    <option value="64">64 GB</option>
                    <option value="128">128 GB</option>
                    <option value="256">256 GB</option>
                    <option value="512">512 GB</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    RAM <span style={{ fontSize: '10px', color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>dd (Dropdown)</span>
                  </label>
                  <select className="form-control" value={bookForm.ram} onChange={(e) => setBookForm({ ...bookForm, ram: e.target.value })}>
                    <option value="4">4 GB</option>
                    <option value="6">6 GB</option>
                    <option value="8">8 GB</option>
                    <option value="12">12 GB</option>
                    <option value="16">16 GB</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Booked by (dd) | Booked Amt (R) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Booked by <span style={{ fontSize: '10px', color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>dd (Dropdown)</span>
                  </label>
                  <select 
                    className="form-control"
                    value={bookForm.bookedBy}
                    onChange={(e) => setBookForm({ ...bookForm, bookedBy: e.target.value })}
                  >
                    <option value="Jeet Patel">Jeet Patel (Superadmin)</option>
                    <option value="Sonal Sharma">Sonal Sharma (Superadmin)</option>
                    <option value="Rohit Kumar">Rohit Kumar</option>
                    <option value="Neha Gupta">Neha Gupta</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Booked Amt <span style={{ fontSize: '10px', color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>R (Remarks / Write)</span>
                  </label>
                  <input 
                    type="number"
                    className="form-control"
                    placeholder="125000"
                    value={bookForm.bookedAmount}
                    onChange={(e) => setBookForm({ ...bookForm, bookedAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Row 4: Booking I-d (R) | Platform (ddR) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Booking I-d <span style={{ fontSize: '10px', color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>R (Remarks / Write)</span>
                  </label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="BK-1001"
                    value={bookForm.bookingId}
                    onChange={(e) => setBookForm({ ...bookForm, bookingId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Platform <span style={{ fontSize: '10px', color: '#7c3aed', background: '#f3e8ff', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>ddR (Select / Write)</span>
                  </label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Store / Online / Website"
                    value={bookForm.platform}
                    onChange={(e) => setBookForm({ ...bookForm, platform: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 5: Date = (R) Calendar | VIA (dd + R) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Date = <span style={{ fontSize: '10px', color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>R (Calendar Picker)</span>
                  </label>
                  <input 
                    type="date"
                    className="form-control"
                    value={bookForm.date}
                    onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    VIA <span style={{ fontSize: '10px', color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>dd (Mode)</span> + <span style={{ fontSize: '10px', color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>R (ID)</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <select 
                      className="form-control"
                      value={bookForm.viaMode} 
                      onChange={(e) => setBookForm({ ...bookForm, viaMode: e.target.value })}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                    </select>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Card/UPI ID"
                      value={bookForm.viaId}
                      onChange={(e) => setBookForm({ ...bookForm, viaId: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsBookModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontWeight: 800 }}>
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={exportModalConfig.isOpen}
        onClose={() => setExportModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={exportModalConfig.title}
        headers={exportModalConfig.headers}
        rows={exportModalConfig.rows}
        filename={exportModalConfig.filename}
        summaryInfo={exportModalConfig.summaryInfo}
      />
    </div>
  );
}
