/**
 * AURA PERFUMERY - OpenTelemetry Request Span & Cost Accounting Engine
 */

class TelemetryCollector {
  constructor() {
    this.traces = [];
    this.totalRequests = 0;
    this.cacheHits = 0;
    this.totalTokens = 0;
    this.totalCostUSD = 0.0;
  }

  recordTrace(traceData) {
    const traceId = 'trc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const timestamp = new Date().toISOString();

    const promptTokens = traceData.promptTokens || 0;
    const completionTokens = traceData.completionTokens || 0;
    const totalTokens = promptTokens + completionTokens;

    // Cost Model: $0.0000005 per token (Gemini 1.5 Flash / SLM avg rate)
    const costUSD = traceData.cacheHit ? 0.0 : Number((totalTokens * 0.0000005).toFixed(6));

    this.totalRequests++;
    if (traceData.cacheHit) this.cacheHits++;
    this.totalTokens += totalTokens;
    this.totalCostUSD += costUSD;

    const trace = {
      traceId,
      timestamp,
      query: traceData.query,
      sanitizedQuery: traceData.sanitizedQuery || traceData.query,
      provider: traceData.provider || "Gemini-1.5-Flash (Primary)",
      model: traceData.model || "gemini-1.5-flash",
      cacheHit: !!traceData.cacheHit,
      latencyMs: traceData.latencyMs || 0,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      },
      costUSD,
      guardrailStatus: traceData.guardrailStatus || { flagged: false, reasons: [] },
      routingTrace: traceData.routingTrace || [],
      retrievedCount: traceData.retrievedProducts ? traceData.retrievedProducts.length : 0,
      retrievedProducts: traceData.retrievedProducts || [],
      responseSnippet: traceData.response ? traceData.response.substring(0, 100) + '...' : ''
    };

    // Keep max 50 recent trace spans to avoid memory overflow
    if (this.traces.length >= 50) {
      this.traces.pop();
    }
    this.traces.unshift(trace);

    return trace;
  }

  getMetrics() {
    const cacheHitRate = this.totalRequests > 0 
      ? ((this.cacheHits / this.totalRequests) * 100).toFixed(1) 
      : "0.0";

    return {
      totalRequests: this.totalRequests,
      cacheHits: this.cacheHits,
      cacheHitRate: Number(cacheHitRate),
      totalTokens: this.totalTokens,
      totalCostUSD: Number(this.totalCostUSD.toFixed(5)),
      traces: this.traces
    };
  }
}

const telemetry = new TelemetryCollector();
module.exports = telemetry;
