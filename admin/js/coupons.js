/* ============================================================
   COUPONS — table, search, add/edit modal with type toggle
============================================================ */

renderLayout('Coupons');

const couponsBody = document.getElementById('couponsBody');
const couponsEmpty = document.getElementById('couponsEmpty');
const searchInput = document.getElementById('searchInput');
let couponsState = { search: '' };
let currentType = 'flat';

function renderCoupons(coupons){
  if(!coupons || coupons.length === 0){
    couponsBody.innerHTML = '';
    renderEmptyState(couponsEmpty, {
      title: 'No coupons found',
      sub: couponsState.search ? 'Try a different search term.' : 'Create your first coupon code.'
    });
    return;
  }
  couponsEmpty.innerHTML = '';
  renderTable(couponsBody, coupons, [
    c => `<span class="coupon-code">${escapeHtml(c.code)}</span>`,
    c => `<span class="badge ${c.type === 'percent' ? 'badge-yellow' : 'badge-green'}">${c.type === 'percent' ? 'Percent' : 'Flat'}</span>`,
    c => c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value),
    c => formatCurrency(c.minOrder || 0),
    c => formatDate(c.expiry),
    c => `${c.used || 0} / ${c.usageLimit || '∞'}`,
    c => `<label class="toggle"><input type="checkbox" data-id="${c._id}" class="coupon-active-toggle" ${c.active ? 'checked' : ''}><span class="toggle-track"></span></label>`,
    c => `
      <div class="td-actions" style="justify-content:flex-end;">
        <button class="icon-btn-sm edit-coupon-btn" data-id="${c._id}" title="Edit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="icon-btn-sm danger delete-coupon-btn" data-id="${c._id}" data-code="${escapeHtml(c.code)}" title="Delete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
        </button>
      </div>`
  ]);

  couponsBody.querySelectorAll('.coupon-active-toggle').forEach(input=>{
    input.addEventListener('change', async ()=>{
      try{
        await couponApi.toggleActive(input.dataset.id, input.checked);
        showToast('Coupon updated', 'success');
      }catch(err){
        input.checked = !input.checked;
        handleApiError(err, 'Failed to update coupon.');
      }
    });
  });

  couponsBody.querySelectorAll('.edit-coupon-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const coupon = coupons.find(c => c._id === btn.dataset.id);
      if(coupon) openCouponModal(coupon);
    });
  });

  couponsBody.querySelectorAll('.delete-coupon-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      confirmAction({
        title: 'Delete coupon?',
        message: `Coupon "${btn.dataset.code}" will be permanently removed.`,
        confirmLabel: 'Delete',
        onConfirm: async ()=>{
          try{
            await couponApi.delete(btn.dataset.id);
            showToast('Coupon deleted', 'success');
            loadCoupons();
          }catch(err){
            handleApiError(err, 'Failed to delete coupon.');
          }
        }
      });
    });
  });
}

async function loadCoupons(){
  renderSkeletonTable(couponsBody, 8, 6);
  try{
    const res = await couponApi.list({ search: couponsState.search });
    renderCoupons((res && res.coupons) || res || []);
  }catch(err){
    handleApiError(err, 'Failed to load coupons.');
    renderEmptyState(couponsEmpty, { title:'Could not load coupons', sub:'Please try again.' });
  }
}

let searchDebounce = null;
searchInput.addEventListener('input', ()=>{
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(()=>{
    couponsState.search = searchInput.value.trim();
    loadCoupons();
  }, 350);
});

/* ---------------- ADD/EDIT MODAL ---------------- */
const couponForm = document.getElementById('couponForm');
const typeSwitch = document.getElementById('typeSwitch');
const cValueLabel = document.getElementById('cValueLabel');
const cCode = document.getElementById('cCode');

cCode.addEventListener('input', ()=>{
  cCode.value = cCode.value.toUpperCase();
});

typeSwitch.querySelectorAll('button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    typeSwitch.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
    cValueLabel.textContent = currentType === 'percent' ? 'Value (%)' : 'Value (₹)';
  });
});

function openCouponModal(coupon){
  couponForm.reset();
  document.getElementById('couponId').value = '';
  document.getElementById('couponModalTitle').textContent = coupon ? 'Edit Coupon' : 'Add Coupon';
  currentType = (coupon && coupon.type) || 'flat';
  typeSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.type === currentType));
  cValueLabel.textContent = currentType === 'percent' ? 'Value (%)' : 'Value (₹)';

  if(coupon){
    document.getElementById('couponId').value = coupon._id;
    cCode.value = coupon.code || '';
    document.getElementById('cValue').value = coupon.value ?? '';
    document.getElementById('cMinOrder').value = coupon.minOrder ?? '';
    document.getElementById('cExpiry').value = coupon.expiry ? coupon.expiry.substring(0,10) : '';
    document.getElementById('cUsageLimit').value = coupon.usageLimit ?? '';
    document.getElementById('cActive').checked = coupon.active !== false;
  } else {
    document.getElementById('cActive').checked = true;
  }
  openModal('couponModal');
}

document.getElementById('addCouponBtn').addEventListener('click', ()=> openCouponModal(null));

document.getElementById('saveCouponBtn').addEventListener('click', async ()=>{
  const code = cCode.value.trim();
  const value = document.getElementById('cValue').value;

  if(!code || !value){
    showToast('Please fill all required fields', 'error');
    return;
  }

  const body = {
    code, type: currentType, value: Number(value),
    minOrder: Number(document.getElementById('cMinOrder').value || 0),
    expiry: document.getElementById('cExpiry').value || null,
    usageLimit: document.getElementById('cUsageLimit').value ? Number(document.getElementById('cUsageLimit').value) : null,
    active: document.getElementById('cActive').checked
  };

  const id = document.getElementById('couponId').value;
  const saveBtn = document.getElementById('saveCouponBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner dark"></span> Saving...';

  try{
    if(id) await couponApi.update(id, body);
    else await couponApi.create(body);
    showToast(id ? 'Coupon updated' : 'Coupon added', 'success');
    closeModal('couponModal');
    loadCoupons();
  }catch(err){
    handleApiError(err, 'Failed to save coupon.');
  }finally{
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Coupon';
  }
});

loadCoupons();
