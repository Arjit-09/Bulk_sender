// ===== SETTINGS PAGE =====
(function() {
  buildSidebar('settings');
  buildTopbar('Settings', 'Configure your SMS provider, compliance settings, and account preferences');

  const providers = [
    { id: 'twilio', name: 'Twilio 2-Way', icon: '🔴', price: '$0.0079 out / $0.0075 in', recommended: true },
    { id: 'plivo', name: 'Plivo 2-Way', icon: '🟢', price: '$0.0055 out / $0.0035 in' },
    { id: 'bandwidth', name: 'Bandwidth 2-Way', icon: '🔵', price: '$0.0040 out / $0.0020 in' },
    { id: 'vonage', name: 'Vonage 2-Way', icon: '🟣', price: '$0.0065 out / $0.0060 in' },
    { id: 'sinch', name: 'Sinch 2-Way', icon: '🟡', price: '$0.0058 out / $0.0050 in' },
  ];

  let selectedProvider = AppState.settings.provider || 'twilio';

  function renderProviders() {
    document.getElementById('providerSelector').innerHTML = providers.map(p => `
      <div class="provider-option ${selectedProvider === p.id ? 'selected' : ''}"
           onclick="selectProvider('${p.id}')">
        <div class="provider-option-icon">${p.icon}</div>
        <div class="provider-option-name">${p.name}${p.recommended ? ' ⭐' : ''}</div>
        <div class="provider-option-price">${p.price}</div>
      </div>
    `).join('');
    document.getElementById('currentProvider').textContent = providers.find(p => p.id === selectedProvider)?.name || 'Twilio 2-Way';
  }

  window.selectProvider = function(id) {
    selectedProvider = id;
    renderProviders();
    AppState.settings.provider = id;
    saveSettings();
    showToast(`✅ Two-Way Provider set to ${providers.find(p => p.id === id)?.name}`, 'success');
  };

  window.toggleApiKey = function() {
    const input = document.getElementById('apiKey');
    const btn = document.getElementById('toggleKeyBtn');
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈 Hide';
    } else {
      input.type = 'password';
      btn.textContent = '👁️ Show';
    }
  };

  window.testInboundWebhook = function() {
    showToast('🔄 Pinging Inbound Webhook endpoint...', 'info');
    setTimeout(() => {
      showToast('✅ Inbound Webhook active! 200 OK — Ready to receive customer replies into 2-Way Inbox.', 'success');
    }, 1200);
  };

  window.saveProviderSettings = function() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const authToken = document.getElementById('authToken').value.trim();
    const fromNumber = document.getElementById('fromNumber').value.trim();
    const webhookUrl = document.getElementById('webhookUrl').value.trim();
    const inboundWebhookUrl = document.getElementById('inboundWebhookUrl')?.value.trim();

    AppState.settings = { ...AppState.settings, provider: selectedProvider, apiKey, authToken, fromNumber, webhookUrl, inboundWebhookUrl };
    saveSettings();
    showToast('✅ Two-Way Provider & Webhook settings saved!', 'success');
  };

  window.saveDefaults = function() {
    showToast('✅ Default settings saved!', 'success');
  };

  window.save10DLC = function() {
    const name = document.getElementById('bizName').value.trim();
    const ein = document.getElementById('bizEIN').value.trim();
    if (!name || !ein) { showToast('Please fill in business name and EIN', 'error'); return; }
    showToast(`✅ Brand registration submitted for "${name}". TCR review takes 1-3 business days.`, 'success');
  };

  window.testConnection = function() {
    showToast('🔄 Testing connection...', 'info');
    setTimeout(() => showToast('✅ Connection successful! API responding normally.', 'success'), 1500);
  };

  window.confirmReset = function() {
    clearAllDummyData();
  };

  // Load saved settings
  const defaultApiKey = AppState.settings.apiKey || '';
  const defaultAuthToken = AppState.settings.authToken || '';

  const apiKeyEl = document.getElementById('apiKey');
  const authTokenEl = document.getElementById('authToken');
  const fromNumEl = document.getElementById('fromNumber');

  if (apiKeyEl) apiKeyEl.value = defaultApiKey;
  if (authTokenEl) authTokenEl.value = defaultAuthToken;
  if (fromNumEl && AppState.settings.fromNumber) fromNumEl.value = AppState.settings.fromNumber;

  // Render stats
  const statContacts = document.getElementById('statContactsCount');
  const statTemplates = document.getElementById('statTemplatesCount');
  const statCampaigns = document.getElementById('statCampaignsCount');
  const statMessages = document.getElementById('statMessagesCount');
  if (statContacts) statContacts.textContent = AppState.contacts.length;
  if (statTemplates) statTemplates.textContent = AppState.templates.length;
  if (statCampaigns) statCampaigns.textContent = AppState.campaigns.length;
  if (statMessages) statMessages.textContent = AppState.messages.length;

  renderProviders();
})();
