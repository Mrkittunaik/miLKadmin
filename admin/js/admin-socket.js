/* ============================================================
   ADMIN-SOCKET — Socket.io client for live dashboard stats and
   pending delivery-boy approval count badge.
   Requires the Socket.io client script tag before this file:
   <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
============================================================ */

let adminSocket = null;

function initAdminSocket(){
  if(typeof io === 'undefined'){
    console.warn('Socket.io client not loaded — skipping live updates.');
    return null;
  }
  const token = (typeof getToken === 'function') ? getToken() : localStorage.getItem('admin_token');
  if(!token) return null;

  adminSocket = io(API_BASE.replace(/\/api\/?$/, ''), {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  adminSocket.on('connect_error', (err)=>{
    console.warn('Admin socket connection error:', err.message);
  });

  // Live pending delivery-boy approval count -> sidebar badge
  adminSocket.on('deliveryBoy:pendingCount', (count)=>{
    if(typeof setNavBadge === 'function') setNavBadge('pending', count);
  });

  // Live dashboard stat updates -> handled per-page via callback registration
  adminSocket.on('dashboard:update', (payload)=>{
    if(typeof window.onDashboardLiveUpdate === 'function'){
      window.onDashboardLiveUpdate(payload);
    }
  });

  adminSocket.on('order:new', (order)=>{
    if(typeof window.onNewOrderLive === 'function'){
      window.onNewOrderLive(order);
    }
  });

  return adminSocket;
}

function disconnectAdminSocket(){
  if(adminSocket){
    adminSocket.disconnect();
    adminSocket = null;
  }
}
