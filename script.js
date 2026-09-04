(function(){
  "use strict";

  // Belt-and-braces block on Chrome's native pull-to-refresh: if a touch
  // starts while already scrolled to the very top and drags downward,
  // swallow it instead of letting the browser reload the page.
  (function killPullToRefresh(){
    let startY = 0;
    document.addEventListener('touchstart', (e)=>{ startY = e.touches[0].clientY; }, {passive:true});
    document.addEventListener('touchmove', (e)=>{
      const scroller = e.target.closest('.screen, .sheet');
      const atTop = !scroller || scroller.scrollTop <= 0;
      const draggingDown = e.touches[0].clientY - startY > 0;
      if(atTop && draggingDown){ e.preventDefault(); }
    }, {passive:false});
  })();

  /* ============================================================
     DATA MODEL (in-memory demo store — replace with real API calls)
     ============================================================ */
  let products = [
    {id:'p1', name:'Full Cream Milk', unit:'500ml', category:'milk', price:32, mrp:36, stock:8, desc:'Farm fresh full cream milk, pasteurized daily.', available:true, featured:true, sold:412, img:null},
    {id:'p2', name:'Toned Milk', unit:'1L', category:'milk', price:54, mrp:58, stock:120, desc:'Toned milk, low fat, high protein.', available:true, featured:true, sold:389, img:null},
    {id:'p3', name:'Fresh Curd', unit:'400g', category:'curd', price:40, mrp:44, stock:0, desc:'Thick, creamy curd made fresh every morning.', available:true, featured:false, sold:201, img:null},
    {id:'p4', name:'Paneer', unit:'200g', category:'curd', price:80, mrp:90, stock:35, desc:'Soft paneer cubes, made from full cream milk.', available:true, featured:false, sold:156, img:null},
    {id:'p5', name:'Pure Ghee', unit:'500ml', category:'ghee', price:320, mrp:350, stock:22, desc:'Traditional bilona-method cow ghee.', available:true, featured:true, sold:98, img:null},
    {id:'p6', name:'Table Butter', unit:'100g', category:'ghee', price:52, mrp:56, stock:60, desc:'Creamy salted butter.', available:false, featured:false, sold:64, img:null},
    {id:'p7', name:'Brown Bread', unit:'400g', category:'bread', price:45, mrp:48, stock:14, desc:'Whole wheat brown bread, baked fresh.', available:true, featured:false, sold:77, img:null},
    {id:'p8', name:'Farm Eggs', unit:'6 pcs', category:'bread', price:60, mrp:65, stock:9, desc:'Free-range farm eggs.', available:true, featured:false, sold:143, img:null}
  ];

  let deliveryBoys = [
    {id:'d1', name:'Rajesh Kumar', phone:'+91 98765 43210', area:'Kittu Nagar', status:'pending', joined:'2 days ago', deliveries:0, rating:null, vehicle:'Bike - MH12 AB 1234'},
    {id:'d2', name:'Suresh Yadav', phone:'+91 98765 11122', area:'Model Town', status:'pending', joined:'1 day ago', deliveries:0, rating:null, vehicle:'Bike - MH12 CD 5678'},
    {id:'d3', name:'Amit Sharma', phone:'+91 98765 33445', area:'Civil Lines', status:'pending', joined:'5 hours ago', deliveries:0, rating:null, vehicle:'Bicycle'},
    {id:'d4', name:'Vikram Singh', phone:'+91 91234 55667', area:'Kittu Nagar', status:'approved', joined:'4 months ago', deliveries:842, rating:4.8, vehicle:'Bike - MH12 EF 9012'},
    {id:'d5', name:'Manoj Verma', phone:'+91 91234 77889', area:'Sadar Bazaar', status:'approved', joined:'8 months ago', deliveries:1204, rating:4.6, vehicle:'Bike - MH12 GH 3456'},
    {id:'d6', name:'Deepak Rao', phone:'+91 91234 99001', area:'Model Town', status:'suspended', joined:'6 months ago', deliveries:390, rating:3.2, vehicle:'Bike - MH12 IJ 7890'},
    {id:'d7', name:'Sanjay Patil', phone:'+91 91234 22334', area:'Civil Lines', status:'rejected', joined:'1 week ago', deliveries:0, rating:null, vehicle:'Bike - MH12 KL 2345'}
  ];

  let orders = [
    {id:'PD1042', customer:'Neha Joshi', phone:'+91 90000 11111', address:'B-204, Kittu Nagar', items:[{name:'Full Cream Milk 500ml',qty:2,price:32},{name:'Fresh Curd 400g',qty:1,price:40}], total:104, status:'placed', date:'Today, 7:12 AM', assigned:null},
    {id:'PD1041', customer:'Rohit Mehra', phone:'+91 90000 22222', address:'12, Model Town', items:[{name:'Toned Milk 1L',qty:1,price:54},{name:'Paneer 200g',qty:1,price:80}], total:134, status:'preparing', date:'Today, 6:58 AM', assigned:null},
    {id:'PD1040', customer:'Kavita Rao', phone:'+91 90000 33333', address:'45, Sadar Bazaar', items:[{name:'Pure Ghee 500ml',qty:1,price:320}], total:320, status:'out', date:'Today, 6:40 AM', assigned:'d4'},
    {id:'PD1039', customer:'Arjun Das', phone:'+91 90000 44444', address:'7, Civil Lines', items:[{name:'Farm Eggs 6pcs',qty:2,price:60},{name:'Brown Bread 400g',qty:1,price:45}], total:165, status:'delivered', date:'Yesterday, 8:02 PM', assigned:'d5'},
    {id:'PD1038', customer:'Priya Nair', phone:'+91 90000 55555', address:'B-204, Kittu Nagar', items:[{name:'Full Cream Milk 500ml',qty:4,price:32}], total:128, status:'delivered', date:'Yesterday, 7:15 PM', assigned:'d4'},
    {id:'PD1037', customer:'Sanya Kapoor', phone:'+91 90000 66666', address:'21, Model Town', items:[{name:'Table Butter 100g',qty:1,price:52}], total:52, status:'cancelled', date:'Yesterday, 5:30 PM', assigned:null}
  ];

  let users = [
    {id:'u1', name:'Neha Joshi', phone:'+91 90000 11111', joined:'Aug 2024', orders:42, status:'active'},
    {id:'u2', name:'Rohit Mehra', phone:'+91 90000 22222', joined:'Jan 2025', orders:18, status:'active'},
    {id:'u3', name:'Kavita Rao', phone:'+91 90000 33333', joined:'2 days ago', orders:1, status:'new'},
    {id:'u4', name:'Arjun Das', phone:'+91 90000 44444', joined:'Mar 2024', orders:96, status:'active'},
    {id:'u5', name:'Priya Nair', phone:'+91 90000 55555', joined:'5 days ago', orders:2, status:'new'},
    {id:'u6', name:'Sanya Kapoor', phone:'+91 90000 66666', joined:'Jun 2023', orders:5, status:'blocked'}
  ];

  const statusLabel = {placed:'Placed', preparing:'Preparing', out:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled'};
  const catLabel = {milk:'Milk', curd:'Curd & Paneer', ghee:'Ghee & Butter', bread:'Bread & Eggs'};

  /* ---------- PLANS ---------- */
  const qtyLabel = {half:'0.5L', one:'1L', two:'2L'};
  const durLabel = {weekly:'Weekly', monthly:'Monthly', sixmonth:'6 Month'};
  const durDays = {weekly:7, monthly:30, sixmonth:180};

  let plans = [
    {id:'pl1', name:'Weekly Starter', duration:'weekly', qty:'one', slot:'morning', price:378, subs:24},
    {id:'pl2', name:'Monthly Regular', duration:'monthly', qty:'one', slot:'morning', price:1560, subs:186},
    {id:'pl3', name:'Monthly Family Pack', duration:'monthly', qty:'two', slot:'morning', price:3060, subs:94},
    {id:'pl4', name:'Half Litre Evening', duration:'weekly', qty:'half', slot:'evening', price:196, subs:31},
    {id:'pl5', name:'6 Month Saver', duration:'sixmonth', qty:'one', slot:'morning', price:9000, subs:58}
  ];

  // customer subscriptions: preset plan OR custom per-weekday qty; drives calendar generation
  let subscriptions = [
    {id:'s1', customer:'Neha Joshi', address:'B-204, Kittu Nagar', planId:'pl2', custom:null, slot:'morning', startDate:'2026-08-01', active:true},
    {id:'s2', customer:'Rohit Mehra', address:'12, Model Town', planId:'pl3', custom:null, slot:'morning', startDate:'2026-08-05', active:true},
    {id:'s3', customer:'Kavita Rao', address:'45, Sadar Bazaar', planId:null, custom:{mon:'one',tue:'half',wed:'one',thu:'half',fri:'one',sat:'two',sun:'none'}, slot:'evening', startDate:'2026-08-10', active:true},
    {id:'s4', customer:'Arjun Das', address:'7, Civil Lines', planId:'pl1', custom:null, slot:'morning', startDate:'2026-08-24', active:true},
    {id:'s5', customer:'Priya Nair', address:'B-204, Kittu Nagar', planId:'pl4', custom:null, slot:'evening', startDate:'2026-08-15', active:true}
  ];

  const weekdayKeys = ['sun','mon','tue','wed','thu','fri','sat'];

  // returns litres qty ('half'|'one'|'two'|null) for a subscription on a given Date
  function subQtyOnDate(sub, date){
    if(!sub.active) return null;
    if(date < new Date(sub.startDate)) return null;
    if(sub.custom){
      const key = weekdayKeys[date.getDay()];
      const q = sub.custom[key];
      return (q && q!=='none') ? q : null;
    }
    const plan = plans.find(p=>p.id===sub.planId);
    return plan ? plan.qty : null;
  }

  // build the list of deliveries scheduled for a given Date across all subscriptions
  function deliveriesOnDate(date){
    const list = [];
    subscriptions.forEach(sub=>{
      const q = subQtyOnDate(sub, date);
      if(q) list.push({sub, qty:q, slot:sub.slot});
    });
    return list;
  }

  /* ---------- ZONES (auto-cluster) ---------- */
  const zoneDefs = [
    {name:'Kittu Nagar & Model Town', color:'#4CAF6D', areas:['Kittu Nagar','Model Town']},
    {name:'Civil Lines & Sadar Bazaar', color:'#3B82C4', areas:['Civil Lines','Sadar Bazaar']}
  ];
  function mapUrl(address){
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
  }
  function mapLinkHtml(address){
    if(!address) return '';
    return `<a href="${mapUrl(address)}" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:var(--green-dim); margin-top:4px; text-decoration:none;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>${address}</a>`;
  }
  function areaOf(address){
    const found = zoneDefs.flatMap(z=>z.areas).find(a=>address.includes(a));
    return found || 'Unassigned';
  }
  function zoneOf(address){
    return zoneDefs.find(z=>z.areas.some(a=>address.includes(a)))?.name || 'Unassigned';
  }

  /* ---------- COUPONS ---------- */
  let coupons = [
    {id:'c1', code:'WELCOME50', type:'percent', value:50, minOrder:99, limit:1, used:212, expiry:'2026-12-31', desc:'50% off on your first order', active:true},
    {id:'c2', code:'FLAT20', type:'flat', value:20, minOrder:199, limit:500, used:340, expiry:'2026-09-30', desc:'Flat ₹20 off on orders above ₹199', active:true},
    {id:'c3', code:'MILK10', type:'percent', value:10, minOrder:0, limit:1000, used:88, expiry:'2026-10-15', desc:'10% off on all dairy products', active:true},
    {id:'c4', code:'RAKHI100', type:'flat', value:100, minOrder:499, limit:200, used:200, expiry:'2026-08-30', desc:'Rakhi special flat ₹100 off', active:false}
  ];

  /* ---------- BANNERS ---------- */
  let banners = [
    {id:'bn1', title:'Monsoon Milk Fest', subtitle:'Flat 20% off on all dairy this week', color:'#FDC202', link:'coupons', active:true},
    {id:'bn2', title:'Try our Fresh Paneer', subtitle:'Made daily, delivered before 7 AM', color:'#4CAF6D', link:'products', active:true},
    {id:'bn3', title:'Subscribe & Save', subtitle:'Monthly plans starting ₹378/week', color:'#3B82C4', link:'plans', active:false}
  ];

  /* ---------- CATEGORIES ---------- */
  let categories = [
    {id:'cat1', key:'milk', name:'Milk', icon:'🥛', active:true},
    {id:'cat2', key:'curd', name:'Curd & Paneer', icon:'🧀', active:true},
    {id:'cat3', key:'ghee', name:'Ghee & Butter', icon:'🧈', active:true},
    {id:'cat4', key:'bread', name:'Bread & Eggs', icon:'🍞', active:true}
  ];

  /* ---------- STAFF ---------- */
  const roleLabel = {superadmin:'Super Admin', manager:'Manager', support:'Support'};
  let staff = [
    {id:'st1', name:'Rahul Kittu', contact:'admin@pakkadoodhwala.in', role:'superadmin', active:true},
    {id:'st2', name:'Sneha Kulkarni', contact:'sneha@pakkadoodhwala.in', role:'manager', active:true},
    {id:'st3', name:'Imran Shaikh', contact:'+91 98220 11223', role:'support', active:true},
    {id:'st4', name:'Anjali Deshmukh', contact:'anjali@pakkadoodhwala.in', role:'manager', active:false}
  ];

  /* ---------- REPORTS ---------- */
  const reportTypes = [
    {id:'rep-sales', name:'Sales Report', desc:'All orders with amount, status and payment mode.'},
    {id:'rep-inventory', name:'Inventory Report', desc:'Current stock levels across all products.'},
    {id:'rep-delivery', name:'Delivery Report', desc:'Rider-wise delivery counts and ratings.'},
    {id:'rep-subs', name:'Subscriptions Report', desc:'Active subscriptions with plan and schedule.'},
    {id:'rep-coupons', name:'Coupon Usage Report', desc:'Redemption counts for every coupon.'}
  ];
  let reportHistory = [
    {name:'Sales Report', date:'2 days ago', rows:412},
    {name:'Delivery Report', date:'6 days ago', rows:1204}
  ];

  let currentOrderFilter = 'all';
  let currentProdFilter = 'all';
  let currentDbFilter = 'all';
  let currentUserFilter = 'all';
  let currentPmFilter = 'all';
  let editingProductId = null;
  let editingPlanId = null;
  let editingCouponId = null;
  let editingBannerId = null;
  let editingCategoryId = null;
  let editingStaffId = null;
  let currentCouponFilter = 'all';
  let activeOrderId = null;
  let activeDbId = null;
  let activeUserId = null;
  let pendingImages = [];
  let calCurrentMonth = new Date(2026, 7, 1); // August 2026
  let calSelectedDate = new Date(2026, 7, 29);
  let planUsesCustom = false;

  /* ============================================================
     UTILITIES
     ============================================================ */
  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.from(document.querySelectorAll(sel)); }
  function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }

  /* small inline icon glyphs (Feather-style, matches rest of the UI) — replaces emoji */
  const ICON_CHECK = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICON_CROSS = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const ICON_STAR = '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:-1px;"><path d="M12 2.5l3.09 6.26 6.91 1-5 4.87 1.18 6.88L12 17.9l-6.18 3.25L7 14.63l-5-4.87 6.91-1z"/></svg>';
  const ICON_MORNING = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:3px;"><circle cx="12" cy="17" r="4"/><path d="M12 3v2M4.2 10.2l1.4 1.4M2 17h2M20 17h2M18.4 11.6l1.4-1.4M12 17h.01"/><path d="M5 21h14"/></svg>';
  const ICON_EVENING = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:3px;"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

  function showToast(msg){
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>t.classList.remove('show'), 2200);
  }

  function openSheet(id){ $(id).classList.add('show'); }
  function closeSheet(id){ $(id).classList.remove('show'); }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  function goto(screenName){
    $all('.screen').forEach(s=>s.classList.remove('active'));
    const target = $('#screen-' + screenName);
    if(target) target.classList.add('active');
    $all('.nav-item[data-screen]').forEach(n=>{
      n.classList.toggle('active', n.dataset.screen === screenName);
    });
    const titles = {
      dashboard:['Dashboard','All systems live'],
      orders:['Orders','Manage all orders'],
      products:['Products','Catalog management'],
      delivery:['Delivery Partners','Riders & approvals'],
      users:['Users','Customer accounts'],
      paymgr:['Payment Manager','Subscriber billing & renewals'],
      analytics:['Analytics','Business insights'],
      plans:['Subscription Plans','Weekly, monthly & custom'],
      calendar:['Delivery Calendar','Daily delivery schedule'],
      zones:['Delivery Zones','Auto-clustered routes'],
      more:['More','Settings & tools'],
      coupons:['Coupons & Offers','Discounts and promotions'],
      banners:['Home Banners','Customer app home screen'],
      categories:['Categories','Product category management'],
      payments:['Payments & Payouts','Settlements and rider payouts'],
      reports:['Reports & Exports','Download business reports'],
      staff:['Staff & Roles','Admin team & permissions']
    };
    if(titles[screenName]){
      $('#topbarTitle').textContent = titles[screenName][0];
      $('#topbarSub').textContent = titles[screenName][1];
    }
    $('#searchRow').style.display = (screenName==='orders'||screenName==='products'||screenName==='users'||screenName==='delivery'||screenName==='paymgr') ? 'flex' : 'none';
    if(screenName==='calendar'){
      $('#calMonthView').style.display = 'block';
      $('#calDayView').style.display = 'none';
    }
    window.scrollTo(0,0);
    renderAll();
  }

  $all('.nav-item[data-screen]').forEach(item=>{
    item.addEventListener('click', ()=>goto(item.dataset.screen));
  });

  $all('[data-goto]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const screenName = el.dataset.goto;
      const knownScreens = ['dashboard','orders','products','delivery','users','paymgr','analytics','plans','calendar','zones','more','coupons','banners','categories','payments','reports','staff'];
      if(knownScreens.includes(screenName)){
        goto(screenName);
        if(el.dataset.filter){
          setTimeout(()=>applyQuickFilter(screenName, el.dataset.filter), 50);
        }
        if(el.dataset.action === 'add-product'){
          setTimeout(()=>openProductSheet(null), 200);
        }
      } else {
        openGenericSheet(screenName);
      }
    });
  });

  function applyQuickFilter(screenName, filter){
    if(screenName === 'delivery'){
      currentDbFilter = filter;
      $all('#dbChips .chip').forEach(c=>c.classList.toggle('active', c.dataset.dbstatus===filter));
      renderDeliveryBoys();
    } else if(screenName === 'orders'){
      currentOrderFilter = filter;
      $all('#orderChips .chip').forEach(c=>c.classList.toggle('active', c.dataset.status===filter));
      renderOrders();
    }
  }

  function openGenericSheet(name){
    const map = {
      'delivery-zones': ['Delivery Zones', 'Define serviceable pin codes and delivery hub boundaries: Kittu Nagar, Model Town, Civil Lines, Sadar Bazaar.']
    };
    const [title, body] = map[name] || ['Section', 'This section is under construction.'];
    $('#genericSheetTitle').textContent = title;
    $('#genericSheetBody').textContent = body;
    openSheet('#genericSheetBackdrop');
  }
  $('#genericSheetCloseBtn').addEventListener('click', ()=>closeSheet('#genericSheetBackdrop'));
  $('#genericSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#genericSheetBackdrop'); });

  /* ============================================================
     LOGIN
     ============================================================ */
  /* ------------------------------------------------------------
     TEMPORARY DEMO CREDENTIALS — replace with real backend/Firebase
     auth before going live. This is a client-side check only and
     is NOT secure (anyone can read it from the page source).
     ------------------------------------------------------------ */
  const DEMO_ADMIN_EMAIL = 'admin@pakkadoodhwala.in';
  const DEMO_ADMIN_PASS  = 'admin@123';
  const SESSION_KEY = 'pd_admin_session';

  function enterApp(email, opts){
    opts = opts || {};
    $('#screen-login').classList.remove('active');
    $('#screen-login').style.display = 'none';
    $('#topbar').style.display = 'block';
    $('#bottomnav').style.display = 'flex';
    $('#adminEmailLabel').textContent = email;
    goto('dashboard');
    if(!opts.silent) showToast('Welcome back, Admin!');
  }

  function saveSession(email){
    try{ localStorage.setItem(SESSION_KEY, JSON.stringify({email, at: Date.now()})); }catch(e){}
  }
  function clearSession(){
    try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
  }
  function loadSession(){
    try{
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  $('#loginBtn').addEventListener('click', ()=>{
    const email = $('#loginEmail').value.trim();
    const pass = $('#loginPass').value.trim();
    const errEl = $('#loginError');

    if(!email || !pass){ showToast('Enter email & password'); return; }

    if(email.toLowerCase() !== DEMO_ADMIN_EMAIL.toLowerCase() || pass !== DEMO_ADMIN_PASS){
      errEl.style.display = 'block';
      showToast('Invalid email or password');
      return;
    }

    errEl.style.display = 'none';
    saveSession(email);
    enterApp(email);
  });

  // Allow pressing Enter in either field to submit
  $('#loginEmail').addEventListener('keydown', e=>{ if(e.key==='Enter') $('#loginBtn').click(); });
  $('#loginPass').addEventListener('keydown', e=>{ if(e.key==='Enter') $('#loginBtn').click(); });

  /* ============================================================
     DASHBOARD RENDER
     ============================================================ */
  function renderDashboard(){
    const pendingRiders = deliveryBoys.filter(d=>d.status==='pending');
    $('#statRiders').textContent = deliveryBoys.filter(d=>d.status==='approved').length;

    const todayOrders = orders.filter(o=>o.date.startsWith('Today'));
    const deliveredToday = todayOrders.filter(o=>o.status==='delivered').length;
    const totalDelivered = orders.filter(o=>o.status==='delivered').length;
    if($('#statDeliveredToday')) $('#statDeliveredToday').textContent = deliveredToday;
    if($('#statOrdersTodayTrend')) $('#statOrdersTodayTrend').textContent = `of ${todayOrders.length} orders today`;
    if($('#statTotalDelivered')) $('#statTotalDelivered').textContent = totalDelivered;

    const recWrap = $('#dashRecentOrders');
    recWrap.innerHTML = '';
    orders.slice(0,3).forEach(o=>recWrap.appendChild(buildOrderCard(o)));

    // Pending approvals rendered after recent orders (moved lower per admin preference)
    const pendWrap = $('#dashPendingList');
    pendWrap.innerHTML = '';
    if(pendingRiders.length === 0){
      pendWrap.innerHTML = '<div class="empty-state" style="padding:24px 10px;"><div class="empty-state-sub"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px; color:var(--green-dim);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10-3-3"/></svg>No pending approvals right now</div></div>';
    } else {
      pendingRiders.slice(0,3).forEach(d=>pendWrap.appendChild(buildDbCard(d)));
    }
  }

  /* ============================================================
     ORDERS
     ============================================================ */
  function buildOrderCard(o){
    const div = document.createElement('div');
    div.className = 'order-card';
    const itemsStr = o.items.map(i=>`${i.qty}× ${i.name}`).join(', ');
    const rider = o.assigned ? deliveryBoys.find(d=>d.id===o.assigned) : null;
    div.innerHTML = `
      <div class="order-top">
        <div>
          <div class="order-id">#${o.id}</div>
          <div class="order-date">${o.date} &middot; ${o.customer}</div>
        </div>
        <div class="order-status ${o.status}">${statusLabel[o.status]}</div>
      </div>
      <div class="order-items">${itemsStr}</div>
      ${rider ? `<div class="order-assign"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7z"/></svg> ${rider.name}</div>` : ''}
      <div class="order-bottom" style="margin-top:10px;">
        <b>₹${o.total}</b>
        <div class="order-link">Manage →</div>
      </div>
    `;
    div.addEventListener('click', ()=>openOrderSheet(o.id));
    return div;
  }

  function renderOrders(){
    const list = $('#ordersList');
    list.innerHTML = '';
    const filtered = currentOrderFilter === 'all' ? orders : orders.filter(o=>o.status===currentOrderFilter);
    $('#orderCount').textContent = filtered.length;
    if(filtered.length === 0){
      list.innerHTML = '<div class="empty-state"><div class="empty-state-title">No orders here</div><div class="empty-state-sub">Try a different filter</div></div>';
      return;
    }
    filtered.forEach(o=>list.appendChild(buildOrderCard(o)));
  }

  $all('#orderChips .chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      $all('#orderChips .chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      currentOrderFilter = chip.dataset.status;
      renderOrders();
    });
  });

  function openOrderSheet(orderId){
    activeOrderId = orderId;
    const o = orders.find(x=>x.id===orderId);
    if(!o) return;
    $('#orderSheetTitle').textContent = 'Order #' + o.id;
    $('#orderCustomerInfo').innerHTML = `
      <div style="font-weight:800; font-size:13.5px;">${o.customer}</div>
      <div style="font-size:11.5px; color:var(--muted); margin-top:3px;">${o.phone}</div>
      <div style="font-size:11.5px; color:var(--muted); margin-top:3px;">${o.address}</div>
      ${mapLinkHtml(o.address)}
    `;
    $('#orderItemsInfo').innerHTML = o.items.map(i=>`
      <div style="display:flex; justify-content:space-between; font-size:12.5px; padding:5px 0;">
        <span>${i.qty}× ${i.name}</span><b>₹${i.qty*i.price}</b>
      </div>`).join('') + `<div style="display:flex; justify-content:space-between; font-size:13.5px; font-weight:800; border-top:1px dashed var(--line); margin-top:6px; padding-top:8px;"><span>Total</span><span>₹${o.total}</span></div>`;

    const steps = ['placed','preparing','out','delivered'];
    const curIdx = steps.indexOf(o.status);
    const tlLabels = {placed:'Order Placed', preparing:'Preparing', out:'Out for Delivery', delivered:'Delivered'};
    let tlHtml = '';
    if(o.status === 'cancelled'){
      tlHtml = `<div class="tl-step done"><div class="tl-dot" style="background:var(--danger); color:#fff;">${ICON_CROSS}</div><div><div class="tl-label">Order Cancelled</div><div class="tl-time">${o.date}</div></div></div>`;
    } else {
      steps.forEach((s,idx)=>{
        const cls = idx < curIdx ? 'done' : (idx === curIdx ? 'current' : '');
        tlHtml += `<div class="tl-step ${cls}"><div class="tl-dot">${idx<curIdx?ICON_CHECK:(idx+1)}</div><div><div class="tl-label">${tlLabels[s]}</div><div class="tl-time">${idx<=curIdx? o.date : 'Pending'}</div></div></div>`;
      });
    }
    $('#orderTimeline').innerHTML = tlHtml;

    const assignSel = $('#orderAssignSelect');
    assignSel.innerHTML = '<option value="">— Not Assigned —</option>' +
      deliveryBoys.filter(d=>d.status==='approved').map(d=>`<option value="${d.id}" ${o.assigned===d.id?'selected':''}>${d.name} (${d.area})</option>`).join('');

    $('#orderStatusSelect').value = o.status;
    openSheet('#orderSheetBackdrop');
  }

  $('#orderUpdateBtn').addEventListener('click', ()=>{
    const o = orders.find(x=>x.id===activeOrderId);
    if(!o) return;
    o.status = $('#orderStatusSelect').value;
    const assignVal = $('#orderAssignSelect').value;
    o.assigned = assignVal || null;
    closeSheet('#orderSheetBackdrop');
    renderAll();
    showToast(`Order #${o.id} updated`);
  });
  $('#orderCancelBtn').addEventListener('click', ()=>closeSheet('#orderSheetBackdrop'));
  $('#orderSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#orderSheetBackdrop'); });

  /* ============================================================
     PRODUCTS
     ============================================================ */
  function stockBadge(p){
    if(p.stock <= 0) return '<span class="stock-badge out">Out of Stock</span>';
    if(p.stock <= 15) return '<span class="stock-badge low">Low Stock</span>';
    return '<span class="stock-badge in">In Stock</span>';
  }

  function buildProductCard(p){
    const div = document.createElement('div');
    div.className = 'prod-admin-card';
    div.innerHTML = `
      <div class="prod-admin-thumb">
        ${stockBadge(p)}
        ${p.img ? `<img src="${p.img}" alt="${p.name}">` : `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.6"><path d="M4 16l4.5-6 4 5 3-4L20 16"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>`}
      </div>
      <div class="prod-admin-body">
        <div class="prod-admin-name">${p.name}</div>
        <div class="prod-admin-meta">${p.unit} &middot; ${catLabel[p.category]}${!p.available?' &middot; <span style="color:var(--danger);">Hidden</span>':''}</div>
        <div class="prod-admin-bottom">
          <div class="prod-admin-price">₹${p.price}</div>
          <button class="prod-admin-edit" data-edit="${p.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
          </button>
        </div>
      </div>
    `;
    div.querySelector('[data-edit]').addEventListener('click', (e)=>{
      e.stopPropagation();
      openProductSheet(p.id);
    });
    return div;
  }

  function renderProducts(){
    const grid = $('#prodGrid');
    grid.innerHTML = '';
    const filtered = currentProdFilter === 'all' ? products : products.filter(p=>p.category===currentProdFilter);
    $('#prodCount').textContent = filtered.length;
    const lowCount = products.filter(p=>p.stock>0 && p.stock<=15).length;
    const outCount = products.filter(p=>p.stock<=0).length;
    const warnIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:2px;"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>';
    const okIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:2px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10-3-3"/></svg>';
    $('#lowStockLink').innerHTML = (lowCount+outCount) > 0 ? `${warnIcon}${lowCount} low, ${outCount} out` : `${okIcon}Stock healthy`;
    if(filtered.length === 0){
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-title">No products</div><div class="empty-state-sub">Tap + to add your first product</div></div>';
      return;
    }
    filtered.forEach(p=>grid.appendChild(buildProductCard(p)));
  }

  $all('#prodChips .chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      $all('#prodChips .chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      currentProdFilter = chip.dataset.cat;
      renderProducts();
    });
  });

  function resetProductForm(){
    $('#pfName').value = '';
    $('#pfCategory').value = 'milk';
    $('#pfUnit').value = '';
    $('#pfPrice').value = '';
    $('#pfMrp').value = '';
    $('#pfStock').value = '';
    $('#pfDesc').value = '';
    $('#pfAvailToggle').classList.add('on');
    $('#pfFeaturedToggle').classList.remove('on');
    pendingImages = [];
    renderImgSlots();
  }

  function renderImgSlots(){
    const wrap = $('#imgUpload');
    Array.from(wrap.querySelectorAll('.img-slot:not(#imgAddSlot)')).forEach(el=>el.remove());
    pendingImages.forEach((src, idx)=>{
      const slot = document.createElement('div');
      slot.className = 'img-slot';
      slot.innerHTML = `<img src="${src}"><div class="rm" data-rm="${idx}">${ICON_CROSS}</div>`;
      slot.querySelector('.rm').addEventListener('click', (e)=>{
        e.stopPropagation();
        pendingImages.splice(idx,1);
        renderImgSlots();
      });
      wrap.insertBefore(slot, $('#imgAddSlot'));
    });
  }

  $('#imgFileInput').addEventListener('change', (e)=>{
    const files = Array.from(e.target.files || []);
    files.forEach(file=>{
      const reader = new FileReader();
      reader.onload = ev=>{
        pendingImages.push(ev.target.result);
        renderImgSlots();
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });

  function openProductSheet(productId){
    editingProductId = productId;
    if(productId){
      const p = products.find(x=>x.id===productId);
      $('#productSheetTitle').textContent = 'Edit Product';
      $('#pfName').value = p.name;
      $('#pfCategory').value = p.category;
      $('#pfUnit').value = p.unit;
      $('#pfPrice').value = p.price;
      $('#pfMrp').value = p.mrp || '';
      $('#pfStock').value = p.stock;
      $('#pfDesc').value = p.desc || '';
      $('#pfAvailToggle').classList.toggle('on', p.available);
      $('#pfFeaturedToggle').classList.toggle('on', p.featured);
      pendingImages = p.img ? [p.img] : [];
      renderImgSlots();
      $('#pfDeleteBtn').style.display = 'block';
    } else {
      $('#productSheetTitle').textContent = 'Add Product';
      resetProductForm();
      $('#pfDeleteBtn').style.display = 'none';
    }
    openSheet('#productSheetBackdrop');
  }

  $('#fabAddProduct').addEventListener('click', ()=>openProductSheet(null));
  $('#pfCancelBtn').addEventListener('click', ()=>closeSheet('#productSheetBackdrop'));
  $('#productSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#productSheetBackdrop'); });
  $('#pfAvailToggle').addEventListener('click', ()=>$('#pfAvailToggle').classList.toggle('on'));
  $('#pfFeaturedToggle').addEventListener('click', ()=>$('#pfFeaturedToggle').classList.toggle('on'));

  $('#pfSaveBtn').addEventListener('click', ()=>{
    const name = $('#pfName').value.trim();
    const price = parseFloat($('#pfPrice').value);
    if(!name){ showToast('Enter a product name'); return; }
    if(!price || price<=0){ showToast('Enter a valid price'); return; }

    const data = {
      name,
      category: $('#pfCategory').value,
      unit: $('#pfUnit').value.trim() || '-',
      price,
      mrp: parseFloat($('#pfMrp').value) || null,
      stock: parseInt($('#pfStock').value) || 0,
      desc: $('#pfDesc').value.trim(),
      available: $('#pfAvailToggle').classList.contains('on'),
      featured: $('#pfFeaturedToggle').classList.contains('on'),
      img: pendingImages[0] || null
    };

    if(editingProductId){
      const p = products.find(x=>x.id===editingProductId);
      Object.assign(p, data);
      showToast('Product updated');
    } else {
      data.id = 'p' + (Date.now());
      data.sold = 0;
      products.unshift(data);
      showToast('Product added');
    }
    closeSheet('#productSheetBackdrop');
    renderProducts();
    renderDashboard();
  });

  $('#pfDeleteBtn').addEventListener('click', ()=>{
    if(!editingProductId) return;
    products = products.filter(p=>p.id!==editingProductId);
    closeSheet('#productSheetBackdrop');
    renderProducts();
    showToast('Product deleted');
  });

  /* ============================================================
     DELIVERY BOYS (Riders)
     ============================================================ */
  function buildDbCard(d){
    const div = document.createElement('div');
    div.className = 'list-card db-card';
    let actionsHtml = '';
    if(d.status === 'pending'){
      actionsHtml = `<button class="btn-tiny approve" data-approve="${d.id}">Approve</button><button class="btn-tiny reject" data-reject="${d.id}">Reject</button>`;
    } else if(d.status === 'approved'){
      actionsHtml = `<button class="btn-tiny suspend" data-suspend="${d.id}">Suspend</button><button class="btn-tiny ghost" data-view="${d.id}">View</button>`;
    } else if(d.status === 'suspended'){
      actionsHtml = `<button class="btn-tiny reactivate" data-reactivate="${d.id}">Reactivate</button><button class="btn-tiny ghost" data-view="${d.id}">View</button>`;
    } else if(d.status === 'rejected'){
      actionsHtml = `<button class="btn-tiny reactivate" data-reactivate="${d.id}">Re-approve</button>`;
    }
    div.innerHTML = `
      <div class="db-avatar">${initials(d.name)}</div>
      <div class="db-info">
        <div class="db-name">${d.name}</div>
        <div class="db-meta">${d.area} &middot; ${d.vehicle}</div>
        <div class="db-meta">${d.phone}</div>
        <div class="db-status ${d.status}">${d.status}</div>
      </div>
      <div class="db-actions">${actionsHtml}</div>
    `;
    div.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click', (e)=>{e.stopPropagation(); openDbSheet(d.id);}));
    div.addEventListener('click', ()=>openDbSheet(d.id));
    div.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(btn.dataset.approve){ setDbStatus(btn.dataset.approve,'approved'); }
        if(btn.dataset.reject){ setDbStatus(btn.dataset.reject,'rejected'); }
        if(btn.dataset.suspend){ setDbStatus(btn.dataset.suspend,'suspended'); }
        if(btn.dataset.reactivate){ setDbStatus(btn.dataset.reactivate,'approved'); }
      });
    });
    return div;
  }

  function setDbStatus(id, status){
    const d = deliveryBoys.find(x=>x.id===id);
    if(!d) return;
    d.status = status;
    const msgs = {approved:'Rider approved', rejected:'Rider rejected', suspended:'Rider suspended', };
    showToast(msgs[status] || 'Rider updated');
    renderAll();
  }

  function renderDeliveryBoys(){
    const list = $('#dbList');
    list.innerHTML = '';
    const filtered = currentDbFilter === 'all' ? deliveryBoys : deliveryBoys.filter(d=>d.status===currentDbFilter);
    $('#dbCount').textContent = filtered.length;
    const pendingCount = deliveryBoys.filter(d=>d.status==='pending').length;
    $('#navDbBadge').style.display = pendingCount>0 ? 'flex' : 'none';
    $('#navDbBadge').textContent = pendingCount;
    if(filtered.length===0){
      list.innerHTML = '<div class="empty-state"><div class="empty-state-title">No riders here</div><div class="empty-state-sub">Try a different filter</div></div>';
      return;
    }
    filtered.forEach(d=>list.appendChild(buildDbCard(d)));
  }

  $all('#dbChips .chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      $all('#dbChips .chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      currentDbFilter = chip.dataset.dbstatus;
      renderDeliveryBoys();
    });
  });

  function buildDriverLivePanel(d){
    if(d.status !== 'approved') return '';
    const assignedToday = orders.filter(o=>o.assigned===d.id && o.date.startsWith('Today'));
    const completed = assignedToday.filter(o=>o.status==='delivered').length;
    const remaining = assignedToday.filter(o=>o.status==='out' || o.status==='preparing' || o.status==='placed').length;
    const loc = d._liveLoc || (d._liveLoc = { top: 30+Math.random()*40, left: 30+Math.random()*40 });
    return `
      <div class="driver-live-panel" id="driverLivePanel-${d.id}">
        <div class="live-badge" style="margin-bottom:10px;"><span class="pulse-dot"></span>Live tracking</div>
        <div class="dlp-row">
          <div class="dlp-stat"><b id="dlpCompleted-${d.id}">${completed}</b><span>Completed today</span></div>
          <div class="dlp-stat"><b id="dlpRemaining-${d.id}">${remaining}</b><span>Remaining</span></div>
        </div>
        <div class="dlp-map" id="dlpMap-${d.id}">
          <div class="dlp-marker" id="dlpMarker-${d.id}" style="top:${loc.top}%; left:${loc.left}%;"></div>
          Live location preview
        </div>
        <div class="dlp-loc-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span id="dlpArea-${d.id}">Near ${d.area}</span>
        </div>
      </div>
    `;
  }

  function openDbSheet(id){
    activeDbId = id;
    const d = deliveryBoys.find(x=>x.id===id);
    if(!d) return;
    $('#dbSheetTitle').textContent = d.name;
    $('#dbSheetBody').innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <div class="db-avatar" style="width:56px;height:56px;font-size:18px;">${initials(d.name)}</div>
        <div>
          <div style="font-weight:800; font-size:14px;">${d.name}</div>
          <div class="db-status ${d.status}" style="margin-top:5px;">${d.status}</div>
        </div>
      </div>
      <div class="field"><label>Phone</label><input type="text" value="${d.phone}" readonly></div>
      <div class="field"><label>Area</label><input type="text" value="${d.area}" readonly></div>
      <div class="field"><label>Vehicle</label><input type="text" value="${d.vehicle}" readonly></div>
      <div class="field-row">
        <div class="field"><label>Total Deliveries</label><input type="text" value="${d.deliveries}" readonly></div>
        <div class="field"><label>Rating</label><input type="text" value="${d.rating ? d.rating+' ★' : '—'}" readonly></div>
      </div>
      <div class="field"><label>Joined</label><input type="text" value="${d.joined}" readonly></div>
      ${buildDriverLivePanel(d)}
    `;
    openSheet('#dbSheetBackdrop');
  }
  $('#dbSheetCloseBtn').addEventListener('click', ()=>closeSheet('#dbSheetBackdrop'));
  $('#dbSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#dbSheetBackdrop'); });

  /* ============================================================
     USERS
     ============================================================ */
  // finds this user's active subscription + resolved plan (preset or custom), and their
  // delivered-order count, so plan changes made in Plans management reflect instantly here
  function userPlanInfo(u){
    const sub = subscriptions.find(s=>s.customer.trim().toLowerCase()===u.name.trim().toLowerCase() && s.active);
    const plan = sub && sub.planId ? plans.find(p=>p.id===sub.planId) : null;
    const delivered = orders.filter(o=>o.customer===u.name && o.status==='delivered').length;
    return {
      sub, plan,
      planLabel: plan ? plan.name : (sub && sub.custom ? 'Custom Plan' : null),
      qtyLabel: plan ? qtyLabel[plan.qty] : null,
      delivered,
      source: sub ? (sub.imported ? 'Imported' : 'Web App') : null
    };
  }

  function buildUserCard(u){
    const div = document.createElement('div');
    div.className = 'list-card user-card';
    const info = userPlanInfo(u);
    div.innerHTML = `
      <div class="user-avatar">${initials(u.name)}</div>
      <div class="user-info">
        <div class="user-name">${u.name}</div>
        <div class="user-meta">${u.phone} &middot; Joined ${u.joined}</div>
        <div class="user-orders">${u.orders} orders placed &middot; ${info.delivered} delivered</div>
        ${info.planLabel ? `<div style="margin-top:4px; display:flex; gap:5px; flex-wrap:wrap;">
            <span class="plan-tag" style="font-size:9.5px; padding:2px 7px;">${info.planLabel}</span>
            ${info.qtyLabel ? `<span class="plan-tag" style="font-size:9.5px; padding:2px 7px;">${info.qtyLabel}/day</span>` : ''}
            <span class="plan-tag" style="font-size:9.5px; padding:2px 7px; opacity:.75;">${info.source}</span>
          </div>` : ''}
      </div>
      ${u.status==='blocked' ? '<div class="db-status rejected">blocked</div>' : (u.status==='new' ? '<div class="db-status pending">new</div>' : '')}
    `;
    div.addEventListener('click', ()=>openUserSheet(u.id));
    return div;
  }

  function renderUsers(){
    const list = $('#usersList');
    list.innerHTML = '';
    const filtered = currentUserFilter === 'all' ? users : users.filter(u=>u.status===currentUserFilter);
    $('#userCount').textContent = filtered.length;
    if(filtered.length===0){
      list.innerHTML = '<div class="empty-state"><div class="empty-state-title">No users here</div><div class="empty-state-sub">Try a different filter</div></div>';
      return;
    }
    filtered.forEach(u=>list.appendChild(buildUserCard(u)));
  }

  $all('#userChips .chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      $all('#userChips .chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      currentUserFilter = chip.dataset.ustatus;
      renderUsers();
    });
  });

  function openUserSheet(id){
    activeUserId = id;
    const u = users.find(x=>x.id===id);
    if(!u) return;
    $('#userSheetTitle').textContent = u.name;
    const userOrders = orders.filter(o=>o.customer===u.name);
    const info = userPlanInfo(u);
    $('#userSheetBody').innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <div class="user-avatar" style="width:56px;height:56px;font-size:18px;">${initials(u.name)}</div>
        <div>
          <div style="font-weight:800; font-size:14px;">${u.name}</div>
          <div style="font-size:12px; color:var(--muted); margin-top:3px;">${u.phone}</div>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Total Orders</label><input type="text" value="${u.orders}" readonly></div>
        <div class="field"><label>Delivered</label><input type="text" value="${info.delivered}" readonly></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Joined</label><input type="text" value="${u.joined}" readonly></div>
        <div class="field"><label>Source</label><input type="text" value="${info.source||'—'}" readonly></div>
      </div>
      ${info.plan || info.sub ? `
      <div class="field"><label>Active Plan</label>
        <div class="list-card" style="margin-bottom:2px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b style="font-size:12.5px;">${info.planLabel}</b>
            ${info.qtyLabel ? `<span class="plan-tag" style="font-size:9.5px;">${info.qtyLabel}/day</span>` : ''}
          </div>
          ${info.plan ? `<div style="font-size:11.5px; color:var(--muted); margin-top:4px;">₹${info.plan.price} &middot; ${durLabel[info.plan.duration]} &middot; ${info.plan.slot==='morning'?'Morning':'Evening'} slot</div>` : ''}
          ${info.sub && info.sub.address ? mapLinkHtml(info.sub.address) : ''}
        </div>
      </div>
      <div class="field"><label>Payment &amp; Billing</label>
        <div class="list-card" style="margin-bottom:2px;">
          ${(()=>{
            const status = subPaymentStatus(info.sub);
            const meta = pmStatusMeta[status];
            const start = new Date(info.sub.startDate);
            const expiry = subExpiryDate(info.sub);
            const price = subPrice(info.sub);
            return `
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <b style="font-size:12.5px;">${price ? '₹'+price : 'Custom billing'}</b>
                <span class="db-status ${meta.cls}" style="margin-top:0;">${meta.label}</span>
              </div>
              <div style="font-size:11.5px; color:var(--muted); margin-top:6px;">Started ${fmtDate(start)}</div>
              <div style="font-size:11.5px; color:var(--muted); margin-top:2px;">${status==='expired' ? 'Ended' : 'Renews / ends'} ${fmtDate(expiry)}</div>
            `;
          })()}
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn-secondary" id="userRenewBtn" style="flex:1;">Renew Plan</button>
          <button class="btn-secondary" id="userReminderBtn" style="flex:1;">Send Reminder</button>
        </div>
      </div>` : `<div class="field"><label>Active Plan</label><div style="font-size:12px; color:var(--muted);">No active subscription plan.</div></div>`}
      <div class="field"><label>Recent Orders</label></div>
      ${userOrders.length ? userOrders.map(o=>`<div class="list-card" style="margin-bottom:8px;"><div style="display:flex; justify-content:space-between;"><b style="font-size:12.5px;">#${o.id}</b><span class="order-status ${o.status}">${statusLabel[o.status]}</span></div><div style="font-size:11.5px; color:var(--muted); margin-top:4px;">${o.date} &middot; ₹${o.total}</div></div>`).join('') : '<div style="font-size:12px; color:var(--muted);">No recent orders on this device.</div>'}
      <button class="btn-danger-outline" id="userBlockBtn" style="margin-top:6px;">${u.status==='blocked'?'Unblock User':'Block User'}</button>
    `;
    openSheet('#userSheetBackdrop');
    $('#userBlockBtn').addEventListener('click', ()=>{
      u.status = u.status==='blocked' ? 'active' : 'blocked';
      showToast(u.status==='blocked' ? 'User blocked' : 'User unblocked');
      closeSheet('#userSheetBackdrop');
      renderUsers();
    });
    const renewBtn = $('#userRenewBtn');
    if(renewBtn) renewBtn.addEventListener('click', ()=>{
      if(!info.sub) return;
      info.sub.startDate = new Date().toISOString().slice(0,10);
      showToast('Plan renewed — new billing cycle started');
      closeSheet('#userSheetBackdrop');
      renderUsers(); renderPaymentManager(); refreshNotifications();
    });
    const reminderBtn = $('#userReminderBtn');
    if(reminderBtn) reminderBtn.addEventListener('click', ()=>{
      showToast(`Payment reminder sent to ${u.name}`);
    });
  }
  $('#userSheetCloseBtn').addEventListener('click', ()=>closeSheet('#userSheetBackdrop'));
  $('#userSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#userSheetBackdrop'); });

  /* ============================================================
     PAYMENT MANAGER — per-user plan billing, renewals, monthly totals
     ============================================================ */
  function subDurationDays(sub){
    if(!sub) return 30;
    const plan = sub.planId ? plans.find(p=>p.id===sub.planId) : null;
    return plan ? durDays[plan.duration] : 30; // custom day-plans billed monthly by default
  }
  function subExpiryDate(sub){
    const start = new Date(sub.startDate);
    const exp = new Date(start);
    exp.setDate(exp.getDate() + subDurationDays(sub));
    return exp;
  }
  function daysBetween(a,b){ return Math.round((b.setHours(0,0,0,0) - a.setHours(0,0,0,0)) / 86400000); }
  function subPaymentStatus(sub){
    if(!sub || !sub.active) return 'none';
    const today = new Date();
    const exp = subExpiryDate(sub);
    const diff = daysBetween(new Date(today), new Date(exp));
    if(diff < 0) return 'expired';
    if(diff <= 3) return 'expiring';
    return 'active';
  }
  function subPrice(sub){
    if(!sub) return 0;
    const plan = sub.planId ? plans.find(p=>p.id===sub.planId) : null;
    return plan ? plan.price : 0; // custom per-weekday plans are billed manually, no fixed price
  }
  function fmtDate(d){
    return d.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
  }
  const pmStatusMeta = {
    active:  {label:'Active',    cls:'approved'},
    expiring:{label:'Expiring Soon', cls:'pending'},
    expired: {label:'Completed', cls:'rejected'},
    none:    {label:'No Plan',   cls:'suspended'}
  };

  // one row per user, resolving their subscription + plan + billing status
  function paymentRecords(){
    return users.map(u=>{
      const sub = subscriptions.find(s=>s.customer.trim().toLowerCase()===u.name.trim().toLowerCase() && s.active);
      const plan = sub && sub.planId ? plans.find(p=>p.id===sub.planId) : null;
      const status = subPaymentStatus(sub);
      return {
        user: u, sub, plan, status,
        price: subPrice(sub),
        planLabel: plan ? plan.name : (sub && sub.custom ? 'Custom Plan' : null),
        start: sub ? new Date(sub.startDate) : null,
        expiry: sub ? subExpiryDate(sub) : null
      };
    });
  }

  // monthly totals: plans that started in the current calendar month count as this month's sales
  function monthlyPaymentStats(){
    const now = new Date();
    const records = paymentRecords();
    const thisMonth = records.filter(r=>r.start && r.start.getMonth()===now.getMonth() && r.start.getFullYear()===now.getFullYear());
    const revenue = thisMonth.reduce((sum,r)=>sum + r.price, 0);
    const activeTotal = records.filter(r=>r.status==='active' || r.status==='expiring').length;
    const expiringCount = records.filter(r=>r.status==='expiring').length;
    const expiredCount = records.filter(r=>r.status==='expired').length;
    return {revenue, buyers: thisMonth.length, activeTotal, expiringCount, expiredCount, records};
  }

  function buildPaymentCard(r){
    const div = document.createElement('div');
    div.className = 'list-card user-card';
    const meta = pmStatusMeta[r.status];
    div.innerHTML = `
      <div class="user-avatar">${initials(r.user.name)}</div>
      <div class="user-info">
        <div class="user-name">${r.user.name}</div>
        <div class="user-meta">${r.user.phone}</div>
        ${r.planLabel ? `
          <div style="font-size:11.5px; color:var(--muted); margin-top:3px;">
            ${r.planLabel}${r.price ? ` &middot; ₹${r.price}` : ''}
          </div>
          <div style="font-size:11px; color:var(--muted); margin-top:2px;">
            ${r.start ? fmtDate(r.start) : '—'} → ${r.expiry ? fmtDate(r.expiry) : '—'}
          </div>
        ` : `<div style="font-size:11.5px; color:var(--muted); margin-top:3px;">No active subscription</div>`}
      </div>
      <div class="db-status ${meta.cls}">${meta.label}</div>
    `;
    div.addEventListener('click', ()=>openUserSheet(r.user.id));
    return div;
  }

  function renderPaymentManager(){
    const stats = monthlyPaymentStats();
    $('#pmRevenueMonth').textContent = '₹' + stats.revenue.toLocaleString('en-IN');
    $('#pmBuyersMonth').textContent = stats.buyers;
    $('#pmActiveTotal').textContent = stats.activeTotal + ' active total';
    $('#pmExpiringCount').textContent = stats.expiringCount;
    $('#pmExpiredCount').textContent = stats.expiredCount;

    let records = stats.records;
    if(currentPmFilter !== 'all'){
      records = records.filter(r=>r.status===currentPmFilter);
    }
    const list = $('#pmList');
    list.innerHTML = '';
    $('#pmCount').textContent = records.length;
    if(records.length===0){
      list.innerHTML = '<div class="empty-state"><div class="empty-state-title">No subscribers here</div><div class="empty-state-sub">Try a different filter</div></div>';
      return;
    }
    records.forEach(r=>list.appendChild(buildPaymentCard(r)));
  }

  $all('#pmChips .chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      $all('#pmChips .chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      currentPmFilter = chip.dataset.pmstatus;
      renderPaymentManager();
    });
  });
  $all('[data-pmfilter]').forEach(card=>{
    card.addEventListener('click', ()=>{
      goto('paymgr');
      const status = card.dataset.pmfilter;
      setTimeout(()=>{
        $all('#pmChips .chip').forEach(c=>c.classList.toggle('active', c.dataset.pmstatus===status));
        currentPmFilter = status;
        renderPaymentManager();
      }, 50);
    });
  });

  /* ============================================================
     NOTIFICATION CENTER — new users, expiring & completed plans
     ============================================================ */
  let notifReadAt = 0; // timestamp; notifications older than this are treated as read

  function buildNotifications(){
    const items = [];
    users.filter(u=>u.status==='new').forEach(u=>{
      items.push({icon:'👤', text:`${u.name} just signed up`, sub:`Joined ${u.joined}`, action:()=>openUserSheet(u.id), key:'new-'+u.id});
    });
    paymentRecords().forEach(r=>{
      if(r.status==='expiring'){
        const days = daysBetween(new Date(), new Date(r.expiry));
        items.push({icon:'⏳', text:`${r.user.name}'s plan expires in ${days} day${days===1?'':'s'}`, sub:r.planLabel, action:()=>openUserSheet(r.user.id), key:'exp-'+r.user.id});
      } else if(r.status==='expired'){
        items.push({icon:'⛔', text:`${r.user.name}'s plan has ended — renew?`, sub:r.planLabel, action:()=>openUserSheet(r.user.id), key:'done-'+r.user.id});
      }
    });
    return items;
  }

  function refreshNotifications(){
    const items = buildNotifications();
    const badge = $('#notifBadge');
    const unread = notifReadAt ? 0 : items.length;
    if(items.length){
      badge.style.display = 'flex';
      badge.textContent = items.length;
    } else {
      badge.style.display = 'none';
    }
    const list = $('#notifList');
    if(!items.length){
      list.innerHTML = '<div class="notif-empty">You\'re all caught up 🎉</div>';
      return;
    }
    list.innerHTML = items.map(n=>`
      <div class="notif-row" data-key="${n.key}">
        <div class="notif-ic">${n.icon}</div>
        <div class="notif-text">
          <div class="notif-title">${n.text}</div>
          ${n.sub ? `<div class="notif-sub">${n.sub}</div>` : ''}
        </div>
      </div>
    `).join('');
    $all('.notif-row').forEach((row,i)=>{
      row.addEventListener('click', ()=>{
        $('#notifPanel').classList.remove('show');
        items[i].action();
      });
    });
  }

  $('#notifBtn').addEventListener('click', (e)=>{
    e.stopPropagation();
    $('#notifPanel').classList.toggle('show');
  });
  $('#notifClearBtn').addEventListener('click', (e)=>{
    e.stopPropagation();
    notifReadAt = Date.now();
    $('#notifBadge').style.display = 'none';
    showToast('Notifications cleared');
  });
  document.addEventListener('click', (e)=>{
    const panel = $('#notifPanel');
    if(panel.classList.contains('show') && !panel.contains(e.target) && e.target.id!=='notifBtn'){
      panel.classList.remove('show');
    }
  });

  /* ============================================================
     ANALYTICS
     ============================================================ */
  function renderAnalytics(){
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const vals = [38,52,45,60,55,72,64];
    const max = Math.max(...vals);
    const chart = $('#salesChart');
    chart.innerHTML = '';
    days.forEach((d,idx)=>{
      const col = document.createElement('div');
      col.className = 'bar-col';
      const h = Math.round((vals[idx]/max)*100);
      col.innerHTML = `<div class="bar-fill" style="height:${h}px;"></div><div class="bar-label">${d}</div>`;
      chart.appendChild(col);
    });

    const topProds = [...products].sort((a,b)=>b.sold-a.sold).slice(0,5);
    $('#topProductsList').innerHTML = topProds.map((p,idx)=>`
      <div class="top-prod-row">
        <div class="top-prod-rank">${idx+1}</div>
        <div class="top-prod-info">
          <div class="top-prod-name">${p.name}</div>
          <div class="top-prod-sub">${p.unit} &middot; ${catLabel[p.category]}</div>
        </div>
        <div class="top-prod-val">${p.sold} sold</div>
      </div>
    `).join('');

    const topRiders = [...deliveryBoys].filter(d=>d.status==='approved').sort((a,b)=>b.deliveries-a.deliveries).slice(0,5);
    $('#topRidersList').innerHTML = topRiders.map((d,idx)=>`
      <div class="top-prod-row">
        <div class="top-prod-rank">${idx+1}</div>
        <div class="top-prod-info">
          <div class="top-prod-name">${d.name}</div>
          <div class="top-prod-sub">${d.area}</div>
        </div>
        <div class="top-prod-val">${d.deliveries} · ${d.rating}★</div>
      </div>
    `).join('');
  }

  /* ============================================================
     TOP-LEVEL RENDER + MISC
     ============================================================ */
  function updateNavBadges(){
    const activeOrders = orders.filter(o=>o.status==='placed').length;
    $('#navOrdersBadge').style.display = activeOrders>0 ? 'flex' : 'none';
    $('#navOrdersBadge').textContent = activeOrders;
    const pendingCount = deliveryBoys.filter(d=>d.status==='pending').length;
    $('#navDbBadge').style.display = pendingCount>0 ? 'flex' : 'none';
    $('#navDbBadge').textContent = pendingCount;
  }

  function renderAll(){
    renderDashboard();
    renderOrders();
    renderProducts();
    renderDeliveryBoys();
    renderUsers();
    renderPaymentManager();
    refreshNotifications();
    renderAnalytics();
    renderPlans();
    renderCalendar();
    renderZones();
    renderCoupons();
    renderBanners();
    renderCategories();
    renderStaff();
    renderPayments();
    renderReports();
    updateNavBadges();
  }

  /* ============================================================
     PLANS
     ============================================================ */
  function renderPlans(){
    const list = $('#plansList');
    if(!list) return;
    list.innerHTML = plans.map(p=>`
      <div class="plan-card" data-plan="${p.id}">
        <div class="plan-top">
          <div class="plan-name">${p.name}</div>
          <div class="plan-dur ${p.duration}">${durLabel[p.duration]}</div>
        </div>
        <div class="plan-slot-tags">
          <div class="plan-tag">${qtyLabel[p.qty]} / day</div>
          <div class="plan-tag">${p.slot==='morning'?ICON_MORNING+'Morning':ICON_EVENING+'Evening'}</div>
        </div>
        <div class="plan-bottom">
          <div class="plan-price">₹${p.price}</div>
          <div class="plan-subs">${p.subs} subscribers</div>
        </div>
      </div>
    `).join('');
    $all('.plan-card').forEach(card=>{
      card.addEventListener('click', ()=>openPlanSheet(card.dataset.plan));
    });
  }

  function openPlanSheet(id){
    editingPlanId = id || null;
    const p = id ? plans.find(x=>x.id===id) : null;
    $('#planSheetTitle').textContent = p ? 'Edit Plan' : 'Create Plan';
    $('#plName').value = p ? p.name : '';
    $('#plDuration').value = p ? p.duration : 'monthly';
    $('#plSlot').value = p ? p.slot : 'morning';
    $('#plPrice').value = p ? p.price : '';
    planUsesCustom = false;
    $all('#plQtyToggle .qty-opt').forEach(o=>o.classList.toggle('active', o.dataset.qty === (p ? p.qty : 'one')));
    $('#planDeleteBtn').style.display = p ? 'block' : 'none';
    openSheet('#planSheetBackdrop');
  }
  $('#addPlanFab') && $('#addPlanFab').addEventListener('click', ()=>openPlanSheet(null));

  $all('#plQtyToggle .qty-opt').forEach(opt=>{
    opt.addEventListener('click', ()=>{
      $all('#plQtyToggle .qty-opt').forEach(o=>o.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  $('#planSheetCloseBtn') && $('#planSheetCloseBtn').addEventListener('click', ()=>closeSheet('#planSheetBackdrop'));
  $('#planSheetBackdrop') && $('#planSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#planSheetBackdrop'); });

  $('#planSaveBtn') && $('#planSaveBtn').addEventListener('click', ()=>{
    const name = $('#plName').value.trim();
    if(!name){ showToast('Enter a plan name'); return; }
    const qty = $('#plQtyToggle .qty-opt.active')?.dataset.qty || 'one';
    const data = {
      name,
      duration: $('#plDuration').value,
      qty,
      slot: $('#plSlot').value,
      price: Number($('#plPrice').value) || 0
    };
    if(editingPlanId){
      const p = plans.find(x=>x.id===editingPlanId);
      Object.assign(p, data);
      showToast('Plan updated');
    } else {
      plans.unshift({id:'pl'+Date.now(), subs:0, ...data});
      showToast('Plan created');
    }
    closeSheet('#planSheetBackdrop');
    renderPlans();
    renderUsers();
  });

  $('#planDeleteBtn') && $('#planDeleteBtn').addEventListener('click', ()=>{
    plans = plans.filter(p=>p.id!==editingPlanId);
    subscriptions.forEach(s=>{ if(s.planId===editingPlanId) s.planId = null; });
    closeSheet('#planSheetBackdrop');
    showToast('Plan deleted');
    renderPlans();
    renderUsers();
  });

  /* ============================================================
     COUPONS & OFFERS
     ============================================================ */
  function couponIsExpired(c){ return new Date(c.expiry) < new Date(); }

  function renderCoupons(){
    const list = $('#couponsList');
    if(!list) return;
    $('#couponCountLabel') && ($('#couponCountLabel').textContent = coupons.length ? `(${coupons.length})` : '');
    const filtered = coupons.filter(c=>{
      if(currentCouponFilter==='active') return c.active && !couponIsExpired(c);
      if(currentCouponFilter==='expired') return couponIsExpired(c);
      return true;
    });
    if(!filtered.length){
      list.innerHTML = `<div style="text-align:center; color:var(--muted); font-size:12.5px; padding:30px 0;">No coupons in this view.</div>`;
      return;
    }
    list.innerHTML = filtered.map(c=>{
      const expired = couponIsExpired(c);
      const pct = c.limit ? Math.min(100, Math.round((c.used/c.limit)*100)) : 0;
      return `
      <div class="plan-card" data-coupon="${c.id}">
        <div class="plan-top">
          <div class="plan-name" style="font-family:monospace; letter-spacing:.5px;">${c.code}</div>
          <div class="plan-dur ${expired?'sixmonth':'monthly'}">${expired ? 'Expired' : (c.active ? 'Active' : 'Paused')}</div>
        </div>
        <div style="font-size:12px; color:var(--muted); margin:4px 0 8px;">${c.desc || ''}</div>
        <div class="plan-slot-tags">
          <div class="plan-tag">${c.type==='percent' ? c.value+'% off' : '₹'+c.value+' off'}</div>
          ${c.minOrder ? `<div class="plan-tag">Min ₹${c.minOrder}</div>` : ''}
          <div class="plan-tag">Exp ${c.expiry}</div>
        </div>
        <div class="plan-bottom">
          <div class="plan-price" style="font-size:12.5px;">${c.used}/${c.limit} used</div>
          <div class="plan-subs">${pct}%</div>
        </div>
      </div>`;
    }).join('');
    $all('.plan-card[data-coupon]').forEach(card=>{
      card.addEventListener('click', ()=>openCouponSheet(card.dataset.coupon));
    });
  }

  $all('#couponChips .chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      currentCouponFilter = chip.dataset.cstatus;
      $all('#couponChips .chip').forEach(c=>c.classList.toggle('active', c===chip));
      renderCoupons();
    });
  });

  function openCouponSheet(id){
    editingCouponId = id || null;
    const c = id ? coupons.find(x=>x.id===id) : null;
    $('#couponSheetTitle').textContent = c ? 'Edit Coupon' : 'Create Coupon';
    $('#cpCode').value = c ? c.code : '';
    $('#cpType').value = c ? c.type : 'percent';
    $('#cpValue').value = c ? c.value : '';
    $('#cpMinOrder').value = c ? c.minOrder : '';
    $('#cpLimit').value = c ? c.limit : '';
    $('#cpExpiry').value = c ? c.expiry : '';
    $('#cpDesc').value = c ? c.desc : '';
    $('#cpActiveToggle').classList.toggle('on', c ? c.active : true);
    $('#couponDeleteBtn').style.display = c ? 'block' : 'none';
    openSheet('#couponSheetBackdrop');
  }
  $('#addCouponFab') && $('#addCouponFab').addEventListener('click', ()=>openCouponSheet(null));
  $('#couponSheetCloseBtn') && $('#couponSheetCloseBtn').addEventListener('click', ()=>closeSheet('#couponSheetBackdrop'));
  $('#couponSheetBackdrop') && $('#couponSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#couponSheetBackdrop'); });
  $('#cpActiveToggle') && $('#cpActiveToggle').addEventListener('click', ()=>$('#cpActiveToggle').classList.toggle('on'));

  $('#couponSaveBtn') && $('#couponSaveBtn').addEventListener('click', ()=>{
    const code = $('#cpCode').value.trim().toUpperCase();
    if(!code){ showToast('Enter a coupon code'); return; }
    const data = {
      code,
      type: $('#cpType').value,
      value: Number($('#cpValue').value) || 0,
      minOrder: Number($('#cpMinOrder').value) || 0,
      limit: Number($('#cpLimit').value) || 0,
      expiry: $('#cpExpiry').value || '2026-12-31',
      desc: $('#cpDesc').value.trim(),
      active: $('#cpActiveToggle').classList.contains('on')
    };
    if(editingCouponId){
      Object.assign(coupons.find(x=>x.id===editingCouponId), data);
      showToast('Coupon updated');
    } else {
      coupons.unshift({id:'c'+Date.now(), used:0, ...data});
      showToast('Coupon created');
    }
    closeSheet('#couponSheetBackdrop');
    renderCoupons();
  });

  $('#couponDeleteBtn') && $('#couponDeleteBtn').addEventListener('click', ()=>{
    coupons = coupons.filter(c=>c.id!==editingCouponId);
    closeSheet('#couponSheetBackdrop');
    showToast('Coupon deleted');
    renderCoupons();
  });

  /* ============================================================
     HOME BANNERS
     ============================================================ */
  function renderBanners(){
    const list = $('#bannersList');
    if(!list) return;
    $('#bannerCountLabel') && ($('#bannerCountLabel').textContent = banners.length ? `(${banners.length})` : '');
    if(!banners.length){
      list.innerHTML = `<div style="text-align:center; color:var(--muted); font-size:12.5px; padding:30px 0;">No banners yet. Tap + to add one.</div>`;
      return;
    }
    list.innerHTML = banners.map((b,i)=>`
      <div class="plan-card" data-banner="${b.id}" style="border-left:4px solid ${b.color};">
        <div class="plan-top">
          <div class="plan-name">${b.title}</div>
          <div class="plan-dur ${b.active?'weekly':'sixmonth'}">${b.active?'Active':'Hidden'}</div>
        </div>
        <div style="font-size:12px; color:var(--muted); margin:4px 0 8px;">${b.subtitle || ''}</div>
        <div class="plan-bottom">
          <div class="plan-subs">Position ${i+1} · Links to ${b.link==='none'?'nothing':b.link}</div>
        </div>
      </div>`).join('');
    $all('.plan-card[data-banner]').forEach(card=>{
      card.addEventListener('click', ()=>openBannerSheet(card.dataset.banner));
    });
  }

  function openBannerSheet(id){
    editingBannerId = id || null;
    const b = id ? banners.find(x=>x.id===id) : null;
    $('#bannerSheetTitle').textContent = b ? 'Edit Banner' : 'Add Banner';
    $('#bnTitle').value = b ? b.title : '';
    $('#bnSubtitle').value = b ? b.subtitle : '';
    $('#bnColor').value = b ? b.color : '#FDC202';
    $('#bnLink').value = b ? b.link : 'coupons';
    $('#bnActiveToggle').classList.toggle('on', b ? b.active : true);
    $('#bannerDeleteBtn').style.display = b ? 'block' : 'none';
    openSheet('#bannerSheetBackdrop');
  }
  $('#addBannerFab') && $('#addBannerFab').addEventListener('click', ()=>openBannerSheet(null));
  $('#bannerSheetCloseBtn') && $('#bannerSheetCloseBtn').addEventListener('click', ()=>closeSheet('#bannerSheetBackdrop'));
  $('#bannerSheetBackdrop') && $('#bannerSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#bannerSheetBackdrop'); });
  $('#bnActiveToggle') && $('#bnActiveToggle').addEventListener('click', ()=>$('#bnActiveToggle').classList.toggle('on'));

  $('#bannerSaveBtn') && $('#bannerSaveBtn').addEventListener('click', ()=>{
    const title = $('#bnTitle').value.trim();
    if(!title){ showToast('Enter a banner title'); return; }
    const data = {
      title,
      subtitle: $('#bnSubtitle').value.trim(),
      color: $('#bnColor').value,
      link: $('#bnLink').value,
      active: $('#bnActiveToggle').classList.contains('on')
    };
    if(editingBannerId){
      Object.assign(banners.find(x=>x.id===editingBannerId), data);
      showToast('Banner updated');
    } else {
      banners.push({id:'bn'+Date.now(), ...data});
      showToast('Banner added');
    }
    closeSheet('#bannerSheetBackdrop');
    renderBanners();
  });

  $('#bannerDeleteBtn') && $('#bannerDeleteBtn').addEventListener('click', ()=>{
    banners = banners.filter(b=>b.id!==editingBannerId);
    closeSheet('#bannerSheetBackdrop');
    showToast('Banner deleted');
    renderBanners();
  });

  /* ============================================================
     CATEGORIES
     ============================================================ */
  function renderCategories(){
    const list = $('#categoriesList');
    if(!list) return;
    $('#categoryCountLabel') && ($('#categoryCountLabel').textContent = categories.length ? `(${categories.length})` : '');
    list.innerHTML = categories.map(c=>{
      const count = products.filter(p=>p.category===c.key).length;
      return `
      <div class="plan-card" data-category="${c.id}">
        <div class="plan-top">
          <div class="plan-name">${c.icon || '📦'} ${c.name}</div>
          <div class="plan-dur ${c.active?'weekly':'sixmonth'}">${c.active?'Visible':'Hidden'}</div>
        </div>
        <div class="plan-bottom">
          <div class="plan-subs">${count} product${count===1?'':'s'}</div>
        </div>
      </div>`;
    }).join('');
    $all('.plan-card[data-category]').forEach(card=>{
      card.addEventListener('click', ()=>openCategorySheet(card.dataset.category));
    });
  }

  function openCategorySheet(id){
    editingCategoryId = id || null;
    const c = id ? categories.find(x=>x.id===id) : null;
    $('#categorySheetTitle').textContent = c ? 'Edit Category' : 'Add Category';
    $('#ctName').value = c ? c.name : '';
    $('#ctIcon').value = c ? c.icon : '';
    $('#ctActiveToggle').classList.toggle('on', c ? c.active : true);
    $('#categoryDeleteBtn').style.display = c ? 'block' : 'none';
    openSheet('#categorySheetBackdrop');
  }
  $('#addCategoryFab') && $('#addCategoryFab').addEventListener('click', ()=>openCategorySheet(null));
  $('#categorySheetCloseBtn') && $('#categorySheetCloseBtn').addEventListener('click', ()=>closeSheet('#categorySheetBackdrop'));
  $('#categorySheetBackdrop') && $('#categorySheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#categorySheetBackdrop'); });
  $('#ctActiveToggle') && $('#ctActiveToggle').addEventListener('click', ()=>$('#ctActiveToggle').classList.toggle('on'));

  $('#categorySaveBtn') && $('#categorySaveBtn').addEventListener('click', ()=>{
    const name = $('#ctName').value.trim();
    if(!name){ showToast('Enter a category name'); return; }
    const data = {
      name,
      icon: $('#ctIcon').value.trim(),
      active: $('#ctActiveToggle').classList.contains('on')
    };
    if(editingCategoryId){
      Object.assign(categories.find(x=>x.id===editingCategoryId), data);
      showToast('Category updated');
    } else {
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
      categories.push({id:'cat'+Date.now(), key, ...data});
      showToast('Category added');
    }
    closeSheet('#categorySheetBackdrop');
    renderCategories();
  });

  $('#categoryDeleteBtn') && $('#categoryDeleteBtn').addEventListener('click', ()=>{
    categories = categories.filter(c=>c.id!==editingCategoryId);
    closeSheet('#categorySheetBackdrop');
    showToast('Category deleted');
    renderCategories();
  });

  /* ============================================================
     STAFF & ROLES
     ============================================================ */
  function renderStaff(){
    const list = $('#staffList');
    if(!list) return;
    $('#staffCountLabel') && ($('#staffCountLabel').textContent = staff.length ? `(${staff.length})` : '');
    list.innerHTML = staff.map(s=>`
      <div class="plan-card" data-staff="${s.id}">
        <div class="plan-top">
          <div class="plan-name">${s.name}</div>
          <div class="plan-dur ${s.role==='superadmin'?'sixmonth':s.role==='manager'?'monthly':'weekly'}">${roleLabel[s.role]}</div>
        </div>
        <div style="font-size:12px; color:var(--muted); margin:4px 0 0;">${s.contact}</div>
        <div class="plan-bottom">
          <div class="plan-subs">${s.active ? 'Active' : 'Deactivated'}</div>
        </div>
      </div>`).join('');
    $all('.plan-card[data-staff]').forEach(card=>{
      card.addEventListener('click', ()=>openStaffSheet(card.dataset.staff));
    });
  }

  function openStaffSheet(id){
    editingStaffId = id || null;
    const s = id ? staff.find(x=>x.id===id) : null;
    $('#staffSheetTitle').textContent = s ? 'Edit Staff Member' : 'Add Staff Member';
    $('#stName').value = s ? s.name : '';
    $('#stContact').value = s ? s.contact : '';
    $('#stRole').value = s ? s.role : 'manager';
    $('#stActiveToggle').classList.toggle('on', s ? s.active : true);
    $('#staffDeleteBtn').style.display = s ? 'block' : 'none';
    openSheet('#staffSheetBackdrop');
  }
  $('#addStaffFab') && $('#addStaffFab').addEventListener('click', ()=>openStaffSheet(null));
  $('#staffSheetCloseBtn') && $('#staffSheetCloseBtn').addEventListener('click', ()=>closeSheet('#staffSheetBackdrop'));
  $('#staffSheetBackdrop') && $('#staffSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#staffSheetBackdrop'); });
  $('#stActiveToggle') && $('#stActiveToggle').addEventListener('click', ()=>$('#stActiveToggle').classList.toggle('on'));

  $('#staffSaveBtn') && $('#staffSaveBtn').addEventListener('click', ()=>{
    const name = $('#stName').value.trim();
    if(!name){ showToast('Enter a name'); return; }
    const data = {
      name,
      contact: $('#stContact').value.trim(),
      role: $('#stRole').value,
      active: $('#stActiveToggle').classList.contains('on')
    };
    if(editingStaffId){
      Object.assign(staff.find(x=>x.id===editingStaffId), data);
      showToast('Staff member updated');
    } else {
      staff.push({id:'st'+Date.now(), ...data});
      showToast('Staff member added');
    }
    closeSheet('#staffSheetBackdrop');
    renderStaff();
  });

  $('#staffDeleteBtn') && $('#staffDeleteBtn').addEventListener('click', ()=>{
    staff = staff.filter(s=>s.id!==editingStaffId);
    closeSheet('#staffSheetBackdrop');
    showToast('Staff member removed');
    renderStaff();
  });

  /* ============================================================
     PAYMENTS & PAYOUTS
     ============================================================ */
  function renderPayments(){
    const summary = $('#paymentsSummary');
    const list = $('#payoutsList');
    if(!summary || !list) return;
    const delivered = orders.filter(o=>o.status==='delivered');
    const grossRevenue = delivered.reduce((sum,o)=>sum+(o.total||0),0);
    const totalRiderPayout = deliveryBoys.filter(d=>d.status==='approved').reduce((s,d)=>s+d.deliveries*15,0);
    summary.innerHTML = `
      <div class="cal-summary-chip"><b>₹${grossRevenue}</b><span>REVENUE</span></div>
      <div class="cal-summary-chip"><b>${delivered.length}</b><span>DELIVERED</span></div>
      <div class="cal-summary-chip"><b>₹${totalRiderPayout}</b><span>PAYOUTS</span></div>
    `;
    const approved = deliveryBoys.filter(d=>d.status==='approved');
    if(!approved.length){
      list.innerHTML = `<div style="text-align:center; color:var(--muted); font-size:12.5px; padding:20px 0;">No approved riders yet.</div>`;
      return;
    }
    list.innerHTML = approved.map(d=>{
      const payout = d.deliveries * 15; // ₹15 per delivery, demo rate
      return `
      <div class="plan-card">
        <div class="plan-top">
          <div class="plan-name">${d.name}</div>
          <div class="plan-price" style="font-size:15px;">₹${payout}</div>
        </div>
        <div style="font-size:12px; color:var(--muted); margin-top:2px;">${d.deliveries} deliveries · ${d.area}</div>
      </div>`;
    }).join('');
  }

  $('#runPayoutBtn') && $('#runPayoutBtn').addEventListener('click', ()=>{
    showToast('Payout run scheduled for Friday 6 PM');
  });

  /* ============================================================
     REPORTS & EXPORTS
     ============================================================ */
  function reportRowCount(id){
    if(id==='rep-sales') return orders.length;
    if(id==='rep-inventory') return products.length;
    if(id==='rep-delivery') return deliveryBoys.filter(d=>d.status==='approved').length;
    if(id==='rep-subs') return subscriptions.filter(s=>s.active).length;
    if(id==='rep-coupons') return coupons.length;
    return 0;
  }

  function renderReports(){
    const list = $('#reportsList');
    const history = $('#reportsHistory');
    if(!list || !history) return;
    list.innerHTML = reportTypes.map(r=>`
      <div class="settings-row" data-report="${r.id}">
        <div class="left">
          <div class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></div>
          <div>${r.name}<div style="font-size:11px; color:var(--muted); font-weight:500; margin-top:2px;">${r.desc}</div></div>
        </div>
        <span>${reportRowCount(r.id)} rows</span>
      </div>`).join('');
    $all('.settings-row[data-report]').forEach(row=>{
      row.addEventListener('click', ()=>{
        const r = reportTypes.find(x=>x.id===row.dataset.report);
        reportHistory.unshift({name:r.name, date:'just now', rows:reportRowCount(r.id)});
        showToast(r.name + ' exported as CSV');
        renderReports();
      });
    });
    history.innerHTML = reportHistory.slice(0,6).map(h=>`
      <div class="settings-row" style="cursor:default;">
        <div class="left"><div class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg></div>${h.name}</div>
        <span style="color:var(--muted); font-weight:500;">${h.date} · ${h.rows} rows</span>
      </div>`).join('');
  }

  /* ============================================================
     PLAN IMPORT FROM EXCEL
     Accepted columns (case-insensitive, flexible aliases):
       Plan Name / Name           -> plan name (required)
       Duration                   -> weekly / monthly / 6 month / sixmonth
       Qty / Quantity / Litres    -> 0.5 or half / 1 or one / 2 or two
       Slot                       -> morning / evening
       Price                      -> number
       Customer (optional)        -> if present, also creates/updates that
       Address (optional)            customer's subscription on this plan
       Phone (optional)
     Existing plans are matched by name (case-insensitive) and updated;
     new names create new plans. Re-import is safe to run repeatedly.
     ============================================================ */
  function normDuration(v){
    v = String(v||'').trim().toLowerCase();
    if(v.includes('week')) return 'weekly';
    if(v.includes('6') || v.includes('six')) return 'sixmonth';
    if(v.includes('month')) return 'monthly';
    return 'monthly';
  }
  function normQty(v){
    v = String(v||'').trim().toLowerCase();
    if(v==='0.5'||v==='.5'||v.includes('half')) return 'half';
    if(v==='2'||v.includes('two')) return 'two';
    return 'one';
  }
  function normSlot(v){
    v = String(v||'').trim().toLowerCase();
    return v.includes('even') ? 'evening' : 'morning';
  }
  function findCol(row, ...names){
    const keys = Object.keys(row);
    for(const n of names){
      const k = keys.find(k=>k.trim().toLowerCase()===n);
      if(k!==undefined && row[k]!==undefined && row[k]!=='') return row[k];
    }
    return undefined;
  }

  function importPlansFromRows(rows){
    let created=0, updated=0, subsLinked=0, skipped=0;
    rows.forEach(row=>{
      const name = findCol(row,'plan name','name','plan');
      if(!name){ skipped++; return; }
      const duration = normDuration(findCol(row,'duration'));
      const qty = normQty(findCol(row,'qty','quantity','litres','daily quantity'));
      const slot = normSlot(findCol(row,'slot','delivery slot'));
      const priceRaw = findCol(row,'price','plan price');
      const price = priceRaw!==undefined ? Number(String(priceRaw).replace(/[^\d.]/g,'')) || 0 : 0;

      let plan = plans.find(p=>p.name.trim().toLowerCase()===String(name).trim().toLowerCase());
      if(plan){
        plan.duration = duration; plan.qty = qty; plan.slot = slot; plan.price = price;
        updated++;
      } else {
        plan = {id:'pl'+Date.now()+Math.floor(Math.random()*1000), name:String(name).trim(), duration, qty, slot, price, subs:0};
        plans.unshift(plan);
        created++;
      }

      // optional customer/address columns -> link an imported subscription + user
      const customer = findCol(row,'customer','customer name','user','user name');
      if(customer){
        const address = findCol(row,'address','delivery address') || '';
        const phone = findCol(row,'phone','mobile','phone number') || '';
        let sub = subscriptions.find(s=>s.customer.trim().toLowerCase()===String(customer).trim().toLowerCase());
        if(sub){
          sub.planId = plan.id; sub.custom = null; sub.slot = slot;
          if(address) sub.address = address;
        } else {
          sub = {id:'s'+Date.now()+Math.floor(Math.random()*1000), customer:String(customer).trim(), address:String(address), planId:plan.id, custom:null, slot, startDate:fmtDateKey(new Date()), active:true, imported:true};
          subscriptions.push(sub);
        }
        let user = users.find(u=>u.name.trim().toLowerCase()===String(customer).trim().toLowerCase());
        if(!user){
          user = {id:'u'+Date.now()+Math.floor(Math.random()*1000), name:String(customer).trim(), phone:String(phone), joined:'Imported', orders:0, status:'active'};
          users.push(user);
        } else if(phone){
          user.phone = String(phone);
        }
        subsLinked++;
      }
    });
    // recompute subscriber counts per plan
    plans.forEach(p=> p.subs = subscriptions.filter(s=>s.planId===p.id && s.active).length );
    return {created, updated, subsLinked, skipped};
  }

  $('#importPlansBtn') && $('#importPlansBtn').addEventListener('click', ()=> $('#planExcelInput').click());
  $('#planExcelInput') && $('#planExcelInput').addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (evt)=>{
      try{
        const wb = XLSX.read(evt.target.result, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
        if(!rows.length){ showToast('No rows found in file'); return; }
        const res = importPlansFromRows(rows);
        renderPlans();
        renderUsers();
        const summary = $('#planImportSummary');
        summary.style.display = 'block';
        summary.innerHTML = `<b>Import complete:</b> ${res.created} plan(s) created, ${res.updated} updated${res.subsLinked?`, ${res.subsLinked} customer subscription(s) linked`:''}${res.skipped?`, ${res.skipped} row(s) skipped (no plan name)`:''}.`;
        showToast('Excel imported — plans updated');
      } catch(err){
        showToast('Could not read file — check format');
        console.error(err);
      }
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  });

  /* ============================================================
     CALENDAR
     ============================================================ */
  function fmtDateKey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

  function renderCalendar(){
    const grid = $('#calGrid');
    if(!grid) return;
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    $('#calMonthLabel').textContent = monthNames[calCurrentMonth.getMonth()] + ' ' + calCurrentMonth.getFullYear();

    const year = calCurrentMonth.getFullYear(), month = calCurrentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const today = new Date(2026, 7, 29);

    let html = ['S','M','T','W','T','F','S'].map(d=>`<div class="cal-dow">${d}</div>`).join('');
    for(let i=0;i<firstDay;i++) html += '<div class="cal-cell empty"></div>';
    for(let day=1; day<=daysInMonth; day++){
      const cellDate = new Date(year, month, day);
      const count = deliveriesOnDate(cellDate).length;
      const isToday = cellDate.toDateString()===today.toDateString();
      const isSel = cellDate.toDateString()===calSelectedDate.toDateString();
      html += `<div class="cal-cell ${isToday?'today':''} ${isSel?'selected':''} ${count>15?'busy':''}" data-date="${fmtDateKey(cellDate)}">
        <div class="cal-day-num">${day}</div>
        ${count>0?`<div class="cal-day-count">${count}</div>`:''}
      </div>`;
    }
    grid.innerHTML = html;
    $all('.cal-cell[data-date]').forEach(cell=>{
      cell.addEventListener('click', ()=>{
        const [y,m,d] = cell.dataset.date.split('-').map(Number);
        openCalDay(new Date(y, m-1, d));
      });
    });

    // today's summary on month view
    const todays = deliveriesOnDate(today);
    const morning = todays.filter(x=>x.slot==='morning').length;
    const evening = todays.filter(x=>x.slot==='evening').length;
    $('#calTodaySummary').innerHTML = `
      <div class="cal-summary-row" style="margin-bottom:0;">
        <div class="cal-summary-chip"><b>${todays.length}</b><span>TOTAL</span></div>
        <div class="cal-summary-chip"><b>${morning}</b><span>${ICON_MORNING}MORNING</span></div>
        <div class="cal-summary-chip"><b>${evening}</b><span>${ICON_EVENING}EVENING</span></div>
      </div>`;
  }

  function openCalDay(date){
    calSelectedDate = date;
    $('#calMonthView').style.display = 'none';
    $('#calDayView').style.display = 'block';
    const opts = {weekday:'short', month:'short', day:'numeric'};
    $('#calDayTitle').textContent = date.toLocaleDateString('en-IN', opts);
    const list = deliveriesOnDate(date);
    $('#calDaySub').textContent = `${list.length} deliveries scheduled`;

    const half = list.filter(x=>x.qty==='half').length;
    const one = list.filter(x=>x.qty==='one').length;
    const two = list.filter(x=>x.qty==='two').length;
    $('#calDaySummaryRow').innerHTML = `
      <div class="cal-summary-chip"><b>${half}</b><span>0.5L</span></div>
      <div class="cal-summary-chip"><b>${one}</b><span>1L</span></div>
      <div class="cal-summary-chip"><b>${two}</b><span>2L</span></div>
    `;

    const ordersList = $('#calDayOrdersList');
    if(list.length===0){
      ordersList.innerHTML = '<div class="empty-state"><div class="empty-state-title">No deliveries</div><div class="empty-state-sub">Nothing scheduled this day</div></div>';
      return;
    }
    ordersList.innerHTML = list.map(x=>`
      <div class="cal-order-card">
        <div class="cal-order-slot-ic ${x.slot}">
          ${x.slot==='morning' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'}
        </div>
        <div class="cal-order-info">
          <div class="cal-order-name">${x.sub.customer}</div>
          <div class="cal-order-meta">${x.sub.address}</div>
        </div>
        <div class="cal-order-qty">${qtyLabel[x.qty]}<span class="zone">${areaOf(x.sub.address)}</span></div>
      </div>
    `).join('');
  }

  $('#calBackBtn') && $('#calBackBtn').addEventListener('click', ()=>{
    $('#calDayView').style.display = 'none';
    $('#calMonthView').style.display = 'block';
    renderCalendar();
  });
  $('#calPrevBtn') && $('#calPrevBtn').addEventListener('click', ()=>{
    calCurrentMonth = new Date(calCurrentMonth.getFullYear(), calCurrentMonth.getMonth()-1, 1);
    renderCalendar();
  });
  $('#calNextBtn') && $('#calNextBtn').addEventListener('click', ()=>{
    calCurrentMonth = new Date(calCurrentMonth.getFullYear(), calCurrentMonth.getMonth()+1, 1);
    renderCalendar();
  });

  /* ============================================================
     ZONES (auto-clustered, equal split among approved riders per zone)
     ============================================================ */
  function renderZones(){
    const list = $('#zonesList');
    if(!list) return;
    const today = new Date(2026, 7, 29);
    const todays = deliveriesOnDate(today);
    const approvedRiders = deliveryBoys.filter(d=>d.status==='approved');

    list.innerHTML = zoneDefs.map(zone=>{
      const zoneDeliveries = todays.filter(x=>zoneOf(x.sub.address)===zone.name);
      const ridersInZone = approvedRiders.filter(r=>zone.areas.includes(r.area));
      const ridersToUse = ridersInZone.length ? ridersInZone : approvedRiders.slice(0,1);
      const perRider = ridersToUse.length ? Math.ceil(zoneDeliveries.length/ridersToUse.length) : 0;

      const riderRows = ridersToUse.map((r,idx)=>{
        const start = idx*perRider, end = Math.min(start+perRider, zoneDeliveries.length);
        const count = Math.max(0, end-start);
        return `<div class="zone-rider-row">
          <div class="zone-rider-avatar">${initials(r.name)}</div>
          <div class="zone-rider-info">
            <div class="zone-rider-name">${r.name}</div>
            <div class="zone-rider-sub">${count} stops · nearest-first route</div>
          </div>
        </div>`;
      }).join('') || '<div style="font-size:11.5px; color:var(--muted); padding:6px 0;">No approved rider in this zone yet.</div>';

      return `<div class="zone-card">
        <div class="zone-top">
          <div class="zone-color-dot" style="background:${zone.color};"></div>
          <div class="zone-name">${zone.name}</div>
          <div class="zone-count">${zoneDeliveries.length} orders</div>
        </div>
        ${riderRows}
      </div>`;
    }).join('');
  }

  $('#zonesRecalcBtn') && $('#zonesRecalcBtn').addEventListener('click', ()=>{
    showToast('Zones re-clustered');
    renderZones();
  });

  /* ============================================================
     CUSTOM (PER-WEEKDAY) SUBSCRIPTION BUILDER
     ============================================================ */
  const dayLabels = {mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday', sun:'Sunday'};
  function renderCustomDayGrid(existing){
    const grid = $('#customDayGrid');
    const src = existing || {mon:'one',tue:'one',wed:'one',thu:'one',fri:'one',sat:'one',sun:'one'};
    grid.innerHTML = Object.keys(dayLabels).map(k=>`
      <div class="day-qty-row">
        <div class="dname">${dayLabels[k]}</div>
        <select data-day="${k}">
          <option value="none" ${src[k]==='none'?'selected':''}>None</option>
          <option value="half" ${src[k]==='half'?'selected':''}>0.5L</option>
          <option value="one" ${src[k]==='one'?'selected':''}>1L</option>
          <option value="two" ${src[k]==='two'?'selected':''}>2L</option>
        </select>
      </div>
    `).join('');
  }

  $('#customPlanBtn') && $('#customPlanBtn').addEventListener('click', ()=>{
    renderCustomDayGrid(null);
    openSheet('#customSubSheetBackdrop');
  });
  $('#customSubCloseBtn') && $('#customSubCloseBtn').addEventListener('click', ()=>closeSheet('#customSubSheetBackdrop'));
  $('#customSubSheetBackdrop') && $('#customSubSheetBackdrop').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeSheet('#customSubSheetBackdrop'); });

  $('#customSubSaveBtn') && $('#customSubSaveBtn').addEventListener('click', ()=>{
    const custom = {};
    $all('#customDayGrid select').forEach(sel=>{ custom[sel.dataset.day] = sel.value; });
    showToast('Custom plan saved — assign it to a customer from Users');
    closeSheet('#customSubSheetBackdrop');
    // stash the most recently built custom plan so it can be attached to a user next
    window._lastCustomPlan = custom;
  });

  const refreshIconEl = $('#refreshBtn svg');
  function doFullRefresh(){
    if(refreshIconEl) refreshIconEl.style.animation = 'ptrSpin .6s linear';
    renderAll();
    showToast('Refreshed');
    if(refreshIconEl) setTimeout(()=>{ refreshIconEl.style.animation = ''; }, 620);
  }
  $('#refreshBtn').addEventListener('click', doFullRefresh);

  $('#logoutBtn').addEventListener('click', ()=>{
    clearSession();
    $('#topbar').style.display = 'none';
    $('#bottomnav').style.display = 'none';
    $all('.screen').forEach(s=>s.classList.remove('active'));
    $('#screen-login').style.display = 'flex';
    $('#screen-login').classList.add('active');
    $('#loginEmail').value = DEMO_ADMIN_EMAIL;
    $('#loginPass').value = '';
    showToast('Logged out');
  });

  $('#globalSearch').addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase();
    const activeScreen = $all('.screen.active')[0];
    if(!activeScreen) return;
    if(activeScreen.id === 'screen-products'){
      $all('#prodGrid .prod-admin-card').forEach(card=>{
        const name = card.querySelector('.prod-admin-name').textContent.toLowerCase();
        card.style.display = name.includes(q) ? '' : 'none';
      });
    } else if(activeScreen.id === 'screen-orders'){
      $all('#ordersList .order-card').forEach(card=>{
        const txt = card.textContent.toLowerCase();
        card.style.display = txt.includes(q) ? '' : 'none';
      });
    } else if(activeScreen.id === 'screen-users'){
      $all('#usersList .user-card').forEach(card=>{
        const txt = card.textContent.toLowerCase();
        card.style.display = txt.includes(q) ? '' : 'none';
      });
    } else if(activeScreen.id === 'screen-delivery'){
      $all('#dbList .db-card').forEach(card=>{
        const txt = card.textContent.toLowerCase();
        card.style.display = txt.includes(q) ? '' : 'none';
      });
    } else if(activeScreen.id === 'screen-paymgr'){
      $all('#pmList .user-card').forEach(card=>{
        const txt = card.textContent.toLowerCase();
        card.style.display = txt.includes(q) ? '' : 'none';
      });
    }
  });

  /* ============================================================
     SOUND SYSTEM (WebAudio beep — no external files needed)
     ============================================================ */
  const SOUND_KEY = 'pd_admin_sound_on';
  let soundOn = (localStorage.getItem(SOUND_KEY) !== 'off');
  let audioCtx = null;
  function ensureAudioCtx(){
    if(!audioCtx){
      try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ audioCtx = null; }
    }
    return audioCtx;
  }
  function playNotifSound(){
    if(!soundOn) return;
    const ctx = ensureAudioCtx();
    if(!ctx) return;
    if(ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    [0, 0.14].forEach((offset, i)=>{
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i===0 ? 880 : 1180, now+offset);
      gain.gain.setValueAtTime(0, now+offset);
      gain.gain.linearRampToValueAtTime(0.18, now+offset+0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now+offset+0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now+offset);
      osc.stop(now+offset+0.24);
    });
  }
  function updateSoundBtnUI(){
    const btn = $('#soundBtn');
    if(!btn) return;
    btn.classList.toggle('sound-off', !soundOn);
    btn.innerHTML = soundOn
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M23 9 17 15M17 9l6 6"/></svg>';
  }
  updateSoundBtnUI();
  $('#soundBtn').addEventListener('click', ()=>{
    soundOn = !soundOn;
    localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
    updateSoundBtnUI();
    if(soundOn){ ensureAudioCtx(); playNotifSound(); showToast('Sound on'); }
    else showToast('Sound off');
  });

  /* ============================================================
     NEW ORDER POPUP
     ============================================================ */
  let popupTimer = null;
  function showOrderPopup(order){
    const el = $('#orderPopup');
    if(!el) return;
    $('#orderPopupTitle').textContent = 'New order received';
    $('#orderPopupSub').textContent = `#${order.id} · ${order.customer} · ₹${order.total}`;
    el.classList.add('show');
    el.onclick = (e)=>{ if(e.target.closest('.op-close')) return; goto('orders'); el.classList.remove('show'); };
    clearTimeout(popupTimer);
    popupTimer = setTimeout(()=>el.classList.remove('show'), 4500);
    playNotifSound();
  }
  $('#orderPopupClose').addEventListener('click', (e)=>{
    e.stopPropagation();
    $('#orderPopup').classList.remove('show');
    clearTimeout(popupTimer);
  });

  /* ============================================================
     PULL-TO-REFRESH (in-app gesture — never reloads the page or
     navigates back to the login screen; just re-renders data)
     ============================================================ */
  function initPullToRefresh(){
    $all('.screen').forEach(screenEl=>{
      const indicator = document.createElement('div');
      indicator.className = 'ptr-indicator';
      indicator.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>';
      screenEl.prepend(indicator);

      let startY = 0, pulling = false, triggered = false;
      const THRESHOLD = 70;

      screenEl.addEventListener('touchstart', (e)=>{
        if(screenEl.scrollTop <= 0){
          startY = e.touches[0].clientY;
          pulling = true;
          triggered = false;
        } else {
          pulling = false;
        }
      }, {passive:true});

      screenEl.addEventListener('touchmove', (e)=>{
        if(!pulling) return;
        const dy = e.touches[0].clientY - startY;
        if(dy > 0 && screenEl.scrollTop <= 0){
          const h = Math.min(dy*0.5, 90);
          indicator.style.height = h + 'px';
          indicator.querySelector('svg').style.transform = `rotate(${Math.min(dy*2,180)}deg)`;
          if(h >= THRESHOLD && !triggered) triggered = true;
        }
      }, {passive:true});

      screenEl.addEventListener('touchend', ()=>{
        if(!pulling) return;
        pulling = false;
        if(triggered){
          indicator.classList.add('spin');
          indicator.style.height = '46px';
          // Data-only refresh: re-renders in place, no reload, no navigation to login
          setTimeout(()=>{
            renderAll();
            indicator.classList.remove('spin');
            indicator.style.height = '0px';
            showToast('Refreshed');
          }, 500);
        } else {
          indicator.style.height = '0px';
        }
      });
    });
  }

  /* ============================================================
     LIVE UPDATES (simulated — swap the setInterval body for a
     websocket/poll handler when the real backend is connected)
     ============================================================ */
  let liveOrderSeq = 2000;
  function simulateIncomingOrder(){
    const names = ['Aditya Rao','Meera Iyer','Farhan Sheikh','Pooja Malhotra','Karan Chawla'];
    const areas = ['Kittu Nagar','Model Town','Civil Lines','Sadar Bazaar'];
    const prodPool = [{name:'Full Cream Milk 500ml',price:32},{name:'Toned Milk 1L',price:54},{name:'Fresh Curd 400g',price:40},{name:'Farm Eggs 6pcs',price:60}];
    const item = prodPool[Math.floor(Math.random()*prodPool.length)];
    const qty = 1 + Math.floor(Math.random()*3);
    liveOrderSeq++;
    const order = {
      id: 'PD' + liveOrderSeq,
      customer: names[Math.floor(Math.random()*names.length)],
      phone: '+91 90000 ' + (10000+Math.floor(Math.random()*89999)),
      address: 'New address, ' + areas[Math.floor(Math.random()*areas.length)],
      items: [{name:item.name, qty, price:item.price}],
      total: item.price*qty,
      status: 'placed',
      date: 'Today, ' + new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'}),
      assigned: null
    };
    orders.unshift(order);
    renderAll();
    showOrderPopup(order);
  }

  function simulateDeliveryProgress(){
    // Advance a random in-flight order forward one stage — mimics a delivery boy update
    const progressable = orders.filter(o=>o.status==='placed' || o.status==='preparing' || o.status==='out');
    if(progressable.length === 0) return;
    const order = progressable[Math.floor(Math.random()*progressable.length)];
    const flow = ['placed','preparing','out','delivered'];
    const idx = flow.indexOf(order.status);
    if(idx > -1 && idx < flow.length-1){
      order.status = flow[idx+1];
      if(order.status==='out' && !order.assigned){
        const riders = deliveryBoys.filter(d=>d.status==='approved');
        if(riders.length) order.assigned = riders[Math.floor(Math.random()*riders.length)].id;
      }
      if(order.status==='delivered'){
        const rider = deliveryBoys.find(d=>d.id===order.assigned);
        if(rider) rider.deliveries++;
      }
      renderAll();
      // If the rider detail sheet is open for the assigned rider, refresh its live panel in place
      if(order.assigned && $('#dbSheetBackdrop').classList.contains('show') && activeDbId===order.assigned){
        openDbSheet(activeDbId);
      }
    }
  }

  function jitterDriverLocations(){
    deliveryBoys.forEach(d=>{
      if(d.status!=='approved' || !d._liveLoc) return;
      d._liveLoc.top = Math.max(10, Math.min(85, d._liveLoc.top + (Math.random()*10-5)));
      d._liveLoc.left = Math.max(10, Math.min(85, d._liveLoc.left + (Math.random()*10-5)));
      const marker = $('#dlpMarker-'+d.id);
      if(marker){ marker.style.top = d._liveLoc.top+'%'; marker.style.left = d._liveLoc.left+'%'; }
    });
  }

  function initLiveUpdates(){
    // New order arrives roughly every 25-45s (simulated)
    setInterval(()=>{
      if(Math.random() < 0.6) simulateIncomingOrder();
    }, 30000);
    // Delivery status ticks forward roughly every 12s (simulated "delivery boy update")
    setInterval(simulateDeliveryProgress, 12000);
    // Driver location jitter every 4s while a rider sheet may be open
    setInterval(jitterDriverLocations, 4000);
  }

  // initial render (data ready even before login for instant nav after auth)
  renderAll();

  // auto-login: if a saved session exists, skip the login screen entirely.
  // Session persists until the admin explicitly logs out (no expiry).
  const savedSession = loadSession();
  if(savedSession && savedSession.email){
    enterApp(savedSession.email, {silent:true});
  }

  initLiveUpdates();
  initPullToRefresh();

})();
