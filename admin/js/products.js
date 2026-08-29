/* ============================================================
   PRODUCTS — list, search/filter, add/edit modal, delete
============================================================ */

renderLayout('Products');

let productsState = { page: 1, limit: 10, search: '', category: '', total: 0 };
let uploadedImages = []; // {file, url} for new images; {url} for existing

const productsBody = document.getElementById('productsBody');
const productsEmpty = document.getElementById('productsEmpty');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

function statusToggleHtml(id, active){
  return `<label class="toggle"><input type="checkbox" data-id="${id}" class="active-toggle" ${active ? 'checked' : ''}><span class="toggle-track"></span></label>`;
}

function renderProducts(products){
  if(!products || products.length === 0){
    productsBody.innerHTML = '';
    renderEmptyState(productsEmpty, {
      title: 'No products found',
      sub: productsState.search || productsState.category ? 'Try adjusting your search or filter.' : 'Add your first product to get started.'
    });
    return;
  }
  productsEmpty.innerHTML = '';
  renderTable(productsBody, products, [
    p => `<img class="table-thumb" src="${(p.images && p.images[0]) || '../images/logo.png'}" alt="">`,
    p => `<span class="td-strong">${escapeHtml(p.name)}</span><div class="td-muted" style="font-size:11px;">${escapeHtml(p.category || '')}</div>`,
    p => `<b>${formatCurrency(p.price)}</b>`,
    p => `<span class="${p.stock <= 5 ? 'stock-low' : ''}">${p.stock}</span>`,
    p => p.discount ? `<span class="badge badge-green">${p.discount}% OFF</span>` : `<span class="td-muted">—</span>`,
    p => `<div class="prod-toggle-cell">${statusToggleHtml(p._id, p.active)}</div>`,
    p => `
      <div class="td-actions" style="justify-content:flex-end;">
        <button class="icon-btn-sm edit-btn" data-id="${p._id}" title="Edit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="icon-btn-sm danger delete-btn" data-id="${p._id}" data-name="${escapeHtml(p.name)}" title="Delete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
        </button>
      </div>`
  ]);

  wireRowActions(products);
}

function wireRowActions(products){
  productsBody.querySelectorAll('.active-toggle').forEach(input=>{
    input.addEventListener('change', async ()=>{
      const id = input.dataset.id;
      try{
        await productApi.toggleActive(id, input.checked);
        showToast('Product updated', 'success');
      }catch(err){
        input.checked = !input.checked;
        handleApiError(err, 'Failed to update product status.');
      }
    });
  });

  productsBody.querySelectorAll('.edit-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const product = products.find(p => p._id === btn.dataset.id);
      if(product) openProductModal(product);
    });
  });

  productsBody.querySelectorAll('.delete-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      confirmAction({
        title: 'Delete product?',
        message: `"${btn.dataset.name}" will be permanently removed. This cannot be undone.`,
        confirmLabel: 'Delete',
        onConfirm: async ()=>{
          try{
            await productApi.delete(btn.dataset.id);
            showToast('Product deleted', 'success');
            loadProducts();
          }catch(err){
            handleApiError(err, 'Failed to delete product.');
          }
        }
      });
    });
  });
}

function renderPagination(){
  const totalPages = Math.max(1, Math.ceil(productsState.total / productsState.limit));
  const p = productsState.page;
  let html = `<div class="pagination-info">Page ${p} of ${totalPages} (${productsState.total} products)</div><div class="pagination-controls">`;
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
    btn.addEventListener('click', ()=>{ productsState.page = parseInt(btn.dataset.page); loadProducts(); });
  });
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if(prevBtn) prevBtn.addEventListener('click', ()=>{ productsState.page--; loadProducts(); });
  if(nextBtn) nextBtn.addEventListener('click', ()=>{ productsState.page++; loadProducts(); });
}

async function loadProducts(){
  renderSkeletonTable(productsBody, 7, productsState.limit);
  try{
    const res = await productApi.list({
      page: productsState.page, limit: productsState.limit,
      search: productsState.search, category: productsState.category
    });
    const products = (res && res.products) || res || [];
    productsState.total = (res && res.total) != null ? res.total : products.length;
    renderProducts(products);
    renderPagination();
  }catch(err){
    handleApiError(err, 'Failed to load products.');
    renderEmptyState(productsEmpty, { title:'Could not load products', sub:'Please try again.' });
  }
}

