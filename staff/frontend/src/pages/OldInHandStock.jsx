import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Search, 
  Layers, 
  HardDrive, 
  Cpu, 
  Download,
  FileText,
  ShoppingCart,
  Tag,
  Edit,
  Trash2,
  X,
  Camera,
  CheckCircle,
  XCircle,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';
import { deviceService, statsService, saleService } from '../services/api';
import { KPICard, CurrencyAmount } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import { exportToXls } from '../utils/pdfGenerator';
import PdfExportModal from '../components/common/PdfExportModal';
import CameraCaptureModal from '../components/common/CameraCaptureModal';

export default function OldInHandStock() {
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Edit Modal & Camera State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    brand: '',
    model: '',
    storage: '',
    ram: '',
    colour: '',
    purchase_amount: '',
    paid_by: '',
    image_url: ''
  });

  // Book New Device Modal State (opened via Exchange button)
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDeviceForExchange, setSelectedDeviceForExchange] = useState(null);
  const [bookForm, setBookForm] = useState({
    oldBrand: '',
    oldModel: '',
    oldStorage: '128',
    oldRam: '8',
    oldAmount: '0',
    oldPayBy: 'Staff',
    oldImage: '',
    exchangeValue: '0',
    newBrand: 'Apple',
    newModel: '',
    newStorage: '256',
    newRam: '8',
    newColor: '',
    newPayBy: '',
    platform: 'Offline / Store',
    purchasedAmount: '',
    via: 'Cash',
    accountId: ''
  });

  // Sell Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedSellDevice, setSelectedSellDevice] = useState(null);
  const [sellError, setSellError] = useState('');
  const [sellForm, setSellForm] = useState({
    model: '',
    unit: 1,
    soldBy: 'Jeet Khubchandani',
    soldTo: '',
    paymentType: 'COMPLETE',
    soldPrice: '',
    totalAmount: '',
    paidAmount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const openEditModal = (device) => {
    setEditForm({
      id: device.id,
      brand: device.brand || '',
      model: device.model || '',
      storage: device.storage || '',
      ram: device.ram || '',
      colour: device.colour || '',
      purchase_amount: device.purchase_amount || '',
      paid_by: device.paid_by || 'Staff',
      image_url: device.image_url || (device.images && device.images[0]) || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'
    });
    setIsEditModalOpen(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setDevices(prev => prev.map(d => String(d.id) === String(editForm.id) ? {
      ...d,
      brand: editForm.brand,
      model: editForm.model,
      storage: Number(editForm.storage),
      ram: Number(editForm.ram),
      colour: editForm.colour,
      purchase_amount: Number(editForm.purchase_amount),
      paid_by: editForm.paid_by,
      image_url: editForm.image_url,
      images: [editForm.image_url]
    } : d));

    // Update localStorage if saved in mrx_old_in_hand_stock
    const stored = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
    const updated = stored.map(item => String(item.id) === String(editForm.id) ? {
      ...item,
      brand: editForm.brand,
      model: editForm.model,
      storage: Number(editForm.storage),
      ram: Number(editForm.ram),
      colour: editForm.colour,
      purchase_amount: Number(editForm.purchase_amount),
      paid_by: editForm.paid_by,
      image_url: editForm.image_url,
      images: [editForm.image_url]
    } : item);
    localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updated));

    setIsEditModalOpen(false);
    alert('Device details and photo updated successfully!');
  };

  const handleDeleteDevice = (id) => {
    if (window.confirm('Are you sure you want to delete this device from Old In-hand stock?')) {
      setDevices(prev => prev.filter(d => String(d.id) !== String(id)));
      const stored = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      const updated = stored.filter(item => String(item.id) !== String(id));
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updated));
      alert('Device deleted successfully!');
    }
  };

  const handleOpenBookModal = (device) => {
    setSelectedDeviceForExchange(device);
    const amt = String(device.purchase_amount || device.amount || 0);
    setBookForm({
      oldBrand: device.brand || 'Samsung',
      oldModel: device.model || '',
      oldStorage: String(device.storage || 128),
      oldRam: String(device.ram || 8),
      oldAmount: amt,
      oldPayBy: device.paid_by || 'Staff',
      oldImage: device.image_url || (device.images && device.images[0]) || '',
      exchangeValue: amt,
      newBrand: 'Apple',
      newModel: '',
      newStorage: '256',
      newRam: '8',
      newColor: '',
      newPayBy: '',
      platform: 'Offline / Store',
      purchasedAmount: '',
      via: 'Cash',
      accountId: ''
    });
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!selectedDeviceForExchange) return;

    const oldAmt = Number(bookForm.oldAmount) || 0;
    const newAmt = Number(bookForm.purchasedAmount) || 0;
    const exVal = Number(bookForm.exchangeValue) || oldAmt;
    const exchangeId = `EXCH-${Date.now()}`;

    // 1. Add entry into mrx_exchanges so it's in sync with Exchange page
    const newExchangeEntry = {
      id: exchangeId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      newBrand: bookForm.newBrand,
      newModel: bookForm.newModel,
      newStorage: Number(bookForm.newStorage) || 256,
      newRam: Number(bookForm.newRam) || 12,
      newColor: bookForm.newColor || 'Standard',
      newPurchasedBy: bookForm.newPayBy || 'Customer',
      newAmount: newAmt + exVal,
      oldBrand: bookForm.oldBrand,
      oldModel: bookForm.oldModel,
      oldStorage: Number(bookForm.oldStorage) || 128,
      oldRam: Number(bookForm.oldRam) || 8,
      oldColor: selectedDeviceForExchange.colour || 'Default',
      oldPurchasedBy: bookForm.oldPayBy || 'Staff',
      oldAmount: oldAmt,
      oldImage: bookForm.oldImage || '',
      status: 'Booked'
    };

    try {
      const existingExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
      localStorage.setItem('mrx_exchanges', JSON.stringify([newExchangeEntry, ...existingExchanges]));
      window.dispatchEvent(new Event('mrx_exchanges_updated'));
    } catch (err) {
      console.error(err);
    }

    // 2. Update device in OldInHandStock with New Mobile data and status = 'Booked'
    const updatedDevices = devices.map(d => {
      if (String(d.id) === String(selectedDeviceForExchange.id)) {
        return {
          ...d,
          status: 'Booked',
          exchangeId: exchangeId,
          newBrand: bookForm.newBrand,
          newModel: bookForm.newModel,
          newStorage: Number(bookForm.newStorage) || 256,
          newRam: Number(bookForm.newRam) || 12,
          newColor: bookForm.newColor || 'Standard',
          newPurchasedBy: bookForm.newPayBy || 'Customer',
          newAmount: newAmt + exVal,
          exchangeValue: exVal
        };
      }
      return d;
    });

    setDevices(updatedDevices);
    try {
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updatedDevices));
      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }

    setIsBookModalOpen(false);
    alert(`New device "${bookForm.newBrand} ${bookForm.newModel}" booked! Row updated with Deliver and Rejected options.`);
  };

  const handleDeliverAction = (d) => {
    // Add item to mrx_new_in_hand_stock & mrx_pending_payments
    const newStockItem = {
      sno: Date.now(),
      date: new Date().toISOString().split('T')[0],
      brand: d.newBrand || d.brand,
      model: d.newModel || d.model,
      storage: d.newStorage || d.storage,
      ram: d.newRam || d.ram,
      color: d.newColor || d.colour,
      purchasedBy: d.newPurchasedBy || d.paid_by,
      amount: d.newAmount || d.purchase_amount,
      procedure: 'Sell'
    };

    const existingNewStock = JSON.parse(localStorage.getItem('mrx_new_in_hand_stock') || '[]');
    localStorage.setItem('mrx_new_in_hand_stock', JSON.stringify([newStockItem, ...existingNewStock]));

    // Pending payment entry
    const totalAmt = Number(d.newAmount || 0);
    const paidAmt = Number(d.purchase_amount || 0);
    const pendingAmt = Math.max(0, totalAmt - paidAmt);

    const pendingPaymentItem = {
      id: `EXCH-PAY-${Date.now()}`,
      date: d.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerName: d.newPurchasedBy || 'Customer',
      brand: d.newBrand || d.brand,
      model: d.newModel || d.model,
      imei: `35${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      totalAmount: totalAmt,
      paidAmount: paidAmt,
      pendingAmount: pendingAmt,
      status: pendingAmt === 0 ? 'Received' : 'Pending',
      mode: 'Exchange Trade-in',
      remarks: `Delivered from Old In-hand Stock`
    };

    const existingPending = JSON.parse(localStorage.getItem('mrx_pending_payments') || '[]');
    localStorage.setItem('mrx_pending_payments', JSON.stringify([pendingPaymentItem, ...existingPending]));
    window.dispatchEvent(new Event('mrx_pending_payments_updated'));

    // Clear old mobile details and set status to 'Delivered'
    const updatedDevices = devices.map(item => {
      if (String(item.id) === String(d.id)) {
        return {
          ...item,
          status: 'Delivered',
          oldRemoved: true
        };
      }
      return item;
    });

    setDevices(updatedDevices);
    try {
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updatedDevices));
      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    // Update mrx_exchanges if exchangeId exists
    if (d.exchangeId) {
      try {
        const storedExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
        const updatedExchanges = storedExchanges.map(ex => {
          if (String(ex.id) === String(d.exchangeId)) {
            return {
              ...ex,
              status: 'Delivered',
              oldBrand: '-',
              oldModel: '-',
              oldStorage: '-',
              oldRam: '-',
              oldColor: '-',
              oldPurchasedBy: '-',
              oldAmount: 0
            };
          }
          return ex;
        });
        localStorage.setItem('mrx_exchanges', JSON.stringify(updatedExchanges));
        window.dispatchEvent(new Event('mrx_exchanges_updated'));
      } catch (e) {}
    }

    alert(`Device "${d.newBrand || d.brand} ${d.newModel || d.model}" marked as Delivered! Old mobile details removed and Sell button activated.`);
  };

  const handleRejectAction = (d) => {
    // Revert row back to original old mobile phone data
    const updatedDevices = devices.map(item => {
      if (String(item.id) === String(d.id)) {
        const { status, exchangeId, newBrand, newModel, newStorage, newRam, newColor, newPurchasedBy, newAmount, exchangeValue, oldRemoved, ...rest } = item;
        return {
          ...rest,
          status: 'OLD_IN_HAND'
        };
      }
      return item;
    });

    setDevices(updatedDevices);
    try {
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updatedDevices));
      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    // Remove from mrx_exchanges if exchangeId exists
    if (d.exchangeId) {
      try {
        const storedExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
        const updatedExchanges = storedExchanges.filter(ex => String(ex.id) !== String(d.exchangeId));
        localStorage.setItem('mrx_exchanges', JSON.stringify(updatedExchanges));
        window.dispatchEvent(new Event('mrx_exchanges_updated'));
      } catch (e) {}
    }

    alert(`Booking Rejected! Old mobile device restored with Exchange and Delete options.`);
  };

  const openSellModal = (device) => {
    setSelectedSellDevice(device);
    setSellError('');
    const fullModelName = `${device.newBrand || device.brand} ${device.newModel || device.model}`;
    const initialPrice = device.newAmount || device.purchase_amount || 0;

    setSellForm({
      model: fullModelName,
      unit: 1,
      soldBy: device.newPurchasedBy || device.paid_by || 'Jeet Khubchandani',
      soldTo: device.newPurchasedBy || 'Customer',
      paymentType: 'COMPLETE',
      soldPrice: initialPrice,
      totalAmount: initialPrice,
      paidAmount: initialPrice,
      date: new Date().toISOString().split('T')[0]
    });
    setIsSellModalOpen(true);
  };

  const handleSellSubmit = (e) => {
    e.preventDefault();
    setSellError('');

    if (!selectedSellDevice) return;

    const requestedUnits = Number(sellForm.unit) || 1;

    // Record sale in mrx_sales
    const newSale = {
      id: `SALE-${Date.now()}`,
      date: sellForm.date,
      brand: selectedSellDevice.newBrand || selectedSellDevice.brand,
      model: selectedSellDevice.newModel || selectedSellDevice.model,
      customerName: sellForm.soldTo,
      soldBy: sellForm.soldBy,
      quantity: requestedUnits,
      unitPrice: Number(sellForm.soldPrice) || 0,
      totalAmount: Number(sellForm.totalAmount) || 0,
      paidAmount: Number(sellForm.paidAmount) || 0,
      paymentMode: sellForm.paymentType || 'Cash',
      status: 'Sold'
    };

    const existingSales = JSON.parse(localStorage.getItem('mrx_sales') || '[]');
    localStorage.setItem('mrx_sales', JSON.stringify([newSale, ...existingSales]));

    // Mark row as Sold in OldInHandStock
    const updatedDevices = devices.map(item => {
      if (String(item.id) === String(selectedSellDevice.id)) {
        return {
          ...item,
          status: 'Sold'
        };
      }
      return item;
    });

    setDevices(updatedDevices);
    try {
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify(updatedDevices));
      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('mrx_sales_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    // Update mrx_exchanges if exchangeId exists
    if (selectedSellDevice.exchangeId) {
      try {
        const storedExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
        const updatedExchanges = storedExchanges.map(ex => {
          if (String(ex.id) === String(selectedSellDevice.exchangeId)) {
            return {
              ...ex,
              status: 'Sold'
            };
          }
          return ex;
        });
        localStorage.setItem('mrx_exchanges', JSON.stringify(updatedExchanges));
        window.dispatchEvent(new Event('mrx_exchanges_updated'));
      } catch (e) {}
    }

    setIsSellModalOpen(false);
    alert(`Successfully sold "${selectedSellDevice.newBrand || selectedSellDevice.brand} ${selectedSellDevice.newModel || selectedSellDevice.model}"! Status updated to Sold ✔️.`);
  };

  const fetchOldInHandStock = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDevices({
        status: 'OLD_IN_HAND',
        q: localSearch || globalSearch || '',
        brand: selectedBrand,
        from: selectedDate || '',
        to: selectedDate || ''
      });
      const dataList = Array.isArray(res) ? res : (res?.data || []);
      const cancelledItems = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');

      const rawCombined = [...cancelledItems, ...dataList];
      const seenFingerprints = new Set();
      const allInHand = [];

      for (const item of rawCombined) {
        if (!item) continue;
        const brand = (item.brand || '').trim().toLowerCase();
        const model = (item.model || '').trim().toLowerCase();
        const amount = Number(item.purchase_amount || item.amount || 0);
        const paidBy = (item.paid_by || item.purchasedBy || '').trim().toLowerCase();
        const date = item.intake_date || item.created_at || item.date || '';

        const fingerprint = `${item.id || ''}|${brand}|${model}|${item.storage || ''}|${item.ram || ''}|${amount}|${paidBy}|${date}`;

        if (!seenFingerprints.has(fingerprint)) {
          seenFingerprints.add(fingerprint);
          allInHand.push(item);
        }
      }

      setDevices(allInHand.filter(d => d.status === 'OLD_IN_HAND' || !d.status || d.status === 'Booked' || d.status === 'BOOKED' || d.status === 'Delivered' || d.status === 'Sold'));

      const statsRes = await statsService.getInHandStats({ type: 'OLD_IN_HAND' });
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      const cancelledItems = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      setDevices(cancelledItems);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOldInHandStock();

    const handleSync = () => fetchOldInHandStock();
    window.addEventListener('storage', handleSync);
    window.addEventListener('mrx_inventory_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mrx_inventory_updated', handleSync);
    };
  }, [localSearch, globalSearch, selectedBrand, selectedDate]);

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

  const filteredDevices = devices.filter(d => {
    if (selectedBrand !== 'All Brands' && d.brand !== selectedBrand) return false;
    if (selectedDate) {
      const devYMD = toYMD(d.intake_date || d.created_at || d.date);
      const selYMD = toYMD(selectedDate);
      if (devYMD && selYMD && devYMD !== selYMD) return false;
    }
    return true;
  });
  const handleExportXls = () => {
    const headers = ['#', 'Device Code', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Purchase Amount (Rs)', 'Intake Date', 'Status'];
    const rows = filteredDevices.map((d, idx) => [
      idx + 1,
      d.device_code || d.id,
      d.brand,
      d.model,
      `${d.storage} GB`,
      `${d.ram} GB`,
      d.colour || '-',
      d.purchase_amount,
      d.intake_date || '-',
      d.status || 'OLD_IN_HAND'
    ]);
    exportToXls('Old In-hand Stock Report', headers, rows, `Old_In_Hand_Stock_${new Date().toISOString().slice(0, 10)}.xls`);
  };

  const handleExportPdf = () => {
    const headers = ['#', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Amount (Rs)', 'Status'];
    const rows = filteredDevices.map((d, idx) => [
      idx + 1,
      d.brand,
      d.model,
      `${d.storage} GB`,
      `${d.ram} GB`,
      d.colour || '-',
      `Rs. ${d.purchase_amount}`,
      d.status || 'OLD_IN_HAND'
    ]);
    const totalVal = filteredDevices.reduce((sum, d) => sum + (Number(d.purchase_amount) || 0), 0);
    setExportModalConfig({
      isOpen: true,
      title: 'Old In-hand Stock PDF Report',
      headers,
      rows,
      filename: `Old_In_Hand_Stock_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Total Stock Value', value: `Rs. ${totalVal.toLocaleString()}`, color: '#0284c7' }
      ]
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Old In-hand Stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Pre-existing / acquired mobile devices ready for customer sale • {selectedDate ? `Date: ${selectedDate}` : 'All Stock'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportXls} className="btn-secondary" title="Export Excel (.xls)">
            <Download size={15} color="#0284c7" /> Excel (.xls)
          </button>
          <button onClick={handleExportPdf} className="btn-secondary" title="Export PDF">
            <FileText size={15} color="#dc2626" /> PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard 
          title="Old In-hand Units" 
          value={stats?.total_in_hand || devices.length} 
          icon={Smartphone}
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard 
          title="Unique Models" 
          value={stats?.unique_models || '14'} 
          icon={Layers}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <KPICard 
          title="Total Storage (GB)" 
          value={stats?.total_storage?.toLocaleString() || '1,840'} 
          icon={HardDrive}
          iconBg="#f3e8ff"
          iconColor="#9333ea"
        />
        <KPICard 
          title="Total RAM (GB)" 
          value={stats?.total_ram?.toLocaleString() || '320'} 
          icon={Cpu}
          iconBg="#ffedd5"
          iconColor="#ea580c"
        />
      </div>

      {/* Filter toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ width: '280px' }}>
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search old in-hand devices..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <select 
          className="form-control" 
          style={{ width: '180px' }}
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
        >
          <option value="All Brands">All Brands</option>
          <option value="Apple">Apple</option>
          <option value="Samsung">Samsung</option>
          <option value="OnePlus">OnePlus</option>
          <option value="Xiaomi">Xiaomi</option>
        </select>
      </div>

      {/* Table: Brand, Model, Storage, RAM, Color Name, Paid Amount, Purchased By, Date Added, Action (Sell) */}
      {/* IMEI is omitted per PRD */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Storage</th>
              <th>RAM</th>
              <th>Color Name</th>
              <th>Purchase Price</th>
              <th>Purchased By</th>
              <th>Date Added</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading stock...
                </td>
              </tr>
            ) : filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No Old In-hand devices available.
                </td>
              </tr>
            ) : (
              filteredDevices.map((d) => {
                const isBooked = d.status === 'Booked' || d.status === 'BOOKED';
                const isDelivered = d.status === 'Delivered';
                const isSold = d.status === 'Sold';
                const showNewDetails = isBooked || isDelivered || isSold;

                const displayBrand = showNewDetails ? (d.newBrand || d.brand) : d.brand;
                const displayModel = showNewDetails ? (d.newModel || d.model) : d.model;
                const displayStorage = showNewDetails ? (d.newStorage || d.storage) : d.storage;
                const displayRam = showNewDetails ? (d.newRam || d.ram) : d.ram;
                const displayColor = showNewDetails ? (d.newColor || d.colour) : d.colour;
                const displayAmount = showNewDetails ? (d.newAmount || d.purchase_amount) : d.purchase_amount;
                const displayPurchasedBy = showNewDetails ? (d.newPurchasedBy || d.paid_by) : d.paid_by;

                return (
                  <tr key={d.id}>
                    <td data-label="Image">
                      {d.images && d.images.length > 1 ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <img 
                            src={d.images[0]} 
                            alt="Front" 
                            className="device-thumb" 
                            title="Front View"
                          />
                          <img 
                            src={d.images[1]} 
                            alt="Back" 
                            className="device-thumb" 
                            title="Back View"
                          />
                        </div>
                      ) : (
                        <img 
                          src={d.image_url || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'} 
                          alt={displayModel} 
                          className="device-thumb" 
                        />
                      )}
                    </td>

                    <td data-label="Brand" style={{ fontWeight: 700 }}>{displayBrand}</td>
                    <td data-label="Model">{displayModel}</td>
                    <td data-label="Storage">{displayStorage} GB</td>
                    <td data-label="RAM">{displayRam} GB</td>
                    <td data-label="Color Name"><span style={{ fontWeight: 600 }}>{displayColor || '-'}</span></td>
                    <td data-label="Purchase Price">
                      <CurrencyAmount amount={displayAmount} />
                      {showNewDetails && <span style={{ fontSize: '11px', color: '#0284c7', marginLeft: '4px' }}>🔄</span>}
                    </td>
                    <td data-label="Purchased By"><span style={{ color: '#0284c7', fontWeight: 600 }}>{displayPurchasedBy || 'Rohit'}</span></td>
                    <td data-label="Date Added">{d.intake_date ? String(d.intake_date).slice(0, 10) : 'Today'}</td>
                    <td data-label="Action" style={{ textAlign: 'center' }}>
                      {isSold ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Sold ✔️
                        </span>
                      ) : isDelivered ? (
                        <button 
                          onClick={() => openSellModal(d)}
                          className="btn-primary"
                          style={{ padding: '6px 16px', fontWeight: 800, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <ShoppingBag size={14} /> Sell
                        </button>
                      ) : isBooked ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            onClick={() => handleDeliverAction(d)}
                            style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Deliver new phone -> Remove old phone details & enable Sell button"
                          >
                            <CheckCircle size={14} /> Deliver
                          </button>
                          <button 
                            onClick={() => handleRejectAction(d)}
                            style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Reject booking -> Restore old phone details with Exchange and Delete options"
                          >
                            <XCircle size={14} /> Rejected
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenBookModal(d)}
                            style={{ background: '#f59e0b', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                            title="Book New Device for exchange"
                          >
                            Exchange
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDevice(d.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Device Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>Edit Old In-hand Device</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>Update stock specifications and purchasing details.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleSaveEdit}>
              {/* Device Photo / Image Edit Section */}
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0284c7', margin: 0 }}>
                    📸 Device Photo / Image
                  </label>
                  <button 
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Camera size={13} /> Take Photo via Camera
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {editForm.image_url ? (
                    <img 
                      src={editForm.image_url} 
                      alt="Preview" 
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#64748b' }}>
                      No Image
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Upload New Photo</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFileChange} 
                      style={{ fontSize: '12px', marginBottom: '6px', width: '100%' }}
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Or paste Image URL (e.g. https://...)" 
                      value={editForm.image_url} 
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} 
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">Brand Name *</label>
                  <input type="text" className="form-control" value={editForm.brand} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Model *</label>
                  <input type="text" className="form-control" value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Storage (GB) *</label>
                  <input type="number" className="form-control" value={editForm.storage} onChange={(e) => setEditForm({ ...editForm, storage: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">RAM (GB) *</label>
                  <input type="number" className="form-control" value={editForm.ram} onChange={(e) => setEditForm({ ...editForm, ram: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Color *</label>
                  <input type="text" className="form-control" value={editForm.colour} onChange={(e) => setEditForm({ ...editForm, colour: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Purchased By *</label>
                  <input type="text" className="form-control" value={editForm.paid_by} onChange={(e) => setEditForm({ ...editForm, paid_by: e.target.value })} required />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Purchase Price (₹) *</label>
                <input type="number" className="form-control" value={editForm.purchase_amount} onChange={(e) => setEditForm({ ...editForm, purchase_amount: e.target.value })} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book New Device Modal (Triggered by clicking Exchange on an Old In-hand item) */}
      {isBookModalOpen && selectedDeviceForExchange && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'sticky', top: 0, background: '#fff', zIndex: 10, paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>Book New Device for Exchange</h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', margin: 0 }}>Enter booking details for the new device to complete the exchange transaction.</p>
              </div>
              <button onClick={() => setIsBookModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleBookSubmit}>
              {/* SECTION 1: Exchange Old Phone (Pre-filled from selected old in-hand device) */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔄 Selected Old Phone Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Old Brand:</strong> {bookForm.oldBrand}</div>
                  <div><strong>Old Model:</strong> {bookForm.oldModel}</div>
                  <div><strong>Storage / RAM:</strong> {bookForm.oldStorage} GB / {bookForm.oldRam} GB</div>
                  <div><strong>Trade Valuation:</strong> ₹{Number(bookForm.oldAmount).toLocaleString()}</div>
                  <div><strong>Evaluated By:</strong> {bookForm.oldPayBy}</div>
                </div>
              </div>

              {/* SECTION 2: Booking New Phone */}
              <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0369a1', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📱 Booking New Phone Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="form-label">Exchange Value (₹) *</label>
                    <input type="number" className="form-control" placeholder="₹ Trade valuation" value={bookForm.exchangeValue} onChange={(e) => setBookForm({ ...bookForm, exchangeValue: e.target.value })} required />
                  </div>

                  <div>
                    <label className="form-label">New Phone Brand *</label>
                    <select className="form-control" value={bookForm.newBrand} onChange={(e) => setBookForm({ ...bookForm, newBrand: e.target.value })}>
                      <option value="Apple">Apple</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Google Pixel">Google Pixel</option>
                      <option value="OnePlus">OnePlus</option>
                      <option value="Vivo">Vivo</option>
                      <option value="Oppo">Oppo</option>
                      <option value="Xiaomi">Xiaomi</option>
                      <option value="Nothing">Nothing</option>
                      <option value="Motorola">Motorola</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">New Phone Model *</label>
                    <input type="text" className="form-control" placeholder="e.g. Pixel 8 Pro / iPhone 15 Pro" value={bookForm.newModel} onChange={(e) => setBookForm({ ...bookForm, newModel: e.target.value })} required />
                  </div>

                  <div>
                    <label className="form-label">Storage (GB) *</label>
                    <select className="form-control" value={bookForm.newStorage} onChange={(e) => setBookForm({ ...bookForm, newStorage: e.target.value })}>
                      <option value="128">128 GB</option>
                      <option value="256">256 GB</option>
                      <option value="512">512 GB</option>
                      <option value="1024">1 TB</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">RAM (GB) *</label>
                    <select className="form-control" value={bookForm.newRam} onChange={(e) => setBookForm({ ...bookForm, newRam: e.target.value })}>
                      <option value="6">6 GB</option>
                      <option value="8">8 GB</option>
                      <option value="12">12 GB</option>
                      <option value="16">16 GB</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Color *</label>
                    <input type="text" className="form-control" placeholder="e.g. Natural Titanium / Bay Blue" value={bookForm.newColor} onChange={(e) => setBookForm({ ...bookForm, newColor: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Customer Name / Pay By *</label>
                    <input type="text" className="form-control" placeholder="Customer name" value={bookForm.newPayBy} onChange={(e) => setBookForm({ ...bookForm, newPayBy: e.target.value })} required />
                  </div>

                  <div>
                    <label className="form-label">Platform *</label>
                    <select className="form-control" value={bookForm.platform} onChange={(e) => setBookForm({ ...bookForm, platform: e.target.value })}>
                      <option value="Offline / Store">Offline / Store</option>
                      <option value="Website">Website</option>
                      <option value="Amazon">Amazon</option>
                      <option value="Flipkart">Flipkart</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Purchased Amount (Paid ₹) *</label>
                    <input type="number" className="form-control" placeholder="₹ Amount paid" value={bookForm.purchasedAmount} onChange={(e) => setBookForm({ ...bookForm, purchasedAmount: e.target.value })} required />
                  </div>

                  <div>
                    <label className="form-label">Via (Cash/Card/UPI) *</label>
                    <select className="form-control" value={bookForm.via} onChange={(e) => setBookForm({ ...bookForm, via: e.target.value })}>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Account ID / UTR</label>
                    <input type="text" className="form-control" placeholder="Enter account ID / Transaction ref" value={bookForm.accountId} onChange={(e) => setBookForm({ ...bookForm, accountId: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsBookModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Submit Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Mobile Modal */}
      {isSellModalOpen && selectedSellDevice && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#059669', margin: 0 }}>Sell Mobile</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>Complete sales transaction for delivered exchange device.</p>
              </div>
              <button onClick={() => setIsSellModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            {sellError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>{sellError}</span>
              </div>
            )}

            <form onSubmit={handleSellSubmit}>
              {/* Device Model */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0284c7' }}>Device Model *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={sellForm.model} 
                  onChange={(e) => setSellForm({ ...sellForm, model: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                {/* Sold by */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Sold by *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={sellForm.soldBy} 
                    onChange={(e) => setSellForm({ ...sellForm, soldBy: e.target.value })} 
                    required 
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, color: '#dc2626' }}>
                    Sell Quantity *
                  </label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={sellForm.unit} 
                    onChange={(e) => {
                      const u = parseInt(e.target.value) || 0;
                      const sp = Number(sellForm.soldPrice) || 0;
                      setSellForm({ ...sellForm, unit: u, totalAmount: u * sp });
                    }} 
                    min="1"
                    required 
                  />
                </div>
              </div>

              {/* Customer Name */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Customer Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter customer or party name" 
                  value={sellForm.soldTo} 
                  onChange={(e) => setSellForm({ ...sellForm, soldTo: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                {/* Price Per Unit */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Price Per Unit (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={sellForm.soldPrice} 
                    onChange={(e) => {
                      const sp = e.target.value;
                      const u = Number(sellForm.unit) || 1;
                      setSellForm({ ...sellForm, soldPrice: sp, totalAmount: Number(sp) * u });
                    }} 
                    required 
                  />
                </div>

                {/* Total Selling Price */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, color: '#059669' }}>Total Selling Price (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={sellForm.totalAmount} 
                    onChange={(e) => setSellForm({ ...sellForm, totalAmount: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              {/* Paid Amount */}
              <div style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Paid Amount (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="₹ Amount paid so far" 
                  value={sellForm.paidAmount} 
                  onChange={(e) => setSellForm({ ...sellForm, paidAmount: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsSellModalOpen(false)} className="btn-secondary">Cancel</button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ 
                    padding: '10px 24px', 
                    fontWeight: 800,
                    background: '#059669'
                  }}
                >
                  Confirm Sale ({sellForm.unit} Unit)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Export Preview Dialogue Modal */}
      <PdfExportModal
        isOpen={exportModalConfig.isOpen}
        onClose={() => setExportModalConfig({ ...exportModalConfig, isOpen: false })}
        title={exportModalConfig.title}
        headers={exportModalConfig.headers}
        rows={exportModalConfig.rows}
        filename={exportModalConfig.filename}
        summaryInfo={exportModalConfig.summaryInfo}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setEditForm(prev => ({ ...prev, image_url: dataUrl }))}
      />
    </div>
  );
}
