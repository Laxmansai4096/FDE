/**
 * AURA PERFUMERY - Frontend Application Logic & FDE Operations Telemetry Client
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const chatStream = document.getElementById('chat-stream');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const catalogGrid = document.getElementById('catalog-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const promptChips = document.querySelectorAll('.chip-btn');
  const agentModeToggle = document.getElementById('agent-mode-toggle');
  const sendBtnLabel = document.getElementById('send-btn-label');
  
  // Quiz
  const btnRunQuiz = document.getElementById('btn-run-quiz');
  const quizResultsContainer = document.getElementById('quiz-results');

  // FDE Drawer
  const btnToggleDrawer = document.getElementById('toggle-fde-drawer');
  const btnCloseDrawer = document.getElementById('close-drawer');
  const fdeDrawer = document.getElementById('fde-drawer');
  const btnFlushCache = document.getElementById('btn-flush-cache');
  const cacheStatusMsg = document.getElementById('cache-status-msg');

  // Telemetry Labels
  const statLatency = document.getElementById('stat-latency');
  const statCache = document.getElementById('stat-cache');
  const statCost = document.getElementById('stat-cost');

  const mRequests = document.getElementById('m-requests');
  const mCacheRate = document.getElementById('m-cache-rate');
  const mTokens = document.getElementById('m-tokens');
  const mCost = document.getElementById('m-cost');
  const traceTbody = document.getElementById('trace-tbody');

  let catalogData = [];

  // Initialize
  fetchProducts();
  fetchTelemetry();
  setInterval(fetchTelemetry, 4000); // Poll telemetry every 4 seconds

  // Event Listeners
  btnToggleDrawer.addEventListener('click', () => fdeDrawer.classList.add('open'));
  btnCloseDrawer.addEventListener('click', () => fdeDrawer.classList.remove('open'));

  agentModeToggle.addEventListener('change', () => {
    if (agentModeToggle.checked) {
      sendBtnLabel.innerText = '🤖 Run Autonomous Agent';
    } else {
      sendBtnLabel.innerText = 'Query Sommelier';
    }
  });

  btnFlushCache.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/cache/flush', { method: 'POST' });
      const data = await res.json();
      cacheStatusMsg.innerText = data.message;
      fetchTelemetry();
      setTimeout(() => { cacheStatusMsg.innerText = ''; }, 3000);
    } catch (err) {
      console.error("Flush cache error:", err);
    }
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const family = btn.getAttribute('data-filter');
      renderCatalog(family);
    });
  });

  // Quick Prompt Chips
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt');
      if (chip.classList.contains('chip-agent')) {
        agentModeToggle.checked = true;
        sendBtnLabel.innerText = '🤖 Run Autonomous Agent';
      }
      chatInput.value = promptText;
      chatForm.dispatchEvent(new Event('submit'));
    });
  });

  // Chat Form Submit
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    const isAgentMode = agentModeToggle.checked;

    // Append User Message
    appendUserMessage(query);
    chatInput.value = '';

    // Show Loading AI indicator
    const loadingId = appendLoadingMessage(isAgentMode ? "🤖 Agentic Reasoning & Tool Calling in Progress..." : "Querying LLM Gateway & Vector Database...");

    try {
      let endpoint = isAgentMode ? '/api/agent' : '/api/chat';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();

      removeLoadingMessage(loadingId);

      if (isAgentMode && data.agentResult) {
        appendAgenticMessage(data);
      } else {
        appendAIMessage(data);
      }

      fetchTelemetry(); // Instant refresh telemetry
    } catch (err) {
      removeLoadingMessage(loadingId);
      appendErrorMessage("Network error connecting to LLM Gateway.");
    }
  });

  // Quiz Match
  btnRunQuiz.addEventListener('click', async () => {
    const mood = document.getElementById('quiz-mood').value;
    const season = document.getElementById('quiz-season').value;
    const notePreference = document.getElementById('quiz-note').value;

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, season, notePreference })
      });
      const data = await res.json();
      renderQuizResults(data.recommendations);
    } catch (err) {
      console.error("Quiz error:", err);
    }
  });

  // Fetch Products Catalog
  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      catalogData = data.products;
      renderCatalog('all');
    } catch (err) {
      console.error("Error fetching catalog:", err);
    }
  }

  // Render Catalog Cards with 6D Scent Accord Vector Sliders
  function renderCatalog(familyFilter = 'all') {
    catalogGrid.innerHTML = '';
    const filtered = familyFilter === 'all' 
      ? catalogData 
      : catalogData.filter(p => p.family.toLowerCase() === familyFilter.toLowerCase());

    const accordLabels = ['Citrus', 'Woody', 'Floral', 'Amber', 'Gourmand', 'Fresh'];

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const vectorBarsHTML = p.scentVector.map((val, idx) => `
        <div class="vec-bar-row">
          <span style="width: 55px">${accordLabels[idx]}</span>
          <div class="vec-bar-track">
            <div class="vec-bar-fill" style="width: ${val * 100}%"></div>
          </div>
          <span>${(val * 100).toFixed(0)}%</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div>
          <div class="p-family">${p.family} • $${p.price}</div>
          <h3 class="p-name">${p.name}</h3>
          <p class="p-tagline">${p.tagline}</p>
          
          <div class="p-notes-list">
            <div><strong>Top:</strong> ${p.topNotes.join(', ')}</div>
            <div><strong>Heart:</strong> ${p.heartNotes.join(', ')}</div>
            <div><strong>Base:</strong> ${p.baseNotes.join(', ')}</div>
          </div>
        </div>

        <div>
          <div class="vector-bars">
            <div class="vector-bars-title">Scent Accord Vector Space [6D]</div>
            ${vectorBarsHTML}
          </div>
          <div style="margin-top: 1rem; font-size: 0.8rem; color: ${p.inStock ? '#34D399' : '#F87171'}">
            ${p.inStock ? `● In Stock (${p.stockCount} units)` : '✖ Backorder Reserved'}
          </div>
        </div>
      `;
      catalogGrid.appendChild(card);
    });
  }

  // Render Chat Messages
  function appendUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message msg-user';
    div.innerHTML = `
      <div class="msg-avatar">YOU</div>
      <div class="msg-bubble"><p>${escapeHTML(text)}</p></div>
    `;
    chatStream.appendChild(div);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function appendLoadingMessage(label) {
    const id = 'load_' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message msg-ai';
    div.innerHTML = `
      <div class="msg-avatar">AURA</div>
      <div class="msg-bubble"><p><em>${label}</em></p></div>
    `;
    chatStream.appendChild(div);
    chatStream.scrollTop = chatStream.scrollHeight;
    return id;
  }

  function removeLoadingMessage(id) {
    const elem = document.getElementById(id);
    if (elem) elem.remove();
  }

  function appendAIMessage(data) {
    const div = document.createElement('div');
    div.className = 'message msg-ai';

    const isCacheHit = data.cacheHit;
    const latency = data.telemetryTrace ? data.telemetryTrace.latencyMs : 0;
    const isFlagged = data.guardrailStatus && data.guardrailStatus.flagged;

    let recCardsHTML = '';
    if (data.retrievedProducts && data.retrievedProducts.length > 0) {
      recCardsHTML = `
        <div class="rec-cards">
          ${data.retrievedProducts.map(p => `
            <div class="rec-card">
              <div class="rec-title">${p.name}</div>
              <div class="rec-price">$${p.price} • ${p.family}</div>
              <div class="rec-notes"><strong>Notes:</strong> ${p.topNotes[0]}, ${p.baseNotes[0]}</div>
              <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); margin-top: 0.4rem">
                Vector Sim: ${(p.vectorScore * 100).toFixed(1)}%
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    div.innerHTML = `
      <div class="msg-avatar">AURA</div>
      <div class="msg-bubble">
        <p>${formatMarkdownText(data.response)}</p>
        ${recCardsHTML}
        
        <div class="msg-meta">
          ${isCacheHit ? `<span class="tag-cache">⚡ Semantic Cache Hit (${latency}ms)</span>` : `<span class="tag-vector">⚙ LLM RAG Inference (${latency}ms)</span>`}
          ${isFlagged ? `<span style="color: var(--accent-danger)">🛡 Guardrail Triggered</span>` : ``}
        </div>
      </div>
    `;

    chatStream.appendChild(div);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function appendAgenticMessage(data) {
    const div = document.createElement('div');
    div.className = 'message msg-ai';
    const result = data.agentResult;
    const latency = data.telemetryTrace ? data.telemetryTrace.latencyMs : 0;

    let reactStepsHTML = '';
    if (result.traceSteps) {
      reactStepsHTML = `
        <div class="react-steps-box">
          <div style="font-weight: bold; color: var(--accent-purple); margin-bottom: 0.4rem;">🤖 Agent ReAct Execution Trace:</div>
          ${result.traceSteps.map(s => `
            <div class="react-step-row">
              <span class="step-tag-${s.type.toLowerCase()}">[${s.type}]</span>
              <span>${s.tool ? `Tool '${s.tool}': ` : ''}${typeof s.content === 'string' ? s.content : (typeof s.output === 'string' ? s.output : JSON.stringify(s.output || s.input))}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    div.innerHTML = `
      <div class="msg-avatar" style="background: var(--accent-purple)">AGENT</div>
      <div class="msg-bubble">
        <p>${formatMarkdownText(result.finalAnswer)}</p>
        ${reactStepsHTML}
        <div class="msg-meta">
          <span class="tag-agent">🤖 Multi-Agent ReAct Execution (${latency}ms)</span>
        </div>
      </div>
    `;

    chatStream.appendChild(div);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function appendErrorMessage(msg) {
    const div = document.createElement('div');
    div.className = 'message msg-ai';
    div.innerHTML = `
      <div class="msg-avatar">ERR</div>
      <div class="msg-bubble"><p style="color: var(--accent-danger)">${msg}</p></div>
    `;
    chatStream.appendChild(div);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  // Quiz Results Renderer
  function renderQuizResults(products) {
    quizResultsContainer.classList.remove('hidden');
    quizResultsContainer.innerHTML = '';

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div>
          <div class="p-family">Vector Score: ${(p.vectorScore * 100).toFixed(1)}%</div>
          <h3 class="p-name">${p.name}</h3>
          <p class="p-tagline">${p.tagline}</p>
          <div class="p-notes-list">
            <div><strong>Top Notes:</strong> ${p.topNotes.join(', ')}</div>
            <div><strong>Base Notes:</strong> ${p.baseNotes.join(', ')}</div>
          </div>
        </div>
        <div class="rec-price" style="color: var(--gold-primary); font-size: 1.1rem; margin-top: 1rem">
          $${p.price} — ${p.inStock ? 'Available' : 'Pre-order'}
        </div>
      `;
      quizResultsContainer.appendChild(card);
    });
  }

  // Fetch Telemetry Data & Update Dashboard / Drawer
  async function fetchTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      const data = await res.json();

      // Top Stats
      statLatency.innerText = data.avgLatencyMs;
      statCache.innerText = data.cacheHitRate;
      statCost.innerText = data.totalCostUSD;

      // Drawer Metrics
      mRequests.innerText = data.totalRequests;
      mCacheRate.innerText = data.cacheHitRate;
      mTokens.innerText = data.totalTokens;
      mCost.innerText = data.totalCostUSD;

      // Table Traces
      if (data.recentTraces && data.recentTraces.length > 0) {
        traceTbody.innerHTML = data.recentTraces.map(t => `
          <tr>
            <td>
              <div>${t.timestamp.split('T')[1].substring(0, 8)}</div>
              <div style="font-size: 0.65rem; color: var(--text-dim)">${t.traceId}</div>
            </td>
            <td>
              <div>${t.provider}</div>
              <div style="font-size: 0.65rem; color: var(--text-dim)">${t.model}</div>
            </td>
            <td>${t.cacheHit ? '<span style="color:var(--accent-green)">HIT</span>' : '<span style="color:var(--text-dim)">MISS</span>'}</td>
            <td>${t.latencyMs}ms</td>
            <td>
              <div>${t.tokens.total} tok</div>
              <div style="font-size: 0.65rem; color: var(--text-dim)">$${t.costUSD.toFixed(5)}</div>
            </td>
            <td>
              ${t.guardrailStatus.flagged 
                ? `<span style="color:var(--accent-danger)">FLAGGED (${t.guardrailStatus.reasons.length})</span>` 
                : '<span style="color:var(--accent-green)">PASS</span>'}
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error("Error fetching telemetry:", err);
    }
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function formatMarkdownText(str) {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
});
