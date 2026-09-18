// ===== CONTACTS PAGE =====
(function() {
  buildSidebar('contacts');
  buildTopbar('Contacts', 'Manage your US contact list — import, segment, and organize');

  let filtered = [...AppState.contacts];
  let selected = new Set();

  function render() {
    // Stats
    const groups = [...new Set(AppState.contacts.map(c => c.group))];
    document.getElementById('totalContacts').textContent = formatNumber(AppState.contacts.length);
    document.getElementById('activeContacts').textContent = formatNumber(AppState.contacts.filter(c => c.status === 'active').length);
    document.getElementById('totalGroups').textContent = groups.length;

    // Group filter options
    const groupFilter = document.getElementById('groupFilter');
    const existing = [...groupFilter.options].map(o => o.value);
    groups.forEach(g => {
      if (!existing.includes(g)) {
        const opt = document.createElement('option');
        opt.value = g; opt.textContent = g;
        groupFilter.appendChild(opt);
      }
    });

    // Group Tabs
    const tabsEl = document.getElementById('groupTabs');
    tabsEl.innerHTML = ['All', ...groups].map(g => `
      <button class="chip ${g === (window._activeGroup || 'All') ? 'active' : ''}"
              onclick="setGroupTab('${g}')">${g}
        <span style="color:var(--text-muted);margin-left:2px;">(${g === 'All' ? AppState.contacts.length : AppState.contacts.filter(c => c.group === g).length})</span>
      </button>
    `).join('');

    // Groups Overview
    document.getElementById('groupsOverview').innerHTML = groups.map(g => {
      const count = AppState.contacts.filter(c => c.group === g).length;
      const pct = Math.round((count / AppState.contacts.length) * 100);
      return `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
            <span style="color:var(--text-secondary);">🏷️ ${g}</span>
            <span style="font-weight:600;color:var(--text-primary);">${count}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');

    // Table
    renderTable();
  }

  window.setGroupTab = function(group) {
    window._activeGroup = group;
    render();
    filterContacts();
  };

  window.filterContacts = function() {
    const search = document.getElementById('contactSearch').value.toLowerCase();
    const group = document.getElementById('groupFilter').value;
    const status = document.getElementById('statusFilter').value;
    const activeTab = window._activeGroup || 'All';

    filtered = AppState.contacts.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search) || c.phone.includes(search);
      const matchGroup = !group || c.group === group;
      const matchStatus = !status || c.status === status;
      const matchTab = activeTab === 'All' || c.group === activeTab;
      return matchSearch && matchGroup && matchStatus && matchTab;
    });

    renderTable();
  };

  function renderTable() {
    const tbody = document.getElementById('contactsTableBody');
    document.getElementById('contactCount').textContent = `Showing ${filtered.length} of ${AppState.contacts.length} contacts`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No contacts found</td></tr>`;
      return;
    }

    const avatarColors = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6'];

    tbody.innerHTML = filtered.map((c, i) => `
      <tr>
        <td><input type="checkbox" ${selected.has(c.id) ? 'checked' : ''} onchange="toggleSelect('${c.id}',this.checked)" /></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar" style="background:${avatarColors[i % 6]};color:white;">${c.name[0]}</div>
            <div>
              <div style="font-weight:600;font-size:13px;">${c.name}</div>
              <div style="font-size:11px;color:var(--text-muted);">${c.email}</div>
            </div>
          </div>
        </td>
        <td><span class="font-mono" style="font-size:12px;">${c.phone}</span></td>
        <td><span class="chip" style="cursor:default;">${c.group}</span></td>
        <td><span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}">
          ${c.status === 'active' ? '● Active' : '✕ Opted Out'}
        </span></td>
        <td style="color:var(--text-muted);font-size:12px;">${formatDate(c.createdAt)}</td>
        <td>
          <div class="flex gap-4">
            <button class="btn btn-ghost btn-sm btn-icon-only" onclick="deleteContact('${c.id}')" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.toggleSelect = function(id, checked) {
    if (checked) selected.add(id); else selected.delete(id);
    document.getElementById('bulkDeleteBtn').style.display = selected.size > 0 ? 'flex' : 'none';
  };

  window.toggleSelectAll = function(cb) {
    filtered.forEach(c => { if (cb.checked) selected.add(c.id); else selected.delete(c.id); });
    renderTable();
    document.getElementById('bulkDeleteBtn').style.display = selected.size > 0 ? 'flex' : 'none';
  };

  window.deleteContact = function(id) {
    AppState.contacts = AppState.contacts.filter(c => c.id !== id);
    saveContacts();
    filtered = filtered.filter(c => c.id !== id);
    render();
    showToast('Contact deleted', 'success');
  };

  window.bulkDelete = function() {
    AppState.contacts = AppState.contacts.filter(c => !selected.has(c.id));
    saveContacts();
    selected.clear();
    filtered = [...AppState.contacts];
    render();
    showToast(`Contacts deleted`, 'success');
  };

  window.addContact = function() {
    const name = document.getElementById('newContactName').value.trim();
    const phone = document.getElementById('newContactPhone').value.trim();
    const email = document.getElementById('newContactEmail').value.trim();
    const group = document.getElementById('newContactGroup').value;

    if (!name || !phone) { showToast('Name and phone are required', 'error'); return; }

    const fullPhone = phone.startsWith('+1') ? phone : '+1' + phone.replace(/\D/g, '');
    const contact = { id: generateId('c'), name, phone: fullPhone, email, group, status: 'active', createdAt: new Date().toISOString() };
    AppState.contacts.unshift(contact);
    saveContacts();
    filtered = [...AppState.contacts];
    closeModal('addContactModal');
    render();
    showToast(`✅ Contact "${name}" added!`, 'success');
  };

  window.handleCSVUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const contacts = csvToContacts(e.target.result);
      if (contacts.length === 0) { showToast('No valid contacts found in CSV', 'error'); return; }
      AppState.contacts = [...contacts, ...AppState.contacts];
      saveContacts();
      filtered = [...AppState.contacts];
      render();
      showToast(`✅ Imported ${contacts.length} contacts from CSV!`, 'success');
    };
    reader.readAsText(file);
  };

  // Drag & Drop
  const dz = document.getElementById('dropZone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) {
      const input = document.getElementById('csvInput');
      const dt = new DataTransfer(); dt.items.add(file);
      input.files = dt.files;
      handleCSVUpload({ target: { files: [file] } });
    }
  });

  window.exportContacts = function() {
    const rows = [['Name','Phone','Email','Group','Status']];
    AppState.contacts.forEach(c => rows.push([c.name, c.phone, c.email, c.group, c.status]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'contacts_export.csv';
    a.click();
    showToast('✅ Contacts exported!', 'success');
  };

  window.downloadSampleCSV = function() {
    const sample = `name,phone,email,group\nAlice Johnson,+14155552671,alice@example.com,VIP Customers\nBob Smith,+14155552672,bob@example.com,Newsletter`;
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(sample);
    a.download = 'sample_contacts.csv';
    a.click();
  };

  window._activeGroup = 'All';
  render();
})();
