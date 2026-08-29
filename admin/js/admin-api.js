/* ============================================================
   ADMIN-API — fetch wrapper with JWT header + all resource calls
   Every page must call these functions, never raw fetch().
============================================================ */

const API_BASE = (window.ADMIN_API_BASE) || 'http://localhost:5000/api';

function getToken(){
  return localStorage.getItem('admin_token');
}

/**
 * Core request wrapper. Adds JWT header, JSON parsing, and
 * throws a normalized Error({status, message}) on failure.
 */
async function apiRequest(path, { method = 'GET', body, params, isForm = false } = {}){
  let url = API_BASE + path;
  if(params){
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== ''));
    const qsStr = qs.toString();
    if(qsStr) url += (url.includes('?') ? '&' : '?') + qsStr;
  }

  const headers = {};
  const token = getToken();
  if(token) headers['Authorization'] = 'Bearer ' + token;
  if(!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try{
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : (isForm ? body : JSON.stringify(body))
    });
  }catch(networkErr){
    throw { status: 0, message: 'Network error — check your connection.' };
  }

  if(res.status === 401){
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    if(!location.pathname.endsWith('login.html')){
      location.href = 'login.html';
    }
    throw { status: 401, message: 'Session expired. Please log in again.' };
  }

  let data = null;
  const text = await res.text();
  try{ data = text ? JSON.parse(text) : null; }catch(e){ data = null; }

  if(!res.ok){
    throw { status: res.status, message: (data && (data.message || data.error)) || 'Something went wrong.' };
  }
  return data;
}

const get  = (path, params) => apiRequest(path, { method: 'GET', params });
const post = (path, body)   => apiRequest(path, { method: 'POST', body });
const put  = (path, body)   => apiRequest(path, { method: 'PUT', body });
const patch= (path, body)   => apiRequest(path, { method: 'PATCH', body });
const del  = (path, body)   => apiRequest(path, { method: 'DELETE', body });

/* ---------------- AUTH ---------------- */
const authApi = {
  login: (email, password) => post('/admin/auth/login', { email, password }),
  me: () => get('/admin/auth/me'),
};

/* ---------------- DASHBOARD ---------------- */
const dashboardApi = {
  stats: () => get('/admin/dashboard/stats'),
  recentOrders: (limit = 10) => get('/admin/dashboard/recent-orders', { limit }),
};

/* ---------------- PRODUCTS ---------------- */
const productApi = {
  list: (params) => get('/admin/products', params),
  get: (id) => get(`/admin/products/${id}`),
  create: (formData) => apiRequest('/admin/products', { method: 'POST', body: formData, isForm: true }),
  update: (id, formData) => apiRequest(`/admin/products/${id}`, { method: 'PUT', body: formData, isForm: true }),
  delete: (id) => del(`/admin/products/${id}`),
  toggleActive: (id, active) => patch(`/admin/products/${id}/active`, { active }),
  categories: () => get('/admin/products/categories'),
};

/* ---------------- PLANS ---------------- */
const planApi = {
  list: (params) => get('/admin/plans', params),
  get: (id) => get(`/admin/plans/${id}`),
  create: (formData) => apiRequest('/admin/plans', { method: 'POST', body: formData, isForm: true }),
  update: (id, formData) => apiRequest(`/admin/plans/${id}`, { method: 'PUT', body: formData, isForm: true }),
  delete: (id) => del(`/admin/plans/${id}`),
  toggleActive: (id, active) => patch(`/admin/plans/${id}/active`, { active }),
};

/* ---------------- COUPONS ---------------- */
const couponApi = {
  list: (params) => get('/admin/coupons', params),
  get: (id) => get(`/admin/coupons/${id}`),
  create: (body) => post('/admin/coupons', body),
  update: (id, body) => put(`/admin/coupons/${id}`, body),
  delete: (id) => del(`/admin/coupons/${id}`),
  toggleActive: (id, active) => patch(`/admin/coupons/${id}/active`, { active }),
};

/* ---------------- ORDERS ---------------- */
const orderApi = {
  list: (params) => get('/admin/orders', params),
  get: (id) => get(`/admin/orders/${id}`),
  reassign: (id, deliveryBoyId) => patch(`/admin/orders/${id}/reassign`, { deliveryBoyId }),
  cancel: (id, reason) => patch(`/admin/orders/${id}/cancel`, { reason }),
  refund: (id) => patch(`/admin/orders/${id}/refund`),
};

/* ---------------- DELIVERY BOYS ---------------- */
const deliveryApi = {
  list: (params) => get('/admin/delivery-boys', params),
  get: (id) => get(`/admin/delivery-boys/${id}`),
  approve: (id) => patch(`/admin/delivery-boys/${id}/approve`),
  reject: (id, reason) => patch(`/admin/delivery-boys/${id}/reject`, { reason }),
  block: (id, blocked) => patch(`/admin/delivery-boys/${id}/block`, { blocked }),
  setMaxOrders: (id, max) => patch(`/admin/delivery-boys/${id}/max-orders`, { max }),
  pendingCount: () => get('/admin/delivery-boys/pending-count'),
  availableForAssign: () => get('/admin/delivery-boys/available'),
};

/* ---------------- USERS ---------------- */
const userApi = {
  list: (params) => get('/admin/users', params),
  get: (id) => get(`/admin/users/${id}`),
  toggleBlock: (id, blocked) => patch(`/admin/users/${id}/block`, { blocked }),
  orders: (id, params) => get(`/admin/users/${id}/orders`, params),
};

/* ---------------- SETTINGS ---------------- */
const settingsApi = {
  get: () => get('/admin/settings'),
  update: (body) => put('/admin/settings', body),
};

/* ---------------- REPORTS ---------------- */
const reportApi = {
  salesTrend: (params) => get('/admin/reports/sales-trend', params),
  topProducts: (params) => get('/admin/reports/top-products', params),
  deliveryLeaderboard: (params) => get('/admin/reports/delivery-leaderboard', params),
  exportCsv: (params) => get('/admin/reports/export', params),
};
