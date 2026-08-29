/* ============================================================
   ORDER-DETAIL — full order card, status stepper, reassign,
   cancel, refund actions
============================================================ */

renderLayout('Order Detail');

const orderId = new URLSearchParams(location.search).get('id');
const skeletonEl = document.getElementById('orderDetailSkeleton');
const contentEl = document.getElementById('orderDetailContent');

const STATUS_STEPS = [
  { key:'pending', label:'Order Placed' },
  { key:'accepted', label:'Accepted' },
  { key:'out_for_delivery', label:'Out for Delivery' },
  { key:'delivered', label:'Delivered' },
];

function orderStatusBadge(status){
  const s = (status || 'pending').toLowerCase();
  return `<span class="order-status-badge ${s}">${(status || '').replace(/_/g,' ')}</span>`;
}

function renderItems(items){
  const container = document.getElementById('odItemsList');
  if(!items || items.length === 0){
    container.innerHTML = `<div class="text-muted" style="font-size:12.5px;">No items.</div>`;
    return;
  }
  container.innerHTML = items.map(item => `
    <div class="od-item">
      <div class="od-item-ic">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 2h8M9 2v5.2a3 3 0 0 1-.6 1.8L6 12.4A4 4 0 0 0 5 15v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5a4 4 0 0 0-1-2.6l-2.4-3.4A3 3 0 0 1 15 7.2V2"/></svg>
      </div>
      <div>
        <div class="od-item-name">${escapeHtml(item.name)}</div>
        <div class="od-item-meta">Qty ${item.qty} × ${formatCurrency(item.price)}</div>
      </div>
      <div class="od-item-price">${formatCurrency(item.qty * item.price)}</div>
    </div>
  `).join('');
}

function renderStepper(status, cancelled){
  const stepper = document.getElementById('odStepper');
  if(cancelled){
    stepper.innerHTML = `
      <div class="step done">
        <div class="step-dot-col"><div class="step-dot"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg></div></div>
        <div class="step-body"><div class="step-title">Order Placed</div></div>
      </div>
      <div class="step current" style="color:var(--danger);">
        <div class="step-dot-col"><div class="step-dot" style="background:var(--danger);border-color:var(--danger);color:#fff;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </div></div>
        <div class="step-body"><div class="step-title" style="color:var(--danger);">Cancelled</div></div>
      </div>`;
    return;
  }
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
  stepper.innerHTML = STATUS_STEPS.map((step, idx) => {
    const done = idx < currentIdx || (idx === currentIdx && status === 'delivered');
    const current = idx === currentIdx && status !== 'delivered';
    const isLast = idx === STATUS_STEPS.length - 1;
    return `
      <div class="step ${done ? 'done' : current ? 'current' : ''}">
        <div class="step-dot-col">
          <div class="step-dot">${done ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>' : (idx+1)}</div>
          ${!isLast ? '<div class="step-line"></div>' : ''}
        </div>
        <div class="step-body">
          <div class="step-title">${step.label}</div>
        </div>
      </div>`;
  }).join('');
}

function renderDeliveryBoyBlock(dboy){
  const el = document.getElementById('odDeliveryBoyBlock');
  if(!dboy){
    el.innerHTML = `<div class="text-muted" style="font-size:12.5px;">Not assigned yet.</div>`;
    return;
  }
  const initials = (dboy.name || 'D').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  el.innerHTML = `
    <div class="dboy-avatar">${initials}</div>
    <div>
      <div class="dboy-name">${escapeHtml(dboy.name)}</div>
      <div class="dboy-phone">${escapeHtml(dboy.phone || '')}</div>
    </div>`;
}

async function loadReassignOptions(currentId){
  const select = document.getElementById('reassignSelect');
  try{
    const boys = await deliveryApi.availableForAssign();
    (boys || []).forEach(b=>{
      const opt = document.createElement('option');
      opt.value = b._id;
      opt.textContent = b.name + (b.activeOrders != null ? ` (${b.activeOrders} active)` : '');
      if(currentId && b._id === currentId) opt.selected = true;
      select.appendChild(opt);
    });
  }catch(e){ /* non-critical */ }
}

