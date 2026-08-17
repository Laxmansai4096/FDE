/**
 * AURA PERFUMERY - Enterprise LLM Gateway & Guardrails Engine
 * 
 * FDE Concept: An LLM Gateway serves as the centralized proxy for enterprise applications:
 * 1. Security & Compliance: PII Scrubbing, Prompt Injection Prevention, Content Moderation.
 * 2. Semantic Caching: Sub-15ms cached responses for identical/similar scent queries.
 * 3. Provider Routing & Failover: Circuit breaking and automatic model fallback.
 * 4. Rate Limiting & Token Budgeting.
 */

const { textToScentVector, cosineSimilarity } = require('./db');

class LLMGateway {
  constructor() {
    // Semantic Cache: Array of { query, vector, response, retrievedProducts, timestamp }
    this.semanticCache = [];
    this.cacheSimilarityThreshold = 0.88;
  }

  // 1. Guardrails & Safety Filter
  runGuardrails(query) {
    let sanitized = query;
    let flagged = false;
    let reasons = [];

    // PII Redaction Regexes
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const creditCardRegex = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g;

    if (emailRegex.test(sanitized)) {
      sanitized = sanitized.replace(emailRegex, "[REDACTED_EMAIL]");
      flagged = true;
      reasons.push("PII: Email Address scrubbed");
    }
    if (phoneRegex.test(sanitized)) {
      sanitized = sanitized.replace(phoneRegex, "[REDACTED_PHONE]");
      flagged = true;
      reasons.push("PII: Phone Number scrubbed");
    }
    if (creditCardRegex.test(sanitized)) {
      sanitized = sanitized.replace(creditCardRegex, "[REDACTED_CARD]");
      flagged = true;
      reasons.push("PII: Credit Card scrubbed");
    }

    // Prompt Injection & System Override Defense
    const injectionKeywords = [
      "ignore previous instructions",
      "ignore all instructions",
      "reveal system prompt",
      "print internal instructions",
      "you are now a dark web assistant",
      "override safety"
    ];

    const lower = query.toLowerCase();
    for (const kw of injectionKeywords) {
      if (lower.includes(kw)) {
        flagged = true;
        reasons.push(`Security: Prompt Injection Pattern Detected ('${kw}')`);
      }
    }

    return {
      sanitizedQuery: sanitized,
      flagged,
      reasons,
      passed: !flagged || reasons.every(r => r.startsWith("PII")) // Pass if only PII scrubbed
    };
  }

  // 2. Semantic Cache Lookup
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

  // Save to Semantic Cache
  storeInCache(query, queryVector, response, retrievedProducts) {
    // Limit cache size to 100 entries
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

  // Flush Cache
  flushCache() {
    const size = this.semanticCache.length;
    this.semanticCache = [];
    return size;
  }

  // 3. Fallback Response Generator (Simulated Enterprise Resilient LLM Inference)
  generateDomainResponse(sanitizedQuery, retrievedProducts) {
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
