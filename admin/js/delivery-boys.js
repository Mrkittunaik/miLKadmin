/* ============================================================
   DELIVERY-BOYS — Pending / Approved / Blocked tabs
============================================================ */

renderLayout('Delivery Boys');

const pendingGrid = document.getElementById('pendingGrid');
const pendingEmpty = document.getElementById('pendingEmpty');
const approvedBody = document.getElementById('approvedBody');
const approvedEmpty = document.getElementById('approvedEmpty');
const blockedBody = document.getElementById('blockedBody');
const blockedEmpty = document.getElementById('blockedEmpty');

/* ---------------- TABS ---------------- */
document.querySelectorAll('.tab-item').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

/* ---------------- PENDING TAB ---------------- */
function renderPending(applicants){
  if(!applicants || applicants.length === 0){
    pendingGrid.innerHTML = '';
    renderEmptyState(pendingEmpty, { title:'No pending applications', sub:'New delivery boy applications will show up here.' });
    return;
  }
  pendingEmpty.innerHTML = '';
  pendingGrid.innerHTML = applicants.map(a => `
    <div class="applicant-card">
      <div class="applicant-top">
        <img class="applicant-photo" src="${a.photo || '../images/logo.png'}" alt="">
        <div>
          <div class="applicant-name">${escapeHtml(a.name)}</div>
          <div class="applicant-phone">${escapeHtml(a.phone || '')}</div>
        </div>
      </div>
      <div class="applicant-actions">
        <button class="btn btn-primary btn-sm approve-btn" data-id="${a._id}" data-name="${escapeHtml(a.name)}">Approve</button>
        <button class="btn btn-danger btn-sm reject-btn" data-id="${a._id}" data-name="${escapeHtml(a.name)}">Reject</button>
      </div>
    </div>
  `).join('');

  pendingGrid.querySelectorAll('.approve-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      confirmAction({
        title: 'Approve applicant?',
        message: `"${btn.dataset.name}" will be approved and able to accept deliveries.`,
        confirmLabel: 'Approve', danger: false,
        onConfirm: async ()=>{
          try{
            await deliveryApi.approve(btn.dataset.id);
            showToast('Applicant approved', 'success');
            loadAll();
          }catch(err){ handleApiError(err, 'Failed to approve applicant.'); }
        }
      });
    });
  });

  pendingGrid.querySelectorAll('.reject-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      confirmAction({
        title: 'Reject applicant?',
        message: `"${btn.dataset.name}" will be rejected. This cannot be undone.`,
        confirmLabel: 'Reject',
        onConfirm: async ()=>{
          try{
            await deliveryApi.reject(btn.dataset.id);
            showToast('Applicant rejected', 'success');
            loadAll();
          }catch(err){ handleApiError(err, 'Failed to reject applicant.'); }
        }
      });
    });
  });
}

/* ---------------- APPROVED TAB ---------------- */
function renderApproved(boys){
  if(!boys || boys.length === 0){
    approvedBody.innerHTML = '';
    renderEmptyState(approvedEmpty, { title:'No approved delivery boys', sub:'Approve applicants from the Pending tab.' });
    return;
  }
  approvedEmpty.innerHTML = '';
  renderTable(approvedBody, boys, [
    b => `<span class="td-strong">${escapeHtml(b.name)}</span>`,
    b => `<span class="status-badge approved">Active</span>`,
    b => b.totalDelivered ?? 0,
    b => b.rating ? `${b.rating.toFixed(1)} ★` : '—',
    b => b.activeOrders ?? 0,
    b => `<div class="inline-edit"><input type="number" min="1" value="${b.maxConcurrentOrders ?? 5}" data-id="${b._id}" class="max-orders-input"><button class="save-max-btn" data-id="${b._id}">✓</button></div>`,
    b => `<label class="toggle"><input type="checkbox" data-id="${b._id}" class="block-toggle"><span class="toggle-track"></span></label>`,
  ], (row)=> location.href = `delivery-boy-detail.html?id=${row._id}`);

  approvedBody.querySelectorAll('.save-max-btn').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      e.stopPropagation();
      const input = approvedBody.querySelector(`.max-orders-input[data-id="${btn.dataset.id}"]`);
      try{
        await deliveryApi.setMaxOrders(btn.dataset.id, Number(input.value));
        showToast('Max concurrent orders updated', 'success');
      }catch(err){ handleApiError(err, 'Failed to update.'); }
    });
  });
  approvedBody.querySelectorAll('.max-orders-input').forEach(input=>{
    input.addEventListener('click', e => e.stopPropagation());
  });
  approvedBody.querySelectorAll('.block-toggle').forEach(input=>{
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('change', ()=>{
      input.checked = false; // revert visual, real state moves to Blocked tab
      confirmAction({
        title: 'Block this delivery boy?',
        message: 'They will not be able to accept new orders until unblocked.',
        confirmLabel: 'Block',
        onConfirm: async ()=>{
          try{
            await deliveryApi.block(input.dataset.id, true);
            showToast('Delivery boy blocked', 'success');
            loadAll();
          }catch(err){ handleApiError(err, 'Failed to block delivery boy.'); }
        }
      });
    });
  });
}

/* ---------------- BLOCKED TAB ---------------- */
function renderBlocked(boys){
  if(!boys || boys.length === 0){
    blockedBody.innerHTML = '';
    renderEmptyState(blockedEmpty, { title:'No blocked delivery boys', sub:'Blocked delivery boys will show up here.' });
    return;
  }
  blockedEmpty.innerHTML = '';
  renderTable(blockedBody, boys, [
    b => `<span class="td-strong">${escapeHtml(b.name)}</span>`,
    b => escapeHtml(b.phone || ''),
    b => formatDate(b.blockedAt),
    b => `<button class="btn btn-outline btn-sm unblock-btn" data-id="${b._id}">Unblock</button>`,
  ]);

  blockedBody.querySelectorAll('.unblock-btn').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      try{
        await deliveryApi.block(btn.dataset.id, false);
        showToast('Delivery boy unblocked', 'success');
        loadAll();
      }catch(err){ handleApiError(err, 'Failed to unblock delivery boy.'); }
    });
  });
}

/* ---------------- LOAD ALL ---------------- */
async function loadAll(){
  renderSkeletonRows(pendingGrid, 3, 120);
  renderSkeletonTable(approvedBody, 6, 4);
  renderSkeletonTable(blockedBody, 4, 3);

  try{
    const [pending, approved, blocked] = await Promise.all([
      deliveryApi.list({ status: 'pending' }),
      deliveryApi.list({ status: 'approved' }),
      deliveryApi.list({ status: 'blocked' }),
    ]);
    const pendingList = (pending && pending.deliveryBoys) || pending || [];
    const approvedList = (approved && approved.deliveryBoys) || approved || [];
    const blockedList = (blocked && blocked.deliveryBoys) || blocked || [];

    renderPending(pendingList);
    renderApproved(approvedList);
    renderBlocked(blockedList);

    document.getElementById('pendingCountTab').textContent = pendingList.length ? `(${pendingList.length})` : '';
    setNavBadge('pending', pendingList.length);
  }catch(err){
    handleApiError(err, 'Failed to load delivery boys.');
  }
}

loadAll();