let currentOrder = null;

async function loadOrder(){
  if(!orderId){
    showToast('Missing order ID', 'error');
    return;
  }
  try{
    const order = await orderApi.get(orderId);
    currentOrder = order;
    skeletonEl.style.display = 'none';
    contentEl.style.display = 'grid';

    document.getElementById('odOrderNumber').textContent = '#' + (order.orderNumber || order._id);
    document.getElementById('odDate').textContent = formatDateTime(order.createdAt);
    document.getElementById('odStatusBadge').innerHTML = orderStatusBadge(order.status);

    renderItems(order.items);
    renderStepper(order.status, order.status === 'cancelled');
    renderDeliveryBoyBlock(order.deliveryBoy);

    document.getElementById('odSubtotal').textContent = formatCurrency(order.subtotal);
    document.getElementById('odDeliveryCharge').textContent = order.deliveryCharge ? formatCurrency(order.deliveryCharge) : 'Free';
    document.getElementById('odDiscount').textContent = order.discount ? '-' + formatCurrency(order.discount) : '—';
    document.getElementById('odTotal').textContent = formatCurrency(order.amount);
    document.getElementById('odPaymentMethod').textContent = order.paymentMethod || '—';
    document.getElementById('odPaymentStatus').textContent = order.paymentStatus || '—';

    const address = order.address || {};
    const addrParts = [address.line, address.apartment || address.room, address.city].filter(Boolean);
    document.getElementById('odAddress').textContent = addrParts.join(', ') || 'No address provided';
    const mapLink = document.getElementById('odMapLink');
    if(address.lat && address.lng){
      mapLink.href = `https://www.google.com/maps?q=${address.lat},${address.lng}`;
    } else {
      mapLink.style.display = 'none';
    }

    document.getElementById('refundBtn').disabled = order.paymentStatus === 'refunded' || order.status !== 'cancelled';
    document.getElementById('cancelOrderBtn').disabled = order.status === 'delivered' || order.status === 'cancelled';

    loadReassignOptions(order.deliveryBoy && order.deliveryBoy._id);
  }catch(err){
    skeletonEl.style.display = 'none';
    handleApiError(err, 'Failed to load order.');
  }
}

document.getElementById('reassignBtn').addEventListener('click', async ()=>{
  const select = document.getElementById('reassignSelect');
  if(!select.value){
    showToast('Please select a delivery boy', 'error');
    return;
  }
  try{
    await orderApi.reassign(orderId, select.value);
    showToast('Delivery boy reassigned', 'success');
    loadOrder();
  }catch(err){
    handleApiError(err, 'Failed to reassign delivery boy.');
  }
});

document.getElementById('cancelOrderBtn').addEventListener('click', ()=>{
  document.getElementById('cancelReason').value = '';
  openModal('cancelModal');
});

document.getElementById('confirmCancelBtn').addEventListener('click', async ()=>{
  const reason = document.getElementById('cancelReason').value.trim();
  try{
    await orderApi.cancel(orderId, reason);
    showToast('Order cancelled', 'success');
    closeModal('cancelModal');
    loadOrder();
  }catch(err){
    handleApiError(err, 'Failed to cancel order.');
  }
});

document.getElementById('refundBtn').addEventListener('click', ()=>{
  confirmAction({
    title: 'Mark order as refunded?',
    message: 'This will mark the payment as refunded for this order.',
    confirmLabel: 'Mark Refunded',
    danger: false,
    onConfirm: async ()=>{
      try{
        await orderApi.refund(orderId);
        showToast('Order marked as refunded', 'success');
        loadOrder();
      }catch(err){
        handleApiError(err, 'Failed to mark order as refunded.');
      }
    }
  });
});

loadOrder();
