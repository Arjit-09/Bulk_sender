// ===== TEMPLATES PAGE =====
(function() {
  buildSidebar('templates');
  buildTopbar('Templates', 'Build reusable SMS message templates with dynamic variables');

  let selectedTemplate = null;
  let filterCat = 'All';

  const catColors = {
    Promotions: '#f59e0b', Transactional: '#10b981',
    Onboarding: '#6366f1', Reminders: '#06b6d4', Alerts: '#ef4444'
  };

  function render() {
    const grid = document.getElementById('templateGrid');
    const list = filterCat === 'All' ? AppState.templates : AppState.templates.filter(t => t.category === filterCat);

    if (list.length === 0) {
      grid.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No templates yet</h3>
        <p>Create your first SMS template to get started</p>
        <button class="btn btn-primary" onclick="openModal('templateModal')">＋ Create Template</button>
      </div>`;
      return;
    }

    grid.innerHTML = list.map(t => {
      const vars = [...(t.content.match(/\{\{(\w+)\}\}/g) || [])];
      const isSelected = selectedTemplate?.id === t.id;
      const color = catColors[t.category] || '#6366f1';
      return `
        <div class="template-card ${isSelected ? 'selected' : ''}" onclick="selectTemplate('${t.id}')">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <span class="badge" style="background:${color}20;color:${color};border-color:${color}40;">${t.category}</span>
            <span style="font-size:11px;color:var(--text-muted);">${formatDate(t.createdAt)}</span>
          </div>
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">${t.name}</div>
          <div class="template-preview">${t.content.substring(0, 100)}${t.content.length > 100 ? '...' : ''}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap;">
            ${vars.slice(0,4).map(v => `<span class="variable-tag">${v}</span>`).join('')}
            ${vars.length > 4 ? `<span style="font-size:11px;color:var(--text-muted);">+${vars.length-4} more</span>` : ''}
          </div>
          <div style="display:flex;gap:10px;margin-top:12px;font-size:11px;color:var(--text-muted);">
            <span>📏 ${t.content.length} chars</span>
            <span>💳 ${Math.ceil(t.content.length / 160)} credit${Math.ceil(t.content.length / 160) > 1 ? 's' : ''}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  window.selectTemplate = function(id) {
    selectedTemplate = AppState.templates.find(t => t.id === id);
    if (!selectedTemplate) return;
    render();

    // Update preview panel
    document.getElementById('phoneMockupText').innerHTML = renderVariableTags(selectedTemplate.content);
    document.getElementById('templateMeta').style.display = 'block';

    const chars = selectedTemplate.content.length;
    const credits = Math.ceil(chars / 160);
    document.getElementById('previewChars').textContent = chars;
    document.getElementById('previewCredits').textContent = credits;

    const vars = [...new Set([...(selectedTemplate.content.match(/\{\{(\w+)\}\}/g) || [])])];
    document.getElementById('previewVariables').innerHTML = vars.length > 0 ? `
      <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">Variables detected:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${vars.map(v => `<span class="variable-tag">${v}</span>`).join('')}
      </div>
    ` : `<div style="font-size:12px;color:var(--text-muted);">No variables — static message</div>`;
  };

  window.filterTemplates = function(cat, el) {
    filterCat = cat;
    document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    render();
  };

  window.updateCharCount = function(text) {
    const len = text.length;
    const credits = len <= 160 ? 1 : Math.ceil(len / 153);
    const remaining = len <= 160 ? 160 - len : 153 - (len % 153);
    const color = len > 160 ? 'var(--warning)' : len > 140 ? 'var(--accent)' : 'var(--text-muted)';
    document.getElementById('charCount').innerHTML =
      `<span style="color:${color}">${len} chars · ${remaining} remaining · ${credits} credit${credits > 1 ? 's' : ''}</span>`;
  };

  window.insertVar = function(varName) {
    const ta = document.getElementById('tplContent');
    const pos = ta.selectionStart;
    const val = ta.value;
    ta.value = val.slice(0, pos) + `{{${varName}}}` + val.slice(pos);
    ta.focus();
    updateCharCount(ta.value);
  };

  window.saveTemplate = function() {
    const name = document.getElementById('tplName').value.trim();
    const content = document.getElementById('tplContent').value.trim();
    const category = document.getElementById('tplCategory').value;
    const editId = document.getElementById('editTemplateId').value;

    if (!name || !content) { showToast('Name and content are required', 'error'); return; }
    if (content.length > 480) { showToast('Template too long (max 480 chars / 3 credits)', 'error'); return; }

    if (editId) {
      const idx = AppState.templates.findIndex(t => t.id === editId);
      if (idx !== -1) {
        AppState.templates[idx] = { ...AppState.templates[idx], name, content, category, updatedAt: new Date().toISOString() };
        showToast(`✅ Template "${name}" updated!`, 'success');
      }
    } else {
      const tpl = { id: generateId('t'), name, content, category, createdAt: new Date().toISOString() };
      AppState.templates.unshift(tpl);
      showToast(`✅ Template "${name}" created!`, 'success');
    }

    saveTemplates();
    closeModal('templateModal');
    document.getElementById('editTemplateId').value = '';
    document.getElementById('tplName').value = '';
    document.getElementById('tplContent').value = '';
    document.getElementById('templateModalTitle').textContent = '➕ New Template';
    render();
  };

  window.editSelectedTemplate = function() {
    if (!selectedTemplate) return;
    document.getElementById('editTemplateId').value = selectedTemplate.id;
    document.getElementById('tplName').value = selectedTemplate.name;
    document.getElementById('tplContent').value = selectedTemplate.content;
    document.getElementById('tplCategory').value = selectedTemplate.category;
    document.getElementById('templateModalTitle').textContent = '✏️ Edit Template';
    updateCharCount(selectedTemplate.content);
    openModal('templateModal');
  };

  window.deleteSelectedTemplate = function() {
    if (!selectedTemplate) return;
    AppState.templates = AppState.templates.filter(t => t.id !== selectedTemplate.id);
    saveTemplates();
    selectedTemplate = null;
    document.getElementById('phoneMockupText').textContent = 'Select a template to preview...';
    document.getElementById('templateMeta').style.display = 'none';
    render();
    showToast('Template deleted', 'success');
  };

  window.useTemplate = function() {
    if (!selectedTemplate) return;
    localStorage.setItem('_campaign_template', selectedTemplate.id);
    window.location.href = 'campaigns.html';
  };

  render();
})();
