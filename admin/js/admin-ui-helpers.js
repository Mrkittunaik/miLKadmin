/* ============================================================
   ADMIN-UI-HELPERS — showToast, modal helpers, table render,
   loading skeleton, empty state. Mirrors the customer app's
   showToast / goToScreen visual language.
============================================================ */

/* ---------------- TOAST ---------------- */
let __toastTimer = null;
function ensureToastEl(){
  let t = document.getElementById('toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    t.id = 'toast';
    document.body.appendChild(t);
  }
  return t;
}
function showToast(msg, type = 'default'){
  const t = ensureToastEl();
  t.textContent = msg;
  t.className = 'toast show' + (type === 'success' ? ' toast-success' : type === 'error' ? ' toast-error' : '');
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(()=> t.classList.remove('show'), 2600);
}

/* ---------------- MODAL ---------------- */
function openModal(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.remove('show');
  document.body.style.overflow = '';
}
// Close modal on backdrop click
document.addEventListener('click', (e)=>{
  if(e.target.classList && e.target.classList.contains('modal-backdrop')){
    e.target.classList.remove('show');
    document.body.style.overflow = '';
  }
});
// Close modal on Escape
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    document.querySelectorAll('.modal-backdrop.show').forEach(el=>{
      el.classList.remove('show');
    });
    document.body.style.overflow = '';
  }
});

/**
 * Generic confirm modal for destructive actions.
 * opts: { title, message, confirmLabel, danger, onConfirm }
 */
function confirmAction({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm }){
  let el = document.getElementById('confirmModal');
  if(!el){
    el = document.createElement('div');
    el.id = 'confirmModal';
    el.className = 'modal-backdrop';
    el.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-body">
          <div class="confirm-body">
            <div class="confirm-icon" id="confirmIcon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
            </div>
            <h3 id="confirmTitle"></h3>
            <p id="confirmMessage"></p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="confirmCancelBtn">Cancel</button>
          <button class="btn btn-danger" id="confirmOkBtn">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(el);
  }
  el.querySelector('#confirmTitle').textContent = title || 'Are you sure?';
  el.querySelector('#confirmMessage').textContent = message || '';
  const okBtn = el.querySelector('#confirmOkBtn');
  okBtn.textContent = confirmLabel;
  okBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
  const cancelBtn = el.querySelector('#confirmCancelBtn');

  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener('click', ()=>{
    closeModal('confirmModal');
    if(typeof onConfirm === 'function') onConfirm();
  });
  cancelBtn.onclick = ()=> closeModal('confirmModal');

  openModal('confirmModal');
}

/* ---------------- LOADING SKELETON ---------------- */
function renderSkeletonRows(container, count = 5, height = 44){
  if(!container) return;
  container.innerHTML = Array.from({length: count}).map(()=>
    `<div class="skeleton skeleton-row" style="height:${height}px"></div>`
  ).join('');
}
function renderSkeletonTable(tbody, cols, rows = 5){
  if(!tbody) return;
  tbody.innerHTML = Array.from({length: rows}).map(()=>
    `<tr>${Array.from({length: cols}).map(()=>`<td><div class="skeleton" style="height:16px;width:80%;"></div></td>`).join('')}</tr>`
  ).join('');
}

/* ---------------- EMPTY STATE ---------------- */
function renderEmptyState(container, { icon, title, sub }){
  if(!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-ic">${icon || defaultEmptyIcon()}</div>
      <div class="empty-state-title">${title || 'Nothing here yet'}</div>
      <div class="empty-state-sub">${sub || ''}</div>
    </div>`;
}
function defaultEmptyIcon(){
  return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></svg>`;
}

/* ---------------- TABLE RENDER HELPER ---------------- */
/**
 * Renders <tbody> rows generically.
 * columns: array of functions (row) => html-string for each <td>
 * onRowClick: optional (row) => void
 */
function renderTable(tbody, rows, columns, onRowClick){
  if(!tbody) return;
  if(!rows || rows.length === 0){
    tbody.innerHTML = '';
    return;
  }
  tbody.innerHTML = rows.map((row, idx) => `
    <tr class="${onRowClick ? 'clickable' : ''}" data-idx="${idx}">
      ${columns.map(col => `<td>${col(row)}</td>`).join('')}
    </tr>
  `).join('');
  if(onRowClick){
    Array.from(tbody.querySelectorAll('tr')).forEach((tr, idx)=>{
      tr.addEventListener('click', ()=> onRowClick(rows[idx]));
    });
  }
}

/* ---------------- FORMAT HELPERS ---------------- */
function formatCurrency(v){
  return '₹' + Number(v || 0).toLocaleString('en-IN');
}
function formatDate(d){
  if(!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function formatDateTime(d){
  if(!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) + ', ' +
         dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/* ---------------- ERROR HANDLING HELPER ---------------- */
function handleApiError(err, fallbackMsg = 'Something went wrong. Please try again.'){
  console.error(err);
  showToast((err && err.message) || fallbackMsg, 'error');
}
