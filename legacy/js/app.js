// ===== THEME INITIALIZATION & MULTI-TAB SYNC =====
(function() {
  const saved = localStorage.getItem('sms_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  // Sync theme in real-time across ALL open browser tabs
  window.addEventListener('storage', function(e) {
    if (e.key === 'sms_theme' && e.newValue) {
      document.documentElement.setAttribute('data-theme', e.newValue);
      const btn = document.getElementById('themeToggleBtn');
      if (btn) {
        btn.setAttribute('data-theme', e.newValue);
        btn.title = e.newValue === 'light' 
          ? '👁️ Light Mode active — Click for Dark Mode' 
          : '👁️ Dark Mode active — Click for Light Mode';
        btn.classList.remove('blinking');
        void btn.offsetWidth;
        btn.classList.add('blinking');
      }
    }
  });
})();

// ===== SHARED APP STATE =====
const AppState = {
  contacts: JSON.parse(localStorage.getItem('sms_contacts') || '[]'),
  templates: JSON.parse(localStorage.getItem('sms_templates') || '[]'),
  campaigns: JSON.parse(localStorage.getItem('sms_campaigns') || '[]'),
  messages: JSON.parse(localStorage.getItem('sms_messages') || '[]'),
  inboundMessages: JSON.parse(localStorage.getItem('sms_inbound_messages') || '[]'),
  settings: JSON.parse(localStorage.getItem('sms_settings') || '{"provider":"twilio","accountSid":"","apiKey":"","authToken":"","from":"","balance":15.00}'),
};

// ===== SEED DEMO DATA =====
function seedDemoData() {
  if (localStorage.getItem('sms_demo_cleared') === 'true') {
    return; // User explicitly cleared dummy data
  }
  if (AppState.contacts.length === 0) {
    const names = ['Alice Johnson','Bob Martinez','Carol Williams','David Lee','Eva Brown','Frank Davis','Grace Wilson','Henry Moore','Iris Taylor','Jack Anderson','Karen Thomas','Liam Jackson','Mia White','Noah Harris','Olivia Martin','Paul Garcia','Quinn Rodriguez','Rachel Lewis','Sam Walker','Tina Hall'];
    AppState.contacts = names.map((name, i) => ({
      id: 'c' + (i+1),
      name,
      phone: `+1${(Math.floor(Math.random()*9000000)+1000000).toString().padStart(10,'0')}`,
      email: name.split(' ')[0].toLowerCase() + '@example.com',
      group: ['VIP Customers','Newsletter','Prospects','Re-engagement'][i % 4],
      status: 'active',
      createdAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
    }));
    saveContacts();
  }

  if (AppState.templates.length === 0) {
    AppState.templates = [
      { id: 't1', name: 'Welcome Message', content: 'Hi {{name}}, welcome to {{company}}! Your account is ready. Reply STOP to opt-out.', category: 'Onboarding', chars: 90, credits: 1, createdAt: new Date().toISOString() },
      { id: 't2', name: 'Flash Sale Alert', content: '🔥 {{name}}, FLASH SALE! Up to {{discount}}% off everything. Shop now: {{link}} Reply STOP to opt-out.', category: 'Promotions', chars: 105, credits: 1, createdAt: new Date().toISOString() },
      { id: 't3', name: 'OTP Verification', content: 'Your verification code is {{otp}}. Valid for 10 minutes. Do not share. Reply STOP to opt-out.', category: 'Transactional', chars: 91, credits: 1, createdAt: new Date().toISOString() },
      { id: 't4', name: 'Appointment Reminder', content: 'Hi {{name}}, reminder: your appointment is on {{date}} at {{time}}. Call us at {{phone}} to reschedule. Reply STOP to opt-out.', category: 'Reminders', chars: 125, credits: 1, createdAt: new Date().toISOString() },
      { id: 't5', name: 'Order Shipped', content: 'Good news {{name}}! Your order #{{order_id}} has shipped. Track it here: {{tracking_link}} Est. delivery: {{date}}. Reply STOP to opt-out.', category: 'Transactional', chars: 140, credits: 1, createdAt: new Date().toISOString() },
    ];
    saveTemplates();
  }

  if (AppState.campaigns.length === 0) {
    AppState.campaigns = [
      { id: 'camp1', name: 'Summer Flash Sale', templateId: 't2', group: 'VIP Customers', status: 'completed', sent: 250, delivered: 241, failed: 9, cost: 1.98, scheduledAt: null, createdAt: new Date(Date.now() - 7*86400000).toISOString() },
      { id: 'camp2', name: 'New User Welcome Wave', templateId: 't1', group: 'Newsletter', status: 'completed', sent: 500, delivered: 489, failed: 11, cost: 3.95, scheduledAt: null, createdAt: new Date(Date.now() - 3*86400000).toISOString() },
      { id: 'camp3', name: 'Win-Back Campaign', templateId: 't4', group: 'Re-engagement', status: 'running', sent: 180, delivered: 175, failed: 5, cost: 1.42, scheduledAt: null, createdAt: new Date(Date.now() - 1*86400000).toISOString() },
      { id: 'camp4', name: 'Q4 Promo Blast', templateId: 't2', group: 'Newsletter', status: 'scheduled', sent: 0, delivered: 0, failed: 0, cost: 0, scheduledAt: new Date(Date.now() + 2*86400000).toISOString(), createdAt: new Date().toISOString() },
    ];
    saveCampaigns();
  }

  if (AppState.messages.length === 0) {
    const statuses = ['delivered','delivered','delivered','delivered','failed','pending'];
    AppState.messages = Array.from({length: 40}, (_, i) => ({
      id: 'm' + (i+1),
      to: AppState.contacts[i % AppState.contacts.length]?.phone || '+11234567890',
      name: AppState.contacts[i % AppState.contacts.length]?.name || 'Unknown',
      campaignId: ['camp1','camp2','camp3'][i % 3],
      templateId: ['t1','t2','t3','t4','t5'][i % 5],
      status: statuses[i % statuses.length],
      provider: 'twilio',
      cost: 0.0079,
      sentAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      segments: 1,
    }));
    saveMessages();
  }

  if (!AppState.inboundMessages || AppState.inboundMessages.length === 0) {
    const c1 = AppState.contacts[0] || { id: 'c1', name: 'Alice Johnson', phone: '+12025550143' };
    const c2 = AppState.contacts[1] || { id: 'c2', name: 'Bob Martinez', phone: '+12025550187' };
    const c3 = AppState.contacts[2] || { id: 'c3', name: 'Carol Williams', phone: '+12025550192' };
    const c4 = AppState.contacts[3] || { id: 'c4', name: 'David Lee', phone: '+12025550124' };
    const c5 = AppState.contacts[4] || { id: 'c5', name: 'Eva Brown', phone: '+12025550165' };

    AppState.inboundMessages = [
      // Thread with Alice Johnson (Customer Inquiry & Purchase)
      { id: 'in_1', contactId: c1.id, contactName: c1.name, phone: c1.phone, direction: 'outbound', text: '🔥 Hi Alice! Flash sale today: 40% off everything with code VIP40. Reply STOP to opt-out.', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), read: true, status: 'delivered' },
      { id: 'in_2', contactId: c1.id, contactName: c1.name, phone: c1.phone, direction: 'inbound', text: 'Hi! Does this code work for the new autumn arrivals as well?', timestamp: new Date(Date.now() - 3.5 * 3600000).toISOString(), read: true },
      { id: 'in_3', contactId: c1.id, contactName: c1.name, phone: c1.phone, direction: 'outbound', text: 'Yes Alice, it applies to autumn arrivals too! Let us know if you need any sizing help.', timestamp: new Date(Date.now() - 3.2 * 3600000).toISOString(), read: true, status: 'delivered' },
      { id: 'in_4', contactId: c1.id, contactName: c1.name, phone: c1.phone, direction: 'inbound', text: 'Awesome! Placing my order now, thanks for the quick reply! 🎉', timestamp: new Date(Date.now() - 2.8 * 3600000).toISOString(), read: true },

      // Thread with Bob Martinez (Appointment Confirmation)
      { id: 'in_5', contactId: c2.id, contactName: c2.name, phone: c2.phone, direction: 'outbound', text: 'Hi Bob, reminder: your consultation is scheduled for tomorrow at 2:00 PM EST. Reply YES to confirm or RESCHEDULE.', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), read: true, status: 'delivered' },
      { id: 'in_6', contactId: c2.id, contactName: c2.name, phone: c2.phone, direction: 'inbound', text: 'YES, confirming! Can I bring an extra colleague to the call?', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), read: false },

      // Thread with Carol Williams (Transactional)
      { id: 'in_7', contactId: c3.id, contactName: c3.name, phone: c3.phone, direction: 'outbound', text: 'Your verification security code is 849201. Valid for 10 minutes. Do not share.', timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), read: true, status: 'delivered' },
      { id: 'in_8', contactId: c3.id, contactName: c3.name, phone: c3.phone, direction: 'inbound', text: 'Thank you, verified successfully.', timestamp: new Date(Date.now() - 11.9 * 3600000).toISOString(), read: true },

      // Thread with David Lee (TCPA STOP Opt-out)
      { id: 'in_9', contactId: c4.id, contactName: c4.name, phone: c4.phone, direction: 'outbound', text: 'Hi David, special offer for you! Check out our new platform features. Reply STOP to opt-out.', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), read: true, status: 'delivered' },
      { id: 'in_10', contactId: c4.id, contactName: c4.name, phone: c4.phone, direction: 'inbound', text: 'STOP', timestamp: new Date(Date.now() - 22 * 3600000).toISOString(), read: true, isOptOut: true },
      { id: 'in_11', contactId: c4.id, contactName: c4.name, phone: c4.phone, direction: 'outbound', text: 'You have successfully opted out. You will receive no further marketing SMS. Reply START to resubscribe.', timestamp: new Date(Date.now() - 22 * 3600000 + 5000).toISOString(), read: true, status: 'delivered' },

      // Thread with Eva Brown (Active Unread Question!)
      { id: 'in_12', contactId: c5.id, contactName: c5.name, phone: c5.phone, direction: 'outbound', text: 'Welcome Eva! Your US SMS workspace is active. Need help getting started?', timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(), read: true, status: 'delivered' },
      { id: 'in_13', contactId: c5.id, contactName: c5.name, phone: c5.phone, direction: 'inbound', text: 'Hi! Could you send me the API docs for Twilio 2-way webhook integration?', timestamp: new Date(Date.now() - 22 * 60000).toISOString(), read: false },
    ];
    saveInboundMessages();
  }
}

