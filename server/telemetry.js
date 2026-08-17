/**
 * AURA PERFUMERY - FDE Telemetry & Observability Engine
 * 
 * FDE Concept: Production enterprise AI platforms require robust observability:
 * 1. Trace tracking: Following a request from Gateway -> Guardrail -> Cache -> DB RAG -> LLM -> Client.
 * 2. Token & Cost Accounting: Calculating input/output tokens and cost in USD.
 * 3. Latency breakdown: Time spent in Guardrails, RAG vector retrieval, and LLM inference.
 * 4. Audit Log: Flagging PII scrubs, prompt injections, and low confidence fallbacks.
 */

class TelemetryEngine {
  constructor() {
    this.traces = [];
    this.totalRequests = 0;
    this.cacheHits = 0;
    this.totalTokens = 0;
    this.totalCostUSD = 0;
    this.guardrailBreaches = 0;
  }

  // Record a complete span trace for an incoming query
  recordTrace({
    query,
    sanitizedQuery,
    provider,
    model,
    cacheHit,
    latencyMs,
    promptTokens,
    completionTokens,
    retrievedProducts,
    guardrailStatus,
    response
  }) {
    const traceId = `trc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const cost = Number(((promptTokens * 0.0000005) + (completionTokens * 0.0000015)).toFixed(6));

    this.totalRequests += 1;
    if (cacheHit) this.cacheHits += 1;
    this.totalTokens += (promptTokens + completionTokens);
    this.totalCostUSD += cost;
    if (guardrailStatus.flagged) this.guardrailBreaches += 1;

    const traceRecord = {
      traceId,
      timestamp: new Date().toISOString(),
      query,
      sanitizedQuery,
      provider: provider || "Gemini-1.5-Flash",
      model: model || "gemini-1.5-flash",
      cacheHit: !!cacheHit,
      latencyMs,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens
      },
      costUSD: cost,
      guardrailStatus,
      retrievedCount: retrievedProducts ? retrievedProducts.length : 0,
      retrievedProducts: retrievedProducts ? retrievedProducts.map(p => ({ id: p.id, name: p.name, score: p.vectorScore })) : [],
      responseSnippet: response ? (response.length > 80 ? response.substring(0, 80) + "..." : response) : ""
    };

    // Store max 50 recent traces
    this.traces.unshift(traceRecord);
    if (this.traces.length > 50) {
      this.traces.pop();
    }

    return traceRecord;
  }

  // Get aggregated operational metrics for FDE Dashboard
  getMetrics() {
    const cacheHitRate = this.totalRequests > 0 ? ((this.cacheHits / this.totalRequests) * 100).toFixed(1) : 0;
    const avgLatency = this.traces.length > 0 
      ? Math.round(this.traces.reduce((acc, t) => acc + t.latencyMs, 0) / this.traces.length)
      : 0;

    return {
      totalRequests: this.totalRequests,
      cacheHits: this.cacheHits,
      cacheHitRate: `${cacheHitRate}%`,
      totalTokens: this.totalTokens,
      totalCostUSD: `$${this.totalCostUSD.toFixed(5)}`,
      guardrailBreaches: this.guardrailBreaches,
      avgLatencyMs: `${avgLatency}ms`,
      recentTraces: this.traces.slice(0, 15)
    };
  }

  clear() {
    this.traces = [];
    this.totalRequests = 0;
    this.cacheHits = 0;
    this.totalTokens = 0;
    this.totalCostUSD = 0;
    this.guardrailBreaches = 0;
  }
}

const telemetry = new TelemetryEngine();
module.exports = telemetry;
