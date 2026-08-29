/* ============================================================
   ORDERS — filter bar, table, pagination, row -> order-detail
============================================================ */

renderLayout('Orders');

const ordersBody = document.getElementById('ordersBody');
const ordersEmpty = document.getElementById('ordersEmpty');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');

let ordersState = { page: 1, limit: 15, search: '', status: '', from: '', to: '', total: 0 };

function orderStatusBadge(status){
  const s = (status || 'pending').toLowerCase();
  return `<span class="order-status-badge ${s}">${(status || '').replace(/_/g,' ')}</span>`;
}

function renderOrders(orders){
  if(!orders || orders.length === 0){
    ordersBody.innerHTML = '';
    renderEmptyState(ordersEmpty, {
      title: 'No orders found',
      sub: (ordersState.search || ordersState.status) ? 'Try adjusting your filters.' : 'Orders will appear here once customers start ordering.'
    });
    return;
  }
  ordersEmpty.innerHTML = '';
  renderTable(ordersBody, orders, [
    o => `<span class="td-strong">#${escapeHtml(o.orderNumber || o._id)}</span>`,
    o => `${escapeHtml(o.customerName || (o.user && o.user.name) || '—')}<div class="td-muted" style="font-size:11px;">${escapeHtml(o.customerPhone || (o.user && o.user.phone) || '')}</div>`,
    o => `<b>${formatCurrency(o.amount)}</b>`,
    o => orderStatusBadge(o.status),
    o => o.deliveryBoy ? escapeHtml(o.deliveryBoy.name) : `<span class="td-muted">Unassigned</span>`,
    o => `<span class="td-muted">${formatDateTime(o.createdAt)}</span>`,
  ], (order)=> location.href = `order-detail.html?id=${order._id}`);
  renderPagination();
}

function renderPagination(){
  const totalPages = Math.max(1, Math.ceil(ordersState.total / ordersState.limit));
  const p = ordersState.page;
  let html = `<div class="pagination-info">Page ${p} of ${totalPages} (${ordersState.total} orders)</div><div class="pagination-controls">`;
  html += `<button class="page-btn" ${p<=1?'disabled':''} id="prevPageBtn">‹</button>`;
  for(let i=1;i<=totalPages;i++){
    if(totalPages > 7 && i !== 1 && i !== totalPages && Math.abs(i-p) > 1){
      if(i === 2 || i === totalPages-1) html += `<span style="padding:0 4px;color:var(--muted);">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${i===p?'active':''}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" ${p>=totalPages?'disabled':''} id="nextPageBtn">›</button></div>`;
  pagination.innerHTML = html;

  pagination.querySelectorAll('.page-btn[data-page]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ ordersState.page = parseInt(btn.dataset.page); loadOrders(); });
  });
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if(prevBtn) prevBtn.addEventListener('click', ()=>{ ordersState.page--; loadOrders(); });
  if(nextBtn) nextBtn.addEventListener('click', ()=>{ ordersState.page++; loadOrders(); });
}

async function loadOrders(){
  renderSkeletonTable(ordersBody, 6, ordersState.limit);
  try{
    const res = await orderApi.list({
      page: ordersState.page, limit: ordersState.limit, search: ordersState.search,
      status: ordersState.status, from: ordersState.from, to: ordersState.to
    });
    const orders = (res && res.orders) || res || [];
    ordersState.total = (res && res.total) != null ? res.total : orders.length;
    renderOrders(orders);
  }catch(err){
    handleApiError(err, 'Failed to load orders.');
    renderEmptyState(ordersEmpty, { title:'Could not load orders', sub:'Please try again.' });
  }
}

let searchDebounce = null;
searchInput.addEventListener('input', ()=>{
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(()=>{
    ordersState.search = searchInput.value.trim();
    ordersState.page = 1;
    loadOrders();
  }, 350);
});
statusFilter.addEventListener('change', ()=>{
  ordersState.status = statusFilter.value;
  ordersState.page = 1;
  loadOrders();
});
dateFrom.addEventListener('change', ()=>{
  ordersState.from = dateFrom.value;
  ordersState.page = 1;
  loadOrders();
});
dateTo.addEventListener('change', ()=>{
  ordersState.to = dateTo.value;
  ordersState.page = 1;
  loadOrders();
});

loadOrders();
