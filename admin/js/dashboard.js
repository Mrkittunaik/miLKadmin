/* ============================================================
   DASHBOARD — stat cards, recent orders table, low stock, live updates
============================================================ */

renderLayout('Dashboard');

const statGrid = document.getElementById('statGrid');
const recentOrdersBody = document.getElementById('recentOrdersBody');
const recentOrdersEmpty = document.getElementById('recentOrdersEmpty');
const lowStockList = document.getElementById('lowStockList');

function statCardHtml({ icon, label, value, sub, link, badge }){
  return `
    <div class="stat-card${link ? ' link' : ''}" ${link ? `onclick="location.href='${link}'"` : ''}>
      ${badge ? `<div class="stat-badge">${badge}</div>` : ''}
      <div class="stat-ic">${icon}</div>
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
    </div>`;
}

const ICONS = {
  orders: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 2h6l1 4H8l1-4Z"/><path d="M4 6h16l-1.5 13.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 6Z"/></svg>',
  revenue: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  approvals: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="7" r="4"/><path d="M2 21v-1a7 7 0 0 1 14 0v1"/><path d="M17 8l2 2 4-4"/></svg>',
  active: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17H3V6a1 1 0 0 1 1-1h9v12M9 17h6"/></svg>',
  stock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></svg>',
};

function renderStatSkeletons(){
  statGrid.innerHTML = Array.from({length:5}).map(()=>`<div class="skeleton skeleton-card"></div>`).join('');
}

function renderStats(stats){
  statGrid.innerHTML = [
    statCardHtml({ icon: ICONS.orders, label:"Today's Orders", value: stats.todayOrders ?? 0 }),
    statCardHtml({ icon: ICONS.revenue, label:"Today's Revenue", value: formatCurrency(stats.todayRevenue) }),
    statCardHtml({
      icon: ICONS.approvals, label:'Pending Approvals', value: stats.pendingApprovals ?? 0,
      link:'delivery-boys.html', badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : null
    }),
    statCardHtml({ icon: ICONS.active, label:'Delivery Boys Online', value: stats.activeDeliveryBoys ?? 0 }),
    statCardHtml({ icon: ICONS.stock, label:'Low Stock Alerts', value: (stats.lowStock || []).length, link:'products.html' }),
  ].join('');

  setNavBadge('pending', stats.pendingApprovals || 0);
}

function statusClass(status){
  const s = (status || '').toLowerCase();
  if(s === 'pending') return 'pending';
  if(s === 'delivered') return 'delivered';
  if(s === 'cancelled') return 'cancelled';
  return 'progress';
}

function renderRecentOrders(orders){
  if(!orders || orders.length === 0){
    recentOrdersBody.innerHTML = '';
    renderEmptyState(recentOrdersEmpty, { title:'No orders yet', sub:'New orders will show up here as customers place them.' });
    return;
  }
  recentOrdersEmpty.innerHTML = '';
  renderTable(recentOrdersBody, orders, [
    o => `<span class="td-strong">#${escapeHtml(o.orderNumber || o._id)}</span>`,
    o => escapeHtml(o.customerName || (o.user && o.user.name) || '—'),
    o => `<b>${formatCurrency(o.amount)}</b>`,
    o => `<span class="mini-status ${statusClass(o.status)}">${escapeHtml(o.status || '')}</span>`,
    o => `<span class="td-muted">${formatDateTime(o.createdAt)}</span>`,
  ], (order)=> location.href = `order-detail.html?id=${order._id}`);
}

function renderLowStock(items){
  if(!items || items.length === 0){
    lowStockList.innerHTML = `<div class="text-muted" style="font-size:12.5px; padding:8px 0;">All products are well stocked.</div>`;
    return;
  }
  lowStockList.innerHTML = items.map(p => `
    <div class="low-stock-item">
      <div class="low-stock-ic">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
      </div>
      <div style="flex:1; min-width:0;">
        <div class="low-stock-name">${escapeHtml(p.name)}</div>
        <div class="low-stock-qty">${p.stock} left</div>
      </div>
    </div>
  `).join('');
}

async function loadDashboard(){
  renderStatSkeletons();
  renderSkeletonTable(recentOrdersBody, 5, 4);

  try{
    const [stats, recent] = await Promise.all([
      dashboardApi.stats(),
      dashboardApi.recentOrders(10),
    ]);
    renderStats(stats || {});
    renderLowStock((stats && stats.lowStock) || []);
    renderRecentOrders(recent && recent.orders ? recent.orders : recent);
  }catch(err){
    handleApiError(err, 'Failed to load dashboard.');
    statGrid.innerHTML = '';
    renderEmptyState(recentOrdersEmpty, { title:'Could not load orders', sub:'Please refresh the page.' });
  }
}

loadDashboard();

// Live socket updates without full page refresh
initAdminSocket();
window.onDashboardLiveUpdate = function(payload){
  if(payload) renderStats(payload);
};
window.onNewOrderLive = function(order){
  showToast(`New order #${order.orderNumber || order._id}`, 'success');
  loadDashboard();
};
