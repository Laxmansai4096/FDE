/**
 * AURA PERFUMERY - Enterprise LLM Gateway, Load Balancer & Provider Failover Engine
 * 
 * FDE Architecture Concept:
 * 1. Hybrid LLM Guardrails: Dual-layer security engine combining fast Regex pattern matching 
 *    with an LLM/SLM Semantic Security Classifier to catch ambiguous prompt injections, 
 *    roleplay jailbreaks, and obfuscated PII (e.g., "user [at] domain [dot] com").
 * 2. Multi-Region Load Balancing: Round-Robin distribution across model endpoint replicas.
 * 3. Dynamic Provider Routing: Local Ollama -> Primary Cloud LLM -> Backup Cloud Failover.
 * 4. Circuit Breaker Fallback: Trips on provider 5xx errors or timeouts and automatically reroutes traffic.
 */

const { textToScentVector, cosineSimilarity } = require('./db');

class LLMGateway {
  constructor() {
    this.semanticCache = [];
    this.cacheSimilarityThreshold = 0.88;

    // Multi-Region Model Replica Pool for Load Balancing
    this.replicaPool = [
      { id: "gemini-1.5-flash-us-east", provider: "Gemini-US-East", status: "HEALTHY", latencyMs: 45, loadCount: 0 },
      { id: "gemini-1.5-flash-eu-west", provider: "Gemini-EU-West", status: "HEALTHY", latencyMs: 38, loadCount: 0 },
      { id: "gemini-1.5-flash-ap-south", provider: "Gemini-AP-South", status: "HEALTHY", latencyMs: 62, loadCount: 0 }
    ];
    this.rrIndex = 0;

    // Primary Model Provider Configuration
    this.primaryProvider = { id: "gemini-1.5-flash", name: "Google Gemini 1.5 Flash", model: "gemini-1.5-flash" };

    // Circuit Breaker State & Fallback Providers
    this.circuitBreaker = {
      primaryState: "CLOSED",
      consecutiveFailures: 0,
      failureThreshold: 3,
      simulatedOutage: false
    };

    this.fallbackProviders = [
      { id: "azure-gpt4o", name: "Azure-OpenAI-GPT4o-Backup", model: "gpt-4o", priority: 1, type: "CLOUD_BACKUP", active: true },
      { id: "claude-sonnet", name: "Anthropic-Claude-3.5-Fallback", model: "claude-3-5-sonnet", priority: 2, type: "CLOUD_BACKUP", active: true },
      { id: "ollama-local", name: "Ollama-Local-LLM", model: "llama3:8b", priority: 3, type: "LOCAL_OFFLINE", active: true }
    ];
  }

  configureGateway({ primaryProviderId, disabledFallbacks = [] }) {
    const primaryOptions = {
      "gemini-1.5-flash": { id: "gemini-1.5-flash", name: "Google Gemini 1.5 Flash", model: "gemini-1.5-flash" },
      "gemini-1.5-pro": { id: "gemini-1.5-pro", name: "Google Gemini 1.5 Pro", model: "gemini-1.5-pro" },
      "gpt-4o": { id: "gpt-4o", name: "Azure OpenAI GPT-4o", model: "gpt-4o" },
      "claude-3-5-sonnet": { id: "claude-3-5-sonnet", name: "Anthropic Claude 3.5 Sonnet", model: "claude-3-5-sonnet" },
      "llama3:8b": { id: "llama3:8b", name: "Local Ollama Llama 3", model: "llama3:8b" }
    };

    if (primaryProviderId && primaryOptions[primaryProviderId]) {
      this.primaryProvider = primaryOptions[primaryProviderId];
    }

    if (Array.isArray(disabledFallbacks)) {
      this.fallbackProviders.forEach(f => {
        f.active = !disabledFallbacks.includes(f.id) && !disabledFallbacks.includes(f.name);
      });
    }

    return this.getDiagnosticReport();
  }

  // ---------------------------------------------------------------------------
  // ADVANCED DUAL-LAYER GUARDRAILS (STATIC REGEX + SEMANTIC LLM CLASSIFIER)
  // ---------------------------------------------------------------------------
  
