const API_BASE = '/api';

/**
 * Utility to make authenticated API requests
 */
export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const token = localStorage.getItem('viewpay_token');
  const reqHeaders = { ...headers };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData && body && typeof body === 'object') {
    reqHeaders['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: reqHeaders,
    body
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// API Service modules
export const api = {
  auth: {
    login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
    register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
    google: (googleData) => apiRequest('/auth/google', { method: 'POST', body: googleData }),
    getMe: () => apiRequest('/auth/me'),
    updateProfile: (data) => apiRequest('/auth/profile', { method: 'PUT', body: data }),
    changePassword: (passwords) => apiRequest('/auth/change-password', { method: 'PUT', body: passwords }),
    forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (payload) => apiRequest('/auth/reset-password', { method: 'POST', body: payload }),
    verifyEmail: (payload) => apiRequest('/auth/verify-email', { method: 'POST', body: payload }),
    deleteAccount: () => apiRequest('/auth/account', { method: 'DELETE' }),
  },
  deposits: {
    getConfig: () => apiRequest('/deposits/config'),
    submitDeposit: (formData) => apiRequest('/deposits', { method: 'POST', body: formData, isFormData: true }),
    getHistory: () => apiRequest('/deposits/history'),
  },
  creators: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return apiRequest(`/creators${q ? `?${q}` : ''}`);
    },
    getProfile: (username) => apiRequest(`/creators/${username}`),
    subscribe: (creatorId) => apiRequest(`/creators/${creatorId}/subscribe`, { method: 'POST' }),
    unsubscribe: (creatorId) => apiRequest(`/creators/${creatorId}/unsubscribe`, { method: 'POST' }),
    applyVerification: (formData) => apiRequest('/creators/apply-verification', { method: 'POST', body: formData, isFormData: true }),
  },
  posts: {
    get: (id) => apiRequest(`/posts/${id}`),
    create: (formData) => apiRequest('/posts', { method: 'POST', body: formData, isFormData: true }),
    update: (id, data) => apiRequest(`/posts/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
    unlock: (id) => apiRequest(`/posts/${id}/unlock`, { method: 'POST' }),
    getSignedUrl: (id) => apiRequest(`/posts/${id}/signed-url`),
    save: (id) => apiRequest(`/posts/${id}/save`, { method: 'POST' }),
    report: (id, payload) => apiRequest(`/posts/${id}/report`, { method: 'POST', body: payload }),
  },
  library: {
    getUnlocked: () => apiRequest('/library/unlocked'),
    getSubscriptions: () => apiRequest('/library/subscriptions'),
    getSaved: () => apiRequest('/library/saved'),
  },
  notifications: {
    getAll: () => apiRequest('/notifications'),
    markAllRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),
    markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
    getEmailLogs: () => apiRequest('/notifications/email-logs'),
  },
  payouts: {
    getStats: () => apiRequest('/payouts/stats'),
    request: (payload) => apiRequest('/payouts/request', { method: 'POST', body: payload }),
    getHistory: () => apiRequest('/payouts/history'),
  },
  transactions: {
    getAll: () => apiRequest('/transactions'),
  },
  admin: {
    getStats: () => apiRequest('/admin/stats'),
    getDeposits: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return apiRequest(`/admin/deposits${q ? `?${q}` : ''}`);
    },
    revealCode: (id) => apiRequest(`/admin/deposits/${id}/reveal`, { method: 'POST' }),
    approveDeposit: (id, verifiedAmount) => apiRequest(`/admin/deposits/${id}/approve`, { method: 'POST', body: { verifiedAmount } }),
    rejectDeposit: (id, reason) => apiRequest(`/admin/deposits/${id}/reject`, { method: 'POST', body: { reason } }),
    getCreators: () => apiRequest('/admin/creators'),
    approveCreator: (id) => apiRequest(`/admin/creators/${id}/approve`, { method: 'POST' }),
    rejectCreator: (id, reason) => apiRequest(`/admin/creators/${id}/reject`, { method: 'POST', body: { reason } }),
    getPayouts: () => apiRequest('/admin/payouts'),
    markPayoutPaid: (id, notes) => apiRequest(`/admin/payouts/${id}/mark-paid`, { method: 'POST', body: { notes } }),
    getReports: () => apiRequest('/admin/reports'),
    takeReportAction: (id, action) => apiRequest(`/admin/reports/${id}/action`, { method: 'POST', body: { action } }),
    getUsers: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return apiRequest(`/admin/users${q ? `?${q}` : ''}`);
    },
    banUser: (id, isBanned, reason) => apiRequest(`/admin/users/${id}/ban`, { method: 'POST', body: { isBanned, reason } }),
    getAuditLogs: () => apiRequest('/admin/audit-logs'),
    getSettings: () => apiRequest('/admin/settings'),
    updateSettings: (settings) => apiRequest('/admin/settings', { method: 'PUT', body: settings }),
  }
};