function saveContacts() { localStorage.setItem('sms_contacts', JSON.stringify(AppState.contacts)); }
function saveTemplates() { localStorage.setItem('sms_templates', JSON.stringify(AppState.templates)); }
function saveCampaigns() { localStorage.setItem('sms_campaigns', JSON.stringify(AppState.campaigns)); }
function saveMessages() { localStorage.setItem('sms_messages', JSON.stringify(AppState.messages)); }
function saveInboundMessages() { localStorage.setItem('sms_inbound_messages', JSON.stringify(AppState.inboundMessages)); }
function saveSettings() { localStorage.setItem('sms_settings', JSON.stringify(AppState.settings)); }

window.clearAllDummyData = function() {
  if (confirm('🗑️ Delete ALL dummy data (contacts, campaigns, messages, and threads) to start a fresh clean test?')) {
    localStorage.setItem('sms_demo_cleared', 'true');
    AppState.contacts = [];
    AppState.campaigns = [];
    AppState.messages = [];
    AppState.inboundMessages = [];
    saveContacts();
    saveCampaigns();
    saveMessages();
    saveInboundMessages();
    if (typeof showToast === 'function') {
      showToast('🗑️ Workspace cleaned! All dummy data deleted.', 'success');
    }
    setTimeout(() => location.reload(), 500);
  }
};

