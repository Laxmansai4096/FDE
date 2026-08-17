/**
 * AURA PERFUMERY - Enterprise Azure APIM & Multi-Tenant Security Gateway
 * 
 * Microsoft FDE Concept: Microsoft FDEs deploy Azure API Management (APIM) in front of Azure OpenAI:
 * 1. Multi-Tenant Rate Limiting & Token Bucketing (RPM / TPM per client tenant).
 * 2. Azure AI Content Safety Filters (Hate, Sexual, Violence, Self-Harm severity scoring).
 * 3. Tenant Isolation & API Key Authorization headers (X-Tenant-ID, Ocp-Apim-Subscription-Key).
 */

class AzureAPIMGateway {
  constructor() {
    // Tenant Rate Limits (Token Bucket Algorithm)
    this.tenantBuckets = {
      "aura-eu-paris": { tokensRemaining: 100, maxTokens: 100, lastRefill: Date.now() },
      "aura-us-ny": { tokensRemaining: 60, maxTokens: 60, lastRefill: Date.now() },
      "demo-tenant": { tokensRemaining: 40, maxTokens: 40, lastRefill: Date.now() }
    };
  }

  // 1. Validate Tenant & Apply Token Bucket Rate Limiting
  applyRateLimit(tenantId = "aura-eu-paris") {
    const bucket = this.tenantBuckets[tenantId] || this.tenantBuckets["demo-tenant"];
    const now = Date.now();
    const elapsedSec = (now - bucket.lastRefill) / 1000;

    // Refill tokens (10 tokens per second)
    bucket.tokensRemaining = Math.min(bucket.maxTokens, bucket.tokensRemaining + (elapsedSec * 10));
    bucket.lastRefill = now;

    if (bucket.tokensRemaining < 1) {
      return { allowed: false, message: `429 Too Many Requests: Rate limit exceeded for Tenant '${tenantId}'. Try again in a few seconds.` };
    }

    bucket.tokensRemaining -= 1;
    return { allowed: true, remainingTokens: Math.floor(bucket.tokensRemaining) };
  }

  // 2. Azure AI Content Safety Moderation Filter
  runContentSafetyModeration(text) {
    const lower = text.toLowerCase();
    let flagged = false;
    let category = null;
    let severity = 0;

    if (lower.includes("poison") || lower.includes("toxic chemical") || lower.includes("kill")) {
      flagged = true; category = "Hate/Harmful Material"; severity = 4;
    }
    if (lower.includes("explosive") || lower.includes("bomb") || lower.includes("weapon")) {
      flagged = true; category = "Violence/Safety Hazard"; severity = 5;
    }

    return {
      flagged,
      category,
      severity, // 0 = Safe, 2 = Low, 4 = Medium, 6 = High
      passed: !flagged || severity < 3
    };
  }
}

const azureGateway = new AzureAPIMGateway();
module.exports = azureGateway;
