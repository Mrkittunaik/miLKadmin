/* ============================================================
   USER-DETAIL — customer profile, saved addresses, order history
============================================================ */

renderLayout('Customer Detail');

const userId = new URLSearchParams(location.search).get('id');
const udSkeleton = document.getElementById('udSkeleton');
const udContent = document.getElementById('udContent');

function orderStatusBadge(status){
  const s = (status || 'pending').toLowerCase();
  return `<span class="order-status-badge ${s}">${(status || '').replace(/_/g,' ')}</span>`;
}

function initials(name){
  return (name || 'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
}

let currentUser = null;

async function loadUser(){
  if(!userId){ showToast('Missing customer ID', 'error'); return; }
  try{
    const user = await userApi.get(userId);
    currentUser = user;
    udSkeleton.style.display = 'none';
    udContent.style.display = 'block';

    document.getElementById('udAvatar').textContent = initials(user.name);
    document.getElementById('udName').textContent = user.name || 'Unnamed';
    document.getElementById('udPhone').textContent = user.phone || '—';
    document.getElementById('udBlockToggle').checked = !!user.blocked;
    document.getElementById('udTotalOrders').textContent = user.totalOrders ?? 0;
    document.getElementById('udTotalSpent').textContent = formatCurrency(user.totalSpent);

    renderAddresses(user.addresses || []);
    loadOrders();
  }catch(err){
    udSkeleton.style.display = 'none';
    handleApiError(err, 'Failed to load customer.');
  }
}

function renderAddresses(addresses){
  const container = document.getElementById('udAddresses');
  if(!addresses || addresses.length === 0){
    renderEmptyState(container, { title:'No saved addresses', sub:'This customer has not saved any delivery addresses yet.' });
    return;
  }
  container.innerHTML = addresses.map(a => `
    <div class="addr-card">
      <div class="addr-label">${escapeHtml(a.label || 'Address')}</div>
      <div class="addr-full">${escapeHtml([a.line, a.apartment || a.room, a.city].filter(Boolean).join(', '))}</div>
    </div>
  `).join('');
}

async function loadOrders(){
  const body = document.getElementById('udOrdersBody');
  const empty = document.getElementById('udOrdersEmpty');
  renderSkeletonTable(body, 4, 5);
  try{
    const res = await userApi.orders(userId, { limit: 50 });
    const orders = (res && res.orders) || res || [];
    if(orders.length === 0){
      body.innerHTML = '';
      renderEmptyState(empty, { title:'No orders yet', sub:'This customer hasn\u2019t placed any orders.' });
      return;
    }
    empty.innerHTML = '';
    renderTable(body, orders, [
      o => `<span class="td-strong">#${escapeHtml(o.orderNumber || o._id)}</span>`,
      o => `<b>${formatCurrency(o.amount)}</b>`,
      o => orderStatusBadge(o.status),
      o => `<span class="td-muted">${formatDateTime(o.createdAt)}</span>`,
    ], (order)=> location.href = `order-detail.html?id=${order._id}`);
  }catch(err){
    handleApiError(err, 'Failed to load order history.');
  }
}

document.getElementById('udBlockToggle').addEventListener('change', (e)=>{
  const willBlock = e.target.checked;
  e.target.checked = !willBlock;
  confirmAction({
    title: willBlock ? 'Block this customer?' : 'Unblock this customer?',
    message: willBlock ? 'They will not be able to place new orders.' : 'They will be able to order again.',
    confirmLabel: willBlock ? 'Block' : 'Unblock',
    danger: willBlock,
    onConfirm: async ()=>{
      try{
        await userApi.toggleBlock(userId, willBlock);
        showToast(willBlock ? 'Customer blocked' : 'Customer unblocked', 'success');
        e.target.checked = willBlock;
      }catch(err){ handleApiError(err, 'Failed to update customer.'); }
    }
  });
});

loadUser();