window.restoreDemoData = function() {
  localStorage.removeItem('sms_demo_cleared');
  AppState.contacts = [];
  AppState.templates = [];
  AppState.campaigns = [];
  AppState.messages = [];
  AppState.inboundMessages = [];
  saveContacts();
  saveTemplates();
  saveCampaigns();
  saveMessages();
  saveInboundMessages();
  seedDemoData();
  if (typeof showToast === 'function') {
    showToast('🔄 Demo data restored!', 'info');
  }
  setTimeout(() => location.reload(), 500);
};

// ===== TOAST SYSTEM =====
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: '💬' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== MODAL SYSTEM =====
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('open');
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ===== NAVIGATION =====
function setActiveNav(page) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

// ===== UTILITY FUNCTIONS =====
function formatNumber(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}

function formatCurrency(n, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function generateId(prefix = 'id') {
  return prefix + Date.now() + Math.random().toString(36).substr(2, 5);
}

function csvToContacts(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return {
      id: generateId('c'),
      name: obj.name || obj.full_name || obj.fullname || 'Unknown',
      phone: obj.phone || obj.mobile || obj.number || '',
      email: obj.email || '',
      group: obj.group || obj.segment || 'Default',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }).filter(c => c.phone);
}

function countChars(text) {
  const len = text.length;
  const credits = len <= 160 ? 1 : Math.ceil(len / 153);
  return { chars: len, credits };
}

