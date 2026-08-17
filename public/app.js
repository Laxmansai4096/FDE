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

    let recCardsHtml = '';
    if (data.retrievedProducts && data.retrievedProducts.length > 0) {
      recCardsHtml = `<div class="rec-cards">` + data.retrievedProducts.map(p => `
        <div class="rec-card">
          <div class="rec-title">${escapeHtml(p.name)}</div>
          <div class="rec-price">${p.inRupees || '$' + p.price} • ${escapeHtml(p.family)}</div>
          <div class="rec-notes">Notes: ${p.topNotes ? p.topNotes.slice(0, 2).map(escapeHtml).join(', ') : ''}</div>
          <div style="font-size:0.7rem; color:var(--gold-primary); font-family:var(--font-mono); margin-top:0.3rem;">Vector Match: ${p.vectorScore ? (p.vectorScore * 100).toFixed(1) : 0}%</div>
        </div>
      `).join('') + `</div>`;
    }

    bubble.innerHTML = `
      <p>${formatMarkdown(data.response)}</p>
      ${recCardsHtml}
      <div class="msg-meta">
        ${cacheBadge}
        ${guardrailBadge}
      </div>
    `;
    if (chatStream) chatStream.scrollTop = chatStream.scrollHeight;
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
