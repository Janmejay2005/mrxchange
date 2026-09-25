const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = rawApiUrl ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`) : '/api';

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('mrx_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error(`Network connection error: ${netErr.message || 'Unable to connect to server'}`);
  }

  // Safely parse JSON or text to prevent "Unexpected end of JSON input"
  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }
  } else if (contentType.includes('text/html')) {
    throw new Error('API endpoint returned HTML instead of JSON. Ensure backend proxy or VITE_API_URL is correctly configured.');
  }

  if (!response.ok) {
    let errorMsg = data?.message || `HTTP ${response.status}: ${response.statusText}`;
    if (!data) {
      try {
        const text = await response.text();
        if (text && text.length < 200) errorMsg = text;
      } catch (_) {}
    }
    throw new Error(errorMsg);
  }

  return data || {};
}


// Device Service
export const deviceService = {
  getDevices: async (params = {}) => {
    let remoteDevices = [];
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetchApi(`/devices?${query}`);
      remoteDevices = Array.isArray(res) ? res : (res?.data || []);
    } catch (err) {
      console.warn("Backend API unavailable for getDevices, using local fallback:", err.message);
    }
    const localDevices = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
    
    // Deduplicate: localDevices override remoteDevices for the same id or device_code
    const localIds = new Set(localDevices.map(d => String(d.id)));
    const localCodes = new Set(localDevices.map(d => d.device_code).filter(Boolean));

    const uniqueRemote = remoteDevices.filter(d => 
      !localIds.has(String(d.id)) && (!d.device_code || !localCodes.has(d.device_code))
    );

    let combined = [...localDevices, ...uniqueRemote];

    if (params.status) {
      combined = combined.filter(d => d.status === params.status);
    }
    if (params.brand && params.brand !== 'All Brands') {
      combined = combined.filter(d => d.brand === params.brand);
    }
    return combined;
  },
  getDeviceById: (id) => fetchApi(`/devices/${id}`),
  cleanDatabase: async () => {
    try {
      await fetchApi('/admin/clean-database', { method: 'POST' });
    } catch (e) {
      try {
        await fetchApi('/devices/clean-database', { method: 'POST' });
      } catch (err) {}
    }
    localStorage.setItem('mrx_devices', JSON.stringify([]));
    localStorage.setItem('mrx_old_inventory', JSON.stringify([]));
    localStorage.removeItem('mrx_inventory_cleared');
    return { success: true };
  },
  createDevice: async (formData) => {
    localStorage.removeItem('mrx_inventory_cleared');
    const existing = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
    const newDevice = {
      id: `dev_${Date.now()}`,
      device_code: `MRX-${String(existing.length + 10).padStart(5, '0')}`,
      ...formData,
      status: formData.status || 'OLD_INVENTORY',
      intake_date: formData.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    existing.unshift(newDevice);
    localStorage.setItem('mrx_devices', JSON.stringify(existing));

    try {
      await fetchApi('/devices', {
        method: 'POST',
        body: formData instanceof FormData ? formData : JSON.stringify(formData),
      });
    } catch (err) {
      console.warn("Backend API device creation endpoint returned error/405, saved locally:", err.message);
    }
    return newDevice;
  },
  updateStatus: async (id, payload, deviceObj = null) => {
    const statusVal = typeof payload === 'object' ? payload.status : payload;
    const existing = JSON.parse(localStorage.getItem('mrx_devices') || '[]');
    let found = false;

    let updated = existing.map(d => {
      if (String(d.id) === String(id) || (d.device_code && String(d.device_code) === String(id))) {
        found = true;
        return { ...d, status: statusVal, ...(typeof payload === 'object' ? payload : {}) };
      }
      return d;
    });

    if (!found && deviceObj) {
      updated.unshift({
        ...deviceObj,
        status: statusVal,
        ...(typeof payload === 'object' ? payload : {})
      });
    } else if (!found && !deviceObj) {
      updated.unshift({
        id: String(id),
        status: statusVal,
        ...(typeof payload === 'object' ? payload : {})
      });
    }

    localStorage.setItem('mrx_devices', JSON.stringify(updated));

    try {
      return await fetchApi(`/devices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(typeof payload === 'object' ? payload : { status: statusVal }),
      });
    } catch (err) {
      console.warn("Backend API status update offline/405, updated locally:", err.message);
      return { success: true };
    }
  },
};

// Repair Service
export const repairService = {
  createRepair: (payload) => fetchApi('/repairs', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateRepair: (id, payload) => fetchApi(`/repairs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
};

// Rejection Service
export const rejectionService = {
  createRejection: (payload) => fetchApi('/rejections', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  resolveRejection: (id, payload) => fetchApi(`/rejections/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
};

// Sale Service
export const saleService = {
  createSale: (payload) => fetchApi('/sales', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getSales: () => fetchApi('/sales'),
};

// Central Ledger Service (Superadmin)
export const ledgerService = {
  getLedger: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/ledger?${query}`);
  },
  createEntry: (payload) => fetchApi('/ledger', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// Expenses Service (Superadmin)
export const expenseService = {
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/expenses?${query}`);
  },
  createExpense: (payload) => fetchApi('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// Investments Service (Superadmin)
export const investmentService = {
  getInvestments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/investments?${query}`);
  },
  createInvestment: (payload) => fetchApi('/investments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// Stats & Analytics Service
export const statsService = {
  getDashboardStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/dashboard/stats?${query}`);
  },
  getInHandStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/dashboard/in-hand-stats?${query}`);
  },
  getSuperadminAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/superadmin/analytics?${query}`);
  },
  getXlsExportUrl: (scope, filters = {}) => {
    const query = new URLSearchParams({ scope, ...filters }).toString();
    return `${API_BASE}/exports/csv?${query}`;
  },
  getCsvExportUrl: (scope, filters = {}) => {
    const query = new URLSearchParams({ scope, ...filters }).toString();
    return `${API_BASE}/exports/csv?${query}`;
  },
  getPdfExportUrl: (scope, filters = {}) => {
    const query = new URLSearchParams({ scope, ...filters }).toString();
    return `${API_BASE}/exports/pdf?${query}`;
  }
};
