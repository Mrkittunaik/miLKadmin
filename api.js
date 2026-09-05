/* ============================================================
   API CLIENT — connects miLKadmin to the real pakkabackend
   (Node/Express/Mongo). Every screen's data now comes from here
   instead of hardcoded mock arrays.
   ============================================================ */
(function (global) {
  "use strict";

  // Point this at your deployed backend. Defaults to localhost for local dev.
  const API_BASE = (global.MILK_API_BASE || 'http://localhost:5000') + '/api';
  const TOKEN_KEY = 'pd_admin_token';

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }
  function setToken(t) {
    try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) {
      const msg = (data && data.error) || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  const get = (path) => request('GET', path);
  const post = (path, body) => request('POST', path, body);
  const put = (path, body) => request('PUT', path, body);
  const patch = (path, body) => request('PATCH', path, body);
  const del = (path) => request('DELETE', path);

  const Api = {
    getToken, setToken,

    // ---- auth ----
    adminLogin: (email, password) => post('/auth/admin/login', { email, password }),

    // ---- reads (all admin-scoped "all"/full lists) ----
    listProducts: () => get('/products'),
    listOrders: () => get('/orders'),
    listDeliveryBoys: () => get('/delivery-boys'),
    listUsers: () => get('/users'),
    listPlansAll: () => get('/plans/all'),
    listSubscriptions: () => get('/subscriptions'),
    listCoupons: () => get('/coupons'),
    listBannersAll: () => get('/banners/all'),
    listCategoriesAll: () => get('/categories/all'),
    listStaff: () => get('/staff'),
    listZones: () => get('/zones'),
    listPayments: () => get('/payments'),
    dashboardOverview: () => get('/dashboard'),

    // ---- products ----
    createProduct: (data) => post('/products', data),
    updateProduct: (id, data) => put(`/products/${id}`, data),
    deleteProduct: (id) => del(`/products/${id}`),

    // ---- delivery boys ----
    setDeliveryBoyStatus: (id, status) => patch(`/delivery-boys/${id}/status`, { status }),
    updateDeliveryBoy: (id, data) => put(`/delivery-boys/${id}`, data),

    // ---- orders ----
    updateOrderStatus: (id, status) => patch(`/orders/${id}/status`, { status }),
    assignOrder: (id, deliveryBoyId) => patch(`/orders/${id}/assign`, { deliveryBoyId }),

    // ---- users ----
    setUserStatus: (id, status) => patch(`/users/${id}/status`, { status }),

    // ---- plans ----
    createPlan: (data) => post('/plans', data),
    updatePlan: (id, data) => put(`/plans/${id}`, data),
    deletePlan: (id) => del(`/plans/${id}`),

    // ---- coupons ----
    createCoupon: (data) => post('/coupons', data),
    updateCoupon: (id, data) => put(`/coupons/${id}`, data),
    deleteCoupon: (id) => del(`/coupons/${id}`),

    // ---- banners ----
    createBanner: (data) => post('/banners', data),
    updateBanner: (id, data) => put(`/banners/${id}`, data),
    deleteBanner: (id) => del(`/banners/${id}`),

    // ---- categories ----
    createCategory: (data) => post('/categories', data),
    updateCategory: (id, data) => put(`/categories/${id}`, data),
    deleteCategory: (id) => del(`/categories/${id}`),

    // ---- staff ----
    createStaff: (data) => post('/staff', data),
    updateStaff: (id, data) => put(`/staff/${id}`, data),
    deleteStaff: (id) => del(`/staff/${id}`),

    // ---- zones ----
    createZone: (data) => post('/zones', data),
    updateZone: (id, data) => put(`/zones/${id}`, data),
    deleteZone: (id) => del(`/zones/${id}`),

    // ---- subscriptions ----
    setSubscriptionPaymentStatus: (id, paymentStatus) => patch(`/subscriptions/${id}/payment-status`, { paymentStatus }),

    // ---- payments ----
    markPaymentStatus: (id, status) => patch(`/payments/${id}/status`, { status }),

    // ---- realtime ----
    connectSocket(handlers) {
      if (typeof io === 'undefined') {
        console.warn('Socket.IO client not loaded — live updates disabled, falling back to polling.');
        return null;
      }
      const socket = io(API_BASE.replace(/\/api$/, ''), { auth: { token: getToken() } });
      Object.keys(handlers || {}).forEach(evt => socket.on(evt, handlers[evt]));
      return socket;
    }
  };

  global.Api = Api;
})(window);
