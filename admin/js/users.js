/* ============================================================
   USERS — searchable customer table, block toggle, row -> detail
============================================================ */

renderLayout('Users');

const usersBody = document.getElementById('usersBody');
const usersEmpty = document.getElementById('usersEmpty');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');

let usersState = { page: 1, limit: 15, search: '', total: 0 };

function initials(name){
  return (name || 'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
}

function renderUsers(users){
  if(!users || users.length === 0){
    usersBody.innerHTML = '';
    renderEmptyState(usersEmpty, {
      title: 'No customers found',
      sub: usersState.search ? 'Try a different search term.' : 'Customers will appear here once they sign up.'
    });
    return;
  }
  usersEmpty.innerHTML = '';
  renderTable(usersBody, users, [
    u => `<div class="user-avatar-cell"><div class="user-avatar-sm">${initials(u.name)}</div><span class="td-strong">${escapeHtml(u.name || 'Unnamed')}</span></div>`,
    u => escapeHtml(u.phone || '—'),
    u => u.totalOrders ?? 0,
    u => formatCurrency(u.totalSpent),
    u => `<label class="toggle"><input type="checkbox" data-id="${u._id}" class="user-block-toggle" ${u.blocked ? 'checked' : ''}><span class="toggle-track"></span></label>`,
  ], (user)=> location.href = `user-detail.html?id=${user._id}`);
  renderPagination();

  usersBody.querySelectorAll('.user-block-toggle').forEach(input=>{
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('change', ()=>{
      const willBlock = input.checked;
      input.checked = !willBlock; // revert until confirmed
      confirmAction({
        title: willBlock ? 'Block this customer?' : 'Unblock this customer?',
        message: willBlock ? 'They will not be able to place new orders.' : 'They will be able to order again.',
        confirmLabel: willBlock ? 'Block' : 'Unblock',
        danger: willBlock,
        onConfirm: async ()=>{
          try{
            await userApi.toggleBlock(input.dataset.id, willBlock);
            showToast(willBlock ? 'Customer blocked' : 'Customer unblocked', 'success');
            input.checked = willBlock;
          }catch(err){ handleApiError(err, 'Failed to update customer.'); }
        }
      });
    });
  });
}

function renderPagination(){
  const totalPages = Math.max(1, Math.ceil(usersState.total / usersState.limit));
  const p = usersState.page;
  let html = `<div class="pagination-info">Page ${p} of ${totalPages} (${usersState.total} customers)</div><div class="pagination-controls">`;
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
    btn.addEventListener('click', ()=>{ usersState.page = parseInt(btn.dataset.page); loadUsers(); });
  });
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if(prevBtn) prevBtn.addEventListener('click', ()=>{ usersState.page--; loadUsers(); });
  if(nextBtn) nextBtn.addEventListener('click', ()=>{ usersState.page++; loadUsers(); });
}

async function loadUsers(){
  renderSkeletonTable(usersBody, 5, usersState.limit);
  try{
    const res = await userApi.list({ page: usersState.page, limit: usersState.limit, search: usersState.search });
    const users = (res && res.users) || res || [];
    usersState.total = (res && res.total) != null ? res.total : users.length;
    renderUsers(users);
  }catch(err){
    handleApiError(err, 'Failed to load customers.');
    renderEmptyState(usersEmpty, { title:'Could not load customers', sub:'Please try again.' });
  }
}

let searchDebounce = null;
searchInput.addEventListener('input', ()=>{
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(()=>{
    usersState.search = searchInput.value.trim();
    usersState.page = 1;
    loadUsers();
  }, 350);
});

loadUsers();
