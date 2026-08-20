/**
 * AURA ROYAL PERFUMERY INDIA - Frontend Application Logic & FDE Operations Inspector
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatStream = document.getElementById('chat-stream');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const agentModeToggle = document.getElementById('agent-mode-toggle');
  const sendBtnLabel = document.getElementById('send-btn-label');
  const catalogGrid = document.getElementById('catalog-grid');
  
  // FDE Drawer Elements
  const btnFdeOps = document.getElementById('toggle-fde-drawer');
  const fdeDrawer = document.getElementById('fde-drawer');
  const closeDrawer = document.getElementById('close-drawer');
  const btnFlushCache = document.getElementById('btn-flush-cache');
  const cacheStatusMsg = document.getElementById('cache-status-msg');

  // AutoGen Elements
  const btnTriggerAutoGen = document.getElementById('btn-trigger-autogen');
  const btnChipAutoGen = document.getElementById('btn-chip-autogen');
  const autogenOutputBox = document.getElementById('autogen-output-box');
  const autogenTraceContent = document.getElementById('autogen-trace-content');

  // Order OMS Inspector Elements
  const btnRefreshOMS = document.getElementById('btn-refresh-oms');
  const omsOrdersTbody = document.getElementById('oms-orders-tbody');
  const omsStockTbody = document.getElementById('oms-stock-tbody');

  // Gateway Inspector Elements
  const lbReplicasContainer = document.getElementById('lb-replicas-container');
  const circuitBreakerContainer = document.getElementById('circuit-breaker-container');
  const btnToggleOutage = document.getElementById('btn-toggle-outage');
  const btnRestoreGateway = document.getElementById('btn-restore-gateway');

  // Evals & Redteam Elements
  const btnRunEvals = document.getElementById('btn-run-evals');
  const btnRunRedteam = document.getElementById('btn-run-redteam');
  const evalsOutputBox = document.getElementById('evals-results-box');
  const evalsTraceContent = document.getElementById('evals-results-content');

  // Telemetry Metric Elements
  const mRequests = document.getElementById('m-requests');
  const mCacheRate = document.getElementById('m-cache-rate');
  const mTokens = document.getElementById('m-tokens');
  const mCost = document.getElementById('m-cost');
  const traceTbody = document.getElementById('trace-tbody');

  // Stat Pills
  const statLatency = document.getElementById('stat-latency');
  const statCache = document.getElementById('stat-cache');
  const statCost = document.getElementById('stat-cost');

  // Register Drawer Controls
  if (btnFdeOps && fdeDrawer) {
    btnFdeOps.addEventListener('click', (e) => {
      e.preventDefault();
      fdeDrawer.classList.add('open');
      fetchTelemetry();
    });
  }

  if (closeDrawer && fdeDrawer) {
    closeDrawer.addEventListener('click', (e) => {
      e.preventDefault();
      fdeDrawer.classList.remove('open');
    });
  }

  // Initial Loaders
  fetchCatalog();
  fetchOMSData();
  fetchGatewayStatus();
  fetchTelemetry();
  setInterval(fetchTelemetry, 3000); // Polling Telemetry metrics

  // Mode Toggle Switch Listener
  // Global 1-Click Quick Chat Trigger Handler for Naive Users
  window.triggerQuickChat = function(promptText) {
    if (!promptText || !chatInput || !chatForm) return;
    chatInput.value = promptText;
    
    // Auto-enable Agent mode if prompt involves custom formula creation or order placement
    if (promptText.toLowerCase().includes('custom') || promptText.toLowerCase().includes('bespoke')) {
      if (agentModeToggle) {
        agentModeToggle.checked = true;
        if (sendBtnLabel) sendBtnLabel.textContent = "🤖 Run Autonomous Agent";
        const agentModeText = document.getElementById('agent-mode-text');
        if (agentModeText) agentModeText.textContent = "🤖 ReAct Agent Mode (Tool Calling Enabled)";
      }
    }
    chatForm.dispatchEvent(new Event('submit'));
  };

  // Agent Mode Toggle Listener with Text Updates
  const agentModeText = document.getElementById('agent-mode-text');
  if (agentModeToggle) {
    agentModeToggle.addEventListener('change', () => {
      if (agentModeToggle.checked) {
        if (sendBtnLabel) sendBtnLabel.textContent = "🤖 Run Autonomous Agent";
        if (agentModeText) agentModeText.textContent = "🤖 ReAct Agent Mode (Tool Calling Enabled)";
      } else {
        if (sendBtnLabel) sendBtnLabel.textContent = "✨ Send Request";
        if (agentModeText) agentModeText.textContent = "⚡ Standard Sommelier Mode (Sub-3ms RAG)";
      }
    });
  }

  // Human-in-the-Loop (HITL) Handoff Modal Elements
  const btnHumanEscalate = document.getElementById('btn-human-escalate');
  const hitlModal = document.getElementById('hitl-modal');
  const closeHitlModal = document.getElementById('close-hitl-modal');
  const hitlForm = document.getElementById('hitl-form');
  const hitlInput = document.getElementById('hitl-input');
  const hitlChatStream = document.getElementById('hitl-chat-stream');
  const hitlTicketId = document.getElementById('hitl-ticket-id');

  if (btnHumanEscalate && hitlModal) {
    btnHumanEscalate.addEventListener('click', async () => {
      hitlModal.classList.remove('hidden');
      const ticketNum = Math.floor(1000 + Math.random() * 9000);
      if (hitlTicketId) hitlTicketId.textContent = `TICKET-HUMAN-${ticketNum}`;

      try {
        const res = await fetch('/api/hitl/escalate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: "Customer requested live human specialist handoff", context: "AI Olfactory Concierge Session" })
        });
        const data = await res.json();
        if (data.ticketId && hitlTicketId) hitlTicketId.textContent = data.ticketId;
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (closeHitlModal && hitlModal) {
    closeHitlModal.addEventListener('click', () => {
      hitlModal.classList.add('hidden');
    });
  }

  if (hitlForm && hitlChatStream && hitlInput) {
    hitlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = hitlInput.value.trim();
      if (!text) return;

      const userDiv = document.createElement('div');
      userDiv.style.cssText = "background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 0.7rem 0.9rem; border-radius: 6px; font-size: 0.85rem;";
      userDiv.innerHTML = `<strong style="color: var(--gold-primary)">You:</strong> ${escapeHtml(text)}`;
      hitlChatStream.appendChild(userDiv);
      hitlInput.value = '';
      hitlChatStream.scrollTop = hitlChatStream.scrollHeight;

      setTimeout(() => {
        const specialistDiv = document.createElement('div');
        specialistDiv.style.cssText = "background: rgba(192, 132, 252, 0.08); border-left: 3px solid var(--accent-purple); padding: 0.8rem 1rem; border-radius: 6px; font-size: 0.85rem;";
        specialistDiv.innerHTML = `
          <div style="font-weight: 700; color: var(--accent-purple); font-size: 0.82rem; margin-bottom: 0.2rem;">👤 Vikramaditya Sharma (Senior Specialist)</div>
          <div>Thank you for your message regarding <em>"${escapeHtml(text)}"</em>. I am processing your bespoke request directly with our Jaipur Master Distiller. I will reserve your private batch slot immediately!</div>
        `;
        hitlChatStream.appendChild(specialistDiv);
        hitlChatStream.scrollTop = hitlChatStream.scrollHeight;
      }, 900);
    });
  }

  // ---------------------------------------------------------------------------
  // INTERACTIVE QUICK ORDER OPERATIONS (PLACE, TRACK, CANCEL) HANDLERS
  // ---------------------------------------------------------------------------
  const btnQuickPlaceOrder = document.getElementById('btn-quick-place-order');
  const btnQuickTrackOrders = document.getElementById('btn-quick-track-orders');
  const btnQuickCancelOrder = document.getElementById('btn-quick-cancel-order');

  const modalPlaceOrder = document.getElementById('modal-place-order');
  const closePlaceOrderModal = document.getElementById('close-place-order-modal');
  const formInstantOrder = document.getElementById('form-instant-order');

  const modalCancelOrder = document.getElementById('modal-cancel-order');
  const closeCancelOrderModal = document.getElementById('close-cancel-order-modal');
  const cancelOrdersListContainer = document.getElementById('cancel-orders-list-container');

  // 1. Instant Place Order Catalog Generator & Modal Trigger
  function renderInstantOrderCatalogInChat() {
    const aiMsgId = 'msg-' + Date.now();
    const div = document.createElement('div');
    div.className = 'message msg-ai';
    div.id = aiMsgId;

    const products = [
      { name: "Imperial Kannauj Rose & Suede", price: "₹19,500", family: "Floral Luxury", notes: "Kannauj Rose, Lychee" },
      { name: "Monsoon Vetiver & Rain Mint", price: "₹16,000", family: "Fresh Earthy", notes: "Earthy Khus Vetiver, Wild Mint" },
      { name: "Solar Malabar Citrus & Vetiver", price: "₹14,500", family: "Citrus Fresh", notes: "Malabar Lemon Zest, Calabrian Bergamot" },
      { name: "Royal Oud & Mysore Sandalwood", price: "₹18,500", family: "Royal Woody Oriental", notes: "Assam Oud, Kashmir Cardamom" },
      { name: "Royal Kashmir Saffron & Amber", price: "₹21,000", family: "Gourmand Oriental", notes: "Kashmir Saffron, Bourbon Vanilla" },
      { name: "Smoked Cardamom & Incense", price: "₹22,500", family: "Spicy Amber", notes: "Kerala Black Cardamom, Temple Incense" }
    ];

    let cardsHtml = `<div class="rec-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 0.9rem; margin-top: 1rem;">`;
    
    products.forEach(p => {
      cardsHtml += `
        <div class="rec-card" style="background: rgba(15, 20, 32, 0.95); border: 1px solid rgba(226, 192, 133, 0.35); border-radius: 12px; padding: 1.1rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 6px 20px rgba(0,0,0,0.5);">
          <div>
            <div style="font-family: var(--font-serif); color: var(--gold-primary); font-size: 1.05rem; font-weight: 700; margin-bottom: 0.2rem;">
              ${escapeHtml(p.name)}
            </div>
            <div style="font-size: 0.92rem; color: #FFF; font-weight: 700; margin-bottom: 0.4rem;">
              ${p.price} <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: normal;">• ${escapeHtml(p.family)}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.6rem;">
              🌸 ${escapeHtml(p.notes)}
            </div>
          </div>

          <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.8rem; margin-top: 0.4rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem;">
              <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Quantity:</span>
              <div style="display: flex; align-items: center; gap: 0.6rem; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.2rem 0.6rem;">
                <button type="button" onclick="changeCardQty(this, -1)" style="background: none; border: none; color: var(--gold-primary); font-weight: 800; cursor: pointer; font-size: 1rem; line-height: 1;">-</button>
                <span class="card-qty-val" style="font-size: 0.88rem; font-weight: 700; font-family: var(--font-mono); color: #fff;">1</span>
                <button type="button" onclick="changeCardQty(this, 1)" style="background: none; border: none; color: var(--gold-primary); font-weight: 800; cursor: pointer; font-size: 1rem; line-height: 1;">+</button>
              </div>
            </div>

            <button class="btn-order-instant" data-perfume="${escapeHtml(p.name)}" style="width: 100%; background: linear-gradient(135deg, var(--gold-primary), #B48847); color: #000; font-weight: 800; border: none; padding: 0.65rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: all 0.2s ease;">
              🛒 1-Click Buy (${p.price})
            </button>
          </div>
        </div>
      `;
    });
    cardsHtml += `</div>`;

    div.innerHTML = `
      <div class="msg-avatar" style="background: linear-gradient(135deg, var(--gold-primary), #B48847); color: #000; font-weight: 800; border: 2px solid rgba(255,255,255,0.3); font-size: 0.78rem;">AURA</div>
      <div class="msg-bubble" style="background: rgba(226, 192, 133, 0.06); border: 1px solid rgba(226, 192, 133, 0.25); border-radius: 12px; padding: 1.2rem;">
        <div style="font-weight: 700; color: var(--gold-primary); font-family: var(--font-serif); font-size: 1.05rem; margin-bottom: 0.4rem;">
          🛍️ AURA Atelier Instant Order Catalog
        </div>
        <p style="color: var(--text-main); font-size: 0.88rem; margin-bottom: 0.8rem; line-height: 1.5;">
          Select your desired royal fragrance below, adjust quantity with <strong>-</strong> and <strong>+</strong>, and click <strong>1-Click Buy</strong> to confirm instant order & dispatch!
        </p>
        ${cardsHtml}
      </div>
    `;

    if (chatStream) {
      chatStream.appendChild(div);
      chatStream.scrollTop = chatStream.scrollHeight;
    }
  }

  if (btnQuickPlaceOrder) {
    btnQuickPlaceOrder.addEventListener('click', () => {
      if (modalPlaceOrder) modalPlaceOrder.classList.remove('hidden');
      renderInstantOrderCatalogInChat();
    });
  }

  if (closePlaceOrderModal && modalPlaceOrder) {
    closePlaceOrderModal.addEventListener('click', () => {
      modalPlaceOrder.classList.add('hidden');
    });
  }

  if (formInstantOrder) {
    formInstantOrder.addEventListener('submit', (e) => {
      e.preventDefault();
      const product = document.getElementById('select-order-product').value;
      const size = document.getElementById('select-order-size').value;
      const qty = document.getElementById('input-order-qty').value;

      modalPlaceOrder.classList.add('hidden');
      
      if (agentModeToggle) {
        agentModeToggle.checked = true;
        if (sendBtnLabel) sendBtnLabel.textContent = "🤖 Run Autonomous Agent";
        if (agentModeText) agentModeText.textContent = "🤖 ReAct Agent Mode (Tool Calling Enabled)";
      }

      window.triggerQuickChat(`Place order for ${qty} x ${product} (${size})`);
    });
  }

  // 2. Instant Track Active Orders (Renders All Active Orders in Database)
  async function renderActiveOrdersTrackerInChat() {
    const aiMsgId = 'msg-' + Date.now();
    const div = document.createElement('div');
    div.className = 'message msg-ai';
    div.id = aiMsgId;

    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();

      if (!orders || orders.length === 0) {
        div.innerHTML = `
          <div class="msg-avatar" style="background: linear-gradient(135deg, var(--gold-primary), #B48847); color: #000; font-weight: 800; border: 2px solid rgba(255,255,255,0.3); font-size: 0.78rem;">AURA</div>
          <div class="msg-bubble" style="background: rgba(226, 192, 133, 0.06); border: 1px solid rgba(226, 192, 133, 0.25); border-radius: 12px; padding: 1.2rem;">
            <div style="font-weight: 700; color: var(--gold-primary); font-family: var(--font-serif); font-size: 1.05rem; margin-bottom: 0.4rem;">
              📦 Active Orders Tracker
            </div>
            <p style="color: var(--text-muted); font-size: 0.88rem;">No active customer orders found in the database.</p>
          </div>
        `;
        if (chatStream) {
          chatStream.appendChild(div);
          chatStream.scrollTop = chatStream.scrollHeight;
        }
        return;
      }

      let cardsHtml = `<div style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem;">`;

      orders.forEach(o => {
        let statusColor = 'var(--accent-cyan)';
        let statusIcon = '⚙️';
        let statusLabel = 'PROCESSING IN VAULT';
        
        if (o.status === 'SHIPPED') {
          statusColor = 'var(--accent-green)';
          statusIcon = '🚚';
          statusLabel = 'SHIPPED IN TRANSIT';
        } else if (o.status === 'DELIVERED') {
          statusColor = 'var(--gold-primary)';
          statusIcon = '✨';
          statusLabel = 'DELIVERED TO VIP RESIDENCE';
        } else if (o.status === 'CANCELLED') {
          statusColor = 'var(--accent-danger)';
          statusIcon = '❌';
          statusLabel = 'CANCELLED & REFUNDED';
        }

        cardsHtml += `
          <div style="background: rgba(15, 20, 32, 0.95); border: 1px solid rgba(226, 192, 133, 0.3); border-radius: 12px; padding: 1.1rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.4); flex-wrap: wrap; gap: 0.8rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem;">
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--gold-primary); font-size: 0.98rem;">${escapeHtml(o.orderId)}</span>
                <span style="background: rgba(255,255,255,0.06); color: ${statusColor}; border: 1px solid ${statusColor}; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 4px;">
                  ${statusIcon} ${statusLabel}
                </span>
              </div>
              <div style="font-size: 0.95rem; color: #FFF; font-weight: 700;">${escapeHtml(o.productName)} (${escapeHtml(o.size)}) x ${o.quantity || 1}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem; line-height: 1.5;">
                • Price: <strong style="color:var(--gold-primary);">${escapeHtml(o.priceInRupees || '$' + o.totalPrice)}</strong><br>
                • Carrier: <strong>${escapeHtml(o.carrier)}</strong> • Tracking: <code>${escapeHtml(o.trackingNumber)}</code><br>
                • Estimated Delivery: <strong>${new Date(o.estimatedDelivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            </div>

            <div>
              ${o.status === 'PROCESSING' ? `
                <button type="button" onclick="cancelOrderFromModal('${escapeHtml(o.orderId)}')" style="background: rgba(248, 113, 113, 0.15); border: 1px solid var(--accent-danger); color: var(--accent-danger); font-weight: 700; padding: 0.5rem 0.9rem; border-radius: 6px; font-size: 0.78rem; cursor: pointer; transition: all 0.2s ease;">
                  ❌ Cancel Order
                </button>
              ` : `
                <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 0.4rem 0.8rem; border-radius: 6px;">
                  ${statusIcon} ${escapeHtml(o.carrier)}
                </span>
              `}
            </div>
          </div>
        `;
      });

      cardsHtml += `</div>`;

      div.innerHTML = `
        <div class="msg-avatar" style="background: linear-gradient(135deg, var(--gold-primary), #B48847); color: #000; font-weight: 800; border: 2px solid rgba(255,255,255,0.3); font-size: 0.78rem;">AURA</div>
        <div class="msg-bubble" style="background: rgba(226, 192, 133, 0.06); border: 1px solid rgba(226, 192, 133, 0.25); border-radius: 12px; padding: 1.2rem;">
          <div style="font-weight: 700; color: var(--gold-primary); font-family: var(--font-serif); font-size: 1.05rem; margin-bottom: 0.4rem;">
            📦 Real-Time Active Orders Tracker (${orders.length} Total Orders Tracked)
          </div>
          <p style="color: var(--text-main); font-size: 0.88rem; margin-bottom: 0.8rem; line-height: 1.5;">
            Here is the live status of all active customer orders tracked in the relational database:
          </p>
          ${cardsHtml}
        </div>
      `;

      if (chatStream) {
        chatStream.appendChild(div);
        chatStream.scrollTop = chatStream.scrollHeight;
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (btnQuickTrackOrders) {
    btnQuickTrackOrders.addEventListener('click', async () => {
      await renderActiveOrdersTrackerInChat();
    });
  }

  // 3. Instant Cancel Order Action & Dark Mode List Generator
  if (btnQuickCancelOrder) {
    btnQuickCancelOrder.addEventListener('click', async () => {
      if (modalCancelOrder) modalCancelOrder.classList.remove('hidden');
      await renderCancellableOrders();
      await renderCancellableOrdersInChat();
    });
  }

  if (closeCancelOrderModal && modalCancelOrder) {
    closeCancelOrderModal.addEventListener('click', () => {
      modalCancelOrder.classList.add('hidden');
    });
  }

  async function renderCancellableOrders() {
    if (!cancelOrdersListContainer) return;
    cancelOrdersListContainer.innerHTML = `<div style="text-align: center; color: var(--gold-primary); padding: 1.5rem;">Fetching live relational database orders...</div>`;

    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();
      
      if (!orders || orders.length === 0) {
        cancelOrdersListContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No active orders found in database.</div>`;
        return;
      }

      let html = '';
      orders.forEach(o => {
        const isCancellable = o.status !== 'SHIPPED' && o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
        
        if (isCancellable) {
          // Active Cancellable Order (Bright Highlighted)
          html += `
            <div style="background: rgba(248, 113, 113, 0.08); border: 1px solid rgba(248, 113, 113, 0.4); border-radius: 10px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem;">
                  <span style="font-family: var(--font-mono); font-weight: 700; color: var(--gold-primary);">${escapeHtml(o.orderId)}</span>
                  <span style="background: rgba(248, 113, 113, 0.15); color: var(--accent-danger); border: 1px solid var(--accent-danger); font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 4px; font-weight: 700;">● ${escapeHtml(o.status)}</span>
                </div>
                <div style="font-size: 0.88rem; color: #FFF; font-weight: 700;">${escapeHtml(o.productName)} (${escapeHtml(o.size)})</div>
                <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.15rem;">Total: ${escapeHtml(o.priceInRupees || '$' + o.totalPrice)} • Carrier: ${escapeHtml(o.carrier)}</div>
              </div>

              <div>
                <button type="button" onclick="cancelOrderFromModal('${escapeHtml(o.orderId)}')" style="background: linear-gradient(135deg, #EF4444, #B91C1C); color: #FFF; font-weight: 800; border: none; padding: 0.55rem 1rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease;">
                  ❌ Cancel Order & Refund
                </button>
              </div>
            </div>
          `;
        } else {
          // Shipped / Non-Cancellable Order (Darkened / Dimmed Mode)
          let statusText = o.status === 'CANCELLED' ? 'ALREADY CANCELLED' : 'SHIPPED IN TRANSIT';
          html += `
            <div style="background: rgba(10, 13, 20, 0.7); border: 1px dashed rgba(255, 255, 255, 0.15); opacity: 0.6; border-radius: 10px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem;">
                  <span style="font-family: var(--font-mono); font-weight: 700; color: var(--text-muted);">${escapeHtml(o.orderId)}</span>
                  <span style="background: rgba(255,255,255,0.06); color: var(--accent-green); border: 1px solid rgba(255,255,255,0.1); font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 4px; font-weight: 700;">🔒 ${statusText}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">${escapeHtml(o.productName)} (${escapeHtml(o.size)})</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Total: ${escapeHtml(o.priceInRupees || '$' + o.totalPrice)} • Carrier: ${escapeHtml(o.carrier)}</div>
              </div>

              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); padding: 0.35rem 0.7rem; border-radius: 6px;">
                  🔒 In Transit / Non-Cancellable Now
                </span>
              </div>
            </div>
          `;
        }
      });

      cancelOrdersListContainer.innerHTML = html;
    } catch (err) {
      console.error(err);
      cancelOrdersListContainer.innerHTML = `<div style="color: var(--accent-danger); padding: 1.5rem;">Error loading orders: ${escapeHtml(err.message)}</div>`;
    }
  }

  async function renderCancellableOrdersInChat() {
    const aiMsgId = 'msg-' + Date.now();
    const div = document.createElement('div');
    div.className = 'message msg-ai';
    div.id = aiMsgId;

    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();

      if (!orders || orders.length === 0) {
        div.innerHTML = `
          <div class="msg-avatar" style="background: linear-gradient(135deg, var(--gold-primary), #B48847); color: #000; font-weight: 800; border: 2px solid rgba(255,255,255,0.3); font-size: 0.78rem;">AURA</div>
          <div class="msg-bubble" style="background: rgba(226, 192, 133, 0.06); border: 1px solid rgba(226, 192, 133, 0.25); border-radius: 12px; padding: 1.2rem;">
            <div style="font-weight: 700; color: var(--gold-primary); font-family: var(--font-serif); font-size: 1.05rem; margin-bottom: 0.4rem;">
              ❌ Order Cancellation Assistant
            </div>
            <p style="color: var(--text-muted); font-size: 0.88rem;">No active customer orders found in the database.</p>
          </div>
        `;
        if (chatStream) {
          chatStream.appendChild(div);
          chatStream.scrollTop = chatStream.scrollHeight;
        }
        return;
      }

      let cardsHtml = `<div style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem;">`;

      orders.forEach(o => {
        const isCancellable = o.status !== 'SHIPPED' && o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
        
        if (isCancellable) {
          cardsHtml += `
            <div style="background: rgba(248, 113, 113, 0.08); border: 1px solid rgba(248, 113, 113, 0.4); border-radius: 12px; padding: 1.1rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.4); flex-wrap: wrap; gap: 0.8rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem;">
                  <span style="font-family: var(--font-mono); font-weight: 700; color: var(--gold-primary); font-size: 0.95rem;">${escapeHtml(o.orderId)}</span>
                  <span style="background: rgba(248, 113, 113, 0.15); color: var(--accent-danger); border: 1px solid var(--accent-danger); font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 4px;">
                    ● ${escapeHtml(o.status)} (Cancellable)
                  </span>
                </div>
                <div style="font-size: 0.92rem; color: #FFF; font-weight: 700;">${escapeHtml(o.productName)} (${escapeHtml(o.size)})</div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
                  Total: <strong>${escapeHtml(o.priceInRupees || '$' + o.totalPrice)}</strong> • Carrier: ${escapeHtml(o.carrier)} (Code: <code>${escapeHtml(o.trackingNumber)}</code>)
                </div>
              </div>

              <div>
                <button type="button" onclick="cancelOrderFromModal('${escapeHtml(o.orderId)}')" style="background: linear-gradient(135deg, #EF4444, #B91C1C); color: #FFF; font-weight: 800; border: none; padding: 0.6rem 1.1rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: gap: 0.4rem; box-shadow: 0 0 12px rgba(248, 113, 113, 0.3); transition: all 0.2s ease;">
                  ❌ Cancel Order & Refund
                </button>
              </div>
            </div>
          `;
        } else {
          let statusTag = o.status === 'CANCELLED' ? 'ALREADY CANCELLED' : 'SHIPPED IN TRANSIT';
          cardsHtml += `
            <div style="background: rgba(10, 13, 20, 0.7); border: 1px dashed rgba(255, 255, 255, 0.15); opacity: 0.6; border-radius: 12px; padding: 1.1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.8rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem;">
                  <span style="font-family: var(--font-mono); font-weight: 700; color: var(--text-muted); font-size: 0.95rem;">${escapeHtml(o.orderId)}</span>
                  <span style="background: rgba(255, 255, 255, 0.06); color: var(--accent-green); border: 1px solid rgba(255,255,255,0.1); font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 4px;">
                    🔒 ${statusTag}
                  </span>
                </div>
                <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">${escapeHtml(o.productName)} (${escapeHtml(o.size)})</div>
                <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.2rem;">
                  Total: ${escapeHtml(o.priceInRupees || '$' + o.totalPrice)} • Carrier: ${escapeHtml(o.carrier)} (Code: <code>${escapeHtml(o.trackingNumber)}</code>)
                </div>
              </div>

              <div>
                <span style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.75rem; font-weight: 600; padding: 0.4rem 0.8rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.4rem;">
                  🔒 In Transit / Non-Cancellable Now
                </span>
              </div>
            </div>
          `;
        }
      });

      cardsHtml += `</div>`;

      div.innerHTML = `
        <div class="msg-avatar" style="background: linear-gradient(135deg, var(--gold-primary), #B48847); color: #000; font-weight: 800; border: 2px solid rgba(255,255,255,0.3); font-size: 0.78rem;">AURA</div>
        <div class="msg-bubble" style="background: rgba(226, 192, 133, 0.06); border: 1px solid rgba(226, 192, 133, 0.25); border-radius: 12px; padding: 1.2rem;">
          <div style="font-weight: 700; color: var(--accent-danger); font-family: var(--font-serif); font-size: 1.05rem; margin-bottom: 0.4rem;">
            ❌ Order Cancellation & Refund Selector
          </div>
          <p style="color: var(--text-main); font-size: 0.88rem; margin-bottom: 0.8rem; line-height: 1.5;">
            Select an active order below to cancel and issue an instant refund. Shipped orders are shown in <strong>Dark Mode</strong> as they are already in transit and cannot be cancelled online.
          </p>
          ${cardsHtml}
        </div>
      `;

      if (chatStream) {
        chatStream.appendChild(div);
        chatStream.scrollTop = chatStream.scrollHeight;
      }
    } catch (err) {
      console.error(err);
    }
  }

  window.cancelOrderFromModal = function(orderId) {
    if (modalCancelOrder) modalCancelOrder.classList.add('hidden');
    if (agentModeToggle) {
      agentModeToggle.checked = true;
      if (sendBtnLabel) sendBtnLabel.textContent = "🤖 Run Autonomous Agent";
      if (agentModeText) agentModeText.textContent = "🤖 ReAct Agent Mode (Tool Calling Enabled)";
    }
    window.triggerQuickChat(`Cancel order ${orderId}`);
  };

  // Prompt Chips Click Handlers
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      if (prompt) {
        chatInput.value = prompt;
        if (btn.classList.contains('chip-agent')) {
          agentModeToggle.checked = true;
          sendBtnLabel.textContent = "🤖 Run Autonomous Agent";
        }
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  // Global Quantity Adjuster for Retail Cards
  window.changeCardQty = function(btn, delta) {
    const container = btn.closest('div');
    if (!container) return;
    const qtyEl = container.querySelector('.card-qty-val');
    if (!qtyEl) return;
    let val = parseInt(qtyEl.textContent) || 1;
    val = Math.max(1, Math.min(10, val + delta));
    qtyEl.textContent = val;
  };

  // Global 1-Click Instant Order Button Listener
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-order-instant');
    if (btn) {
      const perfumeName = btn.getAttribute('data-perfume');
      const card = btn.closest('.rec-card');
      let qty = 1;
      if (card) {
        const qtyEl = card.querySelector('.card-qty-val');
        if (qtyEl) qty = parseInt(qtyEl.textContent) || 1;
      }
      if (perfumeName) {
        if (agentModeToggle) {
          agentModeToggle.checked = true;
          if (sendBtnLabel) sendBtnLabel.textContent = "🤖 Run Autonomous Agent";
          const agentModeText = document.getElementById('agent-mode-text');
          if (agentModeText) agentModeText.textContent = "🤖 ReAct Agent Mode (Tool Calling Enabled)";
        }
        chatInput.value = `Place order for ${qty} x ${perfumeName}`;
        chatForm.dispatchEvent(new Event('submit'));
      }
    }
  });

  // Chat Form Submission
  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = chatInput.value.trim();
      if (!query) return;

      renderUserMessage(query);
      chatInput.value = '';

      const isAgentMode = agentModeToggle ? agentModeToggle.checked : false;

      if (isAgentMode) {
        await handleAgentQuery(query);
      } else {
        await handleStandardChat(query);
      }

      // Refresh OMS & Gateway state after chat query
      setTimeout(() => {
        fetchOMSData();
        fetchGatewayStatus();
      }, 500);
    });
  }

  // Handle Standard Hybrid RAG + Gateway Chat
  async function handleStandardChat(query) {
    const aiMsgId = renderThinkingMessage();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await res.json();
      updateThinkingMessage(aiMsgId, data);
      fetchTelemetry();
    } catch (err) {
      console.error(err);
      updateErrorMessage(aiMsgId, "Failed to connect to AURA LLM Gateway.");
    }
  }

  // Handle Autonomous ReAct Multi-Agent Query
  async function handleAgentQuery(query) {
    const aiMsgId = renderThinkingMessage();

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await res.json();
      updateAgentMessage(aiMsgId, data);
      fetchTelemetry();
    } catch (err) {
      console.error(err);
      updateErrorMessage(aiMsgId, "Failed to execute Autonomous ReAct Agent.");
    }
  }

  // Cache for raw OMS state to enable instant client-side filtering
  let currentOmsOrders = [];
  let currentOmsProducts = [];

  // Fetch Live Order OMS & Relational Stock Data
  if (btnRefreshOMS) {
    btnRefreshOMS.addEventListener('click', () => {
      const icon = document.getElementById('oms-refresh-icon');
      if (icon) icon.style.transform = 'rotate(360deg)';
      fetchOMSData().finally(() => {
        setTimeout(() => { if (icon) icon.style.transform = 'none'; }, 300);
      });
    });
  }

  // Simulate Test Order Listener
  const btnSimulateOrder = document.getElementById('btn-simulate-order');
  if (btnSimulateOrder) {
    btnSimulateOrder.addEventListener('click', async () => {
      try {
        btnSimulateOrder.disabled = true;
        btnSimulateOrder.innerText = '⏳ Placing...';

        const sampleProducts = [
          "Royal Oud & Mysore Sandalwood",
          "Royal Kashmir Saffron & Amber",
          "Solar Malabar Citrus & Vetiver",
          "Imperial Kannauj Rose & Suede"
        ];
        const randomProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];

        const res = await fetch('/api/orders/place', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: randomProduct, size: "100ml", quantity: 1 })
        });
        const data = await res.json();
        if (data.success) {
          showNotification(`✨ Test Order ${data.order.orderId} Placed!`, 'success');
          await fetchOMSData();
        } else {
          showNotification(`⚠️ ${data.message}`, 'error');
        }
      } catch (err) {
        console.error(err);
      } finally {
        btnSimulateOrder.disabled = false;
        btnSimulateOrder.innerHTML = '<span>✨</span> Simulate Test Order';
      }
    });
  }

  // OMS Live Search Filter Listener
  const omsSearchInput = document.getElementById('oms-search-input');
  if (omsSearchInput) {
    omsSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      renderOrdersTable(currentOmsOrders, query);
      renderStockTable(currentOmsProducts, query);
    });
  }

  // OMS Tab View Switcher
  const omsTabBtns = document.querySelectorAll('#oms-view-tabs .oms-tab-btn');
  const omsOrdersPanel = document.getElementById('oms-orders-panel');
  const omsStockPanel = document.getElementById('oms-stock-panel');
  
  omsTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      omsTabBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'rgba(255,255,255,0.04)';
        b.style.border = '1px solid rgba(255,255,255,0.1)';
        b.style.color = 'var(--text-muted)';
      });
      btn.classList.add('active');
      btn.style.background = 'rgba(226, 192, 133, 0.15)';
      btn.style.border = '1px solid var(--gold-primary)';
      btn.style.color = 'var(--gold-primary)';

      const tab = btn.getAttribute('data-tab');
      if (tab === 'all') {
        if (omsOrdersPanel) omsOrdersPanel.style.display = 'block';
        if (omsStockPanel) omsStockPanel.style.display = 'block';
      } else if (tab === 'orders') {
        if (omsOrdersPanel) omsOrdersPanel.style.display = 'block';
        if (omsStockPanel) omsStockPanel.style.display = 'none';
      } else if (tab === 'stock') {
        if (omsOrdersPanel) omsOrdersPanel.style.display = 'none';
        if (omsStockPanel) omsStockPanel.style.display = 'block';
      }
    });
  });

  async function fetchOMSData() {
    try {
      // Fetch Orders
      const resOrders = await fetch('/api/orders');
      const orders = await resOrders.json();
      currentOmsOrders = Array.isArray(orders) ? orders : [];

      // Fetch Stock Catalog
      const resProducts = await fetch('/api/products');
      const dataProd = await resProducts.json();
      currentOmsProducts = Array.isArray(dataProd.products) ? dataProd.products : [];

      // Update KPI Metrics
      updateOmsKpis(currentOmsOrders, currentOmsProducts);

      // Render Tables with active search query if any
      const searchVal = omsSearchInput ? omsSearchInput.value.toLowerCase().trim() : '';
      renderOrdersTable(currentOmsOrders, searchVal);
      renderStockTable(currentOmsProducts, searchVal);
    } catch (err) {
      console.error('Error fetching OMS data:', err);
    }
  }

  function updateOmsKpis(orders, products) {
    const kpiOrdersCount = document.getElementById('kpi-orders-count');
    const kpiOrdersSub = document.getElementById('kpi-orders-sub');
    const kpiStockSkus = document.getElementById('kpi-stock-skus');
    const kpiStockUnits = document.getElementById('kpi-stock-units');
    const kpiStockHealth = document.getElementById('kpi-stock-health');
    const kpiStockAlerts = document.getElementById('kpi-stock-alerts');
    const badgeOrdersCount = document.getElementById('oms-orders-badge-count');
    const badgeStockCount = document.getElementById('oms-stock-badge-count');

    const totalOrders = orders.length;
    const processingCount = orders.filter(o => o.status === 'PROCESSING').length;
    const totalSkus = products.length;
    const totalUnits = products.reduce((acc, p) => acc + (p.stockCount || 0), 0);
    const lowStockCount = products.filter(p => (p.stockCount || 0) < 15).length;
    const outOfStockCount = products.filter(p => !p.inStock || p.stockCount === 0).length;

    if (kpiOrdersCount) kpiOrdersCount.innerText = totalOrders;
    if (kpiOrdersSub) kpiOrdersSub.innerText = `${processingCount} Processing`;
    if (badgeOrdersCount) badgeOrdersCount.innerText = totalOrders;

    if (kpiStockSkus) kpiStockSkus.innerText = totalSkus;
    if (kpiStockUnits) kpiStockUnits.innerText = `${totalUnits} total units`;
    if (badgeStockCount) badgeStockCount.innerText = totalSkus;

    if (kpiStockHealth) {
      if (outOfStockCount > 0) {
        kpiStockHealth.innerText = `${outOfStockCount} Out of Stock`;
        kpiStockHealth.style.color = 'var(--accent-danger)';
      } else if (lowStockCount > 0) {
        kpiStockHealth.innerText = `Optimal (${lowStockCount} Low)`;
        kpiStockHealth.style.color = '#FBBF24';
      } else {
        kpiStockHealth.innerText = `100% Stocked`;
        kpiStockHealth.style.color = 'var(--accent-green)';
      }
    }
    if (kpiStockAlerts) kpiStockAlerts.innerText = `${lowStockCount} Low Stock SKUs`;
  }

  function renderOrdersTable(orders, filterQuery = '') {
    if (!omsOrdersTbody) return;

    let filtered = orders;
    if (filterQuery) {
      filtered = orders.filter(o => 
        (o.orderId && o.orderId.toLowerCase().includes(filterQuery)) ||
        (o.productName && o.productName.toLowerCase().includes(filterQuery)) ||
        (o.status && o.status.toLowerCase().includes(filterQuery)) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(filterQuery))
      );
    }

    if (!filtered || filtered.length === 0) {
      omsOrdersTbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 1.5rem; color: var(--text-muted);">No matching orders found.</td></tr>`;
      return;
    }

    omsOrdersTbody.innerHTML = filtered.map(o => {
      let statusClass = "processing";
      let statusLabel = "● PROCESSING";
      if (o.status === "SHIPPED") { statusClass = "shipped"; statusLabel = "● SHIPPED"; }
      if (o.status === "CANCELLED") { statusClass = "cancelled"; statusLabel = "● CANCELLED"; }
      if (o.status === "DELIVERED") { statusClass = "delivered"; statusLabel = "● DELIVERED"; }

      const isCancelable = o.status === "PROCESSING";

      return `
        <tr class="oms-table-row">
          <td style="padding: 0.75rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span class="oms-order-id">${escapeHtml(o.orderId)}</span>
          </td>
          <td style="padding: 0.75rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); min-width: 250px;">
            <div style="font-weight: 600; color: var(--text-main); font-size: 0.85rem; white-space: nowrap;">${escapeHtml(o.productName)}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${o.size || '100ml'} x ${o.quantity || 1} unit</div>
          </td>
          <td style="padding: 0.75rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 700; color: var(--gold-primary); font-family: var(--font-mono);">
            ${o.priceInRupees || '₹' + ((o.totalPrice || 200) * 80).toLocaleString('en-IN')}
          </td>
          <td style="padding: 0.75rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span class="oms-status-pill ${statusClass}">${escapeHtml(statusLabel)}</span>
          </td>
          <td style="padding: 0.75rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(o.trackingNumber || 'N/A')}</div>
            ${isCancelable ? `<button class="btn-cancel-order-inline" onclick="cancelOmsOrder('${escapeHtml(o.orderId)}')">Cancel Order</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderStockTable(products, filterQuery = '') {
    if (!omsStockTbody) return;

    let filtered = products;
    if (filterQuery) {
      filtered = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(filterQuery)) ||
        (p.accords && p.accords.some(a => a.toLowerCase().includes(filterQuery)))
      );
    }

    if (!filtered || filtered.length === 0) {
      omsStockTbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 1.5rem; color: var(--text-muted);">No matching inventory items found.</td></tr>`;
      return;
    }

    omsStockTbody.innerHTML = filtered.map(p => {
      const stock = p.stockCount !== undefined ? p.stockCount : 25;
      const maxCap = 50;
      const pct = Math.min(100, Math.max(0, Math.round((stock / maxCap) * 100)));
      
      let meterClass = "high";
      let tagClass = "in";
      let tagLabel = "IN STOCK";

      if (stock === 0 || !p.inStock) {
        meterClass = "critical";
        tagClass = "out";
        tagLabel = "OUT OF STOCK";
      } else if (stock < 15) {
        meterClass = "medium";
        tagClass = "low";
        tagLabel = "LOW STOCK";
      }

      return `
        <tr class="oms-table-row">
          <td style="padding: 0.75rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); min-width: 250px;">
            <div style="font-weight: 600; color: var(--text-main); font-size: 0.85rem; white-space: nowrap;">${escapeHtml(p.name)}</div>
            <div style="font-size: 0.7rem; color: var(--gold-primary); opacity: 0.8;">${p.notes ? escapeHtml(p.notes.top || p.notes.heart || '') : ''}</div>
          </td>
          <td style="padding: 0.75rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 700; color: var(--gold-primary); font-family: var(--font-mono);">
            ${p.inRupees || '₹' + (p.price * 80).toLocaleString('en-IN')}
          </td>
          <td style="padding: 0.75rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); min-width: 140px;">
            <div class="stock-meter-container">
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-main);">
                <span>${stock} units</span>
                <span style="color:var(--text-muted); font-size:0.68rem;">${pct}%</span>
              </div>
              <div class="stock-meter-bg">
                <div class="stock-meter-fill ${meterClass}" style="width: ${pct}%;"></div>
              </div>
            </div>
          </td>
          <td style="padding: 0.75rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span class="oms-stock-tag ${tagClass}">${tagLabel}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Global inline cancellation handler attached to window so table button onclick works cleanly
  window.cancelOmsOrder = async function(orderId) {
    if (!confirm(`Are you sure you want to cancel order ${orderId}?`)) return;
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Order ${orderId} cancelled & refund issued! Restored inventory stock.`, 'success');
        await fetchOMSData();
      } else {
        showNotification(`⚠️ ${data.message}`, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Gateway Load Balancer & Circuit Breaker Status
  async function fetchGatewayStatus() {
    try {
      const res = await fetch('/api/gateway/status');
      const data = await res.json();
      renderGatewayInspector(data);
    } catch (err) {
      console.error(err);
    }
  }

  function renderGatewayInspector(data) {
    if (!data || !data.loadBalancer || !data.circuitBreaker) return;
    const lb = data.loadBalancer;
    const cb = data.circuitBreaker;

    let replicasHtml = `<div style="margin-bottom:0.5rem">Strategy: <strong>${escapeHtml(lb.strategy)}</strong> (${lb.activeReplicas}/${lb.totalReplicas} Replicas Active)</div>`;
    lb.replicas.forEach(r => {
      let statusColor = r.status === "HEALTHY" ? "var(--accent-green)" : "var(--accent-danger)";
      replicasHtml += `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem; padding:0.3rem; background:rgba(255,255,255,0.03); border-radius:4px;">
          <span>${escapeHtml(r.id)}</span>
          <span style="color:${statusColor}">● ${escapeHtml(r.status)} (${r.latencyMs}ms)</span>
        </div>
      `;
    });
    if (lbReplicasContainer) lbReplicasContainer.innerHTML = replicasHtml;

    let cbColor = cb.state === "CLOSED" ? "var(--accent-green)" : "var(--accent-danger)";
    let cbHtml = `
      <div style="margin-bottom:0.4rem">Circuit Breaker State: <strong style="color:${cbColor}">● ${escapeHtml(cb.state)}</strong></div>
      <div style="margin-bottom:0.4rem">Simulated Cloud Outage: <strong>${cb.simulatedOutage ? 'ENABLED (PRIMARY DOWN)' : 'DISABLED (NORMAL)'}</strong></div>
      <div style="font-size:0.75rem; color:var(--text-muted)">Backup Chain: ${data.fallbackChain.map(f => escapeHtml(f.name)).join(' ➔ ')}</div>
    `;
    if (circuitBreakerContainer) circuitBreakerContainer.innerHTML = cbHtml;
  }

  // Gateway Outage Simulation Handlers
  if (btnToggleOutage) {
    btnToggleOutage.addEventListener('click', async () => {
      await fetch('/api/gateway/simulate-failover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: true })
      });
      fetchGatewayStatus();
    });
  }

  if (btnRestoreGateway) {
    btnRestoreGateway.addEventListener('click', async () => {
      await fetch('/api/gateway/simulate-failover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: false })
      });
      fetchGatewayStatus();
    });
  }

  // Microsoft AutoGen 4-Agent Team Execution Handler
  if (btnTriggerAutoGen) btnTriggerAutoGen.addEventListener('click', runAutoGenTeam);
  if (btnChipAutoGen) btnChipAutoGen.addEventListener('click', runAutoGenTeam);

  async function runAutoGenTeam() {
    if (autogenOutputBox) autogenOutputBox.classList.remove('hidden');
    if (autogenTraceContent) autogenTraceContent.innerHTML = `<div style="color: var(--accent-cyan); font-family: var(--font-mono);">⚡ Initializing Microsoft AutoGen GroupChat (SommelierAgent, InventoryAgent, ChemistAgent, ComplianceAgent)...</div>`;

    try {
      const res = await fetch('/api/autogen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: "Formulate signature perfume for royal wedding gala" })
      });

      const data = await res.json();
      renderAutoGenTrace(data);
    } catch (err) {
      if (autogenTraceContent) autogenTraceContent.innerHTML = `<div style="color: var(--accent-danger);">Error executing AutoGen Team: ${err.message}</div>`;
    }
  }

  function renderAutoGenTrace(data) {
    let html = '';
    
    if (!data || !data.conversationTrace || !Array.isArray(data.conversationTrace)) {
      if (autogenTraceContent) autogenTraceContent.innerHTML = `<div style="color: var(--accent-danger);">Invalid AutoGen trace payload.</div>`;
      return;
    }

    data.conversationTrace.forEach((msg, idx) => {
      let agentColor = "var(--gold-primary)";
      if (msg.agent && msg.agent.includes("Inventory")) agentColor = "var(--accent-cyan)";
      if (msg.agent && msg.agent.includes("Chemist")) agentColor = "var(--accent-green)";
      if (msg.agent && msg.agent.includes("Compliance")) agentColor = "var(--accent-danger)";

      html += `
        <div class="react-step-row" style="flex-direction: column; gap: 0.2rem; margin-bottom: 0.8rem; padding: 0.6rem; background: rgba(255,255,255,0.03); border-radius: 6px;">
          <div style="color: ${agentColor}; font-weight: 700; font-family: var(--font-mono); font-size: 0.82rem;">
            Step ${idx + 1}: ${escapeHtml(msg.agent)}
          </div>
          <div style="color: var(--text-main); font-size: 0.8rem; margin-top: 0.2rem;">
            ${escapeHtml(msg.message)}
          </div>
        </div>
      `;
    });

    html += `
      <div style="margin-top: 1rem; padding: 0.8rem; background: rgba(192, 132, 252, 0.15); border: 1px solid var(--accent-purple); border-radius: 8px;">
        <div style="color: var(--accent-purple); font-weight: 700; font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.4rem;">
          🏆 Microsoft AutoGen Team Unanimous Consensus:
        </div>
        <div style="color: var(--text-main); font-size: 0.85rem;">
          ${formatMarkdown(data.finalConsensus)}
        </div>
      </div>
    `;

    if (autogenTraceContent) autogenTraceContent.innerHTML = html;
  }

  // Ragas Evals Runner
  if (btnRunEvals) {
    btnRunEvals.addEventListener('click', async () => {
      if (evalsOutputBox) evalsOutputBox.classList.remove('hidden');
      if (evalsTraceContent) {
        evalsTraceContent.innerHTML = `
          <div style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.9rem; text-align: center; padding: 2rem 1rem;">
            ⏳ Running LLMOps Ragas Evaluation Suite against benchmark test suite (Faithfulness, Relevance, Precision)...
          </div>
        `;
      }

      try {
        const res = await fetch('/api/evals', { method: 'POST' });
        const data = await res.json();
        
        const scores = data.overallScores || {};
        const compositePct = Math.round((scores.ragasCompositeQualityScore || 0) * 100);

        let html = `
          <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 1.2rem; margin-bottom: 1.2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
              <div style="font-family: var(--font-serif); color: var(--accent-cyan); font-size: 1.15rem; font-weight: 700;">
                📊 Ragas Framework Quality Benchmark Report
              </div>
              <span style="background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3); color: var(--accent-green); font-size: 0.78rem; font-weight: 700; padding: 0.2rem 0.7rem; border-radius: 20px;">
                COMPOSITE SCORE: ${compositePct}% (${scores.ragasCompositeQualityScore} / 1.0)
              </span>
            </div>

            <!-- Score breakdown grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; margin-top: 0.8rem;">
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); padding: 0.7rem; border-radius: 8px;">
                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Faithfulness</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: var(--gold-primary); font-family: var(--font-mono);">${scores.avgFaithfulness || 0}</div>
              </div>
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); padding: 0.7rem; border-radius: 8px;">
                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Answer Relevance</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: var(--accent-cyan); font-family: var(--font-mono);">${scores.avgAnswerRelevance || 0}</div>
              </div>
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); padding: 0.7rem; border-radius: 8px;">
                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Context Precision</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: var(--accent-green); font-family: var(--font-mono);">${scores.avgContextPrecision || 0}</div>
              </div>
            </div>
          </div>

          <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.8rem;">
            Test Case Benchmark Spans (${data.testResults ? data.testResults.length : 0} executed):
          </div>
        `;

        if (data.testResults) {
          data.testResults.forEach(t => {
            const isPassed = t.status === "PASSED";
            const scorePct = Math.round((t.vectorScore || 0) * 100);
            html += `
              <div style="padding: 0.8rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid ${isPassed ? 'var(--accent-green)' : 'var(--accent-danger)'}; margin-bottom: 0.6rem; border-radius: 8px; font-size: 0.82rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                  <span style="font-family: var(--font-mono); color: var(--gold-primary); font-weight: 700;">[${escapeHtml(t.evalId)}] "${escapeHtml(t.query)}"</span>
                  <span style="background: ${isPassed ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'}; color: ${isPassed ? 'var(--accent-green)' : 'var(--accent-danger)'}; font-weight: 700; font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 12px;">
                    ${escapeHtml(t.status)} (${scorePct}% Precision)
                  </span>
                </div>
                <div style="color: var(--text-muted); font-size: 0.78rem;">
                  Retrieved Product: <strong style="color: var(--text-main);">${escapeHtml(t.topProductRetrieved)}</strong> | Faithfulness: <strong>${t.faithfulnessScore}</strong> | Relevance: <strong>${t.answerRelevanceScore}</strong>
                </div>
              </div>
            `;
          });
        }

        if (evalsTraceContent) evalsTraceContent.innerHTML = html;
      } catch (err) {
        if (evalsTraceContent) evalsTraceContent.innerHTML = `<div style="color: var(--accent-danger); padding: 1.5rem;">Error executing Ragas Evals: ${escapeHtml(err.message)}</div>`;
      }
    });
  }

  // Security Red-Teaming Audit Runner
  if (btnRunRedteam) {
    btnRunRedteam.addEventListener('click', async () => {
      if (evalsOutputBox) evalsOutputBox.classList.remove('hidden');
      if (evalsTraceContent) {
        evalsTraceContent.innerHTML = `
          <div style="color: var(--accent-danger); font-family: var(--font-mono); font-size: 0.9rem; text-align: center; padding: 2rem 1rem;">
            🛡 Firing Adversarial Red-Team Attack Payloads (Prompt Injections, PII Exfiltrations, DAN Jailbreaks)...
          </div>
        `;
      }

      try {
        const res = await fetch('/api/redteam', { method: 'POST' });
        const data = await res.json();

        let html = `
          <div style="background: rgba(248, 113, 113, 0.08); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 10px; padding: 1.2rem; margin-bottom: 1.2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-family: var(--font-serif); color: var(--accent-danger); font-size: 1.15rem; font-weight: 700;">
                🛡 Security Red-Teaming Adversarial Audit Report
              </div>
              <span style="background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3); color: var(--accent-green); font-size: 0.78rem; font-weight: 700; padding: 0.2rem 0.7rem; border-radius: 20px;">
                DEFENSE PASS RATE: ${escapeHtml(data.defensePassRate)} (${data.attacksNeutralized}/${data.totalAttacksTested} Neutralized)
              </span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">
              Audit Status: <strong style="color: var(--accent-green);">${escapeHtml(data.status)}</strong>
            </div>
          </div>

          <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.8rem;">
            Adversarial Attack Vectors Audit Log:
          </div>
        `;

        if (data.auditTrace) {
          data.auditTrace.forEach(a => {
            const isNeutralized = a.outcome === "ATTACK_NEUTRALIZED";
            html += `
              <div style="padding: 0.8rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid ${isNeutralized ? 'var(--accent-green)' : 'var(--accent-danger)'}; margin-bottom: 0.6rem; border-radius: 8px; font-size: 0.82rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                  <div>
                    <span style="color: var(--accent-purple); font-weight: 700; font-family: var(--font-mono);">[${escapeHtml(a.attackId)}] ${escapeHtml(a.attackType)}</span>
                  </div>
                  <span style="background: ${isNeutralized ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'}; color: ${isNeutralized ? 'var(--accent-green)' : 'var(--accent-danger)'}; font-weight: 700; font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 12px;">
                    ${escapeHtml(a.outcome)}
                  </span>
                </div>
                <div style="color: var(--text-main); margin-bottom: 0.2rem;">
                  Adversarial Payload: <code style="background: rgba(255,255,255,0.08); padding: 0.1rem 0.4rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.76rem;">"${escapeHtml(a.rawPrompt)}"</code>
                </div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">
                  Sanitized Vector: "${escapeHtml(a.sanitizedPrompt)}" | LLM Gateway Flagged: <strong>${a.gatewayFlagged ? 'YES' : 'NO'}</strong> | Content Safety Passed: <strong>${a.contentSafetyPassed ? 'YES' : 'NO'}</strong>
                </div>
              </div>
            `;
          });
        }

        if (evalsTraceContent) evalsTraceContent.innerHTML = html;
      } catch (err) {
        if (evalsTraceContent) evalsTraceContent.innerHTML = `<div style="color: var(--accent-danger); padding: 1.5rem;">Error executing Red-Team Audit: ${escapeHtml(err.message)}</div>`;
      }
    });
  }

  // Render Functions
  function renderUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message msg-user';
    div.innerHTML = `
      <div class="msg-avatar">YOU</div>
      <div class="msg-bubble"><p>${escapeHtml(text)}</p></div>
    `;
    if (chatStream) {
      chatStream.appendChild(div);
      chatStream.scrollTop = chatStream.scrollHeight;
    }
  }

  function renderThinkingMessage() {
    const id = 'msg-' + Date.now();
    const div = document.createElement('div');
    div.className = 'message msg-ai';
    div.id = id;
    div.innerHTML = `
      <div class="msg-avatar" style="background: linear-gradient(135deg, var(--gold-primary), #B48847); color: #000; font-weight: 800; border: 2px solid rgba(255,255,255,0.3); font-size: 0.78rem;">AURA</div>
      <div class="msg-bubble" style="background: rgba(226, 192, 133, 0.06); border: 1px solid rgba(226, 192, 133, 0.25); border-radius: 12px; padding: 1.2rem;">
        <p class="pulse-text" style="color: var(--gold-primary); font-family: var(--font-serif); font-size: 0.9rem;">
          🌸 AURA Sommelier is searching 6D vector space & querying warehouse inventory...
        </p>
      </div>
    `;
    if (chatStream) {
      chatStream.appendChild(div);
      chatStream.scrollTop = chatStream.scrollHeight;
    }
    return id;
  }

  function updateThinkingMessage(msgId, data) {
    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;

    const bubble = msgEl.querySelector('.msg-bubble');
    
    let cacheBadge = data.cacheHit ? `<span class="tag-cache">⚡ Semantic Cache Hit (0ms)</span>` : `<span class="tag-vector">⚙ LLM RAG Inference (${data.telemetryTrace ? data.telemetryTrace.latencyMs : 0}ms)</span>`;
    let guardrailBadge = data.guardrailStatus && data.guardrailStatus.flagged ? `<span style="color:var(--accent-danger); font-family:var(--font-mono); font-size:0.75rem;">🛡 Guardrail Triggered</span>` : '';
    let failoverBadge = data.failoverTriggered ? `<span style="color:var(--accent-danger); font-family:var(--font-mono); font-size:0.75rem;">⚠️ Failover Active (${data.providerUsed})</span>` : '';

    let recCardsHtml = '';
    if (data.retrievedProducts && data.retrievedProducts.length > 0) {
      recCardsHtml = `<div class="rec-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 0.9rem; margin-top: 1rem;">` + data.retrievedProducts.map(p => `
        <div class="rec-card" style="background: rgba(15, 20, 32, 0.9); border: 1px solid rgba(226, 192, 133, 0.3); border-radius: 12px; padding: 1.1rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
          <div>
            <div style="font-family: var(--font-serif); color: var(--gold-primary); font-size: 1.02rem; font-weight: 700; margin-bottom: 0.2rem;">
              ${escapeHtml(p.name)}
            </div>
            <div style="font-size: 0.9rem; color: #FFF; font-weight: 700; margin-bottom: 0.4rem;">
              ${p.inRupees || '$' + p.price} <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: normal;">• ${escapeHtml(p.family)}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.6rem;">
              🌸 ${p.topNotes ? p.topNotes.slice(0, 2).map(escapeHtml).join(', ') : 'Assam Oud, Sandalwood'}
            </div>
          </div>

          <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.8rem; margin-top: 0.4rem;">
            <!-- Simple Quantity Controls -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem;">
              <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Quantity:</span>
              <div style="display: flex; align-items: center; gap: 0.6rem; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 0.2rem 0.6rem;">
                <button type="button" onclick="changeCardQty(this, -1)" style="background: none; border: none; color: var(--gold-primary); font-weight: 800; cursor: pointer; font-size: 0.95rem; line-height: 1;">-</button>
                <span class="card-qty-val" style="font-size: 0.85rem; font-weight: 700; font-family: var(--font-mono); color: #fff;">1</span>
                <button type="button" onclick="changeCardQty(this, 1)" style="background: none; border: none; color: var(--gold-primary); font-weight: 800; cursor: pointer; font-size: 0.95rem; line-height: 1;">+</button>
              </div>
            </div>

            <!-- 1-Click Buy Button -->
            <button class="btn-order-instant" data-perfume="${escapeHtml(p.name)}" style="width: 100%; background: linear-gradient(135deg, var(--gold-primary), #B48847); color: #000; font-weight: 800; border: none; padding: 0.6rem; border-radius: 8px; cursor: pointer; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: transform 0.1s ease;">
              🛒 1-Click Buy (${p.inRupees || '$' + p.price})
            </button>
          </div>
        </div>
      `).join('') + `</div>`;
    }

    let routingTraceHtml = '';
    if (data.routingTrace && data.routingTrace.length > 0) {
      routingTraceHtml = `
        <details style="margin-top:0.8rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:0.5rem 0.8rem;">
          <summary style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono); cursor:pointer; outline:none; user-select:none;">
            🔍 View Technical Gateway Route & Telemetry Trace
          </summary>
          <div style="margin-top:0.5rem; font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.06); padding-top:0.5rem;">
            ${data.routingTrace.map(step => `<div style="margin-bottom:0.15rem;">↳ ${escapeHtml(step)}</div>`).join('')}
          </div>
        </details>
      `;
    }

    bubble.innerHTML = `
      <div style="color: var(--text-main); font-size: 0.92rem; line-height: 1.6;">${formatMarkdown(data.response)}</div>
      ${recCardsHtml}
      ${routingTraceHtml}
      <div class="msg-meta" style="margin-top: 0.8rem;">
        ${cacheBadge}
        ${guardrailBadge}
        ${failoverBadge}
      </div>
    `;
    if (chatStream) chatStream.scrollTop = chatStream.scrollHeight;
    animateN8NNodes(data);
  }

  function animateN8NNodes(data) {
    if (!data) return;

    // Reset all nodes
    document.querySelectorAll('.n8n-node-card').forEach(n => n.classList.remove('active-node'));
    document.querySelectorAll('.n8n-subnode-item').forEach(s => s.classList.remove('active-replica'));

    // Node 1 (Ingress), Node 2 (Guardrails), Node 6 (Output) always activate
    const node1 = document.getElementById('n8n-node-1');
    const node2 = document.getElementById('n8n-node-2');
    const node6 = document.getElementById('n8n-node-6');
    if (node1) node1.classList.add('active-node');
    if (node2) node2.classList.add('active-node');
    if (node6) node6.classList.add('active-node');

    // Node 3: Cache
    const node3 = document.getElementById('n8n-node-3');
    const cacheStatus = document.getElementById('n8n-cache-status');
    if (data.cacheHit) {
      if (node3) node3.classList.add('active-node');
      if (cacheStatus) cacheStatus.textContent = '⚡ HIT (0ms / $0.00)';
      return;
    } else {
      if (cacheStatus) cacheStatus.textContent = 'MISS -> Forward to LLM';
    }

    // Node 4: Load Balancer & Replica subnode
    const node4 = document.getElementById('n8n-node-4');
    if (!data.failoverTriggered) {
      if (node4) node4.classList.add('active-node');
      if (data.replicaUsed) {
        if (data.replicaUsed.includes('us-east')) {
          const sub = document.getElementById('n8n-sub-us');
          if (sub) sub.classList.add('active-replica');
        } else if (data.replicaUsed.includes('eu-west')) {
          const sub = document.getElementById('n8n-sub-eu');
          if (sub) sub.classList.add('active-replica');
        } else if (data.replicaUsed.includes('ap-south')) {
          const sub = document.getElementById('n8n-sub-ap');
          if (sub) sub.classList.add('active-replica');
        }
      }
    }

    // Node 5: Circuit Breaker & Fallback
    const node5 = document.getElementById('n8n-node-5');
    const cbText = document.getElementById('n8n-cb-text');
    if (data.failoverTriggered) {
      if (node5) node5.classList.add('active-node');
      if (cbText) {
        cbText.textContent = '⚠️ OPEN (Outage Failover)';
        cbText.style.color = 'var(--accent-danger)';
      }
      if (data.providerUsed && data.providerUsed.includes('Azure')) {
        const sub = document.getElementById('n8n-sub-az');
        if (sub) sub.classList.add('active-replica');
      } else if (data.providerUsed && data.providerUsed.includes('Claude')) {
        const sub = document.getElementById('n8n-sub-cl');
        if (sub) sub.classList.add('active-replica');
      } else if (data.providerUsed && data.providerUsed.includes('Ollama')) {
        const sub = document.getElementById('n8n-sub-ol');
        if (sub) sub.classList.add('active-replica');
      }
    } else {
      if (cbText) {
        cbText.textContent = 'CLOSED (Normal Operations)';
        cbText.style.color = 'var(--accent-green)';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // GATEWAY LOAD BALANCER & OUTAGE SIMULATOR HANDLERS
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // LLM GATEWAY CONTROL MODAL & HEAVY TRAFFIC SURGE HANDLERS
  // ---------------------------------------------------------------------------
  const toggleGatewayModalBtn = document.getElementById('toggle-gateway-modal');
  const closeGatewayModalBtn = document.getElementById('close-gateway-modal');
  const gatewayModal = document.getElementById('gateway-modal');
  const selectPrimaryProvider = document.getElementById('select-primary-provider');
  const btnSurgeTraffic = document.getElementById('btn-surge-traffic');
  const btnModalSurge = document.getElementById('btn-modal-surge');
  const btnModalOutage = document.getElementById('btn-modal-outage');
  const modalStatusMsg = document.getElementById('modal-status-msg');

  if (toggleGatewayModalBtn && gatewayModal) {
    toggleGatewayModalBtn.addEventListener('click', () => {
      gatewayModal.classList.remove('hidden');
      fetchGatewayStatus();
    });
  }

  if (closeGatewayModalBtn && gatewayModal) {
    closeGatewayModalBtn.addEventListener('click', () => {
      gatewayModal.classList.add('hidden');
    });
  }

  // ---------------------------------------------------------------------------
  // TOP NAVBAR MODAL OPEN / CLOSE HANDLERS
  // ---------------------------------------------------------------------------
  const navBtnOms = document.getElementById('nav-btn-oms');
  const navBtnGateway = document.getElementById('nav-btn-gateway');
  const navBtnAutogen = document.getElementById('nav-btn-autogen');
  const navBtnEvals = document.getElementById('nav-btn-evals');

  const omsModal = document.getElementById('oms-modal');
  const autogenModal = document.getElementById('autogen-modal');
  const evalsModal = document.getElementById('evals-modal');

  const closeOmsModalBtn = document.getElementById('close-oms-modal');
  const closeAutogenModalBtn = document.getElementById('close-autogen-modal');
  const closeEvalsModalBtn = document.getElementById('close-evals-modal');
  const btnModalRestore = document.getElementById('btn-modal-restore');

  if (navBtnOms && omsModal) {
    navBtnOms.addEventListener('click', () => {
      omsModal.classList.remove('hidden');
      fetchOMSData();
    });
  }

  if (navBtnGateway && gatewayModal) {
    navBtnGateway.addEventListener('click', () => {
      gatewayModal.classList.remove('hidden');
      fetchGatewayStatus();
    });
  }

  if (navBtnAutogen && autogenModal) {
    navBtnAutogen.addEventListener('click', () => {
      autogenModal.classList.remove('hidden');
    });
  }

  if (navBtnEvals && evalsModal) {
    navBtnEvals.addEventListener('click', () => {
      evalsModal.classList.remove('hidden');
    });
  }

  if (closeOmsModalBtn && omsModal) {
    closeOmsModalBtn.addEventListener('click', () => omsModal.classList.add('hidden'));
  }

  if (closeAutogenModalBtn && autogenModal) {
    closeAutogenModalBtn.addEventListener('click', () => autogenModal.classList.add('hidden'));
  }

  if (closeEvalsModalBtn && evalsModal) {
    closeEvalsModalBtn.addEventListener('click', () => evalsModal.classList.add('hidden'));
  }

  // ---------------------------------------------------------------------------
  // ROYAL PERFUMERY AI COMMITTEE (AUTOGEN) HANDLERS FOR NAIVE USERS
  // ---------------------------------------------------------------------------
  let currentAutoGenQuery = "Formulate signature perfume for royal wedding gala";

  document.querySelectorAll('.autogen-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.autogen-preset-btn').forEach(b => b.style.opacity = '0.7');
      btn.style.opacity = '1';
      currentAutoGenQuery = btn.getAttribute('data-query');
    });
  });

  const btnChipAutogen = document.getElementById('btn-chip-autogen');
  if (btnChipAutogen && autogenModal) {
    btnChipAutogen.addEventListener('click', () => {
      autogenModal.classList.remove('hidden');
      executeAutoGenTeam(currentAutoGenQuery);
    });
  }

  const btnTriggerAutogen = document.getElementById('btn-trigger-autogen');
  if (btnTriggerAutogen) {
    btnTriggerAutogen.addEventListener('click', () => {
      executeAutoGenTeam(currentAutoGenQuery);
    });
  }

  async function executeAutoGenTeam(query) {
    const outputBox = document.getElementById('autogen-output-box');
    const traceContent = document.getElementById('autogen-trace-content');
    if (!outputBox || !traceContent) return;

    outputBox.classList.remove('hidden');
    traceContent.innerHTML = `
      <div style="color:var(--gold-primary); font-family:var(--font-mono); font-size:0.85rem; padding:1.5rem 0; text-align:center;">
        ⚡ Convening 4-Agent Royal Perfumery AI Committee (Perfumer, Inventory, Chemist, Safety Director)...
      </div>
    `;

    try {
      const res = await fetch('/api/autogen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query || currentAutoGenQuery })
      });
      const data = await res.json();

      let html = `<div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">Formula Request: <strong style="color:#fff">"${escapeHtml(data.query)}"</strong> (${data.executionTimeMs}ms execution)</div>`;

      if (data.conversationTrace) {
        data.conversationTrace.forEach(step => {
          let agentColor = "var(--gold-primary)";
          let agentIcon = "🌸";
          let agentTitle = "Olfactory Sommelier & Fragrance Architect";

          if (step.agent === "ConciergeAgent") {
            agentColor = "var(--accent-purple)";
            agentIcon = "💎";
            agentTitle = "VIP Experience & Gifting Concierge";
          } else if (step.agent === "InventoryAgent") {
            agentColor = "var(--accent-cyan)";
            agentIcon = "📦";
            agentTitle = "Global Atelier Inventory & OMS Strategist";
          } else if (step.agent === "HeritageAgent") {
            agentColor = "var(--accent-green)";
            agentIcon = "👑";
            agentTitle = "Royal Heritage & Authenticity Officer";
          }

          html += `
            <div style="background:rgba(255,255,255,0.03); border-left:3px solid ${agentColor}; padding:0.8rem 1rem; border-radius:6px; margin-bottom:0.8rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                <span style="font-weight:700; color:${agentColor}; font-size:0.85rem;">${agentIcon} ${agentTitle}</span>
                <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono)">Step ${step.step} / 4</span>
              </div>
              <div style="font-size:0.82rem; line-height:1.5;">${formatMarkdown(step.message)}</div>
            </div>
          `;
        });
      }

      // Render Royal Sign-Off Certificate Card
      html += `
        <div style="background:linear-gradient(135deg, rgba(226,192,133,0.15), rgba(10,13,20,0.9)); border:2px solid var(--gold-primary); border-radius:12px; padding:1.2rem; margin-top:1.5rem; text-align:center; box-shadow:0 0 20px rgba(226,192,133,0.2);">
          <div style="font-family:var(--font-serif); color:var(--gold-primary); font-size:1.1rem; font-weight:700; letter-spacing:1px; margin-bottom:0.4rem;">
            📜 ROYAL FRAGRANCE ADVISORY COMMITTEE UNANIMOUS CONSENSUS
          </div>
          <div style="font-size:0.85rem; color:var(--text-main); margin-bottom:1rem;">
            ${formatMarkdown(data.finalConsensus)}
          </div>
          <div style="display:flex; justify-content:center; gap:1.2rem; flex-wrap:wrap; font-size:0.78rem; font-family:var(--font-mono); color:var(--accent-green);">
            <span>✓ Olfactory Pyramid Approved</span>
            <span>✓ VIP Flacon Configured</span>
            <span>✓ Atelier Vault Reserved</span>
            <span>✓ GI Sourcing & IFRA Certified</span>
          </div>
        </div>
      `;

      traceContent.innerHTML = html;
      fetchTelemetry();
    } catch (err) {
      console.error(err);
      traceContent.innerHTML = `<div style="color:var(--accent-danger)">Error convening AI committee: ${escapeHtml(err.message)}</div>`;
    }
  }

  if (btnModalRestore) {
    btnModalRestore.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/gateway/simulate-failover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enable: false })
        });
        await res.json();
        showModalMsg("✅ Primary Cluster Restored to CLOSED state!");
        fetchGatewayStatus();
        fetchTelemetry();
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (selectPrimaryProvider) {
    selectPrimaryProvider.addEventListener('change', async () => {
      const primaryProviderId = selectPrimaryProvider.value;
      const disabledFallbacks = getDisabledFallbacks();

      try {
        const res = await fetch('/api/gateway/configure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ primaryProviderId, disabledFallbacks })
        });
        const data = await res.json();
        showModalMsg(`Primary provider updated to ${data.primaryProvider.name}`);
        fetchGatewayStatus();
        fetchTelemetry();
      } catch (err) {
        console.error(err);
      }
    });
  }

  document.querySelectorAll('.chk-fallback').forEach(chk => {
    chk.addEventListener('change', async () => {
      const primaryProviderId = selectPrimaryProvider ? selectPrimaryProvider.value : 'gemini-1.5-flash';
      const disabledFallbacks = getDisabledFallbacks();

      try {
        const res = await fetch('/api/gateway/configure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ primaryProviderId, disabledFallbacks })
        });
        await res.json();
        showModalMsg(`Fallback providers updated`);
        fetchGatewayStatus();
        fetchTelemetry();
      } catch (err) {
        console.error(err);
      }
    });
  });

  function getDisabledFallbacks() {
    const disabled = [];
    document.querySelectorAll('.chk-fallback').forEach(chk => {
      if (!chk.checked) {
        disabled.push(chk.value);
      }
    });
    return disabled;
  }

  function showModalMsg(msg) {
    if (modalStatusMsg) {
      modalStatusMsg.textContent = `✓ ${msg}`;
      setTimeout(() => { modalStatusMsg.textContent = ''; }, 3000);
    }
  }

  async function triggerSurgeSimulation() {
    try {
      showModalMsg("⚡ Simulating heavy traffic surge (10 concurrent requests)...");
      const res = await fetch('/api/gateway/simulate-surge', { method: 'POST' });
      await res.json();
      fetchGatewayStatus();
      fetchTelemetry();
      showModalMsg("✓ Heavy traffic surge distributed across multi-region load balancers!");
    } catch (err) {
      console.error(err);
    }
  }

  if (btnSurgeTraffic) btnSurgeTraffic.addEventListener('click', triggerSurgeSimulation);
  if (btnModalSurge) btnModalSurge.addEventListener('click', triggerSurgeSimulation);

  if (btnModalOutage) {
    btnModalOutage.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/gateway/simulate-failover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enable: true })
        });
        const data = await res.json();
        showModalMsg(`⚠️ Outage failover triggered! Circuit breaker: ${data.circuitBreakerState}`);
        fetchGatewayStatus();
        fetchTelemetry();
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (btnToggleOutage) {
    btnToggleOutage.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/gateway/simulate-failover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enable: true })
        });
        await res.json();
        fetchGatewayStatus();
        fetchTelemetry();
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (btnRestoreGateway) {
    btnRestoreGateway.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/gateway/simulate-failover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enable: false })
        });
        await res.json();
        fetchGatewayStatus();
        fetchTelemetry();
      } catch (err) {
        console.error(err);
      }
    });
  }

  async function fetchGatewayStatus() {
    try {
      const res = await fetch('/api/gateway/status');
      const data = await res.json();

      // Render Primary Provider Badge
      if (selectPrimaryProvider && data.primaryProvider) {
        selectPrimaryProvider.value = data.primaryProvider.id;
      }

      // Render Replicas
      if (lbReplicasContainer && data.loadBalancer && data.loadBalancer.replicas) {
        const primaryName = data.primaryProvider ? data.primaryProvider.name : "Google Gemini 1.5 Flash";
        lbReplicasContainer.innerHTML = `
          <div style="font-size:0.75rem; color:var(--gold-primary); margin-bottom:0.5rem;">Active Primary: <strong>${escapeHtml(primaryName)}</strong></div>
        ` + data.loadBalancer.replicas.map(r => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div>
              <span style="color:${r.status === 'HEALTHY' ? 'var(--accent-green)' : 'var(--accent-danger)'}; font-weight:bold;">
                ${r.status === 'HEALTHY' ? '● ONLINE' : '● OUTAGE'}
              </span>
              <span style="margin-left:0.5rem; color:var(--text-main); font-weight:600;">${escapeHtml(r.id)}</span>
            </div>
            <div style="color:var(--text-muted); font-size:0.75rem;">
              Latency: <span style="color:var(--accent-cyan);">${r.latencyMs}ms</span> | Load: <span style="color:var(--gold-primary); font-weight:bold;">${r.loadCount} reqs</span>
            </div>
          </div>
        `).join('');
      }

      // Render Circuit Breaker
      if (circuitBreakerContainer && data.circuitBreaker) {
        const cb = data.circuitBreaker;
        const cbBadge = document.getElementById('circuit-breaker-badge');
        if (cbBadge) {
          cbBadge.textContent = cb.state === 'CLOSED' ? 'CLOSED (Healthy)' : 'OPEN (Outage Active)';
          cbBadge.style.color = cb.state === 'CLOSED' ? 'var(--accent-green)' : 'var(--accent-danger)';
          cbBadge.style.background = cb.state === 'CLOSED' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        }

        circuitBreakerContainer.innerHTML = `
          <div style="padding:0.3rem 0;">
            Primary Cluster State: <strong style="color:${cb.state === 'CLOSED' ? 'var(--accent-green)' : 'var(--accent-danger)'}">${cb.state}</strong>
          </div>
          <div style="padding:0.3rem 0;">
            Consecutive Outage Failures: <strong style="color:var(--gold-primary)">${cb.failures} / 3</strong>
          </div>
          <div style="padding:0.3rem 0;">
            Outage Mode: <strong style="color:${cb.simulatedOutage ? 'var(--accent-danger)' : 'var(--accent-green)'}">${cb.simulatedOutage ? 'ACTIVE (Failover Triggered)' : 'INACTIVE (Normal)'}</strong>
          </div>
        `;
      }

      // Render Fallback Chain Topology
      const fallbackChainContainer = document.getElementById('fallback-chain-container');
      if (fallbackChainContainer && data.fallbackChain) {
        fallbackChainContainer.innerHTML = data.fallbackChain.map(f => {
          const isActive = f.active !== false;
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.3rem 0; font-size:0.8rem;">
              <span>Tier ${f.priority} (${f.type}): <strong>${escapeHtml(f.name)}</strong></span>
              <span style="font-size:0.7rem; padding:0.1rem 0.4rem; border-radius:4px; font-weight:bold; ${isActive ? 'background:rgba(52,211,153,0.1); color:var(--accent-green);' : 'background:rgba(239,68,68,0.1); color:var(--accent-danger);'}">
                ${isActive ? '✓ ACTIVE' : '✗ DESELECTED'}
              </span>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error(err);
    }
  }

  function updateAgentMessage(msgId, data) {
    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;

    const bubble = msgEl.querySelector('.msg-bubble');
    const agentRes = data.agentResult;

    let stepsHtml = '';
    if (agentRes && agentRes.traceSteps && agentRes.traceSteps.length > 0) {
      stepsHtml = `
        <details style="margin-top:0.8rem; background:rgba(0,0,0,0.35); border:1px solid rgba(192, 132, 252, 0.25); border-radius:8px; padding:0.5rem 0.8rem;">
          <summary style="font-size:0.72rem; color:var(--accent-purple); font-family:var(--font-mono); cursor:pointer; outline:none; user-select:none;">
            🤖 View Autonomous ReAct Tool-Calling Execution Trace (${agentRes.traceSteps.length} steps)
          </summary>
          <div class="react-steps-box" style="margin-top:0.5rem; max-height:220px; overflow-y:auto; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.5rem;">
            ${agentRes.traceSteps.map(s => {
              if (s.type === 'THOUGHT') {
                return `<div class="react-step-row"><span class="step-tag-thought">[THOUGHT]</span> <span>${escapeHtml(s.content)}</span></div>`;
              } else if (s.type === 'ACTION') {
                return `<div class="react-step-row"><span class="step-tag-action">[ACTION]</span> <span>Tool '${escapeHtml(s.tool)}': ${escapeHtml(JSON.stringify(s.input))}</span></div>`;
              } else if (s.type === 'OBSERVATION') {
                return `<div class="react-step-row"><span class="step-tag-obs">[OBSERVATION]</span> <span>${escapeHtml(JSON.stringify(s.output))}</span></div>`;
              }
              return '';
            }).join('')}
          </div>
        </details>
      `;
    }

    bubble.innerHTML = `
      <div style="color: var(--text-main); font-size: 0.92rem; line-height: 1.6;">${formatMarkdown(agentRes ? agentRes.finalAnswer : '')}</div>
      ${stepsHtml}
      <div class="msg-meta" style="margin-top: 0.8rem;">
        <span class="tag-agent">🤖 Multi-Agent ReAct Execution (${data.telemetryTrace ? data.telemetryTrace.latencyMs : 0}ms)</span>
      </div>
    `;
    if (chatStream) chatStream.scrollTop = chatStream.scrollHeight;
  }

  function updateErrorMessage(msgId, errText) {
    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;
    const bubble = msgEl.querySelector('.msg-bubble');
    bubble.innerHTML = `<p style="color:var(--accent-danger)">${escapeHtml(errText)}</p>`;
  }

  // Fetch Catalog & Render Cards
  async function fetchCatalog() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      renderCatalogGrid(data.products);
    } catch (err) {
      console.error(err);
    }
  }

  function renderCatalogGrid(products) {
    if (!catalogGrid || !products) return;
    catalogGrid.innerHTML = products.map(p => `
      <div class="product-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="p-family">${escapeHtml(p.family)}</span>
            <span style="font-size:0.75rem; color:${p.inStock ? 'var(--accent-green)' : 'var(--accent-danger)'}; font-family:var(--font-mono)">
              ${p.inStock ? `● ${p.stockCount} in stock` : '● OUT OF STOCK'}
            </span>
          </div>
          <h3 class="p-name">${escapeHtml(p.name)}</h3>
          <p class="p-tagline">${escapeHtml(p.tagline)}</p>

          <div class="p-notes-list">
            <div><strong>Top Notes:</strong> ${p.topNotes ? p.topNotes.map(escapeHtml).join(', ') : ''}</div>
            <div><strong>Heart Notes:</strong> ${p.heartNotes ? p.heartNotes.map(escapeHtml).join(', ') : ''}</div>
            <div><strong>Base Notes:</strong> ${p.baseNotes ? p.baseNotes.map(escapeHtml).join(', ') : ''}</div>
          </div>
        </div>

        <div>
          <div class="rec-price" style="color:var(--gold-primary); font-size:1.1rem">${p.inRupees || '$' + p.price} • ${p.sizes ? p.sizes.map(escapeHtml).join(', ') : ''}</div>
          
          <div class="vector-bars">
            <div class="vector-bars-title">6D Scent Accord Vector:</div>
            <div class="vec-bar-row"><span>Citrus</span><div class="vec-bar-track"><div class="vec-bar-fill" style="width:${p.vector[0]*100}%"></div></div><span>${p.vector[0]}</span></div>
            <div class="vec-bar-row"><span>Woody</span><div class="vec-bar-track"><div class="vec-bar-fill" style="width:${p.vector[1]*100}%"></div></div><span>${p.vector[1]}</span></div>
            <div class="vec-bar-row"><span>Floral</span><div class="vec-bar-track"><div class="vec-bar-fill" style="width:${p.vector[2]*100}%"></div></div><span>${p.vector[2]}</span></div>
            <div class="vec-bar-row"><span>Oriental</span><div class="vec-bar-track"><div class="vec-bar-fill" style="width:${p.vector[3]*100}%"></div></div><span>${p.vector[3]}</span></div>
          </div>

          <button class="btn-order-instant" data-perfume="${escapeHtml(p.name)}" style="background:linear-gradient(135deg, var(--gold-primary), #B48847); color:#000; font-weight:700; border:none; padding:0.6rem 1rem; border-radius:6px; margin-top:0.8rem; cursor:pointer; font-size:0.85rem; width:100%; font-family:var(--font-mono);">
            🛒 1-Click Instant Order (${p.inRupees || '$' + p.price})
          </button>
        </div>
      </div>
    `).join('');
  }

  // Fetch Telemetry Inspector Data
  async function fetchTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      const data = await res.json();

      if (mRequests) mRequests.textContent = data.totalRequests;
      if (mCacheRate) mCacheRate.textContent = `${data.cacheHitRate}%`;
      if (mTokens) mTokens.textContent = data.totalTokens;
      if (mCost) mCost.textContent = `$${data.totalCostUSD.toFixed(5)}`;

      if (statCache) statCache.textContent = `${data.cacheHitRate}%`;
      if (statCost) statCost.textContent = `$${data.totalCostUSD.toFixed(4)}`;

      if (data.traces && data.traces.length > 0) {
        if (statLatency) statLatency.textContent = `${data.traces[0].latencyMs} ms`;
        renderTraceTable(data.traces);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderTraceTable(traces) {
    if (!traceTbody || !traces) return;
    traceTbody.innerHTML = traces.map(t => {
      let routingInfo = '';
      if (t.routingTrace && t.routingTrace.length > 0) {
        routingInfo = `<div style="color:var(--accent-purple); font-size:0.75rem; margin-top:0.2rem; font-family:var(--font-mono);">${escapeHtml(t.routingTrace[t.routingTrace.length - 1])}</div>`;
      }

      return `
        <tr class="oms-table-row">
          <td style="padding: 0.9rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <div style="color:var(--gold-primary); font-weight:700; font-size:0.88rem;">${escapeHtml(t.timestamp ? t.timestamp.substring(11, 19) : '')}</div>
            <div style="margin-top:0.2rem;"><span style="background:rgba(226, 192, 133, 0.1); border:1px solid rgba(226, 192, 133, 0.25); padding:0.1rem 0.45rem; border-radius:4px; font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">${escapeHtml(t.traceId || 'TRC-000')}</span></div>
          </td>
          <td style="padding: 0.9rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <div style="font-weight:600; color:var(--text-main); font-size:0.85rem;">${escapeHtml(t.provider || 'Gateway')}</div>
            <div style="color:var(--text-muted); font-size:0.75rem; font-family:var(--font-mono);">${escapeHtml(t.model || 'llm-v1')}</div>
            ${routingInfo}
          </td>
          <td style="padding: 0.9rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
            ${t.cacheHit ? '<span style="background:rgba(52,211,153,0.15); border:1px solid rgba(52,211,153,0.3); color:var(--accent-green); padding:0.2rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:700;">HIT (0ms)</span>' : '<span style="color:var(--text-muted); font-size:0.78rem; font-weight:600;">MISS</span>'}
          </td>
          <td style="padding: 0.9rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight:700; color:var(--accent-cyan); font-size:0.9rem; font-family:var(--font-mono);">
            ${t.latencyMs} ms
          </td>
          <td style="padding: 0.9rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <div style="font-weight:700; color:var(--text-main); font-size:0.85rem; font-family:var(--font-mono);">${t.tokens ? t.tokens.total : 0} tok</div>
            <div style="color:var(--gold-primary); font-size:0.75rem; font-family:var(--font-mono); margin-top:0.1rem;">$${t.costUSD ? t.costUSD.toFixed(6) : '0.000000'}</div>
          </td>
          <td style="padding: 0.9rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
            ${t.guardrailStatus && t.guardrailStatus.flagged ? '<span style="background:rgba(248,113,113,0.15); border:1px solid rgba(248,113,113,0.3); color:var(--accent-danger); padding:0.2rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:700;">🛡 FLAGGED</span>' : '<span style="background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); color:var(--accent-green); padding:0.2rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:700;">✓ SAFE</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Flush Cache Button Handler
  if (btnFlushCache) {
    btnFlushCache.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/cache/flush', { method: 'POST' });
        const data = await res.json();
        if (cacheStatusMsg) {
          cacheStatusMsg.textContent = data.message;
          setTimeout(() => cacheStatusMsg.textContent = '', 3000);
        }
        fetchTelemetry();
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Helpers
  function escapeHtml(text) {
    return text ? String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]) : '';
  }

  function formatMarkdown(text) {
    if (!text) return '';
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1); padding:0.1rem 0.4rem; border-radius:4px; font-family:var(--font-mono)">$1</code>')
      .replace(/\n/g, '<br>');
  }
});
