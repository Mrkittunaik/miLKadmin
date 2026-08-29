/* ============================================================
   DELIVERY-BOY-DETAIL — profile header, stats, active/past orders,
   block/unblock, max concurrent orders override
============================================================ */

renderLayout('Delivery Boy Detail');

const dboyId = new URLSearchParams(location.search).get('id');
const skeletonEl = document.getElementById('dbdSkeleton');
const contentEl = document.getElementById('dbdContent');
let currentDboy = null;

function orderStatusBadge(status){
  const s = (status || 'pending').toLowerCase();
  return `<span class="order-status-badge ${s}">${(status || '').replace(/_/g,' ')}</span>`;
}

async function loadDboy(){
  if(!dboyId){ showToast('Missing delivery boy ID', 'error'); return; }
  try{
    const dboy = await deliveryApi.get(dboyId);
    currentDboy = dboy;
    skeletonEl.style.display = 'none';
    contentEl.style.display = 'block';

    document.getElementById('dbdPhoto').src = dboy.photo || '../images/logo.png';
    document.getElementById('dbdName').textContent = dboy.name || '—';
    document.getElementById('dbdPhone').textContent = dboy.phone || '—';
    document.getElementById('dbdJoin').textContent = 'Joined ' + formatDate(dboy.createdAt);
    document.getElementById('dbdStatusBadge').innerHTML = dboy.blocked
      ? `<span class="status-badge blocked">Blocked</span>`
      : `<span class="status-badge approved">Active</span>`;

    const blockBtn = document.getElementById('blockBtn');
    blockBtn.textContent = dboy.blocked ? 'Unblock' : 'Block';
    blockBtn.className = dboy.blocked ? 'btn btn-primary' : 'btn btn-danger';

    document.getElementById('dbdTotalDelivered').textContent = dboy.totalDelivered ?? 0;
    document.getElementById('dbdRating').textContent = dboy.rating ? `${dboy.rating.toFixed(1)} ★` : '—';
    document.getElementById('dbdActiveOrders').textContent = (dboy.activeOrdersList || []).length ?? dboy.activeOrders ?? 0;
    document.getElementById('maxOrdersInput').value = dboy.maxConcurrentOrders ?? 5;

    renderOrdersTable('activeOrdersBody', 'activeOrdersEmpty', dboy.activeOrdersList || [], false);
    renderOrdersTable('pastOrdersBody', 'pastOrdersEmpty', dboy.pastOrdersList || [], true);
  }catch(err){
    skeletonEl.style.display = 'none';
    handleApiError(err, 'Failed to load delivery boy.');
  }
}

function renderOrdersTable(bodyId, emptyId, orders, withDate){
  const body = document.getElementById(bodyId);
  const empty = document.getElementById(emptyId);
  if(!orders || orders.length === 0){
    body.innerHTML = '';
    renderEmptyState(empty, { title:'No orders', sub:'' });
    return;
  }
  empty.innerHTML = '';
  const columns = [
    o => `<span class="td-strong">#${escapeHtml(o.orderNumber || o._id)}</span>`,
    o => escapeHtml(o.customerName || (o.user && o.user.name) || '—'),
    o => `<b>${formatCurrency(o.amount)}</b>`,
    o => orderStatusBadge(o.status),
  ];
  if(withDate) columns.push(o => `<span class="td-muted">${formatDateTime(o.createdAt)}</span>`);
  renderTable(body, orders, columns, (order)=> location.href = `order-detail.html?id=${order._id}`);
}

document.getElementById('blockBtn').addEventListener('click', ()=>{
  if(!currentDboy) return;
  const willBlock = !currentDboy.blocked;
  confirmAction({
    title: willBlock ? 'Block this delivery boy?' : 'Unblock this delivery boy?',
    message: willBlock ? 'They will not be able to accept new orders until unblocked.' : 'They will be able to accept orders again.',
    confirmLabel: willBlock ? 'Block' : 'Unblock',
    danger: willBlock,
    onConfirm: async ()=>{
      try{
        await deliveryApi.block(dboyId, willBlock);
        showToast(willBlock ? 'Delivery boy blocked' : 'Delivery boy unblocked', 'success');
        loadDboy();
      }catch(err){ handleApiError(err, 'Failed to update status.'); }
    }
  });
});

document.getElementById('saveMaxOrdersBtn').addEventListener('click', async ()=>{
  const val = Number(document.getElementById('maxOrdersInput').value);
  if(!val || val < 1){ showToast('Enter a valid number', 'error'); return; }
  try{
    await deliveryApi.setMaxOrders(dboyId, val);
    showToast('Max concurrent orders updated', 'success');
  }catch(err){ handleApiError(err, 'Failed to update.'); }
});

loadDboy();
