/* ============================================================
   PLANS — card list, search, add/edit modal with product checklist
============================================================ */

renderLayout('Plans');

const plansGrid = document.getElementById('plansGrid');
const plansEmpty = document.getElementById('plansEmpty');
const searchInput = document.getElementById('searchInput');
let allProductsCache = [];
let plansState = { search: '' };

function planCardHtml(plan){
  return `
    <div class="plan-card">
      <div class="plan-card-top">
        <div>
          <div class="plan-name">${escapeHtml(plan.name)}</div>
          <div class="plan-duration">${escapeHtml(plan.duration || '')}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" data-id="${plan._id}" class="plan-active-toggle" ${plan.active ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
      </div>
      <div class="plan-desc">${escapeHtml(plan.description || '')}</div>
      <div class="plan-price">${formatCurrency(plan.price)} <span>/ ${escapeHtml(plan.duration || '')}</span></div>
      ${plan.discount ? `<span class="badge badge-green" style="align-self:flex-start;">${plan.discount}% OFF</span>` : ''}
      <div class="plan-footer">
        <button class="icon-btn-sm edit-plan-btn" data-id="${plan._id}" title="Edit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="icon-btn-sm danger delete-plan-btn" data-id="${plan._id}" data-name="${escapeHtml(plan.name)}" title="Delete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
        </button>
      </div>
    </div>`;
}

function renderPlans(plans){
  if(!plans || plans.length === 0){
    plansGrid.innerHTML = '';
    renderEmptyState(plansEmpty, {
      title: 'No plans found',
      sub: plansState.search ? 'Try a different search term.' : 'Add your first subscription plan.'
    });
    return;
  }
  plansEmpty.innerHTML = '';
  plansGrid.innerHTML = plans.map(planCardHtml).join('');

  plansGrid.querySelectorAll('.plan-active-toggle').forEach(input=>{
    input.addEventListener('change', async ()=>{
      try{
        await planApi.toggleActive(input.dataset.id, input.checked);
        showToast('Plan updated', 'success');
      }catch(err){
        input.checked = !input.checked;
        handleApiError(err, 'Failed to update plan.');
      }
    });
  });

  plansGrid.querySelectorAll('.edit-plan-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const plan = plans.find(p => p._id === btn.dataset.id);
      if(plan) openPlanModal(plan);
    });
  });

  plansGrid.querySelectorAll('.delete-plan-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      confirmAction({
        title: 'Delete plan?',
        message: `"${btn.dataset.name}" will be permanently removed.`,
        confirmLabel: 'Delete',
        onConfirm: async ()=>{
          try{
            await planApi.delete(btn.dataset.id);
            showToast('Plan deleted', 'success');
            loadPlans();
          }catch(err){
            handleApiError(err, 'Failed to delete plan.');
          }
        }
      });
    });
  });
}

async function loadPlans(){
  plansGrid.innerHTML = Array.from({length:4}).map(()=>`<div class="skeleton skeleton-card"></div>`).join('');
  try{
    const res = await planApi.list({ search: plansState.search });
    renderPlans((res && res.plans) || res || []);
  }catch(err){
    handleApiError(err, 'Failed to load plans.');
    renderEmptyState(plansEmpty, { title:'Could not load plans', sub:'Please try again.' });
  }
}

let searchDebounce = null;
searchInput.addEventListener('input', ()=>{
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(()=>{
    plansState.search = searchInput.value.trim();
    loadPlans();
  }, 350);
});

/* ---------------- ADD/EDIT MODAL ---------------- */
const planForm = document.getElementById('planForm');
const planImageGrid = document.getElementById('planImageGrid');
const planImageInput = document.getElementById('planImageInput');
const planProductChecklist = document.getElementById('planProductChecklist');
let planImage = null;

function renderPlanImageThumb(){
  planImageGrid.querySelectorAll('.upload-thumb').forEach(el => el.remove());
  if(planImage){
    const thumb = document.createElement('div');
    thumb.className = 'upload-thumb';
    thumb.innerHTML = `<img src="${planImage.url}" alt=""><button type="button" class="remove-thumb" id="removePlanImg">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
    planImageGrid.insertBefore(thumb, planImageGrid.firstChild);
    document.getElementById('removePlanImg').addEventListener('click', ()=>{ planImage = null; renderPlanImageThumb(); });
  }
}
planImageInput.addEventListener('change', ()=>{
  if(planImageInput.files[0]){
    planImage = { file: planImageInput.files[0], url: URL.createObjectURL(planImageInput.files[0]) };
    renderPlanImageThumb();
  }
});

async function loadProductChecklist(selectedIds = []){
  if(allProductsCache.length === 0){
    try{
      const res = await productApi.list({ limit: 200 });
      allProductsCache = (res && res.products) || res || [];
    }catch(e){ allProductsCache = []; }
  }
  planProductChecklist.innerHTML = allProductsCache.map(p => `
    <label class="checklist-item">
      <input type="checkbox" value="${p._id}" ${selectedIds.includes(p._id) ? 'checked' : ''}>
      ${escapeHtml(p.name)}
    </label>
  `).join('') || `<div class="text-muted" style="font-size:12px;">No products available yet.</div>`;
}

function openPlanModal(plan){
  planForm.reset();
  planImage = null;
  document.getElementById('planId').value = '';
  document.getElementById('planModalTitle').textContent = plan ? 'Edit Plan' : 'Add Plan';

  if(plan){
    document.getElementById('planId').value = plan._id;
    document.getElementById('plName').value = plan.name || '';
    document.getElementById('plDescription').value = plan.description || '';
    document.getElementById('plPrice').value = plan.price ?? '';
    document.getElementById('plDuration').value = plan.duration || 'daily';
    document.getElementById('plDiscount').value = plan.discount ?? '';
    document.getElementById('plActive').checked = plan.active !== false;
    if(plan.image) planImage = { url: plan.image, existing: true };
  } else {
    document.getElementById('plActive').checked = true;
  }
  renderPlanImageThumb();
  loadProductChecklist((plan && plan.includedProducts) || []);
  openModal('planModal');
}

document.getElementById('addPlanBtn').addEventListener('click', ()=> openPlanModal(null));

document.getElementById('savePlanBtn').addEventListener('click', async ()=>{
  const name = document.getElementById('plName').value.trim();
  const price = document.getElementById('plPrice').value;

  if(!name || !price){
    showToast('Please fill all required fields', 'error');
    return;
  }

  const includedIds = Array.from(planProductChecklist.querySelectorAll('input:checked')).map(i => i.value);

  const fd = new FormData();
  fd.append('name', name);
  fd.append('description', document.getElementById('plDescription').value.trim());
  fd.append('price', price);
  fd.append('duration', document.getElementById('plDuration').value);
  fd.append('discount', document.getElementById('plDiscount').value || 0);
  fd.append('includedProducts', JSON.stringify(includedIds));
  fd.append('active', document.getElementById('plActive').checked);
  if(planImage && planImage.file) fd.append('image', planImage.file);
  else if(planImage && planImage.existing) fd.append('existingImage', planImage.url);

  const id = document.getElementById('planId').value;
  const saveBtn = document.getElementById('savePlanBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner dark"></span> Saving...';

  try{
    if(id) await planApi.update(id, fd);
    else await planApi.create(fd);
    showToast(id ? 'Plan updated' : 'Plan added', 'success');
    closeModal('planModal');
    loadPlans();
  }catch(err){
    handleApiError(err, 'Failed to save plan.');
  }finally{
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Plan';
  }
});

loadPlans();
