// ===== TWO-WAY SMS INBOX & CONVERSATIONS =====
(function() {
  buildSidebar('inbox');
  buildTopbar('2-Way Inbox & Conversations', 'Direct bidirectional SMS with US contacts — Twilio Inbound Webhook');

  let activeContactId = null;
  let currentFilter = 'all';

  // Check URL param for pre-selected contact (e.g., inbox.html?contact=c1)
  const urlParams = new URLSearchParams(window.location.search);
  const paramContact = urlParams.get('contact');

  function getConversations() {
    const map = new Map();

    // Group all inbound & outbound messages by contactId
    (AppState.inboundMessages || []).forEach(msg => {
      const cid = msg.contactId;
      if (!map.has(cid)) {
        const contact = AppState.contacts.find(c => c.id === cid) || {
          id: cid,
          name: msg.contactName || 'Unknown Contact',
          phone: msg.phone || '+15005550000',
          group: 'Direct Inbound',
          status: 'active'
        };
        map.set(cid, {
          contact,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          isOptOut: contact.status === 'opted_out'
        });
      }

      const conv = map.get(cid);
      conv.messages.push(msg);
      if (msg.direction === 'inbound' && !msg.read) {
        conv.unreadCount++;
      }
      if (msg.isOptOut || msg.text?.trim().toUpperCase() === 'STOP') {
        conv.isOptOut = true;
      }
    });

    // Sort messages chronologically per conversation
    map.forEach(conv => {
      conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      conv.lastMessage = conv.messages[conv.messages.length - 1];
    });

    // Convert to array and sort by most recent message descending
    const list = Array.from(map.values());
    list.sort((a, b) => {
      const tA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const tB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return tB - tA;
    });

    return list;
  }

  function renderThreads() {
    const listEl = document.getElementById('threadsList');
    const searchVal = document.getElementById('threadSearch')?.value.toLowerCase() || '';
    let convs = getConversations();

    // Update global unread badge in filter header
    const totalUnread = (AppState.inboundMessages || []).filter(m => !m.read && m.direction === 'inbound').length;
    const unreadEl = document.getElementById('unreadCountBadge');
    if (unreadEl) unreadEl.textContent = totalUnread;

    // Apply Filter
    if (currentFilter === 'unread') {
      convs = convs.filter(c => c.unreadCount > 0);
    } else if (currentFilter === 'optout') {
      convs = convs.filter(c => c.isOptOut);
    }

    // Apply Search
    if (searchVal) {
      convs = convs.filter(c => 
        c.contact.name.toLowerCase().includes(searchVal) ||
        c.contact.phone.includes(searchVal) ||
        (c.lastMessage?.text || '').toLowerCase().includes(searchVal)
      );
    }

    if (convs.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding:40px 16px;">
          <div style="font-size:28px;margin-bottom:8px;">💬</div>
          <div style="font-size:13px;font-weight:600;color:var(--text-secondary);">No conversations found</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Try changing the filter or simulating an incoming SMS</div>
        </div>
      `;
      return;
    }

    // Select default conversation if none selected
    if (!activeContactId && convs.length > 0) {
      activeContactId = paramContact || convs[0].contact.id;
    }

    listEl.innerHTML = convs.map(conv => {
      const c = conv.contact;
      const last = conv.lastMessage;
      const isActive = c.id === activeContactId;
      const initials = c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const prefix = last ? (last.direction === 'inbound' ? '📩 ' : '↩ ') : '';
      const textPreview = last ? (prefix + last.text) : 'No messages yet';

      return `
        <div class="thread-item ${isActive ? 'active' : ''} ${conv.unreadCount > 0 ? 'unread' : ''}"
             onclick="selectConversation('${c.id}')">
          <div class="thread-avatar">
            ${initials}
            ${conv.unreadCount > 0 ? '<div class="thread-unread-dot"></div>' : ''}
          </div>
          <div class="thread-content">
            <div class="thread-top">
              <span class="thread-name">${c.name}</span>
              <span class="thread-time">${last ? timeAgo(last.timestamp) : ''}</span>
            </div>
            <div class="thread-phone">${c.phone} ${conv.isOptOut ? '<span style="color:#f87171;font-size:10px;">[OPT-OUT]</span>' : ''}</div>
            <div class="thread-snippet">${textPreview}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderActiveChat() {
    const convs = getConversations();
    const active = convs.find(c => c.contact.id === activeContactId);

    const nameEl = document.getElementById('activeChatName');
    const metaEl = document.getElementById('activeChatMeta');
    const streamEl = document.getElementById('messagesStream');
    const badgeEl = document.getElementById('inboxApiBadge');
    const provBadgeEl = document.getElementById('activeProviderBadge');

    const providerName = (AppState.settings.provider || 'Twilio').toUpperCase();
    if (badgeEl) badgeEl.textContent = `● ${providerName} 2-Way API`;
    if (provBadgeEl) provBadgeEl.textContent = `● ${providerName} 2-Way Inbound`;

    if (!active) {
      nameEl.textContent = 'Select a conversation';
      metaEl.textContent = 'Choose a contact to read and reply';
      streamEl.innerHTML = `
        <div class="empty-state" style="margin:auto;">
          <div style="font-size:36px;margin-bottom:12px;">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose any contact on the left to view bidirectional message history.</p>
        </div>
      `;
      return;
    }

    const c = active.contact;
    nameEl.innerHTML = `
      ${c.name} 
      <span style="font-size:12px;font-weight:normal;color:var(--text-secondary);">(${c.phone})</span>
      ${active.isOptOut ? '<span class="badge badge-danger" style="margin-left:6px;">🛑 Opted Out (TCPA)</span>' : '<span class="badge badge-success" style="margin-left:6px;">Active 2-Way</span>'}
    `;
    metaEl.textContent = `Group: ${c.group || 'Direct'} • Carrier Channel: US 10DLC +1 (500) 555-0006`;

    // Mark active contact's inbound messages as read
    let updatedRead = false;
    AppState.inboundMessages.forEach(m => {
      if (m.contactId === c.id && m.direction === 'inbound' && !m.read) {
        m.read = true;
        updatedRead = true;
      }
    });
    if (updatedRead) {
      saveInboundMessages();
      buildSidebar('inbox'); // update sidebar badge live
    }

    let streamHtml = '';

    if (active.isOptOut) {
      streamHtml += `
        <div class="optout-banner">
          <span>🛑</span>
          <div>
            <strong>TCPA Compliance Alert:</strong> Recipient replied "STOP". Outbound marketing messages are blocked to prevent federal fines. Only re-opt-in confirmations ("START") can reactivate messaging.
          </div>
        </div>
      `;
    }

    streamHtml += active.messages.map(msg => {
      const isInbound = msg.direction === 'inbound';
      const timeStr = formatDateTime(msg.timestamp);

      if (isInbound) {
        return `
          <div class="msg-bubble-wrap inbound">
            <div class="msg-bubble inbound">
              ${msg.text}
            </div>
            <div class="msg-meta">
              <span>👤 ${c.name} (Receiver)</span>
              <span>•</span>
              <span>${timeStr}</span>
              ${msg.isOptOut ? '<span style="color:#ef4444;font-weight:bold;">[TCPA STOP]</span>' : ''}
            </div>
          </div>
        `;
      } else {
        return `
          <div class="msg-bubble-wrap outbound">
            <div class="msg-bubble outbound">
              ${msg.text}
            </div>
            <div class="msg-meta">
              <span>Sent via ${providerName}</span>
              <span>•</span>
              <span>${timeStr}</span>
              <span style="color:var(--success-light);">✓✓ Delivered</span>
            </div>
          </div>
        `;
      }
    }).join('');

    streamEl.innerHTML = streamHtml;
    streamEl.scrollTop = streamEl.scrollHeight;
  }

  window.selectConversation = function(contactId) {
    activeContactId = contactId;
    renderThreads();
    renderActiveChat();
  };

  window.setThreadFilter = function(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.threads-filter .chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderThreads();
  };

  window.filterThreads = function() {
    renderThreads();
  };

  window.handleComposerInput = function(e) {
    const text = e.target.value;
    const len = text.length;
    const credits = len <= 160 ? 1 : Math.ceil(len / 153);
    const cost = (credits * 0.0079).toFixed(4);
    const charEl = document.getElementById('composerCharCount');
    if (charEl) {
      charEl.textContent = `${len} / 160 characters (${credits} SMS credit • $${cost})`;
    }
  };

  window.handleKeyDown = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReplyFromComposer();
    }
  };

  window.insertQuickReply = function(text) {
    const input = document.getElementById('replyInput');
    const convs = getConversations();
    const active = convs.find(c => c.contact.id === activeContactId);
    const contactName = active ? active.contact.name.split(' ')[0] : 'there';

    input.value = text.replace('{{name}}', contactName);
    input.focus();
    handleComposerInput({ target: input });
  };

  window.sendReplyFromComposer = function() {
    const input = document.getElementById('replyInput');
    const text = input.value.trim();
    if (!text) return;

    const convs = getConversations();
    const active = convs.find(c => c.contact.id === activeContactId);
    if (!active) {
      showToast('Please select a contact to reply to', 'warning');
      return;
    }

    if (active.isOptOut && !confirm('⚠️ This recipient replied STOP. Sending messages to opted-out users may violate TCPA regulations. Are you sure?')) {
      return;
    }

    const c = active.contact;
    const providerName = (AppState.settings.provider || 'twilio');

    // Create Outbound Record in InboundMessages store
    const newMsg = {
      id: generateId('in_reply_'),
      contactId: c.id,
      contactName: c.name,
      phone: c.phone,
      direction: 'outbound',
      text,
      timestamp: new Date().toISOString(),
      read: true,
      status: 'delivered'
    };

    // Also add to global AppState.messages for reporting analytics
    AppState.messages.unshift({
      id: generateId('m_2way_'),
      to: c.phone,
      name: c.name,
      campaignId: '2way_direct',
      templateId: 'direct_reply',
      status: 'delivered',
      provider: providerName,
      cost: 0.0079,
      sentAt: new Date().toISOString(),
      segments: 1
    });

    AppState.inboundMessages.push(newMsg);
    saveInboundMessages();
    saveMessages();

    input.value = '';
    handleComposerInput({ target: input });
    showToast(`✅ Reply sent to ${c.name} via ${providerName.toUpperCase()} 2-Way API!`, 'success');

    renderThreads();
    renderActiveChat();
  };

  // ===== INBOUND SIMULATOR =====
  window.openSimulateModal = function() {
    const select = document.getElementById('simSenderSelect');
    select.innerHTML = AppState.contacts.slice(0, 10).map(c => `
      <option value="${c.id}" ${c.id === activeContactId ? 'selected' : ''}>${c.name} (${c.phone})</option>
    `).join('');
    openModal('simulateModal');
  };

  window.fillSimText = function(text) {
    document.getElementById('simCustomText').value = text;
  };

  window.triggerSimulatedInbound = function() {
    const contactId = document.getElementById('simSenderSelect').value;
    const customText = document.getElementById('simCustomText').value.trim() || 'Hi, can you provide more information?';
    const contact = AppState.contacts.find(c => c.id === contactId);

    if (!contact) {
      showToast('Contact not found', 'error');
      return;
    }

    injectInboundMessage(contact, customText);
    closeModal('simulateModal');
  };

  window.simulateReplyToActive = function() {
    const convs = getConversations();
    const active = convs.find(c => c.contact.id === activeContactId);
    if (!active) {
      showToast('Please select a conversation first', 'warning');
      return;
    }

    const sampleReplies = [
      "Thanks for following up! Can you send me the invoice?",
      "YES, please confirm my appointment.",
      "Got it, appreciate the fast support response!",
      "Is there a discount code available for new customers?"
    ];
    const replyText = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];
    injectInboundMessage(active.contact, replyText);
  };

  function injectInboundMessage(contact, text) {
    const isStop = text.trim().toUpperCase() === 'STOP';
    const isStart = text.trim().toUpperCase() === 'START';

    const inboundMsg = {
      id: generateId('sim_in_'),
      contactId: contact.id,
      contactName: contact.name,
      phone: contact.phone,
      direction: 'inbound',
      text,
      timestamp: new Date().toISOString(),
      read: contact.id === activeContactId,
      isOptOut: isStop
    };

    AppState.inboundMessages.push(inboundMsg);

    // Auto-responder logic for TCPA STOP
    if (isStop) {
      contact.status = 'opted_out';
      saveContacts();

      const autoReply = {
        id: generateId('auto_stop_'),
        contactId: contact.id,
        contactName: contact.name,
        phone: contact.phone,
        direction: 'outbound',
        text: 'You have successfully opted out. You will receive no further marketing messages. Reply START to resubscribe.',
        timestamp: new Date(Date.now() + 1500).toISOString(),
        read: true,
        status: 'delivered'
      };
      setTimeout(() => {
        AppState.inboundMessages.push(autoReply);
        saveInboundMessages();
        renderThreads();
        renderActiveChat();
      }, 1500);

      showToast(`🛑 TCPA STOP received from ${contact.name}! Contact auto-unsubscribed.`, 'warning');
    } else if (isStart) {
      contact.status = 'active';
      saveContacts();
      showToast(`✅ ${contact.name} replied START and has resubscribed!`, 'success');
    } else {
      showToast(`📩 New Inbound SMS from ${contact.name}: "${text.substring(0, 35)}..."`, 'info');
    }

    saveInboundMessages();
    buildSidebar('inbox');
    renderThreads();
    renderActiveChat();
  }

  // Initial render
  renderThreads();
  renderActiveChat();

})();
