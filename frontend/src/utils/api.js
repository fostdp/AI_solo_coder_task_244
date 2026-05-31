const API_BASE = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json();
};

export const medicineApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/medicines`);
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE}/medicines/${id}`);
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/medicines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/medicines/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  scan: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE}/medicines/scan`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  getExpiring: async (days = 7) => {
    const response = await fetch(`${API_BASE}/medicines/expiring?days=${days}`);
    return handleResponse(response);
  },

  getExpired: async () => {
    const response = await fetch(`${API_BASE}/medicines/expired`);
    return handleResponse(response);
  },
};

export const notificationApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/notifications`);
    return handleResponse(response);
  },

  getUnread: async () => {
    const response = await fetch(`${API_BASE}/notifications/unread`);
    return handleResponse(response);
  },

  markAsRead: async (id) => {
    const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
    });
    return handleResponse(response);
  },

  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
    });
    return handleResponse(response);
  },

  getSettings: async () => {
    const response = await fetch(`${API_BASE}/notifications/settings`);
    return handleResponse(response);
  },

  updateSettings: async (data) => {
    const response = await fetch(`${API_BASE}/notifications/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

export const familyApi = {
  getMyFamilies: async (userId = 1) => {
    const response = await fetch(`${API_BASE}/families?user_id=${userId}`);
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE}/families/${id}`);
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE}/families`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/families/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id, userId = 1) => {
    const response = await fetch(`${API_BASE}/families/${id}?user_id=${userId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  addMember: async (familyId, data) => {
    const response = await fetch(`${API_BASE}/families/${familyId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  removeMember: async (familyId, data) => {
    const response = await fetch(`${API_BASE}/families/${familyId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  addMedicine: async (familyId, data) => {
    const response = await fetch(`${API_BASE}/families/${familyId}/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  removeMedicine: async (familyId, data) => {
    const response = await fetch(`${API_BASE}/families/${familyId}/medicines`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  searchUsers: async (query) => {
    const response = await fetch(`${API_BASE}/families/users/search?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  },
};

export const interactionApi = {
  search: async (drug) => {
    const response = await fetch(`${API_BASE}/interactions/search?q=${encodeURIComponent(drug)}`);
    return handleResponse(response);
  },

  quickCheck: async (drug) => {
    const response = await fetch(`${API_BASE}/interactions/quick?drug=${encodeURIComponent(drug)}`);
    return handleResponse(response);
  },

  checkTwoDrugs: async (drug1, drug2) => {
    const response = await fetch(`${API_BASE}/interactions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drug1, drug2 }),
    });
    return handleResponse(response);
  },

  batchCheck: async (drugs) => {
    const response = await fetch(`${API_BASE}/interactions/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drugs }),
    });
    return handleResponse(response);
  },

  getAll: async (severity) => {
    const url = severity 
      ? `${API_BASE}/interactions?severity=${severity}` 
      : `${API_BASE}/interactions`;
    const response = await fetch(url);
    return handleResponse(response);
  },
};

export const pharmacyApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/pharmacies`);
    return handleResponse(response);
  },

  getNearby: async (latitude, longitude, radius = 5) => {
    const response = await fetch(
      `${API_BASE}/pharmacies/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    );
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE}/pharmacies/${id}`);
    return handleResponse(response);
  },

  searchMedicine: async (name) => {
    const response = await fetch(`${API_BASE}/pharmacies/medicine/search?name=${encodeURIComponent(name)}`);
    return handleResponse(response);
  },

  checkAvailability: async (name) => {
    const response = await fetch(`${API_BASE}/pharmacies/medicine/availability?name=${encodeURIComponent(name)}`);
    return handleResponse(response);
  },

  createInventoryAlert: async (data) => {
    const response = await fetch(`${API_BASE}/pharmacies/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAlerts: async (userId = 1) => {
    const response = await fetch(`${API_BASE}/pharmacies/alerts?user_id=${userId}`);
    return handleResponse(response);
  },

  deactivateAlert: async (id) => {
    const response = await fetch(`${API_BASE}/pharmacies/alerts/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};
