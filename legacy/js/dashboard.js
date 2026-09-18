// ===== DASHBOARD PAGE =====
(function() {
  buildSidebar('index');
  buildTopbar('Dashboard', 'Overview of your SMS campaigns & delivery stats');

  // Dynamic aggregations from AppState
  const totalSent = AppState.campaigns.reduce((sum, c) => sum + (c.sent || 0), 0);
  const delivered = AppState.campaigns.reduce((sum, c) => sum + (c.delivered || 0), 0);
  const failed = AppState.campaigns.reduce((sum, c) => sum + (c.failed || 0), 0);
  const totalCost = AppState.campaigns.reduce((sum, c) => sum + (c.cost || 0), 0);
  const pending = Math.max(0, totalSent - delivered - failed);

  const deliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(1) : '96.8';
  const failureRate = totalSent > 0 ? ((failed / totalSent) * 100).toFixed(1) : '2.7';
  const pendingRate = totalSent > 0 ? ((pending / totalSent) * 100).toFixed(1) : '0.5';

  // Two-Way SMS Provider info (AWS SNS removed - one-way only)
  const providerRates = {
    twilio: { name: 'Twilio Two-Way Messaging API', rate: 0.0079, inboundRate: 0.0075, desc: 'US 10DLC • $0.0079 outbound / $0.0075 inbound' },
    plivo: { name: 'Plivo Two-Way SMS API', rate: 0.0055, inboundRate: 0.0035, desc: 'Direct Carrier Route • $0.0055 outbound / $0.0035 inbound' },
    bandwidth: { name: 'Bandwidth Direct 2-Way API', rate: 0.004, inboundRate: 0.0020, desc: 'Carrier Infrastructure • $0.0040 outbound / $0.0020 inbound' },
    vonage: { name: 'Vonage Two-Way SMS API', rate: 0.0065, inboundRate: 0.0060, desc: 'Global Webhook Route • $0.0065 outbound / $0.0060 inbound' },
    sinch: { name: 'Sinch Conversation 2-Way API', rate: 0.0058, inboundRate: 0.0050, desc: 'Enterprise Conversation • $0.0058 outbound / $0.0050 inbound' }
  };
  const activeProvKey = AppState.settings.provider || 'twilio';
  const activeProv = providerRates[activeProvKey] || providerRates.twilio;

  // Inbound stats from AppState.inboundMessages
  const inboundList = (AppState.inboundMessages || []).filter(m => m.direction === 'inbound');
  const totalInbound = inboundList.length;
  const unreadInbound = inboundList.filter(m => !m.read).length;

  const dash2WayApi = document.getElementById('dashboardActive2WayApi');
  if (dash2WayApi) dash2WayApi.textContent = activeProv.name;

  const inTotalEl = document.getElementById('kpiInboundTotal');
  if (inTotalEl) inTotalEl.textContent = formatNumber(totalInbound);

  const unreadPill = document.getElementById('dashUnreadPill');
  if (unreadPill) unreadPill.textContent = `${unreadInbound} unread`;

  document.getElementById('kpiSent').textContent = formatNumber(totalSent);
  document.getElementById('kpiDelivered').textContent = formatNumber(delivered);
  document.getElementById('kpiFailed').textContent = formatNumber(failed);
  document.getElementById('kpiCost').textContent = formatCurrency(totalCost);
  document.getElementById('costCredits').textContent = formatNumber(totalSent);
  document.getElementById('costTotal').textContent = formatCurrency(totalCost);

  const avgEl = document.getElementById('costAvgPerSms');
  if (avgEl) avgEl.textContent = `$${activeProv.rate}`;
  const provEl = document.getElementById('costActiveProvider');
  if (provEl) provEl.textContent = activeProv.name.split(' ')[0] + ' (2-Way)';

  const provLabelEl = document.getElementById('activeProviderLabel');
  if (provLabelEl) provLabelEl.textContent = `📡 2-Way Provider: ${activeProv.name.split(' ')[0]}`;
  const provSubEl = document.getElementById('activeProviderSub');
  if (provSubEl) provSubEl.textContent = activeProv.desc;

  // Delivery Progress Bars
  const delivVal = document.getElementById('delivPctVal');
  if (delivVal) delivVal.textContent = `${deliveryRate}%`;
  const delivBar = document.getElementById('delivProgressFill');
  if (delivBar) delivBar.style.width = `${deliveryRate}%`;

  const failVal = document.getElementById('failPctVal');
  if (failVal) failVal.textContent = `${failureRate}%`;
  const failBar = document.getElementById('failProgressFill');
  if (failBar) failBar.style.width = `${failureRate}%`;

  const pendVal = document.getElementById('pendPctVal');
  if (pendVal) pendVal.textContent = `${pendingRate}%`;
  const pendBar = document.getElementById('pendProgressFill');
  if (pendBar) pendBar.style.width = `${pendingRate}%`;

  // LINE CHART (Last 7 Days)
  const labels = [];
  const sentData = [];
  const deliveredData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const end = start + 86400000;
    const dayMsgs = AppState.messages.filter(m => {
      const t = new Date(m.sentAt).getTime();
      return t >= start && t < end;
    });

    const daySent = dayMsgs.length > 0 ? dayMsgs.length * 12 : [142, 218, 190, 305, 267, 198, 85][6 - i];
    const dayDeliv = dayMsgs.length > 0
      ? dayMsgs.filter(m => m.status === 'delivered').length * 12
      : Math.floor(daySent * 0.965);

    sentData.push(daySent);
    deliveredData.push(dayDeliv);
  }

  new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Sent',
          data: sentData,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Delivered',
          data: deliveredData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.05)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 12 } } }
      },
      scales: {
        x: { ticks: { color: '#475569' }, grid: { color: 'rgba(99,102,241,0.06)' } },
        y: { ticks: { color: '#475569' }, grid: { color: 'rgba(99,102,241,0.06)' }, beginAtZero: true }
      }
    }
  });

  // DONUT CHART
  new Chart(document.getElementById('donutChart'), {
    type: 'doughnut',
    data: {
      labels: ['Delivered', 'Failed', 'Pending'],
      datasets: [{
        data: [Number(deliveryRate) || 96.2, Number(failureRate) || 3.2, Number(pendingRate) || 0.6],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false }
      }
    }
  });

  // CAMPAIGN LIST
  const campList = document.getElementById('campaignList');
  const statusMap = {
    completed: '<span class="badge badge-success">✅ Completed</span>',
    running: '<span class="badge badge-primary">🔄 Running</span>',
    scheduled: '<span class="badge badge-warning">🕐 Scheduled</span>',
    draft: '<span class="badge badge-muted">📄 Draft</span>',
  };

  campList.innerHTML = AppState.campaigns.slice(0, 5).map(c => `
    <div class="campaign-row">
      <div style="width:36px;height:36px;border-radius:8px;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">
        ${c.status === 'running' ? '🔄' : c.status === 'completed' ? '✅' : '🕐'}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);truncate;">${c.name}</div>
        <div style="font-size:11px;color:var(--text-muted);">${formatDate(c.createdAt)} · ${c.sent} sent (${formatCurrency(c.cost || 0)})</div>
        ${c.status === 'running' ? `<div class="progress-bar mt-4"><div class="progress-fill" style="width:72%"></div></div>` : ''}
      </div>
      ${statusMap[c.status]}
    </div>
  `).join('');

  // LIVE INBOUND RECEIVER MESSAGES FEED
  const inFeed = document.getElementById('inboundFeed');
  if (inFeed) {
    if (inboundList.length === 0) {
      inFeed.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">No incoming messages yet. Send a campaign or click "Simulate Reply" in Inbox!</div>`;
    } else {
      const recentInbounds = [...inboundList].reverse().slice(0, 4);
      inFeed.innerHTML = recentInbounds.map(m => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            <div style="width:34px;height:34px;border-radius:50%;background:rgba(16,185,129,0.15);color:var(--success-light);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">
              ${m.contactName ? m.contactName[0] : '👤'}
            </div>
            <div style="min-width:0;">
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
                <span class="truncate">${m.contactName || m.phone}</span>
                ${!m.read ? '<span class="badge badge-primary" style="font-size:9px;padding:1px 5px;">NEW</span>' : ''}
                ${m.isOptOut ? '<span class="badge badge-danger" style="font-size:9px;padding:1px 5px;">STOP</span>' : ''}
              </div>
              <div style="font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;">
                "${m.text}"
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <span style="font-size:11px;color:var(--text-muted);">${timeAgo(m.timestamp)}</span>
            <a href="inbox.html?contact=${m.contactId}" class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:11px;">Reply ↩</a>
          </div>
        </div>
      `).join('');
    }
  }
})();
