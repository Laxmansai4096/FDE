/**
 * AURA PERFUMERY - Frontend Application Logic & FDE Operations Telemetry Inspector
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatStream = document.getElementById('chat-stream');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const agentModeToggle = document.getElementById('agent-mode-toggle');
  const sendBtnLabel = document.getElementById('send-btn-label');
  const catalogGrid = document.getElementById('catalog-grid');
  
  // Quiz Elements
  const quizMood = document.getElementById('quiz-mood');
  const quizSeason = document.getElementById('quiz-season');
  const quizNote = document.getElementById('quiz-note');
  const btnRunQuiz = document.getElementById('btn-run-quiz');
  const quizResults = document.getElementById('quiz-results');

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

  // Load Catalog Products
  fetchCatalog();
  fetchTelemetry();
  setInterval(fetchTelemetry, 4000); // Polling Telemetry metrics

  // Mode Toggle Switch Listener
  agentModeToggle.addEventListener('change', () => {
    if (agentModeToggle.checked) {
      sendBtnLabel.textContent = "🤖 Run Autonomous Agent";
    } else {
      sendBtnLabel.textContent = "Query Assistant";
    }
  });

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
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    // Render User Message
    renderUserMessage(query);
    chatInput.value = '';

    const isAgentMode = agentModeToggle.checked;

    if (isAgentMode) {
      await handleAgentQuery(query);
    } else {
      await handleStandardChat(query);
    }
  });

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

  // Microsoft AutoGen 4-Agent Team Execution Handler
  if (btnTriggerAutoGen) {
    btnTriggerAutoGen.addEventListener('click', runAutoGenTeam);
  }
  if (btnChipAutoGen) {
    btnChipAutoGen.addEventListener('click', runAutoGenTeam);
  }

  async function runAutoGenTeam() {
    autogenOutputBox.classList.remove('hidden');
    autogenTraceContent.innerHTML = `<div style="color: var(--accent-cyan); font-family: var(--font-mono);">⚡ Initializing Microsoft AutoGen GroupChat (SommelierAgent, InventoryAgent, ChemistAgent, ComplianceAgent)...</div>`;

    try {
      const res = await fetch('/api/autogen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: "Formulate signature perfume for black tie gala" })
      });

      const data = await res.json();
      renderAutoGenTrace(data);
    } catch (err) {
      autogenTraceContent.innerHTML = `<div style="color: var(--accent-danger);">Error executing AutoGen Team: ${err.message}</div>`;
    }
  }

  function renderAutoGenTrace(data) {
    let html = '';
    
    if (!data.conversationTrace || !Array.isArray(data.conversationTrace)) {
      autogenTraceContent.innerHTML = `<div style="color: var(--accent-danger);">Invalid AutoGen trace payload.</div>`;
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

    autogenTraceContent.innerHTML = html;
  }

  // Render Functions
  function renderUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message msg-user';
    div.innerHTML = `
      <div class="msg-avatar">YOU</div>
      <div class="msg-bubble"><p>${escapeHtml(text)}</p></div>
    `;
    chatStream.appendChild(div);
    chatStream.scrollTop = chatStream.scrollHeight;
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
    chatStream.appendChild(div);
    chatStream.scrollTop = chatStream.scrollHeight;
    return id;
  }

  function updateThinkingMessage(msgId, data) {
    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;

    const bubble = msgEl.querySelector('.msg-bubble');
    
    let cacheBadge = data.cacheHit ? `<span class="tag-cache">⚡ Semantic Cache Hit (0ms)</span>` : `<span class="tag-vector">⚙ LLM RAG Inference (${data.telemetryTrace.latencyMs}ms)</span>`;
    let guardrailBadge = data.guardrailStatus && data.guardrailStatus.flagged ? `<span style="color:var(--accent-danger); font-family:var(--font-mono); font-size:0.75rem;">🛡 Guardrail Triggered</span>` : '';

    let recCardsHtml = '';
    if (data.retrievedProducts && data.retrievedProducts.length > 0) {
      recCardsHtml = `<div class="rec-cards">` + data.retrievedProducts.map(p => `
        <div class="rec-card">
          <div class="rec-title">${p.name}</div>
          <div class="rec-price">$${p.price} • ${p.family}</div>
          <div class="rec-notes">Notes: ${p.topNotes.slice(0, 2).join(', ')}</div>
          <div style="font-size:0.7rem; color:var(--gold-primary); font-family:var(--font-mono); margin-top:0.3rem;">Vector Sim: ${(p.vectorScore * 100).toFixed(1)}%</div>
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
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function updateAgentMessage(msgId, data) {
    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;

    const bubble = msgEl.querySelector('.msg-bubble');
    const agentRes = data.agentResult;

    let stepsHtml = `<div class="react-steps-box">`;
    agentRes.traceSteps.forEach(s => {
      if (s.type === 'THOUGHT') {
        stepsHtml += `<div class="react-step-row"><span class="step-tag-thought">[THOUGHT]</span> <span>${s.content}</span></div>`;
      } else if (s.type === 'ACTION') {
        stepsHtml += `<div class="react-step-row"><span class="step-tag-action">[ACTION]</span> <span>Tool '${s.tool}': ${JSON.stringify(s.input)}</span></div>`;
      } else if (s.type === 'OBSERVATION') {
        stepsHtml += `<div class="react-step-row"><span class="step-tag-obs">[OBSERVATION]</span> <span>${JSON.stringify(s.output)}</span></div>`;
      }
    });
    stepsHtml += `</div>`;

    bubble.innerHTML = `
      <p style="color:var(--gold-primary); font-weight:600">${formatMarkdown(agentRes.finalAnswer)}</p>
      ${stepsHtml}
      <div class="msg-meta">
        <span class="tag-agent">🤖 Multi-Agent ReAct Execution (${data.telemetryTrace.latencyMs}ms)</span>
      </div>
    `;
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function updateErrorMessage(msgId, errText) {
    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;
    const bubble = msgEl.querySelector('.msg-bubble');
    bubble.innerHTML = `<p style="color:var(--accent-danger)">${errText}</p>`;
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
    catalogGrid.innerHTML = products.map(p => `
      <div class="product-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="p-family">${p.family}</span>
            <span style="font-size:0.75rem; color:${p.inStock ? 'var(--accent-green)' : 'var(--accent-danger)'}; font-family:var(--font-mono)">
              ${p.inStock ? `● ${p.stockCount} in stock` : '● OUT OF STOCK'}
            </span>
          </div>
          <h3 class="p-name">${p.name}</h3>
          <p class="p-tagline">${p.tagline}</p>

          <div class="p-notes-list">
            <div><strong>Top:</strong> ${p.topNotes.join(', ')}</div>
            <div><strong>Heart:</strong> ${p.heartNotes.join(', ')}</div>
            <div><strong>Base:</strong> ${p.baseNotes.join(', ')}</div>
          </div>
        </div>

        <div>
          <div class="rec-price">$${p.price} • ${p.sizes.join(', ')}</div>
          
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

  // Quiz Match Runner
  btnRunQuiz.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: quizMood.value,
          season: quizSeason.value,
          notePreference: quizNote.value
        })
      });

      const data = await res.json();
      quizResults.classList.remove('hidden');
      quizResults.innerHTML = data.recommendations.map(p => `
        <div class="product-card">
          <div class="p-family">${p.family}</div>
          <h3 class="p-name">${p.name}</h3>
          <p class="p-tagline">${p.description}</p>
          <div class="rec-price">$${p.price} • Match Score: ${(p.vectorScore * 100).toFixed(1)}%</div>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  });

  // Fetch Telemetry Inspector Data
  async function fetchTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      const data = await res.json();

      mRequests.textContent = data.totalRequests;
      mCacheRate.textContent = `${data.cacheHitRate}%`;
      mTokens.textContent = data.totalTokens;
      mCost.textContent = `$${data.totalCostUSD.toFixed(5)}`;

      statCache.textContent = `${data.cacheHitRate}%`;
      statCost.textContent = `$${data.totalCostUSD.toFixed(4)}`;

      if (data.traces.length > 0) {
        statLatency.textContent = `${data.traces[0].latencyMs} ms`;
        renderTraceTable(data.traces);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderTraceTable(traces) {
    traceTbody.innerHTML = traces.map(t => `
      <tr>
        <td>
          <div style="color:var(--gold-primary); font-weight:600">${t.timestamp.substring(11, 19)}</div>
          <div style="color:var(--text-dim); font-size:0.68rem">${t.traceId}</div>
        </td>
        <td>
          <div>${t.provider}</div>
          <div style="color:var(--text-dim); font-size:0.68rem">${t.model}</div>
        </td>
        <td>${t.cacheHit ? '<span class="tag-cache">HIT (0ms)</span>' : '<span style="color:var(--text-muted)">MISS</span>'}</td>
        <td style="font-weight:700; color:var(--accent-cyan)">${t.latencyMs}ms</td>
        <td>
          <div>${t.tokens.total} tok</div>
          <div style="color:var(--gold-primary); font-size:0.68rem">$${t.costUSD.toFixed(6)}</div>
        </td>
        <td>
          ${t.guardrailStatus.flagged ? '<span style="color:var(--accent-danger)">🛡 FLAGGED</span>' : '<span style="color:var(--accent-green)">✓ SAFE</span>'}
        </td>
      </tr>
    `).join('');
  }

  // Drawer Controls
  btnFdeOps.addEventListener('click', () => fdeDrawer.classList.add('open'));
  closeDrawer.addEventListener('click', () => fdeDrawer.classList.remove('open'));

  btnFlushCache.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/cache/flush', { method: 'POST' });
      const data = await res.json();
      cacheStatusMsg.textContent = data.message;
      setTimeout(() => cacheStatusMsg.textContent = '', 3000);
      fetchTelemetry();
    } catch (err) {
      console.error(err);
    }
  });

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