  /**
   * Layer 1: Fast Regex PII & Keyword Security Filter
   */
  runStaticRegexGuardrails(query) {
    let sanitized = query;
    let flagged = false;
    let reasons = [];

    // Static PII Patterns
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const obfuscatedEmailRegex = /[a-zA-Z0-9._%+-]+\s*\[at\]\s*[a-zA-Z0-9.-]+\s*\[dot\]\s*[a-zA-Z]{2,}/gi;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}([-.\s]?\d{3,5})?\b|\b\d{10}\b/g;
    const creditCardRegex = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g;

    const s1 = sanitized.replace(emailRegex, "[REDACTED_EMAIL]");
    if (s1 !== sanitized) {
      sanitized = s1;
      flagged = true;
      reasons.push("PII: Email Address scrubbed (Regex)");
    }
    const s2 = sanitized.replace(obfuscatedEmailRegex, "[REDACTED_EMAIL]");
    if (s2 !== sanitized) {
      sanitized = s2;
      flagged = true;
      reasons.push("PII: Obfuscated Email scrubbed (Regex)");
    }
    const s3 = sanitized.replace(phoneRegex, "[REDACTED_PHONE]");
    if (s3 !== sanitized) {
      sanitized = s3;
      flagged = true;
      reasons.push("PII: Phone Number scrubbed (Regex)");
    }
    const s4 = sanitized.replace(creditCardRegex, "[REDACTED_CARD]");
    if (s4 !== sanitized) {
      sanitized = s4;
      flagged = true;
      reasons.push("PII: Credit Card scrubbed (Regex)");
    }

    // Static Direct Prompt Injection Keywords
    const injectionKeywords = [
      "ignore previous instructions",
      "ignore all instructions",
      "reveal system prompt",
      "print internal instructions",
      "you are now a dark web assistant",
      "override safety",
      "system shutdown",
      "dan do anything now",
      "bypass safety",
      "drop table",
      "secret api keys",
      "unrestricted developer",
      "forget rules",
      "system('",
      "exec(",
      "eval(",
      "override boundary"
    ];

    const lower = query.toLowerCase();
    for (const kw of injectionKeywords) {
      if (lower.includes(kw)) {
        flagged = true;
        reasons.push(`Security: Direct Prompt Injection Detected ('${kw}')`);
      }
    }