async function loadCategories(){
  try{
    const cats = await productApi.categories();
    (cats || []).forEach(c=>{
      const opt = document.createElement('option');
      opt.value = c.value || c;
      opt.textContent = c.label || c;
      categoryFilter.appendChild(opt);
    });
  }catch(e){ /* non-critical */ }
}

let searchDebounce = null;
searchInput.addEventListener('input', ()=>{
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(()=>{
    productsState.search = searchInput.value.trim();
    productsState.page = 1;
    loadProducts();
  }, 350);
});
categoryFilter.addEventListener('change', ()=>{
  productsState.category = categoryFilter.value;
  productsState.page = 1;
  loadProducts();
});

/* ---------------- ADD / EDIT MODAL ---------------- */
const productForm = document.getElementById('productForm');
const imageUploadGrid = document.getElementById('imageUploadGrid');
const imageInput = document.getElementById('imageInput');

function renderImageThumbs(){
  imageUploadGrid.querySelectorAll('.upload-thumb').forEach(el => el.remove());
  uploadedImages.forEach((img, idx)=>{
    const thumb = document.createElement('div');
    thumb.className = 'upload-thumb';
    thumb.innerHTML = `<img src="${img.url}" alt=""><button type="button" class="remove-thumb" data-idx="${idx}">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
    imageUploadGrid.insertBefore(thumb, imageUploadGrid.firstChild);
  });
  imageUploadGrid.querySelectorAll('.remove-thumb').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      uploadedImages.splice(parseInt(btn.dataset.idx), 1);
      renderImageThumbs();
    });
  });
}

imageInput.addEventListener('change', ()=>{
  Array.from(imageInput.files).forEach(file=>{
    uploadedImages.push({ file, url: URL.createObjectURL(file) });
  });
  renderImageThumbs();
  imageInput.value = '';
});

function openProductModal(product){
  productForm.reset();
  uploadedImages = [];
  document.getElementById('productId').value = '';
  document.getElementById('productModalTitle').textContent = product ? 'Edit Product' : 'Add Product';

  if(product){
    document.getElementById('productId').value = product._id;
    document.getElementById('pName').value = product.name || '';
    document.getElementById('pCategory').value = product.category || '';
    document.getElementById('pDescription').value = product.description || '';
    document.getElementById('pPrice').value = product.price ?? '';
    document.getElementById('pUnit').value = product.unit || 'litre';
    document.getElementById('pStock').value = product.stock ?? '';
    document.getElementById('pDiscount').value = product.discount ?? '';
    document.getElementById('pActive').checked = product.active !== false;
    uploadedImages = (product.images || []).map(url => ({ url, existing: true }));
  } else {
    document.getElementById('pActive').checked = true;
  }
  renderImageThumbs();
  openModal('productModal');
}

document.getElementById('addProductBtn').addEventListener('click', ()=> openProductModal(null));

document.getElementById('saveProductBtn').addEventListener('click', async ()=>{
  const name = document.getElementById('pName').value.trim();
  const category = document.getElementById('pCategory').value;
  const price = document.getElementById('pPrice').value;
  const stock = document.getElementById('pStock').value;

  if(!name || !category || !price || stock === ''){
    showToast('Please fill all required fields', 'error');
    return;
  }

  const fd = new FormData();
  fd.append('name', name);
  fd.append('category', category);
  fd.append('description', document.getElementById('pDescription').value.trim());
  fd.append('price', price);
  fd.append('unit', document.getElementById('pUnit').value);
  fd.append('stock', stock);
  fd.append('discount', document.getElementById('pDiscount').value || 0);
  fd.append('active', document.getElementById('pActive').checked);

  const existingUrls = uploadedImages.filter(i => i.existing).map(i => i.url);
  fd.append('existingImages', JSON.stringify(existingUrls));
  uploadedImages.filter(i => i.file).forEach(i => fd.append('images', i.file));

  const id = document.getElementById('productId').value;
  const saveBtn = document.getElementById('saveProductBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner dark"></span> Saving...';

  try{
    if(id) await productApi.update(id, fd);
    else await productApi.create(fd);
    showToast(id ? 'Product updated' : 'Product added', 'success');
    closeModal('productModal');
    loadProducts();
  }catch(err){
    handleApiError(err, 'Failed to save product.');
  }finally{
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
  }
});

loadCategories();
loadProducts();
