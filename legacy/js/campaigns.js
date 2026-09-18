// ===== CAMPAIGNS PAGE =====
(function() {
  buildSidebar('campaigns');
  buildTopbar('Campaigns', 'Create and manage bulk SMS campaigns for US contacts');

  let currentStep = 1;
  let filterStatus = 'all';

  // Pre-fill from template page if redirected
  const preSelectedTemplate = localStorage.getItem('_campaign_template');
  if (preSelectedTemplate) localStorage.removeItem('_campaign_template');

  // Populate selects
  function populateSelects() {
    const tplSelect = document.getElementById('campTemplate');
    AppState.templates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      tplSelect.appendChild(opt);
    });
    if (preSelectedTemplate) tplSelect.value = preSelectedTemplate;

    const groupSelect = document.getElementById('campGroup');
    const groups = [...new Set(AppState.contacts.map(c => c.group))];
    groups.forEach(g => {
      const count = AppState.contacts.filter(c => c.group === g).length;
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = `${g} (${count} contacts)`;
      groupSelect.appendChild(opt);
    });
  }

  window.onTemplateChange = function() {
    const tplId = document.getElementById('campTemplate').value;
    const tpl = AppState.templates.find(t => t.id === tplId);
    if (tpl) {
      document.getElementById('campTemplatePreview').textContent = tpl.content;
      document.getElementById('templatePreviewBox').style.display = 'block';
    } else {
      document.getElementById('templatePreviewBox').style.display = 'none';
    }
  };

  window.toggleScheduleTime = function() {
    const schedule = document.getElementById('campSchedule').value;
    document.getElementById('scheduleTimeGroup').style.display = schedule === 'schedule' ? 'block' : 'none';
  };

  window.updateEstimate = function() {
    const group = document.getElementById('campGroup').value;
    const tplId = document.getElementById('campTemplate').value;
    const tpl = AppState.templates.find(t => t.id === tplId);

    if (!group) {
      document.getElementById('groupInfo').style.display = 'none';
      document.getElementById('costEstimate').style.display = 'none';
      return;
    }

    const count = AppState.contacts.filter(c => c.group === group).length;
    document.getElementById('groupCount').textContent = count;
    document.getElementById('groupInfo').style.display = 'block';

    if (tpl) {
      const credits = Math.ceil(tpl.content.length / 160);
      const total = count * credits * 0.0079;
      document.getElementById('estRecipients').textContent = count;
      document.getElementById('estCredits').textContent = credits;
      document.getElementById('estTotal').textContent = formatCurrency(total);
      document.getElementById('costEstimate').style.display = 'block';
    }
  };

  window.goStep = function(step) {
    const name = document.getElementById('campName').value.trim();
    const tplId = document.getElementById('campTemplate').value;
    const group = document.getElementById('campGroup').value;

    if (step === 2 && (!name || !tplId)) {
      showToast('Please fill in campaign name and select a template', 'error');
      return;
    }
    if (step === 3 && !group) {
      showToast('Please select a target group', 'error');
      return;
    }

    if (step === 3) {
      const tpl = AppState.templates.find(t => t.id === tplId);
      const count = AppState.contacts.filter(c => c.group === group).length;
      const credits = tpl ? Math.ceil(tpl.content.length / 160) : 1;
      const total = count * credits * 0.0079;
      const scheduleType = document.getElementById('campSchedule').value;
      const scheduleTime = document.getElementById('campScheduleTime').value;

      document.getElementById('reviewBox').innerHTML = `
        <div style="display:grid;gap:10px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Campaign</span><span style="font-weight:600;">${name}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Template</span><span style="font-weight:600;">${tpl?.name || 'N/A'}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Group</span><span style="font-weight:600;">${group}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Recipients</span><span style="font-weight:600;">${count}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Timing</span><span style="font-weight:600;">${scheduleType === 'now' ? '⚡ Immediately' : '🕐 ' + (scheduleTime || 'Not set')}</span></div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px;"><span style="color:var(--text-secondary);font-weight:600;">Estimated Cost</span><span style="font-weight:800;font-size:16px;color:var(--primary-light);">${formatCurrency(total)}</span></div>
        </div>
      `;
    }

    currentStep = step;
    [1,2,3].forEach(s => {
      document.getElementById(`step${s}`).style.display = s === step ? 'block' : 'none';
      const el = document.getElementById(`step${s}el`);
      el.className = 'step ' + (s < step ? 'done' : s === step ? 'active' : '');
    });
  };

  window.launchCampaign = function() {
    if (!document.getElementById('confirmConsent').checked) {
      showToast('Please confirm consent before sending', 'error');
      return;
    }

    const name = document.getElementById('campName').value.trim();
    const tplId = document.getElementById('campTemplate').value;
    const group = document.getElementById('campGroup').value;
    const scheduleType = document.getElementById('campSchedule').value;
    const scheduleTime = document.getElementById('campScheduleTime').value;

    const contacts = AppState.contacts.filter(c => c.group === group);
    const tpl = AppState.templates.find(t => t.id === tplId);
    const isScheduled = scheduleType === 'schedule' && scheduleTime;

    if (isScheduled) {
      const camp = {
        id: generateId('camp'), name, templateId: tplId, group, status: 'scheduled',
        sent: 0, delivered: 0, failed: 0,
        cost: 0,
        scheduledAt: new Date(scheduleTime).toISOString(),
        createdAt: new Date().toISOString()
      };
      AppState.campaigns.unshift(camp);
      saveCampaigns();
      showToast(`✅ Campaign "${name}" scheduled for ${new Date(scheduleTime).toLocaleString()}`, 'success');
      renderCampaigns();
      return;
    }

    // Simulate sending
    const overlay = document.getElementById('sendingOverlay');
    overlay.classList.add('active');

    const total = contacts.length;
    let sent = 0;
    const credits = tpl ? Math.ceil(tpl.content.length / 160) : 1;

    const interval = setInterval(() => {
      sent = Math.min(sent + Math.floor(Math.random() * 40 + 10), total);
      const pct = Math.round((sent / total) * 100);
      document.getElementById('sendProgress').style.width = pct + '%';
      document.getElementById('sendCount').textContent = `${sent} / ${total} sent`;
      document.getElementById('sendPct').textContent = pct + '%';

      if (sent < Math.floor(total * 0.3)) document.getElementById('sendingStatus').textContent = 'Queuing messages...';
      else if (sent < Math.floor(total * 0.7)) document.getElementById('sendingStatus').textContent = 'Sending via Twilio API...';
      else document.getElementById('sendingStatus').textContent = 'Waiting for delivery confirmations...';

      if (sent >= total) {
        clearInterval(interval);
        setTimeout(() => {
          const failed = Math.floor(total * 0.032);
          const delivered = total - failed;
          const cost = total * credits * 0.0079;

          const camp = {
            id: generateId('camp'), name, templateId: tplId, group, status: 'completed',
            sent: total, delivered, failed, cost,
            scheduledAt: null, createdAt: new Date().toISOString()
          };
          AppState.campaigns.unshift(camp);

          // Create message logs
          contacts.forEach((c, i) => {
            AppState.messages.push({
              id: generateId('m'),
              to: c.phone, name: c.name,
              campaignId: camp.id, templateId: tplId,
              status: i < failed ? 'failed' : 'delivered',
              provider: 'twilio', cost: 0.0079 * credits,
              sentAt: new Date().toISOString(), segments: credits
            });
          });

          saveCampaigns();
          saveMessages();
          overlay.classList.remove('active');
          showToast(`🎉 Campaign "${name}" sent! ${delivered} delivered, ${failed} failed.`, 'success');
          renderCampaigns();
        }, 800);
      }
    }, 200);
  };

  window.filterCampaigns = function(status, el) {
    filterStatus = status;
    document.querySelectorAll('[data-status]').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    renderCampaigns();
  };

  function renderCampaigns() {
    const grid = document.getElementById('campaignGrid');
    let list = AppState.campaigns;
    if (filterStatus !== 'all') list = list.filter(c => c.status === filterStatus);

    if (list.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📤</div><h3>No campaigns yet</h3><p>Create your first campaign to start sending messages</p></div>`;
      return;
    }

    const statusBadge = {
      completed: '<span class="badge badge-success">✅ Completed</span>',
      running: '<span class="badge badge-primary">🔄 Running</span>',
      scheduled: '<span class="badge badge-warning">🕐 Scheduled</span>',
      draft: '<span class="badge badge-muted">📄 Draft</span>',
    };

    grid.innerHTML = list.map(c => {
      const deliveryRate = c.sent > 0 ? Math.round((c.delivered / c.sent) * 100) : 0;
      const tpl = AppState.templates.find(t => t.id === c.templateId);
      return `
        <div class="campaign-card animate-in">
          <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px;">
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--text-primary);">${c.name}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                ${tpl ? `📝 ${tpl.name}` : ''} · 👥 ${c.group} · ${formatDate(c.createdAt)}
              </div>
            </div>
            ${statusBadge[c.status]}
          </div>

          ${c.status === 'running' ? `<div class="progress-bar mb-12"><div class="progress-fill" style="width:72%"></div></div>` : ''}

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
            <div style="text-align:center;padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm);">
              <div style="font-size:16px;font-weight:700;color:var(--text-primary);">${formatNumber(c.sent)}</div>
              <div style="font-size:10px;color:var(--text-muted);">Sent</div>
            </div>
            <div style="text-align:center;padding:8px;background:var(--success-bg);border-radius:var(--radius-sm);">
              <div style="font-size:16px;font-weight:700;color:var(--success-light);">${formatNumber(c.delivered)}</div>
              <div style="font-size:10px;color:var(--text-muted);">Delivered</div>
            </div>
            <div style="text-align:center;padding:8px;background:var(--danger-bg);border-radius:var(--radius-sm);">
              <div style="font-size:16px;font-weight:700;color:var(--danger-light);">${c.failed}</div>
              <div style="font-size:10px;color:var(--text-muted);">Failed</div>
            </div>
            <div style="text-align:center;padding:8px;background:rgba(99,102,241,0.1);border-radius:var(--radius-sm);">
              <div style="font-size:16px;font-weight:700;color:var(--primary-light);">${formatCurrency(c.cost)}</div>
              <div style="font-size:10px;color:var(--text-muted);">Cost</div>
            </div>
          </div>

          ${c.sent > 0 ? `
            <div style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
                <span style="color:var(--text-muted);">Delivery Rate</span>
                <span style="font-weight:600;color:${deliveryRate > 95 ? 'var(--success)' : 'var(--warning)'};">${deliveryRate}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width:${deliveryRate}%;background:linear-gradient(90deg,var(--success),var(--success-light))"></div>
              </div>
            </div>
          ` : ''}

          ${c.scheduledAt ? `<div style="font-size:12px;color:var(--warning-light);">🕐 Scheduled: ${formatDateTime(c.scheduledAt)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  window.showCreatePanel = function() {
    document.getElementById('createPanel').scrollIntoView({ behavior: 'smooth' });
  };

  populateSelects();
  if (preSelectedTemplate) onTemplateChange();
  goStep(1);
  renderCampaigns();
})();
