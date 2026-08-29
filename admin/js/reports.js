/* ============================================================
   REPORTS — date range, sales trend line chart, top products
   bar chart, delivery boy leaderboard, CSV export.
   Charts are hand-built SVG using only --green/--yellow palette
   (no external chart library) to match spec exactly.
============================================================ */

renderLayout('Reports');

const reportFrom = document.getElementById('reportFrom');
const reportTo = document.getElementById('reportTo');
let reportRange = { from: '', to: '' };

// default range: last 30 days
(function setDefaultRange(){
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  reportTo.value = to.toISOString().substring(0,10);
  reportFrom.value = from.toISOString().substring(0,10);
  reportRange = { from: reportFrom.value, to: reportTo.value };
})();

/* ---------------- LINE CHART (sales trend) ---------------- */
function renderLineChart(container, data){
  if(!data || data.length === 0){
    renderEmptyState(container, { title:'No sales data', sub:'Try a different date range.' });
    return;
  }
  const w = 900, h = 260, padL = 50, padR = 20, padT = 20, padB = 34;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const stepX = (w - padL - padR) / Math.max(data.length - 1, 1);

  const points = data.map((d,i) => {
    const x = padL + i * stepX;
    const y = padT + (h - padT - padB) * (1 - d.value / maxVal);
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.map((p,i) => (i===0 ? 'M' : 'L') + p.x + ' ' + p.y).join(' ');
  const areaD = pathD + ` L${points[points.length-1].x} ${h-padB} L${points[0].x} ${h-padB} Z`;

  const gridLines = Array.from({length:4}).map((_,i)=>{
    const y = padT + (h - padT - padB) * (i/3);
    return `<line x1="${padL}" y1="${y}" x2="${w-padR}" y2="${y}" stroke="#F0E4C4" stroke-width="1"/>`;
  }).join('');

  const labelEvery = Math.ceil(points.length / 8);
  const xLabels = points.filter((_,i)=> i % labelEvery === 0).map(p =>
    `<text x="${p.x}" y="${h-10}" font-size="10" fill="#8A7F60" text-anchor="middle" font-family="Poppins,Inter,sans-serif">${p.label}</text>`
  ).join('');

  const dots = points.map(p =>
    `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#4CAF6D"><title>${p.label}: ₹${p.value}</title></circle>`
  ).join('');

  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto;">
      ${gridLines}
      <path d="${areaD}" fill="#EAF7ED" stroke="none"/>
      <path d="${pathD}" fill="none" stroke="#4CAF6D" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      ${xLabels}
    </svg>`;
}

/* ---------------- BAR CHART (top products) ---------------- */
function renderBarChart(container, data){
  if(!data || data.length === 0){
    renderEmptyState(container, { title:'No product data', sub:'Try a different date range.' });
    return;
  }
  const w = 420, barH = 26, gap = 14, padL = 10, padR = 60;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const h = data.length * (barH + gap);

  const bars = data.map((d,i) => {
    const y = i * (barH + gap);
    const barW = (w - padL - padR) * (d.value / maxVal);
    return `
      <text x="${padL}" y="${y + barH/2 - 6}" font-size="11" font-weight="700" fill="#2B2410" font-family="Poppins,Inter,sans-serif">${escapeHtml(d.label)}</text>
      <rect x="${padL}" y="${y + barH/2 + 2}" width="${w-padL-padR}" height="8" rx="4" fill="#FFF8E4"/>
      <rect x="${padL}" y="${y + barH/2 + 2}" width="${barW}" height="8" rx="4" fill="#FDC202"/>
      <text x="${w-padR+8}" y="${y + barH/2 + 9}" font-size="11" font-weight="700" fill="#8A7F60" font-family="Poppins,Inter,sans-serif">${d.value}</text>
    `;
  }).join('');

  container.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto;">${bars}</svg>`;
}

/* ---------------- LEADERBOARD ---------------- */
function renderLeaderboard(container, data){
  if(!data || data.length === 0){
    renderEmptyState(container, { title:'No delivery data', sub:'Try a different date range.' });
    return;
  }
  container.innerHTML = data.map((d,i) => `
    <div class="leaderboard-row">
      <div class="leaderboard-rank">${i+1}</div>
      <div class="leaderboard-name">${escapeHtml(d.name)}</div>
      <div class="leaderboard-value">${d.delivered} delivered</div>
    </div>
  `).join('');
}

async function loadReports(){
  const salesEl = document.getElementById('salesTrendChart');
  const productsEl = document.getElementById('topProductsChart');
  const leaderboardEl = document.getElementById('leaderboardList');

  salesEl.innerHTML = `<div class="skeleton" style="height:220px;"></div>`;
  productsEl.innerHTML = `<div class="skeleton" style="height:180px;"></div>`;
  leaderboardEl.innerHTML = `<div class="skeleton" style="height:180px;"></div>`;

  try{
    const [trend, topProducts, leaderboard] = await Promise.all([
      reportApi.salesTrend(reportRange),
      reportApi.topProducts(reportRange),
      reportApi.deliveryLeaderboard(reportRange),
    ]);
    renderLineChart(salesEl, (trend && trend.data) || trend || []);
    renderBarChart(productsEl, (topProducts && topProducts.data) || topProducts || []);
    renderLeaderboard(leaderboardEl, (leaderboard && leaderboard.data) || leaderboard || []);
  }catch(err){
    handleApiError(err, 'Failed to load reports.');
  }
}

document.getElementById('applyRangeBtn').addEventListener('click', ()=>{
  reportRange = { from: reportFrom.value, to: reportTo.value };
  loadReports();
});

document.getElementById('exportCsvBtn').addEventListener('click', async ()=>{
  const btn = document.getElementById('exportCsvBtn');
  btn.disabled = true;
  try{
    const res = await reportApi.exportCsv(reportRange);
    const csvContent = (res && res.csv) || res;
    if(!csvContent){ throw { message: 'No data returned for export.' }; }
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportRange.from}_to_${reportRange.to}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Report exported', 'success');
  }catch(err){
    handleApiError(err, 'Failed to export report.');
  }finally{
    btn.disabled = false;
  }
});

loadReports();
