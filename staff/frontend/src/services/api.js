const API_BASE = '/api';

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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
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
    body: formData,
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

// Stats Service
export const statsService = {
  getDashboardStats: () => fetchApi('/dashboard/stats'),
  getInHandStats: () => fetchApi('/dashboard/in-hand-stats'),
  getReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/reports?${query}`);
  },
  getExportUrl: (format, scopes) => `${API_BASE}/exports/inventory?format=${format}&scopes=${scopes}`,
};
