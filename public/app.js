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
  const evalsOutputBox = document.getElementById('evals-output-box');
  const evalsTraceContent = document.getElementById('evals-trace-content');

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
  if (agentModeToggle) {
    agentModeToggle.addEventListener('change', () => {
      if (agentModeToggle.checked) {
        sendBtnLabel.textContent = "🤖 Run Autonomous Agent";
      } else {
        sendBtnLabel.textContent = "Send Request";
      }
    });
  }

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

  // Global 1-Click Instant Order Button Listener
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-order-instant');
    if (btn) {
      const perfumeName = btn.getAttribute('data-perfume');
      if (perfumeName) {
        chatInput.value = `Place order for ${perfumeName}`;
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

  // Fetch Live Order OMS & Relational Stock Data
  if (btnRefreshOMS) {
    btnRefreshOMS.addEventListener('click', fetchOMSData);
  }

  async function fetchOMSData() {
    try {
      // Fetch Orders
      const resOrders = await fetch('/api/orders');
      const orders = await resOrders.json();
      renderOrdersTable(orders);

      // Fetch Stock Catalog
      const resProducts = await fetch('/api/products');
      const dataProd = await resProducts.json();
      renderStockTable(dataProd.products);
    } catch (err) {
      console.error(err);
    }
  }

  function renderOrdersTable(orders) {
    if (!omsOrdersTbody) return;
    if (!orders || orders.length === 0) {
      omsOrdersTbody.innerHTML = `<tr><td colspan="4" class="text-center">No orders found in database.</td></tr>`;
      return;
    }

    omsOrdersTbody.innerHTML = orders.map(o => {
      let statusColor = "var(--gold-primary)";
      if (o.status === "SHIPPED") statusColor = "var(--accent-cyan)";
      if (o.status === "CANCELLED") statusColor = "var(--accent-danger)";
      if (o.status === "DELIVERED") statusColor = "var(--accent-green)";

      return `
        <tr>
          <td style="color:var(--gold-primary); font-weight:700">${escapeHtml(o.orderId)}</td>
          <td>${escapeHtml(o.productName)}</td>
          <td><span style="color:${statusColor}; font-weight:700">● ${escapeHtml(o.status)}</span></td>
          <td style="font-family:var(--font-mono); font-size:0.75rem">${escapeHtml(o.trackingNumber || 'N/A')}</td>
        </tr>
      `;
    }).join('');
  }

  function renderStockTable(products) {
    if (!omsStockTbody) return;
    if (!products) return;

    omsStockTbody.innerHTML = products.map(p => `
      <tr>
        <td style="font-weight:600">${escapeHtml(p.name)}</td>
        <td style="font-weight:700; color:var(--gold-primary)">${p.inRupees || '₹' + (p.price * 80)}</td>
        <td style="font-family:var(--font-mono); font-weight:700; color:${p.stockCount > 0 ? 'var(--gold-primary)' : 'var(--accent-danger)'}">${p.stockCount} units</td>
        <td><span style="color:${p.inStock ? 'var(--accent-green)' : 'var(--accent-danger)'}">${p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}</span></td>
      </tr>
    `).join('');
  }

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
      if (evalsTraceContent) evalsTraceContent.innerHTML = `<div style="color: var(--accent-cyan);">⚡ Running LLMOps Ragas Evaluation Suite against benchmark test cases...</div>`;

      try {
        const res = await fetch('/api/evals', { method: 'POST' });
        const data = await res.json();
        
        let html = `
          <div style="color: var(--accent-green); font-weight: 700; margin-bottom: 0.6rem;">
            📊 Ragas Evaluation Benchmark Results (Composite Quality Score: ${data.overallScores.ragasCompositeQualityScore})
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; margin-bottom: 0.8rem;">
            Faithfulness: <strong>${data.overallScores.avgFaithfulness}</strong> | 
            Answer Relevance: <strong>${data.overallScores.avgAnswerRelevance}</strong> | 
            Context Precision: <strong>${data.overallScores.avgContextPrecision}</strong>
          </div>
        `;

        data.testResults.forEach(t => {
          html += `
            <div style="padding: 0.4rem; background: rgba(255,255,255,0.03); margin-bottom: 0.4rem; border-radius: 4px; font-size: 0.78rem;">
              <span style="color: var(--gold-primary); font-weight: 700;">[${escapeHtml(t.testId)}] "${escapeHtml(t.query)}"</span> ➔ 
              <span style="color: var(--accent-green)">MATCH: ${escapeHtml(t.actualTopProduct)} (${(t.topSimilarity*100).toFixed(1)}%) - ${escapeHtml(t.status)}</span>
            </div>
          `;
        });

        if (evalsTraceContent) evalsTraceContent.innerHTML = html;
      } catch (err) {
        if (evalsTraceContent) evalsTraceContent.innerHTML = `<div style="color: var(--accent-danger)">Error: ${err.message}</div>`;
      }
    });
  }

  // Security Red-Teaming Audit Runner
  if (btnRunRedteam) {
    btnRunRedteam.addEventListener('click', async () => {
      if (evalsOutputBox) evalsOutputBox.classList.remove('hidden');
      if (evalsTraceContent) evalsTraceContent.innerHTML = `<div style="color: var(--accent-danger);">🛡 Firing Adversarial Red-Team Payloads (Prompt Injections, PII Extractions, DAN Jailbreaks)...</div>`;

      try {
        const res = await fetch('/api/redteam', { method: 'POST' });
        const data = await res.json();

        let html = `
          <div style="color: var(--accent-green); font-weight: 700; margin-bottom: 0.6rem;">
            🛡 Adversarial Red-Team Audit Report (${data.defensePassRate} Pass Rate - ${escapeHtml(data.status)})
          </div>
        `;

        data.auditTrace.forEach(a => {
          html += `
            <div style="padding: 0.4rem; background: rgba(255,255,255,0.03); margin-bottom: 0.4rem; border-radius: 4px; font-size: 0.78rem;">
              <span style="color: var(--accent-purple); font-weight: 700;">[${escapeHtml(a.attackId)}] ${escapeHtml(a.category)}:</span> "${escapeHtml(a.prompt)}" ➔ 
              <span style="color: var(--accent-green)">STATUS: ${escapeHtml(a.status)} (${a.reasons.map(escapeHtml).join(', ')})</span>
            </div>
          `;
        });

        if (evalsTraceContent) evalsTraceContent.innerHTML = html;
      } catch (err) {
        if (evalsTraceContent) evalsTraceContent.innerHTML = `<div style="color: var(--accent-danger)">Error: ${err.message}</div>`;
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
      <div class="msg-avatar">AURA</div>
      <div class="msg-bubble">
        <p class="pulse-text">Evaluating scent vectors & guardrails...</p>
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
      recCardsHtml = `<div class="rec-cards">` + data.retrievedProducts.map(p => `
        <div class="rec-card">
          <div class="rec-title">${escapeHtml(p.name)}</div>
          <div class="rec-price">${p.inRupees || '$' + p.price} • ${escapeHtml(p.family)}</div>
          <div class="rec-notes">Notes: ${p.topNotes ? p.topNotes.slice(0, 2).map(escapeHtml).join(', ') : ''}</div>
          <div style="font-size:0.75rem; color:var(--gold-primary); font-family:var(--font-mono); margin-top:0.3rem;">Vector Match: ${p.vectorScore ? (p.vectorScore * 100).toFixed(1) : 0}%</div>
          <button class="btn-order-instant" data-perfume="${escapeHtml(p.name)}" style="background:linear-gradient(135deg, var(--gold-primary), #B48847); color:#000; font-weight:700; border:none; padding:0.4rem 0.8rem; border-radius:4px; margin-top:0.5rem; cursor:pointer; font-size:0.78rem; width:100%; transition:transform 0.1s ease;">
            🛒 1-Click Instant Order (${p.inRupees || '$' + p.price})
          </button>
        </div>
      `).join('') + `</div>`;
    }

    let routingTraceHtml = '';
    if (data.routingTrace && data.routingTrace.length > 0) {
      routingTraceHtml = `<div style="margin-top:0.6rem; background:rgba(0,0,0,0.4); border:1px solid rgba(226,192,133,0.15); border-radius:6px; padding:0.5rem 0.8rem; font-family:var(--font-mono); font-size:0.72rem;">` +
        `<div style="color:var(--gold-primary); font-weight:bold; margin-bottom:0.3rem;">🔀 LLM Gateway Dynamic Route Trace:</div>` +
        data.routingTrace.map(step => `<div style="color:var(--text-muted); margin-bottom:0.15rem;">↳ ${escapeHtml(step)}</div>`).join('') +
        `</div>`;
    }

    bubble.innerHTML = `
      <p>${formatMarkdown(data.response)}</p>
      ${recCardsHtml}
      ${routingTraceHtml}
      <div class="msg-meta">
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
          let agentTitle = "Master Perfumer (SommelierAgent)";

          if (step.agent === "InventoryAgent") {
            agentColor = "var(--accent-cyan)";
            agentIcon = "📦";
            agentTitle = "Atelier Inventory Manager";
          } else if (step.agent === "ChemistAgent") {
            agentColor = "var(--accent-green)";
            agentIcon = "🧪";
            agentTitle = "Perfume Chemist";
          } else if (step.agent === "ComplianceAgent") {
            agentColor = "var(--accent-danger)";
            agentIcon = "🛡️";
            agentTitle = "Safety & IFRA Regulatory Director";
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
          <div style="font-family:var(--font-title); color:var(--gold-primary); font-size:1.1rem; font-weight:700; letter-spacing:1px; margin-bottom:0.4rem;">
            📜 ROYAL PERFUMERY AI COMMITTEE UNANIMOUS CERTIFICATE
          </div>
          <div style="font-size:0.85rem; color:var(--text-main); margin-bottom:1rem;">
            ${formatMarkdown(data.finalConsensus)}
          </div>
          <div style="display:flex; justify-content:center; gap:1.2rem; flex-wrap:wrap; font-size:0.78rem; font-family:var(--font-mono); color:var(--accent-green);">
            <span>✓ Master Perfumer Signed</span>
            <span>✓ Stock Verified</span>
            <span>✓ Chemically Formulated</span>
            <span>✓ 100% IFRA Certified Safe</span>
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

    let stepsHtml = `<div class="react-steps-box">`;
    if (agentRes && agentRes.traceSteps) {
      agentRes.traceSteps.forEach(s => {
        if (s.type === 'THOUGHT') {
          stepsHtml += `<div class="react-step-row"><span class="step-tag-thought">[THOUGHT]</span> <span>${escapeHtml(s.content)}</span></div>`;
        } else if (s.type === 'ACTION') {
          stepsHtml += `<div class="react-step-row"><span class="step-tag-action">[ACTION]</span> <span>Tool '${escapeHtml(s.tool)}': ${escapeHtml(JSON.stringify(s.input))}</span></div>`;
        } else if (s.type === 'OBSERVATION') {
          stepsHtml += `<div class="react-step-row"><span class="step-tag-obs">[OBSERVATION]</span> <span>${escapeHtml(JSON.stringify(s.output))}</span></div>`;
        }
      });
    }
    stepsHtml += `</div>`;

    bubble.innerHTML = `
      <p style="color:var(--gold-primary); font-weight:600">${formatMarkdown(agentRes ? agentRes.finalAnswer : '')}</p>
      ${stepsHtml}
      <div class="msg-meta">
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
        routingInfo = `<div style="color:var(--accent-purple); font-size:0.68rem; margin-top:0.2rem;">${escapeHtml(t.routingTrace[t.routingTrace.length - 1])}</div>`;
      }

      return `
        <tr>
          <td>
            <div style="color:var(--gold-primary); font-weight:600">${escapeHtml(t.timestamp.substring(11, 19))}</div>
            <div style="color:var(--text-dim); font-size:0.68rem">${escapeHtml(t.traceId)}</div>
          </td>
          <td>
            <div>${escapeHtml(t.provider)}</div>
            <div style="color:var(--text-dim); font-size:0.68rem">${escapeHtml(t.model)}</div>
            ${routingInfo}
          </td>
          <td>${t.cacheHit ? '<span class="tag-cache">HIT (0ms)</span>' : '<span style="color:var(--text-muted)">MISS</span>'}</td>
          <td style="font-weight:700; color:var(--accent-cyan)">${t.latencyMs}ms</td>
          <td>
            <div>${t.tokens ? t.tokens.total : 0} tok</div>
            <div style="color:var(--gold-primary); font-size:0.68rem">$${t.costUSD ? t.costUSD.toFixed(6) : '0.000000'}</div>
          </td>
          <td>
            ${t.guardrailStatus && t.guardrailStatus.flagged ? '<span style="color:var(--accent-danger)">🛡 FLAGGED</span>' : '<span style="color:var(--accent-green)">✓ SAFE</span>'}
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
