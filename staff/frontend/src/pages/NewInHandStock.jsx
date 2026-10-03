import React, { useState, useEffect } from 'react';
import { Package, Plus, Home, Search, FileText, X, Edit, Trash2, Camera, ShoppingBag, AlertTriangle, CheckCircle, UserCheck, Users, RefreshCw } from 'lucide-react';
import { CurrencyAmount, KPICard } from '../components/common/UIComponents';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PdfExportModal from '../components/common/PdfExportModal';
import CameraCaptureModal from '../components/common/CameraCaptureModal';

import { deviceService } from '../services/api';

export default function NewInHandStock() {
  const { user, isSuperAdmin } = useAuth();
  const { globalSearch, selectedDate } = useOutletContext() || {};
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [brand, setBrand] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  // Account Scope Bifurcation State
  const loggedInAccountName = user?.name || user?.username || 'Jeet Khubchandani';
  const [accountFilter, setAccountFilter] = useState('All Accounts');

  const [exportModalConfig, setExportModalConfig] = useState({
    isOpen: false,
    title: '',
    headers: [],
    rows: [],
    filename: '',
    summaryInfo: []
  });

  // Book / Sell Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [sellError, setSellError] = useState('');
  const [sellForm, setSellForm] = useState({
    model: '',
    unit: 1,
    soldBy: loggedInAccountName,
    soldTo: '',
    paymentType: 'COMPLETE',
    soldPrice: '',
    totalAmount: '',
    paidAmount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Exchange Modal State
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isExchangeCameraOpen, setIsExchangeCameraOpen] = useState(false);
  const [selectedExchangeStockItem, setSelectedExchangeStockItem] = useState(null);
  const [exchangeForm, setExchangeForm] = useState({
    customerName: '',
    exchangeValue: '0',
    newBrand: '',
    newModel: '',
    newStorage: '128',
    newRam: '8',
    newColor: '-',
    newPayBy: loggedInAccountName,
    purchasedAmount: '0',
    oldBrand: 'Samsung',
    oldModel: '',
    oldStorage: '128',
    oldRam: '8',
    oldAmount: '0',
    oldPayBy: 'Staff',
    oldImage: '',
    via: 'Cash'
  });

  // Edit Device Modal & Camera State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    sno: null,
    brand: '',
    model: '',
    storage: '',
    ram: '',
    color: '',
    purchasedBy: '',
    amount: '',
    totalUnits: 1,
    image_url: ''
  });

  const [stock, setStock] = useState([]);

  const accountOptions = React.useMemo(() => {
    const list = ['All Accounts', 'Jeet Khubchandani', 'Sonal Wadwani'];
    try {
      const customMembers = JSON.parse(localStorage.getItem('mrx_team_members') || '[]');
      customMembers.forEach(m => {
        const name = m.name || m.username;
        if (name && !list.includes(name)) list.push(name);
      });
    } catch (e) {}

    stock.forEach(item => {
      const owner = item.purchasedBy;
      if (owner && owner !== 'Staff' && owner !== 'System' && !list.includes(owner)) {
        list.push(owner);
      }
    });

    return list;
  }, [stock]);

  const loadStock = async () => {
    try {
      const dbDevices = await deviceService.getDevices({ status: 'NEW_IN_HAND' });
      const deliveredItems = JSON.parse(localStorage.getItem('mrx_new_in_hand_stock') || '[]');
      const exchangeList = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
      const deliveredExchanges = exchangeList.filter(item => item.status === 'Delivered' || item.status === 'NEW_IN_HAND');

      const formattedExchanges = deliveredExchanges.map(ex => ({
        sno: ex.sno || ex.id || `EXCH-${ex.id}`,
        id: ex.id || `EXCH-${ex.id}`,
        date: ex.date || new Date().toISOString().split('T')[0],
        brand: ex.newBrand || ex.brand || 'Generic',
        model: ex.newModel || ex.model || 'Device',
        storage: String(ex.newStorage || ex.storage || '128'),
        ram: String(ex.newRam || ex.ram || '8'),
        color: ex.newColor || ex.color || '-',
        purchasedBy: ex.newPurchasedBy || ex.purchasedBy || ex.paid_by || 'Staff',
        amount: Number(ex.newAmount || ex.amount || 0),
        totalUnits: Number(ex.totalUnits || 1),
        soldUnits: Number(ex.soldUnits || 0)
      }));

      const rawList = [...(Array.isArray(dbDevices) ? dbDevices : (dbDevices.data || [])), ...deliveredItems, ...formattedExchanges];

      const seenKeys = new Set();
      const combined = [];

      for (const item of rawList) {
        if (!item) continue;
        const brandName = item.brand || item.newBrand || 'Generic';
        const modelName = item.model || item.newModel || 'Device';
        const storageVal = String(item.storage || item.newStorage || '128');
        const ramVal = String(item.ram || item.newRam || '8');
        const ownerVal = item.purchasedBy || item.paid_by || item.admin_name || 'Staff';
        const itemAmt = Number(item.amount || item.purchase_amount || item.newAmount || 0);

        // Unique identifier key
        const uniqueId = item.exchangeId || item.id || item.sno || item.device_code;
        // Composite identity key to prevent duplicate delivery rows for same item
        const compositeKey = `${brandName.toLowerCase()}_${modelName.toLowerCase()}_${storageVal}_${ramVal}_${ownerVal.toLowerCase()}_${itemAmt}`;

        if (!seenKeys.has(String(uniqueId)) && !seenKeys.has(compositeKey)) {
          if (uniqueId) seenKeys.add(String(uniqueId));
          seenKeys.add(compositeKey);
          combined.push({
            ...item,
            id: item.id || uniqueId,
            sno: item.sno || item.device_code || uniqueId,
            brand: brandName,
            model: modelName,
            storage: storageVal,
            ram: ramVal,
            color: item.color || item.colour || item.newColor || '-',
            purchasedBy: ownerVal,
            amount: itemAmt,
            totalUnits: Number(item.totalUnits || item.quantity || 1),
            soldUnits: Number(item.soldUnits || 0),
            date: item.date || item.intake_date || new Date().toISOString().split('T')[0]
          });
        }
      }
      setStock(combined);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStock();

    const handleSync = () => loadStock();
    window.addEventListener('storage', handleSync);
    window.addEventListener('mrx_inventory_updated', handleSync);
    window.addEventListener('mrx_exchanges_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mrx_inventory_updated', handleSync);
      window.removeEventListener('mrx_exchanges_updated', handleSync);
    };
  }, []);

  const saveStockToStorage = (updatedStockList) => {
    setStock(updatedStockList);
    try {
      localStorage.setItem('mrx_new_in_hand_stock', JSON.stringify(updatedStockList));
      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

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

  // BIFURCATION FILTERING LOGIC BY LOGGED-IN ACCOUNT
  const filteredStock = stock.filter((item) => {
    // Account Scope Check
    if (accountFilter && accountFilter !== 'All Accounts') {
      const itemOwner = (item.purchasedBy || '').toLowerCase();
      const selectedOwner = accountFilter.toLowerCase();
      const firstPartItem = itemOwner.split(' ')[0];
      const firstPartSelected = selectedOwner.split(' ')[0];

      if (
        itemOwner &&
        selectedOwner &&
        !itemOwner.includes(selectedOwner) &&
        !selectedOwner.includes(itemOwner) &&
        (!firstPartItem || !firstPartSelected || (!itemOwner.startsWith(firstPartSelected) && !selectedOwner.startsWith(firstPartItem)))
      ) {
        return false;
      }
    }

    if (brand !== 'All' && item.brand !== brand) return false;
    if (selectedDate) {
      const itemYMD = toYMD(item.date);
      const selYMD = toYMD(selectedDate);
      if (itemYMD && selYMD && itemYMD !== selYMD) return false;
    }
    if (fromDate) {
      const itemYMD = toYMD(item.date);
      const fYMD = toYMD(fromDate);
      if (itemYMD && fYMD && itemYMD < fYMD) return false;
    }
    if (toDate) {
      const itemYMD = toYMD(item.date);
      const tYMD = toYMD(toDate);
      if (itemYMD && tYMD && itemYMD > tYMD) return false;
    }
    const q = (searchQuery || globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchModel = item.model.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchPerson = (item.purchasedBy || '').toLowerCase().includes(q);
      const matchColor = (item.color || '').toLowerCase().includes(q);
      if (!matchModel && !matchBrand && !matchPerson && !matchColor) return false;
    }
    return true;
  }).sort((a, b) => {
    // Recent added data appears on top (newest first), older at bottom
    const getTimestamp = (item) => {
      const val = item.date || item.created_at || item.intake_date || item.timestamp;
      if (val) {
        const parsed = new Date(val).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      if (item.sno || item.id) {
        const num = parseInt(String(item.sno || item.id || '').replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > 0) return num;
      }
      return 0;
    };
    const timeA = getTimestamp(a);
    const timeB = getTimestamp(b);
    if (timeA !== timeB) return timeB - timeA;
    return String(b.sno || b.id || '').localeCompare(String(a.sno || a.id || ''));
  });

  // Calculate Total Available Stock Units across all brands in current account scope
  const totalAvailableUnits = filteredStock.reduce((sum, item) => {
    const avail = Math.max(0, (item.totalUnits || 1) - (item.soldUnits || 0));
    return sum + avail;
  }, 0);

  const totalDeliveredValuation = filteredStock.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const openSellModal = (item) => {
    setSelectedStockItem(item);
    setSellError('');
    const avail = Math.max(0, (item.totalUnits || 1) - (item.soldUnits || 0));
    const fetchedModel = `${item.brand} ${item.model}`;
    
    setSellForm({
      model: fetchedModel,
      soldBy: loggedInAccountName,
      unit: avail > 0 ? 1 : 0,
      soldTo: item.purchasedBy || 'Customer',
      soldPrice: '',
      totalAmount: '',
      paidAmount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsSellModalOpen(true);
  };

  const handleSellSubmit = (e) => {
    e.preventDefault();
    setSellError('');

    if (!selectedStockItem) return;

    const availableUnits = Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0));
    const requestedUnits = Number(sellForm.unit) || 1;

    if (availableUnits <= 0) {
      setSellError(`⚠️ Out of stock! 0 units available for ${selectedStockItem.brand} ${selectedStockItem.model}.`);
      return;
    }

    if (requestedUnits > availableUnits) {
      setSellError(`⚠️ Cannot sell ${requestedUnits} unit(s). Only ${availableUnits} unit(s) available in stock for ${selectedStockItem.brand} ${selectedStockItem.model}.`);
      return;
    }

    // Deduct stock quantity (increment soldUnits by requestedUnits)
    const updatedStock = stock.map(item => {
      if (String(item.sno) === String(selectedStockItem.sno)) {
        const newSoldUnits = (item.soldUnits || 0) + requestedUnits;
        return {
          ...item,
          soldUnits: newSoldUnits
        };
      }
      return item;
    });

    saveStockToStorage(updatedStock);

    // Record Payment entry (Received if fully paid, Pending if partial)
    const totAmt = Number(sellForm.totalAmount) || (Number(sellForm.soldPrice) * requestedUnits) || 0;
    const pdAmt = sellForm.paidAmount !== '' && sellForm.paidAmount !== undefined ? Math.min(totAmt, Number(sellForm.paidAmount)) : totAmt;
    const pendAmt = Math.max(0, totAmt - pdAmt);
    const payStatus = pendAmt <= 0 ? 'Received' : 'Pending';

    // Record sale in mrx_sales so Profit page picks it up.
    // Actual amount (cost) = pv (purchase cost of the units sold) + bev (booking payment, 0 for direct stock sale)
    try {
      const unitCost = Number(selectedStockItem.amount || selectedStockItem.purchase_amount || 0);

      // Items that came from an Exchange carry Add Inventory cost + exchange value
      // (older delivered items only have them on the matching mrx_exchanges entry).
      let exchangeEntry = null;
      if (selectedStockItem.exchangeId) {
        try {
          exchangeEntry = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]')
            .find(x => String(x.id) === String(selectedStockItem.exchangeId)) || null;
        } catch (e) {}
      }
      const fromExchange = !!(selectedStockItem.exchangeId || selectedStockItem.addInventoryCost !== undefined);
      const addInv = Number(selectedStockItem.addInventoryCost ?? exchangeEntry?.oldAmount) || 0;
      const exVal = Number(selectedStockItem.exchangeValue ?? exchangeEntry?.exchangeValue) || 0;
      const salePv = fromExchange ? addInv * requestedUnits : unitCost * requestedUnits;
      const saleBev = fromExchange ? exVal * requestedUnits : 0;

      console.log('[SELL:NewInHand]', {
        selling_totalAmount: totAmt, units: requestedUnits, fromExchange,
        item: { amount: selectedStockItem.amount, addInventoryCost: selectedStockItem.addInventoryCost, exchangeValue: selectedStockItem.exchangeValue, exchangeId: selectedStockItem.exchangeId },
        exchangeEntry: exchangeEntry && { oldAmount: exchangeEntry.oldAmount, exchangeValue: exchangeEntry.exchangeValue, newAmount: exchangeEntry.newAmount },
        pv_addInventory: salePv, bev_exchange: saleBev,
        formula: `${totAmt} - (${salePv} + ${saleBev}) = ${totAmt - (salePv + saleBev)}`
      });
      const newSale = {
        id: `SALE-${Date.now()}`,
        date: sellForm.date || new Date().toISOString().split('T')[0],
        brand: selectedStockItem.brand,
        model: selectedStockItem.model,
        customerName: sellForm.soldTo || 'Customer',
        soldBy: sellForm.soldBy || loggedInAccountName,
        quantity: requestedUnits,
        unitPrice: Number(sellForm.soldPrice) || 0,
        totalAmount: totAmt,
        paidAmount: pdAmt,
        pv: salePv,
        bev: saleBev,
        purchase_amount: salePv,
        purchase: salePv,
        paymentMode: sellForm.paymentType || 'Cash',
        status: 'Sold'
      };
      const existingSales = JSON.parse(localStorage.getItem('mrx_sales') || '[]');
      localStorage.setItem('mrx_sales', JSON.stringify([newSale, ...existingSales]));
      window.dispatchEvent(new Event('mrx_sales_updated'));
    } catch (e) {}

    const newPaymentObj = {
      id: `PAY-${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      date: sellForm.date || new Date().toISOString().split('T')[0],
      customerName: sellForm.soldTo || 'Customer',
      brand: selectedStockItem.brand || 'Apple',
      model: selectedStockItem.model || 'Device',
      imei: selectedStockItem.imei || selectedStockItem.sno || 'N/A',
      totalAmount: totAmt,
      paidAmount: pdAmt,
      pendingAmount: pendAmt,
      status: payStatus,
      type: 'CUSTOMER_RECEIVABLE',
      recordCategory: 'SELL_MOBILE',
      source: 'NEW_IN_HAND_SALE',
      mode: sellForm.paymentType || 'Cash'
    };

    try {
      const existingPayments = JSON.parse(localStorage.getItem('mrx_pending_payments') || '[]');
      localStorage.setItem('mrx_pending_payments', JSON.stringify([newPaymentObj, ...existingPayments]));
      window.dispatchEvent(new Event('mrx_pending_payments_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    alert(`Successfully sold ${requestedUnits} unit(s) of "${selectedStockItem.brand} ${selectedStockItem.model}" under account "${loggedInAccountName}"! ${availableUnits - requestedUnits} unit(s) remaining in stock.`);
    setIsSellModalOpen(false);
  };

  const openExchangeModal = (item) => {
    setSelectedExchangeStockItem(item);
    setExchangeForm({
      customerName: '',
      exchangeValue: String(item.amount || 0),
      newBrand: item.brand,
      newModel: item.model,
      newStorage: String(item.storage || '128'),
      newRam: String(item.ram || '8'),
      newColor: item.color || '-',
      newPayBy: item.purchasedBy || loggedInAccountName,
      purchasedAmount: String(item.amount || 0),
      oldBrand: 'Samsung',
      oldModel: '',
      oldStorage: '128',
      oldRam: '8',
      oldAmount: '0',
      oldPayBy: 'Staff',
      oldImage: '',
      via: 'Cash'
    });
    setIsExchangeModalOpen(true);
  };

  const handleExchangeSubmit = (e) => {
    e.preventDefault();
    if (!selectedExchangeStockItem) return;

    const availableUnits = Math.max(0, (selectedExchangeStockItem.totalUnits || 1) - (selectedExchangeStockItem.soldUnits || 0));
    if (availableUnits <= 0) {
      alert(`⚠️ Out of stock! Cannot exchange device.`);
      return;
    }

    const oldAmt = Number(exchangeForm.oldAmount) || 0;
    const newAmt = Number(exchangeForm.purchasedAmount) || 0;
    const exVal = Number(exchangeForm.exchangeValue) || oldAmt;

    const newExchangeEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      newBrand: exchangeForm.newBrand,
      newModel: exchangeForm.newModel,
      newStorage: Number(exchangeForm.newStorage) || 128,
      newRam: Number(exchangeForm.newRam) || 8,
      newColor: exchangeForm.newColor || '-',
      newPurchasedBy: exchangeForm.customerName || exchangeForm.newPayBy || loggedInAccountName,
      newAmount: newAmt + exVal,
      oldBrand: exchangeForm.oldBrand,
      oldModel: exchangeForm.oldModel,
      oldStorage: Number(exchangeForm.oldStorage) || 128,
      oldRam: Number(exchangeForm.oldRam) || 8,
      oldColor: '-',
      oldPurchasedBy: exchangeForm.oldPayBy || 'Staff',
      oldAmount: oldAmt,
      oldImage: exchangeForm.oldImage || '',
      status: 'Booked'
    };

    // 1. Add exchange record to mrx_exchanges with status 'Booked'
    const existingExchanges = JSON.parse(localStorage.getItem('mrx_exchanges') || '[]');
    localStorage.setItem('mrx_exchanges', JSON.stringify([newExchangeEntry, ...existingExchanges]));

    // 2. If old phone details are provided, add to old in hand stock
    if (exchangeForm.oldModel) {
      const oldPhoneItem = {
        sno: Date.now() + 1,
        date: new Date().toISOString().split('T')[0],
        brand: exchangeForm.oldBrand,
        model: exchangeForm.oldModel,
        storage: Number(exchangeForm.oldStorage) || 128,
        ram: Number(exchangeForm.oldRam) || 8,
        color: '-',
        purchasedBy: exchangeForm.oldPayBy || 'Staff',
        amount: oldAmt,
        image_url: exchangeForm.oldImage || '',
        status: 'OLD_IN_HAND'
      };
      const existingOldStock = JSON.parse(localStorage.getItem('mrx_old_in_hand_stock') || '[]');
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify([oldPhoneItem, ...existingOldStock]));
    }

    // 3. Mark unit sold/transferred out of current New In Hand stock into Booked & Exchange
    const updatedStock = stock.map(item => {
      if (String(item.sno) === String(selectedExchangeStockItem.sno)) {
        return {
          ...item,
          soldUnits: (item.soldUnits || 0) + 1
        };
      }
      return item;
    });

    saveStockToStorage(updatedStock);
    window.dispatchEvent(new Event('mrx_exchanges_updated'));
    window.dispatchEvent(new Event('mrx_inventory_updated'));
    window.dispatchEvent(new Event('storage'));

    alert(`Device "${exchangeForm.newBrand} ${exchangeForm.newModel}" placed on Booked for Exchange! Transferred to Booked & Exchange tab.`);
    setIsExchangeModalOpen(false);
  };

  const openEditModal = (item) => {
    setEditForm({
      sno: item.sno,
      brand: item.brand,
      model: item.model,
      storage: item.storage,
      ram: item.ram,
      color: item.color,
      purchasedBy: item.purchasedBy,
      amount: item.amount,
      totalUnits: item.totalUnits || 1,
      image_url: item.image_url || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=100'
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

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedStock = stock.map(item => item.sno === editForm.sno ? {
      ...item,
      brand: editForm.brand,
      model: editForm.model,
      storage: Number(editForm.storage),
      ram: Number(editForm.ram),
      color: editForm.color,
      purchasedBy: editForm.purchasedBy,
      amount: Number(editForm.amount),
      totalUnits: Number(editForm.totalUnits) || 1,
      image_url: editForm.image_url,
      images: [editForm.image_url]
    } : item);

    saveStockToStorage(updatedStock);
    setIsEditModalOpen(false);
    alert('Device details updated successfully!');
  };

  const handleDeleteDevice = (sno) => {
    if (window.confirm('Are you sure you want to delete this device from New In-hand stock?')) {
      const updatedStock = stock.filter(item => item.sno !== sno);
      saveStockToStorage(updatedStock);
    }
  };

  const handleExportPdf = () => {
    const headers = ['Sno', 'Date', 'Brand', 'Model', 'Storage', 'RAM', 'Color', 'Available Units', 'Purchased By (Account)', 'Amount (Rs)'];
    const rows = filteredStock.map((item, idx) => {
      const avail = Math.max(0, (item.totalUnits || 1) - (item.soldUnits || 0));
      return [
        idx + 1,
        item.date,
        item.brand,
        item.model,
        `${item.storage} GB`,
        `${item.ram} GB`,
        item.color || '-',
        `${avail} / ${item.totalUnits || 1} Units`,
        item.purchasedBy || '-',
        `Rs. ${item.amount.toLocaleString()}`
      ];
    });
    setExportModalConfig({
      isOpen: true,
      title: `New In-hand Stock Report (${accountFilter})`,
      headers,
      rows,
      filename: `New_In_Hand_Stock_${new Date().toISOString().slice(0, 10)}.pdf`,
      summaryInfo: [
        { label: 'Account Scope', value: accountFilter, color: '#7c3aed' },
        { label: 'Total Available Units', value: `${totalAvailableUnits} Units`, color: '#0284c7' },
        { label: 'Total Valuation', value: `Rs. ${totalDeliveredValuation.toLocaleString()}`, color: '#059669' }
      ]
    });
  };

  const handleCleanStock = async () => {
    if (window.confirm('Are you sure you want to reset and clear ALL website inventory, sales, and expense data to 0?')) {
      try {
        await deviceService.cleanDatabase();
      } catch (err) {
        console.warn('DB clean warning:', err);
      }
      localStorage.setItem('mrx_old_inventory', JSON.stringify([]));
      localStorage.setItem('mrx_old_in_hand_stock', JSON.stringify([]));
      localStorage.setItem('mrx_new_in_hand_stock', JSON.stringify([]));
      localStorage.setItem('mrx_repair_stock', JSON.stringify([]));
      localStorage.setItem('mrx_rejected_stock', JSON.stringify([]));
      localStorage.setItem('mrx_exchanges', JSON.stringify([]));
      localStorage.setItem('mrx_exchange_pool', JSON.stringify([]));
      localStorage.setItem('mrx_pending_payments', JSON.stringify([]));
      localStorage.setItem('mrx_sales', JSON.stringify([]));
      localStorage.setItem('mrx_devices', JSON.stringify([]));
      localStorage.setItem('mrx_expenses', JSON.stringify([]));
      localStorage.setItem('mrx_expense_evaluations', JSON.stringify({}));

      window.dispatchEvent(new Event('mrx_inventory_updated'));
      window.dispatchEvent(new Event('mrx_exchanges_updated'));
      window.dispatchEvent(new Event('mrx_pending_payments_updated'));
      window.dispatchEvent(new Event('mrx_expenses_updated'));
      window.dispatchEvent(new Event('storage'));

      setStock([]);
      alert('All stock and website data successfully reset to 0!');
    }
  };

  return (
    <div>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>New In-hand Stock</h1>
            <span style={{ 
              background: '#f3e8ff', 
              color: '#7c3aed', 
              padding: '4px 12px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <UserCheck size={14} /> Account Bifurcated
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Stock inventory bifurcated by user account scope ({accountFilter}).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleCleanStock} className="btn-secondary" style={{ backgroundColor: '#fef2f2', color: '#ef4444', borderColor: '#fca5a5', padding: '9px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={16} color="#ef4444" /> Reset All Data (0)
          </button>
          <button onClick={handleExportPdf} className="btn-secondary" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            <FileText size={16} /> Export PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <KPICard 
          title="Account Scope" 
          value={accountFilter} 
          icon={Users}
          iconBg="#f3e8ff"
          iconColor="#7c3aed"
        />
        <KPICard 
          title="Available Stock Units (Account)" 
          value={`${totalAvailableUnits} Units`} 
          icon={Package}
          iconBg="#e0f2fe"
          iconColor="#0284c7"
        />
        <KPICard 
          title="Stock Valuation (Account)" 
          value={`₹${totalDeliveredValuation.toLocaleString('en-IN')}`} 
          icon={ShoppingBag}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
      </div>

      {/* Top Filter Bar with Account Bifurcation Dropdown */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
        
        {/* Account Bifurcation Selector */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', display: 'block', marginBottom: '4px' }}>
            👤 Account Scope Bifurcation
          </label>
          <select 
            className="form-control" 
            value={accountFilter} 
            onChange={(e) => setAccountFilter(e.target.value)} 
            style={{ width: '200px', padding: '7px 12px', borderColor: '#a855f7', fontWeight: 700, color: '#7c3aed' }}
          >
            {accountOptions.map(acc => (
              <option key={acc} value={acc}>{acc}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>From Date</label>
          <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '150px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>To Date</label>
          <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '150px', padding: '7px 12px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'block', marginBottom: '4px' }}>Brand</label>
          <select className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ width: '140px', padding: '7px 12px' }}>
            <option>All</option>
            <option>Google Pixel</option>
            <option>Apple</option>
            <option>Samsung</option>
            <option>OnePlus</option>
            <option>Vivo</option>
            <option>Xiaomi</option>
            <option>Nothing</option>
            <option>Realme</option>
            <option>Motorola</option>
            <option>Oppo</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '200px', marginTop: '18px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by model, brand, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={() => { setFromDate(''); setToDate(''); setBrand('All'); setSearchQuery(''); if (isSuperAdmin) setAccountFilter('All Accounts'); }} className="btn-secondary">Clear</button>
        </div>
      </div>

      {/* New In-hand Stock Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Brand Name</th>
              <th>Model</th>
              <th>Specs (Storage / RAM)</th>
              <th>Color</th>
              <th>Available Stock Units</th>
              <th>Account Owner</th>
              <th>Purchased Amount (₹)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No new in-hand stock items match the selected account scope ({isSuperAdmin ? accountFilter : loggedInAccountName}).
                </td>
              </tr>
            ) : (
              filteredStock.map((item, idx) => {
                const availUnits = Math.max(0, (item.totalUnits || 1) - (item.soldUnits || 0));
                const isOutOfStock = availUnits <= 0;

                return (
                  <tr key={item.sno}>
                    <td data-label="#">{idx + 1}</td>
                    <td data-label="Date">{item.date}</td>
                    <td data-label="Brand" style={{ fontWeight: 700, color: '#0f172a' }}>{item.brand}</td>
                    <td data-label="Model" style={{ fontWeight: 800, color: '#0284c7' }}>{item.model}</td>
                    <td data-label="Specs">{item.storage} GB / {item.ram} GB</td>
                    <td data-label="Color">{item.color}</td>
                    <td data-label="Available Stock">
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 800,
                        backgroundColor: isOutOfStock ? '#fee2e2' : '#ecfdf5',
                        color: isOutOfStock ? '#dc2626' : '#047857',
                        border: isOutOfStock ? '1px solid #fecaca' : '1px solid #a7f3d0'
                      }}>
                        {isOutOfStock ? '❌ Out of Stock (0 Units)' : `📦 ${availUnits} / ${item.totalUnits || 1} Units Available`}
                      </span>
                    </td>
                    <td data-label="Account Owner">
                      <span style={{ padding: '3px 8px', borderRadius: '10px', background: '#f3e8ff', color: '#7c3aed', fontSize: '12px', fontWeight: 800 }}>
                        👤 {item.purchasedBy}
                      </span>
                    </td>
                    <td data-label="Purchased Amount" style={{ fontWeight: 700 }}>
                      <CurrencyAmount amount={item.amount} />
                    </td>
                    <td data-label="Action">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => openSellModal(item)} 
                          style={{ 
                            padding: '6px 16px', 
                            fontSize: '12px', 
                            borderRadius: '6px', 
                            fontWeight: 800,
                            backgroundColor: isOutOfStock ? '#94a3b8' : '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: isOutOfStock ? 0.6 : 1
                          }}
                          title={isOutOfStock ? "Out of Stock - Cannot sell more than available quantity" : `Sell from ${availUnits} available units`}
                        >
                          {isOutOfStock ? 'Sold Out' : 'Sell'}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          title="Edit stock details & total units"
                        >
                          <Edit size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${item.brand} ${item.model}" from New In-Hand Stock?`)) {
                              const itemKey = String(item.sno || item.id);
                              const deletedIds = JSON.parse(localStorage.getItem('mrx_deleted_device_ids') || '[]');
                              if (!deletedIds.includes(itemKey)) {
                                deletedIds.push(itemKey);
                                localStorage.setItem('mrx_deleted_device_ids', JSON.stringify(deletedIds));
                              }
                              const updatedStock = stock.filter(s => String(s.sno || s.id) !== itemKey);
                              setStock(updatedStock);
                              try {
                                localStorage.setItem('mrx_new_in_hand_stock', JSON.stringify(updatedStock));
                                window.dispatchEvent(new Event('mrx_inventory_updated'));
                                window.dispatchEvent(new Event('storage'));
                              } catch (e) {}
                              alert(`Stock item "${item.brand} ${item.model}" deleted successfully!`);
                            }
                          }}
                          style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Delete item permanently from stock"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Sell Mobile Modal with Available Stock Enforcement */}
      {isSellModalOpen && selectedStockItem && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>Sell New Mobile</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Account Scope: <strong>{selectedStockItem.purchasedBy}</strong> (Sold by: {loggedInAccountName})
                </p>
              </div>
              <button onClick={() => setIsSellModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            {/* Available Stock Units Info Box */}
            <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Available Stock Units</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                  📦 {Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0))} Unit(s) Available ({selectedStockItem.brand} {selectedStockItem.model})
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>
                Total: {selectedStockItem.totalUnits || 1} | Sold: {selectedStockItem.soldUnits || 0}
              </div>
            </div>

            {sellError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', border: '1px solid #fecaca', marginBottom: '14px', fontWeight: 700 }}>
                {sellError}
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

                {/* Unit (Quantity) with Max Limit Validation */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, color: '#dc2626' }}>
                    Sell Quantity (Max: {Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0))}) *
                  </label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={sellForm.unit} 
                    onChange={(e) => {
                      const u = parseInt(e.target.value) || 0;
                      const sp = Number(sellForm.soldPrice) || 0;
                      setSellForm({ ...sellForm, unit: u, totalAmount: u * sp });
                      const maxUnits = Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0));
                      if (u > maxUnits) {
                        setSellError(`⚠️ Cannot sell ${u} units. Only ${maxUnits} unit(s) available in stock.`);
                      } else {
                        setSellError('');
                      }
                    }} 
                    min="1"
                    max={Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0))}
                    required 
                  />
                </div>
              </div>

              {/* Customer / Party Name */}
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
                {/* Sold Price per Unit */}
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

                {/* Total Amount */}
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
                  disabled={sellForm.unit > Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0))}
                  style={{ 
                    padding: '10px 24px', 
                    fontWeight: 800,
                    opacity: sellForm.unit > Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0)) ? 0.5 : 1,
                    cursor: sellForm.unit > Math.max(0, (selectedStockItem.totalUnits || 1) - (selectedStockItem.soldUnits || 0)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Confirm Sale ({sellForm.unit} Unit)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book New Device for Exchange Modal */}
      {isExchangeModalOpen && selectedExchangeStockItem && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#7c3aed', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={20} /> Book Device for Exchange
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Device will be transferred to <strong>Booked & Exchange</strong> tab until delivered.
                </p>
              </div>
              <button onClick={() => setIsExchangeModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleExchangeSubmit}>
              {/* New Device Details (ReadOnly summary) */}
              <div style={{ background: '#f5f3ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ddd6fe', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', marginBottom: '4px' }}>New Device to Book</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#4c1d95' }}>
                  📱 {exchangeForm.newBrand} {exchangeForm.newModel} ({exchangeForm.newStorage} GB / {exchangeForm.newRam} GB)
                </div>
                <div style={{ fontSize: '12px', color: '#6d28d9', marginTop: '2px' }}>
                  Purchased Amount: ₹{Number(exchangeForm.purchasedAmount).toLocaleString('en-IN')} | Owner: {exchangeForm.newPayBy}
                </div>
              </div>

              {/* Customer Name & Exchange Value (Customer Name BEFORE Exchange Value) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>Customer Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter customer name"
                    value={exchangeForm.customerName}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, customerName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, color: '#7c3aed' }}>Exchange Value (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="₹ Exchange valuation"
                    value={exchangeForm.exchangeValue}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, exchangeValue: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Pay By */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Pay By (Account) *</label>
                <select
                  className="form-control"
                  value={exchangeForm.newPayBy}
                  onChange={(e) => setExchangeForm({ ...exchangeForm, newPayBy: e.target.value })}
                >
                  <option value="Jeet Khubchandani">Jeet Khubchandani</option>
                  <option value="Sonal Wadwani">Sonal Wadwani</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              {/* Old Phone Details Trade-in Section */}
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '14px', marginTop: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔄 Old Phone Details (Trade-in)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label">Old Phone Brand</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Samsung, Apple"
                      value={exchangeForm.oldBrand}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, oldBrand: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Old Phone Model</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Galaxy S21"
                      value={exchangeForm.oldModel}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, oldModel: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label">Storage (GB)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={exchangeForm.oldStorage}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, oldStorage: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">RAM (GB)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={exchangeForm.oldRam}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, oldRam: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Trade Amount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={exchangeForm.oldAmount}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, oldAmount: e.target.value, exchangeValue: e.target.value })}
                    />
                  </div>
                </div>

                {/* Old Phone Photo Option */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>Old Phone Photo Option</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setIsExchangeCameraOpen(true)}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#7c3aed', borderColor: '#c084fc' }}
                    >
                      <Camera size={16} /> Take Photo
                    </button>
                    <label
                      className="btn-secondary"
                      style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      📁 Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setExchangeForm(prev => ({ ...prev, oldImage: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {exchangeForm.oldImage && (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={exchangeForm.oldImage}
                          alt="Old Phone Preview"
                          style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #7c3aed' }}
                        />
                        <button
                          type="button"
                          onClick={() => setExchangeForm(prev => ({ ...prev, oldImage: '' }))}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsExchangeModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', backgroundColor: '#7c3aed', borderColor: '#7c3aed', fontWeight: 800 }}>
                  Book for Exchange
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exchange Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isExchangeCameraOpen}
        onClose={() => setIsExchangeCameraOpen(false)}
        onCapture={(dataUrl) => setExchangeForm(prev => ({ ...prev, oldImage: dataUrl }))}
      />

      {/* Edit Device Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>Edit Stock Quantity & Details</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>Update stock unit count and specifications.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleEditSubmit}>
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
                  <label className="form-label">Total Stock Quantity Units *</label>
                  <input type="number" className="form-control" value={editForm.totalUnits} onChange={(e) => setEditForm({ ...editForm, totalUnits: e.target.value })} min="1" required />
                </div>
                <div>
                  <label className="form-label">Purchased Amount (₹) *</label>
                  <input type="number" className="form-control" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required />
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
                  <input type="text" className="form-control" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Account Owner / Purchased By *</label>
                  <input type="text" className="form-control" value={editForm.purchasedBy} onChange={(e) => setEditForm({ ...editForm, purchasedBy: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Save Changes</button>
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
    </div>
  );
}