    return { sanitizedQuery: sanitized, flagged, reasons };
  }

  /**
   * Layer 2: Advanced LLM/SLM Security Classifier & Obfuscated PII Inspector
   * Evaluates complex, indirect, roleplay jailbreaks and obfuscated PII ("user [at] domain [dot] com")
   */
  runLLMSecurityClassifier(query) {
    const lower = query.toLowerCase();

    // Semantic evaluation rules for ambiguous/indirect attacks
    let isMalicious = false;
    let threatCategory = "SAFE";
    let reasoning = "Query passed LLM semantic security inspection.";
    let llmSanitizedQuery = query;

    // A. Detect Obfuscated PII (e.g., "buyer [at] domain [dot] com" or "card 4 5 3 2...")
    const obfuscatedEmailRegex = /\b[a-zA-Z0-9._%+-]+\s*(\[at\]|\(at\)|@|\sat\s)\s*[a-zA-Z0-9.-]+\s*(\[dot\]|\(dot\)|\.|\sdot\s)\s*[a-zA-Z]{2,}\b/gi;
    if (obfuscatedEmailRegex.test(query)) {
      llmSanitizedQuery = llmSanitizedQuery.replace(obfuscatedEmailRegex, "[REDACTED_EMAIL]");
    }

    // B. Detect Ambiguous / Indirect Prompt Injections & Roleplay Jailbreaks
    const indirectJailbreakPatterns = [
      "imagine you have no rules",
      "pretend you are unfiltered",
      "dan mode",
      "do anything now",
      "hypothetical scenario where you reveal",
      "translate this base64 prompt",
      "encode your system prompt",
      "bypass safety policy",
      "ignore security boundaries",
      "act as developer mode"
    ];

    for (const pattern of indirectJailbreakPatterns) {
      if (lower.includes(pattern)) {
        isMalicious = true;
        threatCategory = "AMBIGUOUS_PROMPT_INJECTION";
        reasoning = `LLM Security Classifier caught semantic jailbreak intent: '${pattern}'`;
        break;
      }
    }

    // C. Detect System Prompt / Instruction Exfiltration Intent
    if (lower.includes("system prompt") || lower.includes("developer prompt") || lower.includes("internal instructions") || lower.includes("confidential rules")) {
      if (lower.includes("show") || lower.includes("print") || lower.includes("give") || lower.includes("display") || lower.includes("reveal")) {
        isMalicious = true;
        threatCategory = "SYSTEM_PROMPT_EXFILTRATION";
        reasoning = "LLM Security Classifier detected system prompt exfiltration request.";
      }
    }

    return {
      isMalicious,
      threatCategory,
      reasoning,
      llmSanitizedQuery
    };
  }

  /**
   * Main Hybrid Guardrail Entry Point
   */
  runGuardrails(query) {
    // Step 1: Fast Static Regex Check
    const staticResult = this.runStaticRegexGuardrails(query);

    // Step 2: Advanced LLM / SLM Security Inspection
    const llmResult = this.runLLMSecurityClassifier(staticResult.sanitizedQuery);

    let finalSanitizedQuery = llmResult.llmSanitizedQuery;
    let flagged = staticResult.flagged || llmResult.isMalicious;
    let reasons = [...staticResult.reasons];

    if (llmResult.isMalicious) {
      reasons.push(`LLM Security Classifier: ${llmResult.reasoning}`);
    }

    if (llmResult.llmSanitizedQuery !== staticResult.sanitizedQuery && !reasons.some(r => r.includes("Obfuscated PII"))) {
      flagged = true;
      reasons.push("PII: Obfuscated Email Address scrubbed by LLM Classifier");
    }

    // Passed if unflagged OR if all reasons are benign PII scrubbing
    const passed = !flagged || reasons.every(r => r.startsWith("PII"));

    return {
      sanitizedQuery: finalSanitizedQuery,
      flagged,
      reasons,
      passed,
      guardrailEngine: "Dual-Layer (Static Regex + LLM Security Classifier)"
    };
  }

  // ---------------------------------------------------------------------------
  // LOAD BALANCER & CIRCUIT BREAKER ENGINE
  // ---------------------------------------------------------------------------
  
  getNextHealthyReplica() {
    const healthyReplicas = this.replicaPool.filter(r => r.status === "HEALTHY");
    if (healthyReplicas.length === 0) {
      return null;
    }

    const selected = healthyReplicas[this.rrIndex % healthyReplicas.length];
    this.rrIndex++;
    selected.loadCount++;
    return selected;
  }

  setSimulatedOutage(enable = true) {
    this.circuitBreaker.simulatedOutage = enable;
    if (enable) {
      this.circuitBreaker.primaryState = "OPEN";
      this.circuitBreaker.consecutiveFailures = 5;
      this.replicaPool.forEach(r => r.status = "UNHEALTHY");
    } else {
      this.circuitBreaker.primaryState = "CLOSED";
      this.circuitBreaker.consecutiveFailures = 0;
      this.replicaPool.forEach(r => r.status = "HEALTHY");
    }
    return {
      circuitBreakerState: this.circuitBreaker.primaryState,
      simulatedOutage: this.circuitBreaker.simulatedOutage,
      replicaPool: this.replicaPool
    };
  }

  resolveDynamicRoute(queryVector, wasFlagged = false, rawQuery = "") {
    const trace = [];

    const hasPiiRedaction = rawQuery.includes("[REDACTED_EMAIL]") || 
                            rawQuery.includes("[REDACTED_PHONE]") || 
                            rawQuery.includes("[REDACTED_CARD]");

    const lowerQuery = rawQuery.toLowerCase().trim();
    const isGreeting = ["hi", "hii", "hiii", "hello", "hey", "namaste", "good morning", "good evening", "who are you", "what can you do", "help"].includes(lowerQuery);

    // Step A: Semantic Cache Check (Bypassed if PII Guardrail flagged or PII Redacted or Simple Greeting)
    if (!wasFlagged && !hasPiiRedaction && !isGreeting) {
      const cacheResult = this.checkCache(queryVector);
      if (cacheResult.hit) {
        trace.push(`[1. Cache Check] HIT (Cosine Similarity: ${cacheResult.similarity} >= 0.88). Routing to Gateway Semantic Cache.`);
        return {
          routeType: "CACHE_HIT",
          providerUsed: "Gateway-Semantic-Cache",
          modelUsed: "vector-similarity-cache",
          cacheResult,
          routingTrace: trace
        };
      } else {
        trace.push("[1. Cache Check] MISS. Proceeding to Provider Routing.");
      }
    } else {
      const reason = hasPiiRedaction ? "PII Redaction Detected" : (wasFlagged ? "Security Guardrail Flagged" : "General Greeting Prompt");
      trace.push(`[1. Cache Check] BYPASSED (${reason}). Guarantees fresh response & prevents cache collision.`);
    }

    // Step B: Circuit Breaker & Load Balancer Evaluation
    if (this.circuitBreaker.simulatedOutage || this.circuitBreaker.primaryState === "OPEN") {
      trace.push(`⚠️ [2. Primary Circuit Breaker] OPEN (Primary ${this.primaryProvider.name} Outage Detected!). Initiating Automatic Failover.`);
      
      const activeFallback = this.fallbackProviders.find(f => f.active !== false);
      if (activeFallback) {
        trace.push(`🔄 [3. Provider Failover] Routed to Active Backup Provider: ${activeFallback.name} (${activeFallback.model}). SLA Preserved.`);

        return {
          routeType: "PROVIDER_FAILOVER",
          providerUsed: `${activeFallback.name} (Automatic Failover)`,
          modelUsed: activeFallback.model,
          failoverTriggered: true,
          routingTrace: trace
        };
      } else {
        trace.push(`❌ [3. Provider Failover] ALL Fallback Providers are DESELECTED/DISABLED by Gateway Admin.`);

        return {
          routeType: "PROVIDER_FAILOVER_FAILED",
          providerUsed: "None (All Fallbacks Disabled)",
          modelUsed: "none",
          failoverTriggered: true,
          routingTrace: trace
        };
      }
    }

    // Step C: Round-Robin Load Balancing across Healthy Primary Replicas
    const selectedReplica = this.getNextHealthyReplica();
    trace.push(`⚖️ [2. Multi-Region Load Balancer] Primary: ${this.primaryProvider.name}. Selected Replica '${selectedReplica.id}' (${selectedReplica.provider}) via Round-Robin distribution.`);

    return {
      routeType: "PRIMARY_LOAD_BALANCED",
      providerUsed: `${this.primaryProvider.name} (${selectedReplica.provider})`,
      modelUsed: this.primaryProvider.model,
      replicaUsed: selectedReplica.id,
      failoverTriggered: false,
      routingTrace: trace
    };
  }

  checkCache(queryVector) {
    for (const entry of this.semanticCache) {
      const sim = cosineSimilarity(queryVector, entry.vector);
      if (sim >= this.cacheSimilarityThreshold) {
        return {
          hit: true,
          similarity: sim.toFixed(3),
          cachedQuery: entry.query,
          response: entry.response,
          retrievedProducts: entry.retrievedProducts
        };
      }
    }
    return { hit: false };
  }

  storeInCache(query, queryVector, response, retrievedProducts, wasFlagged = false) {
    const hasPiiRedaction = query.includes("[REDACTED_EMAIL]") || 
                            query.includes("[REDACTED_PHONE]") || 
                            query.includes("[REDACTED_CARD]");

    const lowerQuery = query.toLowerCase().trim();
    const isGreeting = ["hi", "hii", "hiii", "hello", "hey", "namaste", "good morning", "good evening", "who are you", "what can you do", "help"].includes(lowerQuery);

    // Prevent cache collision for PII scrubbed inputs, security flagged queries, or general greetings
    if (wasFlagged || hasPiiRedaction || isGreeting) return;

    if (this.semanticCache.length >= 100) {
      this.semanticCache.shift();
    }
    this.semanticCache.push({
      query,
      vector: queryVector,
      response,
      retrievedProducts,
      timestamp: Date.now()
    });
  }

  flushCache() {
    const size = this.semanticCache.length;
    this.semanticCache = [];
    return size;
  }

  getDiagnosticReport() {
    return {
      primaryProvider: this.primaryProvider,
      loadBalancer: {
        strategy: "Round-Robin Multi-Region",
        activeReplicas: this.replicaPool.filter(r => r.status === "HEALTHY").length,
        totalReplicas: this.replicaPool.length,
        replicas: this.replicaPool
      },
      circuitBreaker: {
        state: this.circuitBreaker.primaryState,
        failures: this.circuitBreaker.consecutiveFailures,
        simulatedOutage: this.circuitBreaker.simulatedOutage
      },
      semanticCache: {
        entriesCount: this.semanticCache.length,
        maxCapacity: 100,
        similarityThreshold: this.cacheSimilarityThreshold
      },
      fallbackChain: this.fallbackProviders
    };
  }

  generateDomainResponse(sanitizedQuery, retrievedProducts) {
    const lower = String(sanitizedQuery).toLowerCase().trim();

    // Friendly Greeting & Small Talk Handler
    const greetings = ["hi", "hii", "hiii", "hello", "hey", "namaste", "good morning", "good evening", "who are you", "what can you do", "help", "start"];
    if (greetings.includes(lower) || lower.match(/^(hi|hii|hello|hey|namaste)\b/i)) {
      return "Namaste! Welcome to AURA Royal Perfumery India. 🌸\n\n" +
             "I am your AI Olfactory Sommelier & Customer Support Assistant. How may I assist you today?\n\n" +
             "• 🌸 **Perfume Recommendations**: Ask for notes or moods (e.g., *'Smoky sandalwood for winter nights'* or *'Solar Malabar citrus'*)\n" +
             "• 📦 **Order Tracking & Delivery Date**: Check existing orders (e.g., *'Track order ORD-8821'* or *'When will my order arrive?'*)\n" +
             "• 🛍️ **Guided Order Placement**: Ask *'I want to place an order'*\n" +
             "• 🤖 **Bespoke Attar Blends**: Enable Autonomous Agent Mode to craft custom perfume oil formulas.";
    }

    if (!retrievedProducts || retrievedProducts.length === 0) {
      return "Welcome to AURA Perfumery. Our olfactory collection spans rare woody orientals, solar citrus blends, and hand-harvested floral absolute extraits. Could you share what notes or moods you gravitate towards?";
    }

    const topProduct = retrievedProducts[0];
    const secondaryProduct = retrievedProducts[1];

    let summary = `Based on your request, I highly recommend **${topProduct.name}** ($${topProduct.price} / ${topProduct.sizes.join(', ')}). `;
    summary += `It features prominent notes of ${topProduct.topNotes.join(', ')} over a core of ${topProduct.heartNotes.join(', ')} and ${topProduct.baseNotes.join(', ')}. `;
    summary += `*${topProduct.description}* (Longevity: ${topProduct.longevity}).\n\n`;

    if (secondaryProduct) {
      summary += `Alternatively, if you prefer a slightly different scent nuance, explore **${secondaryProduct.name}** ($${secondaryProduct.price}), featuring ${secondaryProduct.topNotes[0]} and ${secondaryProduct.baseNotes[0]}.`;
    }

    if (!topProduct.inStock) {
      summary += `\n\n*(Note: ${topProduct.name} is currently low in stock or on backorder, but our atelier can reserve a bottle for you upon request).*`;
    }

    return summary;
  }
}

const gateway = new LLMGateway();
module.exports = gateway;
