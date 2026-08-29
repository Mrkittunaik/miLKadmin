/* ============================================================
   ADMIN-LAYOUT — renders sidebar + topbar shell into #admin-app
   Include on every protected page AFTER admin-auth.js.
   Each page must set: document.body.dataset.page = "<nav-key>"
   and have <div id="admin-app"><div id="page-root"></div></div>
============================================================ */

const NAV_ITEMS = [
  { key:'dashboard',      label:'Dashboard',      href:'dashboard.html',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>' },
  { key:'products',       label:'Products',       href:'products.html',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 2h8M9 2v5.2a3 3 0 0 1-.6 1.8L6 12.4A4 4 0 0 0 5 15v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5a4 4 0 0 0-1-2.6l-2.4-3.4A3 3 0 0 1 15 7.2V2"/></svg>' },
  { key:'plans',          label:'Plans',          href:'plans.html',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v3M16 3v3"/></svg>' },
  { key:'coupons',        label:'Coupons',        href:'coupons.html',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6M2 7h20M12 7v13M7 3l5 4 5-4"/></svg>' },
  { key:'orders',         label:'Orders',         href:'orders.html',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 2h6l1 4H8l1-4Z"/><path d="M4 6h16l-1.5 13.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 6Z"/></svg>' },
  { key:'delivery-boys',  label:'Delivery Boys',  href:'delivery-boys.html', badgeKey:'pending',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17H3V6a1 1 0 0 1 1-1h9v12M9 17h6M14 5l4.5 3H14V5ZM19 17h2v-4.5L19 9"/></svg>' },
  { key:'users',          label:'Users',          href:'users.html',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>' },
  { key:'settings',       label:'Settings',       href:'settings.html',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04Z"/></svg>' },
  { key:'reports',        label:'Reports',        href:'reports.html',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18M7 15l4-6 3 3 5-7"/></svg>' },
];

// Which nav items live in the bottom tab bar on mobile; the rest
// (+ Logout) live inside the "More" sheet.
const BOTTOM_NAV_PRIMARY_KEYS = ['dashboard', 'products', 'orders', 'delivery-boys'];

function renderLayout(pageTitle){
  const admin = (typeof getCurrentAdmin === 'function' && getCurrentAdmin()) || { name:'Admin' };
  const initials = (admin.name || 'A').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

  const navHtml = NAV_ITEMS.map(item => `
    <div class="nav-link${document.body.dataset.page === item.key ? ' active' : ''}" data-href="${item.href}">
      ${item.icon}
      <span>${item.label}</span>
      ${item.badgeKey ? `<span class="nav-badge hidden" id="navBadge_${item.badgeKey}"></span>` : ''}
    </div>
  `).join('');

  // ---- Bottom tab bar (mobile) ----
  const primaryItems = NAV_ITEMS.filter(i => BOTTOM_NAV_PRIMARY_KEYS.includes(i.key));
  const moreItems = NAV_ITEMS.filter(i => !BOTTOM_NAV_PRIMARY_KEYS.includes(i.key));
  const currentIsMore = moreItems.some(i => i.key === document.body.dataset.page);

  const bottomNavHtml = primaryItems.map(item => `
    <div class="bnav-item${document.body.dataset.page === item.key ? ' active' : ''}" data-href="${item.href}">
      <span class="bnav-ic">${item.icon}${item.badgeKey ? `<span class="nav-badge hidden" id="navBadgeB_${item.badgeKey}"></span>` : ''}</span>
      <span class="bnav-label">${item.label}</span>
    </div>
  `).join('') + `
    <div class="bnav-item${currentIsMore ? ' active' : ''}" id="bnavMoreBtn">
      <span class="bnav-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></span>
      <span class="bnav-label">More</span>
    </div>
  `;

  const moreSheetHtml = moreItems.map(item => `
    <div class="more-sheet-item${document.body.dataset.page === item.key ? ' active' : ''}" data-href="${item.href}">
      ${item.icon}
      <span>${item.label}</span>
      ${item.badgeKey ? `<span class="nav-badge hidden" id="navBadgeM_${item.badgeKey}"></span>` : ''}
    </div>
  `).join('');

  const shell = `
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <img src="../images/logo.png" alt="Logo" onerror="this.style.display='none'">
        <div class="sidebar-brand-text">
          <div class="sidebar-brand-title">Pakka Doodhwala</div>
          <div class="sidebar-brand-sub">Admin Panel</div>
        </div>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="nav-link" id="logoutBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span>Logout</span>
        </div>
      </div>
    </aside>
    <div class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-toggle" id="menuToggle" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <div class="page-title">${pageTitle}</div>
        </div>
        <div class="topbar-right">
          <div class="admin-chip">
            <div class="admin-avatar">${initials}</div>
            <span class="admin-chip-name">${admin.name || 'Admin'}</span>
          </div>
        </div>
      </header>
      <main class="page-content" id="pageContent"></main>
    </div>

    <nav class="bottom-nav" id="bottomNav">${bottomNavHtml}</nav>

    <div class="more-sheet-backdrop" id="moreSheetBackdrop"></div>
    <div class="more-sheet" id="moreSheet">
      <div class="more-sheet-handle"></div>
      <div class="more-sheet-items">${moreSheetHtml}</div>
      <div class="more-sheet-item more-sheet-logout" id="moreSheetLogout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        <span>Logout</span>
      </div>
    </div>
  `;

  const root = document.getElementById('admin-app');
  root.insertAdjacentHTML('afterbegin', shell);

  // Move any pre-existing page markup into pageContent
  const existingContent = document.getElementById('page-root');
  if(existingContent){
    document.getElementById('pageContent').appendChild(existingContent);
    existingContent.style.display = 'block';
    existingContent.removeAttribute('id');
    existingContent.classList.add('page-root-inner');
  }

  // Nav clicks (sidebar) — plain navigation; the @view-transition
  // CSS rule handles the smooth crossfade automatically.
  document.querySelectorAll('.nav-link[data-href]').forEach(el=>{
    el.addEventListener('click', ()=> location.href = el.dataset.href);
  });
  document.getElementById('logoutBtn').addEventListener('click', ()=>{
    if(typeof logoutAdmin === 'function') logoutAdmin();
  });

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  document.getElementById('menuToggle').addEventListener('click', ()=>{
    sidebar.classList.add('open');
    overlay.classList.add('show');
  });
  overlay.addEventListener('click', ()=>{
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });

  // ---- Bottom nav clicks (tap animation; navigation itself is
  // handled by the native @view-transition crossfade) ----
  document.querySelectorAll('.bnav-item[data-href]').forEach(el=>{
    el.addEventListener('click', ()=>{
      el.classList.add('tapped');
      location.href = el.dataset.href;
    });
  });

  // ---- More sheet open/close ----
  const moreBtn = document.getElementById('bnavMoreBtn');
  const moreSheet = document.getElementById('moreSheet');
  const moreBackdrop = document.getElementById('moreSheetBackdrop');

  function openMoreSheet(){
    moreBackdrop.classList.add('show');
    moreSheet.classList.add('show');
  }
  function closeMoreSheet(){
    moreBackdrop.classList.remove('show');
    moreSheet.classList.remove('show');
  }

  moreBtn.addEventListener('click', ()=>{
    moreBtn.classList.add('tapped');
    setTimeout(()=> moreBtn.classList.remove('tapped'), 180);
    openMoreSheet();
  });
  moreBackdrop.addEventListener('click', closeMoreSheet);

  document.querySelectorAll('.more-sheet-item[data-href]').forEach(el=>{
    el.addEventListener('click', ()=>{
      el.classList.add('tapped');
      location.href = el.dataset.href;
    });
  });
  document.getElementById('moreSheetLogout').addEventListener('click', ()=>{
    closeMoreSheet();
    if(typeof logoutAdmin === 'function') logoutAdmin();
  });
}

function setNavBadge(key, count){
  ['navBadge_', 'navBadgeB_', 'navBadgeM_'].forEach(prefix=>{
    const el = document.getElementById(prefix + key);
    if(!el) return;
    if(count > 0){
      el.textContent = count > 99 ? '99+' : count;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}
