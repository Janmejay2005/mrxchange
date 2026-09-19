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
  getDevices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/devices?${query}`);
  },
  getDeviceById: (id) => fetchApi(`/devices/${id}`),
  createDevice: (formData) => fetchApi('/devices', {
    method: 'POST',
    body: formData instanceof FormData ? formData : JSON.stringify(formData),
  }),
  updateStatus: (id, payload) => fetchApi(`/devices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
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
  getCsvExportUrl: (scope, filters = {}) => {
    const query = new URLSearchParams({ scope, ...filters }).toString();
    return `${API_BASE}/exports/csv?${query}`;
  },
  getPdfExportUrl: (scope, filters = {}) => {
    const query = new URLSearchParams({ scope, ...filters }).toString();
    return `${API_BASE}/exports/pdf?${query}`;
  }
};