function renderVariableTags(text) {
  return text.replace(/\{\{(\w+)\}\}/g, '<span class="chip active" style="padding:2px 8px;font-size:11px;">{{$1}}</span>');
}

// ===== SIDEBAR BUILDER =====
function buildSidebar(activePage) {
  const unreadInbound = (AppState.inboundMessages || []).filter(m => !m.read && m.direction === 'inbound').length;

  const navItems = [
    { page: 'index', icon: '📊', label: 'Dashboard' },
    { page: 'inbox', icon: '💬', label: '2-Way Inbox', badge: unreadInbound > 0 ? unreadInbound : null },
    { page: 'contacts', icon: '👥', label: 'Contacts', badge: AppState.contacts.length },
    { page: 'templates', icon: '📝', label: 'Templates' },
    { page: 'campaigns', icon: '📤', label: 'Campaigns' },
    { page: 'pricing', icon: '💰', label: '2-Way Pricing' },
    { page: 'reports', icon: '📋', label: 'Reports & Logs' },
    { page: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">📱</div>
      <div class="logo-text">
        <span class="logo-name">BulkSend</span>
        <span class="logo-sub">US 2-Way SMS</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Main Menu</div>
      ${navItems.slice(0,5).map(item => `
        <a href="${item.page === 'index' ? 'index.html' : item.page + '.html'}"
           class="nav-item ${activePage === item.page ? 'active' : ''}"
           data-page="${item.page}">
          <div class="nav-icon">${item.icon}</div>
          <span>${item.label}</span>
          ${item.badge ? `<span class="nav-badge" style="${item.page === 'inbox' ? 'background:var(--primary);color:#fff;font-weight:700;' : ''}">${item.badge}</span>` : ''}
        </a>
      `).join('')}
      <div class="nav-section-label">Tools</div>
      ${navItems.slice(5).map(item => `
        <a href="${item.page}.html"
           class="nav-item ${activePage === item.page ? 'active' : ''}"
           data-page="${item.page}">
          <div class="nav-icon">${item.icon}</div>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar">A</div>
        <div class="user-info">
          <div class="user-name">Admin User</div>
          <div class="user-role">Super Admin</div>
        </div>
        <span style="color:var(--text-muted);font-size:16px;">⚙️</span>
      </div>
    </div>
  `;
}

// ===== THEME MANAGEMENT =====
function getActiveTheme() {
  return document.documentElement.getAttribute('data-theme') || localStorage.getItem('sms_theme') || 'dark';
}

function applyTheme(theme, notify = false) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sms_theme', theme);

  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.setAttribute('data-theme', theme);
    btn.title = theme === 'light'
      ? '👁️ Light Mode active — Click to switch to Dark Mode'
      : '👁️ Dark Mode active — Click to switch to Light Mode';

    // Micro-animation: eye blink
    btn.classList.remove('blinking');
    void btn.offsetWidth; // trigger reflow
    btn.classList.add('blinking');
  }

  if (notify && typeof showToast === 'function') {
    showToast(theme === 'light' ? '☀️ Switched to Light Mode' : '🌙 Switched to Dark Mode', 'info');
  }

  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

function toggleTheme() {
  const current = getActiveTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next, true);
}

// ===== TOPBAR BUILDER =====
function buildTopbar(title, subtitle = '') {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  const currentTheme = getActiveTheme();

  topbar.innerHTML = `
    <div class="topbar-title">
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    <div class="topbar-actions">
      <div class="topbar-search">
        <span style="color:var(--text-muted);font-size:14px;">🔍</span>
        <input type="text" placeholder="Search..." id="globalSearch" />
      </div>

      <!-- Eye Theme Toggle Button (Dark / Light Mode) -->
      <button class="icon-btn theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" 
              data-theme="${currentTheme}"
              title="${currentTheme === 'light' ? '👁️ Light Mode active — Click to switch to Dark Mode' : '👁️ Dark Mode active — Click to switch to Light Mode'}" 
              aria-label="Toggle Dark and Light Mode">
        <span class="theme-eye-icon" style="font-size:18px;line-height:1;display:inline-flex;align-items:center;justify-content:center;transition:transform 0.25s ease;">👁️</span>
      </button>

      <div class="icon-btn notif-btn" title="Notifications">
        🔔<span class="notif-dot"></span>
      </div>
      <div class="icon-btn" title="Help">❓</div>
    </div>
  `;
}

// ===== INIT =====
seedDemoData();
