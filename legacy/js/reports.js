// ===== REPORTS PAGE =====
(function() {
  buildSidebar('reports');
  buildTopbar('Reports & Logs', 'Detailed delivery analytics and message history');

  let filtered = [...AppState.messages];
  let page = 1;
  const pageSize = 15;

  // STATS
  const total = AppState.messages.length;
  const delivered = AppState.messages.filter(m => m.status === 'delivered').length;
  const failed = AppState.messages.filter(m => m.status === 'failed').length;
  const totalCost = AppState.messages.reduce((s, m) => s + m.cost, 0);
  const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  document.getElementById('rptTotal').textContent = formatNumber(total);
  document.getElementById('rptDelivered').textContent = formatNumber(delivered);
  document.getElementById('rptFailed').textContent = failed;
  document.getElementById('rptCost').textContent = formatCurrency(totalCost);
  document.getElementById('rptRate').textContent = rate + '% rate';

  // Populate campaign filter
  const campSelect = document.getElementById('logCampaign');
  AppState.campaigns.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name;
    campSelect.appendChild(opt);
  });

  // DAILY CHART
  const days = Array.from({length: 7}, (_, i) => {
    const d = new Date(Date.now() - (6-i) * 86400000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const sentByDay = Array.from({length: 7}, (_, i) => {
    const start = new Date(Date.now() - (6-i) * 86400000);
    start.setHours(0,0,0,0);
    const end = new Date(start); end.setHours(23,59,59,999);
    return AppState.messages.filter(m => {
      const d = new Date(m.sentAt);
      return d >= start && d <= end;
    }).length + Math.floor(Math.random() * 120 + 50);
  });

  new Chart(document.getElementById('dailyChart'), {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Delivered',
          data: sentByDay.map(v => Math.floor(v * 0.968)),
          backgroundColor: 'rgba(16,185,129,0.7)',
          borderRadius: 4,
        },
        {
          label: 'Failed',
          data: sentByDay.map(v => Math.floor(v * 0.032)),
          backgroundColor: 'rgba(239,68,68,0.7)',
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } },
      scales: {
        x: { stacked: true, ticks: { color: '#475569' }, grid: { color: 'rgba(99,102,241,0.06)' } },
        y: { stacked: true, ticks: { color: '#475569' }, grid: { color: 'rgba(99,102,241,0.06)' }, beginAtZero: true }
      }
    }
  });

  // CAMPAIGN CHART
  new Chart(document.getElementById('campaignChart'), {
    type: 'bar',
    data: {
      labels: AppState.campaigns.filter(c => c.sent > 0).map(c => c.name.substring(0, 15)),
      datasets: [
        {
          label: 'Delivered',
          data: AppState.campaigns.filter(c => c.sent > 0).map(c => c.delivered),
          backgroundColor: 'rgba(99,102,241,0.7)',
          borderRadius: 4,
        },
        {
          label: 'Failed',
          data: AppState.campaigns.filter(c => c.sent > 0).map(c => c.failed),
          backgroundColor: 'rgba(239,68,68,0.5)',
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } },
      scales: {
        x: { stacked: true, ticks: { color: '#475569' }, grid: { color: 'rgba(99,102,241,0.06)' } },
        y: { stacked: true, ticks: { color: '#475569' }, grid: { color: 'rgba(99,102,241,0.06)' } }
      }
    }
  });

  // MESSAGE LOG TABLE
  window.filterLogs = function() {
    const search = document.getElementById('logSearch').value.toLowerCase();
    const status = document.getElementById('logStatus').value;
    const campaign = document.getElementById('logCampaign').value;
    const date = document.getElementById('logDate').value;

    filtered = AppState.messages.filter(m => {
      const matchSearch = !search || m.name?.toLowerCase().includes(search) || m.to?.includes(search);
      const matchStatus = !status || m.status === status;
      const matchCampaign = !campaign || m.campaignId === campaign;
      const matchDate = !date || m.sentAt?.startsWith(date);
      return matchSearch && matchStatus && matchCampaign && matchDate;
    });

    page = 1;
    renderTable();
  };

  function renderTable() {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);
    const totalPages = Math.ceil(filtered.length / pageSize);

    document.getElementById('logCount').textContent = `${filtered.length} messages`;
    document.getElementById('pageInfo').textContent = `Page ${page} of ${Math.max(1, totalPages)}`;
    document.getElementById('prevPage').disabled = page <= 1;
    document.getElementById('nextPage').disabled = page >= totalPages;

    const statusMap = {
      delivered: '<span class="badge badge-success"><span class="status-dot delivered"></span>Delivered</span>',
      failed: '<span class="badge badge-danger"><span class="status-dot failed"></span>Failed</span>',
      pending: '<span class="badge badge-warning"><span class="status-dot pending"></span>Pending</span>',
    };

    const tbody = document.getElementById('logsBody');
    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">No messages found</td></tr>`;
      return;
    }

    tbody.innerHTML = pageData.map((m, i) => {
      const camp = AppState.campaigns.find(c => c.id === m.campaignId);
      return `
        <tr>
          <td style="color:var(--text-muted);font-size:12px;">${start + i + 1}</td>
          <td>${m.name || 'Unknown'}</td>
          <td><span class="font-mono" style="font-size:12px;">${m.to}</span></td>
          <td style="font-size:12px;color:var(--text-muted);">${camp?.name || '—'}</td>
          <td>${statusMap[m.status] || '<span class="badge badge-muted">Unknown</span>'}</td>
          <td><span class="badge badge-muted">${m.provider}</span></td>
          <td style="font-size:12px;">$${m.cost.toFixed(4)}</td>
          <td style="font-size:12px;color:var(--text-muted);">${formatDateTime(m.sentAt)}</td>
        </tr>
      `;
    }).join('');
  }

  window.changePage = function(dir) {
    page += dir;
    renderTable();
  };

  // CAMPAIGN REPORT TABLE
  function renderCampaignReport() {
    const statusBadge = {
      completed: '<span class="badge badge-success">✅ Completed</span>',
      running: '<span class="badge badge-primary">🔄 Running</span>',
      scheduled: '<span class="badge badge-warning">🕐 Scheduled</span>',
    };

    document.getElementById('campaignReportBody').innerHTML = AppState.campaigns.map(c => {
      const rate = c.sent > 0 ? Math.round((c.delivered / c.sent) * 100) : 0;
      return `
        <tr>
          <td>${c.name}</td>
          <td>${statusBadge[c.status] || ''}</td>
          <td>${formatNumber(c.sent)}</td>
          <td style="color:var(--success-light);font-weight:600;">${formatNumber(c.delivered)}</td>
          <td style="color:var(--danger-light);">${c.failed}</td>
          <td>
            <div class="flex items-center gap-8">
              <div class="progress-bar" style="width:80px;height:6px;">
                <div class="progress-fill" style="width:${rate}%;background:linear-gradient(90deg,var(--success),var(--success-light))"></div>
              </div>
              <span style="font-size:12px;font-weight:600;color:${rate > 95 ? 'var(--success-light)' : 'var(--warning)'};">${rate}%</span>
            </div>
          </td>
          <td style="font-weight:600;">${formatCurrency(c.cost)}</td>
          <td style="font-size:12px;color:var(--text-muted);">${formatDate(c.createdAt)}</td>
        </tr>
      `;
    }).join('');
  }

  window.exportLogs = function() {
    const rows = [['#','Name','Phone','Campaign','Status','Provider','Cost','Sent At']];
    filtered.forEach((m, i) => {
      const camp = AppState.campaigns.find(c => c.id === m.campaignId);
      rows.push([i+1, m.name, m.to, camp?.name || '', m.status, m.provider, '$' + m.cost.toFixed(4), m.sentAt]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'message_logs_export.csv';
    a.click();
    showToast('✅ Logs exported!', 'success');
  };

  filterLogs();
  renderCampaignReport();
})();
