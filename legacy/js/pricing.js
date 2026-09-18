// ===== TWO-WAY SMS PRICING PAGE =====
(function() {
  buildSidebar('pricing');
  buildTopbar('2-Way API Pricing', 'Compare US Two-Way SMS providers — Inbound & Outbound conversational rates');

  // Strictly Two-Way SMS Providers (AWS SNS removed - one-way only)
  const providers = [
    {
      id: 'twilio',
      name: 'Twilio Two-Way',
      icon: '🔴',
      color: '#f22f46',
      usPriceSMS: 0.0079,
      inboundPriceSMS: 0.0075,
      numberMonthly: 1.15,
      freeTrial: '$15 trial credit',
      recommended: true,
      rating: 5,
      features: [
        'Full Two-Way Conversations API',
        'Inbound Webhooks & Delivery Receipts',
        'TCPA STOP/START Auto-Responder',
        'US 10DLC TCR Native Self-Serve',
        '99.95% SLA Uptime',
        'MMS & Toll-Free Inbound',
      ],
      cons: ['Slightly higher rate than wholesale'],
      website: 'https://www.twilio.com/docs/sms/two-way-messaging',
      docsUrl: 'https://www.twilio.com/docs/sms',
      setupFee: 'None',
      support: '24/7 Email + Chat',
      bestFor: 'Enterprise 2-Way Conversational',
    },
    {
      id: 'plivo',
      name: 'Plivo 2-Way',
      icon: '🟢',
      color: '#00b74a',
      usPriceSMS: 0.0055,
      inboundPriceSMS: 0.0035,
      numberMonthly: 0.80,
      freeTrial: '$0.10 credit',
      recommended: false,
      rating: 4,
      features: [
        'Lowest 2-Way US SMS rates',
        'Inbound Webhook XML callbacks',
        'PHLO Visual Workflow Builder',
        'Direct carrier connections',
        'Automated opt-out keywords',
      ],
      cons: ['Smaller support team than Twilio'],
      website: 'https://www.plivo.com/sms/two-way-sms/',
      docsUrl: 'https://www.plivo.com/docs/',
      setupFee: 'None',
      support: 'Email + Ticket',
      bestFor: 'High-volume two-way at scale',
    },
    {
      id: 'bandwidth',
      name: 'Bandwidth 2-Way',
      icon: '🔵',
      color: '#3b82f6',
      usPriceSMS: 0.0040,
      inboundPriceSMS: 0.0020,
      numberMonthly: 0.50,
      freeTrial: 'Contact sales',
      recommended: false,
      rating: 4,
      features: [
        'Tier 1 Direct US Carrier Network',
        'Lowest inbound latency (<1s)',
        'Wholesale per-message pricing',
        'A2P 10DLC Direct Registry Access',
        'Toll-free & local 2-way numbers',
      ],
      cons: ['Enterprise volume commitment required'],
      website: 'https://www.bandwidth.com/messaging/two-way-sms/',
      docsUrl: 'https://dev.bandwidth.com',
      setupFee: 'None',
      support: 'Dedicated CSM',
      bestFor: 'Wholesale / Carrier-direct (>100k/mo)',
    },
    {
      id: 'vonage',
      name: 'Vonage (Nexmo)',
      icon: '🟣',
      color: '#7c3aed',
      usPriceSMS: 0.0065,
      inboundPriceSMS: 0.0060,
      numberMonthly: 1.25,
      freeTrial: '€2 credit',
      recommended: false,
      rating: 4,
      features: [
        'Global Two-Way Messages API',
        'Inbound Webhook delivery callbacks',
        'Conversational fallback (SMS / WhatsApp)',
        'Number Insights & TCPA tools',
      ],
      cons: ['Dashboard slightly less modern'],
      website: 'https://www.vonage.com/communications-apis/messages/',
      docsUrl: 'https://developer.vonage.com',
      setupFee: 'None',
      support: '24/7 Support',
      bestFor: 'Multi-channel Conversational',
    },
    {
      id: 'sinch',
      name: 'Sinch Conversation',
      icon: '🟡',
      color: '#eab308',
      usPriceSMS: 0.0058,
      inboundPriceSMS: 0.0050,
      numberMonthly: 1.00,
      freeTrial: '$5 credit',
      recommended: false,
      rating: 4,
      features: [
        'Conversation API for 2-Way Messaging',
        'Smart channel routing & fallbacks',
        'Inbound webhooks with rich payload',
        'Automated responses & chatbot ready',
      ],
      cons: ['Newer US carrier footprint'],
      website: 'https://www.sinch.com/products/apis/messaging/conversation/',
      docsUrl: 'https://developers.sinch.com',
      setupFee: 'None',
      support: '24/7 Email',
      bestFor: 'AI-assisted Conversational SMS',
    },
  ];

  window.setActiveProvider = function(id) {
    const prov = providers.find(p => p.id === id);
    if (!prov) return;
    AppState.settings.provider = id;
    saveSettings();
    showToast(`✅ Active Two-Way Provider set to ${prov.name}!`, 'success');
  };

  // RENDER TABLE
  function renderTable() {
    const table = document.getElementById('providerTable');
    table.innerHTML = providers.map(p => `
      <div class="provider-row ${p.recommended ? 'recommended' : ''}">
        <div class="provider-name">
          <div class="provider-icon" style="background:${p.color}20;">${p.icon}</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--text-primary);">${p.name}</div>
            ${p.recommended ? '<span class="badge badge-primary" style="font-size:10px;">⭐ Recommended</span>' : ''}
          </div>
        </div>
        <div>
          <span style="font-size:16px;font-weight:800;color:${p.color};">$${p.usPriceSMS.toFixed(4)}</span>
          <span style="font-size:11px;color:var(--text-muted);">/out</span>
        </div>
        <div>
          <span style="font-size:15px;font-weight:700;color:var(--success-light);">$${p.inboundPriceSMS.toFixed(4)}</span>
          <span style="font-size:11px;color:var(--text-muted);">/in</span>
        </div>
        <div style="font-size:13px;color:var(--text-secondary);">$${p.numberMonthly.toFixed(2)}/mo</div>
        <div style="font-size:12px;color:var(--text-secondary);">${p.bestFor}</div>
        <div style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="setActiveProvider('${p.id}')">Select</button>
        </div>
      </div>
    `).join('');
  }

  // CALCULATOR
  let pricingChart = null;

  window.updateCalc = function() {
    const volume = parseInt(document.getElementById('volumeSlider').value);
    const credits = parseInt(document.getElementById('msgLength').value);
    document.getElementById('volumeDisplay').textContent = volume.toLocaleString() + ' Outbound SMS';

    // Model ~12% inbound conversational reply rate
    const estimatedReplies = Math.round(volume * 0.12);

    const sorted = [...providers].sort((a, b) => {
      const costA = (volume * credits * a.usPriceSMS) + (estimatedReplies * a.inboundPriceSMS) + a.numberMonthly;
      const costB = (volume * credits * b.usPriceSMS) + (estimatedReplies * b.inboundPriceSMS) + b.numberMonthly;
      return costA - costB;
    });

    document.getElementById('calcBreakdown').innerHTML = sorted.map((p, i) => {
      const outCost = volume * credits * p.usPriceSMS;
      const inCost = estimatedReplies * p.inboundPriceSMS;
      const totalCost = outCost + inCost + p.numberMonthly;
      const cheapest = i === 0;

      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:${cheapest ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)'};border:1px solid ${cheapest ? 'rgba(16,185,129,0.3)' : 'var(--border)'};border-radius:var(--radius-sm);">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="provider-icon" style="width:28px;height:28px;font-size:14px;background:${p.color}20;">${p.icon}</div>
            <div>
              <span style="font-weight:700;font-size:13px;color:var(--text-primary);">${p.name}</span>
              ${cheapest ? '<span class="badge badge-success" style="margin-left:6px;font-size:10px;">🏆 Cheapest 2-Way</span>' : ''}
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Out: $${outCost.toFixed(2)} • In (${estimatedReplies.toLocaleString()} replies): $${inCost.toFixed(2)} • 10DLC No: $${p.numberMonthly.toFixed(2)}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px;font-weight:800;color:${cheapest ? 'var(--success-light)' : 'var(--text-primary)'};">$${totalCost.toFixed(2)}/mo</div>
            <div style="font-size:11px;color:var(--text-muted);">$${((totalCost / (volume + estimatedReplies))).toFixed(4)}/all-in msg</div>
          </div>
        </div>
      `;
    }).join('');

    // Update chart
    const volumes = [1000, 5000, 10000, 25000, 50000, 100000];
    if (pricingChart) pricingChart.destroy();

    const colors = ['#f22f46', '#00b74a', '#3b82f6', '#7c3aed', '#eab308'];

    pricingChart = new Chart(document.getElementById('pricingChart'), {
      type: 'line',
      data: {
        labels: volumes.map(v => v >= 1000 ? (v/1000) + 'K' : v),
        datasets: providers.map((p, i) => ({
          label: p.name,
          data: volumes.map(v => {
            const replies = Math.round(v * 0.12);
            return ((v * credits * p.usPriceSMS) + (replies * p.inboundPriceSMS) + p.numberMonthly).toFixed(2);
          }),
          borderColor: colors[i],
          backgroundColor: colors[i] + '15',
          tension: 0.3,
          pointRadius: 3,
          borderWidth: p.recommended ? 3 : 1.5,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } }
        },
        scales: {
          x: { ticks: { color: '#475569' }, grid: { color: 'rgba(99,102,241,0.06)' } },
          y: {
            ticks: { color: '#475569', callback: v => '$' + v },
            grid: { color: 'rgba(99,102,241,0.06)' },
            beginAtZero: true
          }
        }
      }
    });
  };

  // FEATURE CARDS
  function renderFeatureCards() {
    document.getElementById('featureCards').innerHTML = providers.map(p => `
      <div class="pricing-card ${p.recommended ? 'recommended' : ''}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div class="provider-logo" style="background:${p.color}20;">${p.icon}</div>
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary);">${p.name}</div>
            <div style="font-size:11px;color:var(--text-muted);">${p.support}</div>
          </div>
        </div>
        <div class="price-amount">$${p.usPriceSMS.toFixed(4)}<span class="price-unit">/outbound</span></div>
        <div style="font-size:12px;font-weight:600;color:var(--success-light);margin-top:2px;">+$${p.inboundPriceSMS.toFixed(4)}/inbound reply</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;margin-top:4px;">10DLC Number: $${p.numberMonthly.toFixed(2)}/mo · Free: ${p.freeTrial}</div>
        <ul class="feature-list">
          ${p.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <div style="padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm);font-size:11px;color:var(--text-muted);margin-bottom:12px;">
          ✨ Best for: <strong style="color:var(--text-secondary);">${p.bestFor}</strong>
        </div>
        <button onclick="setActiveProvider('${p.id}')" class="btn ${p.recommended ? 'btn-primary' : 'btn-outline'} w-full" style="justify-content:center;">
          ${p.recommended ? '⭐ Set as Active 2-Way Provider' : 'Select Provider'}
        </button>
      </div>
    `).join('');
  }

  renderTable();
  renderFeatureCards();
  updateCalc();
})();
